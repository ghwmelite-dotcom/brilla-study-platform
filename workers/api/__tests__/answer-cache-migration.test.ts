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
});
