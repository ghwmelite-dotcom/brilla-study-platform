import { readFileSync } from 'node:fs';
import Database from 'better-sqlite3';
import { describe, expect, it } from 'vitest';

describe('migration 095 Counselor hardening', () => {
  it('adds the alert title and authorization indexes without losing rows', () => {
    const db = new Database(':memory:');
    try {
      db.exec(`
        CREATE TABLE wellbeing_alerts (
          id TEXT PRIMARY KEY,
          student_id TEXT NOT NULL,
          alert_type TEXT NOT NULL,
          severity TEXT NOT NULL,
          description TEXT NOT NULL,
          triggered_by TEXT,
          is_resolved INTEGER DEFAULT 0,
          created_at TEXT
        );
        CREATE TABLE parent_student_links (
          id TEXT PRIMARY KEY,
          parent_id TEXT,
          student_id TEXT NOT NULL,
          status TEXT,
          student_opted_out INTEGER DEFAULT 0
        );
        CREATE TABLE class_members (
          id TEXT PRIMARY KEY,
          class_id TEXT NOT NULL,
          student_id TEXT NOT NULL,
          is_active INTEGER DEFAULT 1
        );
        INSERT INTO wellbeing_alerts
          (id, student_id, alert_type, severity, description, triggered_by, created_at)
        VALUES ('alert_1', 'student_1', 'stress', 'medium', 'Needs support', 'pattern', datetime('now'));
      `);

      const migration = readFileSync(
        new URL('../../../database/migrations/095_counselor_authorization.sql', import.meta.url),
        'utf8',
      );
      db.exec(migration);

      expect(db.prepare('SELECT id, title FROM wellbeing_alerts').get())
        .toEqual({ id: 'alert_1', title: null });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_parent_links_access'").get())
        .toEqual({ name: 'idx_parent_links_access' });
      expect(db.prepare("SELECT name FROM sqlite_master WHERE type='index' AND name='idx_class_members_student_active'").get())
        .toEqual({ name: 'idx_class_members_student_active' });
    } finally {
      db.close();
    }
  });
});
