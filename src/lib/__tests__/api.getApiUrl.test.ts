// @vitest-environment jsdom

import { describe, expect, it } from 'vitest';

import { getApiUrl } from '../api';

describe('getApiUrl', () => {
  it('strips a leading /api prefix before joining the base URL', () => {
    expect(getApiUrl('/api/tutor/chat')).toBe(`${window.location.origin}/api/tutor/chat`);
  });

  it('leaves /api segments deeper in the path intact', () => {
    expect(getApiUrl('/api/items/api')).toBe(`${window.location.origin}/api/items/api`);
  });

  it('leaves paths without an /api prefix untouched', () => {
    expect(getApiUrl('/health')).toBe(`${window.location.origin}/api/health`);
  });

  it('returns the base URL when no path is given', () => {
    expect(getApiUrl()).toBe('/api');
  });
});
