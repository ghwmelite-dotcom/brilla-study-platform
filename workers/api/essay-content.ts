export const MAX_ESSAY_CHARACTERS = 50_000;

const HTML_TAG = /<\/?[a-z][^>]*>/i;

export type EssaySubmission = {
  questionId: string;
  answerText: string;
  gradingType: 'ai' | 'self';
  wordCount: number;
};

export function parseEssaySubmission(input: unknown): EssaySubmission | null {
  if (!input || typeof input !== 'object' || Array.isArray(input)) return null;
  const body = input as Record<string, unknown>;
  if (typeof body.questionId !== 'string' || !body.questionId.trim()) return null;
  if (typeof body.answerText !== 'string') return null;
  if (body.answerText.length === 0 || body.answerText.length > MAX_ESSAY_CHARACTERS) return null;
  if (HTML_TAG.test(body.answerText)) return null;
  if (body.gradingType !== undefined && body.gradingType !== 'ai' && body.gradingType !== 'self') return null;

  const answerText = body.answerText.replace(/\r\n?/g, '\n').trim();
  if (!answerText) return null;
  return {
    questionId: body.questionId.trim(),
    answerText,
    gradingType: body.gradingType === 'ai' ? 'ai' : 'self',
    wordCount: answerText.split(/\s+/).filter(Boolean).length,
  };
}
