import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

const migrationSql = readFileSync(
  new URL('../../../database/migrations/118_user_progress_exam_type.sql', import.meta.url),
  'utf8',
);

describe('migration 118 user progress exam type compatibility', () => {
  it('upgrades the legacy table, backfills progress, and supports canonical upserts', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        PRAGMA foreign_keys = ON;
        CREATE TABLE users (id TEXT PRIMARY KEY);
        CREATE TABLE exam_types (id TEXT PRIMARY KEY);
        CREATE TABLE subjects (
          id TEXT PRIMARY KEY,
          exam_type_id TEXT REFERENCES exam_types(id)
        );
        CREATE TABLE topics (
          id TEXT PRIMARY KEY,
          subject_id TEXT NOT NULL REFERENCES subjects(id)
        );
        CREATE TABLE user_progress (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
          topic_id TEXT NOT NULL REFERENCES topics(id) ON DELETE CASCADE,
          questions_attempted INTEGER DEFAULT 0,
          questions_correct INTEGER DEFAULT 0,
          mastery_level INTEGER DEFAULT 0,
          last_attempt_at TEXT,
          created_at TEXT DEFAULT (datetime('now')),
          updated_at TEXT DEFAULT (datetime('now')),
          is_demo_data INTEGER DEFAULT 0,
          expires_at TEXT,
          UNIQUE(user_id, topic_id)
        );

        INSERT INTO users (id) VALUES ('user_1');
        INSERT INTO exam_types (id) VALUES ('exam_wassce');
        INSERT INTO subjects (id, exam_type_id) VALUES ('subj_agric', 'exam_wassce');
        INSERT INTO topics (id, subject_id) VALUES ('topic_agric', 'subj_agric');
        INSERT INTO user_progress (
          id, user_id, topic_id, questions_attempted, questions_correct,
          mastery_level, is_demo_data
        ) VALUES ('progress_1', 'user_1', 'topic_agric', 1, 1, 100, 0);
      `);

      db.exec(migrationSql);

      expect(db.prepare('PRAGMA table_info(user_progress)').all())
        .toEqual(expect.arrayContaining([expect.objectContaining({ name: 'exam_type_id' })]));
      expect(db.prepare(`
        SELECT user_id AS userId, topic_id AS topicId, exam_type_id AS examTypeId,
               questions_attempted AS attempted
        FROM user_progress
      `).get()).toEqual({
        userId: 'user_1',
        topicId: 'topic_agric',
        examTypeId: 'exam_wassce',
        attempted: 1,
      });

      const upsert = db.prepare(`
        INSERT INTO user_progress (
          id, user_id, topic_id, exam_type_id, questions_attempted,
          questions_correct, mastery_level, last_attempt_at, created_at,
          updated_at, is_demo_data, expires_at
        ) VALUES (?, ?, ?, ?, 1, ?, ?, ?, ?, ?, ?, ?)
        ON CONFLICT(user_id, topic_id, exam_type_id) DO UPDATE SET
          questions_attempted = questions_attempted + 1,
          questions_correct = questions_correct + excluded.questions_correct,
          mastery_level = ROUND(100.0 * (questions_correct + excluded.questions_correct) / (questions_attempted + 1)),
          last_attempt_at = excluded.last_attempt_at,
          updated_at = excluded.updated_at
      `);
      const now = '2026-08-25T00:00:00.000Z';
      upsert.run('progress_2', 'user_1', 'topic_agric', 'exam_wassce', 0, 0, now, now, now, 0, null);
      upsert.run('progress_3', 'user_1', 'topic_agric', 'exam_wassce', 1, 100, now, now, now, 0, null);

      expect(db.prepare(`
        SELECT questions_attempted AS attempted, questions_correct AS correct,
               mastery_level AS mastery
        FROM user_progress
      `).get()).toEqual({ attempted: 3, correct: 2, mastery: 67 });
    } finally {
      db.close();
    }
  });
});
