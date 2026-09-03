import { describe, it, expect } from 'vitest';
import { waecGradeForPercentage, computeAttemptGrade } from '../index';
import { createMockD1 } from './helpers/mockD1';

describe('waecGradeForPercentage (WAEC band fallback)', () => {
  it.each([
    [100, 'A1'], [75, 'A1'], [74.9, 'B2'], [70, 'B2'], [65, 'B3'],
    [60, 'C4'], [55, 'C5'], [50, 'C6'], [45, 'D7'], [40, 'E8'],
    [39.9, 'F9'], [0, 'F9'],
  ])('%i%% → %s', (pct, grade) => {
    expect(waecGradeForPercentage(pct)).toBe(grade);
  });
  it('treats non-finite input as 0', () => {
    expect(waecGradeForPercentage(Number.NaN)).toBe('F9');
  });
});

describe('computeAttemptGrade', () => {
  const paper = { specification_id: 'spec_1', paper_component_id: null, session: 'May/June', year: 2024 };

  it('uses grade_boundaries when a matching row exists', async () => {
    const db = createMockD1([{
      match: /FROM grade_boundaries/,
      all: () => ({ results: [
        { grade: 'A', percentage: 70 }, { grade: 'B', percentage: 60 }, { grade: 'C', percentage: 50 },
      ] }),
    }]);
    expect(await computeAttemptGrade(db as unknown as D1Database, paper, 72)).toBe('A');
    expect(await computeAttemptGrade(db as unknown as D1Database, paper, 60)).toBe('B');
    expect(await computeAttemptGrade(db as unknown as D1Database, paper, 10)).toBe('C'); // below lowest → lowest
  });

  it('falls back to WAEC bands when no boundary rows match', async () => {
    const db = createMockD1([{ match: /FROM grade_boundaries/, all: () => ({ results: [] }) }]);
    expect(await computeAttemptGrade(db as unknown as D1Database, paper, 76)).toBe('A1');
  });

  it('falls back to WAEC bands without a DB query when specification/session/year are missing', async () => {
    const db = createMockD1([]); // any query would throw — proves no lookup happens
    const bare = { specification_id: null, paper_component_id: null, session: null, year: 2024 };
    expect(await computeAttemptGrade(db as unknown as D1Database, bare, 52)).toBe('C6');
  });
});
