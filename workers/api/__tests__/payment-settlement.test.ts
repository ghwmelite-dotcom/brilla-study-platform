import Database from 'better-sqlite3';
import { afterEach, describe, expect, it, vi } from 'vitest';
import {
  reconcilePendingSubscriptionPayments,
  sanitizeProviderTransaction,
  settleVerifiedSubscriptionPayment,
} from '../payment-settlement';

interface RunnableStatement {
  run(): Promise<D1Result>;
}

function sqliteD1(sqlite: Database.Database): D1Database {
  return {
    prepare(sql: string) {
      let params: unknown[] = [];
      const statement = {
        bind(...values: unknown[]) {
          params = values;
          return statement;
        },
        async first<T>() {
          return (sqlite.prepare(sql).get(...params) as T | undefined) ?? null;
        },
        async all<T>() {
          return { results: sqlite.prepare(sql).all(...params) as T[] };
        },
        async run() {
          const result = sqlite.prepare(sql).run(...params);
          return { success: true, meta: { changes: result.changes } } as D1Result;
        },
      };
      return statement;
    },
    async batch(statements: RunnableStatement[]) {
      const execute = sqlite.transaction(() => {
        const results: D1Result[] = [];
        for (const statement of statements) {
          const result = sqlite.prepare('SELECT 1').get();
          void result;
          results.push(statement.run() as unknown as D1Result);
        }
        return results;
      });
      return execute();
    },
  } as unknown as D1Database;
}

function createPaymentDb() {
  const sqlite = new Database(':memory:');
  sqlite.exec(`
    CREATE TABLE users (
      id TEXT PRIMARY KEY,
      referred_by TEXT,
      subscription_tier_id TEXT,
      subscription_expires_at TEXT,
      ai_grading_credits INTEGER DEFAULT 0,
      xp_points INTEGER DEFAULT 0,
      house TEXT
    );
    CREATE TABLE subscription_tiers (
      id TEXT PRIMARY KEY,
      ai_grading_quota INTEGER NOT NULL
    );
    CREATE TABLE payment_transactions (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      reference TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL,
      currency TEXT NOT NULL,
      plan_id TEXT,
      plan_type TEXT NOT NULL,
      billing_cycle TEXT,
      status TEXT NOT NULL DEFAULT 'pending',
      paystack_response TEXT,
      metadata TEXT,
      created_at TEXT DEFAULT (datetime('now')),
      verified_at TEXT,
      settlement_applied_at TEXT,
      settlement_source TEXT,
      reconciliation_checked_at TEXT,
      affiliate_processed_at TEXT
    );
    CREATE TABLE user_trials (
      user_id TEXT PRIMARY KEY,
      status TEXT,
      converted_at TEXT
    );
    CREATE TABLE payment_webhook_receipts (
      id TEXT PRIMARY KEY,
      event_type TEXT NOT NULL,
      event_key TEXT NOT NULL UNIQUE,
      transfer_code TEXT,
      transaction_reference TEXT,
      processed_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO users (id, ai_grading_credits) VALUES ('user_1', 2);
    INSERT INTO subscription_tiers (id, ai_grading_quota) VALUES ('tier_pro', 10);
    INSERT INTO user_trials (user_id, status) VALUES ('user_1', 'active');
    INSERT INTO payment_transactions (
      id, user_id, reference, amount, currency, plan_id, plan_type,
      billing_cycle, status, created_at
    ) VALUES (
      'tx_1', 'user_1', 'SUB_REF_1', 25, 'GHS', 'tier_pro', 'student',
      'monthly', 'pending', datetime('now', '-2 hours')
    );
  `);
  return { sqlite, db: sqliteD1(sqlite) };
}

const verifiedSuccess = {
  reference: 'SUB_REF_1',
  status: 'success',
  amount: 2500,
  currency: 'GHS',
  customer: { email: 'private@example.com' },
  authorization: { last4: '4081' },
};

afterEach(() => vi.unstubAllGlobals());

describe('subscription payment settlement', () => {
  it('persists only a sanitized provider summary', () => {
    const summary = sanitizeProviderTransaction(verifiedSuccess);
    expect(summary).toEqual({
      reference: 'SUB_REF_1',
      status: 'success',
      amount: 2500,
      currency: 'GHS',
    });
    expect(JSON.stringify(summary)).not.toContain('private@example.com');
    expect(JSON.stringify(summary)).not.toContain('4081');
  });

  it('applies subscription credits once under concurrent callback and webhook settlement', async () => {
    const state = createPaymentDb();
    try {
      const [callback, webhook] = await Promise.all([
        settleVerifiedSubscriptionPayment(state.db, verifiedSuccess, 'callback'),
        settleVerifiedSubscriptionPayment(state.db, verifiedSuccess, 'webhook'),
      ]);

      expect([callback.outcome, webhook.outcome].sort()).toEqual(['already_applied', 'applied']);
      expect(state.sqlite.prepare(`
        SELECT status, ai_grading_credits, settlement_applied_at
        FROM payment_transactions pt
        JOIN users u ON u.id = pt.user_id
        WHERE pt.id = 'tx_1'
      `).get()).toMatchObject({
        status: 'success',
        ai_grading_credits: 12,
      });
      expect(state.sqlite.prepare(`
        SELECT COUNT(*) AS count FROM payment_webhook_receipts
        WHERE event_key = 'charge.success:SUB_REF_1'
      `).get()).toEqual({ count: 1 });
    } finally {
      state.sqlite.close();
    }
  });

  it('fails closed on amount mismatch without granting credits', async () => {
    const state = createPaymentDb();
    try {
      const result = await settleVerifiedSubscriptionPayment(
        state.db,
        { ...verifiedSuccess, amount: 5000 },
        'callback',
      );
      expect(result.outcome).toBe('mismatch');
      expect(state.sqlite.prepare(`SELECT status FROM payment_transactions WHERE id = 'tx_1'`).get())
        .toEqual({ status: 'failed' });
      expect(state.sqlite.prepare(`SELECT ai_grading_credits FROM users WHERE id = 'user_1'`).get())
        .toEqual({ ai_grading_credits: 2 });
    } finally {
      state.sqlite.close();
    }
  });

  it('reconciles provider success and leaves non-terminal provider states pending', async () => {
    const state = createPaymentDb();
    try {
      state.sqlite.prepare(`
        INSERT INTO payment_transactions (
          id, user_id, reference, amount, currency, plan_id, plan_type,
          billing_cycle, status, created_at
        ) VALUES (
          'tx_2', 'user_1', 'SUB_REF_2', 25, 'GHS', 'tier_pro', 'student',
          'monthly', 'pending', datetime('now', '-2 hours')
        )
      `).run();

      vi.stubGlobal('fetch', vi.fn(async (input: RequestInfo | URL) => {
        const reference = String(input).split('/').pop();
        const status = reference === 'SUB_REF_1' ? 'success' : 'ongoing';
        return new Response(JSON.stringify({
          status: true,
          data: { ...verifiedSuccess, reference, status },
        }));
      }));

      const result = await reconcilePendingSubscriptionPayments(
        state.db,
        'sk_test_reconcile',
        25,
      );

      expect(result).toMatchObject({ checked: 2, settled: 1, failed: 0, stillPending: 1 });
      expect(state.sqlite.prepare(`SELECT status FROM payment_transactions WHERE id = 'tx_2'`).get())
        .toEqual({ status: 'pending' });
    } finally {
      state.sqlite.close();
    }
  });
});

