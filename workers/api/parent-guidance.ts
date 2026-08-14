export interface ParentGuidanceRow {
  exam_type: string;
  subject_id: string;
  target_grade: string | null;
  exam_year: number | null;
  exam_month: number | null;
  readiness_score: number | null;
  last_calculated: string | null;
}

export interface ParentGuidanceSummary {
  examType: string;
  subjectId: string;
  targetGrade: string | null;
  examYear: number | null;
  examMonth: number | null;
  readinessScore: number | null;
  lastCalculated: string | null;
}

export function mapParentGuidance(
  row: ParentGuidanceRow | null,
): ParentGuidanceSummary | null {
  if (!row) return null;
  return {
    examType: row.exam_type,
    subjectId: row.subject_id,
    targetGrade: row.target_grade ?? null,
    examYear: row.exam_year === null ? null : Number(row.exam_year),
    examMonth: row.exam_month === null ? null : Number(row.exam_month),
    readinessScore: row.readiness_score === null ? null : Number(row.readiness_score),
    lastCalculated: row.last_calculated ?? null,
  };
}

export async function getParentGuidance(
  db: D1Database,
  studentId: string,
): Promise<ParentGuidanceSummary | null> {
  const row = await db.prepare(`
    SELECT
      ug.exam_type,
      ug.subject_id,
      ug.target_grade,
      ug.exam_year,
      ug.exam_month,
      er.readiness_score,
      er.last_calculated
    FROM user_goals ug
    LEFT JOIN exam_readiness er
      ON er.user_id = ug.user_id
     AND er.exam_type = ug.exam_type
     AND er.subject_id = ug.subject_id
    WHERE ug.user_id = ?
    ORDER BY ug.updated_at DESC
    LIMIT 1
  `).bind(studentId).first<ParentGuidanceRow>();
  return mapParentGuidance(row);
}
