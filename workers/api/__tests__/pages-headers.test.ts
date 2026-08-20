import { describe, expect, it } from 'vitest';
import {
  configurePagesHeaders,
  PRODUCTION_API_ORIGIN,
  resolvePagesApiOrigin,
  STAGING_API_ORIGIN,
} from '../../../scripts/configure-pages-headers.mjs';

const template = `Content-Security-Policy: img-src 'self' ${PRODUCTION_API_ORIGIN}; connect-src 'self' ${PRODUCTION_API_ORIGIN};`;

describe('Pages CSP API-origin generation', () => {
  it('keeps the canonical production origin for unset and relative API URLs', () => {
    expect(resolvePagesApiOrigin(undefined)).toBe(PRODUCTION_API_ORIGIN);
    expect(resolvePagesApiOrigin('/api')).toBe(PRODUCTION_API_ORIGIN);
    expect(configurePagesHeaders(template, undefined).output).toBe(template);
  });

  it('generates a staging-only CSP from the configured staging API URL', () => {
    const { output, apiOrigin } = configurePagesHeaders(`${template}\n`, `${STAGING_API_ORIGIN}/api`);
    expect(apiOrigin).toBe(STAGING_API_ORIGIN);
    expect(output).not.toContain(PRODUCTION_API_ORIGIN);
    expect(output.split(STAGING_API_ORIGIN)).toHaveLength(3);
  });

  it('fails closed for insecure or unapproved origins', () => {
    expect(() => resolvePagesApiOrigin('http://brilla-api-staging.ghwmelite.workers.dev/api'))
      .toThrow(/HTTPS/);
    expect(() => resolvePagesApiOrigin('https://example.com/api'))
      .toThrow(/unapproved API origin/);
  });

  it('fails when the copied header template drifts from the expected shape', () => {
    expect(() => configurePagesHeaders('Content-Security-Policy: default-src self', undefined))
      .toThrow(/exactly 2 canonical API origins/);
  });
});
