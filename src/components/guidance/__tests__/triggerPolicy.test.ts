import { describe, expect, it } from 'vitest';
import { isDistractionFreeRoute, shouldAutoLaunchBrie } from '../triggerPolicy';

// Regression: ISSUE-004 — the Brie onboarding wizard auto-launched over a
// running timed mock exam (/mock-exams/:paperId), interrupting the sit.
// Found by /qa on 2026-09-04. Report: .gstack/qa-reports/qa-report-whiteboard-staging-2026-09-04.md
describe('isDistractionFreeRoute', () => {
  it('flags the timed paper routes', () => {
    expect(isDistractionFreeRoute('/mock-exams/pp_wassce_math_2024_1')).toBe(true);
    expect(isDistractionFreeRoute('/past-papers/pp_wassce_math_2024_1')).toBe(true);
  });

  it('does not flag browsing, results, or nested routes', () => {
    expect(isDistractionFreeRoute('/mock-exams')).toBe(false);
    expect(isDistractionFreeRoute('/past-papers')).toBe(false);
    expect(isDistractionFreeRoute('/past-papers/results/pa_123')).toBe(false);
    expect(isDistractionFreeRoute('/dashboard')).toBe(false);
    expect(isDistractionFreeRoute('/')).toBe(false);
  });
});

describe('shouldAutoLaunchBrie with route context', () => {
  const base = {
    enabled: true,
    isAuthenticated: true,
    role: 'student' as const,
    wizardOpen: false,
    coolingDown: false,
  };

  it('suppresses auto-launch on distraction-free routes', () => {
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/mock-exams/pp_wassce_math_2024_1' })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/past-papers/pp_bece_math_2024_1' })).toBe(false);
  });

  it('still auto-launches on ordinary routes', () => {
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/dashboard' })).toBe(true);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/past-papers' })).toBe(true);
    expect(shouldAutoLaunchBrie(base)).toBe(true);
  });
});
