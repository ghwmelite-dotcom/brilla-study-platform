// @vitest-environment jsdom

import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

describe('auth store persistence hydration', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
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

  it('does not erase a valid legacy token when the Zustand record is missing', async () => {
    localStorage.setItem('brilla_token', 'legacy-token');

    const { useAuthStore } = await import('../authStore');
    await vi.waitFor(() => {
      expect(useAuthStore.getState().hasHydrated).toBe(true);
    });

    expect(useAuthStore.getState().token).toBe('legacy-token');
    expect(localStorage.getItem('brilla_token')).toBe('legacy-token');
  });

  it('rebuilds authenticated UI state from a valid server session', async () => {
    localStorage.setItem('brilla_token', 'legacy-token');
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({
        success: true,
        data: {
          id: 'admin-1',
          email: 'admin@example.com',
          name: 'Administrator',
          role: 'admin',
          status: 'approved',
          xpPoints: 25,
          level: 2,
          streakDays: 3,
          aiGradingCredits: 10,
          emailVerified: 1,
          isActive: 1,
          passwordSet: true,
          createdAt: '2026-08-01T00:00:00.000Z',
          updatedAt: '2026-08-29T00:00:00.000Z',
        },
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    const { useAuthStore } = await import('../authStore');
    await vi.waitFor(() => {
      expect(useAuthStore.getState().hasHydrated).toBe(true);
    });

    await useAuthStore.getState().restoreSession();

    const state = useAuthStore.getState();
    expect(state.hasRestoredSession).toBe(true);
    expect(state.isAuthenticated).toBe(true);
    expect(state.user).toMatchObject({
      id: 'admin-1',
      role: 'admin',
      status: 'approved',
      isActive: true,
    });
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/auth/me'),
      expect.objectContaining({
        headers: expect.objectContaining({ Authorization: 'Bearer legacy-token' }),
      }),
    );
  });

  it('keeps the hydrated session during a transient bootstrap failure', async () => {
    localStorage.setItem('brilla-auth', JSON.stringify({
      state: {
        user: {
          id: 'student-1',
          email: 'student@example.com',
          name: 'Student',
          role: 'student',
          status: 'approved',
          isActive: true,
        },
        token: 'persisted-token',
        isAuthenticated: true,
      },
      version: 3,
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(
      new Response(JSON.stringify({ success: false, error: 'Temporary failure' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }),
    ));

    const { useAuthStore } = await import('../authStore');
    await vi.waitFor(() => {
      expect(useAuthStore.getState().hasHydrated).toBe(true);
    });

    await useAuthStore.getState().restoreSession();

    expect(useAuthStore.getState()).toMatchObject({
      token: 'persisted-token',
      isAuthenticated: true,
      hasRestoredSession: true,
      isRestoringSession: false,
    });
    expect(localStorage.getItem('brilla_token')).toBe('persisted-token');
  });
});
