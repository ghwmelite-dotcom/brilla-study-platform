/**
 * School Subscription Seat Packages — Phase 1 (admin-operated).
 * Spec: docs/plans/2026-09-08-school-subscriptions.md
 *
 * Schools buy student seat packages (subscription_tiers rows with
 * user_type='school', migration 372). Settlement writes the SCHOOL row
 * (seat_tier_id / seat_expires_at / seat_cap / seat_code) — never the payer's
 * users row. Students onboard by redeeming the school's single seat code;
 * redemption snapshots their prior individual entitlement onto school_seats
 * and only EXTENDS their coverage (decision 6). Lapse/revoke restores the
 * snapshot, keeping the better of snapshot vs current (spec open question 2,
 * resolved by comparing expiry timestamps).
 *
 * Everything lives in this module so the shared tree stays untouched:
 *   - schoolSeatsApp       → mount: app.route('/api/schools', schoolSeatsApp)
 *   - adminSchoolSeatsApp  → mount: adminApp.route('/schools', adminSchoolSeatsApp)
 *     (carries its own requireAdmin — Hono sub-apps do not inherit parent
 *     use() middleware, so authz must not depend on the mount point)
 *   - expireLapsedSchoolSeats(db) → call from the scheduled handler
 *   - releaseSchoolSeat(db, ...)  → hook into member-leaves-school paths
 *   - settleSchoolSeatPayment(db, tx) → hook into payment-settlement.ts when
 *     the settled tier has user_type='school' (see integration note in the
 *     function doc below)
 */

import { Hono } from 'hono';
import { requireAuth, requireAdmin } from './auth-middleware';
import { parseJsonBody } from './http';
import { notifySchoolChannel, type TelegramEnv } from './telegram';
import { createNotification } from './notifications';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

// Package seat counts keyed by tier id (migration 372). tier_school_custom
// has no fixed count — admin purchase passes seats explicitly.
export const SCHOOL_TIER_SEATS: Record<string, number> = {
  tier_school_25: 25,
  tier_school_50: 50,
  tier_school_100: 100,
  tier_school_250: 250,
};

const SEAT_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // no 0/O/1/I

/** Mint a seat code like SCH-7K2PX9. One code per school, N uses (decision 4). */
export function generateSeatCode(): string {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  let body = '';
  for (const b of bytes) body += SEAT_CODE_ALPHABET[b % SEAT_CODE_ALPHABET.length];
  return `SCH-${body}`;
}

const SEAT_CODE_FORMAT = /^[A-Z0-9-]{4,32}$/;

export interface SchoolSeatStateRow {
  id: string;
  name: string;
  status: string;
  seat_tier_id: string | null;
  seat_expires_at: string | null;
  seat_code: string | null;
  seat_code_uses: number;
  seat_cap: number;
}

interface UserEntitlementRow {
  id: string;
  role: string;
  school_id: string | null;
  subscription_tier_id: string | null;
  subscription_expires_at: string | null;
  trial_expires_at?: string | null;
}

export interface SchoolPaymentRow {
  id: string;
  reference: string;
  user_id: string;
  amount: number;
  currency: string;
  plan_id: string;
  billing_cycle: 'monthly' | 'yearly';
  status: string;
  settlement_applied_at: string | null;
  metadata: string | null;
}

export type SchoolSettlementOutcome = 'applied' | 'already_applied' | 'not_found';

export interface SchoolSettlementResult {
  outcome: SchoolSettlementOutcome;
  schoolId?: string;
  seatCap?: number;
  seatExpiresAt?: string;
  seatCode?: string | null;
}

function addBillingCycle(fromIso: string, cycle: 'monthly' | 'yearly'): string {
  const d = new Date(fromIso);
  if (cycle === 'yearly') d.setFullYear(d.getFullYear() + 1);
  else d.setMonth(d.getMonth() + 1);
  return d.toISOString();
}

function ts(iso: string | null | undefined): number {
  if (!iso) return 0;
  const t = Date.parse(iso);
  return Number.isFinite(t) ? t : 0;
}

/**
 * Settle a payment whose tier row has user_type='school' onto the SCHOOL.
 * Never touches the payer's users row (spec: settlement hook). The payment's
 * metadata must carry school_id; seat count comes from metadata.seats or the
 * package size for the tier. Top-up semantics: cap grows by the package size
 * and expiry extends from max(now, current seat_expires_at) by the billing
 * cycle; existing seat-holders are untouched. Idempotent via the same
 * settlement_applied_at guard as settleVerifiedSubscriptionPayment — replaying
 * the same reference changes nothing.
 *
 * Integration (parent wires this): in payment-settlement.ts, add
 * st.user_type to the payment lookup SELECT and, after the not-found/refunded/
 * mismatch/already-applied checks, branch: if user_type === 'school' return
 * settleSchoolSeatPayment(db, row, source) instead of the users-row batch.
 */
