import { describe, expect, it } from 'vitest';
import { createMockD1 } from './helpers/mockD1';
import { getParentGuidance } from '../parent-guidance';

describe('parent Counselor Brie summary', () => {
  it('maps the latest goal and its matching readiness without exposing session detail', async () => {
    const db = createMockD1([
      {
        match: /FROM user_goals ug/,
        first: () => ({
          exam_type: 'wassce',
          subject_id: 'subject_1',
          target_grade: 'A1',
          exam_year: 2027,
          exam_month: 5,
          readiness_score: 63,
          last_calculated: '2026-08-14T10:00:00Z',
        }),
      },
    ]);

    const result = await getParentGuidance(db as unknown as D1Database, 'student_1');
    expect(result).toEqual({
      examType: 'wassce',
      subjectId: 'subject_1',
      targetGrade: 'A1',
      examYear: 2027,
      examMonth: 5,
      readinessScore: 63,
      lastCalculated: '2026-08-14T10:00:00Z',
    });
    expect(db.calls[0].binds).toEqual(['student_1']);
    expect(db.calls[0].sql).toMatch(/er\.user_id = ug\.user_id/);
    expect(db.calls[0].sql).toMatch(/er\.exam_type = ug\.exam_type/);
    expect(db.calls[0].sql).toMatch(/er\.subject_id = ug\.subject_id/);
    expect(db.calls[0].sql).toMatch(/ORDER BY ug\.updated_at DESC/);
  });

  it('returns null when the student has no guidance goal', async () => {
    const db = createMockD1([{ match: /FROM user_goals ug/, first: () => null }]);
    await expect(getParentGuidance(db as unknown as D1Database, 'student_2')).resolves.toBeNull();
  });
});
