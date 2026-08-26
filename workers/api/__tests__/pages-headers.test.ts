import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import {
  configurePagesHeaders,
  PRODUCTION_API_ORIGIN,
  resolvePagesApiOrigin,
  STAGING_API_ORIGIN,
} from '../../../scripts/configure-pages-headers.mjs';

const deployments = JSON.parse(
  readFileSync(new URL('../../../config/deployments.json', import.meta.url), 'utf8'),
) as {
  production: { apiOrigin: string; pagesOrigin: string; database: string; databaseId: string };
  staging: { apiOrigin: string; pagesOrigin: string; database: string; databaseId: string };
};
const wranglerConfig = readFileSync(new URL('../../../wrangler.toml', import.meta.url), 'utf8');
const pagesHeaders = readFileSync(new URL('../../../public/_headers', import.meta.url), 'utf8');

const template = `Content-Security-Policy: img-src 'self' ${PRODUCTION_API_ORIGIN}; connect-src 'self' ${PRODUCTION_API_ORIGIN};`;

describe('Pages CSP API-origin generation', () => {
  it('keeps the canonical production origin only for the exact production API base', () => {
    expect(resolvePagesApiOrigin(`${PRODUCTION_API_ORIGIN}/api`, 'production')).toBe(PRODUCTION_API_ORIGIN);
    expect(configurePagesHeaders(template, `${PRODUCTION_API_ORIGIN}/api`, 'production').output)
      .toBe(template);
  });

  it('generates a staging-only CSP from the configured staging API URL', () => {
    const { output, apiOrigin } = configurePagesHeaders(`${template}\n`, `${STAGING_API_ORIGIN}/api`, 'staging');
    expect(apiOrigin).toBe(STAGING_API_ORIGIN);
    expect(output).not.toContain(PRODUCTION_API_ORIGIN);
    expect(output.split(STAGING_API_ORIGIN)).toHaveLength(3);
  });

  it('fails closed for insecure or unapproved origins', () => {
    expect(() => resolvePagesApiOrigin('http://brilla-api-staging.ghwmelite.workers.dev/api', 'staging'))
      .toThrow(/HTTPS/);
    expect(() => resolvePagesApiOrigin('https://example.com/api', 'production'))
      .toThrow(/must exactly match/);
    expect(() => resolvePagesApiOrigin(`${PRODUCTION_API_ORIGIN}/wrong`, 'production'))
      .toThrow(/must exactly match/);
  });

  it('fails closed when the target is absent or does not match the API origin', () => {
    expect(() => resolvePagesApiOrigin(undefined, undefined)).toThrow(/explicitly set/);
    expect(() => resolvePagesApiOrigin(undefined, 'production')).toThrow(/explicit absolute VITE_API_URL/);
    expect(() => resolvePagesApiOrigin('/api', 'production')).toThrow(/explicit absolute VITE_API_URL/);
    expect(() => resolvePagesApiOrigin(undefined, 'staging')).toThrow(/explicit absolute VITE_API_URL/);
    expect(() => resolvePagesApiOrigin(PRODUCTION_API_ORIGIN, 'staging'))
      .toThrow(/must exactly match/);
  });

  it('fails when the copied header template drifts from the expected shape', () => {
    expect(() => configurePagesHeaders('Content-Security-Policy: default-src self', `${PRODUCTION_API_ORIGIN}/api`, 'production'))
      .toThrow(/exactly 2 canonical API origins/);
  });

  it('keeps the deployment manifest aligned with Wrangler bindings', () => {
    expect(PRODUCTION_API_ORIGIN).toBe(deployments.production.apiOrigin);
    expect(STAGING_API_ORIGIN).toBe(deployments.staging.apiOrigin);
    for (const value of [
      deployments.production.pagesOrigin,
      deployments.production.database,
      deployments.production.databaseId,
      deployments.staging.pagesOrigin,
      deployments.staging.database,
      deployments.staging.databaseId,
    ]) {
      expect(wranglerConfig).toContain(value);
    }
    expect(deployments.staging.database).not.toBe(deployments.production.database);
    expect(deployments.staging.databaseId).not.toBe(deployments.production.databaseId);
  });
});

describe('Pages CSP Cloudflare Web Analytics policy', () => {
  const csp = pagesHeaders.match(/^\s*Content-Security-Policy:\s*(.+)$/m)?.[1];

  it('allows the automatically injected analytics script and same-origin beacon endpoint', () => {
    expect(csp).toBeDefined();

    const scriptSrc = csp?.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1].split(/\s+/);
    const connectSrc = csp?.match(/(?:^|;)\s*connect-src\s+([^;]+)/)?.[1].split(/\s+/);

    expect(scriptSrc).toEqual([
      "'self'",
      'https://challenges.cloudflare.com',
      'https://static.cloudflareinsights.com',
    ]);
    expect(connectSrc).toEqual([
      "'self'",
      PRODUCTION_API_ORIGIN,
      'https://challenges.cloudflare.com',
    ]);
  });

  it('does not weaken script or connection policy with broad allowances', () => {
    expect(csp).toBeDefined();

    const scriptSrc = csp?.match(/(?:^|;)\s*script-src\s+([^;]+)/)?.[1].split(/\s+/);
    const connectSrc = csp?.match(/(?:^|;)\s*connect-src\s+([^;]+)/)?.[1].split(/\s+/);

    expect(scriptSrc).not.toContain("'unsafe-inline'");
    expect(scriptSrc).not.toContain("'unsafe-eval'");
    expect(scriptSrc?.some((value) => value === 'https:' || value.includes('*'))).toBe(false);
    expect(connectSrc?.some((value) => value === 'https:' || value.includes('*'))).toBe(false);
  });
});
