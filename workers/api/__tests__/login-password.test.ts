import { describe, it, expect, vi } from 'vitest';
import worker from '../index';

// Behavioral test for the constant-time password-hash comparison in
// verifyPassword (workers/api/index.ts). The stored hash is produced with
// the exact same PBKDF2 construction as hashPassword (16-byte salt,
// 100k iterations, SHA-256, 256 bits, base64(salt+hash)).

async function makeStoredHash(password: string): Promise<string> {
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(password),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const hash = await crypto.subtle.deriveBits(
    { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
    keyMaterial,
    256
  );
  const combined = new Uint8Array(salt.length + hash.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);
  return btoa(String.fromCharCode(...combined));
}

function makeEnv(userRow: unknown) {
  return {
    DB: {
      prepare: vi.fn((sql: string) => ({
        bind: vi.fn(() => ({
          // Only the users lookup returns a row; rate-limit counters,
          // login_attempts, and audit inserts all see empty results.
          first: vi.fn().mockResolvedValue(sql.includes('FROM users') ? userRow : null),
          run: vi.fn().mockResolvedValue({ success: true }),
          all: vi.fn().mockResolvedValue({ results: [] }),
        })),
      })),
    } as unknown as D1Database,
    JWT_SECRET: 'test-secret',
    // No TURNSTILE_SECRET → the Turnstile gate is skipped.
  };
}

function loginRequest(env: unknown, email: string, password: string) {
  return worker.fetch(
    new Request('http://x/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password }),
    }),
    env,
  );
}

describe('login password verification', () => {
  const user = {
    id: 'user_1',
    email: 'test@example.com',
    name: 'Test User',
    role: 'student',
    status: 'approved',
    is_active: 1,
    email_verified: 1,
  };

  it('accepts the correct password', async () => {
    const password_hash = await makeStoredHash('correct-horse');
    const res = await loginRequest(makeEnv({ ...user, password_hash }), user.email, 'correct-horse');
    expect(res.status).toBe(200);
    const body = await res.json() as { success: boolean; data?: { token?: string } };
    expect(body.success).toBe(true);
    expect(body.data?.token).toBeTruthy();
  });

  it('rejects a wrong password with the same 401 shape', async () => {
    const password_hash = await makeStoredHash('correct-horse');
    const res = await loginRequest(makeEnv({ ...user, password_hash }), user.email, 'wrong-horse');
    expect(res.status).toBe(401);
    const body = await res.json() as { success: boolean; error: string };
    expect(body.success).toBe(false);
    expect(body.error).toBe('Invalid email or password.');
  });
});
