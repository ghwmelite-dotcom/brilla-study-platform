// @vitest-environment jsdom

import { beforeEach, describe, expect, it, vi } from 'vitest';

// The stale-state wipe runs at module import, so this lives in its own file
// and imports the store dynamically after seeding localStorage.
describe('labStore version gate', () => {
  beforeEach(() => {
    vi.resetModules();
    localStorage.clear();
  });

  it('wipes v1 localStorage-only sessions instead of migrating them', async () => {
    localStorage.setItem(
      'brilla-lab',
      JSON.stringify({ version: 1, state: { currentSession: { id: 'old' } } }),
    );

    const { useLabStore } = await import('../labStore');

    expect(localStorage.getItem('brilla-lab')).toBeNull();
    expect(useLabStore.getState().currentSession).toBeNull();
  });
});