export async function settleSchoolSeatPayment(
  db: D1Database,
  tx: SchoolPaymentRow,
  source: 'callback' | 'webhook' | 'reconciliation' | 'admin_manual' = 'admin_manual',
): Promise<SchoolSettlementResult> {
  if (tx.settlement_applied_at || tx.status === 'success') {
    return { outcome: 'already_applied' };
  }

  let metadata: Record<string, unknown> = {};
  try {
    metadata = tx.metadata ? JSON.parse(tx.metadata) : {};
  } catch {
    metadata = {};
  }
  const schoolId = typeof metadata.school_id === 'string' ? metadata.school_id : null;
  const seats = Number.isInteger(metadata.seats) && (metadata.seats as number) > 0
    ? (metadata.seats as number)
    : SCHOOL_TIER_SEATS[tx.plan_id] ?? null;
  if (!schoolId || !seats) return { outcome: 'not_found' };

  // Phase 2: renewal checkouts may have consumed schools.seat_credit as a
  // discount (metadata.credit_applied, set by POST /api/school-admin/billing/renew).
  // The credit is burned atomically with settlement under the same guard, so a
  // replayed webhook never double-consumes it.
  const creditApplied = Number.isInteger(metadata.credit_applied) && (metadata.credit_applied as number) > 0
    ? (metadata.credit_applied as number)
    : 0;

  const school = await db.prepare(`
    SELECT id, seat_expires_at, seat_cap, seat_code FROM schools WHERE id = ?
  `).bind(schoolId).first<{
    id: string;
    seat_expires_at: string | null;
    seat_cap: number;
    seat_code: string | null;
  }>();
  if (!school) return { outcome: 'not_found' };

  const nowIso = new Date().toISOString();
  const base = school.seat_expires_at && school.seat_expires_at > nowIso
    ? school.seat_expires_at
    : nowIso;
  const newExpiry = addBillingCycle(base, tx.billing_cycle);
  const newCap = (school.seat_cap ?? 0) + seats;
  // Mint a code on first purchase; later purchases keep the existing code
  // (explicit rotation is POST /seat-code/regenerate).
  const mintedCode = school.seat_code ?? generateSeatCode();

  const guard = `
    EXISTS (
      SELECT 1 FROM payment_transactions guard_tx
      WHERE guard_tx.reference = ?
        AND guard_tx.settlement_applied_at IS NULL
        AND guard_tx.status NOT IN ('success', 'refunded')
    )
  `;

  const settlementStatements: D1PreparedStatement[] = [
    db.prepare(`
      UPDATE schools
      SET seat_tier_id = ?,
          seat_expires_at = ?,
          seat_cap = ?,
          seat_code = COALESCE(seat_code, ?)
      WHERE id = ? AND ${guard}
    `).bind(tx.plan_id, newExpiry, newCap, mintedCode, schoolId, tx.reference),
    db.prepare(`
      UPDATE payment_transactions
      SET status = 'success',
          verified_at = COALESCE(verified_at, datetime('now')),
          settlement_applied_at = datetime('now'),
          settlement_source = ?
      WHERE reference = ?
        AND settlement_applied_at IS NULL
        AND status NOT IN ('success', 'refunded')
    `).bind(source, tx.reference),
  ];
  if (creditApplied > 0) {
    settlementStatements.push(db.prepare(`
      UPDATE schools
      SET seat_credit = MAX(seat_credit - ?, 0)
      WHERE id = ? AND ${guard}
    `).bind(creditApplied, schoolId, tx.reference));
  }

  const results = await db.batch(settlementStatements);

  const settlementWrite = results[1] as D1Result;
  if (!settlementWrite.meta?.changes) {
    return { outcome: 'already_applied' };
  }

  return {
    outcome: 'applied',
    schoolId,
    seatCap: newCap,
    seatExpiresAt: newExpiry,
    seatCode: mintedCode,
  };
}

export type RedeemResult =
  | { ok: true; alreadySeated: boolean; extended: boolean; schoolId: string; schoolName: string; seatExpiresAt: string | null }
  | { ok: false; status: number; error: string };

/**
 * Student redeems a school's seat code. Cap is claimed atomically first
 * (guarded increment on seat_code_uses), then the seat row + user update land
 * in one batch; a failed batch (e.g. concurrent re-redeem hitting the partial
 * unique index) releases the claim so seat_code_uses never drifts upward on
 * failure. Only EXTENDS coverage: users row tier/expiry are written only when
 * the school expiry beats the user's current effective premium expiry
 * (max of subscription and trial expiry); prior values are always snapshotted
 * onto school_seats for exact restore on lapse.
 */
export async function redeemSeatCode(
  db: D1Database,
  userId: string,
  rawCode: unknown,
): Promise<RedeemResult> {
  const code = typeof rawCode === 'string' ? rawCode.trim().toUpperCase() : '';
  if (!SEAT_CODE_FORMAT.test(code)) {
    return { ok: false, status: 400, error: 'Invalid seat code format' };
  }

  const user = await db.prepare(`
    SELECT id, role, school_id, subscription_tier_id, subscription_expires_at, trial_expires_at
    FROM users WHERE id = ?
  `).bind(userId).first<UserEntitlementRow>();
  if (!user) return { ok: false, status: 404, error: 'User not found' };
  if (user.role !== 'student') {
    return { ok: false, status: 403, error: 'Only students can redeem a school seat code' };
  }

  const school = await db.prepare(`
    SELECT id, name, status, seat_tier_id, seat_expires_at, seat_code, seat_code_uses, seat_cap
    FROM schools WHERE seat_code = ?
  `).bind(code).first<SchoolSeatStateRow>();
  if (!school || !school.seat_tier_id) {
    return { ok: false, status: 404, error: 'Unknown seat code' };
  }
  const nowIso = new Date().toISOString();
  if (school.status !== 'active') {
    return { ok: false, status: 400, error: 'This school is not active' };
  }
  if (!school.seat_expires_at || school.seat_expires_at <= nowIso) {
    return { ok: false, status: 410, error: "This school's seat package has expired" };
  }

  // Re-redeem by an already-seated student is a no-op success (spec edge case).
  const existingSeat = await db.prepare(`
    SELECT id FROM school_seats WHERE school_id = ? AND user_id = ? AND status = 'active'
  `).bind(school.id, userId).first<{ id: string }>();
  if (existingSeat) {
    return {
      ok: true,
      alreadySeated: true,
      extended: false,
      schoolId: school.id,
      schoolName: school.name,
      seatExpiresAt: school.seat_expires_at,
    };
  }

  // No silent school-hop: a student linked to another school must be released first.
  if (user.school_id && user.school_id !== school.id) {
    return { ok: false, status: 409, error: 'You are already linked to another school. Ask an admin to release you first.' };
  }

  // Pre-checks for a clear 409; the guarded increment below is the race backstop.
  if (school.seat_code_uses >= school.seat_cap || school.seat_cap <= 0) {
    return { ok: false, status: 409, error: "This school's seat package is full" };
  }
  const activeCount = await db.prepare(`
    SELECT COUNT(*) AS n FROM school_seats WHERE school_id = ? AND status = 'active'
  `).bind(school.id).first<{ n: number }>();
  if ((activeCount?.n ?? 0) >= school.seat_cap) {
    return { ok: false, status: 409, error: "This school's seat package is full" };
  }

  // Atomic cap claim: fails (changes=0) under a redeem race for the last seat.
  const claim = await db.prepare(`
    UPDATE schools SET seat_code_uses = seat_code_uses + 1
    WHERE id = ? AND status = 'active' AND seat_code_uses < seat_cap AND seat_expires_at > ?
  `).bind(school.id, nowIso).run();
  if (!claim.meta?.changes) {
    return { ok: false, status: 409, error: "This school's seat package is full" };
  }

  const priorTierId = user.subscription_tier_id ?? 'tier_free';
  const priorExpiresAt = user.subscription_expires_at ?? null;
  const effectiveExpiry = Math.max(ts(user.subscription_expires_at), ts(user.trial_expires_at));
  const extended = ts(school.seat_expires_at) > effectiveExpiry;

  const statements: D1PreparedStatement[] = [
    db.prepare(`
      INSERT INTO school_seats
        (id, school_id, user_id, granted_at, source_payment_ref, status, prior_tier_id, prior_expires_at)
      VALUES (?, ?, ?, datetime('now'), NULL, 'active', ?, ?)
    `).bind(`seat_${crypto.randomUUID()}`, school.id, userId, priorTierId, priorExpiresAt),
    extended
      ? db.prepare(`
          UPDATE users
          SET school_id = ?, subscription_tier_id = ?, subscription_expires_at = ?
          WHERE id = ?
        `).bind(school.id, school.seat_tier_id, school.seat_expires_at, userId)
      : db.prepare('UPDATE users SET school_id = ? WHERE id = ?').bind(school.id, userId),
  ];

  try {
    await db.batch(statements);
  } catch (error) {
    // Roll the cap claim back — most likely a concurrent re-redeem hitting the
    // one-active-seat unique index.
    await db.prepare(`
      UPDATE schools SET seat_code_uses = MAX(seat_code_uses - 1, 0) WHERE id = ?
    `).bind(school.id).run();
    if (String(error).includes('UNIQUE')) {
      return {
        ok: true,
        alreadySeated: true,
        extended: false,
        schoolId: school.id,
        schoolName: school.name,
        seatExpiresAt: school.seat_expires_at,
      };
    }
    throw error;
  }

  return {
    ok: true,
    alreadySeated: false,
    extended,
    schoolId: school.id,
    schoolName: school.name,
    seatExpiresAt: school.seat_expires_at,
  };
}

