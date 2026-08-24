import { readFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { validateQuestionBatch } from './question-content-lib.mjs';

const args = process.argv.slice(2);
const file = args.find((arg) => !arg.startsWith('--'));
const mode = args.find((arg) => arg.startsWith('--mode='))?.split('=')[1] ?? 'draft';
if (!file || !['draft', 'production'].includes(mode)) {
  console.error('Usage: node scripts/validate-question-batch.mjs <batch.json> [--mode=draft|production]');
  process.exit(2);
}
const batch = JSON.parse(await readFile(resolve(file), 'utf8'));
const result = validateQuestionBatch(batch, { mode });
console.log(JSON.stringify(result, null, 2));
if (!result.valid) process.exit(1);
