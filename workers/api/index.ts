import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { jwt, sign, verify } from 'hono/jwt';
import type { JWTPayload } from 'hono/utils/jwt/types';
import { libraryApp } from './library';
import { counselorApp } from './counselor';
import { notificationsApp, createNotification } from './notifications';
import { tutorApp } from './tutor';
import { chatApp } from './chat';
import { moderationApp } from './moderation';
import { paymentsApp } from './payments';
import { subscriptionsApp } from './subscriptions';
import { affiliatesApp } from './affiliates';

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
  FROM_EMAIL?: string;
  LIBRARY_BUCKET?: R2Bucket;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
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

function getApprovalEmailHTML(userName: string, appUrl: string, trialStarted: boolean = false): string {
  const trialBanner = trialStarted ? `
        <div style="background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%); padding: 20px; border-radius: 8px; margin: 20px 0; text-align: center;">
          <p style="color: white; font-size: 18px; font-weight: 600; margin: 0 0 8px 0;">🎁 Your 14-Day Premium Trial is Active!</p>
          <p style="color: rgba(255,255,255,0.9); font-size: 14px; margin: 0;">Enjoy full access to AI-powered essay grading, detailed feedback, and all premium features. No payment required during your trial.</p>
        </div>
  ` : '';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Account Approved - Brilla</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🎉 You're Approved!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px;">Great news! Your Brilla Study Platform account has been approved. You can now log in and start your learning journey!</p>
        ${trialBanner}
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/login" style="background: linear-gradient(135deg, #059669 0%, #10b981 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Log In Now</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Welcome to Brilla! We're excited to have you join our community of learners.</p>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Brilla Study Platform - Excellence in Learning</p>
      </div>
    </body>
    </html>
  `;
}

function getRejectionEmailHTML(userName: string, reason: string | null, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Registration Update - Brilla</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #6b7280 0%, #4b5563 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Registration Update</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello <strong>${userName}</strong>,</p>
        <p style="font-size: 16px;">Thank you for your interest in Brilla Study Platform. Unfortunately, we were unable to approve your registration at this time.</p>
        ${reason ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Reason:</strong> ${reason}</p>
        </div>
        ` : ''}
        <p style="font-size: 14px; color: #6b7280;">If you believe this was a mistake or would like to provide additional information, please contact us or try registering again.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}" style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Visit Brilla</a>
        </div>
        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Brilla Study Platform - Excellence in Learning</p>
      </div>
    </body>
    </html>
  `;
}

function getNewRegistrationEmailHTML(userName: string, userEmail: string, userRole: string, appUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>New Registration Awaiting Approval - Brilla</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">New Registration Request</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello Admin,</p>
        <p style="font-size: 16px;">A new user has registered on Brilla Study Platform and is awaiting your approval:</p>
        <div style="background: #f3f4f6; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 8px 0; font-size: 15px;"><strong>Name:</strong> ${userName}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Email:</strong> ${userEmail}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Role:</strong> ${userRole}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Time:</strong> ${new Date().toLocaleString()}</p>
        </div>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/admin/approvals" style="background: linear-gradient(135deg, #059669 0%, #0d9488 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Review Registration</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">Please review this registration request at your earliest convenience.</p>
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

// =============================================
// DEMO DATA ISOLATION UTILITIES
// =============================================

// Demo user email patterns (users with these emails are considered demo users)
const DEMO_EMAIL_PATTERNS = ['@brillaprep.org'];

// Excluded emails (real accounts that use demo email domain)
const EXCLUDED_DEMO_EMAILS = ['admin@brillaprep.org'];

// Demo user IDs (explicit list of demo user IDs)
// Note: admin_prod_001 is NOT a demo account - it's the main admin
const DEMO_USER_IDS = [
  'teacher_1766327981453',
  'student_1766327981521',
  'parent_1',
  'demo_student_1',
  'demo_teacher_1',
  'demo_admin_1',
];

// Excluded user IDs (real accounts)
const EXCLUDED_DEMO_IDS = ['admin_prod_001'];

// Check if a user ID is a demo user
function isDemoUserId(userId: string): boolean {
  if (EXCLUDED_DEMO_IDS.includes(userId)) return false;
  return DEMO_USER_IDS.includes(userId) || userId.startsWith('demo_');
}

// Check if an email belongs to a demo user
function isDemoEmail(email: string): boolean {
  if (EXCLUDED_DEMO_EMAILS.includes(email.toLowerCase())) return false;
  return DEMO_EMAIL_PATTERNS.some(pattern => email.endsWith(pattern));
}

// Get demo data flags for database inserts
// Returns { is_demo_data: 0|1, expires_at: string|null }
function getDemoDataFlags(userId: string): { is_demo_data: number; expires_at: string | null } {
  if (isDemoUserId(userId)) {
    // Demo data expires in 24 hours
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    return { is_demo_data: 1, expires_at: expiresAt };
  }
  return { is_demo_data: 0, expires_at: null };
}

// SQL fragment for demo data columns
function getDemoDataSQL(userId: string): string {
  const flags = getDemoDataFlags(userId);
  if (flags.is_demo_data) {
    return `, is_demo_data, expires_at) VALUES (?, ?, ?, ..., 1, '${flags.expires_at}'`;
  }
  return `, is_demo_data, expires_at) VALUES (?, ?, ?, ..., 0, NULL`;
}

const app = new Hono<{ Bindings: Env }>();

// Middleware
app.use('*', cors());

// Public routes (no auth required)
const publicApp = new Hono<{ Bindings: Env }>();

// Protected routes with JWT authentication middleware
const protectedApp = new Hono<{ Bindings: Env }>();

// Authentication middleware for protected routes
protectedApp.use('*', async (c, next) => {
  const authHeader = c.req.header('Authorization');

  // Skip auth for OPTIONS requests (CORS preflight)
  if (c.req.method === 'OPTIONS') {
    return next();
  }

  // Check for Authorization header
  if (!authHeader?.startsWith('Bearer ')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const token = authHeader.replace('Bearer ', '');

  // Handle demo tokens
  if (token.endsWith('_demo_token')) {
    // For demo mode, get the user based on token prefix
    const tokenPrefix = token.replace('_demo_token', '');
    const demoUsers: Record<string, { id: string; role: string }> = {
      'student': { id: 'demo_student_1', role: 'student' },
      'teacher': { id: 'demo_teacher_1', role: 'teacher' },
      'admin': { id: 'demo_admin_1', role: 'admin' },
    };
    const demoUser = demoUsers[tokenPrefix];
    if (demoUser) {
      c.set('userId', demoUser.id);
      c.set('userRole', demoUser.role);
      c.set('isDemo', true); // Mark as demo user
      return next();
    }
  }

  // Verify JWT token
  try {
    const payload = await verifyJWT(token, c.env.JWT_SECRET);
    if (!payload) {
      return c.json({ success: false, error: 'Invalid token' }, 401);
    }
    c.set('userId', payload.userId);
    c.set('userRole', payload.role);
    // Check if this is a demo user by their ID or email
    const isDemo = isDemoUserId(payload.userId) || isDemoEmail(payload.email);
    c.set('isDemo', isDemo);
    return next();
  } catch (error) {
    console.error('Token verification error:', error);
    return c.json({ success: false, error: 'Invalid token' }, 401);
  }
});

// Helper to check if current user is demo
function isUserDemo(c: { get: (key: string) => boolean | undefined }): boolean {
  return c.get('isDemo') === true;
}

// Helper to get user from context or header (for backwards compatibility)
function getUserId(c: { get: (key: string) => string | undefined; req: { header: (name: string) => string | undefined } }): string | undefined {
  return c.get('userId') || c.req.header('x-user-id');
}

function getUserRole(c: { get: (key: string) => string | undefined; req: { header: (name: string) => string | undefined } }): string | undefined {
  return c.get('userRole') || c.req.header('x-user-role');
}

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
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications,
          selectedTierId } = body;

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
                         teacher_license_number, subjects_taught, years_experience, qualifications,
                         selected_tier_id)
      VALUES (?, ?, ?, ?, ?, 'pending', 0, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, email, passwordHash, name, userRole,
      schoolLevel || null, yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null,
      selectedTierId || null
    ).run();

    // Notify all admin users about the new registration
    try {
      const { results: admins } = await c.env.DB.prepare(
        "SELECT id, email, name FROM users WHERE role = 'admin' AND status = 'approved'"
      ).all();

      const roleLabel = userRole.charAt(0).toUpperCase() + userRole.slice(1);
      const notificationTitle = `New ${roleLabel} Registration`;
      const notificationMessage = `${name} (${email}) has registered as a ${userRole} and is awaiting approval.`;

      // Create in-app notification for each admin
      for (const admin of admins as { id: string; email: string; name: string }[]) {
        await createNotification(
          c.env.DB,
          admin.id,
          'system',
          notificationTitle,
          notificationMessage,
          {
            icon: 'user-plus',
            link: '/admin/approvals',
            metadata: { registrationId: id, registrantEmail: email, registrantRole: userRole }
          }
        );
      }

      // Send email notification to admins
      if (c.env.RESEND_API_KEY && admins.length > 0) {
        const appUrl = c.env.APP_URL || 'https://brillaprep.org';
        const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';
        const adminEmails = (admins as { email: string }[]).map(a => a.email);

        // Send to all admins
        const emailHtml = getNewRegistrationEmailHTML(name, email, roleLabel, appUrl);

        for (const adminEmail of adminEmails) {
          await sendEmail(
            c.env.RESEND_API_KEY,
            fromEmail,
            adminEmail,
            `New ${roleLabel} Registration Awaiting Approval`,
            emailHtml
          );
        }
      }
    } catch (notifyError) {
      // Log but don't fail the registration if notification fails
      console.error('Failed to notify admins:', notifyError);
    }

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

// Setup endpoint - Initialize demo users with passwords
// This should only be called once during initial setup
publicApp.post('/auth/setup', async (c) => {
  const { setupKey, users } = await c.req.json();

  // Simple security check - require a setup key that matches JWT_SECRET
  // In production, you might use a separate SETUP_KEY secret
  if (setupKey !== c.env.JWT_SECRET) {
    return c.json({ success: false, error: 'Invalid setup key' }, 401);
  }

  try {
    const results = [];

    // Default demo users if none provided
    const demoUsers = users || [
      { email: 'admin@brillaprep.org', password: 'Admin123!', name: 'System Admin', role: 'admin' },
      { email: 'teacher@brillaprep.org', password: 'Teacher123!', name: 'Demo Teacher', role: 'teacher' },
      { email: 'student@brillaprep.org', password: 'Student123!', name: 'Demo Student', role: 'student' },
      { email: 'parent@brillaprep.org', password: 'Parent123!', name: 'Demo Parent', role: 'parent' },
    ];

    for (const user of demoUsers) {
      // Check if user exists
      const existing = await c.env.DB.prepare(
        'SELECT id, password_hash FROM users WHERE email = ?'
      ).bind(user.email).first();

      const passwordHash = await hashPassword(user.password);

      if (existing) {
        // Update password if user exists
        await c.env.DB.prepare(`
          UPDATE users SET password_hash = ?, updated_at = datetime('now')
          WHERE email = ?
        `).bind(passwordHash, user.email).run();
        results.push({ email: user.email, action: 'updated' });
      } else {
        // Create user if doesn't exist
        const userId = `${user.role}_${Date.now()}`;
        await c.env.DB.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, status, is_active, email_verified, xp_points, level, streak_days, ai_grading_credits)
          VALUES (?, ?, ?, ?, ?, 'approved', 1, 1, 0, 1, 0, ?)
        `).bind(
          userId,
          user.email,
          passwordHash,
          user.name,
          user.role,
          user.role === 'admin' ? 100 : user.role === 'teacher' ? 50 : 10
        ).run();
        results.push({ email: user.email, action: 'created' });
      }
    }

    return c.json({ success: true, data: { message: 'Setup completed', results } });
  } catch (error) {
    console.error('Setup error:', error);
    return c.json({ success: false, error: 'Setup failed: ' + (error instanceof Error ? error.message : 'Unknown error') }, 500);
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

// Leaderboard - Top 100 users by XP
publicApp.get('/leaderboard', async (c) => {
  const period = c.req.query('period') || 'weekly';

  try {
    // First try to get from leaderboard table
    let results = await c.env.DB.prepare(`
      SELECT l.*, u.name as user_name, u.avatar_url as user_avatar, u.house, u.xp_points, u.level
      FROM leaderboard l
      JOIN users u ON l.user_id = u.id
      WHERE l.period = ?
      ORDER BY l.score DESC
      LIMIT 100
    `).bind(period).all();

    // If leaderboard table is empty, fall back to users table directly
    if (results.results.length === 0) {
      results = await c.env.DB.prepare(`
        SELECT
          'lb_' || id as id,
          id as user_id,
          name as user_name,
          avatar_url as user_avatar,
          house,
          xp_points as score,
          level
        FROM users
        WHERE role = 'student' AND status = 'approved'
        ORDER BY xp_points DESC
        LIMIT 100
      `).all();
    }

    // Add rank numbers
    const entries = results.results.map((entry: Record<string, unknown>, index: number) => ({
      ...entry,
      rank: index + 1,
    }));

    // Get total count
    const countResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM users WHERE role = 'student' AND status = 'approved'
    `).first();

    return c.json({
      success: true,
      data: {
        entries,
        period,
        total: (countResult as Record<string, number>)?.total || entries.length,
      },
    });
  } catch (error) {
    console.error('Leaderboard error:', error);
    return c.json({ success: false, error: 'Failed to fetch leaderboard' }, 500);
  }
});

// Get user's specific rank
publicApp.get('/leaderboard/user/:userId', async (c) => {
  const userId = c.req.param('userId');
  const period = c.req.query('period') || 'weekly';

  try {
    // Get user's score
    const user = await c.env.DB.prepare(`
      SELECT id, xp_points as score FROM users WHERE id = ?
    `).bind(userId).first() as Record<string, unknown> | null;

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Count users with higher score (to determine rank)
    const rankResult = await c.env.DB.prepare(`
      SELECT COUNT(*) + 1 as rank
      FROM users
      WHERE role = 'student' AND status = 'approved' AND xp_points > ?
    `).bind(user.score).first() as Record<string, number>;

    // Get total participants
    const totalResult = await c.env.DB.prepare(`
      SELECT COUNT(*) as total FROM users WHERE role = 'student' AND status = 'approved'
    `).first() as Record<string, number>;

    return c.json({
      success: true,
      data: {
        rank: rankResult?.rank || 1,
        score: user.score,
        total: totalResult?.total || 1,
      },
    });
  } catch (error) {
    console.error('User rank error:', error);
    return c.json({ success: false, error: 'Failed to fetch user rank' }, 500);
  }
});

// =============================================
// QUESTS ENDPOINTS
// =============================================

// Get daily quests for user
protectedApp.get('/quests/daily', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Get current date for daily reset
    const today = new Date().toISOString().split('T')[0];
    const tomorrow = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0];

    // First check if user has daily quests for today
    const existingQuests = await c.env.DB.prepare(`
      SELECT uq.*, qt.name as quest_name, qt.description as quest_description,
             qt.icon as quest_icon, qt.xp_reward, qt.coin_reward, qt.difficulty,
             qt.requirement_type
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.user_id = ? AND qt.quest_type = 'daily'
        AND uq.expires_at >= ?
      ORDER BY qt.difficulty, qt.id
    `).bind(userId, today).all();

    if (existingQuests.results && existingQuests.results.length > 0) {
      return c.json({
        success: true,
        data: { quests: existingQuests.results },
      });
    }

    // No quests for today - assign new ones
    const templates = await c.env.DB.prepare(`
      SELECT * FROM quest_templates
      WHERE quest_type = 'daily' AND is_active = 1
      ORDER BY RANDOM() LIMIT 5
    `).all();

    if (!templates.results || templates.results.length === 0) {
      // Return empty if no templates exist
      return c.json({ success: true, data: { quests: [] } });
    }

    // Create user quests
    const insertQuests = templates.results.map((t: Record<string, unknown>) =>
      c.env.DB.prepare(`
        INSERT INTO user_quests (id, user_id, quest_template_id, progress, target, status, expires_at)
        VALUES (?, ?, ?, 0, ?, 'active', ?)
      `).bind(
        `uq_${crypto.randomUUID()}`,
        userId,
        t.id,
        t.requirement_value,
        tomorrow
      )
    );

    await c.env.DB.batch(insertQuests);

    // Fetch the newly created quests
    const newQuests = await c.env.DB.prepare(`
      SELECT uq.*, qt.name as quest_name, qt.description as quest_description,
             qt.icon as quest_icon, qt.xp_reward, qt.coin_reward, qt.difficulty,
             qt.requirement_type
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.user_id = ? AND qt.quest_type = 'daily' AND uq.expires_at >= ?
      ORDER BY qt.difficulty, qt.id
    `).bind(userId, today).all();

    return c.json({
      success: true,
      data: { quests: newQuests.results || [] },
    });
  } catch (error) {
    console.error('Daily quests error:', error);
    return c.json({ success: false, error: 'Failed to fetch daily quests' }, 500);
  }
});

// Get weekly quests for user
protectedApp.get('/quests/weekly', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Calculate week start (Monday) and end (Sunday)
    const now = new Date();
    const dayOfWeek = now.getDay();
    const daysToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - daysToMonday);
    weekStart.setHours(0, 0, 0, 0);
    const weekEnd = new Date(weekStart);
    weekEnd.setDate(weekStart.getDate() + 7);

    const weekStartStr = weekStart.toISOString().split('T')[0];
    const weekEndStr = weekEnd.toISOString().split('T')[0];

    // Check for existing weekly quests
    const existingQuests = await c.env.DB.prepare(`
      SELECT uq.*, qt.name as quest_name, qt.description as quest_description,
             qt.icon as quest_icon, qt.xp_reward, qt.coin_reward, qt.difficulty,
             qt.requirement_type
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.user_id = ? AND qt.quest_type = 'weekly'
        AND uq.expires_at >= ?
      ORDER BY qt.difficulty, qt.id
    `).bind(userId, weekStartStr).all();

    if (existingQuests.results && existingQuests.results.length > 0) {
      return c.json({
        success: true,
        data: { quests: existingQuests.results },
      });
    }

    // Assign new weekly quests
    const templates = await c.env.DB.prepare(`
      SELECT * FROM quest_templates
      WHERE quest_type = 'weekly' AND is_active = 1
      ORDER BY RANDOM() LIMIT 3
    `).all();

    if (!templates.results || templates.results.length === 0) {
      return c.json({ success: true, data: { quests: [] } });
    }

    const insertQuests = templates.results.map((t: Record<string, unknown>) =>
      c.env.DB.prepare(`
        INSERT INTO user_quests (id, user_id, quest_template_id, progress, target, status, expires_at)
        VALUES (?, ?, ?, 0, ?, 'active', ?)
      `).bind(
        `uq_${crypto.randomUUID()}`,
        userId,
        t.id,
        t.requirement_value,
        weekEndStr
      )
    );

    await c.env.DB.batch(insertQuests);

    const newQuests = await c.env.DB.prepare(`
      SELECT uq.*, qt.name as quest_name, qt.description as quest_description,
             qt.icon as quest_icon, qt.xp_reward, qt.coin_reward, qt.difficulty,
             qt.requirement_type
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.user_id = ? AND qt.quest_type = 'weekly' AND uq.expires_at >= ?
      ORDER BY qt.difficulty, qt.id
    `).bind(userId, weekStartStr).all();

    return c.json({
      success: true,
      data: { quests: newQuests.results || [] },
    });
  } catch (error) {
    console.error('Weekly quests error:', error);
    return c.json({ success: false, error: 'Failed to fetch weekly quests' }, 500);
  }
});

// Get current weekly challenge
protectedApp.get('/quests/weekly-challenge', async (c) => {
  const userId = getUserId(c);

  try {
    const now = new Date().toISOString();

    const challenge = await c.env.DB.prepare(`
      SELECT wc.*, uwc.progress as user_progress, uwc.status as user_status
      FROM weekly_challenges wc
      LEFT JOIN user_weekly_challenges uwc ON wc.id = uwc.challenge_id AND uwc.user_id = ?
      WHERE wc.is_active = 1 AND wc.start_date <= ? AND wc.end_date >= ?
      ORDER BY wc.created_at DESC
      LIMIT 1
    `).bind(userId || '', now, now).first();

    return c.json({
      success: true,
      data: { challenge },
    });
  } catch (error) {
    console.error('Weekly challenge error:', error);
    return c.json({ success: false, error: 'Failed to fetch weekly challenge' }, 500);
  }
});

// Claim quest reward
protectedApp.post('/quests/:questId/claim', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const questId = c.req.param('questId');

  try {
    // Get the quest
    const quest = await c.env.DB.prepare(`
      SELECT uq.*, qt.xp_reward, qt.coin_reward
      FROM user_quests uq
      JOIN quest_templates qt ON uq.quest_template_id = qt.id
      WHERE uq.id = ? AND uq.user_id = ?
    `).bind(questId, userId).first() as Record<string, unknown> | null;

    if (!quest) {
      return c.json({ success: false, error: 'Quest not found' }, 404);
    }

    if (quest.status !== 'completed') {
      return c.json({ success: false, error: 'Quest not completed yet' }, 400);
    }

    // Mark as claimed
    await c.env.DB.prepare(`
      UPDATE user_quests SET status = 'claimed', claimed_at = datetime('now')
      WHERE id = ?
    `).bind(questId).run();

    // Award XP
    const xpReward = quest.xp_reward as number;
    await c.env.DB.prepare(`
      UPDATE users SET xp_points = xp_points + ? WHERE id = ?
    `).bind(xpReward, userId).run();

    // Record completion
    await c.env.DB.prepare(`
      INSERT INTO quest_completions (id, user_id, quest_template_id, xp_earned, quest_type)
      VALUES (?, ?, ?, ?, (SELECT quest_type FROM quest_templates WHERE id = ?))
    `).bind(`qc_${crypto.randomUUID()}`, userId, quest.quest_template_id, xpReward, quest.quest_template_id).run();

    return c.json({
      success: true,
      data: {
        xp: xpReward,
        coins: quest.coin_reward || 0,
      },
    });
  } catch (error) {
    console.error('Claim quest error:', error);
    return c.json({ success: false, error: 'Failed to claim reward' }, 500);
  }
});

// Update quest progress (internal helper - called after answering questions, etc.)
protectedApp.post('/quests/progress', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const { requirementType, amount } = await c.req.json();

    // Update all active quests matching the requirement type
    await c.env.DB.prepare(`
      UPDATE user_quests
      SET progress = MIN(progress + ?, target)
      WHERE user_id = ? AND status = 'active'
        AND quest_template_id IN (
          SELECT id FROM quest_templates WHERE requirement_type = ?
        )
    `).bind(amount, userId, requirementType).run();

    // Check and mark completed quests
    await c.env.DB.prepare(`
      UPDATE user_quests
      SET status = 'completed', completed_at = datetime('now')
      WHERE user_id = ? AND status = 'active' AND progress >= target
    `).bind(userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Update progress error:', error);
    return c.json({ success: false, error: 'Failed to update progress' }, 500);
  }
});

// =============================================
// STREAK ENDPOINTS
// =============================================

// Get streak info and milestones
protectedApp.get('/streak/info', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Get user streak data
    const user = await c.env.DB.prepare(`
      SELECT streak_days, longest_streak, streak_protections, streak_freeze_active, streak_last_activity
      FROM users WHERE id = ?
    `).bind(userId).first() as Record<string, unknown> | null;

    // Get milestones with claimed status
    const milestones = await c.env.DB.prepare(`
      SELECT sm.*,
        CASE WHEN usm.id IS NOT NULL THEN 1 ELSE 0 END as is_claimed
      FROM streak_milestones sm
      LEFT JOIN user_streak_milestones usm ON sm.id = usm.milestone_id AND usm.user_id = ?
      ORDER BY sm.days ASC
    `).bind(userId).all();

    return c.json({
      success: true,
      data: {
        currentStreak: user?.streak_days || 0,
        longestStreak: user?.longest_streak || 0,
        lastActivity: user?.streak_last_activity,
        protectionsAvailable: user?.streak_protections || 0,
        protectionActive: !!user?.streak_freeze_active,
        protectionLastUsed: null,
        milestones: milestones.results || [],
      },
    });
  } catch (error) {
    console.error('Streak info error:', error);
    return c.json({ success: false, error: 'Failed to fetch streak info' }, 500);
  }
});

// Use streak protection
protectedApp.post('/streak/use-protection', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Check if user has protections
    const user = await c.env.DB.prepare(`
      SELECT streak_protections, streak_freeze_active FROM users WHERE id = ?
    `).bind(userId).first() as Record<string, unknown> | null;

    if (!user || (user.streak_protections as number) < 1) {
      return c.json({ success: false, error: 'No streak protections available' }, 400);
    }

    if (user.streak_freeze_active) {
      return c.json({ success: false, error: 'Streak protection already active' }, 400);
    }

    // Activate protection
    await c.env.DB.prepare(`
      UPDATE users
      SET streak_protections = streak_protections - 1,
          streak_freeze_active = 1,
          streak_protection_used_at = datetime('now')
      WHERE id = ?
    `).bind(userId).run();

    // Log the action
    await c.env.DB.prepare(`
      INSERT INTO streak_protection_log (id, user_id, action, amount, reason, streak_before)
      VALUES (?, ?, 'used', 1, 'Manual activation', (SELECT streak_days FROM users WHERE id = ?))
    `).bind(`spl_${crypto.randomUUID()}`, userId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Use protection error:', error);
    return c.json({ success: false, error: 'Failed to use protection' }, 500);
  }
});

// Claim streak milestone
protectedApp.post('/streak/milestones/:milestoneId/claim', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const milestoneId = c.req.param('milestoneId');

  try {
    // Check if already claimed
    const existing = await c.env.DB.prepare(`
      SELECT id FROM user_streak_milestones WHERE user_id = ? AND milestone_id = ?
    `).bind(userId, milestoneId).first();

    if (existing) {
      return c.json({ success: false, error: 'Milestone already claimed' }, 400);
    }

    // Get milestone and user streak
    const milestone = await c.env.DB.prepare(`
      SELECT * FROM streak_milestones WHERE id = ?
    `).bind(milestoneId).first() as Record<string, unknown> | null;

    const user = await c.env.DB.prepare(`
      SELECT streak_days FROM users WHERE id = ?
    `).bind(userId).first() as Record<string, unknown> | null;

    if (!milestone) {
      return c.json({ success: false, error: 'Milestone not found' }, 404);
    }

    if (!user || (user.streak_days as number) < (milestone.days as number)) {
      return c.json({ success: false, error: 'Milestone not yet achieved' }, 400);
    }

    // Claim milestone
    await c.env.DB.prepare(`
      INSERT INTO user_streak_milestones (id, user_id, milestone_id)
      VALUES (?, ?, ?)
    `).bind(`usm_${crypto.randomUUID()}`, userId, milestoneId).run();

    // Award rewards
    const xpReward = milestone.xp_reward as number;
    const protectionReward = milestone.protection_reward as number;

    await c.env.DB.prepare(`
      UPDATE users
      SET xp_points = xp_points + ?,
          streak_protections = streak_protections + ?
      WHERE id = ?
    `).bind(xpReward, protectionReward, userId).run();

    // Log if protections earned
    if (protectionReward > 0) {
      await c.env.DB.prepare(`
        INSERT INTO streak_protection_log (id, user_id, action, amount, reason)
        VALUES (?, ?, 'earned', ?, ?)
      `).bind(`spl_${crypto.randomUUID()}`, userId, protectionReward, `Streak milestone: ${milestone.name}`).run();
    }

    return c.json({
      success: true,
      data: {
        xp: xpReward,
        protections: protectionReward,
      },
    });
  } catch (error) {
    console.error('Claim milestone error:', error);
    return c.json({ success: false, error: 'Failed to claim milestone' }, 500);
  }
});

// Record study activity (updates streak)
protectedApp.post('/streak/activity', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    const today = new Date().toISOString().split('T')[0];

    // Get user's last activity
    const user = await c.env.DB.prepare(`
      SELECT streak_days, longest_streak, streak_last_activity, streak_freeze_active
      FROM users WHERE id = ?
    `).bind(userId).first() as Record<string, unknown> | null;

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const lastActivity = user.streak_last_activity as string | null;
    let currentStreak = (user.streak_days as number) || 0;
    let longestStreak = (user.longest_streak as number) || 0;

    if (lastActivity) {
      const lastDate = new Date(lastActivity).toISOString().split('T')[0];
      const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      if (lastDate === today) {
        // Already recorded today
        return c.json({ success: true, data: { streak: currentStreak } });
      } else if (lastDate === yesterday) {
        // Continued streak
        currentStreak += 1;
      } else if (user.streak_freeze_active) {
        // Missed day but had protection active
        currentStreak += 1;
      } else {
        // Streak broken
        currentStreak = 1;
      }
    } else {
      // First activity
      currentStreak = 1;
    }

    longestStreak = Math.max(longestStreak, currentStreak);

    // Update user
    await c.env.DB.prepare(`
      UPDATE users
      SET streak_days = ?,
          longest_streak = ?,
          streak_last_activity = ?,
          streak_freeze_active = 0
      WHERE id = ?
    `).bind(currentStreak, longestStreak, today, userId).run();

    return c.json({
      success: true,
      data: { streak: currentStreak, longest: longestStreak },
    });
  } catch (error) {
    console.error('Record activity error:', error);
    return c.json({ success: false, error: 'Failed to record activity' }, 500);
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

    // Record the attempt with demo data flags
    const attemptId = `attempt_${Date.now()}`;
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO question_attempts (id, user_id, question_id, user_answer, is_correct, time_taken, points_earned, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(attemptId, userId, questionId, answer, isCorrect ? 1 : 0, 0, pointsEarned, demoFlags.is_demo_data, demoFlags.expires_at).run();

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
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO house_points (id, house_id, user_id, points, source, source_id, period, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, houseId, userId, points, source, sourceId || null, period, demoFlags.is_demo_data, demoFlags.expires_at).run();

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
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO battles (id, challenger_id, subject_id, difficulty, question_count, questions, status, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, 'waiting', ?, ?)
    `).bind(
      battleId,
      userId,
      subjectId || null,
      difficulty || 'medium',
      questionCount || 10,
      JSON.stringify(parsedQuestions),
      demoFlags.is_demo_data,
      demoFlags.expires_at
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

    // Record answer with demo data flags
    const answerId = `ba_${Date.now()}_${userId}`;
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO battle_answers (id, battle_id, user_id, question_index, answer, is_correct, time_taken, points_earned, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(answerId, battleId, userId, questionIndex, answer, isCorrect ? 1 : 0, timeTaken || 0, pointsEarned, demoFlags.is_demo_data, demoFlags.expires_at).run();

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
    const demoFlags = getDemoDataFlags(userId);

    await c.env.DB.prepare(`
      INSERT INTO paper_attempts (id, user_id, paper_id, status, time_allowed, is_demo_data, expires_at)
      VALUES (?, ?, ?, 'in_progress', ?, ?, ?)
    `).bind(attemptId, userId, paperId, timeAllowed, demoFlags.is_demo_data, demoFlags.expires_at).run();

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
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO essay_attempts (id, user_id, question_id, answer_text, word_count, grading_type, grading_status, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      attemptId,
      userId,
      questionId,
      answerText,
      wordCount,
      wantsAIGrading ? 'ai' : 'self',
      wantsAIGrading ? 'pending' : 'graded',
      demoFlags.is_demo_data,
      demoFlags.expires_at
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

// Upload avatar
protectedApp.post('/users/me/avatar', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  try {
    // Check if R2 bucket is configured
    if (!c.env.LIBRARY_BUCKET) {
      return c.json({ success: false, error: 'Storage not configured' }, 500);
    }

    // Parse FormData
    const formData = await c.req.formData();
    const file = formData.get('avatar') as File | null;

    if (!file) {
      return c.json({ success: false, error: 'No file provided' }, 400);
    }

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowedTypes.includes(file.type)) {
      return c.json({ success: false, error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' }, 400);
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ success: false, error: 'File too large. Maximum size is 5MB.' }, 400);
    }

    // Get current avatar URL to delete old file
    const currentUser = await c.env.DB.prepare(
      'SELECT avatar_url FROM users WHERE id = ?'
    ).bind(user.userId).first();

    // Delete old avatar from R2 if exists
    if (currentUser?.avatar_url) {
      const oldUrl = currentUser.avatar_url as string;
      const oldKey = oldUrl.split('/files/')[1];
      if (oldKey) {
        try {
          await c.env.LIBRARY_BUCKET.delete(oldKey);
        } catch (e) {
          console.error('Failed to delete old avatar:', e);
        }
      }
    }

    // Generate unique file key
    const fileExtension = file.name.split('.').pop()?.toLowerCase() || 'jpg';
    const fileKey = `avatars/${user.userId}_${Date.now()}.${fileExtension}`;

    // Upload to R2
    await c.env.LIBRARY_BUCKET.put(fileKey, file.stream(), {
      httpMetadata: {
        contentType: file.type,
      },
    });

    // Generate avatar URL
    const avatarUrl = `https://brilla-api.ghwmelite.workers.dev/api/library/files/${fileKey}`;

    // Update database
    await c.env.DB.prepare(`
      UPDATE users SET
        avatar_url = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(avatarUrl, user.userId).run();

    return c.json({ success: true, data: { avatarUrl } });
  } catch (error) {
    console.error('Avatar upload error:', error);
    return c.json({ success: false, error: 'Failed to upload avatar' }, 500);
  }
});

// Delete avatar
protectedApp.delete('/users/me/avatar', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  try {
    // Get current avatar URL
    const currentUser = await c.env.DB.prepare(
      'SELECT avatar_url FROM users WHERE id = ?'
    ).bind(user.userId).first();

    if (!currentUser?.avatar_url) {
      return c.json({ success: true, data: { message: 'No avatar to delete' } });
    }

    // Delete from R2 if bucket is configured
    if (c.env.LIBRARY_BUCKET) {
      const oldUrl = currentUser.avatar_url as string;
      const oldKey = oldUrl.split('/files/')[1];
      if (oldKey) {
        try {
          await c.env.LIBRARY_BUCKET.delete(oldKey);
        } catch (e) {
          console.error('Failed to delete avatar from R2:', e);
        }
      }
    }

    // Update database
    await c.env.DB.prepare(`
      UPDATE users SET
        avatar_url = NULL,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(user.userId).run();

    return c.json({ success: true, data: { message: 'Avatar deleted successfully' } });
  } catch (error) {
    console.error('Avatar delete error:', error);
    return c.json({ success: false, error: 'Failed to delete avatar' }, 500);
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

// Dashboard stats
adminApp.get('/dashboard/stats', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [
      totalUsers,
      activeToday,
      newThisWeek,
      pendingApprovals,
      activeTrials,
      totalRevenue
    ] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE DATE(last_login_at) = ?').bind(today).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').bind(weekAgo).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM users WHERE status = 'pending'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_trials WHERE status = 'active' AND expires_at > datetime('now')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'completed'").first(),
    ]);

    return c.json({
      success: true,
      data: {
        totalUsers: (totalUsers as { count: number })?.count || 0,
        activeToday: (activeToday as { count: number })?.count || 0,
        newThisWeek: (newThisWeek as { count: number })?.count || 0,
        pendingApprovals: (pendingApprovals as { count: number })?.count || 0,
        trials: (activeTrials as { count: number })?.count || 0,
        revenue: (totalRevenue as { total: number })?.total || 0,
      },
    });
  } catch (error) {
    console.error('Dashboard stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard stats' }, 500);
  }
});

// Recent activity feed
adminApp.get('/activity/recent', async (c) => {
  try {
    // Get recent logins
    const { results: logins } = await c.env.DB.prepare(`
      SELECT u.id, u.name, u.email, u.last_login_at as timestamp
      FROM users u
      WHERE u.last_login_at IS NOT NULL
      ORDER BY u.last_login_at DESC
      LIMIT 5
    `).all();

    // Get recent registrations
    const { results: registrations } = await c.env.DB.prepare(`
      SELECT id, name, email, created_at as timestamp, role
      FROM users
      ORDER BY created_at DESC
      LIMIT 5
    `).all();

    // Get recent approvals
    const { results: approvals } = await c.env.DB.prepare(`
      SELECT id, name, email, updated_at as timestamp
      FROM users
      WHERE status = 'approved' AND updated_at IS NOT NULL
      ORDER BY updated_at DESC
      LIMIT 5
    `).all();

    // Combine and sort
    const activities: Array<{
      id: string;
      type: 'registration' | 'login' | 'approval' | 'payment' | 'system';
      message: string;
      user?: string;
      timestamp: string;
    }> = [];

    logins.forEach((l: Record<string, unknown>) => {
      activities.push({
        id: `login_${l.id}`,
        type: 'login',
        message: 'User login',
        user: l.name as string || l.email as string,
        timestamp: l.timestamp as string,
      });
    });

    registrations.forEach((r: Record<string, unknown>) => {
      activities.push({
        id: `reg_${r.id}`,
        type: 'registration',
        message: `New ${r.role} registration`,
        user: r.name as string || r.email as string,
        timestamp: r.timestamp as string,
      });
    });

    approvals.forEach((a: Record<string, unknown>) => {
      activities.push({
        id: `approval_${a.id}`,
        type: 'approval',
        message: 'User approved',
        user: a.name as string || a.email as string,
        timestamp: a.timestamp as string,
      });
    });

    // Sort by timestamp descending
    activities.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return c.json({ success: true, data: activities.slice(0, 10) });
  } catch (error) {
    console.error('Recent activity error:', error);
    return c.json({ success: false, error: 'Failed to fetch recent activity' }, 500);
  }
});

// System health check
adminApp.get('/system/health', async (c) => {
  try {
    // Check database
    let databaseStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      await c.env.DB.prepare('SELECT 1').first();
    } catch {
      databaseStatus = 'down';
    }

    // Check storage (R2)
    let storageStatus: 'healthy' | 'degraded' | 'down' = 'healthy';
    try {
      await c.env.LIBRARY_BUCKET.list({ limit: 1 });
    } catch {
      storageStatus = 'degraded';
    }

    return c.json({
      success: true,
      data: {
        database: databaseStatus,
        api: 'healthy', // If we got here, API is healthy
        storage: storageStatus,
      },
    });
  } catch (error) {
    console.error('System health error:', error);
    return c.json({
      success: true,
      data: {
        database: 'degraded',
        api: 'healthy',
        storage: 'degraded',
      },
    });
  }
});

// Analytics endpoint
adminApp.get('/analytics', async (c) => {
  try {
    const range = c.req.query('range') || '30d';
    const days = range === '7d' ? 7 : range === '90d' ? 90 : 30;
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();
    const lastPeriodStart = new Date(Date.now() - days * 2 * 24 * 60 * 60 * 1000).toISOString();

    // User stats
    const [totalUsers, newUsers, lastPeriodUsers, byRole, bySchoolLevel] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE is_active = 1').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ?').bind(startDate).first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM users WHERE created_at >= ? AND created_at < ?').bind(lastPeriodStart, startDate).first(),
      c.env.DB.prepare('SELECT role, COUNT(*) as count FROM users WHERE is_active = 1 GROUP BY role').all(),
      c.env.DB.prepare("SELECT school_level as level, COUNT(*) as count FROM users WHERE role = 'student' AND school_level IS NOT NULL GROUP BY school_level").all(),
    ]);

    const currentCount = (newUsers as { count: number })?.count || 0;
    const lastCount = (lastPeriodUsers as { count: number })?.count || 1;
    const growthPercent = Math.round(((currentCount - lastCount) / lastCount) * 100);

    // Engagement stats
    const [questionsAnswered, activeToday, activeWeek, activeMonth] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count, AVG(CASE WHEN is_correct = 1 THEN 100 ELSE 0 END) as accuracy FROM question_attempts').first(),
      c.env.DB.prepare('SELECT COUNT(DISTINCT user_id) as count FROM question_attempts WHERE DATE(created_at) = DATE("now")').first(),
      c.env.DB.prepare('SELECT COUNT(DISTINCT user_id) as count FROM question_attempts WHERE created_at >= datetime("now", "-7 days")').first(),
      c.env.DB.prepare('SELECT COUNT(DISTINCT user_id) as count FROM question_attempts WHERE created_at >= datetime("now", "-30 days")').first(),
    ]);

    // Content stats
    const [totalQuestions, bySubject, byDifficulty] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM questions').first(),
      c.env.DB.prepare('SELECT subject_id as subject, COUNT(*) as count FROM questions GROUP BY subject_id LIMIT 10').all(),
      c.env.DB.prepare('SELECT difficulty, COUNT(*) as count FROM questions GROUP BY difficulty').all(),
    ]);

    // Revenue stats
    const [revenueThisMonth, revenueLastMonth, activeSubs] = await Promise.all([
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'completed' AND created_at >= datetime('now', 'start of month')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'completed' AND created_at >= datetime('now', 'start of month', '-1 month') AND created_at < datetime('now', 'start of month')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'").first(),
    ]);

    const thisMonthRev = (revenueThisMonth as { total: number })?.total || 0;
    const lastMonthRev = (revenueLastMonth as { total: number })?.total || 1;
    const revenueGrowth = Math.round(((thisMonthRev - lastMonthRev) / lastMonthRev) * 100);

    return c.json({
      success: true,
      data: {
        userStats: {
          totalUsers: (totalUsers as { count: number })?.count || 0,
          activeUsers: (activeMonth as { count: number })?.count || 0,
          newUsersThisMonth: currentCount,
          userGrowthPercent: growthPercent,
          byRole: (byRole.results || []).map((r: Record<string, unknown>) => ({ role: r.role, count: r.count })),
          bySchoolLevel: (bySchoolLevel.results || []).map((r: Record<string, unknown>) => ({ level: r.level || 'Unknown', count: r.count })),
        },
        engagementStats: {
          totalQuestionsAnswered: (questionsAnswered as { count: number })?.count || 0,
          averageAccuracy: Math.round((questionsAnswered as { accuracy: number })?.accuracy || 0),
          averageSessionDuration: 15, // Placeholder - would need session tracking
          dailyActiveUsers: (activeToday as { count: number })?.count || 0,
          weeklyActiveUsers: (activeWeek as { count: number })?.count || 0,
          monthlyActiveUsers: (activeMonth as { count: number })?.count || 0,
        },
        contentStats: {
          totalQuestions: (totalQuestions as { count: number })?.count || 0,
          questionsBySubject: (bySubject.results || []).map((r: Record<string, unknown>) => ({ subject: r.subject || 'Unknown', count: r.count })),
          questionsByDifficulty: (byDifficulty.results || []).map((r: Record<string, unknown>) => ({ difficulty: r.difficulty || 'medium', count: r.count })),
        },
        revenueStats: {
          totalRevenue: thisMonthRev + lastMonthRev,
          revenueThisMonth: thisMonthRev,
          revenueGrowthPercent: revenueGrowth,
          activeSubscriptions: (activeSubs as { count: number })?.count || 0,
          churnRate: 5, // Placeholder
        },
      },
    });
  } catch (error) {
    console.error('Analytics error:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
});

