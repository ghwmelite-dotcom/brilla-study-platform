import { describe, expect, it } from 'vitest';
import { parseCounselorReportContent } from '../counselor-report-schema';

const validReport = {
  summary: 'A concise report.',
  academicPerformance: { overallScore: 72 },
  wellbeingAssessment: { overallMood: 'positive' },
  keyInsights: ['Consistent practice'],
  recommendations: [{ category: 'academic', priority: 'medium', recommendation: 'Revise' }],
  goals: [{ goal: 'Complete two quizzes' }],
  concernLevel: 'medium',
};

describe('Counselor AI report schema', () => {
  it('accepts the database-compatible report shape', () => {
    expect(parseCounselorReportContent(validReport)).toEqual(validReport);
  });

  it('rejects the model-only moderate concern value', () => {
    expect(parseCounselorReportContent({ ...validReport, concernLevel: 'moderate' })).toBeNull();
  });

  it('rejects missing objects and oversized/untyped collections', () => {
    expect(parseCounselorReportContent({ ...validReport, academicPerformance: null })).toBeNull();
    expect(parseCounselorReportContent({ ...validReport, keyInsights: [42] })).toBeNull();
    expect(parseCounselorReportContent({ ...validReport, recommendations: Array(21).fill({}) })).toBeNull();
  });
});
