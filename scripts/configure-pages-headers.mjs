import { readFileSync } from 'node:fs';
import { readFile, writeFile } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const deploymentConfig = JSON.parse(
  readFileSync(new URL('../config/deployments.json', import.meta.url), 'utf8'),
);

export const PRODUCTION_API_ORIGIN = deploymentConfig.production.apiOrigin;
export const STAGING_API_ORIGIN = deploymentConfig.staging.apiOrigin;
export const EXPECTED_API_ORIGIN_REFERENCES = 2;


export function resolvePagesApiOrigin(configuredUrl, deploymentTarget) {
  if (deploymentTarget !== 'production' && deploymentTarget !== 'staging') {
    throw new Error('VITE_DEPLOYMENT_TARGET must be explicitly set to production or staging');
  }

  const expectedOrigin = deploymentTarget === 'staging'
    ? STAGING_API_ORIGIN
    : PRODUCTION_API_ORIGIN;
  const value = configuredUrl?.trim();
  if (!value || value.startsWith('/')) {
    throw new Error(`${deploymentTarget} builds require an explicit absolute VITE_API_URL`);
  }

  let url;
  try {
    url = new URL(value);
  } catch {
    throw new Error('VITE_API_URL must be an absolute HTTPS URL');
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    throw new Error('VITE_API_URL must use HTTPS and must not contain credentials');
  }
  const expectedBase = `${expectedOrigin}/api`;
  if (url.href !== expectedBase) {
    throw new Error(
      `VITE_API_URL must exactly match ${expectedBase} for deployment target ${deploymentTarget}`,
    );
  }
  return url.origin;
}

export function configurePagesHeaders(source, configuredUrl, deploymentTarget) {
  const apiOrigin = resolvePagesApiOrigin(configuredUrl, deploymentTarget);
  const canonicalCount = source.split(PRODUCTION_API_ORIGIN).length - 1;
  if (canonicalCount !== EXPECTED_API_ORIGIN_REFERENCES) {
    throw new Error(
      `Expected exactly ${EXPECTED_API_ORIGIN_REFERENCES} canonical API origins in dist/_headers, found ${canonicalCount}`,
    );
  }

  const output = source.replaceAll(PRODUCTION_API_ORIGIN, apiOrigin);
  const targetCount = output.split(apiOrigin).length - 1;
  if (targetCount !== EXPECTED_API_ORIGIN_REFERENCES) {
    throw new Error(
      `Expected exactly ${EXPECTED_API_ORIGIN_REFERENCES} target API origins in dist/_headers, found ${targetCount}`,
    );
  }
  if (apiOrigin !== PRODUCTION_API_ORIGIN && output.includes(PRODUCTION_API_ORIGIN)) {
    throw new Error('Staging Pages CSP still contains the production API origin');
  }
  return { output, apiOrigin };
}

async function main() {
  const deploymentTarget = process.env.VITE_DEPLOYMENT_TARGET;
  const configuredUrl = process.env.VITE_API_URL;
  const apiOrigin = resolvePagesApiOrigin(configuredUrl, deploymentTarget);
  if (process.argv.includes('--check')) {
    console.log(`Pages build target verified: ${deploymentTarget} -> ${configuredUrl}`);
    return;
  }

  const headersUrl = new URL('../dist/_headers', import.meta.url);
  const source = await readFile(headersUrl, 'utf8');
  const { output } = configurePagesHeaders(
    source,
    configuredUrl,
    deploymentTarget,
  );
  if (output !== source) await writeFile(headersUrl, output, 'utf8');
  console.log(`Pages CSP API origin: ${apiOrigin}`);
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  await main();
}
