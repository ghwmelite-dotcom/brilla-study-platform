import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';

// Types for Cloudflare bindings
interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  ENVIRONMENT: string;
  ANTHROPIC_API_KEY?: string;
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  RESEND_API_KEY?: string;
  APP_URL?: string;
}

// User type for JWT payload
interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Password hashing using Web Crypto API (PBKDF2)
async function hashPassword(password: string): Promise<string> {
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
    {
      name: 'PBKDF2',
      salt: salt,
      iterations: 100000,
      hash: 'SHA-256',
    },
    keyMaterial,
    256
  );

  // Combine salt and hash, encode as base64
  const combined = new Uint8Array(salt.length + hash.byteLength);
  combined.set(salt);
  combined.set(new Uint8Array(hash), salt.length);
  return btoa(String.fromCharCode(...combined));
}

// Verify password against stored hash
async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  try {
    const encoder = new TextEncoder();
    const combined = Uint8Array.from(atob(storedHash), c => c.charCodeAt(0));
    const salt = combined.slice(0, 16);
    const storedHashBytes = combined.slice(16);

    const keyMaterial = await crypto.subtle.importKey(
      'raw',
      encoder.encode(password),
      'PBKDF2',
      false,
      ['deriveBits']
    );

    const hash = await crypto.subtle.deriveBits(
      {
        name: 'PBKDF2',
        salt: salt,
        iterations: 100000,
        hash: 'SHA-256',
      },
      keyMaterial,
      256
    );

    const hashBytes = new Uint8Array(hash);
    if (hashBytes.length !== storedHashBytes.length) return false;
    return hashBytes.every((byte, i) => byte === storedHashBytes[i]);
  } catch {
    return false;
  }
}

// Generate secure random token
function generateToken(): string {
  const bytes = crypto.getRandomValues(new Uint8Array(32));
  return Array.from(bytes).map(b => b.toString(16).padStart(2, '0')).join('');
}

// Generate JWT token
async function generateJWT(payload: UserPayload, secret: string): Promise<string> {
  return await sign(
    {
      ...payload,
      exp: Math.floor(Date.now() / 1000) + (7 * 24 * 60 * 60), // 7 days
      iat: Math.floor(Date.now() / 1000),
    },
    secret
  );
}

// Verify JWT token
async function verifyJWT(token: string, secret: string): Promise<UserPayload | null> {
  try {
    const payload = await verify(token, secret);
    return payload as UserPayload;
  } catch {
    return null;
  }
}

// Send email via Resend
async function sendEmail(
  apiKey: string,
  fromEmail: string,
  to: string,
  subject: string,
  html: string
): Promise<boolean> {
  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: fromEmail,
        to: [to],
        subject,
        html,
      }),
    });
    if (!response.ok) {
      const errorData = await response.json();
      console.error('Resend API error:', errorData);
    }
    return response.ok;
  } catch (error) {
    console.error('Email send error:', error);
    return false;
  }
}

// Email templates
function getVerificationEmailHTML(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Set Up Your Password - Brilla</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to Brilla!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px;">Your account has been created on the Brilla Study Platform. Click the button below to set up your password and start learning!</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${verificationUrl}" style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Set Up Password</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">This link expires in 24 hours. If you didn't expect this email, please ignore it.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Brilla Study Platform - Excellence in Learning</p>
      </div>
    </body>
    </html>
  `;
}

function getPasswordResetEmailHTML(name: string, resetUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Reset Your Password - Brilla</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Password Reset</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello <strong>${name}</strong>,</p>
        <p style="font-size: 16px;">We received a request to reset your password. Click the button below to create a new password:</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${resetUrl}" style="background: linear-gradient(135deg, #dc2626 0%, #ea580c 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Reset Password</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">This link expires in 1 hour. If you didn't request this, please ignore this email.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Brilla Study Platform - Excellence in Learning</p>
      </div>
    </body>
    </html>
  `;
}

// Claude API helper
async function callClaudeAPI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userMessage: string
): Promise<string> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model: model,
      max_tokens: 1024,
      system: systemPrompt,
      messages: [{ role: 'user', content: userMessage }],
    }),
  });

  if (!response.ok) {
    throw new Error(`Claude API error: ${response.status}`);
  }

  const data = await response.json() as { content: Array<{ text: string }> };
  return data.content[0]?.text || 'No response generated.';
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Public routes (no auth required)
const publicApp = new Hono<{ Bindings: Env }>();

// Health check
publicApp.get('/health', (c) => {
  return c.json({ status: 'ok', environment: c.env.ENVIRONMENT });
});

// =============================================
// EXAM TYPES ENDPOINTS
// =============================================

// Get all exam types
publicApp.get('/exam-types', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM exam_types
      WHERE is_active = 1
      ORDER BY display_order
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch exam types' }, 500);
  }
});

// Get exam type by slug
publicApp.get('/exam-types/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const examType = await c.env.DB.prepare(`
      SELECT * FROM exam_types WHERE slug = ?
    `).bind(slug).first();

    if (!examType) {
      return c.json({ success: false, error: 'Exam type not found' }, 404);
    }

    return c.json({ success: true, data: examType });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch exam type' }, 500);
  }
});

// Get subject categories for an exam type
publicApp.get('/exam-types/:slug/categories', async (c) => {
  const slug = c.req.param('slug');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT sc.* FROM subject_categories sc
      JOIN exam_types et ON sc.exam_type_id = et.id
      WHERE et.slug = ?
      ORDER BY sc.display_order
    `).bind(slug).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch categories' }, 500);
  }
});

// Get paper types for an exam type
publicApp.get('/exam-types/:slug/paper-types', async (c) => {
  const slug = c.req.param('slug');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT pt.* FROM paper_types pt
      JOIN exam_types et ON pt.exam_type_id = et.id
      WHERE et.slug = ?
      ORDER BY pt.display_order
    `).bind(slug).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch paper types' }, 500);
  }
});

// =============================================
// AUTHENTICATION ROUTES
// =============================================

// Register new user (self-registration goes to pending)
publicApp.post('/auth/register', async (c) => {
  const body = await c.req.json();
  const { email, password, name, role, schoolLevel, yearGroup, schoolName, house,
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications } = body;

  try {
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ success: false, error: 'An account with this email already exists.' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const id = `user_${Date.now()}`;
    const userRole = role || 'student';

    // Self-registered users go to pending status
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status, email_verified,
                         school_level, year_group, school_name, house,
                         teacher_license_number, subjects_taught, years_experience, qualifications)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, email, passwordHash, name, userRole,
      schoolLevel || null, yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null
    ).run();

    return c.json({
      success: true,
      data: {
        status: 'pending',
        message: 'Your registration is pending approval. You will be notified once an administrator reviews your application.',
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, error: 'Registration failed' }, 400);
  }
});

// Login
publicApp.post('/auth/login', async (c) => {
  const { email, password } = await c.req.json();
  const clientInfo = getClientInfo(c);

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first();

    if (!result) {
      // Log failed login attempt
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'User not found',
      });
      return c.json({ success: false, error: 'Invalid email or password.' }, 401);
    }

    // Check password
    if (!result.password_hash) {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Password not set',
      });
      return c.json({ success: false, error: 'Please set up your password using the link sent to your email.' }, 401);
    }

    const isValidPassword = await verifyPassword(password, result.password_hash as string);
    if (!isValidPassword) {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Invalid password',
      });
      // Check for multiple failed attempts and log security event
      const { results: recentFailures } = await c.env.DB.prepare(`
        SELECT COUNT(*) as count FROM login_attempts
        WHERE email = ? AND success = 0 AND created_at >= datetime('now', '-1 hour')
      `).bind(email).all();
      const failCount = (recentFailures[0] as { count: number })?.count || 0;
      if (failCount >= 5) {
        await logSecurityEvent(c.env.DB, 'failed_login', failCount >= 10 ? 'high' : 'medium',
          `Multiple failed login attempts for ${email} (${failCount} in last hour)`,
          { userEmail: email, ...clientInfo, metadata: { attemptCount: failCount } }
        );
      }
      return c.json({ success: false, error: 'Invalid email or password.' }, 401);
    }

    // Check account status
    if (result.status === 'pending') {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Account pending approval',
      });
      return c.json({ success: false, error: 'Your account is pending approval.' }, 401);
    }
    if (result.status === 'rejected') {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Account rejected',
      });
      return c.json({ success: false, error: 'Your registration was not approved.' }, 401);
    }
    if (result.status === 'suspended' || !result.is_active) {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Account suspended',
      });
      return c.json({ success: false, error: 'Your account has been suspended.' }, 401);
    }
    if (!result.email_verified) {
      await logLoginAttempt(c.env.DB, email, false, {
        ...clientInfo,
        failureReason: 'Email not verified',
      });
      return c.json({ success: false, error: 'Please verify your email before logging in.' }, 401);
    }

    // Generate JWT
    const token = await generateJWT({
      userId: result.id as string,
      email: result.email as string,
      role: result.role as 'student' | 'teacher' | 'admin',
    }, c.env.JWT_SECRET);

    // Update last login
    await c.env.DB.prepare(`
      UPDATE users SET last_login_at = datetime('now') WHERE id = ?
    `).bind(result.id).run();

    // Log successful login
    await logLoginAttempt(c.env.DB, email, true, clientInfo);
    await logAudit({
      db: c.env.DB,
      userId: result.id as string,
      userEmail: result.email as string,
      userRole: result.role as string,
      action: 'login',
      actionCategory: 'auth',
      ...clientInfo,
    });

    const user = {
      id: result.id,
      email: result.email,
      name: result.name,
      role: result.role,
      status: result.status,
      house: result.house,
      yearGroup: result.year_group,
      schoolLevel: result.school_level,
      schoolName: result.school_name,
      xpPoints: result.xp_points,
      level: result.level,
      streakDays: result.streak_days,
      aiGradingCredits: result.ai_grading_credits,
    };

    return c.json({ success: true, data: { user, token } });
  } catch (error) {
    console.error('Login error:', error);
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Verify token and set password (for admin-created users)
publicApp.post('/auth/set-password', async (c) => {
  const { token, password } = await c.req.json();

  try {
    // Find user by verification token
    const user = await c.env.DB.prepare(`
      SELECT * FROM users WHERE verification_token = ?
    `).bind(token).first();

    if (!user) {
      return c.json({ success: false, error: 'Invalid or expired verification link.' }, 400);
    }

    // Check if token is expired
    if (user.verification_token_expires_at) {
      const expiry = new Date(user.verification_token_expires_at as string);
      if (expiry < new Date()) {
        return c.json({ success: false, error: 'This verification link has expired. Please request a new one.' }, 400);
      }
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(password);

    await c.env.DB.prepare(`
      UPDATE users SET
        password_hash = ?,
        email_verified = 1,
        verification_token = NULL,
        verification_token_expires_at = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(passwordHash, user.id).run();

    return c.json({ success: true, data: { message: 'Password set successfully. You can now log in.' } });
  } catch (error) {
    console.error('Set password error:', error);
    return c.json({ success: false, error: 'Failed to set password' }, 500);
  }
});

// Verify token (check if valid without setting password)
publicApp.get('/auth/verify-token', async (c) => {
  const token = c.req.query('token');

  if (!token) {
    return c.json({ success: false, error: 'Token is required' }, 400);
  }

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, name, email, verification_token_expires_at FROM users WHERE verification_token = ?
    `).bind(token).first();

    if (!user) {
      return c.json({ success: false, valid: false, error: 'Invalid token' });
    }

    // Check if token is expired
    if (user.verification_token_expires_at) {
      const expiry = new Date(user.verification_token_expires_at as string);
      if (expiry < new Date()) {
        return c.json({ success: false, valid: false, error: 'Token expired' });
      }
    }

    return c.json({
      success: true,
      valid: true,
      data: { name: user.name, email: user.email }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Token verification failed' }, 500);
  }
});

// Request password reset
publicApp.post('/auth/forgot-password', async (c) => {
  const { email } = await c.req.json();
  const appUrl = c.env.APP_URL || 'https://brilla.edu.gh';

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, name, email FROM users WHERE email = ?
    `).bind(email).first();

    // Always return success to prevent email enumeration
    if (!user) {
      return c.json({ success: true, data: { message: 'If an account exists, a reset link will be sent.' } });
    }

    // Generate reset token
    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString(); // 1 hour

    await c.env.DB.prepare(`
      UPDATE users SET
        password_reset_token = ?,
        password_reset_expires_at = ?
      WHERE id = ?
    `).bind(resetToken, expiresAt, user.id).run();

    // Send reset email
    if (c.env.RESEND_API_KEY) {
      const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
      await sendEmail(
        c.env.RESEND_API_KEY,
        c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>',
        user.email as string,
        'Reset Your Password - Brilla',
        getPasswordResetEmailHTML(user.name as string, resetUrl)
      );
    }

    return c.json({ success: true, data: { message: 'If an account exists, a reset link will be sent.' } });
  } catch (error) {
    console.error('Forgot password error:', error);
    return c.json({ success: false, error: 'Failed to process request' }, 500);
  }
});

// Reset password with token
publicApp.post('/auth/reset-password', async (c) => {
  const { token, password } = await c.req.json();

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, password_reset_expires_at FROM users WHERE password_reset_token = ?
    `).bind(token).first();

    if (!user) {
      return c.json({ success: false, error: 'Invalid or expired reset link.' }, 400);
    }

    // Check if token is expired
    if (user.password_reset_expires_at) {
      const expiry = new Date(user.password_reset_expires_at as string);
      if (expiry < new Date()) {
        return c.json({ success: false, error: 'This reset link has expired.' }, 400);
      }
    }

    // Hash new password and update user
    const passwordHash = await hashPassword(password);

    await c.env.DB.prepare(`
      UPDATE users SET
        password_hash = ?,
        password_reset_token = NULL,
        password_reset_expires_at = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(passwordHash, user.id).run();

    return c.json({ success: true, data: { message: 'Password reset successfully.' } });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ success: false, error: 'Failed to reset password' }, 500);
  }
});

