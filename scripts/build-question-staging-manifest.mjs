import { mkdir, readFile, writeFile } from 'node:fs/promises';
import { dirname, resolve } from 'node:path';
import { buildStagingManifest } from './question-content-lib.mjs';

const [input, output] = process.argv.slice(2);
if (!input || !output) {
  console.error('Usage: node scripts/build-question-staging-manifest.mjs <batch.json> <output.json>');
  process.exit(2);
}
const batch = JSON.parse(await readFile(resolve(input), 'utf8'));
const manifest = buildStagingManifest(batch);
const outputPath = resolve(output);
await mkdir(dirname(outputPath), { recursive: true });
await writeFile(outputPath, `${JSON.stringify(manifest, null, 2)}\n`, 'utf8');
console.log(`Built ${outputPath} (${manifest.subjects.length} subjects)`);
