export interface BrieTriggerPolicyInput {
  enabled: boolean;
  isAuthenticated: boolean;
  role: string | null | undefined;
  wizardOpen: boolean;
  coolingDown: boolean;
  pathname?: string;
}

// Timed paper sits are distraction-free — nothing may pop over them.
const DISTRACTION_FREE_PATTERN = /^\/(?:past-papers|mock-exams)\/[^/]+\/?$/;

// Brie auto-launches only on dashboard-style surfaces. Everywhere else the
// wizard opens manually (e.g. My Plan) and must never pop over the user.
const DASHBOARD_PATTERN = /^\/(?:dashboard|oa-level)?\/?$/;

export function isDistractionFreeRoute(pathname: string): boolean {
  return DISTRACTION_FREE_PATTERN.test(pathname);
}

export function isDashboardRoute(pathname: string): boolean {
  return DASHBOARD_PATTERN.test(pathname);
}

export function shouldAutoLaunchBrie(input: BrieTriggerPolicyInput): boolean {
  return (
    input.enabled &&
    input.isAuthenticated &&
    input.role === 'student' &&
    !input.wizardOpen &&
    !input.coolingDown &&
    input.pathname !== undefined &&
    isDashboardRoute(input.pathname) &&
    !isDistractionFreeRoute(input.pathname)
  );
}