// Subjects - Now with exam_type and category filtering
publicApp.get('/subjects', async (c) => {
  const examType = c.req.query('exam_type'); // e.g., 'wassce', 'bece', 'nsmq'
  const category = c.req.query('category');   // e.g., 'core', 'science', 'business'

  try {
    let query = `
      SELECT s.*, sc.name as category_name, sc.slug as category_slug, sc.is_core,
             et.name as exam_type_name, et.slug as exam_type_slug
      FROM subjects s
      LEFT JOIN subject_categories sc ON s.category_id = sc.id
      LEFT JOIN exam_types et ON s.exam_type_id = et.id
      WHERE s.is_active = 1
    `;
    const params: string[] = [];

    if (examType) {
      query += ' AND et.slug = ?';
      params.push(examType);
    }

    if (category) {
      query += ' AND sc.slug = ?';
      params.push(category);
    }

    query += ' ORDER BY sc.display_order, s.display_order';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch subjects' }, 500);
  }
});

publicApp.get('/subjects/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const subject = await c.env.DB.prepare(`
      SELECT * FROM subjects WHERE slug = ?
    `).bind(slug).first();

    if (!subject) {
      return c.json({ success: false, error: 'Subject not found' }, 404);
    }

    return c.json({ success: true, data: subject });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch subject' }, 500);
  }
});

// Topics
publicApp.get('/topics', async (c) => {
  const subjectId = c.req.query('subject');

  try {
    let query = 'SELECT * FROM topics';
    const params: string[] = [];

    if (subjectId) {
      query += ' WHERE subject_id = ?';
      params.push(subjectId);
    }

    query += ' ORDER BY display_order';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    // Parse key_formulas JSON
    const topics = results.map((t: Record<string, unknown>) => ({
      ...t,
      keyFormulas: t.key_formulas ? JSON.parse(t.key_formulas as string) : [],
    }));

    return c.json({ success: true, data: topics });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch topics' }, 500);
  }
});

publicApp.get('/topics/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const topic = await c.env.DB.prepare(`
      SELECT * FROM topics WHERE id = ?
    `).bind(id).first();

    if (!topic) {
      return c.json({ success: false, error: 'Topic not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...topic,
        keyFormulas: topic.key_formulas ? JSON.parse(topic.key_formulas as string) : [],
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch topic' }, 500);
  }
});

// Questions
publicApp.get('/questions', async (c) => {
  const subject = c.req.query('subject');
  const topic = c.req.query('topic');
  const difficulty = c.req.query('difficulty');
  const round = c.req.query('round');
  const limit = parseInt(c.req.query('limit') || '20');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    let query = 'SELECT * FROM questions WHERE 1=1';
    const params: (string | number)[] = [];

    if (subject) {
      query += ' AND subject_id = ?';
      params.push(subject);
    }
    if (topic) {
      query += ' AND topic_id = ?';
      params.push(topic);
    }
    if (difficulty) {
      query += ' AND difficulty = ?';
      params.push(difficulty);
    }
    if (round) {
      query += ' AND round_type = ?';
      params.push(round);
    }

    query += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    // Parse options JSON
    const questions = results.map((q: Record<string, unknown>) => ({
      ...q,
      options: q.options ? JSON.parse(q.options as string) : null,
    }));

    return c.json({ success: true, data: questions });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch questions' }, 500);
  }
});

publicApp.get('/questions/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const question = await c.env.DB.prepare(`
      SELECT * FROM questions WHERE id = ?
    `).bind(id).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        ...question,
        options: question.options ? JSON.parse(question.options as string) : null,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch question' }, 500);
  }
});

// Riddles
publicApp.get('/riddles', async (c) => {
  const subject = c.req.query('subject');

  try {
    let query = 'SELECT * FROM riddles';
    const params: string[] = [];

    if (subject) {
      query += ' WHERE subject_id = ?';
      params.push(subject);
    }

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();

    // Format riddles with clues array
    const riddles = results.map((r: Record<string, unknown>) => ({
      id: r.id,
      subjectId: r.subject_id,
      answer: r.answer,
      clues: [r.clue_1, r.clue_2, r.clue_3, r.clue_4, r.clue_5].filter(Boolean),
      difficulty: r.difficulty,
    }));

    return c.json({ success: true, data: riddles });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch riddles' }, 500);
  }
});

// Achievements
publicApp.get('/achievements', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM achievements
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch achievements' }, 500);
  }
});

// Leaderboard
publicApp.get('/leaderboard', async (c) => {
  const period = c.req.query('period') || 'weekly';

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT l.*, u.name as user_name, u.avatar_url as user_avatar, u.house
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.period = ?
      ORDER BY l.score DESC
      LIMIT 100
    `).bind(period).all();

    return c.json({ success: true, data: { entries: results, period } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

// =============================================
// PAST PAPERS ENDPOINTS
// =============================================

// Get past papers with filtering
publicApp.get('/papers', async (c) => {
  const examType = c.req.query('exam_type');
  const subject = c.req.query('subject');
  const year = c.req.query('year');
  const paperType = c.req.query('paper_type');
  const limit = parseInt(c.req.query('limit') || '50');
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    let query = `
      SELECT pp.*,
        s.name as subject_name, s.slug as subject_slug, s.icon as subject_icon, s.color as subject_color,
        pt.name as paper_type_name, pt.slug as paper_type_slug, pt.question_format,
        et.name as exam_type_name, et.slug as exam_type_slug
      FROM past_papers pp
      JOIN subjects s ON pp.subject_id = s.id
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      JOIN exam_types et ON pp.exam_type_id = et.id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (examType) {
      query += ' AND et.slug = ?';
      params.push(examType);
    }
    if (subject) {
      query += ' AND s.slug = ?';
      params.push(subject);
    }
    if (year) {
      query += ' AND pp.year = ?';
      params.push(parseInt(year));
    }
    if (paperType) {
      query += ' AND pt.slug = ?';
      params.push(paperType);
    }

    query += ' ORDER BY pp.year DESC, s.display_order, pt.display_order LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const stmt = c.env.DB.prepare(query).bind(...params);
    const { results } = await stmt.all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch past papers' }, 500);
  }
});

// Get single past paper with questions
publicApp.get('/papers/:id', async (c) => {
  const id = c.req.param('id');

  try {
    // Get paper info
    const paper = await c.env.DB.prepare(`
      SELECT pp.*,
        s.name as subject_name, s.slug as subject_slug,
        pt.name as paper_type_name, pt.question_format, pt.typical_duration,
        et.name as exam_type_name
      FROM past_papers pp
      JOIN subjects s ON pp.subject_id = s.id
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      JOIN exam_types et ON pp.exam_type_id = et.id
      WHERE pp.id = ?
    `).bind(id).first();

    if (!paper) {
      return c.json({ success: false, error: 'Paper not found' }, 404);
    }

    // Get questions for this paper
    const { results: questions } = await c.env.DB.prepare(`
      SELECT q.*, t.name as topic_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.id
      WHERE q.past_paper_id = ?
      ORDER BY q.section, q.question_number
    `).bind(id).all();

    // Parse options for each question
    const parsedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      options: q.options ? JSON.parse(q.options as string) : null,
    }));

    return c.json({
      success: true,
      data: {
        ...paper,
        questions: parsedQuestions,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch paper' }, 500);
  }
});

// Get available years for a subject
publicApp.get('/papers/years', async (c) => {
  const examType = c.req.query('exam_type');
  const subject = c.req.query('subject');

  try {
    let query = `
      SELECT DISTINCT pp.year
      FROM past_papers pp
      JOIN exam_types et ON pp.exam_type_id = et.id
      JOIN subjects s ON pp.subject_id = s.id
      WHERE 1=1
    `;
    const params: string[] = [];

    if (examType) {
      query += ' AND et.slug = ?';
      params.push(examType);
    }
    if (subject) {
      query += ' AND s.slug = ?';
      params.push(subject);
    }

    query += ' ORDER BY pp.year DESC';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);

    const { results } = await stmt.all();
    const years = results.map((r: Record<string, unknown>) => r.year);

    return c.json({ success: true, data: years });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch years' }, 500);
  }
});

// Get essay question details (model answer is free, AI grading is premium)
publicApp.get('/essays/:questionId', async (c) => {
  const questionId = c.req.param('questionId');

  try {
    const essayQuestion = await c.env.DB.prepare(`
      SELECT eq.*, q.question_text, q.marks, q.difficulty, s.name as subject_name
      FROM essay_questions eq
      JOIN questions q ON eq.question_id = q.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE eq.question_id = ?
    `).bind(questionId).first();

    if (!essayQuestion) {
      return c.json({ success: false, error: 'Essay question not found' }, 404);
    }

    // Parse JSON fields
    const data = {
      ...essayQuestion,
      markingScheme: essayQuestion.marking_scheme
        ? JSON.parse(essayQuestion.marking_scheme as string)
        : null,
      markingRubric: essayQuestion.marking_rubric
        ? JSON.parse(essayQuestion.marking_rubric as string)
        : null,
    };

    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch essay question' }, 500);
  }
});

// =====================
// HOUSE CUP ENDPOINTS
// =====================

// Get all houses
publicApp.get('/houses', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h
      ORDER BY is_default DESC, name ASC
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch houses' }, 500);
  }
});

// Get house by ID
publicApp.get('/houses/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const house = await c.env.DB.prepare(`
      SELECT h.*,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h WHERE h.id = ?
    `).bind(id).first();

    if (!house) {
      return c.json({ success: false, error: 'House not found' }, 404);
    }

    return c.json({ success: true, data: house });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch house' }, 500);
  }
});

// Get house standings
publicApp.get('/houses/standings', async (c) => {
  const period = c.req.query('period') || 'all_time';

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        h.id as house_id,
        h.name as house_name,
        h.color as house_color,
        h.icon,
        (SELECT COUNT(*) FROM users WHERE house = h.id) as member_count,
        COALESCE((SELECT SUM(points) FROM house_points WHERE house_id = h.id), 0) as total_points
      FROM houses h
      WHERE h.is_default = 1
      ORDER BY total_points DESC
    `).all();

    // Add rankings
    const standings = results.map((h: Record<string, unknown>, index: number) => ({
      ...h,
      rank: index + 1,
      period,
    }));

    return c.json({ success: true, data: standings });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch standings' }, 500);
  }
});

// Get house members
publicApp.get('/houses/:id/members', async (c) => {
  const id = c.req.param('id');
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.avatar_url, u.xp_points, u.level,
        COALESCE((SELECT SUM(points) FROM house_points WHERE user_id = u.id AND house_id = ?), 0) as house_contribution
      FROM users u
      WHERE u.house = ?
      ORDER BY house_contribution DESC
      LIMIT ?
    `).bind(id, id, limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch members' }, 500);
  }
});

// Get recent house activity
publicApp.get('/houses/activity', async (c) => {
  const limit = parseInt(c.req.query('limit') || '20');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT hp.*, u.name as user_name, h.name as house_name, h.color as house_color
      FROM house_points hp
      JOIN users u ON hp.user_id = u.id
      JOIN houses h ON hp.house_id = h.id
      ORDER BY hp.created_at DESC
      LIMIT ?
    `).bind(limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch activity' }, 500);
  }
});

// =====================
// BATTLE ENDPOINTS
// =====================

// Get available battles to join
publicApp.get('/battles/available', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        u.name as challenger_name, u.avatar_url as challenger_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users u ON b.challenger_id = u.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.status = 'waiting'
      ORDER BY b.created_at DESC
      LIMIT 20
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battles' }, 500);
  }
});

