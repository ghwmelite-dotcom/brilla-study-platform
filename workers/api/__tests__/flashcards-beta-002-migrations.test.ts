import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '532_flashcards_beta2_part_1.sql',
  '533_flashcards_beta2_part_2.sql',
  '534_flashcards_beta2_part_3.sql',
  '535_flashcards_beta2_part_4.sql',
  '536_flashcards_beta2_part_5.sql',
  '537_flashcards_beta2_counts_guard.sql',
];
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/flashcards-beta-002.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));

const shellDecks = [
  ['deck_sys_topic_geometry', 'subj_nsmq_math', 'topic_geometry'],
  ['deck_sys_topic_quadratic', 'subj_nsmq_math', 'topic_quadratic'],
  ['deck_sys_topic_statistics', 'subj_nsmq_math', 'topic_statistics'],
  ['deck_sys_topic_kinematics', 'subj_nsmq_physics', 'topic_kinematics'],
  ['deck_sys_topic_waves', 'subj_nsmq_physics', 'topic_waves'],
  ['deck_sys_topic_modern_physics', 'subj_nsmq_physics', 'topic_modern_physics'],
  ['deck_sys_topic_bonding', 'subj_nsmq_chemistry', 'topic_bonding'],
  ['deck_sys_topic_organic', 'subj_nsmq_chemistry', 'topic_organic'],
  ['deck_sys_topic_ecology', 'subj_nsmq_biology', 'topic_ecology'],
  ['deck_sys_topic_physiology', 'subj_nsmq_biology', 'topic_physiology'],
];

function createFixture() {
  const db = new Database(':memory:');
  db.pragma('foreign_keys = ON');
  db.exec(`
    CREATE TABLE subjects (id TEXT PRIMARY KEY);
    CREATE TABLE topics (
      id TEXT PRIMARY KEY,
      subject_id TEXT NOT NULL REFERENCES subjects(id)
    );
    CREATE TABLE flashcard_decks (
      id TEXT PRIMARY KEY,
      user_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      subject_id TEXT REFERENCES subjects(id),
      topic_id TEXT REFERENCES topics(id),
      is_public INTEGER DEFAULT 0,
      card_count INTEGER DEFAULT 0,
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now')),
      is_demo_data INTEGER DEFAULT 0,
      expires_at TEXT
    );
    CREATE TABLE flashcards (
      id TEXT PRIMARY KEY,
      deck_id TEXT NOT NULL REFERENCES flashcard_decks(id) ON DELETE CASCADE,
      front TEXT NOT NULL,
      back TEXT NOT NULL,
      image_url TEXT,
      hint TEXT,
      difficulty INTEGER DEFAULT 1 CHECK (difficulty IN (1, 2, 3, 4, 5)),
      created_at TEXT DEFAULT (datetime('now')),
      updated_at TEXT DEFAULT (datetime('now'))
    );
    INSERT INTO subjects(id) VALUES
      ('subj_nsmq_math'), ('subj_nsmq_physics'), ('subj_nsmq_chemistry'), ('subj_nsmq_biology');
  `);
  const insertTopic = db.prepare('INSERT INTO topics(id, subject_id) VALUES (?, ?)');
  const insertDeck = db.prepare(`
    INSERT INTO flashcard_decks(id, name, subject_id, topic_id, is_public, card_count)
    VALUES (?, ?, ?, ?, 1, 0)
  `);
  for (const [deckId, subjectId, topicId] of shellDecks) {
    insertTopic.run(topicId, subjectId);
    insertDeck.run(deckId, `${topicId} deck`, subjectId, topicId);
  }
  return db;
}