/**
 * Resolve the "keep the better of snapshot vs current" downgrade (spec open
 * question 2) by comparing expiry timestamps. A user whose coverage IS the
 * seat (tier + expiry exactly match the school's) is restored to the snapshot.
 * A user who upgraded individually after joining (different, later expiry)
 * keeps their current entitlement. Otherwise the snapshot wins.
 */
export function resolveRestoredEntitlement(
  seat: { prior_tier_id: string | null; prior_expires_at: string | null },
  user: { subscription_tier_id: string | null; subscription_expires_at: string | null },
  school: { seat_tier_id: string | null; seat_expires_at: string | null },
): { write: boolean; tierId: string | null; expiresAt: string | null } {
  const coveredBySeat =
    school.seat_tier_id !== null &&
    user.subscription_tier_id === school.seat_tier_id &&
    user.subscription_expires_at === school.seat_expires_at;

  if (!coveredBySeat && ts(user.subscription_expires_at) > ts(seat.prior_expires_at)) {
    // Individually-upgraded coverage beats the stale snapshot — keep it.
    return { write: false, tierId: null, expiresAt: null };
  }
  return {
    write: true,
    tierId: seat.prior_tier_id ?? 'tier_free',
    expiresAt: seat.prior_expires_at,
  };
}

/**
 * Release one active seat (admin revoke or member-leaves-school): restore the
 * snapshot per resolveRestoredEntitlement, mark the row, and clear school
 * membership. 'revoked' frees the seat (seat_code_uses decrements); 'expired'
 * is used by the lapse cron, which keeps membership and the usage counter so
 * renewals reconcile. Idempotent: no active seat → false, nothing written.
 */
export async function releaseSchoolSeat(
  db: D1Database,
  schoolId: string,
  userId: string,
  newStatus: 'revoked' | 'expired',
): Promise<boolean> {
  const seat = await db.prepare(`
    SELECT id, prior_tier_id, prior_expires_at FROM school_seats
    WHERE school_id = ? AND user_id = ? AND status = 'active'
  `).bind(schoolId, userId).first<{
    id: string;
    prior_tier_id: string | null;
    prior_expires_at: string | null;
  }>();
  if (!seat) return false;

  const user = await db.prepare(`
    SELECT subscription_tier_id, subscription_expires_at FROM users WHERE id = ?
  `).bind(userId).first<{
    subscription_tier_id: string | null;
    subscription_expires_at: string | null;
  }>();
  const school = await db.prepare(`
    SELECT seat_tier_id, seat_expires_at FROM schools WHERE id = ?
  `).bind(schoolId).first<{ seat_tier_id: string | null; seat_expires_at: string | null }>();

  const restore = resolveRestoredEntitlement(
    seat,
    user ?? { subscription_tier_id: null, subscription_expires_at: null },
    school ?? { seat_tier_id: null, seat_expires_at: null },
  );

  const statements: D1PreparedStatement[] = [
    db.prepare(`
      UPDATE school_seats SET status = ? WHERE id = ? AND status = 'active'
    `).bind(newStatus, seat.id),
    restore.write
      ? db.prepare(`
          UPDATE users SET subscription_tier_id = ?, subscription_expires_at = ?, school_id = NULL
          WHERE id = ?
        `).bind(restore.tierId, restore.expiresAt, userId)
      : db.prepare('UPDATE users SET school_id = NULL WHERE id = ?').bind(userId),
  ];
  if (newStatus === 'revoked') {
    statements.push(db.prepare(`
      UPDATE schools SET seat_code_uses = MAX(seat_code_uses - 1, 0) WHERE id = ?
    `).bind(schoolId));
  }
  await db.batch(statements);
  return true;
}

export interface LapseResult {
  schoolsProcessed: number;
  seatsExpired: number;
  mismatches: Array<{ schoolId: string; codeUses: number; activeCount: number }>;
}

