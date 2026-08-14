import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

describe('app bootstrap stylesheet activation', () => {
  it('activates preloaded fonts and KaTeX immediately when the deferred script runs', () => {
    const fontLink = { media: 'print' };
    const katexLink = { rel: 'preload' };
    const elements: Record<string, object> = {
      'google-fonts': fontLink,
      'katex-css': katexLink,
    };
    const script = readFileSync(new URL('../../../public/app-bootstrap.js', import.meta.url), 'utf8');

    runInNewContext(script, {
      document: { getElementById: (id: string) => elements[id] ?? null },
      navigator: {},
      window: {},
    });

    expect(fontLink.media).toBe('all');
    expect(katexLink.rel).toBe('stylesheet');
  });
});