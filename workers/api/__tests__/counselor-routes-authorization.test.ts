import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { counselorApp } from '../counselor';
import { createMockD1, type MockHandler } from './helpers/mockD1';

const JWT_SECRET = `${crypto.randomUUID()}-${crypto.randomUUID()}`;

async function requestAs(
  role: 'student' | 'parent' | 'teacher' | 'admin',
  path: string,
  init: RequestInit = {},
  handlers: MockHandler[] = [],
) {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ userId: `${role}_1`, role, iat: now, exp: now + 3600 }, JWT_SECRET);
  const db = createMockD1([
    {
      match: /SELECT role, status, is_active, session_version FROM users WHERE id = \?/,
      first: () => ({ role, status: 'approved', is_active: 1, session_version: 0 }),
    },
    ...handlers,
  ]);
  const response = await counselorApp.request(`http://x${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json',
      ...init.headers,
    },
  }, { DB: db as unknown as D1Database, JWT_SECRET });
  return { response, db };
}

describe('Counselor sensitive route authorization', () => {
  it.each([
    ['/alerts', 'GET'],
    ['/parent-messages', 'GET'],
    ['/parent-messages', 'POST'],
    ['/schedules', 'GET'],
  ] as const)('denies students access to %s %s', async (path, method) => {
    const { response, db } = await requestAs('student', path, {
      method,
      body: method === 'POST' ? JSON.stringify({ studentId: 'victim_1', content: 'hello' }) : undefined,
    });
    expect(response.status).toBe(403);
    expect(db.calls).toHaveLength(1);
  });

  it('scopes parent alert reads to canonical active links and the requested student', async () => {
    const { response, db } = await requestAs('parent', '/alerts?studentId=student_2', {}, [{
      match: /FROM wellbeing_alerts wa/,
      all: () => ({ results: [] }),
    }]);
    expect(response.status).toBe(200);
    const query = db.calls.find((call) => call.sql.includes('FROM wellbeing_alerts wa'))!;
    expect(query.sql).toMatch(/FROM parent_student_links psl/);
    expect(query.sql).toMatch(/psl\.student_opted_out = 0/);
    expect(query.sql).toMatch(/AND wa\.student_id = \?/);
    expect(query.binds).toEqual(['parent_1', 'student_2']);
  });

  it('scopes teacher report reads through active class membership', async () => {
    const { response, db } = await requestAs('teacher', '/reports?studentId=student_2', {}, [{
      match: /FROM counselor_reports cr/,
      all: () => ({ results: [] }),
    }]);
    expect(response.status).toBe(200);
    const query = db.calls.find((call) => call.sql.includes('FROM counselor_reports cr'))!;
    expect(query.sql).toMatch(/FROM class_members cm/);
    expect(query.sql).toMatch(/cl\.teacher_id = \?/);
    expect(query.binds).toEqual(['teacher_1', 'student_2']);
  });

  it('returns 404 and performs no access-log insert when parent cannot update a report', async () => {
    const { response, db } = await requestAs('parent', '/reports/report_victim/read', {
      method: 'POST',
      body: '{}',
    }, [{
      match: /UPDATE counselor_reports AS cr/,
      run: () => ({ success: true, meta: { changes: 0 } }),
    }]);
    expect(response.status).toBe(404);
    const update = db.calls.find((call) => call.sql.includes('UPDATE counselor_reports AS cr'))!;
    expect(update.sql).toMatch(/FROM parent_student_links psl/);
    expect(update.binds).toEqual(['report_victim', 'parent_1']);
    expect(db.calls.some((call) => call.sql.includes('INSERT INTO report_access_logs'))).toBe(false);
  });

  it('blocks an unassigned teacher before report generation reads student data', async () => {
    const { response, db } = await requestAs('teacher', '/reports/generate', {
      method: 'POST',
      body: JSON.stringify({ studentId: 'student_2', reportType: 'weekly_summary' }),
    }, [{
      match: /SELECT 1 AS allowed[\s\S]*FROM users student/,
      first: () => null,
    }]);
    expect(response.status).toBe(404);
    expect(db.calls.some((call) => call.sql.includes('FROM question_attempts'))).toBe(false);
  });

  it('requires parent ownership as well as student linkage to update schedules', async () => {
    const { response, db } = await requestAs('parent', '/schedules/schedule_1', {
      method: 'PUT',
      body: JSON.stringify({ isActive: false }),
    }, [{
      match: /UPDATE report_schedules AS rs/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    }]);
    expect(response.status).toBe(200);
    const update = db.calls.find((call) => call.sql.includes('UPDATE report_schedules AS rs'))!;
    expect(update.sql).toMatch(/FROM parent_student_links psl/);
    expect(update.sql).toMatch(/rs\.parent_id = \?/);
    expect(update.binds).toEqual([0, 'schedule_1', 'parent_1', 'parent_1']);
  });

  it('deprecates email-based parent linking in favor of student invite codes', async () => {
    const { response, db } = await requestAs('parent', '/link-student', {
      method: 'POST',
      body: JSON.stringify({ studentEmail: 'student@example.test' }),
    });
    expect(response.status).toBe(410);
    expect(db.calls).toHaveLength(1);
  });
});
