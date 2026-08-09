import { Hono } from 'hono';
import { sign } from 'hono/jwt';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  TURNSTILE_SECRET?: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
}

// Roles a caller may self-select during registration. Anything else
// (e.g. 'admin') is rejected with 400 at account creation.
// Typed as readonly string[] so .includes() accepts an arbitrary caller string.
export const ALLOWED_SELF_SERVE_ROLES: readonly string[] = ['student', 'teacher', 'parent'];

interface GoogleTokenResponse {
  access_token: string;
  id_token: string;
  expires_in: number;
  token_type: string;
  scope: string;
  refresh_token?: string;
}

interface GoogleUserInfo {
  sub: string;        // Google user ID
  email: string;
  email_verified: boolean;
  name: string;
  given_name?: string;
  family_name?: string;
  picture?: string;
}

// PKCE utilities
function generateCodeVerifier(): string {
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  return base64UrlEncode(array);
}

async function generateCodeChallenge(verifier: string): Promise<string> {
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  return base64UrlEncode(new Uint8Array(hash));
}

function base64UrlEncode(buffer: Uint8Array): string {
  let base64 = btoa(String.fromCharCode(...buffer));
  // Convert to URL-safe base64
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

// Generate secure state parameter
function generateState(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Decode JWT payload without verification (for ID token)
function decodeJwtPayload(token: string): GoogleUserInfo | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = parts[1];
    // Add padding if needed
    const padded = payload + '='.repeat((4 - payload.length % 4) % 4);
    const decoded = atob(padded.replace(/-/g, '+').replace(/_/g, '/'));
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

// Generate JWT token
async function generateJWT(payload: UserPayload, secret: string): Promise<string> {
  return await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
    },
    secret
  );
}

// Generate a random password hash for OAuth users
// This is a placeholder that the user cannot know or use
async function generateRandomPasswordHash(): Promise<string> {
  const randomPassword = crypto.randomUUID() + crypto.randomUUID();
  const encoder = new TextEncoder();
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const keyMaterial = await crypto.subtle.importKey(
    'raw',
    encoder.encode(randomPassword),
    'PBKDF2',
    false,
    ['deriveBits']
  );
  const derivedBits = await crypto.subtle.deriveBits(
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256'
    },
    keyMaterial,
    256
  );
  const hashArray = new Uint8Array(derivedBits);
  const hashHex = Array.from(hashArray).map(b => b.toString(16).padStart(2, '0')).join('');
  const saltHex = Array.from(salt).map(b => b.toString(16).padStart(2, '0')).join('');
  return `${saltHex}:${hashHex}`;
}

// Verify Turnstile token
async function verifyTurnstile(token: string, secret: string, ip?: string): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const result = await response.json() as { success: boolean };
    return result.success;
  } catch {
    return false;
  }
}

export const oauthApp = new Hono<{ Bindings: Env }>();

// =============================================
// POST /auth/oauth/google/init
// Initiates Google OAuth flow
// =============================================
oauthApp.post('/google/init', async (c) => {
  const { intent, role, registrationData, turnstileToken } = await c.req.json();

  // Validate intent
  if (!['login', 'register', 'link'].includes(intent)) {
    return c.json({ success: false, error: 'Invalid intent' }, 400);
  }

  // Check Google OAuth configuration
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.json({ success: false, error: 'Google OAuth not configured' }, 500);
  }

  const redirectUri = c.env.GOOGLE_REDIRECT_URI || 'https://brillaprep.org/oauth/callback';

  // Note: Turnstile verification is skipped for OAuth flows
  // Google already verifies the user is human through their own security measures

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store state in database (expires in 10 minutes)
  const stateId = `oauth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
  const userAgent = c.req.header('User-Agent') || '';

  await c.env.DB.prepare(`
    INSERT INTO oauth_states (id, state, code_verifier, intent, role, registration_data, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).bind(
    stateId,
    state,
    codeVerifier,
    intent,
    role || null,
    registrationData ? JSON.stringify(registrationData) : null,
    ip,
    userAgent,
    expiresAt
  ).run();

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return c.json({
    success: true,
    data: {
      authUrl,
      state,
    }
  });
});

