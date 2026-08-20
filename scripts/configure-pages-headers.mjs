import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

export const PRODUCTION_API_ORIGIN = 'https://brilla-api.ghwmelite.workers.dev';
export const STAGING_API_ORIGIN = 'https://brilla-api-staging.ghwmelite.workers.dev';

const ALLOWED_API_ORIGINS = new Set([PRODUCTION_API_ORIGIN, STAGING_API_ORIGIN]);

export function resolvePagesApiOrigin(configuredUrl) {
  const value = configuredUrl?.trim();
  if (!value || value.startsWith('/')) return PRODUCTION_API_ORIGIN;

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_URL must be an absolute HTTPS URL or a relative path');
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('VITE_API_URL must use HTTPS and must not contain credentials');
  }
  if (!ALLOWED_API_ORIGINS.has(url.origin)) {
    throw new Error(`Refusing to add unapproved API origin to Pages CSP: ${url.origin}`);
  }
  return url.origin;
}

export function configurePagesHeaders(source, configuredUrl) {
  const apiOrigin = resolvePagesApiOrigin(configuredUrl);
  const canonicalCount = source.split(PRODUCTION_API_ORIGIN).length - 1;
  if (canonicalCount !== 2) {
    throw new Error(`Expected exactly 2 canonical API origins in dist/_headers, found ${canonicalCount}`);
  }

  const output = source.replaceAll(PRODUCTION_API_ORIGIN, apiOrigin);
  const targetCount = output.split(apiOrigin).length - 1;
  if (targetCount !== 2) {
    throw new Error(`Expected exactly 2 target API origins in dist/_headers, found ${targetCount}`);
  }
  if (apiOrigin !== PRODUCTION_API_ORIGIN && output.includes(PRODUCTION_API_ORIGIN)) {
    throw new Error('Staging Pages CSP still contains the production API origin');
  }
  return { output, apiOrigin };
}

async function main() {
  const headersUrl = new URL('../dist/_headers', import.meta.url);
  const source = await readFile(headersUrl, 'utf8');
  const { output, apiOrigin } = configurePagesHeaders(source, process.env.VITE_API_URL);
  if (output !== source) await writeFile(headersUrl, output, 'utf8');
  console.log(`Pages CSP API origin: ${apiOrigin}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
