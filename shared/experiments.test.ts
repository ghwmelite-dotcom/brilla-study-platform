import { describe, expect, it } from 'vitest';
import { allExperiments, getExperimentBySlug } from './experiments';

describe('shared experiment registry', () => {
  it('exposes all 21 experiments (7 PhET practice + 14 custom graded)', () => {
    expect(allExperiments).toHaveLength(21);
    expect(allExperiments.filter((e) => e.simulationType === 'phet')).toHaveLength(7);
    expect(allExperiments.filter((e) => e.simulationType === 'custom')).toHaveLength(14);
  });

  it('resolves experiments by slug and rejects unknown slugs', () => {
    const titration = getExperimentBySlug('acid-base-titration');
    expect(titration?.id).toBe('exp_acid_base_titration');
    expect(titration?.isActive).toBe(true);
    expect(getExperimentBySlug('does-not-exist')).toBeUndefined();
  });

  it('every active experiment has a non-empty procedure with positive maxMarks', () => {
    for (const exp of allExperiments.filter((e) => e.isActive)) {
      expect(exp.procedure.length).toBeGreaterThan(0);
      for (const step of exp.procedure) {
        expect(step.maxMarks).toBeGreaterThan(0);
      }
    }
  });
});
