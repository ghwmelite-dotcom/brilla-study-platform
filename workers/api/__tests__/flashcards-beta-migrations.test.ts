import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { describe, expect, it } from 'vitest';
import Database from 'better-sqlite3';

const migrationNames = [
  '380_flashcards_beta_decks.sql',
  '381_flashcards_beta_part_1.sql',
  '382_flashcards_beta_part_2.sql',
  '383_flashcards_beta_part_3.sql',
  '384_flashcards_beta_part_4.sql',
  '385_flashcards_beta_part_5.sql',
  '386_flashcards_beta_counts_guard.sql',
];
const repoRoot = fileURLToPath(new URL('../../../', import.meta.url));
const migrationRelativePaths = migrationNames.map((name) => `database/migrations/${name}`);
const artifactRelativePaths = ['content/batches/flashcards-beta-001.json', ...migrationRelativePaths];
const migrations = migrationRelativePaths.map((path) => readFileSync(join(repoRoot, path), 'utf8'));

const shellDecks = [
  ['deck_sys_topic_algebra', 'subj_nsmq_math', 'topic_algebra'],
  ['deck_sys_topic_trigonometry', 'subj_nsmq_math', 'topic_trigonometry'],
  ['deck_sys_topic_mechanics', 'subj_nsmq_physics', 'topic_mechanics'],
  ['deck_sys_topic_electricity', 'subj_nsmq_physics', 'topic_electricity'],
  ['deck_sys_topic_atomic', 'subj_nsmq_chemistry', 'topic_atomic'],
  ['deck_sys_topic_stoichiometry', 'subj_nsmq_chemistry', 'topic_stoichiometry'],
  ['deck_sys_topic_cells', 'subj_nsmq_biology', 'topic_cells'],
  ['deck_sys_topic_genetics', 'subj_nsmq_biology', 'topic_genetics'],
];
const newDecks = [
  'deck_literature_devices',
  'deck_int_science_human_biology',
  'deck_core_math_trigonometry',
  'deck_social_governance',
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
      ('subj_nsmq_math'), ('subj_nsmq_physics'), ('subj_nsmq_chemistry'), ('subj_nsmq_biology'),
      ('subj_wassce_literature'), ('subj_wassce_int_science'),
      ('subj_wassce_core_math'), ('subj_wassce_social');
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

describe('flashcards-beta-001 migrations', () => {
  it.each(migrationNames.map((name, index) => [name, migrations[index]]))(
    'keeps %s below the remote D1 query limit with CRLF',
    (name, sql) => {
      const crlf = sql.replace(/\r\n/g, '\n').replace(/\n/g, '\r\n');
      const ledger = `\r\nINSERT INTO "d1_migrations" (name) values ('${name}');`;
      expect(Buffer.byteLength(crlf + ledger, 'utf8')).toBeLessThan(19_500);
    },
  );

  it('reproduces every committed JSON and SQL artifact byte for byte', () => {
    const temporaryRoot = mkdtempSync(join(tmpdir(), 'brilla-flashcards-beta-'));
    try {
      execFileSync(process.execPath, [
        join(repoRoot, 'scripts/generate-flashcard-bank.mjs'), '--output-root', temporaryRoot,
      ], { cwd: repoRoot, stdio: 'pipe' });
      for (const relativePath of artifactRelativePaths) {
        expect(readFileSync(join(temporaryRoot, relativePath), 'utf8'))
          .toBe(readFileSync(join(repoRoot, relativePath), 'utf8'));
      }
    } finally {
      rmSync(temporaryRoot, { recursive: true, force: true });
    }
  });

  it('loads 120 original cards across 12 decks and remains idempotent', () => {
    const db = createFixture();
    for (const migration of migrations) db.exec(migration);

    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b001_%'
    `).get()).toEqual({ count: 120 });
    // Every one of the 12 target decks holds exactly 10 cards and its static
    // card_count was reconciled to the actual row count by the final migration.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks d
      WHERE d.card_count = 10
        AND (SELECT COUNT(*) FROM flashcards f WHERE f.deck_id = d.id) = 10
        AND d.id LIKE 'deck_%'
    `).get()).toEqual({ count: 12 });
    // New WASSCE decks exist, are public, system-owned and subject-bound.
    expect(db.prepare(`
      SELECT id FROM flashcard_decks
      WHERE user_id IS NULL AND is_public = 1 AND topic_id IS NULL
        AND id IN (${newDecks.map((id) => `'${id}'`).join(', ')})
      ORDER BY id
    `).all().map((row) => row.id)).toEqual([...newDecks].sort());
    // Field caps and difficulty range mirror workers/api/flashcard-decks.ts.
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcards
      WHERE id LIKE 'fc_b001_%'
        AND length(front) BETWEEN 1 AND 1000
        AND length(back) BETWEEN 1 AND 2000
        AND (hint IS NULL OR length(hint) <= 500)
        AND difficulty BETWEEN 1 AND 5
    `).get()).toEqual({ count: 120 });
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
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b001_%'
    `).get()).toEqual({ count: 120 });
    expect(db.prepare(`
      SELECT COUNT(*) AS count FROM flashcard_decks WHERE card_count = 10
    `).get()).toEqual({ count: 12 });
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
      SELECT COUNT(*) AS count FROM flashcards WHERE id LIKE 'fc_b001_%'
    `).get()).toEqual({ count: 96 });
    db.close();
  });

  it('marks the batch automated-beta with non-official provenance in the JSON artifact', () => {
    const batch = JSON.parse(readFileSync(join(repoRoot, artifactRelativePaths[0]), 'utf8'));
    expect(batch.batchId).toBe('flashcards-beta-001');
    expect(batch.decks).toHaveLength(12);
    expect(batch.decks.every((deck: { cards: unknown[] }) => deck.cards.length === 10)).toBe(true);
    expect(batch.release).toMatchObject({
      channel: 'beta',
      officialExamBoardContent: false,
      feedbackEnabled: true,
    });
    expect(batch.release.contentLabel).toContain('not official WAEC or NaCCA examination material');
    expect(batch.provenance.every((source: { use: string }) => source.use === 'curriculum_blueprint_only')).toBe(true);
    const fronts = new Set<string>();
    for (const deck of batch.decks) {
      for (const item of deck.cards) {
        const key = item.front.trim().toLowerCase();
        expect(fronts.has(key)).toBe(false);
        fronts.add(key);
      }
    }
    expect(fronts.size).toBe(120);
  });
});
