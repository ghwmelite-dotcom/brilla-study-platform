import type { ExamTypeSlug } from '@/types';
import { GUIDANCE_EXAM_CATALOG } from '@/lib/guidanceExamCatalog';

export const TARGET_GRADES: Record<ExamTypeSlug, readonly string[]> = {
  nsmq: GUIDANCE_EXAM_CATALOG.nsmq.grades,
  wassce: GUIDANCE_EXAM_CATALOG.wassce.grades,
  bece: GUIDANCE_EXAM_CATALOG.bece.grades,
  igcse: GUIDANCE_EXAM_CATALOG.igcse.grades,
  'cambridge-as': GUIDANCE_EXAM_CATALOG['cambridge-as'].grades,
  'cambridge-a-level': GUIDANCE_EXAM_CATALOG['cambridge-a-level'].grades,
  'edexcel-igcse': GUIDANCE_EXAM_CATALOG['edexcel-igcse'].grades,
  'edexcel-as': GUIDANCE_EXAM_CATALOG['edexcel-as'].grades,
  'edexcel-a-level': GUIDANCE_EXAM_CATALOG['edexcel-a-level'].grades,
};