/**
 * Nightly lapse job (decision 7; mirrors the trial-expiry batch pattern).
 * For each school whose seat_expires_at has passed: every active seat-holder
 * is restored to their snapshotted prior entitlement (better-of comparison
 * included) and the seat row flips to 'expired'. Idempotent — only rows still
 * status='active' are touched, so a second run is a no-op. Bounded to 10
 * schools per invocation to stay under D1's batch statement cap; backlog
 * drains on subsequent runs. Logs seat_code_uses vs active-count drift
 * (spec risk 1).
 */
export async function expireLapsedSchoolSeats(
  db: D1Database,
  nowIso: string = new Date().toISOString(),
): Promise<LapseResult> {
  const { results: lapsedSchools } = await db.prepare(`
    SELECT id, seat_tier_id, seat_expires_at, seat_code_uses
    FROM schools
    WHERE seat_expires_at IS NOT NULL AND seat_expires_at < ?
    ORDER BY seat_expires_at
    LIMIT 10
  `).bind(nowIso).all<{
    id: string;
    seat_tier_id: string | null;
    seat_expires_at: string | null;
    seat_code_uses: number;
  }>();

  const result: LapseResult = { schoolsProcessed: 0, seatsExpired: 0, mismatches: [] };

  for (const school of lapsedSchools) {
    const { results: seats } = await db.prepare(`
      SELECT ss.id, ss.user_id, ss.prior_tier_id, ss.prior_expires_at,
             u.subscription_tier_id, u.subscription_expires_at
      FROM school_seats ss
      JOIN users u ON u.id = ss.user_id
      WHERE ss.school_id = ? AND ss.status = 'active'
    `).bind(school.id).all<{
      id: string;
      user_id: string;
      prior_tier_id: string | null;
      prior_expires_at: string | null;
      subscription_tier_id: string | null;
      subscription_expires_at: string | null;
    }>();

    const statements: D1PreparedStatement[] = [];
    for (const seat of seats) {
      const restore = resolveRestoredEntitlement(
        seat,
        { subscription_tier_id: seat.subscription_tier_id, subscription_expires_at: seat.subscription_expires_at },
        school,
      );
      statements.push(db.prepare(`
        UPDATE school_seats SET status = 'expired' WHERE id = ? AND status = 'active'
      `).bind(seat.id));
      if (restore.write) {
        // Lapse keeps school membership (school_id) — only the entitlement is
        // restored. Membership ends via revoke/leave, not expiry.
        statements.push(db.prepare(`
          UPDATE users SET subscription_tier_id = ?, subscription_expires_at = ?
          WHERE id = ?
        `).bind(restore.tierId, restore.expiresAt, seat.user_id));
      }
    }
    if (statements.length > 0) {
      await db.batch(statements);
    }

    if (seats.length !== school.seat_code_uses) {
      // Drift between the redemption counter and actual active seats (spec
      // risk 1): log loudly; the admin seat list shows both numbers.
      console.warn(
        `School seat mismatch for ${school.id}: seat_code_uses=${school.seat_code_uses} activeSeats=${seats.length}`,
      );
      result.mismatches.push({
        schoolId: school.id,
        codeUses: school.seat_code_uses,
        activeCount: seats.length,
      });
    }

    result.schoolsProcessed += 1;
    result.seatsExpired += seats.length;
  }

  return result;
}

export interface RenewalReminderResult {
  schoolsReminded: number;
  channelPosts: number;
  emailsSent: number;
  notificationsWritten: number;
}

const RENEWAL_WINDOW_DAYS = 7;
const RENEWAL_LAPSED_GRACE_DAYS = 1;
const DAY_MS = 24 * 60 * 60 * 1000;

/**
 * Renewal reminder fan-out (phase 2), called from the every-6-hours scheduled
 * handler. A school is reminded when its seat package expires within the next
 * 7 days or lapsed at most 1 day ago, and it has not already been reminded
 * for this expiry (renewal_reminded_at guard — renewal pushes seat_expires_at
 * forward, which re-arms the guard, and a re-run inside the same window is a
 * no-op). Fan-out per school: Telegram school channel (if configured), one
 * in-app notification per school_admin, and one email per school_admin when a
 * sender is injected (the cron wires sendEmail when RESEND_API_KEY exists).
 * Bounded to 25 schools per invocation; backlog drains on subsequent runs.
 */
