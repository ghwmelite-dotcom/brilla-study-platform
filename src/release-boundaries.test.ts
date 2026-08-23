import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';

const appSource = readFileSync(
  fileURLToPath(new URL('./App.tsx', import.meta.url)),
  'utf8',
);

describe('public release boundaries', () => {
  it('keeps the unverified BRIIE token launch out of the public router', () => {
    expect(appSource).not.toContain("import('@/pages/BriieToken')");
    expect(appSource).not.toMatch(/<Route\s+path=["']\/briie["']/);
  });

  it('keeps emailed password-reset links on a dedicated public route', () => {
    expect(appSource).toContain("import('@/pages/ResetPasswordPage')");
    expect(appSource).toMatch(/<Route path="\/reset-password"/);
  });
});
