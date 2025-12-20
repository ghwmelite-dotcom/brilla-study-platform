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
  role: 'student' | 'teacher' | 'admin';
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

  try {
    const result = await c.env.DB.prepare(`
      SELECT * FROM users WHERE email = ?
    `).bind(email).first();

    if (!result) {
      return c.json({ success: false, error: 'Invalid email or password.' }, 401);
    }

    // Check password
    if (!result.password_hash) {
      return c.json({ success: false, error: 'Please set up your password using the link sent to your email.' }, 401);
    }

    const isValidPassword = await verifyPassword(password, result.password_hash as string);
    if (!isValidPassword) {
      return c.json({ success: false, error: 'Invalid email or password.' }, 401);
    }

    // Check account status
    if (result.status === 'pending') {
      return c.json({ success: false, error: 'Your account is pending approval.' }, 401);
    }
    if (result.status === 'rejected') {
      return c.json({ success: false, error: 'Your registration was not approved.' }, 401);
    }
    if (result.status === 'suspended' || !result.is_active) {
      return c.json({ success: false, error: 'Your account has been suspended.' }, 401);
    }
    if (!result.email_verified) {
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
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(reason || null, userId).run();

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