// Subscription stats
adminApp.get('/subscriptions/stats', async (c) => {
  try {
    const [active, trials, expiring, revenueThis, revenueLast] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_trials WHERE status = 'active' AND expires_at > datetime('now')").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active' AND expires_at <= datetime('now', '+7 days')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'completed' AND created_at >= datetime('now', 'start of month')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'completed' AND created_at >= datetime('now', 'start of month', '-1 month') AND created_at < datetime('now', 'start of month')").first(),
    ]);

    const thisMonth = (revenueThis as { total: number })?.total || 0;
    const lastMonth = (revenueLast as { total: number })?.total || 1;
    const growth = Math.round(((thisMonth - lastMonth) / lastMonth) * 100);

    return c.json({
      success: true,
      data: {
        totalSubscriptions: (active as { count: number })?.count || 0,
        activeSubscriptions: (active as { count: number })?.count || 0,
        trialUsers: (trials as { count: number })?.count || 0,
        expiringSoon: (expiring as { count: number })?.count || 0,
        revenueThisMonth: thisMonth,
        revenueLastMonth: lastMonth,
        growthPercent: growth,
        churnRate: 5,
        averageLifetimeValue: 150,
        conversionRate: 25,
      },
    });
  } catch (error) {
    console.error('Subscription stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch subscription stats' }, 500);
  }
});

