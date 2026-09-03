// =============================================
// RATE LIMITING
// =============================================
// Extracted from index.ts (migration-024 infrastructure) so satellite routers
// (e.g. counselor.ts) can use it without a circular dependency.

export interface RateLimitConfig {
  maxRequests: number; // Max requests allowed
  windowMs: number; // Time window in milliseconds
  blockDurationMs?: number; // How long to block after limit exceeded (optional)
  failureMode?: "open" | "closed";
}

export interface RateLimitResult {
  allowed: boolean;
  remaining: number;
  resetAt: Date;
  retryAfter?: number; // Seconds until retry allowed
  reason?: "limit_exceeded" | "backend_unavailable";
  degraded?: boolean;
}

// Named constant: max AI calls per user per rolling 24h (explain + chat + counselor)
export const DAILY_AI_CALL_LIMIT = 50;
const RATE_LIMIT_BUCKET_MS = 1000;

// Rate limit configurations for different endpoints
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  login: {
    maxRequests: 5,
    windowMs: 15 * 60 * 1000, // 5 attempts per 15 minutes
    blockDurationMs: 30 * 60 * 1000, // 30 min block after exceeded
  },
  "login-ip": {
    maxRequests: 20,
    windowMs: 15 * 60 * 1000, // 20 attempts per IP per 15 minutes
  },
  register: {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 registrations per hour per IP
  },
  "forgot-password": {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 requests per hour per email
  },
  "forgot-password-ip": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 requests per hour per IP
  },
  "reset-password": {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour
  },
  "set-password": {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour
  },
  "change-password": {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour
  },
  "demo-reset": {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 attempts per hour per IP
  },
  "code-request": {
    maxRequests: 3,
    windowMs: 60 * 60 * 1000, // 3 invite-code requests per hour per IP
  },
  setup: {
    maxRequests: 5,
    windowMs: 60 * 60 * 1000, // 5 attempts per hour per IP
  },
  ai: {
    maxRequests: DAILY_AI_CALL_LIMIT,
    windowMs: 24 * 60 * 60 * 1000, // 50 AI calls per user per rolling 24 hours
  },
  "practice-session-save": {
    maxRequests: 30,
    windowMs: 60 * 1000, // 30 new completed sessions per user per minute
    failureMode: "closed",
  },
  "question-attempt-write": {
    maxRequests: 60,
    windowMs: 60 * 1000, // 60 new answer writes per user per minute
    failureMode: "closed",
  },
  "lab-session-start": {
    maxRequests: 20,
    windowMs: 60 * 60 * 1000, // 20 new lab sessions per user per hour
    failureMode: "closed",
  },
  "lab-events": {
    maxRequests: 120,
    windowMs: 60 * 1000, // event bursts during active sim use
    failureMode: "closed",
  },
  "lab-submit": {
    maxRequests: 10,
    windowMs: 60 * 60 * 1000, // 10 submits per user per hour
    failureMode: "closed",
  },
  "lab-read": {
    maxRequests: 60,
    windowMs: 60 * 1000, // history/detail reads
  },
  "public-read": {
    maxRequests: 300,
    windowMs: 60 * 1000, // 300 unauthenticated public reads per IP per minute
  },
  "oauth-google-init": {
    maxRequests: 20,
    windowMs: 60 * 1000, // 20 Google OAuth flow starts per IP per minute
  },
  "oauth-google-callback": {
    maxRequests: 10,
    windowMs: 60 * 1000, // 10 Google OAuth callbacks per IP per minute (each triggers an outbound token exchange)
  },
};

