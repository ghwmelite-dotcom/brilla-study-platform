import { getDemoDataFlags } from './demoUtils';

export interface AttemptProgressInput {
  attemptId?: string;
  clientRequestId?: string | null;
  requestFingerprint?: string | null;
  userId: string;
  questionId: string;
  topicId: string | null;
  examTypeId: string | null;
  userAnswer: string;
  isCorrect: boolean;
  timeTaken: number;
  points: number;
  now?: string;
}

export interface PreparedAttemptProgress {
  attemptId: string;
  statements: D1PreparedStatement[];
}

function newId(prefix: string): string {
  return `${prefix}_${crypto.randomUUID()}`;
}

/**
 * Build the canonical question_attempts + user_progress write set. Callers may
 * append their own statements and submit one D1 batch, which keeps guidance
 * answer/session writes on the same atomic path as ordinary practice.
 */
export async function prepareAttemptProgress(
  db: D1Database,
  input: AttemptProgressInput,
): Promise<PreparedAttemptProgress> {
  const attemptId = input.attemptId ?? newId('attempt');
  const now = input.now ?? new Date().toISOString();
  const correctIncrement = input.isCorrect ? 1 : 0;
  const pointsEarned = input.isCorrect ? Math.max(0, input.points) : 0;
  const timeTaken = Number.isFinite(input.timeTaken)
    ? Math.max(0, Math.round(input.timeTaken))
    : 0;
  const demo = getDemoDataFlags(input.userId);

  const attempt = db.prepare(`
    INSERT INTO question_attempts (
      id, user_id, question_id, user_answer, is_correct, time_taken,
      points_earned, is_demo_data, expires_at, client_request_id,
      request_fingerprint
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    attemptId,
    input.userId,
    input.questionId,
    input.userAnswer,
    correctIncrement,
    timeTaken,
    pointsEarned,
    demo.is_demo_data,
    demo.expires_at,
    input.clientRequestId ?? null,
    input.requestFingerprint ?? null,
  );

  if (!input.topicId) {
    return { attemptId, statements: [attempt] };
  }

  let progress: D1PreparedStatement;
  if (input.examTypeId !== null) {
    progress = db.prepare(`
      INSERT INTO user_progress (
        id, user_id, topic_id, exam_type_id, questions_attempted,
        questions_correct, mastery_level, last_attempt_at, created_at,
        updated_at, is_demo_data, expires_at
      ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, topic_id, exam_type_id) DO UPDATE SET
        questions_attempted = questions_attempted + 1,
        questions_correct = questions_correct + excluded.questions_correct,
        mastery_level = ROUND(100.0 * (questions_correct + excluded.questions_correct) / (questions_attempted + 1)),
        last_attempt_at = excluded.last_attempt_at,
        updated_at = excluded.updated_at
    `).bind(
      newId('progress'),
      input.userId,
      input.topicId,
      input.examTypeId,
      correctIncrement,
      correctIncrement * 100,
      now,
      now,
      now,
      demo.is_demo_data,
      demo.expires_at,
    );
  } else {
    const existing = await db.prepare(`
      SELECT id FROM user_progress
      WHERE user_id = ? AND topic_id = ? AND exam_type_id IS NULL
    `).bind(input.userId, input.topicId).first<{ id: string }>();

    progress = existing
      ? db.prepare(`
          UPDATE user_progress SET
            questions_attempted = questions_attempted + 1,
            questions_correct = questions_correct + ?,
            mastery_level = ROUND(100.0 * (questions_correct + ?) / (questions_attempted + 1)),
            last_attempt_at = ?,
            updated_at = ?
          WHERE id = ?
        `).bind(correctIncrement, correctIncrement, now, now, existing.id)
      : db.prepare(`
          INSERT INTO user_progress (
            id, user_id, topic_id, exam_type_id, questions_attempted,
            questions_correct, mastery_level, last_attempt_at, created_at,
            updated_at, is_demo_data, expires_at
          ) VALUES (?, ?, ?, NULL, 1, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          newId('progress'),
          input.userId,
          input.topicId,
          correctIncrement,
          correctIncrement * 100,
          now,
          now,
          now,
          demo.is_demo_data,
          demo.expires_at,
        );
  }

  return { attemptId, statements: [attempt, progress] };
}

export async function recordAttemptProgress(
  db: D1Database,
  input: AttemptProgressInput,
): Promise<string> {
  const prepared = await prepareAttemptProgress(db, input);
  await db.batch(prepared.statements);
  return prepared.attemptId;
}
