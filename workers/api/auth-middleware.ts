import { verify } from 'hono/jwt';
import type { Context, Next } from 'hono';

export interface AuthPayload {
  userId: string;
  email?: string;
  role?: string;
}

interface AuthBindings {
  DB: D1Database;
  JWT_SECRET: string;
}

interface AuthVariables {
  userId: string;
  userRole: string;
  user: AuthPayload;
}

type AuthContext = Context<{ Bindings: AuthBindings; Variables: AuthVariables }>;

/**
 * Shared JWT authentication middleware.
 * Identity is derived ONLY from a signature-verified JWT plus a fresh
 * users-table lookup. Request headers/body/query are never trusted.
 *
 * Sets on context: userId, userRole (fresh from DB), user (JWT payload).
 */
export const requireAuth = async (
  c: AuthContext,
  next: Next,
): Promise<Response | void> => {
  // CORS preflight passes through; the cors() middleware handles it.
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as unknown as AuthPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  if (!payload?.userId) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Per-request re-check: role/status/is_active are NOT trusted from the JWT.
  const user = await c.env.DB.prepare(
    'SELECT role, status, is_active FROM users WHERE id = ?',
  )
    .bind(payload.userId)
    .first<{ role: string; status: string; is_active: number }>();

  if (!user || user.is_active !== 1 || user.status !== 'approved') {
    return c.json({ success: false, error: 'Account is not active' }, 403);
  }

  c.set('userId', payload.userId);
  c.set('userRole', user.role);
  c.set('user', { ...payload, role: user.role });
  await next();
};

/** requireAuth + admin role check (role read fresh from DB). */
export const requireAdmin = async (
  c: AuthContext,
  next: Next,
): Promise<Response | void> => {
  // Run the base check first by composing manually.
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);

  let payload: AuthPayload;
  try {
    payload = (await verify(token, c.env.JWT_SECRET, 'HS256')) as unknown as AuthPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid or expired token' }, 401);
  }

  if (!payload?.userId) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  const user = await c.env.DB.prepare(
    'SELECT role, status, is_active FROM users WHERE id = ?',
  )
    .bind(payload.userId)
    .first<{ role: string; status: string; is_active: number }>();

  if (!user || user.is_active !== 1 || user.status !== 'approved') {
    return c.json({ success: false, error: 'Account is not active' }, 403);
  }

  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  c.set('userId', payload.userId);
  c.set('userRole', user.role);
  c.set('user', { ...payload, role: user.role });
  await next();
};

/** Constant-time string comparison for secret comparisons. */
export function constantTimeEqual(a: string, b: string): boolean {
  const aBytes = new TextEncoder().encode(a);
  const bBytes = new TextEncoder().encode(b);
  if (aBytes.length !== bBytes.length) return false;
  let diff = 0;
  for (let i = 0; i < aBytes.length; i++) {
    diff |= aBytes[i] ^ bBytes[i];
  }
  return diff === 0;
}
