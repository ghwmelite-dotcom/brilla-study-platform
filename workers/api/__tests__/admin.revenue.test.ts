import { describe, it, expect } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';

// Regression guard: payment revenue reads must use status = 'success'
// (writes use 'success' — payments.ts; CHECK constraint migration 021).
describe('admin revenue status regression guard', () => {
  it('no payment_transactions revenue read filters on status = completed', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'index.ts'), 'utf8',
    );
    const revenueReads = src.match(
      /payment_transactions[^`]*status\s*=\s*'completed'/g,
    );
    expect(revenueReads).toBeNull();
  });

  it('revenue aggregations filter on status = success', () => {
    const src = fs.readFileSync(
      path.resolve(__dirname, '..', 'index.ts'), 'utf8',
    );
    const matches = src.match(
      /SUM\(amount\)[^`]*payment_transactions[^`]*status\s*=\s*'success'/g,
    ) || [];
    expect(matches.length).toBeGreaterThanOrEqual(3); // dashboard + analytics(2x) + subscriptions(2x)
  });
});
