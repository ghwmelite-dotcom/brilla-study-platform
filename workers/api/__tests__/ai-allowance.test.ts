import { describe, it, expect } from 'vitest';
import { createMockD1 } from './helpers/mockD1';
import {
  checkAiAllowance,
  getDailyAiInteractions,
  DAILY_AI_INTERACTION_LIMIT,
} from '../usage-limits';

const premiumUserHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_student_monthly',
    subscription_expires_at: new Date(Date.now() + 86400000).toISOString(),
    trial_expires_at: null,
  }),
};

const freeUserHandler = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at\s+FROM users/,
  first: () => ({
    role: 'student',
    subscription_tier_id: 'tier_free',
    subscription_expires_at: null,
    trial_expires_at: null,
  }),
};

const aiCountHandler = (count: number) => ({
  match: /SELECT COUNT\(\*\) AS count FROM revision_ai_interactions/,
  first: () => ({ count }),
});

describe('AI allowance (revision classroom free tier)', () => {
  it('counts only teaching interactions from today', async () => {
    const db = createMockD1([aiCountHandler(7)]);
    const used = await getDailyAiInteractions('user_1', db as any);
    expect(used).toBe(7);
    const call = db.calls.find((c) => /revision_ai_interactions/.test(c.sql));
    expect(call!.sql).toMatch(/interaction_type LIKE 'teach_%'/);
    expect(call!.sql).toMatch(/'student_question'/);
    expect(call!.sql).toMatch(/date\(created_at\) = date\('now'\)/);
  });

  it('premium users are always allowed with unlimited remaining', async () => {
    const db = createMockD1([premiumUserHandler]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r).toEqual({ allowed: true, remaining: -1, limit: -1 });
    // premium short-circuits: no count query issued
    expect(db.calls.some((c) => /revision_ai_interactions/.test(c.sql))).toBe(false);
  });

  it('free user under the cap is allowed with correct remaining', async () => {
    const db = createMockD1([freeUserHandler, aiCountHandler(3)]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r).toEqual({ allowed: true, remaining: 7, limit: DAILY_AI_INTERACTION_LIMIT });
  });

  it('free user at the cap is rejected', async () => {
    const db = createMockD1([freeUserHandler, aiCountHandler(10)]);
    const r = await checkAiAllowance('user_1', db as any);
    expect(r.allowed).toBe(false);
    expect(r.remaining).toBe(0);
  });
});
