import type { D1Database, D1PreparedStatement } from '@cloudflare/workers-types';

export const EMAIL_VERIFICATION_REWARD_XP = 100;
export const EMAIL_VERIFICATION_REWARD_REFERENCE = 'email_verification';

export function getEmailVerificationRewardTransactionId(userId: string): string {
  return `xp_email_verified_${userId}`;
}

export function createEmailVerificationRewardStatement(
  db: D1Database,
  userId: string,
): D1PreparedStatement {
  return db.prepare(`
    INSERT OR IGNORE INTO xp_transactions
      (id, user_id, amount, type, description, reference_id)
    SELECT ?, ?, ?, 'achievement', 'Email verification bonus', ?
    WHERE EXISTS (
      SELECT 1 FROM users
      WHERE id = ? AND email_verified = 1 AND verification_token IS NULL
    )
  `).bind(
    getEmailVerificationRewardTransactionId(userId),
    userId,
    EMAIL_VERIFICATION_REWARD_XP,
    EMAIL_VERIFICATION_REWARD_REFERENCE,
    userId,
  );
}

interface FinalizeEmailVerificationInput {
  userId: string;
  token: string;
  passwordHash?: string;
}

export async function finalizeEmailVerification(
  db: D1Database,
  input: FinalizeEmailVerificationInput,
): Promise<{ verified: boolean; xpAwarded: number }> {
  const transactionId = getEmailVerificationRewardTransactionId(input.userId);
  const update = input.passwordHash
    ? db.prepare(`
        UPDATE users SET
          password_hash = ?,
          session_version = session_version + 1,
          email_verified = 1,
          xp_points = xp_points + CASE
            WHEN NOT EXISTS (SELECT 1 FROM xp_transactions WHERE id = ?) THEN ?
            ELSE 0
          END,
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = datetime('now')
        WHERE id = ? AND verification_token = ? AND email_verified = 0
      `).bind(
        input.passwordHash,
        transactionId,
        EMAIL_VERIFICATION_REWARD_XP,
        input.userId,
        input.token,
      )
    : db.prepare(`
        UPDATE users SET
          email_verified = 1,
          xp_points = xp_points + CASE
            WHEN NOT EXISTS (SELECT 1 FROM xp_transactions WHERE id = ?) THEN ?
            ELSE 0
          END,
          verification_token = NULL,
          verification_token_expires_at = NULL,
          updated_at = datetime('now')
        WHERE id = ? AND verification_token = ? AND email_verified = 0
      `).bind(
        transactionId,
        EMAIL_VERIFICATION_REWARD_XP,
        input.userId,
        input.token,
      );

  const [verificationResult, rewardResult] = await db.batch([
    update,
    createEmailVerificationRewardStatement(db, input.userId),
  ]);

  const verified = Number(verificationResult.meta?.changes ?? 0) > 0;
  const xpAwarded = Number(rewardResult.meta?.changes ?? 0) > 0
    ? EMAIL_VERIFICATION_REWARD_XP
    : 0;

  return { verified, xpAwarded };
}
