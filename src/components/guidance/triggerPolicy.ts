export interface BrieTriggerPolicyInput {
  enabled: boolean;
  isAuthenticated: boolean;
  role: string | null | undefined;
  wizardOpen: boolean;
  coolingDown: boolean;
}

export function shouldAutoLaunchBrie(input: BrieTriggerPolicyInput): boolean {
  return (
    input.enabled &&
    input.isAuthenticated &&
    input.role === 'student' &&
    !input.wizardOpen &&
    !input.coolingDown
  );
}
