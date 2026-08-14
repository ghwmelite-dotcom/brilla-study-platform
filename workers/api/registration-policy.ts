// Self-registration never grants access. Referral/invite codes only control
// registration eligibility and attribution; an administrator remains the sole
// approval authority for every self-serve role and identity provider.
export const SELF_REGISTRATION_STATUS = 'pending' as const;

export const PENDING_APPROVAL_MESSAGE =
  'Your registration is pending approval. You will be notified once an administrator reviews your application.';