// Subscription list
adminApp.get('/subscriptions/list', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT s.id, s.user_id, u.name as user_name, u.email as user_email,
             s.tier_id as plan_id, t.name as plan_name, s.status,
             s.billing_cycle, t.price_monthly as amount,
             s.started_at as start_date, s.expires_at as end_date, s.auto_renew
      FROM user_subscriptions s
      JOIN users u ON s.user_id = u.id
      LEFT JOIN subscription_tiers t ON s.tier_id = t.id
      ORDER BY s.created_at DESC
      LIMIT 100
    `).all();

    const subscriptions = (results || []).map((s: Record<string, unknown>) => ({
      id: s.id,
      userId: s.user_id,
      userName: s.user_name || 'Unknown',
      userEmail: s.user_email || '',
      planId: s.plan_id,
      planName: s.plan_name || 'Premium',
      status: s.status || 'active',
      billingCycle: s.billing_cycle || 'monthly',
      amount: s.amount || 0,
      startDate: s.start_date,
      endDate: s.end_date,
      autoRenew: s.auto_renew === 1,
    }));

    return c.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error('Subscription list error:', error);
    return c.json({ success: true, data: [] });
  }
});

// Trials list
adminApp.get('/subscriptions/trials', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT t.id, t.user_id, u.name as user_name, u.email as user_email,
             t.started_at, t.expires_at, t.status, t.tasks_completed
      FROM user_trials t
      JOIN users u ON t.user_id = u.id
      ORDER BY t.started_at DESC
      LIMIT 100
    `).all();

    const trials = (results || []).map((t: Record<string, unknown>) => {
      const expiresAt = new Date(t.expires_at as string);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const tasksCompleted = t.tasks_completed ? JSON.parse(t.tasks_completed as string).length : 0;

      return {
        id: t.id,
        userId: t.user_id,
        userName: t.user_name || 'Unknown',
        userEmail: t.user_email || '',
        startedAt: t.started_at,
        expiresAt: t.expires_at,
        daysRemaining,
        tasksCompleted,
        status: t.status || 'active',
      };
    });

    return c.json({ success: true, data: trials });
  } catch (error) {
    console.error('Trials list error:', error);
    return c.json({ success: true, data: [] });
  }
});

// Affiliate stats
adminApp.get('/affiliates/stats', async (c) => {
  try {
    const [total, active, referrals, conversions, commissions, pending] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM affiliate_profiles').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM affiliate_profiles WHERE status = 'active'").first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM affiliate_referrals').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM affiliate_referrals WHERE status = 'converted'").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_commissions WHERE status = 'paid'").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_payouts WHERE status = 'pending'").first(),
    ]);

    const totalRefs = (referrals as { count: number })?.count || 1;
    const successRefs = (conversions as { count: number })?.count || 0;
    const conversionRate = Math.round((successRefs / totalRefs) * 100);

    return c.json({
      success: true,
      data: {
        totalAffiliates: (total as { count: number })?.count || 0,
        activeAffiliates: (active as { count: number })?.count || 0,
        totalReferrals: totalRefs,
        successfulConversions: successRefs,
        totalCommissions: (commissions as { total: number })?.total || 0,
        pendingPayouts: (pending as { total: number })?.total || 0,
        conversionRate,
        averageCommission: 15,
      },
    });
  } catch (error) {
    console.error('Affiliate stats error:', error);
    return c.json({ success: true, data: {
      totalAffiliates: 0,
      activeAffiliates: 0,
      totalReferrals: 0,
      successfulConversions: 0,
      totalCommissions: 0,
      pendingPayouts: 0,
      conversionRate: 0,
      averageCommission: 0,
    }});
  }
});

