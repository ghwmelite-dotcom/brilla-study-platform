import { describe, expect, it } from 'vitest';
import { consumeQuestionAllowance, isCoreSubject } from '../usage-limits';
import { createMockD1 } from './helpers/mockD1';

const nonPremium = {
  match: /SELECT role, subscription_tier_id, subscription_expires_at, trial_expires_at/,
  first: () => ({
    role: 'student',
    subscription_tier_id: null,
    subscription_expires_at: null,
    trial_expires_at: null,
  }),
};

describe('question allowance enforcement', () => {
  it('uses the same prefixed-slug policy as the frontend', () => {
    expect(isCoreSubject('wassce', 'wassce-core-mathematics')).toBe(true);
    expect(isCoreSubject('bece', 'bece-mathematics')).toBe(true);
    expect(isCoreSubject('nsmq', 'nsmq-physics')).toBe(true);
    expect(isCoreSubject('igcse', 'igcse-physics')).toBe(true);
    expect(isCoreSubject('wassce', 'wassce-physics')).toBe(false);
  });

  it('atomically increments below the limit with a guarded returning statement', async () => {
    const db = createMockD1([
      nonPremium,
      { match: /INSERT INTO daily_usage/, first: () => ({ question_count: 9 }) },
    ]);
    await expect(consumeQuestionAllowance('student-1', db as unknown as D1Database)).resolves.toMatchObject({
      allowed: true,
      used: 9,
      remaining: 1,
    });
    const write = db.calls.find(({ sql }) => /INSERT INTO daily_usage/.test(sql));
    expect(write?.sql).toContain('WHERE daily_usage.question_count < ?');
    expect(write?.sql).toContain('RETURNING question_count');
    expect(write?.binds.at(-1)).toBe(10);
  });

  it('fails closed when the guarded write returns no row at the limit', async () => {
    const db = createMockD1([
      nonPremium,
      { match: /INSERT INTO daily_usage/, first: () => null },
    ]);
    await expect(consumeQuestionAllowance('student-1', db as unknown as D1Database)).resolves.toMatchObject({
      allowed: false,
      used: 10,
      remaining: 0,
      reason: 'daily_limit_reached',
    });
  });
});
