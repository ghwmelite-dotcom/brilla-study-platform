import { describe, expect, it } from 'vitest';
import { isDashboardRoute, isDistractionFreeRoute, shouldAutoLaunchBrie } from '../triggerPolicy';

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

describe('isDashboardRoute', () => {
  it('flags the dashboard-style surfaces', () => {
    expect(isDashboardRoute('/')).toBe(true);
    expect(isDashboardRoute('/dashboard')).toBe(true);
    expect(isDashboardRoute('/oa-level')).toBe(true);
  });

  it('does not flag any other route', () => {
    expect(isDashboardRoute('/settings')).toBe(false);
    expect(isDashboardRoute('/past-papers')).toBe(false);
    expect(isDashboardRoute('/mock-exams')).toBe(false);
    expect(isDashboardRoute('/oa-level/syllabus/spec_1')).toBe(false);
    expect(isDashboardRoute('/dashboard/x')).toBe(false);
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

  it('auto-launches only on dashboard-style surfaces', () => {
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/dashboard' })).toBe(true);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/' })).toBe(true);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/oa-level' })).toBe(true);
  });

  it('suppresses auto-launch on every other route', () => {
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/settings' })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/past-papers' })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/my-plan' })).toBe(false);
    expect(shouldAutoLaunchBrie({ ...base, pathname: '/oa-level/syllabus/spec_1' })).toBe(false);
  });

  it('fails closed when no route context is provided', () => {
    expect(shouldAutoLaunchBrie(base)).toBe(false);
  });
});
