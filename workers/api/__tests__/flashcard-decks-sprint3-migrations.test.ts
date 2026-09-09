import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '628_flashcard_decks_sprint3_foundation.sql',
  '629_flashcard_decks_sprint3_part_1.sql',
  '630_flashcard_decks_sprint3_part_2.sql',
  '631_flashcard_decks_sprint3_part_3.sql',
  '632_flashcard_decks_sprint3_final_guard.sql',
];
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/flashcard-decks-sprint3-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));

// Prod-canonical shell rows (verified read-only against brilla-db prod:
// card_count = 0 for all five before this batch).
const shellDecks = [
  ['deck_sys_topic_biochemistry', 'subj_wassce_biology', 'topic_biochemistry'],
  ['deck_sys_topic_calculus', 'subj_wassce_core_math', 'topic_calculus'],
  ['deck_sys_topic_electrochemistry', 'subj_wassce_chemistry', 'topic_electrochemistry'],
  ['deck_sys_topic_equilibrium', 'subj_wassce_chemistry', 'topic_equilibrium'],
  ['deck_sys_topic_thermodynamics', 'subj_wassce_physics', 'topic_thermodynamics'],
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
      ('subj_wassce_biology'), ('subj_wassce_core_math'), ('subj_wassce_chemistry'), ('subj_wassce_physics');
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

describe('flashcard-decks-sprint3 migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-flashcards-sprint3-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-flashcard-decks-sprint3-bank.mjs'), '--output-root', temporaryRoot,
      ], { cwd: repoRoot, stdio: 'pipe' });
      for (const relativePath of artifactRelativePaths) {
        expect(readFileSync(join(temporaryRoot, relativePath), 'utf8'))
          .toBe(readFileSync(join(repoRoot, relativePath), 'utf8'));
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('loads 60 original cards across 5 shells and remains idempotent', () => {
    const db = createFixture();
    for (const migration of migrations) db.exec(migration);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_s3_%'
    `).get()).toEqual({ count: 60 });
    // Every one of the 5 target shells holds exactly 12 cards and its static
    // card_count was reconciled to the actual row count by the final migration.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks d
      WHERE d.card_count = 12
        AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 12
        AND d.id IN ('deck_sys_topic_biochemistry', 'deck_sys_topic_calculus',
                     'deck_sys_topic_electrochemistry', 'deck_sys_topic_equilibrium',
                     'deck_sys_topic_thermodynamics')
    `).get()).toEqual({ count: 5 });
    // Field caps and difficulty range mirror workers/api/flashcard-decks.ts.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards
      WHERE id LIKE 'fc_s3_%'
        AND length(front) BETWEEN 1 AND 1000
        AND length(back) BETWEEN 1 AND 2000
        AND (hint IS NULL OR length(hint) <= 500)
        AND difficulty BETWEEN 1 AND 5
    `).get()).toEqual({ count: 60 });
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
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_s3_%'
    `).get()).toEqual({ count: 60 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks WHERE card_count = 12
    `).get()).toEqual({ count: 5 });
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
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_s3_%'
    `).get()).toEqual({ count: 36 });
    db.close();
  });

  it('marks the batch automated-beta with non-official provenance in the JSON artifact', () => {
    const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8'));
    expect(batch.batchId).toBe('flashcard-decks-sprint3-001');
    expect(batch.decks).toHaveLength(5);
    expect(batch.decks.every((deck: { cards: unknown[] }) => deck.cards.length === 12)).toBe(true);
    expect(batch.release).toMatchObject({
      channel: 'beta',
      officialExamBoardContent: false,
      feedbackEnabled: true,
    });
    expect(batch.release.contentLabel).toContain('not official WAEC');
    expect(batch.release.contentLabel).toContain('feedback channel');
    expect(batch.provenance.every((source: { use: string }) => source.use === 'curriculum_blueprint_only')).toBe(true);
    const fronts = new Set<string>();
    for (const deck of batch.decks) {
      for (const item of deck.cards) {
        const key = item.front.trim().toLowerCase();
        expect(fronts.has(key)).toBe(false);
        fronts.add(key);
      }
    }
    expect(fronts.size).toBe(60);
  });

  it('does not duplicate any seed, batch-1 or batch-2 card front', () => {
    const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8'));
    const seedSql = readFileSync(join(repoRoot, 'database/seed.sql'), 'utf8');
    const section = seedSql.match(/INSERT INTO "flashcards"[\s\S]*?ON CONFLICT\(id\) DO NOTHING;/)![0];
    const priorFronts = new Set<string>();
    for (const line of section.split('\n')) {
      if (!line.trimStart().startsWith("('fc_")) continue;
      const fields = [...line.matchAll(/'((?:[^']|'')*)'/g)].map((match) => match[1].replaceAll("''", "'"));
      priorFronts.add(fields[2].trim().toLowerCase());
    }
    for (const priorName of ['flashcards-beta-001', 'flashcards-beta-002']) {
      const prior = JSON.parse(readFileSync(join(repoRoot, `content/batches/${priorName}.json`), 'utf8'));
      for (const deck of prior.decks) {
        for (const item of deck.cards) priorFronts.add(item.front.trim().toLowerCase());
      }
    }
    for (const deck of batch.decks) {
      for (const item of deck.cards) {
        expect(priorFronts.has(item.front.trim().toLowerCase())).toBe(false);
      }
    }
  });
});
