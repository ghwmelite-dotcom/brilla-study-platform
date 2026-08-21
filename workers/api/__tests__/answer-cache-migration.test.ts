import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('migration 098 semantic answer cache', () => {
  it('creates the cache table and topic index and is safe to replay', () => {
    const db = new Database(':memory:');
    try {
      const migration = readFileSync(
        new URL('../../../database/migrations/098_ai_answer_cache.sql', import.meta.url),
        'utf8',
      );

      db.exec(migration);
      db.prepare(`
        INSERT INTO ai_answer_cache (
          id, topic_id, subject_id, exam_type, question_text, answer_text, model
        ) VALUES (?, ?, ?, ?, ?, ?, ?)
      `).run('answer_1', 'topic_1', 'subject_1', 'nsmq', 'What is x?', 'x is 2.', 'test-model');

      db.exec(migration);

      expect(db.prepare('SELECT id, topic_id, hit_count FROM ai_answer_cache').get())
        .toEqual({ id: 'answer_1', topic_id: 'topic_1', hit_count: 0 });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_ai_answer_cache_topic'").get())
        .toEqual({ name: 'idx_ai_answer_cache_topic' });
    } finally {
      db.close();
    }
  });
  it('fails closed and preserves the source table when a patched schema is missing a column', () => {
    const db = new Database(':memory:');
    try {
      const migration = readFileSync(
        new URL('../../../database/migrations/098_ai_answer_cache.sql', import.meta.url),
        'utf8',
      );
      db.exec(`
        CREATE TABLE ai_answer_cache (
          id TEXT PRIMARY KEY,
          topic_id TEXT NOT NULL,
          subject_id TEXT,
          exam_type TEXT,
          question_text TEXT NOT NULL,
          answer_text TEXT NOT NULL,
          model TEXT,
          embedding_id TEXT,
          hit_count INTEGER DEFAULT 0,
          created_at TEXT DEFAULT (datetime('now'))
        );
        INSERT INTO ai_answer_cache (
          id, topic_id, question_text, answer_text
        ) VALUES ('legacy_1', 'topic_1', 'Question?', 'Answer.');
      `);

      expect(() => db.exec(migration)).toThrow(/CHECK constraint failed/);
      expect(db.prepare('SELECT id, answer_text FROM ai_answer_cache').get())
        .toEqual({ id: 'legacy_1', answer_text: 'Answer.' });
    } finally {
      db.close();
    }
  });
  it('fails closed and preserves data when a patched schema has an unexpected column', () => {
    const db = new Database(':memory:');
    try {
      const migration = readFileSync(
        new URL('../../../database/migrations/098_ai_answer_cache.sql', import.meta.url),
        'utf8',
      );
      const productionPatch = readFileSync(
        new URL('../../../database/prod-patches/097_ai_answer_cache.sql', import.meta.url),
        'utf8',
      );
      db.exec(productionPatch);
      db.exec(`
        ALTER TABLE ai_answer_cache ADD COLUMN legacy_note TEXT;
        INSERT INTO ai_answer_cache (
          id, topic_id, question_text, answer_text, legacy_note
        ) VALUES ('legacy_2', 'topic_2', 'Question?', 'Answer.', 'preserve me');
      `);

      expect(() => db.exec(migration)).toThrow(/CHECK constraint failed/);
      expect(db.prepare('SELECT id, legacy_note FROM ai_answer_cache').get())
        .toEqual({ id: 'legacy_2', legacy_note: 'preserve me' });
    } finally {
      db.close();
    }
  });


});
