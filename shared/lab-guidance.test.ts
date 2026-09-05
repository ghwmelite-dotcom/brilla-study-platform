import { describe, expect, it } from 'vitest';
import { allExperiments } from './experiments';
import { getStepGuidance, labGuidance } from './lab-guidance';

describe('lab guidance corpus', () => {
  it('covers every procedure step of every experiment with a hint and a why', () => {
    const missing: string[] = [];
    for (const experiment of allExperiments) {
      for (const step of experiment.procedure) {
        const guidance = getStepGuidance(experiment, step.stepNumber);
        if (!guidance?.hint) missing.push(`${experiment.slug}#${step.stepNumber} hint`);
        if (!guidance?.why) missing.push(`${experiment.slug}#${step.stepNumber} why`);
      }
    }
    expect(missing).toEqual([]);
  });

  it('keeps guidance slugs in sync with the experiment catalog', () => {
    const catalog = new Set(allExperiments.map((e) => e.slug));
    for (const slug of Object.keys(labGuidance)) {
      expect(catalog.has(slug), `guidance for unknown slug ${slug}`).toBe(true);
    }
  });

  it('hints stay short and plain (max 2 sentences, no markdown)', () => {
    for (const [slug, steps] of Object.entries(labGuidance)) {
      for (const [step, guidance] of Object.entries(steps)) {
        const label = `${slug}#${step}`;
        expect(guidance.hint.length, label).toBeGreaterThan(20);
        expect(guidance.why.length, label).toBeGreaterThan(20);
        expect(guidance.hint.includes('\n'), label).toBe(false);
        expect(guidance.why.includes('\n'), label).toBe(false);
        expect(guidance.hint.includes('#'), label).toBe(false);
        const sentences = guidance.hint.match(/[.!?](\s|$)/g) ?? [];
        expect(sentences.length, label).toBeLessThanOrEqual(3);
      }
    }
  });

  it('inline step hints win over the corpus (no clobbering)', () => {
    const experiment = allExperiments.find((e) =>
      e.procedure.some((s) => s.hint),
    );
    expect(experiment).toBeTruthy();
    const step = experiment!.procedure.find((s) => s.hint)!;
    expect(getStepGuidance(experiment!, step.stepNumber)?.hint).toBe(step.hint);
  });
});
