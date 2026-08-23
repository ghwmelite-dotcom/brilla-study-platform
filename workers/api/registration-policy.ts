import { EMAIL_VERIFICATION_REWARD_XP } from './email-verification-reward';

export type SelfServeRegistrationRole = 'student' | 'teacher' | 'parent';

// Students can begin learning immediately. Roles that can manage another
// person's learning experience or data still require an administrator review.
export function getSelfRegistrationStatus(
  role: SelfServeRegistrationRole,
): 'approved' | 'pending' {
  return role === 'student' ? 'approved' : 'pending';
}

export function requiresRegistrationApproval(role: SelfServeRegistrationRole): boolean {
  return getSelfRegistrationStatus(role) === 'pending';
}

export const PENDING_APPROVAL_MESSAGE =
  'Your registration is pending approval. You will be notified once an administrator reviews your application.';

export const IMMEDIATE_STUDENT_REGISTRATION_MESSAGE =
  `Your student account is ready. Verify your email to earn ${EMAIL_VERIFICATION_REWARD_XP} XP.`;