// Affiliate list
adminApp.get('/affiliates/list', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT a.id, a.user_id, u.name as user_name, u.email as user_email,
             a.referral_code, a.total_referrals, a.successful_referrals,
             a.total_earnings, a.pending_balance, a.paid_balance,
             a.tier, a.status, a.created_at as joined_at
      FROM affiliate_profiles a
      JOIN users u ON a.user_id = u.id
      ORDER BY a.total_earnings DESC
      LIMIT 100
    `).all();

    const affiliates = (results || []).map((a: Record<string, unknown>) => ({
      id: a.id,
      userId: a.user_id,
      userName: a.user_name || 'Unknown',
      userEmail: a.user_email || '',
      referralCode: a.referral_code || '',
      totalReferrals: a.total_referrals || 0,
      successfulReferrals: a.successful_referrals || 0,
      totalEarnings: a.total_earnings || 0,
      pendingBalance: a.pending_balance || 0,
      paidBalance: a.paid_balance || 0,
      tier: a.tier || 'bronze',
      joinedAt: a.joined_at,
      status: a.status || 'active',
    }));

    return c.json({ success: true, data: affiliates });
  } catch (error) {
    console.error('Affiliate list error:', error);
    return c.json({ success: true, data: [] });
  }
});

// Affiliate payouts
adminApp.get('/affiliates/payouts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.id, p.affiliate_id, u.name as affiliate_name,
             p.amount, p.status, p.created_at as requested_at,
             p.processed_at, a.mobile_money_number as mobile_number,
             a.mobile_money_provider as provider
      FROM affiliate_payouts p
      JOIN affiliate_profiles a ON p.affiliate_id = a.id
      JOIN users u ON a.user_id = u.id
      ORDER BY p.created_at DESC
      LIMIT 100
    `).all();

    const payouts = (results || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      affiliateId: p.affiliate_id,
      affiliateName: p.affiliate_name || 'Unknown',
      amount: p.amount || 0,
      status: p.status || 'pending',
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
      mobileNumber: p.mobile_number || '',
      provider: p.provider || 'mtn',
    }));

    return c.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Affiliate payouts error:', error);
    return c.json({ success: true, data: [] });
  }
});

// Approve payout
adminApp.post('/affiliates/payouts/:id/approve', async (c) => {
  try {
    const { id } = c.req.param();

    await c.env.DB.prepare(`
      UPDATE affiliate_payouts
      SET status = 'completed', processed_at = datetime('now')
      WHERE id = ?
    `).bind(id).run();

    return c.json({ success: true, message: 'Payout approved' });
  } catch (error) {
    console.error('Approve payout error:', error);
    return c.json({ success: false, error: 'Failed to approve payout' }, 500);
  }
});

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

    // Check if user selected a premium tier - auto-start their 14-day trial
    let trialStarted = false;
    const selectedTierId = user.selected_tier_id as string | null;
    if (selectedTierId && selectedTierId !== 'tier_free') {
      try {
        const trialId = `trial_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        const expiresAt = new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString();

        await c.env.DB.prepare(`
          INSERT INTO user_trials (id, user_id, started_at, expires_at, status, tasks_completed)
          VALUES (?, ?, datetime('now'), ?, 'active', '[]')
        `).bind(trialId, userId, expiresAt).run();

        trialStarted = true;

        // Log the trial start
        await logAudit({
          db: c.env.DB,
          userId: adminUser.userId,
          userEmail: adminUser.email,
          userRole: adminUser.role,
          action: 'auto_start_trial',
          actionCategory: 'user_management',
          targetType: 'user',
          targetId: userId,
          targetDetails: `Auto-started 14-day trial for ${user.email} (selected tier: ${selectedTierId})`,
          ...clientInfo,
        });
      } catch (trialError) {
        console.error('Failed to auto-start trial:', trialError);
      }
    }

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
      targetDetails: `Approved ${user.email} (${user.role})${trialStarted ? ' - Trial started' : ''}`,
      ...clientInfo,
    });

    // Log data change
    await logDataChange(c.env.DB, 'users', userId, 'UPDATE', adminUser.userId, {
      oldValues: { status: 'pending' },
      newValues: { status: 'approved' },
      changedFields: ['status', 'email_verified', 'approved_by', 'approved_at'],
      reason: 'Admin approval',
    });

    // Send approval email notification
    if (c.env.RESEND_API_KEY && user.email) {
      try {
        const appUrl = c.env.APP_URL || 'https://brillaprep.org';
        const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';
        const emailHtml = getApprovalEmailHTML(user.name as string, appUrl, trialStarted);

        await sendEmail(
          c.env.RESEND_API_KEY,
          fromEmail,
          user.email as string,
          trialStarted
            ? 'Your Brilla Account Has Been Approved + 14-Day Free Trial! 🎉'
            : 'Your Brilla Account Has Been Approved! 🎉',
          emailHtml
        );
      } catch (emailError) {
        console.error('Failed to send approval email:', emailError);
      }
    }

    return c.json({ success: true, data: { message: 'User approved successfully', trialStarted } });
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

    // Send rejection email notification
    if (c.env.RESEND_API_KEY && user.email) {
      try {
        const appUrl = c.env.APP_URL || 'https://brillaprep.org';
        const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';
        const emailHtml = getRejectionEmailHTML(user.name as string, reason || null, appUrl);

        await sendEmail(
          c.env.RESEND_API_KEY,
          fromEmail,
          user.email as string,
          'Registration Update - Brilla Study Platform',
          emailHtml
        );
      } catch (emailError) {
        console.error('Failed to send rejection email:', emailError);
        // Don't fail the rejection if email fails
      }
    }

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

// Extend user's trial period
adminApp.post('/users/:id/extend-trial', async (c) => {
  const userId = c.req.param('id');
  const { days } = await c.req.json();
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  if (!days || days < 1 || days > 90) {
    return c.json({ success: false, error: 'Days must be between 1 and 90' }, 400);
  }

  try {
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, email, name FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Check for existing trial
    const existingTrial = await c.env.DB.prepare(
      'SELECT id, expires_at, status FROM user_trials WHERE user_id = ?'
    ).bind(userId).first();

    let newExpiryDate: string;

    if (existingTrial) {
      // Extend existing trial
      const currentExpiry = new Date(existingTrial.expires_at as string);
      const now = new Date();

      // If trial expired, extend from now; otherwise extend from current expiry
      const baseDate = currentExpiry > now ? currentExpiry : now;
      newExpiryDate = new Date(baseDate.getTime() + days * 24 * 60 * 60 * 1000).toISOString();

      await c.env.DB.prepare(`
        UPDATE user_trials SET
          expires_at = ?,
          status = 'active'
        WHERE user_id = ?
      `).bind(newExpiryDate, userId).run();
    } else {
      // Create new trial
      const trialId = crypto.randomUUID();
      newExpiryDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000).toISOString();

      await c.env.DB.prepare(`
        INSERT INTO user_trials (id, user_id, started_at, expires_at, status, tasks_completed)
        VALUES (?, ?, datetime('now'), ?, 'active', '[]')
      `).bind(trialId, userId, newExpiryDate).run();
    }

    // Also update user table trial fields
    await c.env.DB.prepare(`
      UPDATE users SET
        trial_started_at = COALESCE(trial_started_at, datetime('now')),
        trial_expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(newExpiryDate, userId).run();

    // Log the action
    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'extend_trial',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Extended trial by ${days} days for ${user.email}. New expiry: ${newExpiryDate.split('T')[0]}`,
      ...clientInfo,
    });

    return c.json({
      success: true,
      data: {
        message: `Trial extended by ${days} days`,
        newExpiryDate,
        daysAdded: days
      }
    });
  } catch (error) {
    console.error('Extend trial error:', error);
    return c.json({ success: false, error: 'Failed to extend trial' }, 500);
  }
});

// Add AI grading credits to user
adminApp.post('/users/:id/add-credits', async (c) => {
  const userId = c.req.param('id');
  const { credits } = await c.req.json();
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  if (!credits || credits < 1 || credits > 1000) {
    return c.json({ success: false, error: 'Credits must be between 1 and 1000' }, 400);
  }

  try {
    // Check if user exists
    const user = await c.env.DB.prepare(
      'SELECT id, email, name, ai_grading_credits FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const currentCredits = (user.ai_grading_credits as number) || 0;
    const newCredits = currentCredits + credits;

    await c.env.DB.prepare(`
      UPDATE users SET
        ai_grading_credits = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(newCredits, userId).run();

    // Log the action
    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'add_credits',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Added ${credits} AI grading credits to ${user.email}. New total: ${newCredits}`,
      ...clientInfo,
    });

    return c.json({
      success: true,
      data: {
        message: `Added ${credits} AI grading credits`,
        previousCredits: currentCredits,
        creditsAdded: credits,
        newTotal: newCredits
      }
    });
  } catch (error) {
    console.error('Add credits error:', error);
    return c.json({ success: false, error: 'Failed to add credits' }, 500);
  }
});

// Get user subscription/trial details (admin view)
adminApp.get('/users/:id/subscription', async (c) => {
  const userId = c.req.param('id');

  try {
    // Get user details
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, ai_grading_credits, trial_started_at, trial_expires_at
      FROM users WHERE id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Get trial details
    const trial = await c.env.DB.prepare(`
      SELECT id, started_at, expires_at, status, tasks_completed, discount_percent
      FROM user_trials WHERE user_id = ?
    `).bind(userId).first();

    // Get active subscription
    const subscription = await c.env.DB.prepare(`
      SELECT us.*, st.name as plan_name, st.price_monthly, st.price_yearly, st.ai_grading_quota
      FROM user_subscriptions us
      LEFT JOIN subscription_tiers st ON us.tier_id = st.id
      WHERE us.user_id = ? AND us.status = 'active'
      ORDER BY us.created_at DESC
      LIMIT 1
    `).bind(userId).first();

    // Calculate days remaining
    let trialDaysRemaining = 0;
    let subscriptionDaysRemaining = 0;

    if (trial && trial.status === 'active') {
      const expiresAt = new Date(trial.expires_at as string);
      const now = new Date();
      trialDaysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    if (subscription) {
      const expiresAt = new Date(subscription.expires_at as string);
      const now = new Date();
      subscriptionDaysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    return c.json({
      success: true,
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          aiGradingCredits: user.ai_grading_credits || 0,
        },
        trial: trial ? {
          id: trial.id,
          status: trial.status,
          startedAt: trial.started_at,
          expiresAt: trial.expires_at,
          daysRemaining: trialDaysRemaining,
          tasksCompleted: JSON.parse((trial.tasks_completed as string) || '[]').length,
        } : null,
        subscription: subscription ? {
          planName: subscription.plan_name,
          status: subscription.status,
          billingCycle: subscription.billing_cycle,
          expiresAt: subscription.expires_at,
          daysRemaining: subscriptionDaysRemaining,
          aiGradingQuota: subscription.ai_grading_quota,
        } : null,
      }
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    return c.json({ success: false, error: 'Failed to get subscription details' }, 500);
  }
});

// Mount admin routes
app.route('/api/admin', adminApp);

// Note: protectedApp routes are defined below and mounted at the end of the file

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

// =============================================
// ADMIN SUBSCRIPTION MANAGEMENT ENDPOINTS
// =============================================

// Admin: Get subscription statistics
protectedApp.get('/admin/subscriptions/stats', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    // Get subscription stats from payment_transactions (successful payments)
    const totalSubs = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM payment_transactions
      WHERE status = 'success'
    `).first();

    // Active subscriptions (paid within last 30 days for monthly, 365 for yearly)
    const activeSubs = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT user_id) as count FROM payment_transactions
      WHERE status = 'success'
      AND (
        (billing_cycle = 'monthly' AND created_at >= date('now', '-30 days'))
        OR (billing_cycle = 'yearly' AND created_at >= date('now', '-365 days'))
      )
    `).first();

    const trialUsers = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_trials WHERE status = 'active'
    `).first();

    // Users whose trial expires in next 7 days
    const expiringSoon = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_trials
      WHERE status = 'active'
      AND expires_at > datetime('now')
      AND expires_at < datetime('now', '+7 days')
    `).first();

    // Revenue stats from payment_transactions
    const revenueThisMonth = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions
      WHERE status = 'success'
      AND created_at >= date('now', 'start of month')
    `).first();

    const revenueLastMonth = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions
      WHERE status = 'success'
      AND created_at >= date('now', 'start of month', '-1 month')
      AND created_at < date('now', 'start of month')
    `).first();

    const thisMonth = (revenueThisMonth as { total: number })?.total || 0;
    const lastMonth = (revenueLastMonth as { total: number })?.total || 0;
    const growthPercent = lastMonth > 0 ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : 0;

    // Calculate trial conversion rate
    const totalTrials = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_trials
    `).first();
    const convertedTrials = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_trials WHERE status = 'converted'
    `).first();
    const totalTrialCount = (totalTrials as { count: number })?.count || 0;
    const convertedCount = (convertedTrials as { count: number })?.count || 0;
    const conversionRate = totalTrialCount > 0 ? Math.round((convertedCount / totalTrialCount) * 100) : 0;

    return c.json({
      success: true,
      data: {
        totalSubscriptions: (totalSubs as { count: number })?.count || 0,
        activeSubscriptions: (activeSubs as { count: number })?.count || 0,
        trialUsers: (trialUsers as { count: number })?.count || 0,
        expiringSoon: (expiringSoon as { count: number })?.count || 0,
        revenueThisMonth: thisMonth,
        revenueLastMonth: lastMonth,
        growthPercent,
        churnRate: 0,
        averageLifetimeValue: 0,
        conversionRate,
      },
    });
  } catch (error) {
    console.error('Admin subscription stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch subscription stats' }, 500);
  }
});

// Admin: Get subscriptions list
protectedApp.get('/admin/subscriptions/list', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    // Get subscriptions from payment_transactions
    const { results } = await c.env.DB.prepare(`
      SELECT
        pt.id,
        pt.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        pt.plan_type as planId,
        st.name as planName,
        pt.created_at as startDate,
        pt.billing_cycle as billingCycle,
        pt.amount,
        pt.status as paymentStatus,
        CASE
          WHEN pt.billing_cycle = 'monthly' AND pt.created_at >= date('now', '-30 days') THEN 'active'
          WHEN pt.billing_cycle = 'yearly' AND pt.created_at >= date('now', '-365 days') THEN 'active'
          ELSE 'expired'
        END as status
      FROM payment_transactions pt
      JOIN users u ON pt.user_id = u.id
      LEFT JOIN subscription_tiers st ON pt.plan_type = st.id
      WHERE pt.status = 'success'
      ORDER BY pt.created_at DESC
      LIMIT 100
    `).all();

    const subscriptions = results.map((r: Record<string, unknown>) => {
      // Calculate end date based on billing cycle
      const startDate = new Date(r.startDate as string);
      const endDate = new Date(startDate);
      if (r.billingCycle === 'yearly') {
        endDate.setFullYear(endDate.getFullYear() + 1);
      } else {
        endDate.setMonth(endDate.getMonth() + 1);
      }

      return {
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        planId: r.planId,
        planName: r.planName || 'Premium',
        status: r.status,
        billingCycle: r.billingCycle || 'monthly',
        amount: r.amount || 50,
        startDate: r.startDate,
        endDate: endDate.toISOString(),
        autoRenew: true,
      };
    });

    return c.json({ success: true, data: subscriptions });
  } catch (error) {
    console.error('Admin subscriptions list error:', error);
    return c.json({ success: false, error: 'Failed to fetch subscriptions' }, 500);
  }
});

// Admin: Get trials list
protectedApp.get('/admin/subscriptions/trials', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        ut.id,
        ut.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        ut.started_at as startedAt,
        ut.expires_at as expiresAt,
        ut.status,
        ut.tasks_completed as tasksCompleted
      FROM user_trials ut
      JOIN users u ON ut.user_id = u.id
      ORDER BY ut.started_at DESC
      LIMIT 100
    `).all();

    const trials = results.map((r: Record<string, unknown>) => {
      const expiresAt = new Date(r.expiresAt as string);
      const now = new Date();
      const daysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
      const tasksCompleted = JSON.parse((r.tasksCompleted as string) || '[]');

      return {
        id: r.id,
        userId: r.userId,
        userName: r.userName,
        userEmail: r.userEmail,
        startedAt: r.startedAt,
        expiresAt: r.expiresAt,
        daysRemaining,
        tasksCompleted: tasksCompleted.length,
        status: r.status,
      };
    });

    return c.json({ success: true, data: trials });
  } catch (error) {
    console.error('Admin trials list error:', error);
    return c.json({ success: false, error: 'Failed to fetch trials' }, 500);
  }
});

