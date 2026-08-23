import { describe, expect, it } from 'vitest';
import worker from '../index';
import { createMockD1 } from './helpers/mockD1';

const JWT_SECRET = 'test-secret-that-is-long-enough';

function resetRequest(password = 'N3wSecurePassword1') {
  return new Request('http://x/api/auth/reset-password', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ token: 'reset-token', password }),
  });
}

function resetDb(updateChanges = 1) {
  return createMockD1([
    {
      match: /rate_limits/,
      first: () => null,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /FROM users WHERE password_reset_token = \?/,
      first: () => ({
        id: 'user_1',
        password_reset_expires_at: new Date(Date.now() + 60_000).toISOString(),
      }),
    },
    {
      match: /UPDATE users SET\s+password_hash/,
      run: () => ({ success: true, meta: { changes: updateChanges } }),
    },
  ]);
}

describe('POST /api/auth/reset-password', () => {
  it('consumes the emailed token in the same conditional write as the password change', async () => {
    const db = resetDb();
    const response = await worker.fetch(resetRequest(), { DB: db, JWT_SECRET });

    expect(response.status).toBe(200);
    const passwordWrite = db.calls.find((call) =>
      call.sql.includes('UPDATE users SET') && call.sql.includes('password_hash'),
    );
    expect(passwordWrite?.sql).toContain('WHERE id = ? AND password_reset_token = ?');
    expect(passwordWrite?.binds.at(-1)).toBe('reset-token');
  });

  it('rejects a token that lost the one-time consumption race', async () => {
    const db = resetDb(0);
    const response = await worker.fetch(resetRequest(), { DB: db, JWT_SECRET });

    expect(response.status).toBe(400);
    expect(await response.json()).toMatchObject({
      success: false,
      error: 'This reset link has already been used.',
    });
  });

  it('rejects an invalid password before querying the reset token', async () => {
    const db = resetDb();
    const response = await worker.fetch(resetRequest('short'), { DB: db, JWT_SECRET });

    expect(response.status).toBe(400);
    expect(db.calls.some((call) => call.sql.includes('password_reset_token'))).toBe(false);
  });
});