export async function checkRateLimit(
  db: D1Database,
  identifier: string,
  endpoint: string,
  config?: RateLimitConfig,
): Promise<RateLimitResult> {
  const limits = config ||
    RATE_LIMITS[endpoint] || { maxRequests: 10, windowMs: 60000 };
  const now = new Date();
  // One-second buckets keep the shared D1 counter effectively rolling while
  // retaining a bounded number of rows. Floor the cutoff as well as the
  // current bucket so requests near the oldest boundary are conservatively
  // counted for at most one additional second rather than being undercounted.
  const rollingWindowStart = new Date(
    Math.floor((now.getTime() - limits.windowMs) / RATE_LIMIT_BUCKET_MS) *
      RATE_LIMIT_BUCKET_MS,
  ).toISOString();
  const currentWindowStart = new Date(
    Math.floor(now.getTime() / RATE_LIMIT_BUCKET_MS) * RATE_LIMIT_BUCKET_MS,
  ).toISOString();
  const defaultResetAt = new Date(now.getTime() + limits.windowMs);

  try {
    const consumed = await db
      .prepare(
        `
      WITH usage(total_requests) AS MATERIALIZED (
        SELECT COALESCE(SUM(request_count), 0)
        FROM rate_limits
        WHERE identifier = ?
          AND endpoint = ?
          AND window_start >= ?
      )
      INSERT INTO rate_limits (
        identifier, endpoint, request_count, window_start, updated_at
      )
      SELECT ?, ?, 1, ?, datetime('now')
      FROM usage
      WHERE total_requests < ?
      ON CONFLICT(identifier, endpoint, window_start) DO UPDATE SET
        request_count = rate_limits.request_count + 1,
        updated_at = datetime('now')
      WHERE (SELECT total_requests FROM usage) < ?
      RETURNING
        request_count,
        (SELECT total_requests FROM usage) + 1 AS total_requests
    `,
      )
      .bind(
        identifier,
        endpoint,
        rollingWindowStart,
        identifier,
        endpoint,
        currentWindowStart,
        limits.maxRequests,
        limits.maxRequests,
      )
      .first<{ request_count: number; total_requests: number }>();

    if (consumed) {
      const totalRequests = Number(consumed.total_requests);
      return {
        allowed: true,
        remaining: Math.max(0, limits.maxRequests - totalRequests),
        resetAt: defaultResetAt,
      };
    }

    let resetAt = defaultResetAt;
    if (limits.blockDurationMs) {
      const last = await db
        .prepare(
          `
        SELECT MAX(updated_at) AS last_request
        FROM rate_limits
        WHERE identifier = ? AND endpoint = ? AND window_start >= ?
      `,
        )
        .bind(identifier, endpoint, rollingWindowStart)
        .first<{ last_request: string | null }>();
      if (last?.last_request) {
        const blockEnd = new Date(
          new Date(last.last_request).getTime() + limits.blockDurationMs,
        );
        if (blockEnd > resetAt) resetAt = blockEnd;
      }
    }

    return {
      allowed: false,
      remaining: 0,
      resetAt,
      retryAfter: Math.max(
        1,
        Math.ceil((resetAt.getTime() - now.getTime()) / 1000),
      ),
      reason: "limit_exceeded",
    };
  } catch (error) {
    console.error("Rate limit check error:", error);
    if (limits.failureMode === "closed") {
      return {
        allowed: false,
        remaining: 0,
        resetAt: defaultResetAt,
        retryAfter: 30,
        reason: "backend_unavailable",
      };
    }
    return {
      allowed: true,
      remaining: limits.maxRequests,
      resetAt: defaultResetAt,
      degraded: true,
    };
  }
}

// Clean up old rate limit records (called periodically)
export async function cleanupRateLimits(db: D1Database): Promise<void> {
  try {
    const longestWindowMs = Math.max(
      ...Object.values(RATE_LIMITS).map((limit) => limit.windowMs),
    );
    const cutoff = new Date(
      Math.floor(
        (Date.now() - longestWindowMs - RATE_LIMIT_BUCKET_MS) /
          RATE_LIMIT_BUCKET_MS,
      ) * RATE_LIMIT_BUCKET_MS,
    ).toISOString();
    await db
      .prepare(
        `
      DELETE FROM rate_limits WHERE window_start < ?
    `,
      )
      .bind(cutoff)
      .run();
  } catch (error) {
    console.error("Rate limit cleanup error:", error);
  }
}
