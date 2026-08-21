import { readdir, stat } from 'node:fs/promises';
import path from 'node:path';

const assetsDirectory = path.resolve('dist/assets');
const budgets = [
  {
    label: 'JavaScript chunk',
    matches: (name) => name.endsWith('.js'),
    maximumBytes: 600 * 1024,
  },
  {
    label: 'Lucide icon chunk',
    matches: (name) => /^vendor-icons-.*\.js$/.test(name),
    maximumBytes: 200 * 1024,
  },
  {
    label: 'application stylesheet',
    matches: (name) => /^index-.*\.css$/.test(name),
    maximumBytes: 350 * 1024,
  },
];

const files = await readdir(assetsDirectory);
const failures = [];

for (const budget of budgets) {
  const matchingFiles = files.filter(budget.matches);
  if (matchingFiles.length === 0) {
    failures.push(`${budget.label}: no matching build artifact found`);
    continue;
  }

  for (const fileName of matchingFiles) {
    const size = (await stat(path.join(assetsDirectory, fileName))).size;
    if (size > budget.maximumBytes) {
      failures.push(
        `${budget.label} ${fileName} is ${(size / 1024).toFixed(1)} KiB; ` +
          `budget is ${budget.maximumBytes / 1024} KiB`,
      );
    }
  }
}

if (failures.length > 0) {
  throw new Error(`Bundle budget failed:\n- ${failures.join('\n- ')}`);
}

console.log('Bundle budgets verified: JS <= 600 KiB, icons <= 200 KiB, CSS <= 350 KiB');