// =============================================
// POST /auth/oauth/google/callback
// Handles Google OAuth callback
// =============================================
oauthApp.post('/google/callback', async (c) => {
  const { code, state } = await c.req.json();

  if (!code || !state) {
    return c.json({ success: false, error: 'Missing code or state' }, 400);
  }

  // Validate state and retrieve stored data (ISO comparison against bound JS ISO now)
  const storedState = await c.env.DB.prepare(`
    SELECT * FROM oauth_states WHERE state = ? AND expires_at > ?
  `).bind(state, new Date().toISOString()).first();

  if (!storedState) {
    return c.json({ success: false, error: 'Invalid or expired state. Please try again.' }, 400);
  }

  // Delete used state immediately (one-time use)
  await c.env.DB.prepare('DELETE FROM oauth_states WHERE state = ?').bind(state).run();

  const redirectUri = c.env.GOOGLE_REDIRECT_URI || 'https://brillaprep.org/oauth/callback';

  // Exchange code for tokens
  const tokenResponse = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      code,
      client_id: c.env.GOOGLE_CLIENT_ID!,
      client_secret: c.env.GOOGLE_CLIENT_SECRET!,
      redirect_uri: redirectUri,
      grant_type: 'authorization_code',
      code_verifier: storedState.code_verifier as string,
    }),
  });

  if (!tokenResponse.ok) {
    const errorText = await tokenResponse.text();
    console.error('Google token exchange failed:', errorText);
    return c.json({ success: false, error: 'Failed to exchange code. Please try again.' }, 400);
  }

  const tokens: GoogleTokenResponse = await tokenResponse.json();

  // Decode ID token to get user info
  const googleUser = decodeJwtPayload(tokens.id_token);
  if (!googleUser || !googleUser.email) {
    return c.json({ success: false, error: 'Failed to get user info from Google' }, 400);
  }

  const intent = storedState.intent as string;
  const role = storedState.role as string | null;
  const registrationData = storedState.registration_data
    ? JSON.parse(storedState.registration_data as string)
    : null;

  // Check if Google account is already linked
  const existingOAuth = await c.env.DB.prepare(`
    SELECT uop.*, u.id as user_id, u.email, u.name, u.role, u.status, u.house,
           u.year_group, u.school_level, u.school_name, u.xp_points, u.level,
           u.streak_days, u.ai_grading_credits
    FROM user_oauth_providers uop
    JOIN users u ON uop.user_id = u.id
    WHERE uop.provider = 'google' AND uop.provider_user_id = ?
  `).bind(googleUser.sub).first();

  // Check if email exists in users table
  const existingUser = await c.env.DB.prepare(`
    SELECT * FROM users WHERE email = ?
  `).bind(googleUser.email).first();

  let user: Record<string, unknown> | null = null;
  let isNewUser = false;
  let accountLinked = false;

  // Handle based on intent
  if (intent === 'login') {
    if (existingOAuth) {
      // User has Google linked - login success
      user = {
        id: existingOAuth.user_id,
        email: existingOAuth.email,
        name: existingOAuth.name,
        role: existingOAuth.role,
        status: existingOAuth.status,
        house: existingOAuth.house,
        yearGroup: existingOAuth.year_group,
        schoolLevel: existingOAuth.school_level,
        schoolName: existingOAuth.school_name,
        xpPoints: existingOAuth.xp_points,
        level: existingOAuth.level,
        streakDays: existingOAuth.streak_days,
        aiGradingCredits: existingOAuth.ai_grading_credits,
      };

      // Update last_used_at
      await c.env.DB.prepare(`
        UPDATE user_oauth_providers SET last_used_at = datetime('now') WHERE id = ?
      `).bind(existingOAuth.id).run();

    } else if (existingUser) {
      // User exists by email but Google not linked - auto-link
      const oauthId = `oauth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
      await c.env.DB.prepare(`
        INSERT INTO user_oauth_providers (id, user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url)
        VALUES (?, ?, 'google', ?, ?, ?, ?)
      `).bind(
        oauthId,
        existingUser.id,
        googleUser.sub,
        googleUser.email,
        googleUser.name,
        googleUser.picture || null
      ).run();

      user = {
        id: existingUser.id,
        email: existingUser.email,
        name: existingUser.name,
        role: existingUser.role,
        status: existingUser.status,
        house: existingUser.house,
        yearGroup: existingUser.year_group,
        schoolLevel: existingUser.school_level,
        schoolName: existingUser.school_name,
        xpPoints: existingUser.xp_points,
        level: existingUser.level,
        streakDays: existingUser.streak_days,
        aiGradingCredits: existingUser.ai_grading_credits,
      };
      accountLinked = true;

    } else {
      // No account exists - prompt to register
      return c.json({
        success: false,
        error: 'No account found with this email. Please register first.',
        code: 'NO_ACCOUNT',
      }, 404);
    }

    // Check if user is approved
    if (user && user.status !== 'approved') {
      if (user.status === 'pending') {
        return c.json({
          success: false,
          error: 'Your account is pending approval. Please wait for admin review.',
          code: 'PENDING_APPROVAL',
        }, 403);
      }
      if (user.status === 'rejected') {
        return c.json({
          success: false,
          error: 'Your account has been rejected.',
          code: 'REJECTED',
        }, 403);
      }
      if (user.status === 'suspended') {
        return c.json({
          success: false,
          error: 'Your account has been suspended.',
          code: 'SUSPENDED',
        }, 403);
      }
    }

  } else if (intent === 'register') {
    if (existingOAuth || existingUser) {
      return c.json({
        success: false,
        error: 'An account with this email already exists. Please sign in instead.',
        code: 'ACCOUNT_EXISTS',
      }, 409);
    }

    // Create new user
    const userId = `user_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    if (role && !ALLOWED_SELF_SERVE_ROLES.includes(role)) {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }
    const userRole = role || 'student';

    // Parse registration data
    const schoolLevel = registrationData?.schoolLevel || null;
    const yearGroup = registrationData?.yearGroup || null;
    const schoolName = registrationData?.schoolName || null;
    const house = registrationData?.house || null;
    const teacherLicenseNumber = registrationData?.teacherLicenseNumber || null;
    const subjectsTaught = registrationData?.subjectsTaught ? JSON.stringify(registrationData.subjectsTaught) : null;
    const yearsExperience = registrationData?.yearsExperience || null;
    const qualifications = registrationData?.qualifications || null;
    const selectedTierId = registrationData?.selectedTierId || 'tier_free';
    const primaryExamTypeId = registrationData?.primaryExamTypeId || null;

    // Students are auto-approved (Google has verified their email);
    // teachers/parents require admin approval, matching the pending-approval model.
    const status = userRole === 'student' ? 'approved' : 'pending';

    // Generate a random password hash (user cannot know this password)
    // This satisfies the NOT NULL constraint while keeping the account OAuth-only
    const randomPasswordHash = await generateRandomPasswordHash();

    // Batch the user + provider + preference writes so a mid-sequence
    // failure cannot leave a partial account behind.
    const statements = [
      c.env.DB.prepare(`
        INSERT INTO users (
          id, email, name, role, status, password_hash,
          school_level, year_group, school_name, house,
          teacher_license_number, subjects_taught, years_experience, qualifications,
          subscription_tier_id, primary_exam_type_id,
          email_verified, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, datetime('now'), datetime('now'))
      `).bind(
        userId,
        googleUser.email,
        googleUser.name,
        userRole,
        status,
        randomPasswordHash,
        schoolLevel,
        yearGroup,
        schoolName,
        house,
        teacherLicenseNumber,
        subjectsTaught,
        yearsExperience,
        qualifications,
        selectedTierId,
        primaryExamTypeId
      ),
    ];

    // Link Google provider
    const oauthId = `oauth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    statements.push(
      c.env.DB.prepare(`
        INSERT INTO user_oauth_providers (id, user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url)
        VALUES (?, ?, 'google', ?, ?, ?, ?)
      `).bind(
        oauthId,
        userId,
        googleUser.sub,
        googleUser.email,
        googleUser.name,
        googleUser.picture || null
      )
    );

    // Handle exam types if provided
    if (registrationData?.examTypeIds && Array.isArray(registrationData.examTypeIds)) {
      for (const examTypeId of registrationData.examTypeIds) {
        const prefId = `pref_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
        statements.push(
          c.env.DB.prepare(`
            INSERT OR IGNORE INTO user_exam_preferences (id, user_id, exam_type_id, is_primary)
            VALUES (?, ?, ?, ?)
          `).bind(prefId, userId, examTypeId, examTypeId === primaryExamTypeId ? 1 : 0)
        );
      }
    }

    await c.env.DB.batch(statements);

    user = {
      id: userId,
      email: googleUser.email,
      name: googleUser.name,
      role: userRole,
      status,
      house,
      yearGroup,
      schoolLevel,
      schoolName,
      xpPoints: 0,
      level: 1,
      streakDays: 0,
      aiGradingCredits: 0,
    };
    isNewUser = true;

  } else if (intent === 'link') {
    // Link intent requires user_id in state
    const linkUserId = storedState.user_id as string;
    if (!linkUserId) {
      return c.json({ success: false, error: 'Invalid link request' }, 400);
    }

    // Check if Google is already linked to another user
    if (existingOAuth && existingOAuth.user_id !== linkUserId) {
      return c.json({
        success: false,
        error: 'This Google account is already linked to another user.',
        code: 'ALREADY_LINKED',
      }, 409);
    }

    // Check if user already has Google linked
    const userOAuth = await c.env.DB.prepare(`
      SELECT * FROM user_oauth_providers WHERE user_id = ? AND provider = 'google'
    `).bind(linkUserId).first();

    if (userOAuth) {
      return c.json({
        success: false,
        error: 'You already have a Google account linked.',
        code: 'ALREADY_LINKED',
      }, 409);
    }

    // Link the account
    const oauthId = `oauth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    await c.env.DB.prepare(`
      INSERT INTO user_oauth_providers (id, user_id, provider, provider_user_id, provider_email, provider_name, provider_avatar_url)
      VALUES (?, ?, 'google', ?, ?, ?, ?)
    `).bind(
      oauthId,
      linkUserId,
      googleUser.sub,
      googleUser.email,
      googleUser.name,
      googleUser.picture || null
    ).run();

    // Get user details
    const linkedUser = await c.env.DB.prepare(`
      SELECT * FROM users WHERE id = ?
    `).bind(linkUserId).first();

    if (!linkedUser) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    user = {
      id: linkedUser.id,
      email: linkedUser.email,
      name: linkedUser.name,
      role: linkedUser.role,
      status: linkedUser.status,
      house: linkedUser.house,
      yearGroup: linkedUser.year_group,
      schoolLevel: linkedUser.school_level,
      schoolName: linkedUser.school_name,
      xpPoints: linkedUser.xp_points,
      level: linkedUser.level,
      streakDays: linkedUser.streak_days,
      aiGradingCredits: linkedUser.ai_grading_credits,
    };
    accountLinked = true;
  }

  if (!user) {
    return c.json({ success: false, error: 'Authentication failed' }, 500);
  }

  // Generate JWT token
  const token = await generateJWT(
    {
      userId: user.id as string,
      email: user.email as string,
      role: user.role as 'student' | 'teacher' | 'admin' | 'parent',
    },
    c.env.JWT_SECRET
  );

  // Update last login
  await c.env.DB.prepare(`
    UPDATE users SET last_login_at = datetime('now') WHERE id = ?
  `).bind(user.id).run();

  return c.json({
    success: true,
    data: {
      user,
      token,
      isNewUser,
      accountLinked,
      requiresApproval: user.status !== 'approved', // students are auto-approved; teachers/parents go pending
    }
  });
});

// =============================================
// GET /auth/oauth/providers (protected)
// Lists linked OAuth providers for current user
// =============================================
oauthApp.get('/providers', async (c) => {
  // This endpoint needs authentication - check Authorization header
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  let payload: UserPayload | null = null;

  try {
    const { verify } = await import('hono/jwt');
    payload = await verify(token, c.env.JWT_SECRET) as UserPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Get linked providers
  const providers = await c.env.DB.prepare(`
    SELECT provider, provider_email, linked_at, last_used_at
    FROM user_oauth_providers
    WHERE user_id = ?
  `).bind(payload.userId).all();

  // Check if user has password
  const user = await c.env.DB.prepare(`
    SELECT password_hash FROM users WHERE id = ?
  `).bind(payload.userId).first();

  return c.json({
    success: true,
    data: {
      hasPassword: !!user?.password_hash,
      providers: providers.results.map(p => ({
        provider: p.provider,
        email: p.provider_email,
        linkedAt: p.linked_at,
        lastUsedAt: p.last_used_at,
      })),
    }
  });
});

// =============================================
// DELETE /auth/oauth/unlink/google (protected)
// Unlinks Google account
// =============================================
oauthApp.delete('/unlink/google', async (c) => {
  // Check authentication
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  let payload: UserPayload | null = null;

  try {
    const { verify } = await import('hono/jwt');
    payload = await verify(token, c.env.JWT_SECRET) as UserPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Check if user has password (prevent lockout)
  const user = await c.env.DB.prepare(`
    SELECT password_hash FROM users WHERE id = ?
  `).bind(payload.userId).first();

  if (!user?.password_hash) {
    return c.json({
      success: false,
      error: 'Please set a password before unlinking Google to avoid being locked out.',
      code: 'NO_PASSWORD',
    }, 400);
  }

  // Delete the provider link
  const result = await c.env.DB.prepare(`
    DELETE FROM user_oauth_providers WHERE user_id = ? AND provider = 'google'
  `).bind(payload.userId).run();

  if (result.meta.changes === 0) {
    return c.json({
      success: false,
      error: 'Google account not linked',
    }, 404);
  }

  return c.json({
    success: true,
    message: 'Google account unlinked successfully',
  });
});

// =============================================
// POST /auth/oauth/google/link/init (protected)
// Initiates Google OAuth flow for linking
// =============================================
oauthApp.post('/google/link/init', async (c) => {
  // Check authentication
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  let payload: UserPayload | null = null;

  try {
    const { verify } = await import('hono/jwt');
    payload = await verify(token, c.env.JWT_SECRET) as UserPayload;
  } catch {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  // Check if already linked
  const existingLink = await c.env.DB.prepare(`
    SELECT * FROM user_oauth_providers WHERE user_id = ? AND provider = 'google'
  `).bind(payload.userId).first();

  if (existingLink) {
    return c.json({
      success: false,
      error: 'You already have a Google account linked',
    }, 409);
  }

  // Check Google OAuth configuration
  if (!c.env.GOOGLE_CLIENT_ID || !c.env.GOOGLE_CLIENT_SECRET) {
    return c.json({ success: false, error: 'Google OAuth not configured' }, 500);
  }

  const redirectUri = c.env.GOOGLE_REDIRECT_URI || 'https://brillaprep.org/oauth/callback';

  // Generate PKCE parameters
  const codeVerifier = generateCodeVerifier();
  const codeChallenge = await generateCodeChallenge(codeVerifier);
  const state = generateState();

  // Store state with user_id for linking
  const stateId = `oauth_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

  const ip = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || '';
  const userAgent = c.req.header('User-Agent') || '';

  await c.env.DB.prepare(`
    INSERT INTO oauth_states (id, state, code_verifier, intent, user_id, ip_address, user_agent, expires_at)
    VALUES (?, ?, ?, 'link', ?, ?, ?, ?)
  `).bind(
    stateId,
    state,
    codeVerifier,
    payload.userId,
    ip,
    userAgent,
    expiresAt
  ).run();

  // Build Google OAuth URL
  const params = new URLSearchParams({
    client_id: c.env.GOOGLE_CLIENT_ID,
    redirect_uri: redirectUri,
    response_type: 'code',
    scope: 'openid email profile',
    state: state,
    code_challenge: codeChallenge,
    code_challenge_method: 'S256',
    prompt: 'select_account',
  });

  const authUrl = `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;

  return c.json({
    success: true,
    data: {
      authUrl,
      state,
    }
  });
});

export default oauthApp;
