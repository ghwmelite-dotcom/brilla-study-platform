// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth store persistence hydration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    localStorage.clear();
  });

  it('restores the persisted session and marks hydration complete', async () => {
    localStorage.setItem('brilla-auth', JSON.stringify({
      state: {
        user: {
          id: 'student-1',
          email: 'student@example.com',
          name: 'Student',
          role: 'student',
          status: 'approved',
        },
        token: 'persisted-token',
        isAuthenticated: true,
      },
      version: 3,
    }));

    const { useAuthStore } = await import('../authStore');
    await vi.waitFor(() => {
      expect(useAuthStore.getState().hasHydrated).toBe(true);
    });

    const state = useAuthStore.getState();
    expect(state.isAuthenticated).toBe(true);
    expect(state.token).toBe('persisted-token');
    expect(localStorage.getItem('brilla_token')).toBe('persisted-token');
  });
});