export async function sendSchoolRenewalReminders(
  db: D1Database,
  env: TelegramEnv,
  deps: { sendEmail?: (to: string, subject: string, html: string) => Promise<boolean> } = {},
  nowIso: string = new Date().toISOString(),
): Promise<RenewalReminderResult> {
  const now = Date.parse(nowIso);
  const windowEnd = new Date(now + RENEWAL_WINDOW_DAYS * DAY_MS).toISOString();
  const windowStart = new Date(now - RENEWAL_LAPSED_GRACE_DAYS * DAY_MS).toISOString();

  const { results: schools } = await db.prepare(`
    SELECT id, name, seat_expires_at, renewal_reminded_at
    FROM schools
    WHERE status = 'active'
      AND seat_expires_at IS NOT NULL
      AND seat_expires_at <= ?
      AND seat_expires_at >= ?
    ORDER BY seat_expires_at
    LIMIT 25
  `).bind(windowEnd, windowStart).all<{
    id: string;
    name: string;
    seat_expires_at: string;
    renewal_reminded_at: string | null;
  }>();

  const result: RenewalReminderResult = {
    schoolsReminded: 0,
    channelPosts: 0,
    emailsSent: 0,
    notificationsWritten: 0,
  };

  for (const school of schools) {
    const expiryTs = Date.parse(school.seat_expires_at);
    if (!Number.isFinite(expiryTs)) continue;
    // Idempotency guard: skip when already reminded for this expiry window.
    const rearmThreshold = new Date(expiryTs - RENEWAL_WINDOW_DAYS * DAY_MS).toISOString();
    if (school.renewal_reminded_at && school.renewal_reminded_at >= rearmThreshold) continue;

    const daysRemaining = Math.max(0, Math.ceil((expiryTs - now) / DAY_MS));
    const expiryDate = school.seat_expires_at.slice(0, 10);
    const timing = daysRemaining > 0
      ? `expires in ${daysRemaining} day${daysRemaining === 1 ? '' : 's'}`
      : 'has just expired';
    const text = `⏳ ${school.name}: your Brilla seat package ${timing} (${expiryDate}). Renew from the school dashboard or contact Brilla to keep student premium seats active.`;

    const posted = await notifySchoolChannel(db, env, school.id, text);
    if (posted) result.channelPosts += 1;

    const { results: admins } = await db.prepare(`
      SELECT id, name, email FROM users
      WHERE role = 'school_admin' AND school_id = ? AND is_active = 1
    `).bind(school.id).all<{ id: string; name: string; email: string }>();

    for (const admin of admins) {
      await createNotification(
        db,
        admin.id,
        'school_renewal',
        'Seat package renewal due',
        `Your school's Brilla seat package ${timing} (${expiryDate}). Renew to keep student seats active.`,
        { icon: 'alert-triangle', link: '/school-admin' },
      );
      result.notificationsWritten += 1;

      if (deps.sendEmail && admin.email) {
        const sent = await deps.sendEmail(
          admin.email,
          `${school.name}: Brilla seat package renewal due`,
          `<p>Hi ${admin.name.replace(/[<>&]/g, '')},</p><p>Your school's Brilla seat package <strong>${timing}</strong> (${expiryDate}). Renew from the school dashboard or reply to this email to keep student premium seats active.</p>`,
        );
        if (sent) result.emailsSent += 1;
      }
    }

    await db.prepare(`
      UPDATE schools SET renewal_reminded_at = ? WHERE id = ?
    `).bind(nowIso, school.id).run();
    result.schoolsReminded += 1;
  }

  return result;
}

// ============================================================================
// Student-facing routes — mount: app.route('/api/schools', schoolSeatsApp)
// ============================================================================

export const schoolSeatsApp = new Hono<{ Bindings: Env }>();

schoolSeatsApp.post('/redeem-code', requireAuth, async (c) => {
  try {
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const userId = c.get('userId') as string;
    const result = await redeemSeatCode(c.env.DB, userId, body.code);
    if (!result.ok) {
      return c.json({ success: false, error: result.error }, result.status as 400);
    }
    return c.json({
      success: true,
      data: {
        schoolId: result.schoolId,
        schoolName: result.schoolName,
        seatExpiresAt: result.seatExpiresAt,
        alreadySeated: result.alreadySeated,
        extended: result.extended,
      },
    });
  } catch (error) {
    console.error('Redeem school seat code error:', error);
    return c.json({ success: false, error: 'Failed to redeem seat code' }, 500);
  }
});

// ============================================================================
// Student analytics consent (phase 2). SHS-only, mirroring the parent-link
// opt-out precedent (protectedApp DELETE /students/parent-link/:parentId).
// The flag lives on the student's ACTIVE school_seats row; school-side
// analytics (GET /api/school-admin/students/:studentId/progress) 403s on it.
// ============================================================================

// The caller's ACTIVE seat state (or null) — lets the student UI render the
// school card and the analytics-consent toggle without guessing.
schoolSeatsApp.get('/seat', requireAuth, async (c) => {
  try {
    const seat = await c.env.DB.prepare(`
      SELECT ss.school_id, ss.granted_at, ss.analytics_opted_out, ss.analytics_opted_out_at,
             s.name AS school_name, s.seat_expires_at
      FROM school_seats ss
      JOIN schools s ON s.id = ss.school_id
      WHERE ss.user_id = ? AND ss.status = 'active'
    `).bind(c.get('userId') as string).first<{
      school_id: string;
      granted_at: string;
      analytics_opted_out: number;
      analytics_opted_out_at: string | null;
      school_name: string;
      seat_expires_at: string | null;
    }>();

    if (!seat) {
      return c.json({ success: true, data: null });
    }
    return c.json({
      success: true,
      data: {
        schoolId: seat.school_id,
        schoolName: seat.school_name,
        grantedAt: seat.granted_at,
        analyticsOptedOut: seat.analytics_opted_out === 1,
        analyticsOptedOutAt: seat.analytics_opted_out_at,
        seatExpiresAt: seat.seat_expires_at,
      },
    });
  } catch (error) {
    console.error('Get my school seat error:', error);
    return c.json({ success: false, error: 'Failed to load seat state' }, 500);
  }
});

type ConsentResult = { ok: true } | { ok: false; status: number; error: string };

async function setSeatAnalyticsConsent(
  db: D1Database,
  userId: string,
  optedOut: boolean,
): Promise<ConsentResult> {
  const user = await db.prepare(`
    SELECT role, school_level FROM users WHERE id = ?
  `).bind(userId).first<{ role: string; school_level: string | null }>();
  if (!user) return { ok: false, status: 404, error: 'User not found' };
  if (user.role !== 'student') {
    return { ok: false, status: 403, error: 'Only students can manage school analytics consent' };
  }
  if (user.school_level !== 'shs') {
    return { ok: false, status: 403, error: 'Only SHS students can change school analytics consent' };
  }

  const seat = await db.prepare(`
    SELECT id FROM school_seats WHERE user_id = ? AND status = 'active'
  `).bind(userId).first<{ id: string }>();
  if (!seat) {
    return { ok: false, status: 404, error: 'You do not hold an active school seat' };
  }

  await db.prepare(`
    UPDATE school_seats
    SET analytics_opted_out = ?, analytics_opted_out_at = ${optedOut ? "datetime('now')" : 'NULL'}
    WHERE id = ? AND status = 'active'
  `).bind(optedOut ? 1 : 0, seat.id).run();

  return { ok: true };
}

schoolSeatsApp.post('/seat/analytics-opt-out', requireAuth, async (c) => {
  try {
    const result = await setSeatAnalyticsConsent(c.env.DB, c.get('userId') as string, true);
    if (!result.ok) {
      return c.json({ success: false, error: result.error }, result.status as 400);
    }
    return c.json({ success: true, data: { analyticsOptedOut: true } });
  } catch (error) {
    console.error('School analytics opt-out error:', error);
    return c.json({ success: false, error: 'Failed to update analytics consent' }, 500);
  }
});

