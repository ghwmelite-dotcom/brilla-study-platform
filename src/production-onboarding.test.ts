import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

describe('production student onboarding', () => {
  it('builds production Pages with Counselor Brie automatic onboarding enabled', () => {
    const productionEnvironment = readFileSync(
      new URL('../.env.production', import.meta.url),
      'utf8',
    );

    expect(productionEnvironment).toMatch(
      /^VITE_COUNSELOR_BRIE_ENABLED=true\r?$/m,
    );
  });
});
