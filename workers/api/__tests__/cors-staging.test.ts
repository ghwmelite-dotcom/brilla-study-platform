import { readFileSync } from 'node:fs';
import { describe, expect, it, vi } from 'vitest';
import worker, { resolveRegistrationRateLimitIdentifier, type Env } from '../index';

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

describe('staging deployment target proof', () => {
  const nonce = 'qa-sentinel-0123456789abcdef';

  function sentinelDb(found: boolean) {
    return {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(found ? { verified: 1 } : null),
        })),
      })),
    } as unknown as D1Database;
  }

  it('is absent outside staging before touching D1', async () => {
    const db = sentinelDb(true);
    const response = await worker.fetch(
      new Request(`http://worker.test/api/health/staging-target/${nonce}`),
      { DB: db, ENVIRONMENT: 'production' } as unknown as Env,
    );

    expect(response.status).toBe(404);
    expect(db.prepare).not.toHaveBeenCalled();
  });

  it('verifies only a nonce present through the deployed staging binding', async () => {
    for (const [found, expectedStatus] of [[true, 200], [false, 404]] as const) {
      const response = await worker.fetch(
        new Request(`http://worker.test/api/health/staging-target/${nonce}`),
        { DB: sentinelDb(found), ENVIRONMENT: 'staging' } as unknown as Env,
      );
      expect(response.status).toBe(expectedStatus);
      const body = await response.json() as { success: boolean; data?: { verified: boolean } };
      expect(body.success).toBe(found);
      if (found) expect(body.data?.verified).toBe(true);
    }
  });

  it('rejects malformed nonces before touching D1', async () => {
    const db = sentinelDb(true);
    const response = await worker.fetch(
      new Request('http://worker.test/api/health/staging-target/not-a-sentinel'),
      { DB: db, ENVIRONMENT: 'staging' } as unknown as Env,
    );

    expect(response.status).toBe(404);
    expect(db.prepare).not.toHaveBeenCalled();
  });
});

describe('staging QA registration rate-limit isolation', () => {
  const nonce = 'qa-sentinel-0123456789abcdef';

  function resolverEnv(environment: string, found: boolean) {
    return { DB: {
      prepare: vi.fn(() => ({
        bind: vi.fn(() => ({
          first: vi.fn().mockResolvedValue(found ? { verified: 1 } : null),
        })),
      })),
    }, ENVIRONMENT: environment } as unknown as Env;
  }

  it('uses a run-scoped bucket only for a verified staging sentinel', async () => {
    await expect(resolveRegistrationRateLimitIdentifier(
      resolverEnv('staging', true), '203.0.113.1', nonce,
    )).resolves.toBe(`qa:${nonce}`);
  });

  it('falls back to the real client IP for missing sentinels and production', async () => {
    await expect(resolveRegistrationRateLimitIdentifier(
      resolverEnv('staging', false), '203.0.113.2', nonce,
    )).resolves.toBe('203.0.113.2');
    const productionEnv = resolverEnv('production', true);
    await expect(resolveRegistrationRateLimitIdentifier(
      productionEnv, '203.0.113.3', nonce,
    )).resolves.toBe('203.0.113.3');
    expect(productionEnv.DB.prepare).not.toHaveBeenCalled();
  });
});
