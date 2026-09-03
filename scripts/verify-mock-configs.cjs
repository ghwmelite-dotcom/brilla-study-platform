/**
 * Mock-config gate: every paperId referenced by mockExamConfigs in
 * src/pages/MockExams.tsx must exist in past_papers. Runs against the same
 * in-memory node:sqlite DB shape as scripts/verify-db.cjs (schema.sql +
 * seed.sql — zero deps, no wrangler). A stale config fails loudly here
 * instead of 404ing a student on the paper page.
 *
 * Exit 0 = all configs resolve. Exit 1 = missing paper IDs or unreadable
 * config source.
 */
const { DatabaseSync } = require('node:sqlite');
const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const source = fs.readFileSync(path.join(ROOT, 'src', 'pages', 'MockExams.tsx'), 'utf8');

const paperIds = [...new Set(
  [...source.matchAll(/paperId:\s*'([^']+)'/g)].map((m) => m[1]),
)];
if (paperIds.length === 0) {
  console.error('verify-mock-configs: no paperId entries found — did MockExams.tsx change shape?');
  process.exit(1);
}

const db = new DatabaseSync(':memory:');
try {
  db.exec(fs.readFileSync(path.join(ROOT, 'database', 'schema.sql'), 'utf8'));
  db.exec(fs.readFileSync(path.join(ROOT, 'database', 'seed.sql'), 'utf8'));

  const stmt = db.prepare('SELECT 1 AS found FROM past_papers WHERE id = ?');
  const missing = paperIds.filter((id) => !stmt.get(id));

  if (missing.length > 0) {
    console.error(`verify-mock-configs: ${missing.length} mock paper ID(s) do not exist in past_papers:`);
    for (const id of missing) console.error(`  - ${id}`);
    process.exit(1);
  }
  console.log(`verify-mock-configs: all ${paperIds.length} mock paper IDs resolve.`);
} finally {
  db.close();
}
