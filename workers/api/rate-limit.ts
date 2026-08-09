// =============================================
// RATE LIMITING
// =============================================
// Extracted from index.ts (migration-024 infrastructure) so satellite routers
// (e.g. counselor.ts) can use it without a circular dependency.

export interface RateLimitConfig {
  maxRequests: number;      // Max requests allowed
  windowMs: number;         // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded (optional)
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number;      // Seconds until retry allowed
}

// Named constant: max AI calls per user per rolling 24h (explain + chat + counselor)
export const DAILY_AI_CALL_LIMIT = 50;

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  'login': {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000,      // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000 // 30 min block after exceeded
  },
  'login-ip': {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000,      // 20 attempts per IP per 15 minutes
  },
  'register': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,      // 3 registrations per hour per IP
  },
  'forgot-password': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,      // 3 requests per hour per email
  },
  'forgot-password-ip': {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000,      // 10 requests per hour per IP
  },
  'reset-password': {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,      // 5 attempts per hour
  },
  'set-password': {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,      // 5 attempts per hour
  },
  'change-password': {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,      // 5 attempts per hour
  },
  'demo-reset': {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000,      // 3 attempts per hour per IP
  },
  'setup': {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000,      // 5 attempts per hour per IP
  },
  'ai': {
    maxRequests: DAILY_AI_CALL_LIMIT,
    windowMs: 24 * 60 * 60 * 1000, // 50 AI calls per user per rolling 24 hours
  },
};

export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig
): Promise<RateLimitResult> {
  const limits = config || RATE_LIMITS[endpoint] || { maxRequests: 10, windowMs: 60000 };
  const now = new Date();
  const windowStart = new Date(now.getTime() - limits.windowMs);
  const windowStartISO = windowStart.toISOString();

  try {
    // Get current request count in window
    const result = await db.prepare(`
      SELECT SUM(request_count) as total_requests, MAX(updated_at) as last_request
      FROM rate_limits
      WHERE identifier = ? AND endpoint = ? AND window_start >= ?
    `).bind(identifier, endpoint, windowStartISO).first();

    const totalRequests = (result?.total_requests as number) || 0;
    const remaining = Math.max(0, limits.maxRequests - totalRequests - 1);

    // Check if blocked due to excessive attempts
    if (limits.blockDurationMs && totalRequests >= limits.maxRequests) {
      const lastRequest = result?.last_request ? new Date(result.last_request as string) : now;
      const blockEnd = new Date(lastRequest.getTime() + limits.blockDurationMs);

      if (now < blockEnd) {
        const retryAfter = Math.ceil((blockEnd.getTime() - now.getTime()) / 1000);
        return {
          allowed: false,
          remaining: 0,
          resetAt: blockEnd,
          retryAfter
        };
      }
    }

    // Check if limit exceeded
    if (totalRequests >= limits.maxRequests) {
      const resetAt = new Date(now.getTime() + limits.windowMs);
      return {
        allowed: false,
        remaining: 0,
        resetAt,
        retryAfter: Math.ceil(limits.windowMs / 1000)
      };
    }

    // Record this request
    const currentWindowStart = new Date(Math.floor(now.getTime() / limits.windowMs) * limits.windowMs).toISOString();

    // Try to update existing record or insert new one
    const existing = await db.prepare(`
      SELECT id, request_count FROM rate_limits
      WHERE identifier = ? AND endpoint = ? AND window_start = ?
    `).bind(identifier, endpoint, currentWindowStart).first();

    if (existing) {
      await db.prepare(`
        UPDATE rate_limits
        SET request_count = request_count + 1, updated_at = datetime('now')
        WHERE id = ?
      `).bind(existing.id).run();
    } else {
      await db.prepare(`
        INSERT INTO rate_limits (identifier, endpoint, request_count, window_start)
        VALUES (?, ?, 1, ?)
      `).bind(identifier, endpoint, currentWindowStart).run();
    }

    return {
      allowed: true,
      remaining,
      resetAt: new Date(now.getTime() + limits.windowMs)
    };
  } catch (error) {
    console.error('Rate limit check error:', error);
    // On error, allow the request but log it
    return {
      allowed: true,
      remaining: limits.maxRequests,
      resetAt: new Date(now.getTime() + limits.windowMs)
    };
  }
}

// Clean up old rate limit records (called periodically)
export async function cleanupRateLimits(db: D1Database): Promise<void> {
  try {
    const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(); // 24 hours ago
    await db.prepare(`
      DELETE FROM rate_limits WHERE window_start < ?
    `).bind(cutoff).run();
  } catch (error) {
    console.error('Rate limit cleanup error:', error);
  }
}
