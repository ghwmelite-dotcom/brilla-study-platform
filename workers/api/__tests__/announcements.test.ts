import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import worker from '../index';
import { buildAudienceFilter } from '../announcements';

const JWT_SECRET = 'announcement-test-secret';

async function authHeader(role: 'student' | 'admin' = 'admin') {
  const token = await sign({
    userId: `${role}-1`,
    role,
    sessionVersion: 0,
    exp: Math.floor(Date.now() / 1000) + 3600,
  }, JWT_SECRET);
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

function mockDb(options: {
  role?: 'student' | 'admin';
  announcement?: Record<string, unknown>;
  preparedSql?: string[];
} = {}) {
  const role = options.role || 'admin';
  const statement = (sql: string) => ({
    bind: (..._params: unknown[]) => statement(sql),
    first: async () => {
      if (sql.includes('role, status, is_active, session_version FROM users')) {
        return { role, status: 'approved', is_active: 1, session_version: 0 };
      }
      if (sql.includes('FROM admin_announcements WHERE id = ?')) {
        return options.announcement || null;
      }
      if (sql.includes('FROM platform_communication_preferences')) return null;
      return null;
    },
    all: async () => ({ results: [] }),
    run: async () => ({ success: true, meta: { changes: 1 } }),
  });
  return {
    prepare: (sql: string) => {
      options.preparedSql?.push(sql);
      return statement(sql);
    },
    batch: async (statements: unknown[]) => statements.map(() => ({
      success: true,
      meta: { changes: 1 },
    })),
  } as unknown as D1Database;
}

describe('admin announcements', () => {
  it('includes inactive approved accounts in the all-users predicate', () => {
    const filter = buildAudienceFilter('all', []);
    expect(filter.sql).toContain("u.status = 'approved'");
    expect(filter.sql).toContain("COALESCE(u.is_demo, 0) = 0");
    expect(filter.sql).not.toContain('u.is_active');
    expect(filter.params).toEqual([]);
  });

  it('uses prepared placeholders for segmented audiences', () => {
    const filter = buildAudienceFilter('school', ['school-1', 'school-2']);
    expect(filter.sql).toContain('u.school_id IN (?,?)');
    expect(filter.params).toEqual(['school-1', 'school-2']);
  });

  it('requires admin authorization to create a draft', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/announcements/admin/announcements', {
        method: 'POST',
        headers: await authHeader('student'),
        body: JSON.stringify({
          title: 'Feedback',
          message: 'Tell us about your experience.',
          link: '/community',
          audienceType: 'all',
          audienceIds: [],
          sendInApp: true,
          sendEmail: false,
          postToChatrooms: false,
        }),
      }),
      { DB: mockDb({ role: 'student' }), JWT_SECRET },
    );
    expect(response.status).toBe(403);
  });

  it('creates a reviewable draft without dispatching it', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/announcements/admin/announcements', {
        method: 'POST',
        headers: await authHeader('admin'),
        body: JSON.stringify({
          title: 'Feedback',
          message: 'Tell us about your experience.',
          link: '/community',
          audienceType: 'all',
          audienceIds: [],
          sendInApp: true,
          sendEmail: false,
          postToChatrooms: false,
        }),
      }),
      { DB: mockDb(), JWT_SECRET },
    );
    expect(response.status).toBe(201);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { status: 'draft' },
    });
  });

  it('lets a signed-in user disable platform announcement emails', async () => {
    const response = await worker.fetch(
      new Request('http://x/api/announcements/preferences', {
        method: 'PUT',
        headers: await authHeader('student'),
        body: JSON.stringify({ emailEnabled: false }),
      }),
      { DB: mockDb({ role: 'student' }), JWT_SECRET },
    );
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({
      success: true,
      data: { emailEnabled: false },
    });
  });

  it('fails closed when an email dispatch is requested without Resend', async () => {
    const announcement = {
      id: 'announcement-1',
      title: 'Feedback',
      message: 'Tell us about your experience.',
      link: '/community',
      audience_type: 'all',
      audience_ids: '[]',
      send_in_app: 1,
      send_email: 1,
      post_to_chatrooms: 0,
      status: 'draft',
      matched_users: 0,
      in_app_sent: 0,
      email_queued: 0,
      email_skipped: 0,
      email_failed: 0,
      chatrooms_posted: 0,
      created_by: 'admin-1',
      created_at: '2026-09-20T00:00:00.000Z',
      dispatched_at: null,
      updated_at: '2026-09-20T00:00:00.000Z',
    };
    const response = await worker.fetch(
      new Request('http://x/api/announcements/admin/announcements/announcement-1/send', {
        method: 'POST',
        headers: await authHeader('admin'),
        body: JSON.stringify({ confirmation: 'SEND announcement-1' }),
      }),
      { DB: mockDb({ announcement }), JWT_SECRET },
    );
    expect(response.status).toBe(503);
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'Resend email delivery is not configured',
    });
  });

  it('stores announcements as a supported system notification type', async () => {
    const preparedSql: string[] = [];
    const announcement = {
      id: 'announcement-1',
      title: 'Feedback',
      message: 'Tell us about your experience.',
      link: '/community',
      audience_type: 'all',
      audience_ids: '[]',
      send_in_app: 1,
      send_email: 0,
      post_to_chatrooms: 0,
      status: 'failed',
      matched_users: 0,
      in_app_sent: 0,
      email_queued: 0,
      email_skipped: 0,
      email_failed: 0,
      chatrooms_posted: 0,
      created_by: 'admin-1',
      created_at: '2026-09-20T00:00:00.000Z',
      dispatched_at: null,
      updated_at: '2026-09-20T00:00:00.000Z',
    };

    const response = await worker.fetch(
      new Request('http://x/api/announcements/admin/announcements/announcement-1/send', {
        method: 'POST',
        headers: await authHeader('admin'),
        body: JSON.stringify({ confirmation: 'SEND announcement-1' }),
      }),
      { DB: mockDb({ announcement, preparedSql }), JWT_SECRET },
    );

    expect(response.status).toBe(200);
    const notificationInsert = preparedSql.find((sql) => sql.includes('INSERT INTO notifications'));
    expect(notificationInsert).toContain("'system'");
    expect(notificationInsert).not.toContain("'announcement'");
  });
});