// =============================================
// ADMIN AFFILIATE MANAGEMENT ENDPOINTS
// =============================================

// Admin: Get affiliate statistics
protectedApp.get('/admin/affiliates/stats', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const totalAffiliates = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM affiliate_profiles
    `).first();

    const activeAffiliates = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM affiliate_profiles WHERE is_active = 1
    `).first();

    const totalReferrals = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM affiliate_referrals
    `).first();

    const conversions = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM affiliate_referrals WHERE status = 'converted'
    `).first();

    const totalEarnings = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(total_earnings), 0) as total FROM affiliate_profiles
    `).first();

    const pendingPayouts = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_payouts WHERE status = 'pending'
    `).first();

    const earningsThisMonth = await c.env.DB.prepare(`
      SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_commissions
      WHERE created_at >= date('now', 'start of month')
    `).first();

    const refs = (totalReferrals as { count: number })?.count || 0;
    const convs = (conversions as { count: number })?.count || 0;
    const conversionRate = refs > 0 ? Math.round((convs / refs) * 100) : 0;

    return c.json({
      success: true,
      data: {
        totalAffiliates: (totalAffiliates as { count: number })?.count || 0,
        activeAffiliates: (activeAffiliates as { count: number })?.count || 0,
        totalReferrals: refs,
        successfulConversions: convs,
        conversionRate,
        totalEarnings: (totalEarnings as { total: number })?.total || 0,
        pendingPayouts: (pendingPayouts as { total: number })?.total || 0,
        earningsThisMonth: (earningsThisMonth as { total: number })?.total || 0,
      },
    });
  } catch (error) {
    console.error('Admin affiliate stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch affiliate stats' }, 500);
  }
});

// Admin: Get affiliates list
protectedApp.get('/admin/affiliates/list', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        ap.id,
        ap.user_id as userId,
        u.name as userName,
        u.email as userEmail,
        ap.referral_code as referralCode,
        ap.tier_id as tierId,
        at.name as tierName,
        at.badge_color as tierColor,
        ap.total_referrals as totalReferrals,
        ap.successful_conversions as successfulConversions,
        ap.total_earnings as totalEarnings,
        ap.pending_earnings as pendingEarnings,
        ap.available_earnings as availableEarnings,
        ap.is_active as isActive,
        ap.joined_at as joinedAt
      FROM affiliate_profiles ap
      JOIN users u ON ap.user_id = u.id
      LEFT JOIN affiliate_tiers at ON ap.tier_id = at.id
      ORDER BY ap.successful_conversions DESC
      LIMIT 100
    `).all();

    const affiliates = results.map((r: Record<string, unknown>) => ({
      id: r.id,
      userId: r.userId,
      userName: r.userName,
      userEmail: r.userEmail,
      referralCode: r.referralCode,
      tier: r.tierName || 'Scout',
      tierColor: r.tierColor || '#6B7280',
      totalReferrals: r.totalReferrals || 0,
      conversions: r.successfulConversions || 0,
      totalEarnings: r.totalEarnings || 0,
      pendingEarnings: r.pendingEarnings || 0,
      status: r.isActive ? 'active' : 'inactive',
      joinedAt: r.joinedAt,
    }));

    return c.json({ success: true, data: affiliates });
  } catch (error) {
    console.error('Admin affiliates list error:', error);
    return c.json({ success: false, error: 'Failed to fetch affiliates' }, 500);
  }
});

// Admin: Get pending payouts
protectedApp.get('/admin/affiliates/payouts', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT
        ap.id,
        ap.affiliate_id as affiliateId,
        u.name as affiliateName,
        u.email as affiliateEmail,
        aff.mobile_money_number as mobileMoneyNumber,
        aff.mobile_money_provider as mobileMoneyProvider,
        ap.amount,
        ap.status,
        ap.requested_at as requestedAt,
        ap.processed_at as processedAt
      FROM affiliate_payouts ap
      JOIN affiliate_profiles aff ON ap.affiliate_id = aff.id
      JOIN users u ON aff.user_id = u.id
      ORDER BY
        CASE ap.status WHEN 'pending' THEN 0 ELSE 1 END,
        ap.requested_at DESC
      LIMIT 100
    `).all();

    const payouts = results.map((r: Record<string, unknown>) => ({
      id: r.id,
      affiliateId: r.affiliateId,
      affiliateName: r.affiliateName,
      affiliateEmail: r.affiliateEmail,
      mobileMoneyNumber: r.mobileMoneyNumber || 'Not set',
      mobileMoneyProvider: r.mobileMoneyProvider || 'MTN',
      amount: r.amount || 0,
      status: r.status || 'pending',
      requestedAt: r.requestedAt,
      processedAt: r.processedAt,
    }));

    return c.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Admin payouts list error:', error);
    return c.json({ success: false, error: 'Failed to fetch payouts' }, 500);
  }
});

// Admin: Approve payout
protectedApp.post('/admin/affiliates/payouts/:id/approve', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  if (user.role !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const payoutId = c.req.param('id');

    // Get payout details
    const payout = await c.env.DB.prepare(`
      SELECT * FROM affiliate_payouts WHERE id = ? AND status = 'pending'
    `).bind(payoutId).first();

    if (!payout) {
      return c.json({ success: false, error: 'Payout not found or already processed' }, 404);
    }

    // Update payout status
    await c.env.DB.prepare(`
      UPDATE affiliate_payouts
      SET status = 'approved', processed_at = datetime('now'), processed_by = ?
      WHERE id = ?
    `).bind(user.userId, payoutId).run();

    // Update affiliate available earnings
    await c.env.DB.prepare(`
      UPDATE affiliate_profiles
      SET available_earnings = available_earnings - ?
      WHERE id = ?
    `).bind(payout.amount, payout.affiliate_id).run();

    // Log audit
    await c.env.DB.prepare(`
      INSERT INTO audit_log (id, user_id, action, action_category, target_type, target_id, status, created_at)
      VALUES (?, ?, 'approve_payout', 'financial', 'affiliate_payout', ?, 'success', datetime('now'))
    `).bind(crypto.randomUUID(), user.userId, payoutId).run();

    return c.json({ success: true, message: 'Payout approved successfully' });
  } catch (error) {
    console.error('Approve payout error:', error);
    return c.json({ success: false, error: 'Failed to approve payout' }, 500);
  }
});

// =============================================
// TEACHER ASSESSMENT SYSTEM ENDPOINTS
// =============================================

// ========== CLASS MANAGEMENT ==========

// Get teacher's classes
protectedApp.get('/classes', async (c) => {
  try {
    const userId = getUserId(c);

    const classes = await c.env.DB.prepare(`
      SELECT c.*,
        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND is_active = 1) as member_count,
        s.name as subject_name
      FROM classes c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.teacher_id = ? AND c.is_active = 1
      ORDER BY c.created_at DESC
    `).bind(userId).all();

    return c.json({
      success: true,
      data: classes.results.map((cls: Record<string, unknown>) => ({
        id: cls.id,
        teacherId: cls.teacher_id,
        name: cls.name,
        description: cls.description,
        schoolLevel: cls.school_level,
        yearGroup: cls.year_group,
        subjectId: cls.subject_id,
        academicYear: cls.academic_year,
        isActive: cls.is_active === 1,
        color: cls.color,
        createdAt: cls.created_at,
        updatedAt: cls.updated_at,
        memberCount: cls.member_count,
        subject: cls.subject_name ? { id: cls.subject_id, name: cls.subject_name } : undefined,
      })),
    });
  } catch (error) {
    console.error('Error fetching classes:', error);
    return c.json({ success: false, error: 'Failed to fetch classes' }, 500);
  }
});

// Create a class
protectedApp.post('/classes', async (c) => {
  try {
    const userId = getUserId(c);
    const { name, description, schoolLevel, yearGroup, subjectId, academicYear, color } = await c.req.json();

    if (!name?.trim()) {
      return c.json({ success: false, error: 'Class name is required' }, 400);
    }

    const id = `class_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO classes (id, teacher_id, name, description, school_level, year_group, subject_id, academic_year, color)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(id, userId, name.trim(), description || null, schoolLevel || null, yearGroup || null, subjectId || null, academicYear || null, color || '#3B82F6').run();

    return c.json({
      success: true,
      data: {
        id,
        teacherId: userId,
        name: name.trim(),
        description,
        schoolLevel,
        yearGroup,
        subjectId,
        academicYear,
        color: color || '#3B82F6',
        isActive: true,
        memberCount: 0,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating class:', error);
    return c.json({ success: false, error: 'Failed to create class' }, 500);
  }
});

// Get class details with members
protectedApp.get('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const userId = getUserId(c);

    const classData = await c.env.DB.prepare(`
      SELECT c.*, s.name as subject_name
      FROM classes c
      LEFT JOIN subjects s ON c.subject_id = s.id
      WHERE c.id = ? AND c.teacher_id = ?
    `).bind(classId, userId).first();

    if (!classData) {
      return c.json({ success: false, error: 'Class not found' }, 404);
    }

    const members = await c.env.DB.prepare(`
      SELECT cm.*, u.name, u.email, u.avatar_url, u.year_group, u.school_level
      FROM class_members cm
      JOIN users u ON cm.student_id = u.id
      WHERE cm.class_id = ? AND cm.is_active = 1
      ORDER BY u.name
    `).bind(classId).all();

    return c.json({
      success: true,
      data: {
        id: classData.id,
        teacherId: classData.teacher_id,
        name: classData.name,
        description: classData.description,
        schoolLevel: classData.school_level,
        yearGroup: classData.year_group,
        subjectId: classData.subject_id,
        academicYear: classData.academic_year,
        isActive: classData.is_active === 1,
        color: classData.color,
        createdAt: classData.created_at,
        updatedAt: classData.updated_at,
        subject: classData.subject_name ? { id: classData.subject_id, name: classData.subject_name } : undefined,
        memberCount: members.results.length,
        members: members.results.map((m: Record<string, unknown>) => ({
          id: m.id,
          classId: m.class_id,
          studentId: m.student_id,
          joinedAt: m.joined_at,
          isActive: m.is_active === 1,
          student: {
            id: m.student_id,
            name: m.name,
            email: m.email,
            avatarUrl: m.avatar_url,
            yearGroup: m.year_group,
            schoolLevel: m.school_level,
          },
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching class:', error);
    return c.json({ success: false, error: 'Failed to fetch class' }, 500);
  }
});

// Update class
protectedApp.put('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const userId = getUserId(c);
    const updates = await c.req.json();

    const existing = await c.env.DB.prepare(`
      SELECT id FROM classes WHERE id = ? AND teacher_id = ?
    `).bind(classId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Class not found' }, 404);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    if (updates.name !== undefined) { fields.push('name = ?'); values.push(updates.name); }
    if (updates.description !== undefined) { fields.push('description = ?'); values.push(updates.description); }
    if (updates.schoolLevel !== undefined) { fields.push('school_level = ?'); values.push(updates.schoolLevel); }
    if (updates.yearGroup !== undefined) { fields.push('year_group = ?'); values.push(updates.yearGroup); }
    if (updates.subjectId !== undefined) { fields.push('subject_id = ?'); values.push(updates.subjectId); }
    if (updates.academicYear !== undefined) { fields.push('academic_year = ?'); values.push(updates.academicYear); }
    if (updates.color !== undefined) { fields.push('color = ?'); values.push(updates.color); }

    fields.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(classId);

    await c.env.DB.prepare(`UPDATE classes SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating class:', error);
    return c.json({ success: false, error: 'Failed to update class' }, 500);
  }
});

// Delete class
protectedApp.delete('/classes/:id', async (c) => {
  try {
    const classId = c.req.param('id');
    const userId = getUserId(c);

    await c.env.DB.prepare(`
      UPDATE classes SET is_active = 0 WHERE id = ? AND teacher_id = ?
    `).bind(classId, userId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting class:', error);
    return c.json({ success: false, error: 'Failed to delete class' }, 500);
  }
});

// Add members to class
protectedApp.post('/classes/:id/members', async (c) => {
  try {
    const classId = c.req.param('id');
    const userId = getUserId(c);
    const { studentIds } = await c.req.json();

    if (!studentIds || !Array.isArray(studentIds) || studentIds.length === 0) {
      return c.json({ success: false, error: 'Student IDs are required' }, 400);
    }

    // Verify class belongs to teacher
    const classData = await c.env.DB.prepare(`
      SELECT id FROM classes WHERE id = ? AND teacher_id = ?
    `).bind(classId, userId).first();

    if (!classData) {
      return c.json({ success: false, error: 'Class not found' }, 404);
    }

    // Add members
    const added: string[] = [];
    for (const studentId of studentIds) {
      try {
        const id = `member_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO class_members (id, class_id, student_id)
          VALUES (?, ?, ?)
        `).bind(id, classId, studentId).run();
        added.push(studentId);
      } catch {
        // Skip duplicates
      }
    }

    return c.json({ success: true, data: { added } });
  } catch (error) {
    console.error('Error adding members:', error);
    return c.json({ success: false, error: 'Failed to add members' }, 500);
  }
});

