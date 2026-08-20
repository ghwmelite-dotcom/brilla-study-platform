import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import worker, { type Env } from '../index';

const deployments = JSON.parse(
  readFileSync(new URL('../../../config/deployments.json', import.meta.url), 'utf8'),
) as { staging: { pagesOrigin: string } };
const configuredOrigin = deployments.staging.pagesOrigin;

const wranglerToml = readFileSync(new URL('../../../wrangler.toml', import.meta.url), 'utf8');
const stagingVars = wranglerToml
  .split('[env.staging.vars]')[1]
  ?.split(/\r?\n\[/, 1)[0] ?? '';
const env = {
  APP_URL: configuredOrigin,
  ENVIRONMENT: 'staging',
} as unknown as Env;

describe('staging CORS boundary', () => {
  it('allows the configured staging app origin', async () => {
    const response = await worker.fetch(
      new Request('http://worker.test/not-found', {
        headers: { Origin: configuredOrigin },
      }),
      env,
    );

    expect(response.headers.get('Access-Control-Allow-Origin')).toBe(configuredOrigin);
  });

  it('pins Google OAuth to the staging callback instead of production', () => {
    expect(stagingVars).toContain(
      `GOOGLE_REDIRECT_URI = "${configuredOrigin}/oauth/callback"`,
    );
    expect(stagingVars).not.toContain('GOOGLE_REDIRECT_URI = "https://brillaprep.org/oauth/callback"');
  });

  it('does not reflect an unconfigured origin', async () => {
    const response = await worker.fetch(
      new Request('http://worker.test/not-found', {
        headers: { Origin: 'https://untrusted.example' },
      }),
      env,
    );

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });

  for (const productionOrigin of ['https://brillaprep.org', 'https://www.brillaprep.org']) {
    it(`rejects normal and preflight requests from ${productionOrigin}`, async () => {
      for (const request of [
        new Request('http://worker.test/not-found', {
          headers: { Origin: productionOrigin },
        }),
        new Request('http://worker.test/not-found', {
          method: 'OPTIONS',
          headers: {
            Origin: productionOrigin,
            'Access-Control-Request-Method': 'GET',
          },
        }),
      ]) {
        const response = await worker.fetch(request, env);
        expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
      }
    });
  }
});
