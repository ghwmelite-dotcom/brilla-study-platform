// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('API 401 session handling', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
    window.history.replaceState({}, '', '/login');
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    localStorage.clear();
  });

  it('does not erase persisted auth when an unauthenticated request receives 401', async () => {
    localStorage.setItem('brilla-auth', 'persisted-session');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    const { api } = await import('../api');
    const response = await api.get('/protected');

    expect(response).toEqual({ success: false, error: 'Authentication is required.' });
    expect(localStorage.getItem('brilla-auth')).toBe('persisted-session');
  });

  it('clears persisted auth when the server rejects a bearer token', async () => {
    localStorage.setItem('brilla_token', 'expired-token');
    localStorage.setItem('brilla-auth', 'persisted-session');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    const { api } = await import('../api');
    const response = await api.get('/protected');

    expect(response).toEqual({ success: false, error: 'Your session has expired. Please sign in again.' });
    expect(localStorage.getItem('brilla_token')).toBeNull();
    expect(localStorage.getItem('brilla-auth')).toBeNull();
  });
});
