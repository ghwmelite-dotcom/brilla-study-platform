import { readFile } from 'node:fs/promises';
import { ESLint } from 'eslint';

// Hard budget for @typescript-eslint/no-explicit-any in workers/ production
// code (test files are excluded — the ratchet targets production type safety).
// CI runs this script; `npm run lint` stays fast and warning-only locally.
// Lower the baseline in scripts/any-baseline.json as a deliberate edit when
// the count drops; never raise it except to land an audited exception.

const baselinePath = new URL('./any-baseline.json', import.meta.url);
const baseline = JSON.parse(await readFile(baselinePath, 'utf8'));

const eslint = new ESLint();
const results = await eslint.lintFiles(['workers/**/*.ts']);

let count = 0;
for (const result of results) {
  if (result.filePath.endsWith('.test.ts')) continue;
  for (const message of result.messages) {
    if (message.ruleId === '@typescript-eslint/no-explicit-any') count += 1;
  }
}

if (count > baseline.count) {
  console.error(
    `no-explicit-any budget exceeded: ${count} violations in workers/ ` +
      `production code; baseline is ${baseline.count}. ` +
      `Fix the new violations instead of raising the baseline.`,
  );
  process.exit(1);
}

console.log(
  `no-explicit-any budget OK: ${count}/${baseline.count} violations in workers/ production code` +
    (count < baseline.count
      ? ` — count dropped below baseline, consider lowering scripts/any-baseline.json to ${count}`
      : ''),
);
