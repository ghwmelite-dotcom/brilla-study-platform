import { describe, expect, it } from 'vitest';
import worker, { type Env } from '../index';

const configuredOrigin = 'https://whiteboard-staging.brilla-study-platform.pages.dev';

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

  it('does not reflect an unconfigured origin', async () => {
    const response = await worker.fetch(
      new Request('http://worker.test/not-found', {
        headers: { Origin: 'https://untrusted.example' },
      }),
      env,
    );

    expect(response.headers.get('Access-Control-Allow-Origin')).toBeNull();
  });
});
