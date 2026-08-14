import { readFileSync } from 'node:fs';
import { runInNewContext } from 'node:vm';
import { describe, expect, it } from 'vitest';

describe('app bootstrap stylesheet activation', () => {
  it('activates the preloaded font stylesheet when the deferred script runs', () => {
    const fontLink = { media: 'print' };
    const script = readFileSync(new URL('../../../public/app-bootstrap.js', import.meta.url), 'utf8');

    runInNewContext(script, {
      document: { getElementById: (id: string) => id === 'google-fonts' ? fontLink : null },
      navigator: {},
      window: {},
    });

    expect(fontLink.media).toBe('all');
  });

  it('self-hosts KaTeX styles through the application bundle', () => {
    const html = readFileSync(new URL('../../../index.html', import.meta.url), 'utf8');
    const main = readFileSync(new URL('../../main.tsx', import.meta.url), 'utf8');

    expect(html).not.toContain('cdn.jsdelivr.net/npm/katex');
    expect(main).toContain("import 'katex/dist/katex.min.css'");
  });
});