schoolSeatsApp.post('/seat/analytics-opt-in', requireAuth, async (c) => {
  try {
    const result = await setSeatAnalyticsConsent(c.env.DB, c.get('userId') as string, false);
    if (!result.ok) {
      return c.json({ success: false, error: result.error }, result.status as 400);
    }
    return c.json({ success: true, data: { analyticsOptedOut: false } });
  } catch (error) {
    console.error('School analytics opt-in error:', error);
    return c.json({ success: false, error: 'Failed to update analytics consent' }, 500);
  }
});

// ============================================================================
// Admin routes — mount: adminApp.route('/schools', adminSchoolSeatsApp)
// requireAdmin is applied HERE (not inherited from the parent app).
// ============================================================================

export const adminSchoolSeatsApp = new Hono<{
  Bindings: Env;
  Variables: { userId: string; userRole: string };
}>();
adminSchoolSeatsApp.use('*', requireAdmin);

// Record an offline/manual seat-package purchase: builds the
// payment_transactions row and funnels through settleSchoolSeatPayment, so
// manual and online settlement converge on one path (spec: admin routes).
adminSchoolSeatsApp.post('/:id/seats/purchase', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const tierId = typeof body.tierId === 'string' ? body.tierId.trim() : '';
    const billingCycle = body.billingCycle === 'yearly' ? 'yearly' : body.billingCycle === 'monthly' ? 'monthly' : null;
    if (!tierId || !billingCycle) {
      return c.json({ success: false, error: 'tierId and billingCycle (monthly|yearly) are required' }, 400);
    }

    const school = await c.env.DB.prepare(
      'SELECT id, seat_expires_at, seat_cap, seat_code FROM schools WHERE id = ?'
    ).bind(schoolId).first<{
      id: string;
      seat_expires_at: string | null;
      seat_cap: number;
      seat_code: string | null;
    }>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const tier = await c.env.DB.prepare(`
      SELECT id, price_monthly, price_yearly, is_active FROM subscription_tiers
      WHERE id = ? AND user_type = 'school'
    `).bind(tierId).first<{
      id: string;
      price_monthly: number;
      price_yearly: number;
      is_active: number;
    }>();
    if (!tier) {
      return c.json({ success: false, error: 'Unknown school tier' }, 400);
    }

    const seats = Number.isInteger(body.seats) && (body.seats as number) > 0
      ? (body.seats as number)
      : SCHOOL_TIER_SEATS[tierId] ?? null;
    if (!seats || seats > 10000) {
      return c.json({ success: false, error: 'seats must be a positive integer (required for custom tiers)' }, 400);
    }

    // Amount defaults to the tier's package price; tier_school_custom is
    // priced at 0 so an explicit amount is mandatory there.
    const listPrice = billingCycle === 'yearly' ? tier.price_yearly : tier.price_monthly;
    const amount = typeof body.amountGhs === 'number' && Number.isFinite(body.amountGhs) && body.amountGhs >= 0
      ? body.amountGhs
      : listPrice;
    if (!amount || amount <= 0) {
      return c.json({ success: false, error: 'amountGhs is required for custom-priced tiers' }, 400);
    }

    const adminUserId = c.get('userId') as string;
    const reference = typeof body.reference === 'string' && body.reference.trim()
      ? body.reference.trim().toUpperCase()
      : `MANUAL_${Date.now().toString(36).toUpperCase()}_${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    // Idempotent recording: replaying the same reference returns the current
    // state instead of double-granting seats.
    const existingTx = await c.env.DB.prepare(`
      SELECT id, reference, user_id, amount, currency, plan_id, billing_cycle, status, settlement_applied_at, metadata
      FROM payment_transactions WHERE reference = ?
    `).bind(reference).first<SchoolPaymentRow>();
    if (existingTx) {
      if (existingTx.settlement_applied_at || existingTx.status === 'success') {
        return c.json({
          success: true,
          data: { schoolId, reference, alreadyApplied: true },
        });
      }
      return c.json({ success: false, error: 'Reference already exists with a pending/failed payment' }, 409);
    }

    const metadata = JSON.stringify({
      school_id: schoolId,
      seats,
      manual: true,
      recorded_by: adminUserId,
      ...(typeof body.note === 'string' && body.note.trim() ? { note: body.note.trim().slice(0, 500) } : {}),
    });

    const txId = `pay_${crypto.randomUUID()}`;
    await c.env.DB.prepare(`
      INSERT INTO payment_transactions (
        id, user_id, reference, amount, currency, plan_id, plan_type, billing_cycle, status, metadata
      ) VALUES (?, ?, ?, ?, 'GHS', ?, 'school', ?, 'pending', ?)
    `).bind(txId, adminUserId, reference, amount, tierId, billingCycle, metadata).run();

    const settlement = await settleSchoolSeatPayment(c.env.DB, {
      id: txId,
      reference,
      user_id: adminUserId,
      amount,
      currency: 'GHS',
      plan_id: tierId,
      billing_cycle: billingCycle,
      status: 'pending',
      settlement_applied_at: null,
      metadata,
    });

    if (settlement.outcome !== 'applied') {
      return c.json({ success: false, error: `Settlement failed: ${settlement.outcome}` }, 500);
    }

    return c.json({
      success: true,
      data: {
        schoolId,
        reference,
        seats,
        seatCap: settlement.seatCap,
        seatExpiresAt: settlement.seatExpiresAt,
        seatCode: settlement.seatCode,
      },
    });
  } catch (error) {
    console.error('Admin record school purchase error:', error);
    return c.json({ success: false, error: 'Failed to record school purchase' }, 500);
  }
});

// Rotate the seat code. Granted seats are unaffected; only outstanding
// (not-yet-redeemed) copies of the old code die (spec: admin routes).
adminSchoolSeatsApp.post('/:id/seat-code/regenerate', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first<{ id: string }>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    let code = '';
    let saved = false;
    for (let attempt = 0; attempt < 3 && !saved; attempt++) {
      code = generateSeatCode();
      try {
        await c.env.DB.prepare(
          'UPDATE schools SET seat_code = ? WHERE id = ?'
        ).bind(code, schoolId).run();
        saved = true;
      } catch (error) {
        if (!String(error).includes('UNIQUE')) throw error;
      }
    }
    if (!saved) {
      return c.json({ success: false, error: 'Could not allocate a unique seat code' }, 500);
    }

    return c.json({ success: true, data: { schoolId, seatCode: code } });
  } catch (error) {
    console.error('Admin regenerate seat code error:', error);
    return c.json({ success: false, error: 'Failed to regenerate seat code' }, 500);
  }
});

// Seat usage view with reconcile-on-read (spec risk 1): shows seat_code_uses
// alongside the actual active/expired/revoked counts so drift is visible.
adminSchoolSeatsApp.get('/:id/seats', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const school = await c.env.DB.prepare(`
      SELECT id, name, status, seat_tier_id, seat_expires_at, seat_code, seat_code_uses, seat_cap
      FROM schools WHERE id = ?
    `).bind(schoolId).first<SchoolSeatStateRow>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const { results: seats } = await c.env.DB.prepare(`
      SELECT ss.id, ss.user_id, ss.granted_at, ss.status, ss.source_payment_ref,
             ss.prior_tier_id, ss.prior_expires_at, u.name AS user_name, u.email AS user_email
      FROM school_seats ss
      JOIN users u ON u.id = ss.user_id
      WHERE ss.school_id = ?
      ORDER BY ss.granted_at DESC
      LIMIT 500
    `).bind(schoolId).all<{
      id: string;
      user_id: string;
      granted_at: string;
      status: string;
      source_payment_ref: string | null;
      prior_tier_id: string | null;
      prior_expires_at: string | null;
      user_name: string;
      user_email: string;
    }>();

    const activeCount = seats.filter((s) => s.status === 'active').length;
    const expiredCount = seats.filter((s) => s.status === 'expired').length;
    const revokedCount = seats.filter((s) => s.status === 'revoked').length;

    return c.json({
      success: true,
      data: {
        school: {
          id: school.id,
          name: school.name,
          status: school.status,
          seatTierId: school.seat_tier_id,
          seatExpiresAt: school.seat_expires_at,
          seatCode: school.seat_code,
        },
        usage: {
          cap: school.seat_cap,
          codeUses: school.seat_code_uses,
          activeCount,
          expiredCount,
          revokedCount,
          // Drift signal: counter vs real active rows (spec risk 1).
          drift: school.seat_code_uses - activeCount,
        },
        seats: seats.map((s) => ({
          id: s.id,
          userId: s.user_id,
          userName: s.user_name,
          userEmail: s.user_email,
          grantedAt: s.granted_at,
          status: s.status,
          sourcePaymentRef: s.source_payment_ref,
          priorTierId: s.prior_tier_id,
          priorExpiresAt: s.prior_expires_at,
        })),
      },
    });
  } catch (error) {
    console.error('Admin list school seats error:', error);
    return c.json({ success: false, error: 'Failed to list school seats' }, 500);
  }
});

// Revoke one seat: restore prior entitlement (better-of rule), mark revoked,
// free the seat back into the pool. Also used for member-leaves-school.
adminSchoolSeatsApp.delete('/:id/seats/:userId', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const userId = c.req.param('userId');

    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first<{ id: string }>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const released = await releaseSchoolSeat(c.env.DB, schoolId, userId, 'revoked');
    if (!released) {
      return c.json({ success: false, error: 'No active seat for this student at this school' }, 404);
    }

    return c.json({ success: true, data: { schoolId, userId, released: true } });
  } catch (error) {
    console.error('Admin revoke school seat error:', error);
    return c.json({ success: false, error: 'Failed to revoke seat' }, 500);
  }
});

// ============================================================================
// Phase 2 admin routes: school_admin assignment + prorated seat reduction.
// ============================================================================

// List the school's school_admin accounts (phase 2) so the admin UI can show
// who manages each school before assigning/removing.
adminSchoolSeatsApp.get('/:id/school-admins', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const { results: admins } = await c.env.DB.prepare(`
      SELECT id, name, email, status, created_at FROM users
      WHERE role = 'school_admin' AND school_id = ?
      ORDER BY created_at DESC
    `).bind(schoolId).all<{
      id: string;
      name: string;
      email: string;
      status: string;
      created_at: string;
    }>();

    return c.json({
      success: true,
      data: admins.map((a) => ({
        userId: a.id,
        name: a.name,
        email: a.email,
        status: a.status,
        createdAt: a.created_at,
      })),
    });
  } catch (error) {
    console.error('Admin list school admins error:', error);
    return c.json({ success: false, error: 'Failed to list school admins' }, 500);
  }
});

// Promote a user to school_admin for this school (phase 2). A school_admin
// gets the self-serve dashboard at /api/school-admin scoped to users.school_id.
// Platform admins are never converted; a school_admin of ANOTHER school must
// be demoted there first (no silent school-hop, same rule as seat redemption).
adminSchoolSeatsApp.post('/:id/school-admins', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const userId = typeof body.userId === 'string' ? body.userId.trim() : '';
    if (!userId) {
      return c.json({ success: false, error: 'userId is required' }, 400);
    }

    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first<{ id: string }>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const user = await c.env.DB.prepare(`
      SELECT id, role, school_id FROM users WHERE id = ?
    `).bind(userId).first<{ id: string; role: string; school_id: string | null }>();
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }
    if (user.role === 'admin') {
      return c.json({ success: false, error: 'Platform admins cannot be assigned as school admins' }, 400);
    }
    if (user.role === 'school_admin' && user.school_id && user.school_id !== schoolId) {
      return c.json({ success: false, error: 'User is already a school admin of another school' }, 409);
    }
    if (user.role === 'school_admin' && user.school_id === schoolId) {
      return c.json({ success: true, data: { schoolId, userId, role: 'school_admin', alreadyAssigned: true } });
    }

    await c.env.DB.prepare(`
      UPDATE users SET role = 'school_admin', school_id = ? WHERE id = ?
    `).bind(schoolId, userId).run();

    return c.json({ success: true, data: { schoolId, userId, role: 'school_admin' } });
  } catch (error) {
    console.error('Admin assign school admin error:', error);
    return c.json({ success: false, error: 'Failed to assign school admin' }, 500);
  }
});

// Demote a school_admin. The original role is not stored, so teachers are
// detected by their teacher-profile fields (teacher_license_number /
// subjects_taught); everyone else returns to 'student'. school_id is cleared
// only when it still points at THIS school.
adminSchoolSeatsApp.delete('/:id/school-admins/:userId', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const userId = c.req.param('userId');

    const user = await c.env.DB.prepare(`
      SELECT id, role, school_id, teacher_license_number, subjects_taught FROM users WHERE id = ?
    `).bind(userId).first<{
      id: string;
      role: string;
      school_id: string | null;
      teacher_license_number: string | null;
      subjects_taught: string | null;
    }>();
    if (!user || user.role !== 'school_admin') {
      return c.json({ success: false, error: 'User is not a school admin' }, 404);
    }

    const restoredRole = user.teacher_license_number || user.subjects_taught ? 'teacher' : 'student';

    await c.env.DB.prepare(`
      UPDATE users
      SET role = ?,
          school_id = CASE WHEN school_id = ? THEN NULL ELSE school_id END
      WHERE id = ? AND role = 'school_admin'
    `).bind(restoredRole, schoolId, userId).run();

    return c.json({ success: true, data: { schoolId, userId, role: restoredRole } });
  } catch (error) {
    console.error('Admin remove school admin error:', error);
    return c.json({ success: false, error: 'Failed to remove school admin' }, 500);
  }
});

// Prorated mid-cycle seat reduction (phase 2). The cap drops by the requested
// amount (409 when active seats would exceed the new cap — revoke first) and
// the unused remainder is credited to schools.seat_credit at the tier's
// per-seat rate, prorated by remaining days:
//   credit = floor(perSeatRate × seats × remainingDays / periodDays)
// perSeatRate = period price / package seats; periodDays = 30 monthly, 365
// yearly (billing cycle inferred from the school's most recent successful
// payment for the tier, default monthly). The credit is returned here and
// consumed as a discount by POST /api/school-admin/billing/renew.
adminSchoolSeatsApp.post('/:id/seats/reduce', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const seats = Number.isInteger(body.seats) && (body.seats as number) > 0
      ? (body.seats as number)
      : null;
    if (!seats) {
      return c.json({ success: false, error: 'seats must be a positive integer' }, 400);
    }

    const school = await c.env.DB.prepare(`
      SELECT id, seat_tier_id, seat_expires_at, seat_cap, seat_credit FROM schools WHERE id = ?
    `).bind(schoolId).first<{
      id: string;
      seat_tier_id: string | null;
      seat_expires_at: string | null;
      seat_cap: number;
      seat_credit: number;
    }>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }
    if (!school.seat_tier_id) {
      return c.json({ success: false, error: 'School has no seat package' }, 400);
    }

    const packageSeats = SCHOOL_TIER_SEATS[school.seat_tier_id] ?? null;
    if (!packageSeats) {
      return c.json({ success: false, error: 'Prorated reduction is not available for custom-priced tiers — contact Brilla' }, 400);
    }

    const newCap = school.seat_cap - seats;
    if (newCap < 0) {
      return c.json({ success: false, error: `Cannot reduce by ${seats}: the school only has a cap of ${school.seat_cap}` }, 400);
    }

    const activeCount = await c.env.DB.prepare(`
      SELECT COUNT(*) AS n FROM school_seats WHERE school_id = ? AND status = 'active'
    `).bind(schoolId).first<{ n: number }>();
    if ((activeCount?.n ?? 0) > newCap) {
      return c.json({
        success: false,
        error: `Active seats (${activeCount?.n ?? 0}) exceed the new cap (${newCap}) — revoke seats first`,
      }, 409);
    }

    const tier = await c.env.DB.prepare(`
      SELECT price_monthly, price_yearly FROM subscription_tiers WHERE id = ?
    `).bind(school.seat_tier_id).first<{ price_monthly: number; price_yearly: number }>();
    if (!tier) {
      return c.json({ success: false, error: 'School seat tier not found' }, 500);
    }

    const lastPayment = await c.env.DB.prepare(`
      SELECT billing_cycle FROM payment_transactions
      WHERE plan_id = ? AND status = 'success' AND metadata LIKE ?
      ORDER BY created_at DESC LIMIT 1
    `).bind(school.seat_tier_id, `%"school_id":"${schoolId}"%`).first<{ billing_cycle: string }>();
    const cycle = lastPayment?.billing_cycle === 'yearly' ? 'yearly' : 'monthly';

    const periodDays = cycle === 'yearly' ? 365 : 30;
    const periodPrice = cycle === 'yearly' ? tier.price_yearly : tier.price_monthly;
    const perSeatRate = periodPrice / packageSeats;
    const remainingDays = school.seat_expires_at
      ? Math.max(0, Math.floor((Date.parse(school.seat_expires_at) - Date.now()) / (24 * 60 * 60 * 1000)))
      : 0;
    const credit = Math.floor((perSeatRate * seats * remainingDays) / periodDays);

    await c.env.DB.prepare(`
      UPDATE schools SET seat_cap = ?, seat_credit = seat_credit + ? WHERE id = ?
    `).bind(newCap, credit, schoolId).run();

    console.log(
      `School seat reduction: school=${schoolId} removed=${seats} newCap=${newCap} cycle=${cycle} remainingDays=${remainingDays} credit=GHS ${credit}`,
    );

    return c.json({
      success: true,
      data: {
        schoolId,
        seatsRemoved: seats,
        newCap,
        billingCycle: cycle,
        remainingDays,
        creditGhs: credit,
        seatCredit: (school.seat_credit ?? 0) + credit,
      },
    });
  } catch (error) {
    console.error('Admin reduce school seats error:', error);
    return c.json({ success: false, error: 'Failed to reduce seats' }, 500);
  }
});