// Get battle by ID
publicApp.get('/battles/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const battle = await c.env.DB.prepare(`
      SELECT b.*,
        c.name as challenger_name, c.avatar_url as challenger_avatar,
        o.name as opponent_name, o.avatar_url as opponent_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users c ON b.challenger_id = c.id
      LEFT JOIN users o ON b.opponent_id = o.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.id = ?
    `).bind(id).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }

    // Parse questions if present
    const data = {
      ...battle,
      questions: battle.questions ? JSON.parse(battle.questions as string) : [],
    };

    return c.json({ success: true, data });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battle' }, 500);
  }
});

// Mount public routes
app.route('/api', publicApp);

// Protected routes (would add JWT middleware in production)
const protectedApp = new Hono<{ Bindings: Env }>();

// Submit answer
protectedApp.post('/questions/:id/attempt', async (c) => {
  const questionId = c.req.param('id');
  const { answer, userId } = await c.req.json();

  try {
    // Get the question
    const question = await c.env.DB.prepare(`
      SELECT * FROM questions WHERE id = ?
    `).bind(questionId).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    const isCorrect = answer.toLowerCase().trim() ===
                      (question.correct_answer as string).toLowerCase().trim();
    const pointsEarned = isCorrect ? (question.points as number) : 0;

    // Record the attempt
    const attemptId = `attempt_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO question_attempts (id, user_id, question_id, user_answer, is_correct, time_taken, points_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(attemptId, userId, questionId, answer, isCorrect ? 1 : 0, 0, pointsEarned).run();

    return c.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        pointsEarned,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Get user progress
protectedApp.get('/progress', async (c) => {
  const userId = c.req.query('userId') || 'user_demo';

  try {
    const { results: progress } = await c.env.DB.prepare(`
      SELECT * FROM user_progress WHERE user_id = ?
    `).bind(userId).all();

    const user = await c.env.DB.prepare(`
      SELECT xp_points, level, streak_days FROM users WHERE id = ?
    `).bind(userId).first();

    const { results: attempts } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total, SUM(is_correct) as correct
      FROM question_attempts WHERE user_id = ?
    `).bind(userId).all();

    const stats = attempts[0] as { total: number; correct: number };

    return c.json({
      success: true,
      data: {
        topicProgress: progress,
        totalAttempted: stats?.total || 0,
        totalCorrect: stats?.correct || 0,
        accuracy: stats?.total ? Math.round((stats.correct / stats.total) * 100) : 0,
        xp: user?.xp_points || 0,
        level: user?.level || 1,
        streak: user?.streak_days || 0,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch progress' }, 500);
  }
});

// =====================
// HOUSE CUP PROTECTED ENDPOINTS
// =====================

// Create custom house (admin only)
protectedApp.post('/houses', async (c) => {
  const { name, color, icon, description, schoolId, userId } = await c.req.json();

  // In production, verify user is admin
  try {
    const user = await c.env.DB.prepare(`
      SELECT role FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user || user.role !== 'admin') {
      return c.json({ success: false, error: 'Admin access required' }, 403);
    }

    const id = `house_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO houses (id, name, color, icon, description, is_default, school_id)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(id, name, color, icon || 'shield', description || null, schoolId || null).run();

    return c.json({ success: true, data: { id, name, color, icon: icon || 'shield', description, isDefault: false, schoolId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create house' }, 500);
  }
});

// Award house points
protectedApp.post('/houses/points', async (c) => {
  const { houseId, userId, points, source, sourceId } = await c.req.json();

  try {
    // Get current period (YYYY-WW format for weekly)
    const now = new Date();
    const weekNum = Math.ceil((now.getDate() - now.getDay() + 1) / 7);
    const period = `${now.getFullYear()}-W${weekNum.toString().padStart(2, '0')}`;

    const id = `hp_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO house_points (id, house_id, user_id, points, source, source_id, period)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(id, houseId, userId, points, source, sourceId || null, period).run();

    return c.json({ success: true, data: { id, houseId, userId, points, source, period } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to award points' }, 500);
  }
});

// Update user's house
protectedApp.put('/users/:id/house', async (c) => {
  const id = c.req.param('id');
  const { houseId } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE users SET house = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(houseId, id).run();

    return c.json({ success: true, data: { userId: id, houseId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update house' }, 500);
  }
});

// =====================
// BATTLE PROTECTED ENDPOINTS
// =====================

// Create a new battle (challenge)
protectedApp.post('/battles', async (c) => {
  const { userId, subjectId, difficulty, questionCount } = await c.req.json();

  try {
    // Fetch random questions for the battle
    let questionsQuery = `
      SELECT * FROM questions
      WHERE question_type IN ('multiple_choice', 'direct_answer')
    `;
    const params: (string | number)[] = [];

    if (subjectId) {
      questionsQuery += ' AND subject_id = ?';
      params.push(subjectId);
    }
    if (difficulty) {
      questionsQuery += ' AND difficulty = ?';
      params.push(difficulty);
    }

    questionsQuery += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(questionCount || 10);

    const { results: questions } = await c.env.DB.prepare(questionsQuery).bind(...params).all();

    // Parse options for each question
    const parsedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      options: q.options ? JSON.parse(q.options as string) : null,
    }));

    const battleId = `battle_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO battles (id, challenger_id, subject_id, difficulty, question_count, questions, status)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting')
    `).bind(
      battleId,
      userId,
      subjectId || null,
      difficulty || 'medium',
      questionCount || 10,
      JSON.stringify(parsedQuestions)
    ).run();

    // Get challenger info
    const challenger = await c.env.DB.prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        id: battleId,
        challengerId: userId,
        challengerName: challenger?.name,
        challengerAvatar: challenger?.avatar_url,
        subjectId,
        difficulty: difficulty || 'medium',
        questionCount: questionCount || 10,
        status: 'waiting',
        challengerScore: 0,
        opponentScore: 0,
        currentQuestion: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to create battle' }, 500);
  }
});

// Join a battle
protectedApp.post('/battles/:id/join', async (c) => {
  const battleId = c.req.param('id');
  const { userId } = await c.req.json();

  try {
    // Check if battle exists and is waiting
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'waiting'
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or already started' }, 404);
    }

    // Can't join own battle
    if (battle.challenger_id === userId) {
      return c.json({ success: false, error: 'Cannot join your own battle' }, 400);
    }

    // Update battle with opponent and start
    await c.env.DB.prepare(`
      UPDATE battles SET
        opponent_id = ?,
        status = 'active',
        started_at = datetime('now')
      WHERE id = ?
    `).bind(userId, battleId).run();

    // Get opponent info
    const opponent = await c.env.DB.prepare(`
      SELECT name, avatar_url FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        battleId,
        opponentId: userId,
        opponentName: opponent?.name,
        opponentAvatar: opponent?.avatar_url,
        status: 'active',
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
  }
});

// Submit answer in battle
protectedApp.post('/battles/:id/answer', async (c) => {
  const battleId = c.req.param('id');
  const { userId, questionIndex, answer, timeTaken } = await c.req.json();

  try {
    // Get battle
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'active'
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or not active' }, 404);
    }

    // Verify user is part of battle
    if (battle.challenger_id !== userId && battle.opponent_id !== userId) {
      return c.json({ success: false, error: 'Not a participant in this battle' }, 403);
    }

    // Get question from battle questions
    const questions = JSON.parse(battle.questions as string);
    const question = questions[questionIndex];

    if (!question) {
      return c.json({ success: false, error: 'Invalid question index' }, 400);
    }

    // Check if already answered
    const existing = await c.env.DB.prepare(`
      SELECT id FROM battle_answers WHERE battle_id = ? AND user_id = ? AND question_index = ?
    `).bind(battleId, userId, questionIndex).first();

    if (existing) {
      return c.json({ success: false, error: 'Already answered this question' }, 400);
    }

    // Check answer
    const isCorrect = answer.toLowerCase().trim() === question.correct_answer.toLowerCase().trim();
    const pointsEarned = isCorrect ? (question.points || 3) : 0;

    // Record answer
    const answerId = `ba_${Date.now()}_${userId}`;
    await c.env.DB.prepare(`
      INSERT INTO battle_answers (id, battle_id, user_id, question_index, answer, is_correct, time_taken, points_earned)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(answerId, battleId, userId, questionIndex, answer, isCorrect ? 1 : 0, timeTaken || 0, pointsEarned).run();

    // Update score
    const scoreField = userId === battle.challenger_id ? 'challenger_score' : 'opponent_score';
    await c.env.DB.prepare(`
      UPDATE battles SET ${scoreField} = ${scoreField} + ? WHERE id = ?
    `).bind(pointsEarned, battleId).run();

    // Check if battle is complete (both answered all questions)
    const { results: answerCounts } = await c.env.DB.prepare(`
      SELECT user_id, COUNT(*) as count FROM battle_answers WHERE battle_id = ? GROUP BY user_id
    `).bind(battleId).all();

    const totalQuestions = questions.length;
    const bothComplete = answerCounts.length === 2 &&
      answerCounts.every((ac: Record<string, unknown>) => (ac.count as number) >= totalQuestions);

    if (bothComplete) {
      // Get final scores
      const updatedBattle = await c.env.DB.prepare(`
        SELECT challenger_score, opponent_score, challenger_id, opponent_id FROM battles WHERE id = ?
      `).bind(battleId).first();

      const winnerId = updatedBattle!.challenger_score > updatedBattle!.opponent_score
        ? updatedBattle!.challenger_id
        : updatedBattle!.opponent_score > updatedBattle!.challenger_score
          ? updatedBattle!.opponent_id
          : null; // Tie

      await c.env.DB.prepare(`
        UPDATE battles SET status = 'completed', winner_id = ?, completed_at = datetime('now') WHERE id = ?
      `).bind(winnerId, battleId).run();
    }

    return c.json({
      success: true,
      data: {
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        pointsEarned,
        battleComplete: bothComplete,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Cancel/forfeit battle
protectedApp.post('/battles/:id/cancel', async (c) => {
  const battleId = c.req.param('id');
  const { userId } = await c.req.json();

  try {
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status IN ('waiting', 'active')
    `).bind(battleId).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found or already finished' }, 404);
    }

    // Verify user is part of battle
    if (battle.challenger_id !== userId && battle.opponent_id !== userId) {
      return c.json({ success: false, error: 'Not a participant in this battle' }, 403);
    }

    // If battle was active, the other player wins
    let winnerId = null;
    if (battle.status === 'active') {
      winnerId = battle.challenger_id === userId ? battle.opponent_id : battle.challenger_id;
    }

    await c.env.DB.prepare(`
      UPDATE battles SET status = 'cancelled', winner_id = ?, completed_at = datetime('now') WHERE id = ?
    `).bind(winnerId, battleId).run();

    return c.json({ success: true, data: { battleId, status: 'cancelled', winnerId } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to cancel battle' }, 500);
  }
});

// Get user's battle history
protectedApp.get('/battles/history', async (c) => {
  const userId = c.req.query('userId');
  const limit = parseInt(c.req.query('limit') || '20');

  if (!userId) {
    return c.json({ success: false, error: 'userId required' }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        c.name as challenger_name, c.avatar_url as challenger_avatar,
        o.name as opponent_name, o.avatar_url as opponent_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users c ON b.challenger_id = c.id
      LEFT JOIN users o ON b.opponent_id = o.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.challenger_id = ? OR b.opponent_id = ?
      ORDER BY b.created_at DESC
      LIMIT ?
    `).bind(userId, userId, limit).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch battle history' }, 500);
  }
});

// =============================================
// PAPER ATTEMPT ENDPOINTS (Timed Practice)
// =============================================

// Start a paper attempt
protectedApp.post('/papers/:id/attempt', async (c) => {
  const paperId = c.req.param('id');
  const { userId } = await c.req.json();

  try {
    // Get paper info
    const paper = await c.env.DB.prepare(`
      SELECT pp.*, pt.typical_duration
      FROM past_papers pp
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      WHERE pp.id = ?
    `).bind(paperId).first();

    if (!paper) {
      return c.json({ success: false, error: 'Paper not found' }, 404);
    }

    // Check for existing in-progress attempt
    const existing = await c.env.DB.prepare(`
      SELECT id FROM paper_attempts
      WHERE user_id = ? AND paper_id = ? AND status = 'in_progress'
    `).bind(userId, paperId).first();

    if (existing) {
      return c.json({ success: false, error: 'You have an ongoing attempt for this paper', existingAttemptId: existing.id }, 400);
    }

    const attemptId = `pa_${Date.now()}`;
    const timeAllowed = paper.time_allowed || paper.typical_duration || 180; // Default 3 hours

    await c.env.DB.prepare(`
      INSERT INTO paper_attempts (id, user_id, paper_id, status, time_allowed)
      VALUES (?, ?, ?, 'in_progress', ?)
    `).bind(attemptId, userId, paperId, timeAllowed).run();

    return c.json({
      success: true,
      data: {
        attemptId,
        paperId,
        timeAllowed,
        startedAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to start paper attempt' }, 500);
  }
});

// Save answer for paper attempt
protectedApp.put('/papers/attempts/:attemptId/answer', async (c) => {
  const attemptId = c.req.param('attemptId');
  const { questionId, answer, timeTaken, userId } = await c.req.json();

  try {
    // Verify attempt belongs to user and is in progress
    const attempt = await c.env.DB.prepare(`
      SELECT * FROM paper_attempts WHERE id = ? AND user_id = ? AND status = 'in_progress'
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or already submitted' }, 404);
    }

    // Check if answer already exists
    const existing = await c.env.DB.prepare(`
      SELECT id FROM paper_attempt_answers WHERE attempt_id = ? AND question_id = ?
    `).bind(attemptId, questionId).first();

    if (existing) {
      // Update existing answer
      await c.env.DB.prepare(`
        UPDATE paper_attempt_answers
        SET answer_text = ?, time_taken = ?, answered_at = datetime('now')
        WHERE id = ?
      `).bind(answer, timeTaken || 0, existing.id).run();
    } else {
      // Insert new answer
      const answerId = `paa_${Date.now()}`;
      await c.env.DB.prepare(`
        INSERT INTO paper_attempt_answers (id, attempt_id, question_id, answer_text, time_taken)
        VALUES (?, ?, ?, ?, ?)
      `).bind(answerId, attemptId, questionId, answer, timeTaken || 0).run();
    }

    return c.json({ success: true, data: { saved: true } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to save answer' }, 500);
  }
});

// Submit paper attempt
protectedApp.post('/papers/attempts/:attemptId/submit', async (c) => {
  const attemptId = c.req.param('attemptId');
  const { userId, timeUsed } = await c.req.json();

  try {
    // Verify attempt
    const attempt = await c.env.DB.prepare(`
      SELECT pa.*, pp.total_marks
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      WHERE pa.id = ? AND pa.user_id = ? AND pa.status = 'in_progress'
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or already submitted' }, 404);
    }

    // Get all answers and grade objective questions
    const { results: answers } = await c.env.DB.prepare(`
      SELECT paa.*, q.correct_answer, q.marks, q.question_type
      FROM paper_attempt_answers paa
      JOIN questions q ON paa.question_id = q.id
      WHERE paa.attempt_id = ?
    `).bind(attemptId).all();

    let totalScore = 0;

    // Grade each answer (only objective questions auto-graded)
    for (const ans of answers) {
      const answer = ans as Record<string, unknown>;
      const isObjective = ['multiple_choice', 'true_false'].includes(answer.question_type as string);

      if (isObjective) {
        const isCorrect = (answer.answer_text as string).toLowerCase().trim() ===
                         (answer.correct_answer as string).toLowerCase().trim();
        const marksEarned = isCorrect ? (answer.marks as number) : 0;

        await c.env.DB.prepare(`
          UPDATE paper_attempt_answers
          SET is_correct = ?, marks_earned = ?
          WHERE id = ?
        `).bind(isCorrect ? 1 : 0, marksEarned, answer.id).run();

        totalScore += marksEarned;
      }
    }

    // Calculate percentage
    const totalMarks = attempt.total_marks as number || 100;
    const percentageScore = Math.round((totalScore / totalMarks) * 100);

    // Update attempt
    await c.env.DB.prepare(`
      UPDATE paper_attempts
      SET status = 'completed', time_used = ?, total_score = ?, percentage_score = ?, submitted_at = datetime('now')
      WHERE id = ?
    `).bind(timeUsed || 0, totalScore, percentageScore, attemptId).run();

    return c.json({
      success: true,
      data: {
        attemptId,
        totalScore,
        totalMarks,
        percentageScore,
        status: 'completed',
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit paper' }, 500);
  }
});

// Get paper attempt results
protectedApp.get('/papers/attempts/:attemptId/results', async (c) => {
  const attemptId = c.req.param('attemptId');
  const userId = c.req.query('userId');

  try {
    const attempt = await c.env.DB.prepare(`
      SELECT pa.*, pp.title as paper_title, pp.year, s.name as subject_name, pt.name as paper_type_name
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      JOIN subjects s ON pp.subject_id = s.id
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      WHERE pa.id = ? AND pa.user_id = ?
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    // Get answers with questions
    const { results: answers } = await c.env.DB.prepare(`
      SELECT paa.*, q.question_text, q.correct_answer, q.explanation, q.marks, q.question_type
      FROM paper_attempt_answers paa
      JOIN questions q ON paa.question_id = q.id
      WHERE paa.attempt_id = ?
      ORDER BY q.section, q.question_number
    `).bind(attemptId).all();

    return c.json({
      success: true,
      data: {
        attempt,
        answers,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch results' }, 500);
  }
});

// =============================================
// ESSAY SUBMISSION & GRADING ENDPOINTS
// =============================================

// Submit essay for grading
protectedApp.post('/essays/submit', async (c) => {
  const { userId, questionId, answerText, gradingType } = await c.req.json();

  try {
    // Get user subscription info
    const user = await c.env.DB.prepare(`
      SELECT u.*, st.ai_grading_quota
      FROM users u
      LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check AI grading eligibility
    const wantsAIGrading = gradingType === 'ai';
    const quota = (user.ai_grading_quota as number) || 0;
    const credits = (user.ai_grading_credits as number) || 0;
    const canUseAI = quota === -1 || credits > 0; // -1 = unlimited

    if (wantsAIGrading && !canUseAI) {
      return c.json({
        success: false,
        error: 'AI grading not available. Please upgrade your subscription.',
        upgradeRequired: true,
      }, 403);
    }

    // Count words
    const wordCount = answerText.trim().split(/\s+/).filter((w: string) => w.length > 0).length;

    const attemptId = `ea_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO essay_attempts (id, user_id, question_id, answer_text, word_count, grading_type, grading_status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).bind(
      attemptId,
      userId,
      questionId,
      answerText,
      wordCount,
      wantsAIGrading ? 'ai' : 'self',
      wantsAIGrading ? 'pending' : 'graded'
    ).run();

    // Deduct AI credit if using AI grading
    if (wantsAIGrading && quota !== -1) {
      await c.env.DB.prepare(`
        UPDATE users SET ai_grading_credits = ai_grading_credits - 1 WHERE id = ?
      `).bind(userId).run();
    }

    return c.json({
      success: true,
      data: {
        attemptId,
        wordCount,
        gradingType: wantsAIGrading ? 'ai' : 'self',
        gradingStatus: wantsAIGrading ? 'pending' : 'graded',
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to submit essay' }, 500);
  }
});

// AI grade essay (triggered after submission)
protectedApp.post('/essays/:attemptId/grade', async (c) => {
  const attemptId = c.req.param('attemptId');
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const model = c.env.AI_MODEL || 'claude-3-haiku-20240307';

  try {
    // Get essay attempt with question details
    const attempt = await c.env.DB.prepare(`
      SELECT ea.*, eq.marking_scheme, eq.marking_rubric, eq.word_limit_min, eq.word_limit_max,
             q.question_text, q.marks, s.name as subject_name
      FROM essay_attempts ea
      JOIN essay_questions eq ON ea.question_id = eq.question_id
      JOIN questions q ON ea.question_id = q.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE ea.id = ? AND ea.grading_type = 'ai' AND ea.grading_status = 'pending'
    `).bind(attemptId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Essay attempt not found or not eligible for AI grading' }, 404);
    }

    // Update status to grading
    await c.env.DB.prepare(`
      UPDATE essay_attempts SET grading_status = 'grading' WHERE id = ?
    `).bind(attemptId).run();

    let aiFeedback: Record<string, unknown>;
    let aiScore: number;

    if (apiKey) {
      // Use Claude for grading
      const markingScheme = attempt.marking_scheme
        ? JSON.parse(attempt.marking_scheme as string)
        : null;

      const systemPrompt = `You are an experienced WAEC examiner grading a ${attempt.subject_name} essay.
Grade fairly and constructively. Provide specific feedback with examples from the student's work.
Total marks available: ${attempt.marks}
${markingScheme ? `Marking criteria: ${JSON.stringify(markingScheme)}` : ''}
Word limits: ${attempt.word_limit_min || 'None'} - ${attempt.word_limit_max || 'None'} words

Return your assessment as a JSON object with this structure:
{
  "overallScore": number,
  "overallFeedback": "string",
  "criteriaScores": [{"criterionName": "string", "score": number, "maxScore": number, "feedback": "string"}],
  "strengths": ["string"],
  "areasForImprovement": ["string"],
  "suggestions": ["string"]
}`;

      const userPrompt = `Question: ${attempt.question_text}

Student's Answer (${attempt.word_count} words):
${attempt.answer_text}

Please grade this essay.`;

      const response = await callClaudeAPI(apiKey, model, systemPrompt, userPrompt);

      try {
        // Extract JSON from response
        const jsonMatch = response.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          aiFeedback = JSON.parse(jsonMatch[0]);
          aiScore = (aiFeedback as { overallScore: number }).overallScore;
        } else {
          throw new Error('No JSON in response');
        }
      } catch {
        // Fallback if JSON parsing fails
        aiFeedback = {
          overallScore: Math.floor((attempt.marks as number) * 0.7),
          overallFeedback: response,
          criteriaScores: [],
          strengths: ['Essay submitted successfully'],
          areasForImprovement: ['Review feedback for detailed assessment'],
          suggestions: [],
        };
        aiScore = (aiFeedback as { overallScore: number }).overallScore;
      }
    } else {
      // Mock grading
      const mockScore = Math.floor((attempt.marks as number) * (0.5 + Math.random() * 0.4));
      aiFeedback = {
        overallScore: mockScore,
        overallFeedback: 'This is a mock grading response. Configure ANTHROPIC_API_KEY for real AI grading.',
        criteriaScores: [
          { criterionName: 'Content', score: Math.floor(mockScore * 0.4), maxScore: Math.floor((attempt.marks as number) * 0.4), feedback: 'Good content coverage.' },
          { criterionName: 'Organization', score: Math.floor(mockScore * 0.3), maxScore: Math.floor((attempt.marks as number) * 0.3), feedback: 'Well organized structure.' },
          { criterionName: 'Language', score: Math.floor(mockScore * 0.3), maxScore: Math.floor((attempt.marks as number) * 0.3), feedback: 'Good language use.' },
        ],
        strengths: ['Clear introduction', 'Good use of examples'],
        areasForImprovement: ['Could include more specific details', 'Check grammar and spelling'],
        suggestions: ['Review similar past paper answers', 'Practice essay structure'],
      };
      aiScore = mockScore;
    }

    // Update attempt with grading results
    await c.env.DB.prepare(`
      UPDATE essay_attempts
      SET grading_status = 'graded', ai_score = ?, ai_feedback = ?, final_score = ?, graded_at = datetime('now')
      WHERE id = ?
    `).bind(aiScore, JSON.stringify(aiFeedback), aiScore, attemptId).run();

    return c.json({
      success: true,
      data: {
        attemptId,
        score: aiScore,
        maxScore: attempt.marks,
        feedback: aiFeedback,
      },
    });
  } catch (error) {
    // Update status to failed
    await c.env.DB.prepare(`
      UPDATE essay_attempts SET grading_status = 'failed' WHERE id = ?
    `).bind(attemptId).run();

    return c.json({ success: false, error: 'Failed to grade essay' }, 500);
  }
});

// Get user's essay history
protectedApp.get('/essays/history', async (c) => {
  const userId = c.req.query('userId');
  const limit = parseInt(c.req.query('limit') || '20');

  if (!userId) {
    return c.json({ success: false, error: 'userId required' }, 400);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT ea.*, q.question_text, q.marks, s.name as subject_name
      FROM essay_attempts ea
      JOIN questions q ON ea.question_id = q.id
      JOIN subjects s ON q.subject_id = s.id
      WHERE ea.user_id = ?
      ORDER BY ea.created_at DESC
      LIMIT ?
    `).bind(userId, limit).all();

    // Parse feedback JSON
    const attempts = results.map((a: Record<string, unknown>) => ({
      ...a,
      aiFeedback: a.ai_feedback ? JSON.parse(a.ai_feedback as string) : null,
    }));

    return c.json({ success: true, data: attempts });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch essay history' }, 500);
  }
});

// =====================
// AI TUTOR ENDPOINTS
// =====================

// AI explain question/answer
protectedApp.post('/ai/explain', async (c) => {
  const { question, userAnswer, correctAnswer, isCorrect, userId, context } = await c.req.json();
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const model = c.env.AI_MODEL || 'claude-3-haiku-20240307';

  try {
    const exam = getExamContext(context);
    const systemPrompt = `You are Brilla AI, a helpful tutor for ${exam.examDescription} preparation.
You specialize in ${exam.subjects}.
Be concise (2-3 paragraphs max), encouraging, and focus on helping students understand concepts for their ${exam.examType.toUpperCase()} exams.`;

    const userPrompt = `Question: ${question}
${userAnswer ? `Student's Answer: ${userAnswer}` : ''}
Correct Answer: ${correctAnswer}
${isCorrect !== undefined ? `Result: ${isCorrect ? 'Correct' : 'Incorrect'}` : ''}

Please explain:
1. The correct answer and why it's correct
2. ${!isCorrect && userAnswer ? "Why the student's answer was incorrect" : 'Key concepts to remember'}
3. A helpful tip or memory trick for similar questions`;

    let explanation: string;
    let provider: string;

    if (apiKey) {
      // Use Claude API
      explanation = await callClaudeAPI(apiKey, model, systemPrompt, userPrompt);
      provider = 'anthropic';
    } else {
      // Fallback to mock response
      explanation = generateMockExplanation(question, correctAnswer, isCorrect, userAnswer, context);
      provider = 'mock';
    }

    return c.json({
      success: true,
      data: { explanation, provider },
    });
  } catch (error) {
    console.error('AI explain error:', error);
    // Fallback to mock on error
    const mockResponse = generateMockExplanation(question, correctAnswer, isCorrect, userAnswer, context);
    return c.json({
      success: true,
      data: { explanation: mockResponse, provider: 'mock' },
    });
  }
});

// AI chat
protectedApp.post('/ai/chat', async (c) => {
  const { message, context, conversationHistory, userId, userName, userPersonalization } = await c.req.json();
  const apiKey = c.env.ANTHROPIC_API_KEY;
  const model = c.env.AI_MODEL || 'claude-3-haiku-20240307';

  try {
    const exam = getExamContext(context);
    const displayName = userName || userPersonalization?.preferredName || userPersonalization?.name;

    const systemPrompt = `You are Brilla AI, a warm, encouraging, and personable tutor for ${exam.examName} preparation.
You specialize in ${exam.subjects}.

PERSONALITY & COMMUNICATION STYLE:
- Be warm, friendly, and genuinely caring - like a supportive older sibling or favorite teacher
- Use the student's name naturally in conversation${displayName ? ` (their name is ${displayName})` : ''}
- Be encouraging but authentic - celebrate their efforts and progress
- Show genuine interest in helping them succeed
- Use casual, approachable language while maintaining educational value
- Add occasional light humor or relatable examples

RESPONSE GUIDELINES:
- Keep responses concise (under 200 words) but warm
- Use markdown formatting for formulas and key concepts
- End with a follow-up question or encouragement to keep the conversation going
- Reference their progress or previous topics when relevant
- Be patient with repeated questions - explain differently each time

${context ? `Current context: ${context}` : ''}
${userPersonalization?.weakAreas ? `Areas to focus on: ${userPersonalization.weakAreas.join(', ')}` : ''}
${userPersonalization?.strengths ? `Student's strengths: ${userPersonalization.strengths.join(', ')}` : ''}`;

    let response: string;
    let provider: string;

    if (apiKey) {
      // Use Claude API
      response = await callClaudeAPI(apiKey, model, systemPrompt, message);
      provider = 'anthropic';
    } else {
      // Fallback to mock response
      response = generateMockChatResponse(message, context, displayName);
      provider = 'mock';
    }

    return c.json({
      success: true,
      data: { message: response, provider },
    });
  } catch (error) {
    console.error('AI chat error:', error);
    // Fallback to mock on error
    const mockResponse = generateMockChatResponse(message, context, userName);
    return c.json({
      success: true,
      data: { message: mockResponse, provider: 'mock' },
    });
  }
});

// AI hint for current question
protectedApp.post('/ai/hint', async (c) => {
  const { question, hintLevel, userId } = await c.req.json();

  try {
    // hintLevel: 1 = subtle hint, 2 = moderate hint, 3 = strong hint
    const mockHint = generateMockHint(question, hintLevel || 1);

    return c.json({
      success: true,
      data: {
        hint: mockHint,
        hintLevel: hintLevel || 1,
        provider: 'mock',
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to generate hint' }, 500);
  }
});

// AI study plan generation
protectedApp.post('/ai/study-plan', async (c) => {
  const { userId, weakTopics, strongTopics, targetDate, context } = await c.req.json();

  try {
    const exam = getExamContext(context);
    const mockPlan = {
      overview: `Based on your performance, here's a personalized study plan to maximize your ${exam.examType.toUpperCase()} readiness.`,
      dailyGoals: [
        "Practice 20 questions across all subjects",
        "Focus 40% of time on weak topics",
        "Review 5 formula cards daily",
        `Complete 1 ${exam.examType.toUpperCase()} practice session`
      ],
      weeklyFocus: weakTopics?.slice(0, 3) || ['Calculus', 'Thermodynamics', 'Organic Chemistry'],
      recommendations: [
        "Start each session with your weakest topic when your mind is fresh",
        "Use spaced repetition for formula memorization",
        `Practice with past ${exam.examType.toUpperCase()} questions under timed conditions`
      ],
      estimatedReadiness: 75,
    };

    return c.json({
      success: true,
      data: mockPlan,
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to generate study plan' }, 500);
  }
});

// =============================================
// USER SELF-SERVICE ENDPOINTS
// =============================================

// Middleware to verify authenticated user
const userAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  c.set('user', payload);
  await next();
};

// Update current user's profile
protectedApp.put('/users/me', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const { name, schoolName, house } = await c.req.json();

  try {
    await c.env.DB.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        school_name = COALESCE(?, school_name),
        house = COALESCE(?, house),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(name || null, schoolName || null, house || null, user.userId).run();

    return c.json({ success: true, data: { message: 'Profile updated successfully' } });
  } catch (error) {
    console.error('Update profile error:', error);
    return c.json({ success: false, error: 'Failed to update profile' }, 500);
  }
});

// Change password
protectedApp.post('/users/me/change-password', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const { currentPassword, newPassword } = await c.req.json();

  try {
    // Get current password hash
    const dbUser = await c.env.DB.prepare(`
      SELECT password_hash FROM users WHERE id = ?
    `).bind(user.userId).first();

    if (!dbUser || !dbUser.password_hash) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Verify current password
    const isValid = await verifyPassword(currentPassword, dbUser.password_hash as string);
    if (!isValid) {
      return c.json({ success: false, error: 'Current password is incorrect' }, 400);
    }

    // Hash new password
    const newHash = await hashPassword(newPassword);

    // Update password
    await c.env.DB.prepare(`
      UPDATE users SET
        password_hash = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(newHash, user.userId).run();

    return c.json({ success: true, data: { message: 'Password changed successfully' } });
  } catch (error) {
    console.error('Change password error:', error);
    return c.json({ success: false, error: 'Failed to change password' }, 500);
  }
});

// =============================================
// PARENT MONITORING ENDPOINTS
// =============================================

// Generate 6-character invite code for student
function generateInviteCode(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Excluding confusing chars
  let code = '';
  for (let i = 0; i < 6; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// =============================================
// AUDIT LOGGING UTILITIES
// =============================================

type AuditCategory = 'auth' | 'user_management' | 'content' | 'practice' | 'parent' | 'admin' | 'settings' | 'api' | 'security';
type AuditStatus = 'success' | 'failure' | 'warning';
type SecurityEventType = 'failed_login' | 'account_locked' | 'password_reset' | 'suspicious_activity' | 'rate_limit_exceeded' | 'unauthorized_access' | 'permission_escalation' | 'data_export' | 'bulk_operation' | 'api_key_usage';
type SecuritySeverity = 'low' | 'medium' | 'high' | 'critical';

interface AuditLogParams {
  db: D1Database;
  userId?: string;
  userEmail?: string;
  userRole?: string;
  action: string;
  actionCategory: AuditCategory;
  targetType?: string;
  targetId?: string;
  targetDetails?: string;
  ipAddress?: string;
  userAgent?: string;
  requestPath?: string;
  requestMethod?: string;
  status?: AuditStatus;
  errorMessage?: string;
  metadata?: Record<string, unknown>;
}

// Main audit logging function
async function logAudit(params: AuditLogParams): Promise<void> {
  try {
    const id = `audit_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await params.db.prepare(`
      INSERT INTO audit_log (
        id, user_id, user_email, user_role, action, action_category,
        target_type, target_id, target_details, ip_address, user_agent,
        request_path, request_method, status, error_message, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      params.userId || null,
      params.userEmail || null,
      params.userRole || null,
      params.action,
      params.actionCategory,
      params.targetType || null,
      params.targetId || null,
      params.targetDetails || null,
      params.ipAddress || null,
      params.userAgent || null,
      params.requestPath || null,
      params.requestMethod || null,
      params.status || 'success',
      params.errorMessage || null,
      params.metadata ? JSON.stringify(params.metadata) : null
    ).run();
  } catch (error) {
    console.error('Failed to log audit entry:', error);
  }
}

// Log security events
async function logSecurityEvent(
  db: D1Database,
  eventType: SecurityEventType,
  severity: SecuritySeverity,
  description: string,
  options: {
    userId?: string;
    userEmail?: string;
    ipAddress?: string;
    userAgent?: string;
    metadata?: Record<string, unknown>;
  } = {}
): Promise<void> {
  try {
    const id = `sec_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.prepare(`
      INSERT INTO security_events (
        id, event_type, severity, user_id, user_email, ip_address, user_agent, description, metadata
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      eventType,
      severity,
      options.userId || null,
      options.userEmail || null,
      options.ipAddress || null,
      options.userAgent || null,
      description,
      options.metadata ? JSON.stringify(options.metadata) : null
    ).run();
  } catch (error) {
    console.error('Failed to log security event:', error);
  }
}

// Log login attempts
async function logLoginAttempt(
  db: D1Database,
  email: string,
  success: boolean,
  options: {
    ipAddress?: string;
    userAgent?: string;
    failureReason?: string;
  } = {}
): Promise<void> {
  try {
    const id = `login_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.prepare(`
      INSERT INTO login_attempts (id, email, ip_address, user_agent, success, failure_reason)
      VALUES (?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      email,
      options.ipAddress || null,
      options.userAgent || null,
      success ? 1 : 0,
      options.failureReason || null
    ).run();
  } catch (error) {
    console.error('Failed to log login attempt:', error);
  }
}

// Log data changes for compliance
async function logDataChange(
  db: D1Database,
  tableName: string,
  recordId: string,
  operation: 'INSERT' | 'UPDATE' | 'DELETE',
  changedBy: string | null,
  options: {
    oldValues?: Record<string, unknown>;
    newValues?: Record<string, unknown>;
    changedFields?: string[];
    reason?: string;
  } = {}
): Promise<void> {
  try {
    const id = `change_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    await db.prepare(`
      INSERT INTO data_change_log (
        id, table_name, record_id, operation, changed_by,
        old_values, new_values, changed_fields, reason
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id,
      tableName,
      recordId,
      operation,
      changedBy,
      options.oldValues ? JSON.stringify(options.oldValues) : null,
      options.newValues ? JSON.stringify(options.newValues) : null,
      options.changedFields ? JSON.stringify(options.changedFields) : null,
      options.reason || null
    ).run();
  } catch (error) {
    console.error('Failed to log data change:', error);
  }
}

// Helper to get client info from request
function getClientInfo(c: { req: { header: (name: string) => string | undefined; path: string; method: string } }): {
  ipAddress: string;
  userAgent: string;
  requestPath: string;
  requestMethod: string;
} {
  return {
    ipAddress: c.req.header('cf-connecting-ip') || c.req.header('x-forwarded-for') || 'unknown',
    userAgent: c.req.header('user-agent') || 'unknown',
    requestPath: c.req.path,
    requestMethod: c.req.method,
  };
}

// Student: Generate parent invite code
protectedApp.post('/students/parent-invite', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role !== 'student') {
    return c.json({ success: false, error: 'Only students can generate parent invite codes' }, 403);
  }

  try {
    // Check for existing active/pending links
    const { results: existingLinks } = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM parent_student_links
      WHERE student_id = ? AND status IN ('active', 'pending')
    `).bind(user.userId).all();

    const existingCount = (existingLinks[0] as { count: number })?.count || 0;

    // Generate unique invite code
    let inviteCode = generateInviteCode();
    let attempts = 0;
    while (attempts < 10) {
      const existing = await c.env.DB.prepare(`
        SELECT id FROM parent_student_links WHERE invite_code = ?
      `).bind(inviteCode).first();
      if (!existing) break;
      inviteCode = generateInviteCode();
      attempts++;
    }

    // Create pending link with invite code (expires in 48 hours)
    const id = `psl_${Date.now()}`;
    const expiresAt = new Date(Date.now() + 48 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      INSERT INTO parent_student_links (id, parent_id, student_id, invite_code, invite_code_expires_at, status)
      VALUES (?, '', ?, ?, ?, 'pending')
    `).bind(id, user.userId, inviteCode, expiresAt).run();

    return c.json({
      success: true,
      data: {
        code: inviteCode,
        expiresAt,
        existingLinks: existingCount,
      },
    });
  } catch (error) {
    console.error('Generate invite code error:', error);
    return c.json({ success: false, error: 'Failed to generate invite code' }, 500);
  }
});

// Student: Get linked parents
protectedApp.get('/students/parent-links', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role !== 'student') {
    return c.json({ success: false, error: 'Only students can view their parent links' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT psl.*, u.name as parent_name, u.email as parent_email
      FROM parent_student_links psl
      LEFT JOIN users u ON psl.parent_id = u.id
      WHERE psl.student_id = ? AND psl.status IN ('active', 'pending')
      ORDER BY psl.created_at DESC
    `).bind(user.userId).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch parent links' }, 500);
  }
});

// Student: Revoke parent access (SHS only)
protectedApp.delete('/students/parent-link/:parentId', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const parentId = c.req.param('parentId');

  if (user.role !== 'student') {
    return c.json({ success: false, error: 'Only students can revoke parent access' }, 403);
  }

  try {
    // Check if student is SHS level (can opt-out)
    const student = await c.env.DB.prepare(`
      SELECT school_level FROM users WHERE id = ?
    `).bind(user.userId).first();

    if (student?.school_level !== 'shs') {
      return c.json({ success: false, error: 'Only SHS students can revoke parent access' }, 403);
    }

    // Update link status to revoked
    await c.env.DB.prepare(`
      UPDATE parent_student_links
      SET status = 'revoked', student_opted_out = 1, opted_out_at = datetime('now')
      WHERE student_id = ? AND parent_id = ?
    `).bind(user.userId, parentId).run();

    // Create notification for parent
    const notifId = `pn_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO parent_notifications (id, parent_id, student_id, type, title, message)
      VALUES (?, ?, ?, 'student_opted_out', 'Access Revoked', 'Your ward has revoked your monitoring access.')
    `).bind(notifId, parentId, user.userId).run();

    return c.json({ success: true, data: { message: 'Parent access revoked' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to revoke parent access' }, 500);
  }
});

// Parent: Link to student using invite code
protectedApp.post('/parents/link', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const { inviteCode, relationshipType } = await c.req.json();

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can link to students' }, 403);
  }

  try {
    // Find pending link with this code
    const link = await c.env.DB.prepare(`
      SELECT psl.*, u.name as student_name, u.email as student_email
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      WHERE psl.invite_code = ? AND psl.status = 'pending'
    `).bind(inviteCode.toUpperCase()).first();

    if (!link) {
      return c.json({ success: false, error: 'Invalid or expired invite code' }, 400);
    }

    // Check if code is expired
    if (link.invite_code_expires_at) {
      const expiry = new Date(link.invite_code_expires_at as string);
      if (expiry < new Date()) {
        return c.json({ success: false, error: 'This invite code has expired' }, 400);
      }
    }

    // Check if already linked
    const existingLink = await c.env.DB.prepare(`
      SELECT id FROM parent_student_links
      WHERE parent_id = ? AND student_id = ? AND status = 'active'
    `).bind(user.userId, link.student_id).first();

    if (existingLink) {
      return c.json({ success: false, error: 'You are already linked to this student' }, 400);
    }

    // Update the link with parent info
    await c.env.DB.prepare(`
      UPDATE parent_student_links
      SET parent_id = ?, status = 'active', relationship_type = ?, verified_at = datetime('now'),
          invite_code = NULL, invite_code_expires_at = NULL
      WHERE id = ?
    `).bind(user.userId, relationshipType || 'parent', link.id).run();

    // Create notification for student
    const notifId = `pn_${Date.now()}`;
    const parentUser = await c.env.DB.prepare(`
      SELECT name FROM users WHERE id = ?
    `).bind(user.userId).first();

    await c.env.DB.prepare(`
      INSERT INTO parent_notifications (id, parent_id, student_id, type, title, message)
      VALUES (?, ?, ?, 'link_confirmed', 'Parent Linked', ?)
    `).bind(notifId, user.userId, link.student_id,
           `${parentUser?.name || 'A parent'} has linked to your account.`).run();

    // Create default notification preferences for parent
    const prefId = `pnp_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT OR IGNORE INTO parent_notification_preferences (id, parent_id)
      VALUES (?, ?)
    `).bind(prefId, user.userId).run();

    return c.json({
      success: true,
      data: {
        message: 'Successfully linked to student',
        student: {
          id: link.student_id,
          name: link.student_name,
        },
      },
    });
  } catch (error) {
    console.error('Link parent error:', error);
    return c.json({ success: false, error: 'Failed to link to student' }, 500);
  }
});

// Parent: Get linked students
protectedApp.get('/parents/students', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can view linked students' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT psl.*,
             u.name as student_name, u.email as student_email, u.avatar_url as student_avatar,
             u.school_level, u.year_group, u.house, u.xp_points, u.level, u.streak_days,
             u.last_activity_date as last_active_at
      FROM parent_student_links psl
      JOIN users u ON psl.student_id = u.id
      WHERE psl.parent_id = ? AND psl.status = 'active' AND psl.student_opted_out = 0
      ORDER BY u.name
    `).bind(user.userId).all();

    // Map to expected format
    const students = results.map((r: any) => ({
      id: r.id,
      parentId: r.parent_id,
      studentId: r.student_id,
      status: r.status,
      relationshipType: r.relationship_type,
      studentOptedOut: r.student_opted_out === 1,
      createdAt: r.created_at,
      verifiedAt: r.verified_at,
      student: {
        id: r.student_id,
        name: r.student_name,
        email: r.student_email,
        avatarUrl: r.student_avatar,
        schoolLevel: r.school_level,
        yearGroup: r.year_group,
        house: r.house,
        xpPoints: r.xp_points,
        level: r.level,
        streakDays: r.streak_days,
        lastActiveAt: r.last_active_at,
      },
    }));

    return c.json({ success: true, data: students });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch linked students' }, 500);
  }
});

// Parent: Get student progress summary
protectedApp.get('/parents/students/:studentId/progress', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const studentId = c.req.param('studentId');

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can view student progress' }, 403);
  }

  try {
    // Verify parent has active link to student
    const link = await c.env.DB.prepare(`
      SELECT id FROM parent_student_links
      WHERE parent_id = ? AND student_id = ? AND status = 'active' AND student_opted_out = 0
    `).bind(user.userId, studentId).first();

    if (!link) {
      return c.json({ success: false, error: 'Not authorized to view this student' }, 403);
    }

    // Get student info
    const student = await c.env.DB.prepare(`
      SELECT id, name, avatar_url, school_level, year_group, house,
             xp_points, level, streak_days, last_activity_date
      FROM users WHERE id = ?
    `).bind(studentId).first();

    if (!student) {
      return c.json({ success: false, error: 'Student not found' }, 404);
    }

    // Get overall stats
    const { results: stats } = await c.env.DB.prepare(`
      SELECT COUNT(*) as total_attempted, SUM(is_correct) as total_correct
      FROM question_attempts WHERE user_id = ?
    `).bind(studentId).all();

    const attemptStats = stats[0] as { total_attempted: number; total_correct: number };

    // Get topic mastery info
    const { results: topicProgress } = await c.env.DB.prepare(`
      SELECT up.*, t.name as topic_name, s.name as subject_name
      FROM user_progress up
      JOIN topics t ON up.topic_id = t.id
      JOIN subjects s ON t.subject_id = s.id
      WHERE up.user_id = ?
      ORDER BY up.mastery_level DESC
    `).bind(studentId).all();

    // Categorize topics
    const strengths = topicProgress.filter((t: any) => t.mastery_level >= 70).slice(0, 5);
    const weaknesses = topicProgress.filter((t: any) => t.mastery_level < 50 && t.questions_attempted >= 5).slice(0, 5);

    // Get recent achievements
    const { results: achievements } = await c.env.DB.prepare(`
      SELECT ua.*, a.name, a.description, a.icon
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
      LIMIT 5
    `).bind(studentId).all();

    // Get longest streak
    const userRecord = await c.env.DB.prepare(`
      SELECT MAX(streak_days) as longest_streak FROM users WHERE id = ?
    `).bind(studentId).first();

    // Log parent access
    const logId = `pal_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO parent_activity_log (id, parent_id, student_id, action)
      VALUES (?, ?, ?, 'view_progress')
    `).bind(logId, user.userId, studentId).run();

    return c.json({
      success: true,
      data: {
        studentId: student.id,
        studentName: student.name,
        studentAvatar: student.avatar_url,
        schoolLevel: student.school_level,
        yearGroup: student.year_group,
        house: student.house,
        xpPoints: student.xp_points || 0,
        level: student.level || 1,
        streakDays: student.streak_days || 0,
        longestStreak: userRecord?.longest_streak || student.streak_days || 0,
        totalQuestionsAttempted: attemptStats?.total_attempted || 0,
        totalCorrect: attemptStats?.total_correct || 0,
        overallAccuracy: attemptStats?.total_attempted
          ? Math.round((attemptStats.total_correct / attemptStats.total_attempted) * 100)
          : 0,
        topicsStarted: topicProgress.length,
        topicsMastered: topicProgress.filter((t: any) => t.mastery_level >= 80).length,
        strengthAreas: strengths.map((t: any) => ({
          topicId: t.topic_id,
          topicName: t.topic_name,
          subjectName: t.subject_name,
          mastery: t.mastery_level,
          questionsAttempted: t.questions_attempted,
          questionsCorrect: t.questions_correct,
        })),
        weakAreas: weaknesses.map((t: any) => ({
          topicId: t.topic_id,
          topicName: t.topic_name,
          subjectName: t.subject_name,
          mastery: t.mastery_level,
          questionsAttempted: t.questions_attempted,
          questionsCorrect: t.questions_correct,
        })),
        recentAchievements: achievements.map((a: any) => ({
          id: a.achievement_id,
          name: a.name,
          description: a.description,
          icon: a.icon,
          unlockedAt: a.unlocked_at,
        })),
        lastActiveAt: student.last_activity_date,
      },
    });
  } catch (error) {
    console.error('Get student progress error:', error);
    return c.json({ success: false, error: 'Failed to fetch student progress' }, 500);
  }
});

// Parent: Get student activity timeline
protectedApp.get('/parents/students/:studentId/activity', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const studentId = c.req.param('studentId');
  const limit = parseInt(c.req.query('limit') || '30');

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can view student activity' }, 403);
  }

  try {
    // Verify parent has active link to student
    const link = await c.env.DB.prepare(`
      SELECT id FROM parent_student_links
      WHERE parent_id = ? AND student_id = ? AND status = 'active' AND student_opted_out = 0
    `).bind(user.userId, studentId).first();

    if (!link) {
      return c.json({ success: false, error: 'Not authorized to view this student' }, 403);
    }

    // Get recent practice sessions
    const { results: sessions } = await c.env.DB.prepare(`
      SELECT ps.*, s.name as subject_name, t.name as topic_name
      FROM practice_sessions ps
      LEFT JOIN subjects s ON ps.subject_id = s.id
      LEFT JOIN topics t ON ps.topic_id = t.id
      WHERE ps.user_id = ?
      ORDER BY ps.started_at DESC
      LIMIT ?
    `).bind(studentId, limit).all();

    // Get recent achievements
    const { results: achievements } = await c.env.DB.prepare(`
      SELECT ua.unlocked_at as timestamp, a.name, a.description, a.icon, a.xp_reward
      FROM user_achievements ua
      JOIN achievements a ON ua.achievement_id = a.id
      WHERE ua.user_id = ?
      ORDER BY ua.unlocked_at DESC
      LIMIT ?
    `).bind(studentId, limit).all();

    // Combine and sort activities
    const activities: any[] = [];

    sessions.forEach((s: any) => {
      activities.push({
        id: s.id,
        type: 'practice_session',
        title: `${s.mode === 'topic_drill' ? 'Topic Practice' : s.mode.replace('_', ' ')}`,
        description: s.topic_name ? `Practiced ${s.topic_name}` : (s.subject_name ? `${s.subject_name} practice` : 'General practice'),
        score: s.correct_count,
        maxScore: s.questions_count,
        xpEarned: s.score,
        timestamp: s.started_at,
        subjectName: s.subject_name,
        topicName: s.topic_name,
      });
    });

    achievements.forEach((a: any) => {
      activities.push({
        id: `ach_${a.timestamp}`,
        type: 'achievement',
        title: 'Achievement Unlocked',
        description: a.name,
        xpEarned: a.xp_reward,
        timestamp: a.timestamp,
        achievementIcon: a.icon,
      });
    });

    // Sort by timestamp
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    // Log access
    const logId = `pal_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO parent_activity_log (id, parent_id, student_id, action)
      VALUES (?, ?, ?, 'view_activity')
    `).bind(logId, user.userId, studentId).run();

    return c.json({ success: true, data: activities.slice(0, limit) });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch student activity' }, 500);
  }
});

// Parent: Get notifications
protectedApp.get('/parents/notifications', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const unreadOnly = c.req.query('unreadOnly') === 'true';
  const limit = parseInt(c.req.query('limit') || '50');

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can view notifications' }, 403);
  }

  try {
    let query = `
      SELECT pn.*, u.name as student_name, u.avatar_url as student_avatar
      FROM parent_notifications pn
      JOIN users u ON pn.student_id = u.id
      WHERE pn.parent_id = ?
    `;

    if (unreadOnly) {
      query += ' AND pn.is_read = 0';
    }

    query += ' ORDER BY pn.created_at DESC LIMIT ?';

    const { results } = await c.env.DB.prepare(query).bind(user.userId, limit).all();

    // Get unread count
    const unreadResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM parent_notifications
      WHERE parent_id = ? AND is_read = 0
    `).bind(user.userId).first();

    return c.json({
      success: true,
      data: {
        notifications: results.map((n: any) => ({
          id: n.id,
          parentId: n.parent_id,
          studentId: n.student_id,
          type: n.type,
          title: n.title,
          message: n.message,
          data: n.data ? JSON.parse(n.data) : null,
          isRead: n.is_read === 1,
          emailSent: n.email_sent === 1,
          createdAt: n.created_at,
          student: {
            id: n.student_id,
            name: n.student_name,
            avatarUrl: n.student_avatar,
          },
        })),
        unreadCount: unreadResult?.count || 0,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch notifications' }, 500);
  }
});

// Parent: Mark notification as read
protectedApp.put('/parents/notifications/:id/read', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const notificationId = c.req.param('id');

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can mark notifications' }, 403);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE parent_notifications SET is_read = 1 WHERE id = ? AND parent_id = ?
    `).bind(notificationId, user.userId).run();

    return c.json({ success: true, data: { message: 'Notification marked as read' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to mark notification' }, 500);
  }
});

// Parent: Mark all notifications as read
protectedApp.put('/parents/notifications/read-all', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can mark notifications' }, 403);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE parent_notifications SET is_read = 1 WHERE parent_id = ?
    `).bind(user.userId).run();

    return c.json({ success: true, data: { message: 'All notifications marked as read' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to mark notifications' }, 500);
  }
});

// Parent: Get notification preferences
protectedApp.get('/parents/preferences', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can view preferences' }, 403);
  }

  try {
    let prefs = await c.env.DB.prepare(`
      SELECT * FROM parent_notification_preferences WHERE parent_id = ?
    `).bind(user.userId).first();

    // Return defaults if no preferences set
    if (!prefs) {
      prefs = {
        achievement_alerts: 1,
        streak_alerts: 1,
        low_performance_alerts: 1,
        weekly_summary: 1,
        email_notifications: 1,
        low_performance_threshold: 40,
      };
    }

    return c.json({
      success: true,
      data: {
        achievementAlerts: prefs.achievement_alerts === 1,
        streakAlerts: prefs.streak_alerts === 1,
        lowPerformanceAlerts: prefs.low_performance_alerts === 1,
        weeklySummary: prefs.weekly_summary === 1,
        emailNotifications: prefs.email_notifications === 1,
        lowPerformanceThreshold: prefs.low_performance_threshold || 40,
      },
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch preferences' }, 500);
  }
});

// Parent: Update notification preferences
protectedApp.put('/parents/preferences', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const prefs = await c.req.json();

  if (user.role !== 'parent') {
    return c.json({ success: false, error: 'Only parents can update preferences' }, 403);
  }

  try {
    // Upsert preferences
    await c.env.DB.prepare(`
      INSERT INTO parent_notification_preferences
        (id, parent_id, achievement_alerts, streak_alerts, low_performance_alerts,
         weekly_summary, email_notifications, low_performance_threshold, updated_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
      ON CONFLICT(parent_id) DO UPDATE SET
        achievement_alerts = excluded.achievement_alerts,
        streak_alerts = excluded.streak_alerts,
        low_performance_alerts = excluded.low_performance_alerts,
        weekly_summary = excluded.weekly_summary,
        email_notifications = excluded.email_notifications,
        low_performance_threshold = excluded.low_performance_threshold,
        updated_at = datetime('now')
    `).bind(
      `pnp_${user.userId}`,
      user.userId,
      prefs.achievementAlerts ? 1 : 0,
      prefs.streakAlerts ? 1 : 0,
      prefs.lowPerformanceAlerts ? 1 : 0,
      prefs.weeklySummary ? 1 : 0,
      prefs.emailNotifications ? 1 : 0,
      prefs.lowPerformanceThreshold || 40
    ).run();

    return c.json({ success: true, data: { message: 'Preferences updated' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update preferences' }, 500);
  }
});

// =============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// =============================================

// Middleware to verify admin role
const adminAuth = async (c: any, next: any) => {
  const authHeader = c.req.header('Authorization');
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.slice(7);
  const payload = await verifyJWT(token, c.env.JWT_SECRET);

  if (!payload) {
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }

  if (payload.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  c.set('user', payload);
  await next();
};

// Admin routes
const adminApp = new Hono<{ Bindings: Env }>();
adminApp.use('*', adminAuth);

// Get all users with stats
adminApp.get('/users', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, name, role, status, email_verified, is_active,
             school_level, year_group, school_name, house,
             teacher_license_number, subjects_taught, years_experience, qualifications,
             xp_points, level, streak_days, last_login_at, created_at, updated_at
      FROM users
      ORDER BY created_at DESC
    `).all();

    // Parse JSON fields
    const users = results.map((u: Record<string, unknown>) => ({
      ...u,
      subjectsTaught: u.subjects_taught ? JSON.parse(u.subjects_taught as string) : [],
    }));

    return c.json({ success: true, data: users });
  } catch (error) {
    console.error('Get users error:', error);
    return c.json({ success: false, error: 'Failed to fetch users' }, 500);
  }
});

// Get user stats
adminApp.get('/users/stats', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];

    const [total, students, teachers, admins, pending, activeToday] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'student' AND is_active = 1").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'teacher' AND is_active = 1").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE role = 'admin' AND is_active = 1").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE date(last_login_at) = ?").bind(today).first(),
    ]);

    return c.json({
      success: true,
      data: {
        total: (total as any)?.count || 0,
        students: (students as any)?.count || 0,
        teachers: (teachers as any)?.count || 0,
        admins: (admins as any)?.count || 0,
        pending: (pending as any)?.count || 0,
        activeToday: (activeToday as any)?.count || 0,
      }
    });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch stats' }, 500);
  }
});

// Get pending registrations
adminApp.get('/users/pending', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, email, name, role, school_level, year_group, school_name, house,
             teacher_license_number, subjects_taught, years_experience, qualifications,
             created_at
      FROM users
      WHERE status = 'pending'
      ORDER BY created_at DESC
    `).all();

    const users = results.map((u: Record<string, unknown>) => ({
      ...u,
      subjectsTaught: u.subjects_taught ? JSON.parse(u.subjects_taught as string) : [],
    }));

    return c.json({ success: true, data: users });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to fetch pending users' }, 500);
  }
});

// Approve user registration
adminApp.post('/users/:id/approve', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  try {
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND status = 'pending'"
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found or not pending' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE users SET
        status = 'approved',
        email_verified = 1,
        approved_by = ?,
        approved_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(adminUser.userId, userId).run();

    // Log the approval action
    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'approve_user',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Approved ${user.email} (${user.role})`,
      ...clientInfo,
    });

    // Log data change
    await logDataChange(c.env.DB, 'users', userId, 'UPDATE', adminUser.userId, {
      oldValues: { status: 'pending' },
      newValues: { status: 'approved' },
      changedFields: ['status', 'email_verified', 'approved_by', 'approved_at'],
      reason: 'Admin approval',
    });

    // TODO: Send approval email notification

    return c.json({ success: true, data: { message: 'User approved successfully' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to approve user' }, 500);
  }
});

// Reject user registration
adminApp.post('/users/:id/reject', async (c) => {
  const userId = c.req.param('id');
  const { reason } = await c.req.json();
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  try {
    const user = await c.env.DB.prepare(
      "SELECT * FROM users WHERE id = ? AND status = 'pending'"
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found or not pending' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE users SET
        status = 'rejected',
        rejection_reason = ?,
        rejected_by = ?,
        rejected_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(reason || null, adminUser.userId, userId).run();

    // Log the rejection action
    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'reject_user',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Rejected ${user.email} (${user.role})${reason ? `: ${reason}` : ''}`,
      ...clientInfo,
    });

    // Log data change
    await logDataChange(c.env.DB, 'users', userId, 'UPDATE', adminUser.userId, {
      oldValues: { status: 'pending' },
      newValues: { status: 'rejected', rejection_reason: reason },
      changedFields: ['status', 'rejection_reason', 'rejected_by', 'rejected_at'],
      reason: 'Admin rejection',
    });

    return c.json({ success: true, data: { message: 'User rejected' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to reject user' }, 500);
  }
});

// Create new user (admin-created, sends verification email)
adminApp.post('/users', async (c) => {
  const body = await c.req.json();
  const { email, name, role, schoolLevel, yearGroup, schoolName, house,
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications } = body;
  const adminUser = c.get('user') as UserPayload;
  const appUrl = c.env.APP_URL || 'https://brilla.edu.gh';

  try {
    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ success: false, error: 'An account with this email already exists.' }, 400);
    }

    const id = `user_${Date.now()}`;
    const verificationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    // Create user with placeholder password (they'll set real password via email)
    // The placeholder 'UNSET' will never match any real hashed password
    await c.env.DB.prepare(`
      INSERT INTO users (id, email, password_hash, name, role, status, email_verified,
                         verification_token, verification_token_expires_at,
                         school_level, year_group, school_name, house,
                         teacher_license_number, subjects_taught, years_experience, qualifications,
                         created_by, is_active)
      VALUES (?, ?, 'UNSET', ?, ?, 'approved', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1)
    `).bind(
      id, email, name, role || 'student',
      verificationToken, tokenExpiry,
      schoolLevel || null, yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null,
      adminUser.userId
    ).run();

    // Send verification email
    if (c.env.RESEND_API_KEY) {
      const verificationUrl = `${appUrl}/set-password?token=${verificationToken}`;
      const emailSent = await sendEmail(
        c.env.RESEND_API_KEY,
        c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>',
        email,
        'Welcome to Brilla - Set Up Your Password',
        getVerificationEmailHTML(name, verificationUrl)
      );

      if (!emailSent) {
        console.error('Failed to send verification email to:', email);
      }
    } else {
      console.log('RESEND_API_KEY not configured. Verification token:', verificationToken);
    }

    return c.json({
      success: true,
      data: {
        id,
        email,
        name,
        role: role || 'student',
        message: 'User created. Verification email sent.',
      }
    });
  } catch (error) {
    console.error('Create user error:', error);
    return c.json({ success: false, error: 'Failed to create user' }, 500);
  }
});

// Update user
adminApp.put('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const body = await c.req.json();
  const { name, email, schoolLevel, yearGroup, schoolName, house,
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications } = body;

  try {
    const user = await c.env.DB.prepare(
      'SELECT id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE users SET
        name = COALESCE(?, name),
        email = COALESCE(?, email),
        school_level = ?,
        year_group = ?,
        school_name = ?,
        house = ?,
        teacher_license_number = ?,
        subjects_taught = ?,
        years_experience = ?,
        qualifications = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      name || null, email || null,
      schoolLevel || null, yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null,
      userId
    ).run();

    return c.json({ success: true, data: { message: 'User updated successfully' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to update user' }, 500);
  }
});

// Deactivate user
adminApp.post('/users/:id/deactivate', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user') as UserPayload;

  // Prevent self-deactivation
  if (userId === adminUser.userId) {
    return c.json({ success: false, error: 'Cannot deactivate your own account' }, 400);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE users SET is_active = 0, updated_at = datetime('now') WHERE id = ?
    `).bind(userId).run();

    return c.json({ success: true, data: { message: 'User deactivated' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to deactivate user' }, 500);
  }
});

// Reactivate user
adminApp.post('/users/:id/reactivate', async (c) => {
  const userId = c.req.param('id');

  try {
    await c.env.DB.prepare(`
      UPDATE users SET is_active = 1, updated_at = datetime('now') WHERE id = ?
    `).bind(userId).run();

    return c.json({ success: true, data: { message: 'User reactivated' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to reactivate user' }, 500);
  }
});

// Delete user
adminApp.delete('/users/:id', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user') as UserPayload;

  // Prevent self-deletion
  if (userId === adminUser.userId) {
    return c.json({ success: false, error: 'Cannot delete your own account' }, 400);
  }

  try {
    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    return c.json({ success: true, data: { message: 'User deleted' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

// Resend verification email
adminApp.post('/users/:id/resend-verification', async (c) => {
  const userId = c.req.param('id');
  const appUrl = c.env.APP_URL || 'https://brilla.edu.gh';

  try {
    const user = await c.env.DB.prepare(
      'SELECT id, name, email, email_verified FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    if (user.email_verified) {
      return c.json({ success: false, error: 'User already verified' }, 400);
    }

    // Generate new verification token
    const verificationToken = generateToken();
    const tokenExpiry = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      UPDATE users SET
        verification_token = ?,
        verification_token_expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(verificationToken, tokenExpiry, userId).run();

    // Send verification email
    if (c.env.RESEND_API_KEY) {
      const verificationUrl = `${appUrl}/set-password?token=${verificationToken}`;
      await sendEmail(
        c.env.RESEND_API_KEY,
        c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>',
        user.email as string,
        'Welcome to Brilla - Set Up Your Password',
        getVerificationEmailHTML(user.name as string, verificationUrl)
      );
    }

    return c.json({ success: true, data: { message: 'Verification email sent' } });
  } catch (error) {
    return c.json({ success: false, error: 'Failed to resend verification' }, 500);
  }
});

// Mount admin routes
app.route('/api/admin', adminApp);

// Mount protected routes
app.route('/api', protectedApp);

// Helper function to get exam-specific context
function getExamContext(context?: string): { examType: string; examName: string; examDescription: string; subjects: string } {
  const lowerContext = (context || '').toLowerCase();

  if (lowerContext.includes('wassce') || lowerContext.includes('waec')) {
    return {
      examType: 'wassce',
      examName: 'WASSCE (West African Senior School Certificate Examination)',
      examDescription: 'the West African secondary school leaving examination',
      subjects: 'all WASSCE subjects including Core Mathematics, English Language, Integrated Science, Social Studies, and elective subjects'
    };
  }

  if (lowerContext.includes('bece')) {
    return {
      examType: 'bece',
      examName: 'BECE (Basic Education Certificate Examination)',
      examDescription: 'the Ghanaian junior high school leaving examination',
      subjects: 'BECE subjects including Mathematics, English, Science, Social Studies, RME, French, and others'
    };
  }

  // Default to NSMQ for competition-focused context
  return {
    examType: 'nsmq',
    examName: 'NSMQ (National Science & Maths Quiz)',
    examDescription: 'the Ghanaian national science and mathematics competition',
    subjects: 'Mathematics, Physics, Chemistry, and Biology'
  };
}

// Helper functions for mock responses
function generateMockExplanation(question: string, correctAnswer: string, isCorrect?: boolean, userAnswer?: string, context?: string): string {
  const exam = getExamContext(context);

  if (isCorrect) {
    return `Excellent work! You correctly identified that the answer is "${correctAnswer}".

This question tests your understanding of fundamental concepts. Your answer demonstrates good grasp of the material.

Tip: Keep practicing similar questions to reinforce this knowledge and improve your performance in ${exam.examName}!`;
  }

  return `The correct answer is "${correctAnswer}".

${userAnswer ? `Your answer "${userAnswer}" was close, but ` : ''}Let me explain the key concept here. This type of question requires understanding the underlying principles and applying them systematically.

Pro tip: When facing similar ${exam.examType.toUpperCase()} questions, try breaking down the problem into smaller steps and verify each step before moving to the next. Practice makes perfect!`;
}

function generateMockChatResponse(message: string, context?: string, userName?: string): string {
  const lowerMessage = message.toLowerCase();
  const exam = getExamContext(context);
  const greeting = userName ? `${userName}, ` : '';
  const personalTouch = userName ? ` I'm here for you, ${userName}!` : '';

  if (lowerMessage.includes('help') || lowerMessage.includes('explain')) {
    return `${greeting}I'd be happy to help! Could you please share the specific topic or question you'd like me to explain? I can break down concepts in ${exam.subjects}.${personalTouch}`;
  }

  if (lowerMessage.includes('formula') || lowerMessage.includes('equation')) {
    return `${greeting ? `Great question, ${greeting}` : ''}Formulas are essential for ${exam.examType.toUpperCase()} success! Here are some tips for memorizing them:\n\n1. **Understand** what each variable represents\n2. **Practice** deriving simpler formulas from first principles\n3. **Create flashcards** and review daily\n4. **Apply** formulas in practice problems\n\nWhich specific formula would you like me to explain?`;
  }

  if (lowerMessage.includes('tip') || lowerMessage.includes('advice') || lowerMessage.includes('study')) {
    return `${greeting ? `${greeting}here are ` : 'Here are '}my top ${exam.examType.toUpperCase()} preparation tips just for you:\n\n1. **Practice daily** - Even 30 minutes helps\n2. **Focus on weak areas** - Use analytics to identify gaps\n3. **Past questions** - Practice with previous ${exam.examType.toUpperCase()} papers\n4. **Study with peers** - Quiz each other to test understanding\n5. **Stay curious** - Understanding 'why' helps more than memorizing\n\nWhat specific area would you like advice on?${userName ? ` I believe in you, ${userName}!` : ''}`;
  }

  if (lowerMessage.includes('hello') || lowerMessage.includes('hi ') || lowerMessage === 'hi') {
    return `Hey${userName ? ` ${userName}` : ' there'}! Great to see you! I'm Brilla AI, your personal study companion.\n\nI'm here to help you succeed in ${exam.examName}. What would you like to work on together today?\n\nRemember - there's no such thing as a silly question!`;
  }

  return `${greeting ? `Thanks for reaching out, ${greeting}` : ''}That's a great question! I'm here to help you prepare for ${exam.examName}. Feel free to ask me about:\n\n- Specific topics in ${exam.subjects}\n- Formula explanations and derivations\n- Study tips and strategies\n- Help understanding your wrong answers\n\nWhat would you like to explore?${personalTouch}`;
}

function generateMockHint(question: string, level: number): string {
  const hints = [
    "Think about the fundamental concepts involved in this question. What principles might apply?",
    "Consider breaking down the problem into smaller parts. What information do you already have?",
    "The answer involves applying a key formula or concept. Think about what you've learned recently about this topic."
  ];

  return hints[Math.min(level - 1, hints.length - 1)];
}

// =============================================
// ADMIN AUDIT LOG ENDPOINTS
// =============================================

// Admin: Get audit log dashboard stats
protectedApp.get('/admin/audit/stats', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const now = new Date();
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();

    // Get counts in parallel
    const [totalResult, todayResult, failedLoginsResult, securityResult, criticalResult] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM audit_log').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM audit_log WHERE created_at >= ?').bind(todayStart).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM login_attempts WHERE success = 0 AND created_at >= ?').bind(yesterday).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM security_events WHERE is_resolved = 0').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM security_events WHERE severity = 'critical' AND is_resolved = 0").first(),
    ]);

    // Get top actions
    const { results: topActions } = await c.env.DB.prepare(`
      SELECT action, COUNT(*) as count FROM audit_log
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY action ORDER BY count DESC LIMIT 10
    `).all();

    // Get events by category
    const { results: eventsByCategory } = await c.env.DB.prepare(`
      SELECT action_category as category, COUNT(*) as count FROM audit_log
      WHERE created_at >= datetime('now', '-7 days')
      GROUP BY action_category ORDER BY count DESC
    `).all();

    // Get recent security events
    const { results: recentSecurityEvents } = await c.env.DB.prepare(`
      SELECT se.*, u.name as user_name, r.name as resolved_by_name
      FROM security_events se
      LEFT JOIN users u ON se.user_id = u.id
      LEFT JOIN users r ON se.resolved_by = r.id
      WHERE se.is_resolved = 0
      ORDER BY
        CASE se.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        se.created_at DESC
      LIMIT 10
    `).all();

    return c.json({
      success: true,
      stats: {
        totalEvents: (totalResult as { count: number })?.count || 0,
        todayEvents: (todayResult as { count: number })?.count || 0,
        failedLogins24h: (failedLoginsResult as { count: number })?.count || 0,
        activeSecurityEvents: (securityResult as { count: number })?.count || 0,
        criticalEvents: (criticalResult as { count: number })?.count || 0,
        topActions,
        eventsByCategory,
        recentSecurityEvents: recentSecurityEvents.map((e: Record<string, unknown>) => ({
          id: e.id,
          eventType: e.event_type,
          severity: e.severity,
          userId: e.user_id,
          userEmail: e.user_email,
          userName: e.user_name,
          ipAddress: e.ip_address,
          description: e.description,
          metadata: e.metadata ? JSON.parse(e.metadata as string) : null,
          isResolved: Boolean(e.is_resolved),
          createdAt: e.created_at,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching audit stats:', error);
    return c.json({ success: false, error: 'Failed to fetch audit stats' }, 500);
  }
});

// Admin: Get audit log entries with filters
protectedApp.get('/admin/audit/logs', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    // Filters
    const userId = c.req.query('userId');
    const actionCategory = c.req.query('category');
    const action = c.req.query('action');
    const status = c.req.query('status');
    const targetType = c.req.query('targetType');
    const startDate = c.req.query('startDate');
    const endDate = c.req.query('endDate');
    const ipAddress = c.req.query('ipAddress');
    const search = c.req.query('search');

    // Build query dynamically
    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (userId) {
      whereConditions.push('al.user_id = ?');
      params.push(userId);
    }
    if (actionCategory) {
      whereConditions.push('al.action_category = ?');
      params.push(actionCategory);
    }
    if (action) {
      whereConditions.push('al.action = ?');
      params.push(action);
    }
    if (status) {
      whereConditions.push('al.status = ?');
      params.push(status);
    }
    if (targetType) {
      whereConditions.push('al.target_type = ?');
      params.push(targetType);
    }
    if (startDate) {
      whereConditions.push('al.created_at >= ?');
      params.push(startDate);
    }
    if (endDate) {
      whereConditions.push('al.created_at <= ?');
      params.push(endDate);
    }
    if (ipAddress) {
      whereConditions.push('al.ip_address = ?');
      params.push(ipAddress);
    }
    if (search) {
      whereConditions.push('(al.action LIKE ? OR al.target_details LIKE ? OR al.user_email LIKE ?)');
      params.push(`%${search}%`, `%${search}%`, `%${search}%`);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    // Get total count
    const countQuery = `SELECT COUNT(*) as count FROM audit_log al ${whereClause}`;
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();
    const total = (countResult as { count: number })?.count || 0;

    // Get entries
    const query = `
      SELECT al.*, u.name as user_name
      FROM audit_log al
      LEFT JOIN users u ON al.user_id = u.id
      ${whereClause}
      ORDER BY al.created_at DESC
      LIMIT ? OFFSET ?
    `;
    const { results } = await c.env.DB.prepare(query).bind(...params, limit, offset).all();

    return c.json({
      success: true,
      logs: results.map((log: Record<string, unknown>) => ({
        id: log.id,
        userId: log.user_id,
        userEmail: log.user_email,
        userRole: log.user_role,
        userName: log.user_name,
        action: log.action,
        actionCategory: log.action_category,
        targetType: log.target_type,
        targetId: log.target_id,
        targetDetails: log.target_details,
        ipAddress: log.ip_address,
        userAgent: log.user_agent,
        requestPath: log.request_path,
        requestMethod: log.request_method,
        status: log.status,
        errorMessage: log.error_message,
        metadata: log.metadata ? JSON.parse(log.metadata as string) : null,
        createdAt: log.created_at,
      })),
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Error fetching audit logs:', error);
    return c.json({ success: false, error: 'Failed to fetch audit logs' }, 500);
  }
});

// Admin: Get security events
protectedApp.get('/admin/audit/security-events', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const unresolvedOnly = c.req.query('unresolvedOnly') === 'true';
    const severity = c.req.query('severity');
    const eventType = c.req.query('eventType');
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (unresolvedOnly) {
      whereConditions.push('se.is_resolved = 0');
    }
    if (severity) {
      whereConditions.push('se.severity = ?');
      params.push(severity);
    }
    if (eventType) {
      whereConditions.push('se.event_type = ?');
      params.push(eventType);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM security_events se ${whereClause}`).bind(...params).first();
    const total = (countResult as { count: number })?.count || 0;

    const { results } = await c.env.DB.prepare(`
      SELECT se.*, u.name as user_name, r.name as resolved_by_name
      FROM security_events se
      LEFT JOIN users u ON se.user_id = u.id
      LEFT JOIN users r ON se.resolved_by = r.id
      ${whereClause}
      ORDER BY
        CASE se.severity
          WHEN 'critical' THEN 1
          WHEN 'high' THEN 2
          WHEN 'medium' THEN 3
          ELSE 4
        END,
        se.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return c.json({
      success: true,
      events: results.map((e: Record<string, unknown>) => ({
        id: e.id,
        eventType: e.event_type,
        severity: e.severity,
        userId: e.user_id,
        userEmail: e.user_email,
        userName: e.user_name,
        ipAddress: e.ip_address,
        userAgent: e.user_agent,
        description: e.description,
        metadata: e.metadata ? JSON.parse(e.metadata as string) : null,
        isResolved: Boolean(e.is_resolved),
        resolvedBy: e.resolved_by,
        resolvedByName: e.resolved_by_name,
        resolvedAt: e.resolved_at,
        resolutionNotes: e.resolution_notes,
        createdAt: e.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching security events:', error);
    return c.json({ success: false, error: 'Failed to fetch security events' }, 500);
  }
});

// Admin: Resolve security event
protectedApp.put('/admin/audit/security-events/:id/resolve', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const eventId = c.req.param('id');
  const body = await c.req.json();
  const { notes } = body;

  try {
    await c.env.DB.prepare(`
      UPDATE security_events
      SET is_resolved = 1, resolved_by = ?, resolved_at = datetime('now'), resolution_notes = ?
      WHERE id = ?
    `).bind(user.userId, notes || null, eventId).run();

    // Log this action
    const clientInfo = getClientInfo(c);
    await logAudit({
      db: c.env.DB,
      userId: user.userId,
      userEmail: user.email,
      userRole: user.role,
      action: 'resolve_security_event',
      actionCategory: 'security',
      targetType: 'security_event',
      targetId: eventId,
      ...clientInfo,
    });

    return c.json({ success: true });
  } catch (error) {
    console.error('Error resolving security event:', error);
    return c.json({ success: false, error: 'Failed to resolve security event' }, 500);
  }
});

// Admin: Get login attempts
protectedApp.get('/admin/audit/login-attempts', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const email = c.req.query('email');
    const ipAddress = c.req.query('ipAddress');
    const failedOnly = c.req.query('failedOnly') === 'true';
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (email) {
      whereConditions.push('email LIKE ?');
      params.push(`%${email}%`);
    }
    if (ipAddress) {
      whereConditions.push('ip_address = ?');
      params.push(ipAddress);
    }
    if (failedOnly) {
      whereConditions.push('success = 0');
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM login_attempts ${whereClause}`).bind(...params).first();
    const total = (countResult as { count: number })?.count || 0;

    const { results } = await c.env.DB.prepare(`
      SELECT * FROM login_attempts
      ${whereClause}
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return c.json({
      success: true,
      attempts: results.map((a: Record<string, unknown>) => ({
        id: a.id,
        email: a.email,
        ipAddress: a.ip_address,
        userAgent: a.user_agent,
        success: Boolean(a.success),
        failureReason: a.failure_reason,
        createdAt: a.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching login attempts:', error);
    return c.json({ success: false, error: 'Failed to fetch login attempts' }, 500);
  }
});

// Admin: Get data change logs
protectedApp.get('/admin/audit/data-changes', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const tableName = c.req.query('tableName');
    const recordId = c.req.query('recordId');
    const operation = c.req.query('operation');
    const page = parseInt(c.req.query('page') || '1');
    const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
    const offset = (page - 1) * limit;

    let whereConditions: string[] = [];
    let params: (string | number)[] = [];

    if (tableName) {
      whereConditions.push('dcl.table_name = ?');
      params.push(tableName);
    }
    if (recordId) {
      whereConditions.push('dcl.record_id = ?');
      params.push(recordId);
    }
    if (operation) {
      whereConditions.push('dcl.operation = ?');
      params.push(operation);
    }

    const whereClause = whereConditions.length > 0 ? `WHERE ${whereConditions.join(' AND ')}` : '';

    const countResult = await c.env.DB.prepare(`SELECT COUNT(*) as count FROM data_change_log dcl ${whereClause}`).bind(...params).first();
    const total = (countResult as { count: number })?.count || 0;

    const { results } = await c.env.DB.prepare(`
      SELECT dcl.*, u.name as changed_by_name
      FROM data_change_log dcl
      LEFT JOIN users u ON dcl.changed_by = u.id
      ${whereClause}
      ORDER BY dcl.created_at DESC
      LIMIT ? OFFSET ?
    `).bind(...params, limit, offset).all();

    return c.json({
      success: true,
      changes: results.map((ch: Record<string, unknown>) => ({
        id: ch.id,
        tableName: ch.table_name,
        recordId: ch.record_id,
        operation: ch.operation,
        changedBy: ch.changed_by,
        changedByName: ch.changed_by_name,
        oldValues: ch.old_values ? JSON.parse(ch.old_values as string) : null,
        newValues: ch.new_values ? JSON.parse(ch.new_values as string) : null,
        changedFields: ch.changed_fields ? JSON.parse(ch.changed_fields as string) : null,
        reason: ch.reason,
        createdAt: ch.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching data changes:', error);
    return c.json({ success: false, error: 'Failed to fetch data changes' }, 500);
  }
});

// Admin: Get user activity timeline
protectedApp.get('/admin/audit/user/:userId/activity', userAuth, async (c) => {
  const adminUser = c.get('user') as UserPayload;
  if (adminUser.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  const userId = c.req.param('userId');
  const page = parseInt(c.req.query('page') || '1');
  const limit = Math.min(parseInt(c.req.query('limit') || '50'), 100);
  const offset = (page - 1) * limit;

  try {
    // Get user info
    const userInfo = await c.env.DB.prepare(`
      SELECT id, name, email, role, status, created_at FROM users WHERE id = ?
    `).bind(userId).first();

    if (!userInfo) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get activity count
    const countResult = await c.env.DB.prepare('SELECT COUNT(*) as count FROM audit_log WHERE user_id = ?').bind(userId).first();
    const total = (countResult as { count: number })?.count || 0;

    // Get activity logs
    const { results } = await c.env.DB.prepare(`
      SELECT * FROM audit_log WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    // Get login stats
    const loginStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total_attempts,
        SUM(CASE WHEN success = 1 THEN 1 ELSE 0 END) as successful,
        SUM(CASE WHEN success = 0 THEN 1 ELSE 0 END) as failed
      FROM login_attempts WHERE email = ?
    `).bind((userInfo as { email: string }).email).first();

    return c.json({
      success: true,
      user: {
        id: userInfo.id,
        name: userInfo.name,
        email: userInfo.email,
        role: userInfo.role,
        status: userInfo.status,
        createdAt: userInfo.created_at,
      },
      loginStats: {
        totalAttempts: (loginStats as Record<string, number>)?.total_attempts || 0,
        successful: (loginStats as Record<string, number>)?.successful || 0,
        failed: (loginStats as Record<string, number>)?.failed || 0,
      },
      activity: results.map((log: Record<string, unknown>) => ({
        id: log.id,
        action: log.action,
        actionCategory: log.action_category,
        targetType: log.target_type,
        targetId: log.target_id,
        targetDetails: log.target_details,
        ipAddress: log.ip_address,
        status: log.status,
        createdAt: log.created_at,
      })),
      pagination: { page, limit, total, pages: Math.ceil(total / limit) },
    });
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return c.json({ success: false, error: 'Failed to fetch user activity' }, 500);
  }
});

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

export default app;