// Remove member from class
protectedApp.delete('/classes/:classId/members/:memberId', async (c) => {
  try {
    const { classId, memberId } = c.req.param();
    const userId = getUserId(c);

    // Verify class belongs to teacher
    const classData = await c.env.DB.prepare(`
      SELECT id FROM classes WHERE id = ? AND teacher_id = ?
    `).bind(classId, userId).first();

    if (!classData) {
      return c.json({ success: false, error: 'Class not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE class_members SET is_active = 0 WHERE id = ? AND class_id = ?
    `).bind(memberId, classId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing member:', error);
    return c.json({ success: false, error: 'Failed to remove member' }, 500);
  }
});

// ========== ASSESSMENTS ==========

// Get teacher's assessments
protectedApp.get('/assessments', async (c) => {
  try {
    const userId = getUserId(c);
    const status = c.req.query('status');
    const type = c.req.query('type');
    const subjectId = c.req.query('subjectId');
    const search = c.req.query('search');

    let query = `
      SELECT a.*,
        s.name as subject_name,
        s.color as subject_color,
        (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count,
        (SELECT COUNT(*) FROM assessment_attempts WHERE assessment_id = a.id) as attempt_count,
        (SELECT AVG(percentage) FROM assessment_attempts WHERE assessment_id = a.id AND status = 'graded') as avg_score,
        (SELECT COUNT(*) FROM assessment_attempts WHERE assessment_id = a.id AND grading_status = 'pending') as pending_grading
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.teacher_id = ?
    `;
    const params: unknown[] = [userId];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }
    if (type) {
      query += ' AND a.assessment_type = ?';
      params.push(type);
    }
    if (subjectId) {
      query += ' AND a.subject_id = ?';
      params.push(subjectId);
    }
    if (search) {
      query += ' AND a.title LIKE ?';
      params.push(`%${search}%`);
    }

    query += ' ORDER BY a.created_at DESC';

    const assessments = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: assessments.results.map((a: Record<string, unknown>) => ({
        id: a.id,
        teacherId: a.teacher_id,
        title: a.title,
        description: a.description,
        instructions: a.instructions,
        assessmentType: a.assessment_type,
        status: a.status,
        subjectId: a.subject_id,
        topicIds: a.topic_ids ? JSON.parse(a.topic_ids as string) : [],
        timeLimit: a.time_limit,
        startDate: a.start_date,
        endDate: a.end_date,
        lateSubmissionAllowed: a.late_submission_allowed === 1,
        latePenaltyPercent: a.late_penalty_percent,
        totalMarks: a.total_marks,
        passingScore: a.passing_score,
        showCorrectAnswers: a.show_correct_answers === 1,
        showScoreImmediately: a.show_score_immediately === 1,
        shuffleQuestions: a.shuffle_questions === 1,
        shuffleOptions: a.shuffle_options === 1,
        oneQuestionPerPage: a.one_question_per_page === 1,
        allowReview: a.allow_review === 1,
        maxAttempts: a.max_attempts,
        createdAt: a.created_at,
        updatedAt: a.updated_at,
        publishedAt: a.published_at,
        questionCount: a.question_count,
        attemptCount: a.attempt_count,
        averageScore: a.avg_score,
        pendingGradingCount: a.pending_grading,
        subject: a.subject_name ? { id: a.subject_id, name: a.subject_name, color: a.subject_color } : undefined,
      })),
    });
  } catch (error) {
    console.error('Error fetching assessments:', error);
    return c.json({ success: false, error: 'Failed to fetch assessments' }, 500);
  }
});

// Create assessment
protectedApp.post('/assessments', async (c) => {
  try {
    const userId = getUserId(c);
    const data = await c.req.json();

    const id = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO assessments (
        id, teacher_id, title, description, instructions, assessment_type, status,
        subject_id, topic_ids, time_limit, start_date, end_date,
        late_submission_allowed, late_penalty_percent, total_marks, passing_score,
        show_correct_answers, show_score_immediately, shuffle_questions, shuffle_options,
        one_question_per_page, allow_review, max_attempts
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      id, userId, data.title, data.description || null, data.instructions || null, data.assessmentType,
      data.subjectId || null, data.topicIds ? JSON.stringify(data.topicIds) : null,
      data.timeLimit || null, data.startDate || null, data.endDate || null,
      data.lateSubmissionAllowed ? 1 : 0, data.latePenaltyPercent || 0,
      0, data.passingScore || null,
      data.showCorrectAnswers !== false ? 1 : 0, data.showScoreImmediately !== false ? 1 : 0,
      data.shuffleQuestions ? 1 : 0, data.shuffleOptions ? 1 : 0,
      data.oneQuestionPerPage ? 1 : 0, data.allowReview !== false ? 1 : 0,
      data.maxAttempts || 1
    ).run();

    // Add questions if provided
    let totalMarks = 0;
    if (data.questions && Array.isArray(data.questions)) {
      for (let i = 0; i < data.questions.length; i++) {
        const q = data.questions[i];
        const qId = `aq_${Date.now()}_${i}_${Math.random().toString(36).substr(2, 6)}`;
        totalMarks += q.marks || 1;

        await c.env.DB.prepare(`
          INSERT INTO assessment_questions (
            id, assessment_id, question_id, custom_question_text, custom_question_type,
            custom_options, custom_correct_answer, custom_explanation, marks, display_order
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `).bind(
          qId, id, q.questionId || null,
          q.customData?.questionText || null, q.customData?.questionType || null,
          q.customData?.options ? JSON.stringify(q.customData.options) : null,
          q.customData?.correctAnswer || null, q.customData?.explanation || null,
          q.marks || 1, i
        ).run();
      }

      // Update total marks
      await c.env.DB.prepare(`UPDATE assessments SET total_marks = ? WHERE id = ?`).bind(totalMarks, id).run();
    }

    return c.json({
      success: true,
      data: {
        id,
        teacherId: userId,
        title: data.title,
        assessmentType: data.assessmentType,
        status: 'draft',
        totalMarks,
        createdAt: new Date().toISOString(),
      },
    });
  } catch (error) {
    console.error('Error creating assessment:', error);
    return c.json({ success: false, error: 'Failed to create assessment' }, 500);
  }
});

// Get assessment details
protectedApp.get('/assessments/:id', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);

    const assessment = await c.env.DB.prepare(`
      SELECT a.*, s.name as subject_name
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      WHERE a.id = ? AND a.teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!assessment) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    // Get questions
    const questions = await c.env.DB.prepare(`
      SELECT aq.*, q.question_text, q.question_type, q.options, q.correct_answer, q.explanation
      FROM assessment_questions aq
      LEFT JOIN questions q ON aq.question_id = q.id
      WHERE aq.assessment_id = ?
      ORDER BY aq.display_order
    `).bind(assessmentId).all();

    // Get assignments
    const assignments = await c.env.DB.prepare(`
      SELECT aa.*, u.name as student_name, u.email as student_email, c.name as class_name,
        (SELECT COUNT(*) FROM class_members WHERE class_id = c.id AND is_active = 1) as class_member_count
      FROM assessment_assignments aa
      LEFT JOIN users u ON aa.student_id = u.id
      LEFT JOIN classes c ON aa.class_id = c.id
      WHERE aa.assessment_id = ?
    `).bind(assessmentId).all();

    return c.json({
      success: true,
      data: {
        id: assessment.id,
        teacherId: assessment.teacher_id,
        title: assessment.title,
        description: assessment.description,
        instructions: assessment.instructions,
        assessmentType: assessment.assessment_type,
        status: assessment.status,
        subjectId: assessment.subject_id,
        topicIds: assessment.topic_ids ? JSON.parse(assessment.topic_ids as string) : [],
        timeLimit: assessment.time_limit,
        startDate: assessment.start_date,
        endDate: assessment.end_date,
        lateSubmissionAllowed: assessment.late_submission_allowed === 1,
        latePenaltyPercent: assessment.late_penalty_percent,
        totalMarks: assessment.total_marks,
        passingScore: assessment.passing_score,
        showCorrectAnswers: assessment.show_correct_answers === 1,
        showScoreImmediately: assessment.show_score_immediately === 1,
        shuffleQuestions: assessment.shuffle_questions === 1,
        shuffleOptions: assessment.shuffle_options === 1,
        oneQuestionPerPage: assessment.one_question_per_page === 1,
        allowReview: assessment.allow_review === 1,
        maxAttempts: assessment.max_attempts,
        createdAt: assessment.created_at,
        updatedAt: assessment.updated_at,
        publishedAt: assessment.published_at,
        subject: assessment.subject_name ? { id: assessment.subject_id, name: assessment.subject_name } : undefined,
        questions: questions.results.map((q: Record<string, unknown>) => ({
          id: q.id,
          assessmentId: q.assessment_id,
          questionId: q.question_id,
          customQuestionText: q.custom_question_text,
          customQuestionType: q.custom_question_type,
          customOptions: q.custom_options ? JSON.parse(q.custom_options as string) : null,
          customCorrectAnswer: q.custom_correct_answer,
          customExplanation: q.custom_explanation,
          marks: q.marks,
          displayOrder: q.display_order,
          isRequired: q.is_required === 1,
          question: q.question_id ? {
            id: q.question_id,
            questionText: q.question_text,
            questionType: q.question_type,
            options: q.options ? JSON.parse(q.options as string) : null,
            correctAnswer: q.correct_answer,
            explanation: q.explanation,
          } : undefined,
        })),
        assignments: assignments.results.map((a: Record<string, unknown>) => ({
          id: a.id,
          assessmentId: a.assessment_id,
          assignmentType: a.assignment_type,
          studentId: a.student_id,
          classId: a.class_id,
          schoolLevel: a.school_level,
          yearGroup: a.year_group,
          assignedAt: a.assigned_at,
          student: a.student_id ? { id: a.student_id, name: a.student_name, email: a.student_email } : undefined,
          class: a.class_id ? { id: a.class_id, name: a.class_name, memberCount: a.class_member_count } : undefined,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching assessment:', error);
    return c.json({ success: false, error: 'Failed to fetch assessment' }, 500);
  }
});

// Update assessment
protectedApp.put('/assessments/:id', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);
    const updates = await c.req.json();

    const existing = await c.env.DB.prepare(`
      SELECT id, status FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    const fields: string[] = [];
    const values: unknown[] = [];

    const allowedFields = ['title', 'description', 'instructions', 'assessmentType', 'subjectId',
      'timeLimit', 'startDate', 'endDate', 'lateSubmissionAllowed', 'latePenaltyPercent',
      'passingScore', 'showCorrectAnswers', 'showScoreImmediately', 'shuffleQuestions',
      'shuffleOptions', 'oneQuestionPerPage', 'allowReview', 'maxAttempts'];

    const fieldMap: Record<string, string> = {
      assessmentType: 'assessment_type',
      subjectId: 'subject_id',
      timeLimit: 'time_limit',
      startDate: 'start_date',
      endDate: 'end_date',
      lateSubmissionAllowed: 'late_submission_allowed',
      latePenaltyPercent: 'late_penalty_percent',
      passingScore: 'passing_score',
      showCorrectAnswers: 'show_correct_answers',
      showScoreImmediately: 'show_score_immediately',
      shuffleQuestions: 'shuffle_questions',
      shuffleOptions: 'shuffle_options',
      oneQuestionPerPage: 'one_question_per_page',
      allowReview: 'allow_review',
      maxAttempts: 'max_attempts',
    };

    for (const key of allowedFields) {
      if (updates[key] !== undefined) {
        const dbField = fieldMap[key] || key;
        fields.push(`${dbField} = ?`);
        if (typeof updates[key] === 'boolean') {
          values.push(updates[key] ? 1 : 0);
        } else {
          values.push(updates[key]);
        }
      }
    }

    if (fields.length > 0) {
      fields.push('updated_at = ?');
      values.push(new Date().toISOString());
      values.push(assessmentId);

      await c.env.DB.prepare(`UPDATE assessments SET ${fields.join(', ')} WHERE id = ?`).bind(...values).run();
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error updating assessment:', error);
    return c.json({ success: false, error: 'Failed to update assessment' }, 500);
  }
});

// Delete assessment (draft only)
protectedApp.delete('/assessments/:id', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);

    const existing = await c.env.DB.prepare(`
      SELECT status FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    if (existing.status !== 'draft') {
      return c.json({ success: false, error: 'Only draft assessments can be deleted' }, 400);
    }

    // Delete questions first
    await c.env.DB.prepare(`DELETE FROM assessment_questions WHERE assessment_id = ?`).bind(assessmentId).run();
    // Delete assignments
    await c.env.DB.prepare(`DELETE FROM assessment_assignments WHERE assessment_id = ?`).bind(assessmentId).run();
    // Delete assessment
    await c.env.DB.prepare(`DELETE FROM assessments WHERE id = ?`).bind(assessmentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error deleting assessment:', error);
    return c.json({ success: false, error: 'Failed to delete assessment' }, 500);
  }
});

// Publish assessment
protectedApp.post('/assessments/:id/publish', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);

    const existing = await c.env.DB.prepare(`
      SELECT id, status FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    // Check has questions
    const questionCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM assessment_questions WHERE assessment_id = ?
    `).bind(assessmentId).first();

    if (!questionCount || (questionCount.count as number) === 0) {
      return c.json({ success: false, error: 'Assessment must have at least one question' }, 400);
    }

    await c.env.DB.prepare(`
      UPDATE assessments SET status = 'published', published_at = ?, updated_at = ?
      WHERE id = ?
    `).bind(new Date().toISOString(), new Date().toISOString(), assessmentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error publishing assessment:', error);
    return c.json({ success: false, error: 'Failed to publish assessment' }, 500);
  }
});

// Duplicate assessment
protectedApp.post('/assessments/:id/duplicate', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);

    const original = await c.env.DB.prepare(`
      SELECT * FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!original) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    const newId = `assess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO assessments (
        id, teacher_id, title, description, instructions, assessment_type, status,
        subject_id, topic_ids, time_limit, start_date, end_date,
        late_submission_allowed, late_penalty_percent, total_marks, passing_score,
        show_correct_answers, show_score_immediately, shuffle_questions, shuffle_options,
        one_question_per_page, allow_review, max_attempts
      ) VALUES (?, ?, ?, ?, ?, ?, 'draft', ?, ?, ?, NULL, NULL, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(
      newId, userId, `${original.title} (Copy)`, original.description, original.instructions,
      original.assessment_type, original.subject_id, original.topic_ids, original.time_limit,
      original.late_submission_allowed, original.late_penalty_percent, original.total_marks,
      original.passing_score, original.show_correct_answers, original.show_score_immediately,
      original.shuffle_questions, original.shuffle_options, original.one_question_per_page,
      original.allow_review, original.max_attempts
    ).run();

    // Copy questions
    const questions = await c.env.DB.prepare(`
      SELECT * FROM assessment_questions WHERE assessment_id = ? ORDER BY display_order
    `).bind(assessmentId).all();

    for (const q of questions.results) {
      const qId = `aq_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      await c.env.DB.prepare(`
        INSERT INTO assessment_questions (
          id, assessment_id, question_id, custom_question_text, custom_question_type,
          custom_options, custom_correct_answer, custom_explanation, marks, display_order, is_required
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        qId, newId, (q as Record<string, unknown>).question_id, (q as Record<string, unknown>).custom_question_text,
        (q as Record<string, unknown>).custom_question_type, (q as Record<string, unknown>).custom_options,
        (q as Record<string, unknown>).custom_correct_answer, (q as Record<string, unknown>).custom_explanation,
        (q as Record<string, unknown>).marks, (q as Record<string, unknown>).display_order, (q as Record<string, unknown>).is_required
      ).run();
    }

    return c.json({
      success: true,
      data: { id: newId, title: `${original.title} (Copy)`, status: 'draft' },
    });
  } catch (error) {
    console.error('Error duplicating assessment:', error);
    return c.json({ success: false, error: 'Failed to duplicate assessment' }, 500);
  }
});

// Add questions to assessment
protectedApp.post('/assessments/:id/questions', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);
    const { questions } = await c.req.json();

    const existing = await c.env.DB.prepare(`
      SELECT id FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    // Get current max order
    const maxOrder = await c.env.DB.prepare(`
      SELECT MAX(display_order) as max_order FROM assessment_questions WHERE assessment_id = ?
    `).bind(assessmentId).first();

    let order = ((maxOrder?.max_order as number) || -1) + 1;
    let totalNewMarks = 0;

    for (const q of questions) {
      const qId = `aq_${Date.now()}_${order}_${Math.random().toString(36).substr(2, 6)}`;
      totalNewMarks += q.marks || 1;

      await c.env.DB.prepare(`
        INSERT INTO assessment_questions (
          id, assessment_id, question_id, custom_question_text, custom_question_type,
          custom_options, custom_correct_answer, custom_explanation, marks, display_order
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        qId, assessmentId, q.questionId || null,
        q.customData?.questionText || null, q.customData?.questionType || null,
        q.customData?.options ? JSON.stringify(q.customData.options) : null,
        q.customData?.correctAnswer || null, q.customData?.explanation || null,
        q.marks || 1, order++
      ).run();
    }

    // Update total marks
    await c.env.DB.prepare(`
      UPDATE assessments SET total_marks = total_marks + ?, updated_at = ? WHERE id = ?
    `).bind(totalNewMarks, new Date().toISOString(), assessmentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error adding questions:', error);
    return c.json({ success: false, error: 'Failed to add questions' }, 500);
  }
});

// Remove question from assessment
protectedApp.delete('/assessments/:assessmentId/questions/:questionId', async (c) => {
  try {
    const { assessmentId, questionId } = c.req.param();
    const userId = getUserId(c);

    const existing = await c.env.DB.prepare(`
      SELECT id FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    // Get question marks to subtract
    const question = await c.env.DB.prepare(`
      SELECT marks FROM assessment_questions WHERE id = ? AND assessment_id = ?
    `).bind(questionId, assessmentId).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    await c.env.DB.prepare(`
      DELETE FROM assessment_questions WHERE id = ? AND assessment_id = ?
    `).bind(questionId, assessmentId).run();

    // Update total marks
    await c.env.DB.prepare(`
      UPDATE assessments SET total_marks = total_marks - ?, updated_at = ? WHERE id = ?
    `).bind(question.marks, new Date().toISOString(), assessmentId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error removing question:', error);
    return c.json({ success: false, error: 'Failed to remove question' }, 500);
  }
});

// Assign assessment
protectedApp.post('/assessments/:id/assign', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);
    const { assignments } = await c.req.json();

    const existing = await c.env.DB.prepare(`
      SELECT id FROM assessments WHERE id = ? AND teacher_id = ?
    `).bind(assessmentId, userId).first();

    if (!existing) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    for (const assignment of assignments) {
      if (assignment.type === 'individual' && assignment.studentIds) {
        for (const studentId of assignment.studentIds) {
          const id = `aa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO assessment_assignments (id, assessment_id, assignment_type, student_id, assigned_by)
            VALUES (?, ?, 'individual', ?, ?)
          `).bind(id, assessmentId, studentId, userId).run();
        }
      } else if (assignment.type === 'class' && assignment.classIds) {
        for (const classId of assignment.classIds) {
          const id = `aa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
          await c.env.DB.prepare(`
            INSERT OR IGNORE INTO assessment_assignments (id, assessment_id, assignment_type, class_id, assigned_by)
            VALUES (?, ?, 'class', ?, ?)
          `).bind(id, assessmentId, classId, userId).run();
        }
      } else if (assignment.type === 'school_level') {
        const id = `aa_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
        await c.env.DB.prepare(`
          INSERT OR IGNORE INTO assessment_assignments (id, assessment_id, assignment_type, school_level, year_group, assigned_by)
          VALUES (?, ?, 'school_level', ?, ?, ?)
        `).bind(id, assessmentId, assignment.schoolLevel, assignment.yearGroup || null, userId).run();
      }
    }

    return c.json({ success: true });
  } catch (error) {
    console.error('Error assigning assessment:', error);
    return c.json({ success: false, error: 'Failed to assign assessment' }, 500);
  }
});

// ========== STUDENT ASSESSMENT ENDPOINTS ==========

// Get assigned assessments for student
protectedApp.get('/student/assessments', async (c) => {
  try {
    const userId = getUserId(c);

    // Get user info for school level matching
    const user = await c.env.DB.prepare(`
      SELECT school_level, year_group FROM users WHERE id = ?
    `).bind(userId).first();

    // Get assessments assigned to student (individual, class, or school level)
    const assessments = await c.env.DB.prepare(`
      SELECT DISTINCT a.*, s.name as subject_name, s.color as subject_color,
        (SELECT COUNT(*) FROM assessment_questions WHERE assessment_id = a.id) as question_count,
        (SELECT id FROM assessment_attempts WHERE assessment_id = a.id AND student_id = ? AND status = 'in_progress' LIMIT 1) as in_progress_attempt,
        (SELECT MAX(attempt_number) FROM assessment_attempts WHERE assessment_id = a.id AND student_id = ?) as attempts_made,
        (SELECT percentage FROM assessment_attempts WHERE assessment_id = a.id AND student_id = ? AND status = 'graded' ORDER BY attempt_number DESC LIMIT 1) as last_score
      FROM assessments a
      LEFT JOIN subjects s ON a.subject_id = s.id
      LEFT JOIN assessment_assignments aa ON aa.assessment_id = a.id
      LEFT JOIN class_members cm ON cm.class_id = aa.class_id AND cm.student_id = ?
      WHERE a.status = 'published'
        AND (
          aa.student_id = ?
          OR cm.student_id = ?
          OR (aa.assignment_type = 'school_level' AND aa.school_level = ? AND (aa.year_group IS NULL OR aa.year_group = ?))
        )
      ORDER BY a.end_date ASC, a.created_at DESC
    `).bind(userId, userId, userId, userId, userId, userId, user?.school_level, user?.year_group).all();

    const pending: Record<string, unknown>[] = [];
    const completed: Record<string, unknown>[] = [];

    for (const a of assessments.results) {
      const assessment = {
        id: a.id,
        title: a.title,
        description: a.description,
        assessmentType: a.assessment_type,
        subjectId: a.subject_id,
        timeLimit: a.time_limit,
        startDate: a.start_date,
        endDate: a.end_date,
        totalMarks: a.total_marks,
        maxAttempts: a.max_attempts,
        questionCount: a.question_count,
        inProgressAttempt: a.in_progress_attempt,
        attemptsMade: a.attempts_made || 0,
        lastScore: a.last_score,
        subject: a.subject_name ? { id: a.subject_id, name: a.subject_name, color: a.subject_color } : undefined,
      };

      const attemptsMade = (a.attempts_made as number) || 0;
      const maxAttempts = (a.max_attempts as number) || 1;
      const hasCompleted = attemptsMade >= maxAttempts && !a.in_progress_attempt;

      if (hasCompleted) {
        completed.push(assessment);
      } else {
        pending.push(assessment);
      }
    }

    return c.json({
      success: true,
      data: { pending, completed, all: assessments.results },
    });
  } catch (error) {
    console.error('Error fetching student assessments:', error);
    return c.json({ success: false, error: 'Failed to fetch assessments' }, 500);
  }
});

// Start assessment attempt
protectedApp.post('/student/assessments/:id/start', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);

    // Get assessment
    const assessment = await c.env.DB.prepare(`
      SELECT * FROM assessments WHERE id = ? AND status = 'published'
    `).bind(assessmentId).first();

    if (!assessment) {
      return c.json({ success: false, error: 'Assessment not found' }, 404);
    }

    // Check for existing in-progress attempt
    const existingAttempt = await c.env.DB.prepare(`
      SELECT id FROM assessment_attempts WHERE assessment_id = ? AND student_id = ? AND status = 'in_progress'
    `).bind(assessmentId, userId).first();

    if (existingAttempt) {
      return c.json({ success: false, error: 'You have an in-progress attempt. Please resume it.' }, 400);
    }

    // Check max attempts
    const attemptCount = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts WHERE assessment_id = ? AND student_id = ?
    `).bind(assessmentId, userId).first();

    if (assessment.max_attempts && (attemptCount?.count as number) >= (assessment.max_attempts as number)) {
      return c.json({ success: false, error: 'Maximum attempts reached' }, 400);
    }

    // Create attempt
    const attemptId = `attempt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const attemptNumber = ((attemptCount?.count as number) || 0) + 1;

    await c.env.DB.prepare(`
      INSERT INTO assessment_attempts (id, assessment_id, student_id, attempt_number, max_score)
      VALUES (?, ?, ?, ?, ?)
    `).bind(attemptId, assessmentId, userId, attemptNumber, assessment.total_marks).run();

    // Get questions (shuffled if enabled)
    let questionsQuery = `
      SELECT aq.*, q.question_text, q.question_type, q.options, q.correct_answer
      FROM assessment_questions aq
      LEFT JOIN questions q ON aq.question_id = q.id
      WHERE aq.assessment_id = ?
    `;
    questionsQuery += assessment.shuffle_questions === 1 ? ' ORDER BY RANDOM()' : ' ORDER BY aq.display_order';

    const questions = await c.env.DB.prepare(questionsQuery).bind(assessmentId).all();

    return c.json({
      success: true,
      data: {
        attempt: {
          id: attemptId,
          assessmentId,
          studentId: userId,
          attemptNumber,
          status: 'in_progress',
          startedAt: new Date().toISOString(),
          maxScore: assessment.total_marks,
        },
        questions: questions.results.map((q: Record<string, unknown>) => ({
          id: q.id,
          questionText: q.custom_question_text || q.question_text,
          questionType: q.custom_question_type || q.question_type,
          options: q.custom_options ? JSON.parse(q.custom_options as string) : (q.options ? JSON.parse(q.options as string) : null),
          marks: q.marks,
        })),
      },
    });
  } catch (error) {
    console.error('Error starting attempt:', error);
    return c.json({ success: false, error: 'Failed to start assessment' }, 500);
  }
});

// Save answer
protectedApp.put('/student/assessments/:id/answer', async (c) => {
  try {
    const userId = getUserId(c);
    const { attemptId, questionId, answer } = await c.req.json();

    // Verify attempt belongs to user and is in progress
    const attempt = await c.env.DB.prepare(`
      SELECT id FROM assessment_attempts WHERE id = ? AND student_id = ? AND status = 'in_progress'
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or already submitted' }, 404);
    }

    // Upsert answer
    const answerId = `ans_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
    await c.env.DB.prepare(`
      INSERT INTO assessment_attempt_answers (id, attempt_id, assessment_question_id, answer_text)
      VALUES (?, ?, ?, ?)
      ON CONFLICT (attempt_id, assessment_question_id) DO UPDATE SET answer_text = ?, answered_at = datetime('now')
    `).bind(answerId, attemptId, questionId, answer, answer).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error saving answer:', error);
    return c.json({ success: false, error: 'Failed to save answer' }, 500);
  }
});

// Submit assessment
protectedApp.post('/student/assessments/:id/submit', async (c) => {
  try {
    const assessmentId = c.req.param('id');
    const userId = getUserId(c);
    const { attemptId, answers } = await c.req.json();

    // Verify attempt
    const attempt = await c.env.DB.prepare(`
      SELECT aa.*, a.end_date, a.late_submission_allowed, a.late_penalty_percent, a.show_score_immediately
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.id = ? AND aa.student_id = ? AND aa.status = 'in_progress'
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or already submitted' }, 404);
    }

    // Save all answers and auto-grade objectives
    let autoScore = 0;
    const questions = await c.env.DB.prepare(`
      SELECT aq.id, aq.marks, aq.custom_correct_answer, aq.custom_question_type, q.correct_answer, q.question_type
      FROM assessment_questions aq
      LEFT JOIN questions q ON aq.question_id = q.id
      WHERE aq.assessment_id = ?
    `).bind(assessmentId).all();

    for (const q of questions.results) {
      const qData = q as Record<string, unknown>;
      const answer = answers[qData.id as string];
      const correctAnswer = qData.custom_correct_answer || qData.correct_answer;
      const questionType = qData.custom_question_type || qData.question_type;

      // Auto-grade objective questions
      const isObjective = ['multiple_choice', 'true_false', 'direct_answer'].includes(questionType as string);
      let isCorrect = null;
      let marks = 0;

      if (isObjective && answer && correctAnswer) {
        isCorrect = answer.toLowerCase().trim() === (correctAnswer as string).toLowerCase().trim();
        marks = isCorrect ? (qData.marks as number) : 0;
        autoScore += marks;
      }

      // Upsert answer
      const answerId = `ans_${Date.now()}_${Math.random().toString(36).substr(2, 6)}`;
      await c.env.DB.prepare(`
        INSERT INTO assessment_attempt_answers (id, attempt_id, assessment_question_id, answer_text, is_correct, auto_marks)
        VALUES (?, ?, ?, ?, ?, ?)
        ON CONFLICT (attempt_id, assessment_question_id) DO UPDATE SET
          answer_text = ?, is_correct = ?, auto_marks = ?, answered_at = datetime('now')
      `).bind(answerId, attemptId, qData.id, answer || '', isCorrect, marks, answer || '', isCorrect, marks).run();
    }

    // Check if late
    const now = new Date();
    const isLate = attempt.end_date && new Date(attempt.end_date as string) < now;
    let latePenalty = 0;
    if (isLate && attempt.late_penalty_percent) {
      latePenalty = Math.floor(autoScore * ((attempt.late_penalty_percent as number) / 100));
    }

    // Check if needs manual grading
    const needsManualGrading = questions.results.some((q: Record<string, unknown>) => {
      const type = q.custom_question_type || q.question_type;
      return ['essay', 'short_answer'].includes(type as string);
    });

    const totalScore = autoScore - latePenalty;
    const percentage = attempt.max_score ? Math.round((totalScore / (attempt.max_score as number)) * 100) : 0;

    // Update attempt
    await c.env.DB.prepare(`
      UPDATE assessment_attempts SET
        status = ?,
        submitted_at = ?,
        time_taken = (strftime('%s', 'now') - strftime('%s', started_at)),
        auto_score = ?,
        total_score = ?,
        percentage = ?,
        is_late = ?,
        late_penalty_applied = ?,
        grading_status = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(
      needsManualGrading ? 'submitted' : 'graded',
      new Date().toISOString(),
      autoScore,
      totalScore,
      percentage,
      isLate ? 1 : 0,
      latePenalty,
      needsManualGrading ? 'pending' : 'complete',
      new Date().toISOString(),
      attemptId
    ).run();

    return c.json({
      success: true,
      data: {
        id: attemptId,
        status: needsManualGrading ? 'submitted' : 'graded',
        autoScore,
        totalScore,
        maxScore: attempt.max_score,
        percentage,
        isLate,
        latePenalty,
        gradingStatus: needsManualGrading ? 'pending' : 'complete',
        showScore: attempt.show_score_immediately === 1,
      },
    });
  } catch (error) {
    console.error('Error submitting assessment:', error);
    return c.json({ success: false, error: 'Failed to submit assessment' }, 500);
  }
});

// Get attempt results
protectedApp.get('/student/attempts/:id', async (c) => {
  try {
    const attemptId = c.req.param('id');
    const userId = getUserId(c);

    const attempt = await c.env.DB.prepare(`
      SELECT aa.*, a.title, a.show_correct_answers, a.show_score_immediately
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.id = ? AND aa.student_id = ?
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    // Get answers with questions
    const answers = await c.env.DB.prepare(`
      SELECT aaa.*, aq.marks, aq.custom_question_text, aq.custom_correct_answer, aq.custom_explanation,
        q.question_text, q.correct_answer, q.explanation
      FROM assessment_attempt_answers aaa
      JOIN assessment_questions aq ON aaa.assessment_question_id = aq.id
      LEFT JOIN questions q ON aq.question_id = q.id
      WHERE aaa.attempt_id = ?
    `).bind(attemptId).all();

    return c.json({
      success: true,
      data: {
        id: attempt.id,
        assessmentId: attempt.assessment_id,
        assessmentTitle: attempt.title,
        attemptNumber: attempt.attempt_number,
        status: attempt.status,
        startedAt: attempt.started_at,
        submittedAt: attempt.submitted_at,
        timeTaken: attempt.time_taken,
        autoScore: attempt.show_score_immediately ? attempt.auto_score : null,
        manualScore: attempt.show_score_immediately ? attempt.manual_score : null,
        totalScore: attempt.show_score_immediately ? attempt.total_score : null,
        maxScore: attempt.max_score,
        percentage: attempt.show_score_immediately ? attempt.percentage : null,
        isLate: attempt.is_late === 1,
        gradingStatus: attempt.grading_status,
        teacherFeedback: attempt.teacher_feedback,
        answers: answers.results.map((a: Record<string, unknown>) => ({
          id: a.id,
          questionId: a.assessment_question_id,
          questionText: a.custom_question_text || a.question_text,
          answerText: a.answer_text,
          isCorrect: a.is_correct,
          autoMarks: a.auto_marks,
          manualMarks: a.manual_marks,
          maxMarks: a.marks,
          teacherComment: a.teacher_comment,
          correctAnswer: attempt.show_correct_answers ? (a.custom_correct_answer || a.correct_answer) : null,
          explanation: attempt.show_correct_answers ? (a.custom_explanation || a.explanation) : null,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching results:', error);
    return c.json({ success: false, error: 'Failed to fetch results' }, 500);
  }
});

// ========== GRADING ENDPOINTS ==========

// Get grading queue
protectedApp.get('/grading', async (c) => {
  try {
    const userId = getUserId(c);
    const assessmentId = c.req.query('assessmentId');
    const status = c.req.query('status');

    let query = `
      SELECT aa.*, a.title as assessment_title, u.name as student_name, u.email as student_email
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      JOIN users u ON aa.student_id = u.id
      WHERE a.teacher_id = ? AND aa.status IN ('submitted', 'graded')
    `;
    const params: unknown[] = [userId];

    if (assessmentId) {
      query += ' AND aa.assessment_id = ?';
      params.push(assessmentId);
    }
    if (status === 'pending') {
      query += ' AND aa.grading_status = ?';
      params.push('pending');
    } else if (status === 'partial') {
      query += ' AND aa.grading_status = ?';
      params.push('partial');
    }

    query += ' ORDER BY aa.submitted_at DESC';

    const attempts = await c.env.DB.prepare(query).bind(...params).all();

    // Get counts
    const counts = await c.env.DB.prepare(`
      SELECT
        SUM(CASE WHEN aa.grading_status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN aa.grading_status = 'partial' THEN 1 ELSE 0 END) as partial_count,
        SUM(CASE WHEN aa.grading_status = 'complete' AND date(aa.graded_at) = date('now') THEN 1 ELSE 0 END) as completed_today
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE a.teacher_id = ? AND aa.status IN ('submitted', 'graded')
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        attempts: attempts.results.map((a: Record<string, unknown>) => ({
          id: a.id,
          assessmentId: a.assessment_id,
          assessmentTitle: a.assessment_title,
          studentId: a.student_id,
          attemptNumber: a.attempt_number,
          status: a.status,
          submittedAt: a.submitted_at,
          autoScore: a.auto_score,
          manualScore: a.manual_score,
          totalScore: a.total_score,
          maxScore: a.max_score,
          percentage: a.percentage,
          gradingStatus: a.grading_status,
          student: { id: a.student_id, name: a.student_name, email: a.student_email },
        })),
        total: attempts.results.length,
        pendingCount: counts?.pending_count || 0,
        partialCount: counts?.partial_count || 0,
        completedTodayCount: counts?.completed_today || 0,
      },
    });
  } catch (error) {
    console.error('Error fetching grading queue:', error);
    return c.json({ success: false, error: 'Failed to fetch grading queue' }, 500);
  }
});

// Get attempt for grading
protectedApp.get('/grading/:attemptId', async (c) => {
  try {
    const attemptId = c.req.param('attemptId');
    const userId = getUserId(c);

    const attempt = await c.env.DB.prepare(`
      SELECT aa.*, a.title, u.name as student_name
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      JOIN users u ON aa.student_id = u.id
      WHERE aa.id = ? AND a.teacher_id = ?
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    const answers = await c.env.DB.prepare(`
      SELECT aaa.*, aq.marks, aq.custom_question_text, aq.custom_question_type,
        aq.custom_correct_answer, q.question_text, q.question_type, q.correct_answer
      FROM assessment_attempt_answers aaa
      JOIN assessment_questions aq ON aaa.assessment_question_id = aq.id
      LEFT JOIN questions q ON aq.question_id = q.id
      WHERE aaa.attempt_id = ?
    `).bind(attemptId).all();

    return c.json({
      success: true,
      data: {
        attempt: {
          id: attempt.id,
          assessmentId: attempt.assessment_id,
          assessmentTitle: attempt.title,
          studentName: attempt.student_name,
          attemptNumber: attempt.attempt_number,
          status: attempt.status,
          submittedAt: attempt.submitted_at,
          autoScore: attempt.auto_score,
          manualScore: attempt.manual_score,
          totalScore: attempt.total_score,
          maxScore: attempt.max_score,
          gradingStatus: attempt.grading_status,
          teacherFeedback: attempt.teacher_feedback,
        },
        answers: answers.results.map((a: Record<string, unknown>) => ({
          id: a.id,
          questionId: a.assessment_question_id,
          questionText: a.custom_question_text || a.question_text,
          questionType: a.custom_question_type || a.question_type,
          correctAnswer: a.custom_correct_answer || a.correct_answer,
          answerText: a.answer_text,
          maxMarks: a.marks,
          isCorrect: a.is_correct,
          autoMarks: a.auto_marks,
          manualMarks: a.manual_marks,
          teacherComment: a.teacher_comment,
        })),
      },
    });
  } catch (error) {
    console.error('Error loading attempt:', error);
    return c.json({ success: false, error: 'Failed to load attempt' }, 500);
  }
});

// Grade single answer
protectedApp.post('/grading/:attemptId/answer/:answerId', async (c) => {
  try {
    const { attemptId, answerId } = c.req.param();
    const userId = getUserId(c);
    const { marks, comment } = await c.req.json();

    // Verify teacher owns the assessment
    const attempt = await c.env.DB.prepare(`
      SELECT aa.id FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.id = ? AND a.teacher_id = ?
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    await c.env.DB.prepare(`
      UPDATE assessment_attempt_answers SET
        manual_marks = ?, teacher_comment = ?, graded_by = ?, graded_at = ?
      WHERE id = ? AND attempt_id = ?
    `).bind(marks, comment || null, userId, new Date().toISOString(), answerId, attemptId).run();

    // Update attempt manual score
    const totalManual = await c.env.DB.prepare(`
      SELECT SUM(COALESCE(manual_marks, 0)) as total FROM assessment_attempt_answers WHERE attempt_id = ?
    `).bind(attemptId).first();

    await c.env.DB.prepare(`
      UPDATE assessment_attempts SET
        manual_score = ?,
        total_score = auto_score + ?,
        grading_status = 'partial',
        updated_at = ?
      WHERE id = ?
    `).bind(totalManual?.total || 0, totalManual?.total || 0, new Date().toISOString(), attemptId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error grading answer:', error);
    return c.json({ success: false, error: 'Failed to grade answer' }, 500);
  }
});

// Complete grading
protectedApp.post('/grading/:attemptId/complete', async (c) => {
  try {
    const attemptId = c.req.param('attemptId');
    const userId = getUserId(c);
    const { feedback } = await c.req.json();

    const attempt = await c.env.DB.prepare(`
      SELECT aa.id, aa.auto_score, aa.max_score FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE aa.id = ? AND a.teacher_id = ?
    `).bind(attemptId, userId).first();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    // Calculate final score
    const totalManual = await c.env.DB.prepare(`
      SELECT SUM(COALESCE(manual_marks, 0)) as total FROM assessment_attempt_answers WHERE attempt_id = ?
    `).bind(attemptId).first();

    const manualScore = (totalManual?.total as number) || 0;
    const totalScore = (attempt.auto_score as number) + manualScore;
    const percentage = attempt.max_score ? Math.round((totalScore / (attempt.max_score as number)) * 100) : 0;

    await c.env.DB.prepare(`
      UPDATE assessment_attempts SET
        status = 'graded',
        manual_score = ?,
        total_score = ?,
        percentage = ?,
        grading_status = 'complete',
        graded_by = ?,
        graded_at = ?,
        teacher_feedback = ?,
        updated_at = ?
      WHERE id = ?
    `).bind(manualScore, totalScore, percentage, userId, new Date().toISOString(), feedback || null, new Date().toISOString(), attemptId).run();

    return c.json({ success: true });
  } catch (error) {
    console.error('Error completing grading:', error);
    return c.json({ success: false, error: 'Failed to complete grading' }, 500);
  }
});

// Teacher dashboard stats
protectedApp.get('/teacher/dashboard', async (c) => {
  try {
    const userId = getUserId(c);

    // Get assessment counts
    const assessmentStats = await c.env.DB.prepare(`
      SELECT
        COUNT(*) as total,
        SUM(CASE WHEN status = 'published' THEN 1 ELSE 0 END) as published,
        SUM(CASE WHEN status = 'draft' THEN 1 ELSE 0 END) as draft
      FROM assessments WHERE teacher_id = ?
    `).bind(userId).first();

    // Get class counts
    const classStats = await c.env.DB.prepare(`
      SELECT COUNT(DISTINCT c.id) as total_classes,
        (SELECT COUNT(DISTINCT cm.student_id) FROM class_members cm
         JOIN classes cl ON cm.class_id = cl.id WHERE cl.teacher_id = ? AND cm.is_active = 1) as total_students
      FROM classes c WHERE c.teacher_id = ? AND c.is_active = 1
    `).bind(userId, userId).first();

    // Get pending grading count
    const pendingGrading = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      WHERE a.teacher_id = ? AND aa.grading_status = 'pending'
    `).bind(userId).first();

    // Get recent submissions
    const recentSubmissions = await c.env.DB.prepare(`
      SELECT aa.*, a.title as assessment_title, u.name as student_name
      FROM assessment_attempts aa
      JOIN assessments a ON aa.assessment_id = a.id
      JOIN users u ON aa.student_id = u.id
      WHERE a.teacher_id = ? AND aa.status IN ('submitted', 'graded')
      ORDER BY aa.submitted_at DESC LIMIT 5
    `).bind(userId).all();

    // Get upcoming deadlines
    const upcomingDeadlines = await c.env.DB.prepare(`
      SELECT id, title, assessment_type, end_date, subject_id
      FROM assessments
      WHERE teacher_id = ? AND status = 'published' AND end_date > datetime('now')
      ORDER BY end_date ASC LIMIT 5
    `).bind(userId).all();

    return c.json({
      success: true,
      data: {
        totalAssessments: assessmentStats?.total || 0,
        publishedAssessments: assessmentStats?.published || 0,
        draftAssessments: assessmentStats?.draft || 0,
        totalClasses: classStats?.total_classes || 0,
        totalStudents: classStats?.total_students || 0,
        pendingGrading: pendingGrading?.count || 0,
        recentSubmissions: recentSubmissions.results.map((s: Record<string, unknown>) => ({
          id: s.id,
          assessmentTitle: s.assessment_title,
          studentName: s.student_name,
          submittedAt: s.submitted_at,
          gradingStatus: s.grading_status,
        })),
        upcomingDeadlines: upcomingDeadlines.results.map((d: Record<string, unknown>) => ({
          id: d.id,
          title: d.title,
          assessmentType: d.assessment_type,
          endDate: d.end_date,
        })),
      },
    });
  } catch (error) {
    console.error('Error fetching dashboard:', error);
    return c.json({ success: false, error: 'Failed to fetch dashboard' }, 500);
  }
});

// Question bank search (for question picker)
protectedApp.get('/questions/bank', async (c) => {
  try {
    const search = c.req.query('search');
    const subjectId = c.req.query('subject');
    const topicId = c.req.query('topic');
    const difficulty = c.req.query('difficulty');
    const questionType = c.req.query('type');
    const limit = parseInt(c.req.query('limit') || '20');
    const offset = parseInt(c.req.query('offset') || '0');

    let query = `
      SELECT q.*, t.name as topic_name, s.name as subject_name
      FROM questions q
      LEFT JOIN topics t ON q.topic_id = t.id
      LEFT JOIN subjects s ON q.subject_id = s.id
      WHERE 1=1
    `;
    const params: unknown[] = [];

    if (search) {
      query += ' AND q.question_text LIKE ?';
      params.push(`%${search}%`);
    }
    if (subjectId) {
      query += ' AND q.subject_id = ?';
      params.push(subjectId);
    }
    if (topicId) {
      query += ' AND q.topic_id = ?';
      params.push(topicId);
    }
    if (difficulty) {
      query += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    if (questionType) {
      query += ' AND q.question_type = ?';
      params.push(questionType);
    }

    // Count total
    const countQuery = query.replace('SELECT q.*, t.name as topic_name, s.name as subject_name', 'SELECT COUNT(*) as count');
    const total = await c.env.DB.prepare(countQuery).bind(...params).first();

    query += ' ORDER BY q.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const questions = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: {
        questions: questions.results.map((q: Record<string, unknown>) => ({
          id: q.id,
          questionText: q.question_text,
          questionType: q.question_type,
          options: q.options ? JSON.parse(q.options as string) : null,
          correctAnswer: q.correct_answer,
          explanation: q.explanation,
          difficulty: q.difficulty,
          points: q.points,
          topicId: q.topic_id,
          topicName: q.topic_name,
          subjectId: q.subject_id,
          subjectName: q.subject_name,
        })),
        total: total?.count || 0,
      },
    });
  } catch (error) {
    console.error('Error searching questions:', error);
    return c.json({ success: false, error: 'Failed to search questions' }, 500);
  }
});

// Search students (for adding to classes)
protectedApp.get('/students/search', async (c) => {
  try {
    const search = c.req.query('search');
    const schoolLevel = c.req.query('schoolLevel');
    const yearGroup = c.req.query('yearGroup');
    const limit = parseInt(c.req.query('limit') || '20');

    let query = `
      SELECT id, name, email, avatar_url, school_level, year_group
      FROM users WHERE role = 'student' AND status = 'approved'
    `;
    const params: unknown[] = [];

    if (search) {
      query += ' AND (name LIKE ? OR email LIKE ?)';
      params.push(`%${search}%`, `%${search}%`);
    }
    if (schoolLevel) {
      query += ' AND school_level = ?';
      params.push(schoolLevel);
    }
    if (yearGroup) {
      query += ' AND year_group = ?';
      params.push(parseInt(yearGroup));
    }

    query += ' ORDER BY name LIMIT ?';
    params.push(limit);

    const students = await c.env.DB.prepare(query).bind(...params).all();

    return c.json({
      success: true,
      data: students.results.map((s: Record<string, unknown>) => ({
        id: s.id,
        name: s.name,
        email: s.email,
        avatarUrl: s.avatar_url,
        schoolLevel: s.school_level,
        yearGroup: s.year_group,
      })),
    });
  } catch (error) {
    console.error('Error searching students:', error);
    return c.json({ success: false, error: 'Failed to search students' }, 500);
  }
});

// Mount Library routes (before protectedApp to allow public file access)
app.route('/api/library', libraryApp);

// Mount Counselor routes
app.route('/api/counselor', counselorApp);

// Mount Notifications routes
app.route('/api/notifications', notificationsApp);

// Mount AI Tutor routes
app.route('/api/tutor', tutorApp);

// Mount Chat routes
app.route('/api/chat', chatApp);

// Mount Moderation routes
app.route('/api/moderation', moderationApp);

// Mount Payments routes
app.route('/api/payments', paymentsApp);

// Mount Subscriptions routes
app.route('/api/subscriptions', subscriptionsApp);

// Mount Affiliates routes (includes public /ref/:code endpoint)
app.route('/api/affiliates', affiliatesApp);

// Mount protected routes (must be after all protectedApp routes are defined)
app.route('/api', protectedApp);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Error:', err);
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// =============================================
// SCHEDULED HANDLER - Demo Data Cleanup (Cron)
// =============================================

// List of tables that need demo data cleanup
const DEMO_DATA_TABLES = [
  'user_progress',
  'question_attempts',
  'essay_attempts',
  'paper_attempts',
  'paper_attempt_answers',
  'practice_sessions',
  'user_achievements',
  'battles',
  'battle_answers',
  'house_points',
  'user_exam_preferences',
  'user_subject_selections',
  'chat_messages',
  'chat_message_reactions',
  'competitions',
  'leaderboard',
  'assessment_attempts',
  'assessment_attempt_answers',
  'parent_notifications',
  'parent_activity_log',
  'counselor_sessions',
  'counselor_messages',
  'tutor_conversations',
  'tutor_messages',
  'library_resources',
  'notifications',
];

// Scheduled cleanup function
async function cleanupExpiredDemoData(db: D1Database): Promise<{ tablesProcessed: number; rowsDeleted: number }> {
  const now = new Date().toISOString();
  let totalDeleted = 0;
  let tablesProcessed = 0;

  for (const table of DEMO_DATA_TABLES) {
    try {
      // Delete expired demo data
      const result = await db.prepare(`
        DELETE FROM ${table}
        WHERE is_demo_data = 1 AND expires_at IS NOT NULL AND expires_at < ?
      `).bind(now).run();

      if (result.meta.changes > 0) {
        console.log(`Cleaned up ${result.meta.changes} expired demo records from ${table}`);
        totalDeleted += result.meta.changes;
      }
      tablesProcessed++;
    } catch (error) {
      // Table might not have the columns yet (migration not run)
      console.log(`Skipping ${table}: ${error instanceof Error ? error.message : 'unknown error'}`);
    }
  }

  return { tablesProcessed, rowsDeleted: totalDeleted };
}

// Cloudflare Worker with scheduled handler
export default {
  fetch: app.fetch,

  // Scheduled handler for Cron triggers
  async scheduled(event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Scheduled cleanup triggered at ${new Date().toISOString()}`);

    try {
      const result = await cleanupExpiredDemoData(env.DB);
      console.log(`Demo data cleanup complete: ${result.rowsDeleted} rows deleted from ${result.tablesProcessed} tables`);
    } catch (error) {
      console.error('Demo data cleanup failed:', error);
    }
  },
};