describe('flashcards-beta-002 migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-flashcards-beta2-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-flashcard-bank-002.mjs'), '--output-root', temporaryRoot,
      ], { cwd: repoRoot, stdio: 'pipe' });
      for (const relativePath of artifactRelativePaths) {
        expect(readFileSync(join(temporaryRoot, relativePath), 'utf8'))
          .toBe(readFileSync(join(repoRoot, relativePath), 'utf8'));
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('loads 100 original cards across 10 shells and remains idempotent', () => {
    const db = createFixture();
    for (const migration of migrations) db.exec(migration);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b002_%'
    `).get()).toEqual({ count: 100 });
    // Every one of the 10 target shells holds exactly 10 cards and its static
    // card_count was reconciled to the actual row count by the final migration.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks d
      WHERE d.card_count = 10
        AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10
        AND d.id LIKE 'deck_sys_topic_%'
    `).get()).toEqual({ count: 10 });
    // Field caps and difficulty range mirror workers/api/flashcard-decks.ts.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards
      WHERE id LIKE 'fc_b002_%'
        AND length(front) BETWEEN 1 AND 1000
        AND length(back) BETWEEN 1 AND 2000
        AND (hint IS NULL OR length(hint) <= 500)
        AND difficulty BETWEEN 1 AND 5
    `).get()).toEqual({ count: 100 });
    // No duplicate normalised fronts across the whole flashcards table.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM (
        SELECT lower(trim(front)) normalized FROM flashcards
        GROUP BY normalized HAVING COUNT(*) > 1
      )
    `).get()).toEqual({ count: 0 });
    expect(db.pragma('foreign_key_check')).toEqual([]);

    for (const migration of migrations) db.exec(migration);
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b002_%'
    `).get()).toEqual({ count: 100 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks WHERE card_count = 10
    `).get()).toEqual({ count: 10 });
    expect(db.pragma('foreign_key_check')).toEqual([]);
    db.close();
  });

  it('fails the final guard when a content part is missing', () => {
    const db = createFixture();
    migrations.forEach((migration, index) => {
      if (index !== 2 && index !== migrations.length - 1) db.exec(migration);
    });
    expect(() => db.exec(migrations.at(-1)!)).toThrow();
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b002_%'
    `).get()).toEqual({ count: 76 });
    db.close();
  });

  it('marks the batch automated-beta with non-official provenance in the JSON artifact', () => {
    const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8'));
    expect(batch.batchId).toBe('flashcards-beta-002');
    expect(batch.decks).toHaveLength(10);
    expect(batch.decks.every((deck: { cards: unknown[] }) => deck.cards.length === 10)).toBe(true);
    expect(batch.release).toMatchObject({
      channel: 'beta',
      officialExamBoardContent: false,
      feedbackEnabled: true,
    });
    expect(batch.release.contentLabel).toContain('not official WAEC, NaCCA or NSMQ material');
    expect(batch.provenance.every((source: { use: string }) => source.use === 'curriculum_blueprint_only')).toBe(true);
    const fronts = new Set<string>();
    for (const deck of batch.decks) {
      for (const item of deck.cards) {
        const key = item.front.trim().toLowerCase();
        expect(fronts.has(key)).toBe(false);
        fronts.add(key);
      }
    }
    expect(fronts.size).toBe(100);
  });

  it('does not duplicate any seed or batch-1 card front', () => {
    const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8'));
    const seedSql = readFileSync(join(repoRoot, 'database/seed.sql'), 'utf8');
    const section = seedSql.match(/INSERT INTO "flashcards"[\s\S]*?ON CONFLICT\(id\) DO NOTHING;/)![0];
    const seedFronts = new Set<string>();
    for (const line of section.split('\n')) {
      if (!line.trimStart().startsWith("('fc_")) continue;
      const fields = [...line.matchAll(/'((?:[^']|'')*)'/g)].map((match) => match[1].replaceAll("''", "'"));
      seedFronts.add(fields[2].trim().toLowerCase());
    }
    const batch1 = JSON.parse(readFileSync(join(repoRoot, 'content/batches/flashcards-beta-001.json'), 'utf8'));
    for (const deck of batch1.decks) {
      for (const item of deck.cards) seedFronts.add(item.front.trim().toLowerCase());
    }
    for (const deck of batch.decks) {
      for (const item of deck.cards) {
        expect(seedFronts.has(item.front.trim().toLowerCase())).toBe(false);
      }
    }
  });
});
