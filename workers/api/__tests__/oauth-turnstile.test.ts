import { describe, expect, it, vi } from 'vitest';
import { oauthApp } from '../oauth';

describe('OAuth initiation Turnstile gate', () => {
  it('fails closed before writing OAuth state when Turnstile is configured but missing', async () => {
    const DB = {
      prepare: vi.fn(),
    } as unknown as D1Database;

    const response = await oauthApp.fetch(new Request('http://x/google/init', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ intent: 'login' }),
    }), {
      DB,
      JWT_SECRET: 'test-secret',
      ENVIRONMENT: 'test',
      GOOGLE_CLIENT_ID: 'client-id',
      GOOGLE_CLIENT_SECRET: 'client-secret',
      TURNSTILE_SECRET: 'turnstile-secret',
    });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({ error: 'Security verification required.' });
    expect(DB.prepare).not.toHaveBeenCalled();
  });
});
