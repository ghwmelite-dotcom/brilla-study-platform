import { Hono } from 'hono';
import type { Context, MiddlewareHandler } from 'hono';
import { cors } from 'hono/cors';
import { sign } from 'hono/jwt';
import { requireAuth, requireAdmin, constantTimeEqual } from './auth-middleware';
import { parseBoundedJsonBody, parseLimit, parseJsonBody } from './http';
import type { JWTPayload } from 'hono/utils/jwt/types';
import { callTextModel, getChatModel, getGenerationModel, getMarkingModel, getTtsModel, getVisionModel, unwrapAiText } from './ai-models';
import { extractJsonObject, formatUntrustedAiData, normalizeTheoryMarking, UNTRUSTED_AI_DATA_INSTRUCTION } from './ai-safety';
import type { TheoryMarking } from './ai-safety';
import { libraryApp } from './library';
import { counselorApp } from './counselor';
import { notificationsApp, createNotification } from './notifications';
import { tutorApp } from './tutor';
import { chatApp } from './chat';
import { moderationApp } from './moderation';
import { paymentsApp, runPaymentReconciliation } from './payments';
import { subscriptionsApp } from './subscriptions';
import {
  affiliatesApp,
  isValidReferralCode,
  attributeReferral,
  awardReferralSignupPoints,
  generateUniqueReferralCode,
} from './affiliates';
import { recordingsApp } from './recordings';
import { labApp } from './lab';
import { whiteboardsApp } from './whiteboards';
import { teacherBonusesRouter } from './teacher-bonuses';
import { tutoringRouter } from './tutoring';
import { quickPlayApp } from './quickplay';
import { learningPathApp } from './learningpath';
import { guidanceApp } from './guidance';
import { activityFeedApp } from './activityfeed';
import { eventsApp } from './events';
import { teamBattlesApp } from './teambattles';
import { cosmeticsApp } from './cosmetics';
import { rewardsApp } from './rewards';
import { engagementApp } from './engagement';
import { friendsApp } from './friends';
import { oauthApp, ALLOWED_SELF_SERVE_ROLES } from './oauth';
import { checkRateLimit, cleanupRateLimits, RATE_LIMITS, type RateLimitResult } from './rate-limit';
import { validatePassword, validateRegistration } from './validation';
import { examBoardsApp } from './exam-boards';
import { revisionClassroomApp } from './revision-classroom';
import { studyRoomsApp } from './study-rooms';
import tutorClassroomApp from './tutor-classroom';
import { cleanupExpiredDemoData } from './demoUtils';
import { awardPoints } from './points';
import {
  getSelfRegistrationStatus,
  IMMEDIATE_STUDENT_REGISTRATION_MESSAGE,
  PENDING_APPROVAL_MESSAGE,
} from './registration-policy';
import {
  EMAIL_VERIFICATION_REWARD_XP,
  finalizeEmailVerification,
} from './email-verification-reward';
import { raceApp, runRaceCycleMaintenance } from './race';
import { telegramWebhookApp } from './telegram';
import { runTelegramRaceAlerts } from './race-alerts';
import { prepareAttemptProgress } from './attempt-progress';
import { getParentGuidance } from './parent-guidance';
import { parseEssaySubmission } from './essay-content';
import {
  getDailyUsage,
  checkCanAnswer,
  prepareQuestionAllowance,
  getCoreSubjects,
  isCoreSubject,
  isPremiumUser,
  CORE_SUBJECTS,
  INTERNATIONAL_FREE_EXAMS,
  DAILY_QUESTION_LIMIT,
} from './usage-limits';
import { mapSubjectCatalogRow } from './subject-catalog';
import { marketingCampaignsApp } from './marketing-campaigns';

// Types for Cloudflare bindings
export interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  SETUP_KEY?: string;
  ENVIRONMENT: string;
  AI_PROVIDER?: string;
  AI_MODEL?: string;
  AI_MODEL_CHAT?: string;
  AI_MODEL_GENERATION?: string;
  AI_MODEL_EMBEDDING?: string;
  AI_MODEL_TTS?: string;
  AI_MODEL_MARKING?: string;
  AI_CACHE_THRESHOLD?: string;
  AI: Ai;  // Cloudflare Workers AI binding
  RESEND_API_KEY?: string;
  RESEND_WEBHOOK_SECRET?: string;
  RESEND_REFERRAL_TOPIC_ID?: string;
  APP_URL?: string;
  FROM_EMAIL?: string;
  LIBRARY_BUCKET?: R2Bucket;
  RECORDINGS_BUCKET?: R2Bucket;
  PAYSTACK_SECRET_KEY?: string;
  PAYSTACK_PUBLIC_KEY?: string;
  PAYSTACK_WEBHOOK_SECRET?: string;
  TURNSTILE_SECRET?: string;
  GOOGLE_CLIENT_ID?: string;
  GOOGLE_CLIENT_SECRET?: string;
  GOOGLE_REDIRECT_URI?: string;
  NOTIFICATION_EMAILS?: string; // Comma-separated list of additional emails to receive all site notifications
  REGISTRATION_MODE?: string; // Growth loop (Task 5): open | invite
  RACE_TARGET_POINTS?: string; // Growth loop: weekly race target (default 1000)
  // Telegram community (optional; alerts no-op when unset). Mirrors TelegramEnv.
  TELEGRAM_BOT_TOKEN?: string;
  TELEGRAM_WEBHOOK_SECRET?: string;
  TELEGRAM_PLATFORM_CHANNEL_ID?: string;
  TELEGRAM_COMMUNITY_URL?: string;
  TELEGRAM_BOT_USERNAME?: string;
}

// User type for JWT payload
interface UserPayload extends JWTPayload {
  userId: string;
  email: string;
  role: 'student' | 'teacher' | 'admin' | 'parent';
  sessionVersion: number;
}

interface AppVariables {
  userId: string;
  userRole: string;
  user: UserPayload;
  jwtPayload: UserPayload;
}

type AppEnv = { Bindings: Env; Variables: AppVariables };

const MAX_QUESTION_ANSWER_LENGTH = 10_000;
const MAX_PRACTICE_SESSION_BODY_BYTES = 32 * 1024;
const MAX_QUESTION_ATTEMPT_BODY_BYTES = 64 * 1024;
const MAX_PRACTICE_SESSION_ATTEMPTS = 100;

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('');
}

// =============================================
// UTILITY FUNCTIONS
// =============================================

// Transform question options from string array to QuestionOption objects
// Input: ["A. 2", "B. 3", "C. 4", "D. 10"] with correctAnswer "B"
// Output: [{ id: "A", text: "A. 2", isCorrect: false }, { id: "B", text: "B. 3", isCorrect: true }, ...]
function transformQuestionOptions(
  options: unknown,
  correctAnswer: string | null | undefined
): Array<{ id: string; text: string; isCorrect: boolean }> | null {
  if (!options) return null;

  // Parse if it's a string
  let optionsArray: unknown[];
  if (typeof options === 'string') {
    try {
      optionsArray = JSON.parse(options);
    } catch {
      return null;
    }
  } else if (Array.isArray(options)) {
    optionsArray = options;
  } else {
    return null;
  }

  // If already in correct format (array of objects with id/text), return as-is
  if (optionsArray.length > 0 && typeof optionsArray[0] === 'object' && optionsArray[0] !== null) {
    const firstOption = optionsArray[0] as Record<string, unknown>;
    if ('id' in firstOption && 'text' in firstOption) {
      return optionsArray as Array<{ id: string; text: string; isCorrect: boolean }>;
    }
  }

  // Transform string array to object array
  const letters = ['A', 'B', 'C', 'D', 'E', 'F'];
  return optionsArray.map((option, index) => {
    const optionText = String(option);
    const letterId = letters[index] || String.fromCharCode(65 + index);

    // Determine if this option is correct
    // correctAnswer might be:
    // 1. Just the letter (e.g., "B")
    // 2. The full text (e.g., "B. 3")
    // 3. The option value itself (e.g., "True" for true_false questions)
    let isCorrect = false;
    if (correctAnswer) {
      const trimmedAnswer = correctAnswer.trim();
      const answerLetter = trimmedAnswer.charAt(0).toUpperCase();
      // Check if answer matches the letter ID
      isCorrect = letterId === answerLetter;
      // Also check if the option text matches the correct answer (for true_false, etc.)
      if (!isCorrect && optionText.toLowerCase() === trimmedAnswer.toLowerCase()) {
        isCorrect = true;
      }
    }

    return {
      id: letterId,
      text: optionText,
      isCorrect,
    };
  });
}

function sanitizeQuestionForStudent(question: Record<string, unknown>): Record<string, unknown> {
  const sanitized = { ...question };
  delete sanitized.correct_answer;
  delete sanitized.explanation;
  const options = transformQuestionOptions(question.options, null);
  sanitized.options = options?.map(({ id, text }) => ({ id, text })) ?? null;
  return sanitized;
}

// Normalize answer for comparison
// Handles cases where:
// - User submits "A. 1/4" but correct_answer is "A"
// - User submits "B. 5/4" but correct_answer is "B"
// - User submits "True" but correct_answer is "true"
// - User submits the actual value matching correct_answer directly
function normalizeAnswerForComparison(
  userAnswer: string,
  correctAnswer: string
): { userNormalized: string; correctNormalized: string } {
  const userTrimmed = userAnswer.trim().toLowerCase();
  const correctTrimmed = correctAnswer.trim().toLowerCase();

  // If they match directly, return as-is
  if (userTrimmed === correctTrimmed) {
    return { userNormalized: userTrimmed, correctNormalized: correctTrimmed };
  }

  // Check if user answer starts with a letter followed by period/dot (e.g., "A. 1/4", "B. value")
  const letterMatch = userAnswer.match(/^([A-Fa-f])\s*\.\s*/);
  if (letterMatch) {
    const userLetter = letterMatch[1].toUpperCase();
    // If correct answer is a single letter, compare letters
    if (/^[A-Fa-f]$/i.test(correctAnswer.trim())) {
      return {
        userNormalized: userLetter.toLowerCase(),
        correctNormalized: correctTrimmed
      };
    }
    // Otherwise, extract the value after the letter prefix and compare
    const userValue = userAnswer.replace(/^[A-Fa-f]\s*\.\s*/, '').trim().toLowerCase();
    return { userNormalized: userValue, correctNormalized: correctTrimmed };
  }

  // Default: compare as-is
  return { userNormalized: userTrimmed, correctNormalized: correctTrimmed };
}

function isSubmittedAnswerCorrect(
  questionType: unknown,
  questionOptions: unknown,
  userAnswer: string,
  correctAnswer: string,
): boolean {
  const fallback = normalizeAnswerForComparison(userAnswer, correctAnswer);
  if (questionType !== 'multiple_choice') {
    return fallback.userNormalized === fallback.correctNormalized;
  }

  const options = transformQuestionOptions(questionOptions, null);
  const selected = options?.find(
    (option) => option.id.toLowerCase() === userAnswer.trim().toLowerCase(),
  );
  if (!selected) return fallback.userNormalized === fallback.correctNormalized;

  const correct = correctAnswer.trim();
  if (selected.id.toLowerCase() === correct.toLowerCase()) return true;

  const labelledCorrect = correct.match(/^([A-F])(?:$|\s*[.):-]\s*)/i);
  if (labelledCorrect?.[1].toLowerCase() === selected.id.toLowerCase()) return true;

  const stripLabel = (value: string) => value
    .replace(/^([A-F])\s*[.):-]\s*/i, '')
    .trim()
    .toLowerCase();
  return stripLabel(selected.text) === stripLabel(correct);
}

// Canonical school_level values are 'jhs' | 'shs' (DB CHECK constraint).
// Clients send 'jss' (legacy UI spelling) or 'international' (O/A-level);
// normalize to the canonical set — O/A-level students store NULL by design
// (see database/schema.sql note on the users table).
function normalizeSchoolLevel(value: unknown): string | null {
  if (value === 'jss' || value === 'jhs') return 'jhs';
  if (value === 'shs') return 'shs';
  return null;
}

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
    // Constant-time comparison: no early exit on first mismatch.
    // Length difference is folded into the accumulator; the modulo index
    // keeps the loop bounded when lengths differ.
    let diff = hashBytes.length ^ storedHashBytes.length;
    for (let i = 0; i < hashBytes.length; i++) {
      diff |= hashBytes[i] ^ storedHashBytes[i % storedHashBytes.length];
    }
    return diff === 0;
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
      exp: Math.floor(Date.now() / 1000) + (24 * 60 * 60), // 24 hours
      iat: Math.floor(Date.now() / 1000),
    },
    secret
  );
}

// =============================================
// RATE LIMITING
// =============================================
// RateLimitConfig, RateLimitResult, RATE_LIMITS, checkRateLimit and
// cleanupRateLimits now live in ./rate-limit (extracted in Phase 2 Task 5 so
// counselor.ts can share them without a circular import).

// Helper to get rate limit error response
function rateLimitResponse(c: Context<AppEnv>, result: RateLimitResult) {
  const retryAfter = result.retryAfter ?? 30;
  c.header('Retry-After', String(retryAfter));
  if (result.reason === 'backend_unavailable') {
    return c.json({
      success: false,
      error: 'Request protection is temporarily unavailable. Please try again.',
      code: 'RATE_LIMIT_UNAVAILABLE',
      retryAfter,
    }, 503);
  }
  return c.json({
    success: false,
    error: 'Too many requests. Please try again later.',
    code: 'RATE_LIMITED',
    retryAfter,
  }, 429);
}

// Per-IP throttle for unauthenticated public read endpoints (leaderboard,
// papers, houses, subjects, exam-types, public flashcards). Uses the shared
// D1-backed limiter so the budget holds across Workers isolates; fail-open on
// limiter errors, same as the question-read bucket.
const publicReadRateLimit: MiddlewareHandler<AppEnv> = async (c, next) => {
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const rateLimit = await checkRateLimit(c.env.DB, clientIp, 'public-read');
  if (!rateLimit.allowed) return rateLimitResponse(c, rateLimit);
  await next();
};

// Cloudflare Turnstile verification below; rate-limit helpers above.
interface TurnstileVerifyResponse {
  success: boolean;
  'error-codes'?: string[];
  challenge_ts?: string;
  hostname?: string;
}

async function verifyTurnstile(token: string, secretKey: string, remoteip?: string): Promise<boolean> {
  try {
    const formData = new URLSearchParams();
    formData.append('secret', secretKey);
    formData.append('response', token);
    if (remoteip) {
      formData.append('remoteip', remoteip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData.toString(),
    });

    const result = await response.json() as TurnstileVerifyResponse;

    if (!result.success) {
      console.error('Turnstile verification failed:', result['error-codes']);
    }

    return result.success;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
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

// Escape user/request-derived data before interpolating into outbound email HTML
function escapeHtml(value: string): string {
  return String(value).replace(/[&<>"']/g, (ch) =>
    ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[ch] as string,
  );
}

// Email templates
export function getVerificationEmailHTML(name: string, verificationUrl: string): string {
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
        <p style="font-size: 16px;">Hello <strong>${escapeHtml(name)}</strong>,</p>
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

export function getEmailVerificationHTML(name: string, verificationUrl: string): string {
  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Verify Your Email - BrillaPrep</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">Welcome to BrillaPrep!</h1>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <p style="font-size: 16px;">Hello <strong>${escapeHtml(name)}</strong>,</p>
        <p style="font-size: 16px;">Your student account is ready. Confirm this email address so future sign-ins stay secure.</p>
        <p style="font-size: 16px; color: #1e40af;"><strong>Verify now and earn ${EMAIL_VERIFICATION_REWARD_XP} XP</strong> to start your BrillaPrep journey.</p>
        <div style="text-align: center; margin: 30px 0;">
          <a href="${escapeHtml(verificationUrl)}" style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">Verify Email</a>
        </div>
        <p style="font-size: 14px; color: #6b7280;">This link expires in 24 hours. If you did not create this account, ignore this email.</p>
      </div>
    </body>
    </html>
  `;
}

export function getPasswordResetEmailHTML(name: string, resetUrl: string): string {
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
        <p style="font-size: 16px;">Hello <strong>${escapeHtml(name)}</strong>,</p>
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

export function getApprovalEmailHTML(userName: string, appUrl: string, trialStarted: boolean = false): string {
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
        <p style="font-size: 16px;">Hello <strong>${escapeHtml(userName)}</strong>,</p>
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

export function getRejectionEmailHTML(userName: string, reason: string | null, appUrl: string): string {
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
        <p style="font-size: 16px;">Hello <strong>${escapeHtml(userName)}</strong>,</p>
        <p style="font-size: 16px;">Thank you for your interest in Brilla Study Platform. Unfortunately, we were unable to approve your registration at this time.</p>
        ${reason ? `
        <div style="background: #f3f4f6; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px;"><strong>Reason:</strong> ${escapeHtml(reason)}</p>
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

export function getNewRegistrationEmailHTML(userName: string, userEmail: string, userRole: string, appUrl: string): string {
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
          <p style="margin: 8px 0; font-size: 15px;"><strong>Name:</strong> ${escapeHtml(userName)}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Email:</strong> ${escapeHtml(userEmail)}</p>
          <p style="margin: 8px 0; font-size: 15px;"><strong>Role:</strong> ${escapeHtml(userRole)}</p>
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

// Security alert email for blocked login attempts
interface SecurityAlertDetails {
  targetEmail: string;
  ipAddress: string;
  attemptCount: number;
  blockDuration: string;
  userAgent?: string;
  country?: string;
}

export function getSecurityAlertEmailHTML(details: SecurityAlertDetails, appUrl: string): string {
  const severityColor = details.attemptCount >= 10 ? '#dc2626' : '#f59e0b'; // Red for high, amber for medium
  const severityText = details.attemptCount >= 10 ? 'HIGH' : 'MEDIUM';

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>Security Alert - Blocked Login Attempts</title>
    </head>
    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
      <div style="background: linear-gradient(135deg, ${severityColor} 0%, #991b1b 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 28px;">🚨 Security Alert</h1>
        <p style="color: rgba(255,255,255,0.9); margin: 10px 0 0 0; font-size: 14px;">Blocked Login Attempts Detected</p>
      </div>
      <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
        <div style="background: ${severityColor}15; border-left: 4px solid ${severityColor}; padding: 15px; margin-bottom: 20px; border-radius: 0 8px 8px 0;">
          <p style="margin: 0; font-weight: 600; color: ${severityColor};">Severity: ${severityText}</p>
          <p style="margin: 5px 0 0 0; font-size: 14px; color: #666;">Multiple failed login attempts have been blocked</p>
        </div>

        <p style="font-size: 16px;">Hello Admin,</p>
        <p style="font-size: 16px;">Our security system has blocked suspicious login activity on the Brilla Study Platform:</p>

        <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0; border: 1px solid #e5e7eb;">
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280; width: 140px;">Target Account:</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 600;">${escapeHtml(details.targetEmail)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">IP Address:</td>
              <td style="padding: 8px 0; font-size: 14px; font-family: monospace; background: #f3f4f6; padding: 4px 8px; border-radius: 4px; display: inline-block;">${escapeHtml(details.ipAddress)}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Failed Attempts:</td>
              <td style="padding: 8px 0; font-size: 14px; font-weight: 600; color: ${severityColor};">${details.attemptCount} attempts</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Block Duration:</td>
              <td style="padding: 8px 0; font-size: 14px;">${details.blockDuration}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Time:</td>
              <td style="padding: 8px 0; font-size: 14px;">${new Date().toLocaleString('en-US', { timeZone: 'UTC' })} UTC</td>
            </tr>
            ${details.country ? `
            <tr>
              <td style="padding: 8px 0; font-size: 14px; color: #6b7280;">Location:</td>
              <td style="padding: 8px 0; font-size: 14px;">${escapeHtml(details.country)}</td>
            </tr>
            ` : ''}
          </table>
        </div>

        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; font-size: 14px; color: #92400e;">
            <strong>Recommended Actions:</strong>
          </p>
          <ul style="margin: 10px 0 0 0; padding-left: 20px; font-size: 14px; color: #92400e;">
            <li>Review the account for any unauthorized access</li>
            <li>Consider notifying the account owner</li>
            <li>Monitor for additional suspicious activity from this IP</li>
          </ul>
        </div>

        <div style="text-align: center; margin: 30px 0;">
          <a href="${appUrl}/admin/audit" style="background: linear-gradient(135deg, #1e40af 0%, #7c3aed 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; display: inline-block; font-size: 16px;">View Audit Log</a>
        </div>

        <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
        <p style="font-size: 12px; color: #9ca3af; text-align: center;">Brilla Study Platform Security System</p>
      </div>
    </body>
    </html>
  `;
}

// Get all notification recipient emails (admins + configured additional emails)
function getAdditionalNotificationEmails(env: Env): string[] {
  if (!env.NOTIFICATION_EMAILS) return [];
  return env.NOTIFICATION_EMAILS.split(',')
    .map(email => email.trim())
    .filter(email => email.length > 0 && email.includes('@'));
}

// Send security alert to all admins and additional notification recipients
async function sendSecurityAlertToAdmins(
  db: D1Database,
  resendApiKey: string,
  fromEmail: string,
  appUrl: string,
  details: SecurityAlertDetails,
  additionalEmails: string[] = []
): Promise<void> {
  try {
    // Get all admin emails
    const { results: admins } = await db.prepare(
      "SELECT email FROM users WHERE role = 'admin' AND status = 'approved' AND is_active = 1"
    ).all();

    // Combine admin emails with additional notification emails
    const adminEmails = (admins as Array<{ email: string }>).map((a) => a.email);
    const allRecipients = [...new Set([...adminEmails, ...additionalEmails])]; // Dedupe

    if (allRecipients.length === 0) {
      console.log('No notification recipients found for security alert');
      return;
    }

    const emailHtml = getSecurityAlertEmailHTML(details, appUrl);
    const subject = `🚨 Security Alert: Blocked Login Attempts for ${details.targetEmail}`;

    // Send to all recipients with delay to avoid Resend rate limit (2 req/sec)
    for (let i = 0; i < allRecipients.length; i++) {
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      try {
        await sendEmail(resendApiKey, fromEmail, allRecipients[i], subject, emailHtml);
        console.log(`Security alert sent to ${allRecipients[i]}`);
      } catch (error) {
        console.error(`Failed to send security alert to ${allRecipients[i]}:`, error);
      }
    }
  } catch (error) {
    console.error('Failed to send security alerts:', error);
  }
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
function isDemoEmail(email: string | undefined | null): boolean {
  if (!email) return false;
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

const app = new Hono<AppEnv>();

// Middleware
app.use('*', cors({
  origin: (origin, c) => {
    const allowed = new Set<string>();
    if (c.env.APP_URL) {
      try {
        const configuredOrigin = new URL(c.env.APP_URL).origin;
        allowed.add(configuredOrigin);
        if (
          configuredOrigin === 'https://brillaprep.org'
          || configuredOrigin === 'https://www.brillaprep.org'
        ) {
          allowed.add('https://brillaprep.org');
          allowed.add('https://www.brillaprep.org');
        }
      } catch {
        // Ignore malformed deployment configuration and fail closed.
      }
    }
    if (c.env.ENVIRONMENT === 'development' || c.env.ENVIRONMENT === 'dev') {
      allowed.add('http://localhost:5173');
      allowed.add('http://127.0.0.1:5173');
    }
    return allowed.has(origin) ? origin : '';
  },
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  credentials: true,
}));

// Mount exam boards routes FIRST (O-Level / A-Level system) - must be before other /api routes
app.route('/api/exam-boards', examBoardsApp);

// Public routes (no auth required)
const publicApp = new Hono<AppEnv>();

// Unauthenticated read endpoints get a generous per-IP bucket so scraping
// and refresh storms can't freely hammer D1 (registered before the routes
// below so Hono runs it first; first-registered-wins). The trailing-*
// pattern also matches the bare prefix in Hono, so registering both would
// double-charge the bucket on every bare-path request.
publicApp.use('/leaderboard/*', publicReadRateLimit);
// /papers/:id (paper detail incl. answer material) is behind requireAuth
// plus the per-user question-read bucket, so only the anonymous list and
// years reads join the public-read bucket here. Exact patterns only -- a
// '/papers/*' wildcard would also match (and double-charge) those routes.
publicApp.use('/papers', publicReadRateLimit);
publicApp.use('/papers/years', publicReadRateLimit);
publicApp.use('/houses/*', publicReadRateLimit);
publicApp.use('/subjects/*', publicReadRateLimit);
publicApp.use('/exam-types/*', publicReadRateLimit);
publicApp.use('/flashcards/public', publicReadRateLimit);

// Protected routes with JWT authentication middleware
const protectedApp = new Hono<AppEnv>();

// Authentication middleware for protected routes: verified JWT + fresh DB
// role/status/is_active re-check (shared middleware, sets userId/userRole/user).
protectedApp.use('*', requireAuth);

// Identity comes only from verified JWT context (set by requireAuth).
function getUserId(c: { get: (key: string) => string | undefined }): string | undefined {
  return c.get('userId');
}

function getUserRole(c: { get: (key: string) => string | undefined }): string | undefined {
  return c.get('userRole');
}

// Health check
publicApp.get('/health', (c) => {
  return c.json({ success: true, data: { status: 'ok' } });
});

const STAGING_QA_SENTINEL_PATTERN = /^qa-sentinel-[a-f0-9]{16,64}$/;

// Proves that the deployed staging Worker is bound to the same isolated D1
// database that the QA harness writes to before the harness mutates any user
// data. The route is deliberately absent outside staging and never exposes a
// database name, id, or row contents.
publicApp.get('/health/staging-target/:nonce', async (c) => {
  if (c.env.ENVIRONMENT !== 'staging') {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  const nonce = c.req.param('nonce');
  if (!STAGING_QA_SENTINEL_PATTERN.test(nonce)) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  const row = await c.env.DB.prepare(
    "SELECT 1 AS verified FROM rate_limits WHERE identifier = ? AND endpoint = 'qa-deployment-sentinel' LIMIT 1",
  ).bind(nonce).first<{ verified: number }>();
  if (row?.verified !== 1) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  return c.json({ success: true, data: { verified: true } });
});


export async function resolveRegistrationRateLimitIdentifier(
  env: Env,
  clientIp: string,
  qaSentinel: string | undefined,
): Promise<string> {
  if (env.ENVIRONMENT !== 'staging' || !qaSentinel || !STAGING_QA_SENTINEL_PATTERN.test(qaSentinel)) {
    return clientIp;
  }
  try {
    const row = await env.DB.prepare(
      "SELECT 1 AS verified FROM rate_limits WHERE identifier = ? AND endpoint = 'qa-deployment-sentinel' LIMIT 1",
    ).bind(qaSentinel).first<{ verified: number }>();
    return row?.verified === 1 ? `qa:${qaSentinel}` : clientIp;
  } catch {
    return clientIp;
  }
}
// =============================================
// EXAM TYPES ENDPOINTS
// =============================================

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
  } catch {
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
  } catch {
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch paper types' }, 500);
  }
});

// =============================================
// AUTHENTICATION ROUTES
// =============================================

// Register a new user. Students begin immediately; roles with elevated access
// remain pending. Referral codes are optional attribution, never an access gate.
publicApp.post('/auth/register', async (c) => {
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  const { email, password, name, role, schoolLevel, yearGroup, schoolName, house,
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications,
          selectedTierId, turnstileToken, examTypeIds, primaryExamTypeId, referralCode } = body;
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Ordinary traffic remains IP-limited. A live staging QA run may use only a
  // nonce that the harness has already written through the approved D1 target.
  const rateLimitIdentifier = await resolveRegistrationRateLimitIdentifier(
    c.env, clientIp, c.req.header('X-Brilla-QA-Sentinel'),
  );
  const ipRateLimit = await checkRateLimit(c.env.DB, rateLimitIdentifier, 'register');
  if (!ipRateLimit.allowed) {
    // Send security alert to admins for blocked registration attempts
    if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL) {
      const blockDurationMinutes = Math.ceil((ipRateLimit.retryAfter || 3600) / 60);
      const alertDetails: SecurityAlertDetails = {
        targetEmail: email || 'unknown',
        ipAddress: clientIp,
        attemptCount: RATE_LIMITS['register'].maxRequests,
        blockDuration: `${blockDurationMinutes} minutes`,
        userAgent: c.req.header('User-Agent') || undefined,
        country: c.req.header('CF-IPCountry') || undefined
      };

      console.log('Sending registration spam alert for IP:', clientIp);
      const additionalEmails = getAdditionalNotificationEmails(c.env);
      c.executionCtx.waitUntil(
        sendSecurityAlertToAdmins(
          c.env.DB,
          c.env.RESEND_API_KEY,
          c.env.FROM_EMAIL,
          c.env.APP_URL || 'https://brillaprep.org',
          { ...alertDetails, targetEmail: `Registration spam (IP: ${clientIp})` },
          additionalEmails
        ).then(() => console.log('Registration spam alert sent successfully'))
        .catch(err => console.error('Failed to send registration security alert:', err))
      );
    }

    return rateLimitResponse(c, ipRateLimit);
  }

  // Verify Turnstile token
  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

  try {
    // Defense-in-depth: only self-serve roles may be caller-selected.
    if (role && !ALLOWED_SELF_SERVE_ROLES.includes(role)) {
      return c.json({ success: false, error: 'Invalid role' }, 400);
    }
    const userRole = (role || 'student') as 'student' | 'teacher' | 'parent';

    // Students never need an invite. Other self-serve roles retain the legacy
    // invite-mode gate when that environment setting is intentionally enabled.
    const inviteMode = c.env.REGISTRATION_MODE === 'invite';
    let referralAffiliate: { id: string; user_id: string; referral_code: string } | null = null;
    if (referralCode) {
      if (!isValidReferralCode(referralCode)) {
        return c.json({ success: false, error: 'Invalid referral code format' }, 400);
      }
      referralAffiliate = await c.env.DB.prepare(`
        SELECT id, user_id, referral_code FROM affiliate_profiles
        WHERE referral_code = ? AND is_active = 1
      `).bind(String(referralCode).toUpperCase()).first();
      if (!referralAffiliate) {
        return c.json({ success: false, error: 'Invalid referral code' }, 400);
      }
    } else if (inviteMode && userRole !== 'student') {
      return c.json({
        success: false,
        error: 'An invite code is required for this role. Contact a BrillaPrep administrator.',
        data: { codeRequired: true },
      }, 400);
    }

    const validationError = validateRegistration({ email, password, name });
    if (validationError) {
      return c.json({ success: false, error: validationError }, 400);
    }

    // Check if email already exists
    const existing = await c.env.DB.prepare(
      'SELECT id FROM users WHERE email = ?'
    ).bind(email).first();

    if (existing) {
      return c.json({ success: false, error: 'An account with this email already exists.' }, 400);
    }

    // Hash password
    const passwordHash = await hashPassword(password);
    const id = `user_${Date.now()}_${crypto.randomUUID().slice(0, 8)}`;
    const initialStatus = getSelfRegistrationStatus(userRole);
    const ownReferralCode = initialStatus === 'approved'
      ? await generateUniqueReferralCode(c.env.DB, name)
      : null;
    const verificationToken = initialStatus === 'approved' ? generateToken() : null;
    const verificationExpiresAt = verificationToken
      ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString()
      : null;

    // The user insert, primary exam-type update and preference inserts run in
    // one D1 batch so a failure mid-write cannot leave a partial account.
    // referred_by is attribution metadata only and never affects access.
    const statements = [
      c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, email_verified,
                           verification_token, verification_token_expires_at,
                           school_level, year_group, school_name, house,
                           teacher_license_number, subjects_taught, years_experience, qualifications,
                           selected_tier_id, referred_by, is_affiliate)
        VALUES (?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        id, email, passwordHash, name, userRole, initialStatus,
        verificationToken, verificationExpiresAt,
        normalizeSchoolLevel(schoolLevel), yearGroup || null, schoolName || null, house || null,
        teacherLicenseNumber || null,
        subjectsTaught ? JSON.stringify(subjectsTaught) : null,
        yearsExperience || null, qualifications || null,
        selectedTierId || null,
        referralAffiliate ? referralAffiliate.referral_code : null,
        ownReferralCode ? 1 : 0,
      ),
    ];

    if (ownReferralCode) {
      statements.push(
        c.env.DB.prepare(`
          INSERT INTO affiliate_profiles (id, user_id, referral_code, tier_id)
          VALUES (?, ?, ?, 'tier_scout')
        `).bind(`affiliate_${crypto.randomUUID()}`, id, ownReferralCode)
      );
    }

    // Create exam type preferences if provided
    if (examTypeIds && Array.isArray(examTypeIds) && examTypeIds.length > 0) {
      const actualPrimaryId = primaryExamTypeId || examTypeIds[0];

      // Update primary_exam_type_id in users table
      statements.push(
        c.env.DB.prepare(`
          UPDATE users SET primary_exam_type_id = ? WHERE id = ?
        `).bind(actualPrimaryId, id)
      );

      // Insert exam preferences
      for (const examTypeId of examTypeIds) {
        const prefId = `pref_${id}_${examTypeId}_${Date.now()}`;
        const isPrimary = examTypeId === actualPrimaryId ? 1 : 0;

        statements.push(
          c.env.DB.prepare(`
            INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary)
            VALUES (?, ?, ?, ?)
          `).bind(prefId, id, examTypeId, isPrimary)
        );
      }
    }

    await c.env.DB.batch(statements);

    // Attribution and rewards are best-effort side effects. They must never
    // turn a successfully committed student account into a reported failure.
    if (referralAffiliate) {
      try {
        await attributeReferral(c.env.DB, referralAffiliate, id, referralAffiliate.referral_code);
        if (initialStatus === 'approved') {
          await awardReferralSignupPoints(c.env.DB, referralAffiliate.user_id, id);
        }
      } catch (referralError) {
        console.error('Failed to attribute referral during registration:', referralError);
      }
    }

    if (initialStatus === 'pending') {
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

      // Send email notification to admins and additional notification recipients
      if (c.env.RESEND_API_KEY) {
        const appUrl = c.env.APP_URL || 'https://brillaprep.org';
        const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';
        const adminEmails = (admins as { email: string }[]).map(a => a.email);
        const additionalEmails = getAdditionalNotificationEmails(c.env);
        const allRecipients = [...new Set([...adminEmails, ...additionalEmails])]; // Dedupe

        if (allRecipients.length > 0) {
          const emailHtml = getNewRegistrationEmailHTML(name, email, roleLabel, appUrl);

          // Add delay between emails to avoid Resend rate limit (2 req/sec)
          for (let i = 0; i < allRecipients.length; i++) {
            if (i > 0) {
              await new Promise(resolve => setTimeout(resolve, 600));
            }
            await sendEmail(
              c.env.RESEND_API_KEY,
              fromEmail,
              allRecipients[i],
              `New ${roleLabel} Registration Awaiting Approval`,
              emailHtml
            );
          }
        }
      }
      } catch (notifyError) {
        // Log but don't fail the registration if notification fails
        console.error('Failed to notify admins:', notifyError);
      }
    }

    if (initialStatus === 'approved') {
      if (verificationToken && c.env.RESEND_API_KEY) {
        try {
          const appUrl = c.env.APP_URL || 'https://brillaprep.org';
          const verificationUrl = `${appUrl}/set-password?mode=verify-email&token=${verificationToken}`;
          await sendEmail(
            c.env.RESEND_API_KEY,
            c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>',
            email,
            'Verify your BrillaPrep email',
            getEmailVerificationHTML(name, verificationUrl),
          );
        } catch (verificationEmailError) {
          console.error('Failed to send student verification email:', verificationEmailError);
        }
      }

      const token = await generateJWT({
        userId: id,
        email,
        role: userRole,
        sessionVersion: 0,
      }, c.env.JWT_SECRET);

      await c.env.DB.prepare(
        "UPDATE users SET last_login_at = datetime('now') WHERE id = ?"
      ).bind(id).run();

      return c.json({
        success: true,
        data: {
          status: initialStatus,
          message: IMMEDIATE_STUDENT_REGISTRATION_MESSAGE,
          requiresApproval: false,
          referralCode: ownReferralCode,
          token,
          user: {
            id,
            email,
            name,
            role: userRole,
            status: initialStatus,
            emailVerified: false,
            house: house || null,
            yearGroup: yearGroup || null,
            schoolLevel: normalizeSchoolLevel(schoolLevel),
            schoolName: schoolName || null,
            xpPoints: 0,
            level: 1,
            streakDays: 0,
            aiGradingCredits: 0,
          },
        }
      });
    }

    return c.json({
      success: true,
      data: {
        status: initialStatus,
        message: PENDING_APPROVAL_MESSAGE,
        requiresApproval: true,
      }
    });
  } catch (error) {
    console.error('Registration error:', error);
    return c.json({ success: false, error: 'Registration failed' }, 500);
  }
});

// Legacy client compatibility: student invite requests are intentionally
// retired. Historical records remain available to administrators.
publicApp.post('/referral-code-requests', async (c) => {
  return c.json({
    success: false,
    error: 'Invite requests are no longer required for student registration. Create your student account directly.',
  }, 410);
});

// Login
publicApp.post('/auth/login', async (c) => {
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  const { email, password, turnstileToken } = body;
  const clientInfo = getClientInfo(c);
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limiting - check both IP and email-based limits
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'login-ip');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  if (email) {
    const emailRateLimit = await checkRateLimit(c.env.DB, email.toLowerCase(), 'login');
    if (!emailRateLimit.allowed) {
      // Send security alert to admins for blocked login attempts
      if (c.env.RESEND_API_KEY && c.env.FROM_EMAIL) {
        const blockDurationMinutes = Math.ceil((emailRateLimit.retryAfter || 1800) / 60);
        const alertDetails: SecurityAlertDetails = {
          targetEmail: email.toLowerCase(),
          ipAddress: clientIp,
          attemptCount: RATE_LIMITS['login'].maxRequests,
          blockDuration: `${blockDurationMinutes} minutes`,
          userAgent: clientInfo.userAgent,
          country: c.req.header('CF-IPCountry') || undefined
        };

        // Send alert in background using waitUntil to keep worker alive
        const additionalEmails = getAdditionalNotificationEmails(c.env);
        c.executionCtx.waitUntil(
          sendSecurityAlertToAdmins(
            c.env.DB,
            c.env.RESEND_API_KEY,
            c.env.FROM_EMAIL,
            c.env.APP_URL || 'https://brillaprep.org',
            alertDetails,
            additionalEmails
          ).catch(err => console.error('Failed to send security alert:', err))
        );
      }

      return rateLimitResponse(c, emailRateLimit);
    }
  }

  // Verify Turnstile token (all logins require Turnstile when TURNSTILE_SECRET is set)
  if (c.env.TURNSTILE_SECRET) {
    if (turnstileToken) {
      const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
      if (!isValidTurnstile) {
        return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
      }
    } else {
      return c.json({ success: false, error: 'Security verification required.' }, 400);
    }
  }

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
      role: result.role as 'student' | 'teacher' | 'admin' | 'parent',
      sessionVersion: Number(result.session_version ?? 0),
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
    console.error('Login error:', error); // detail stays in logs
    return c.json({ success: false, error: 'Login failed' }, 500);
  }
});

// Verify token and set password (for admin-created users)
publicApp.post('/auth/set-password', async (c) => {
  const { token, password, turnstileToken } = await c.req.json();
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limiting
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'set-password');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  // Verify Turnstile token
  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

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

    const verification = await finalizeEmailVerification(c.env.DB, {
      userId: String(user.id),
      token: String(token),
      passwordHash,
    });

    if (!verification.verified) {
      return c.json({ success: false, error: 'This verification link has already been used.' }, 400);
    }

    return c.json({
      success: true,
      data: {
        message: 'Password set successfully. You can now log in.',
        xpAwarded: verification.xpAwarded,
      },
    });
  } catch (error) {
    console.error('Set password error:', error);
    return c.json({ success: false, error: 'Failed to set password' }, 500);
  }
});

// Verify a self-registered email without changing the password.
publicApp.post('/auth/verify-email', async (c) => {
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  const { token, turnstileToken } = body;
  if (!token) return c.json({ success: false, error: 'Token is required' }, 400);

  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'set-password');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(
      turnstileToken,
      c.env.TURNSTILE_SECRET,
      clientIp,
    );
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, email_verified, verification_token_expires_at
      FROM users
      WHERE verification_token = ?
    `).bind(String(token)).first<{
      id: string;
      email_verified: number;
      verification_token_expires_at: string | null;
    }>();

    if (!user) {
      return c.json({ success: false, error: 'Invalid or expired verification link.' }, 400);
    }

    if (
      user.verification_token_expires_at &&
      new Date(user.verification_token_expires_at) < new Date()
    ) {
      return c.json({ success: false, error: 'This verification link has expired.' }, 400);
    }

    if (Number(user.email_verified) === 1) {
      return c.json({ success: false, error: 'This verification link has already been used.' }, 400);
    }

    const verification = await finalizeEmailVerification(c.env.DB, {
      userId: user.id,
      token: String(token),
    });

    if (!verification.verified) {
      return c.json({ success: false, error: 'This verification link has already been used.' }, 400);
    }

    return c.json({
      success: true,
      data: {
        message: 'Email verified successfully.',
        xpAwarded: verification.xpAwarded,
      },
    });
  } catch (error) {
    console.error('Verify email error:', error);
    return c.json({ success: false, error: 'Failed to verify email' }, 500);
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
  } catch {
    return c.json({ success: false, error: 'Token verification failed' }, 500);
  }
});

// Request password reset
publicApp.post('/auth/forgot-password', async (c) => {
  const { email, turnstileToken } = await c.req.json();
  const appUrl = c.env.APP_URL || 'https://brilla.edu.gh';
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limiting - check both IP and email-based limits
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'forgot-password-ip');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  if (email) {
    const emailRateLimit = await checkRateLimit(c.env.DB, email.toLowerCase(), 'forgot-password');
    if (!emailRateLimit.allowed) {
      // Don't reveal that the email is rate limited - just return success
      return c.json({ success: true, data: { message: 'If an account exists, a reset link will be sent.' } });
    }
  }

  // Verify Turnstile token
  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

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
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);

  const { token, password, turnstileToken } = body;
  if (typeof token !== 'string' || token.length === 0) {
    return c.json({ success: false, error: 'Token is required' }, 400);
  }
  if (!validatePassword(password)) {
    return c.json({ success: false, error: 'Password must be between 8 and 128 characters.' }, 400);
  }

  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limiting
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'reset-password');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  // Verify Turnstile token
  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

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

    const passwordUpdate = await c.env.DB.prepare(`
      UPDATE users SET
        password_hash = ?,
        session_version = session_version + 1,
        password_reset_token = NULL,
        password_reset_expires_at = NULL,
        updated_at = datetime('now')
      WHERE id = ? AND password_reset_token = ?
    `).bind(passwordHash, user.id, token).run();

    if ((passwordUpdate.meta?.changes ?? 0) === 0) {
      return c.json({ success: false, error: 'This reset link has already been used.' }, 400);
    }

    return c.json({ success: true, data: { message: 'Password reset successfully.' } });
  } catch (error) {
    console.error('Reset password error:', error);
    return c.json({ success: false, error: 'Failed to reset password' }, 500);
  }
});

// Test notification endpoint - for testing email delivery
// Requires a verified admin JWT (shared requireAdmin middleware)
publicApp.post('/auth/test-notification', requireAdmin, async (c) => {
  if (!c.env.RESEND_API_KEY) {
    return c.json({ success: false, error: 'Email service not configured' }, 500);
  }

  try {
    const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';

    // Get admin emails
    const { results: admins } = await c.env.DB.prepare(
      "SELECT email FROM users WHERE role = 'admin' AND status = 'approved' AND is_active = 1"
    ).all();
    const adminEmails = (admins as Array<{ email: string }>).map((a) => a.email);

    // Get additional notification emails
    const additionalEmails = getAdditionalNotificationEmails(c.env);
    const allRecipients = [...new Set([...adminEmails, ...additionalEmails])];

    if (allRecipients.length === 0) {
      return c.json({ success: false, error: 'No notification recipients configured' }, 400);
    }

    const testEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🧪 Test Notification</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">This is a test notification from Brilla Study Platform.</p>
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
            <strong>Recipients:</strong> ${allRecipients.join(', ')}
          </p>
          <p style="font-size: 14px; color: #10b981;">✅ If you received this email, notifications are working correctly!</p>
        </div>
      </body>
      </html>
    `;

    // Send to all recipients with detailed Resend API response
    // Add delay between requests to avoid Resend rate limit (2 req/sec)
    const results: { email: string; success: boolean; error?: string; resendResponse?: unknown }[] = [];
    for (let i = 0; i < allRecipients.length; i++) {
      const recipientEmail = allRecipients[i];
      // Add 600ms delay between emails to stay under rate limit
      if (i > 0) {
        await new Promise(resolve => setTimeout(resolve, 600));
      }
      try {
        const response = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${c.env.RESEND_API_KEY}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            from: fromEmail,
            to: [recipientEmail],
            subject: '🧪 Test Notification - Brilla Study Platform',
            html: testEmailHtml,
          }),
        });
        const resendData = await response.json();
        results.push({
          email: recipientEmail,
          success: response.ok,
          resendResponse: resendData
        });
      } catch (error) {
        results.push({ email: recipientEmail, success: false, error: String(error) });
      }
    }

    return c.json({
      success: true,
      data: {
        message: 'Test notifications sent',
        recipients: results,
        fromEmail: fromEmail
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return c.json({ success: false, error: 'Failed to send test notification' }, 500);
  }
});

// Setup endpoint - one-shot initialization of initial users.
// Requires the dedicated SETUP_KEY secret (separate from JWT_SECRET); the
// endpoint returns 404 when SETUP_KEY is not configured. Rate limited to
// 5 attempts/hour per IP, refuses to run once any admin account exists,
// never overwrites existing users' passwords, and never creates admin
// accounts. The caller must supply the full users array — there are no
// built-in default credentials.
publicApp.post('/auth/setup', async (c) => {
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limit this endpoint heavily
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'setup');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  // Disabled unless the dedicated SETUP_KEY secret is configured
  if (!c.env.SETUP_KEY) {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  const body = await c.req.json().catch(() => null);
  const setupKey = body?.setupKey;
  const users = body?.users;

  if (typeof setupKey !== 'string' || !constantTimeEqual(setupKey, c.env.SETUP_KEY)) {
    return c.json({ success: false, error: 'Invalid setup key' }, 401);
  }

  try {
    // One-shot guard: setup can only run before any admin account exists
    const adminCount = await c.env.DB.prepare(
      "SELECT COUNT(*) as n FROM users WHERE role = 'admin'"
    ).first<{ n: number }>();
    if ((adminCount?.n ?? 0) > 0) {
      return c.json({ success: false, error: 'Setup has already been completed' }, 403);
    }

    // The caller must supply the users to create (no default credentials)
    if (!Array.isArray(users) || users.length === 0) {
      return c.json({ success: false, error: 'A non-empty users array is required' }, 400);
    }

    // Role clamp: setup never creates admins (admins are seeded separately)
    const allowedRoles = ['teacher', 'student', 'parent'];
    for (const user of users) {
      if (!user || typeof user.email !== 'string' || typeof user.password !== 'string' ||
          typeof user.name !== 'string' || !allowedRoles.includes(user.role)) {
        return c.json({ success: false, error: 'Invalid entry in users array' }, 400);
      }
    }

    const results = [];

    for (let i = 0; i < users.length; i++) {
      const user = users[i];
      // Check if user exists
      const existing = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(user.email).first();

      if (existing) {
        // Never overwrite an existing user's password
        results.push({ email: user.email, action: 'skipped_exists' });
        continue;
      }

      const passwordHash = await hashPassword(user.password);
      const userId = `${user.role}_${Date.now()}_${i}`;
      await c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, is_active, email_verified, xp_points, level, streak_days, ai_grading_credits)
        VALUES (?, ?, ?, ?, ?, 'approved', 1, 1, 0, 1, 0, ?)
      `).bind(
        userId,
        user.email,
        passwordHash,
        user.name,
        user.role,
        user.role === 'teacher' ? 50 : 10
      ).run();
      results.push({ email: user.email, action: 'created' });
    }

    return c.json({ success: true, data: { message: 'Setup completed', results } });
  } catch (error) {
    console.error('Setup error:', error);
    return c.json({ success: false, error: 'Setup failed' }, 500);
  }
});

// Reset demo user passwords - Only works for demo emails (not admin@brillaprep.org)
// This endpoint allows resetting demo passwords without authentication
publicApp.post('/auth/reset-demo-passwords', async (c) => {
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limit this endpoint heavily
  const ipRateLimit = await checkRateLimit(c.env.DB, clientIp, 'demo-reset');
  if (!ipRateLimit.allowed) {
    return rateLimitResponse(c, ipRateLimit);
  }

  // Demo password reset only works in local dev — the demo passwords are
  // public knowledge, so this endpoint must not exist in production.
  if (c.env.ENVIRONMENT !== 'development' && c.env.ENVIRONMENT !== 'dev') {
    return c.json({ success: false, error: 'Not found' }, 404);
  }

  try {
    const demoUsers = [
      { email: 'teacher@brillaprep.org', password: 'Teacher123!' },
      { email: 'student@brillaprep.org', password: 'Student123!' },
    ];

    const results = [];

    for (const user of demoUsers) {
      // Only allow demo emails (not admin)
      if (!isDemoEmail(user.email)) {
        continue;
      }

      const passwordHash = await hashPassword(user.password);
      const existing = await c.env.DB.prepare(
        'SELECT id FROM users WHERE email = ?'
      ).bind(user.email).first();

      if (existing) {
        await c.env.DB.prepare(`
          UPDATE users SET password_hash = ?, session_version = session_version + 1, updated_at = datetime('now')
          WHERE email = ?
        `).bind(passwordHash, user.email).run();
        results.push({ email: user.email, status: 'password_reset' });
      } else {
        // Create the demo user if it doesn't exist
        const userId = `demo_${user.email.split('@')[0]}_${Date.now()}`;
        const role = user.email.includes('admin') ? 'admin' :
                     user.email.includes('teacher') ? 'teacher' : 'student';
        const credits = role === 'admin' ? 100 : role === 'teacher' ? 50 : 10;
        await c.env.DB.prepare(`
          INSERT INTO users (id, email, password_hash, name, role, status, is_active, email_verified, xp_points, level, streak_days, ai_grading_credits)
          VALUES (?, ?, ?, ?, ?, 'approved', 1, 1, 0, 1, 0, ?)
        `).bind(userId, user.email, passwordHash, `Demo ${role.charAt(0).toUpperCase() + role.slice(1)}`, role, credits).run();
        results.push({ email: user.email, status: 'created' });
      }
    }

    return c.json({ success: true, data: { message: 'Demo passwords reset', results } });
  } catch (error) {
    console.error('Demo reset error:', error);
    return c.json({ success: false, error: 'Reset failed' }, 500);
  }
});

// Get all active exam types
publicApp.get('/exam-types', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, name, slug, description, icon, color, display_order
      FROM exam_types
      WHERE is_active = 1
      ORDER BY display_order
    `).all();

    return c.json({ success: true, data: results });
  } catch (error) {
    console.error('Error fetching exam types:', error);
    return c.json({ success: false, error: 'Failed to fetch exam types' }, 500);
  }
});

const subjectCatalogSelect = `
  SELECT s.*, sc.name AS category_name, sc.slug AS category_slug, sc.is_core,
         et.name AS exam_type_name, et.slug AS exam_type_slug,
         COALESCE(qc.question_count, 0) AS question_count,
         COALESCE(qc.automated_beta_count, 0) AS automated_beta_count,
         COALESCE(tc.topic_count, 0) AS topic_count
  FROM subjects s
  LEFT JOIN subject_categories sc ON s.category_id = sc.id
  LEFT JOIN exam_types et ON s.exam_type_id = et.id
  LEFT JOIN (
    SELECT q.subject_id, COUNT(*) AS question_count,
           COUNT(qcr.question_id) AS automated_beta_count
    FROM questions q
    JOIN topics usable_topic
      ON usable_topic.id = q.topic_id AND usable_topic.subject_id = q.subject_id
    LEFT JOIN question_content_releases qcr
      ON qcr.question_id = q.id
     AND qcr.quality_assurance = 'automated_beta'
     AND qcr.release_channel = 'beta'
    GROUP BY q.subject_id
  ) qc ON qc.subject_id = s.id
  LEFT JOIN (
    SELECT subject_id, COUNT(*) AS topic_count
    FROM topics
    GROUP BY subject_id
  ) tc ON tc.subject_id = s.id
`;

// Public catalogue: all active subjects, with truthful live inventory metadata.
publicApp.get('/subjects', async (c) => {
  const examType = c.req.query('exam_type');
  const category = c.req.query('category');

  try {
    let query = `${subjectCatalogSelect} WHERE s.is_active = 1`;
    const params: string[] = [];

    if (examType) {
      query += ' AND et.slug = ?';
      params.push(examType);
    }
    if (category) {
      query += ' AND sc.slug = ?';
      params.push(category);
    }

    query += ' ORDER BY COALESCE(sc.display_order, 9999), s.display_order, s.name';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    const { results } = await stmt.all();

    return c.json({
      success: true,
      data: results.map((row) => mapSubjectCatalogRow(row as Record<string, unknown>)),
    });
  } catch (error) {
    console.error('Error fetching subject catalogue:', error);
    return c.json({ success: false, error: 'Failed to fetch subjects' }, 500);
  }
});

publicApp.get('/subjects/:slug', async (c) => {
  const slug = c.req.param('slug');

  try {
    const subject = await c.env.DB.prepare(
      `${subjectCatalogSelect} WHERE s.is_active = 1 AND s.slug = ?`,
    ).bind(slug).first();

    if (!subject) {
      return c.json({ success: false, error: 'Subject not found' }, 404);
    }

    return c.json({
      success: true,
      data: mapSubjectCatalogRow(subject as Record<string, unknown>),
    });
  } catch (error) {
    console.error('Error fetching subject:', error);
    return c.json({ success: false, error: 'Failed to fetch subject' }, 500);
  }
});

// Topics
publicApp.get('/topics', async (c) => {
  const subjectId = c.req.query('subject');

  try {
    let query = `
      SELECT t.*, COUNT(q.id) AS question_count
      FROM topics t
      JOIN subjects subject ON subject.id = t.subject_id AND subject.is_active = 1
      LEFT JOIN questions q
        ON q.topic_id = t.id AND q.subject_id = t.subject_id
    `;
    const params: string[] = [];

    if (subjectId) {
      query += ' WHERE t.subject_id = ?';
      params.push(subjectId);
    }

    query += ' GROUP BY t.id ORDER BY t.display_order';

    const stmt = params.length > 0
      ? c.env.DB.prepare(query).bind(...params)
      : c.env.DB.prepare(query);
    const { results } = await stmt.all();

    const topics = results.map((topic: Record<string, unknown>) => ({
      ...topic,
      keyFormulas: topic.key_formulas ? JSON.parse(topic.key_formulas as string) : [],
      questionCount: Number(topic.question_count ?? 0),
    }));

    return c.json({ success: true, data: topics });
  } catch (error) {
    console.error('Error fetching topics:', error);
    return c.json({ success: false, error: 'Failed to fetch topics' }, 500);
  }
});

publicApp.get('/topics/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const topic = await c.env.DB.prepare(`
      SELECT t.*
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
      WHERE t.id = ?
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
    console.error('Error fetching topic:', error);
    return c.json({ success: false, error: 'Failed to fetch topic' }, 500);
  }
});

// Question reads require authentication, entitlement, usage, and request-rate
// policy; answer material is withheld until an authorized attempt is submitted.
publicApp.use('/questions', requireAuth);
publicApp.use('/questions/*', requireAuth);

type SubjectBankAccessRow = {
  id: string;
  slug: string;
  exam_type_slug: string;
  question_count: number;
};

function hasFreeSubjectAccess(subject: SubjectBankAccessRow): boolean {
  return isCoreSubject(subject.exam_type_slug, subject.slug);
}

async function getQuestionReadContext(
  c: Context<AppEnv>,
  subjectIdentifier: string | undefined,
  topicIdentifier: string | undefined,
): Promise<
  | { response: Response }
  | { userId: string; premium: boolean; subject: SubjectBankAccessRow | null; limit: number }
> {
  const userId = getUserId(c)!;
  const rateLimit = await checkRateLimit(c.env.DB, userId, 'question-read', {
    maxRequests: 120,
    windowMs: 60 * 60 * 1000,
  });
  if (!rateLimit.allowed) return { response: rateLimitResponse(c, rateLimit) };

  const premium = await isPremiumUser(userId, c.env.DB);
  let subject: SubjectBankAccessRow | null = null;

  if (subjectIdentifier) {
    subject = await c.env.DB.prepare(`
      SELECT s.id, s.slug, et.slug AS exam_type_slug,
             COUNT(question_topic.id) AS question_count
      FROM subjects s
      JOIN exam_types et ON et.id = s.exam_type_id
      LEFT JOIN questions q ON q.subject_id = s.id
      LEFT JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      WHERE (s.id = ? OR s.slug = ?) AND s.is_active = 1
      GROUP BY s.id, s.slug, et.slug
    `).bind(subjectIdentifier, subjectIdentifier).first<SubjectBankAccessRow>();
  } else if (topicIdentifier) {
    subject = await c.env.DB.prepare(`
      SELECT s.id, s.slug, et.slug AS exam_type_slug,
             COUNT(question_topic.id) AS question_count
      FROM topics t
      JOIN subjects s ON s.id = t.subject_id AND s.is_active = 1
      JOIN exam_types et ON et.id = s.exam_type_id
      LEFT JOIN questions q ON q.subject_id = s.id
      LEFT JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      WHERE t.id = ?
      GROUP BY s.id, s.slug, et.slug
    `).bind(topicIdentifier).first<SubjectBankAccessRow>();
  }

  if ((subjectIdentifier || topicIdentifier) && !subject) {
    return {
      response: c.json({ success: false, error: 'Subject not found', code: 'SUBJECT_NOT_FOUND' }, 404),
    };
  }
  if (subject && Number(subject.question_count) === 0) {
    return {
      response: c.json({
        success: false,
        error: 'This subject does not have practice questions yet.',
        code: 'SUBJECT_UNAVAILABLE',
      }, 409),
    };
  }
  if (subject && !premium && !hasFreeSubjectAccess(subject)) {
    return {
      response: c.json({
        success: false,
        error: 'This subject requires an active premium plan.',
        code: 'SUBJECT_PREMIUM_REQUIRED',
      }, 403),
    };
  }

  let allowedLimit = Number.POSITIVE_INFINITY;
  if (!premium) {
    const usage = await checkCanAnswer(userId, c.env.DB);
    if (!usage.allowed) {
      return {
        response: c.json({
          success: false,
          error: 'Daily question limit reached',
          code: 'LIMIT_REACHED',
        }, 403),
      };
    }
    allowedLimit = usage.remaining;
  }

  return { userId, premium, subject, limit: allowedLimit };
}

publicApp.get('/questions', async (c) => {
  const subjectIdentifier = c.req.query('subject');
  const topicIdentifier = c.req.query('topic');
  const difficulty = c.req.query('difficulty');
  const round = c.req.query('round');
  const requestedLimit = parseLimit(c, 20);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const access = await getQuestionReadContext(c, subjectIdentifier, topicIdentifier);
    if ('response' in access) return access.response;

    let query = `
      SELECT q.*
      FROM questions q
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      JOIN exam_types et ON et.id = s.exam_type_id
      WHERE 1=1
    `;
    const params: (string | number)[] = [];

    if (access.subject) {
      query += ' AND q.subject_id = ?';
      params.push(access.subject.id);
    }
    if (topicIdentifier) {
      query += ' AND q.topic_id = ?';
      params.push(topicIdentifier);
    }
    if (difficulty) {
      query += ' AND q.difficulty = ?';
      params.push(difficulty);
    }
    if (round) {
      query += ' AND q.round_type = ?';
      params.push(round);
    }
    if (!access.premium) {
      const corePairs = Object.entries(CORE_SUBJECTS)
        .flatMap(([examSlug, subjectSlugs]) => subjectSlugs.flatMap((subjectSlug) => [
          [examSlug, subjectSlug] as const,
          [examSlug, `${examSlug}-${subjectSlug}`] as const,
        ]));
      const internationalPlaceholders = INTERNATIONAL_FREE_EXAMS.map(() => '?').join(', ');
      query += ` AND (${corePairs.map(() => '(et.slug = ? AND s.slug = ?)').join(' OR ')} OR et.slug IN (${internationalPlaceholders}))`;
      corePairs.forEach(([examSlug, subjectSlug]) => params.push(examSlug, subjectSlug));
      params.push(...INTERNATIONAL_FREE_EXAMS);
    }

    query += ' ORDER BY RANDOM() LIMIT ? OFFSET ?';
    params.push(Math.min(requestedLimit, access.limit), offset);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();
    const questions = results.map((question: Record<string, unknown>) => sanitizeQuestionForStudent(question));

    return c.json({ success: true, data: questions });
  } catch (error) {
    console.error('Error fetching questions:', error);
    return c.json({ success: false, error: 'Failed to fetch questions' }, 500);
  }
});

publicApp.get('/questions/:id', async (c) => {
  const id = c.req.param('id');

  try {
    const access = await getQuestionReadContext(c, undefined, undefined);
    if ('response' in access) return access.response;

    const question = await c.env.DB.prepare(`
      SELECT q.*, s.slug AS subject_slug, et.slug AS exam_type_slug
      FROM questions q
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      JOIN exam_types et ON et.id = s.exam_type_id
      WHERE q.id = ?
    `).bind(id).first<Record<string, unknown>>();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }
    const bank = {
      id: String(question.subject_id),
      slug: String(question.subject_slug),
      exam_type_slug: String(question.exam_type_slug),
      question_count: 1,
    };
    if (!access.premium && !hasFreeSubjectAccess(bank)) {
      return c.json({
        success: false,
        error: 'This subject requires an active premium plan.',
        code: 'SUBJECT_PREMIUM_REQUIRED',
      }, 403);
    }

    const questionData = sanitizeQuestionForStudent(question);
    delete questionData.subject_slug;
    delete questionData.exam_type_slug;
    return c.json({ success: true, data: questionData });
  } catch (error) {
    console.error('Error fetching question:', error);
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
  } catch {
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
  } catch {
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

    // Atomic claim transition: only one claimant can flip completed -> claimed
    const claim = await c.env.DB.prepare(`
      UPDATE user_quests SET status = 'claimed', claimed_at = datetime('now')
      WHERE id = ? AND user_id = ? AND status = 'completed'
    `).bind(questId, userId).run();

    if (claim.meta.changes === 0) {
      return c.json({ success: false, error: 'Quest not completed yet or already claimed' }, 400);
    }

    // Award XP + race-ledger row via the shared helper, then record the
    // completion. Trade-off: awardPoints does its own reads (daily caps,
    // active cycle), so it can't join the caller's batch — the XP/ledger
    // writes and the quest_completions insert are no longer one atomic batch.
    const xpReward = quest.xp_reward as number;
    const demoFlags = getDemoDataFlags(userId);
    await awardPoints(c.env.DB, {
      userId,
      points: xpReward,
      source: 'quest_claim',
      sourceRef: questId,
      isDemoData: demoFlags.is_demo_data,
      expiresAt: demoFlags.expires_at,
    });
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO quest_completions (id, user_id, quest_template_id, xp_earned, quest_type)
        VALUES (?, ?, ?, ?, (SELECT quest_type FROM quest_templates WHERE id = ?))
      `).bind(`qc_${crypto.randomUUID()}`, userId, quest.quest_template_id, xpReward, quest.quest_template_id),
    ]);

    // NOTE: coin_reward is display-only; no users.coins column exists. See docs/superpowers/plans/2026-08-03-fix-03-runtime-features.md
    return c.json({
      success: true,
      data: {
        xp: xpReward,
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

    // Award rewards: XP via the shared helper (raw display XP + weighted race
    // ledger row), streak protections via a separate update.
    const xpReward = milestone.xp_reward as number;
    const protectionReward = milestone.protection_reward as number;

    const demoFlags = getDemoDataFlags(userId);
    await awardPoints(c.env.DB, {
      userId,
      points: xpReward,
      source: 'streak_day',
      sourceRef: milestoneId,
      isDemoData: demoFlags.is_demo_data,
      expiresAt: demoFlags.expires_at,
    });
    await c.env.DB.prepare(`
      UPDATE users
      SET streak_protections = streak_protections + ?
      WHERE id = ?
    `).bind(protectionReward, userId).run();

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
  const limit = parseLimit(c, 50);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    let query = `
      SELECT pp.*,
        s.name as subject_name, s.slug as subject_slug, s.icon as subject_icon, s.color as subject_color,
        pt.name as paper_type_name, pt.slug as paper_type_slug, pt.question_format,
        et.name as exam_type_name, et.slug as exam_type_slug
      FROM past_papers pp
      JOIN subjects s ON pp.subject_id = s.id AND s.is_active = 1
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch past papers' }, 500);
  }
});

// Get available years for a subject (must be before /papers/:id)
publicApp.get('/papers/years', async (c) => {
  const examType = c.req.query('exam_type');
  const subject = c.req.query('subject');

  try {
    let query = `
      SELECT DISTINCT pp.year
      FROM past_papers pp
      JOIN exam_types et ON pp.exam_type_id = et.id
      JOIN subjects s ON pp.subject_id = s.id AND s.is_active = 1
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch years' }, 500);
  }
});

// Get single past paper with questions
publicApp.use('/papers/:id', requireAuth);
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

    const access = await getQuestionReadContext(c, String(paper.subject_id), undefined);
    if ('response' in access) return access.response;
    if (Number(paper.is_premium) === 1 && !access.premium) {
      return c.json({
        success: false,
        error: 'This past paper requires an active premium plan.',
        code: 'PAPER_PREMIUM_REQUIRED',
      }, 403);
    }

    // Get questions for this paper
    const { results: questions } = await c.env.DB.prepare(`
      SELECT q.*, t.name as topic_name
      FROM questions q
      JOIN topics t
        ON t.id = q.topic_id AND t.subject_id = q.subject_id
      WHERE q.past_paper_id = ?
      ORDER BY q.section, q.question_number
    `).bind(id).all();

    // Parse and transform options to proper format
    const parsedQuestions = questions.map((q: Record<string, unknown>) => sanitizeQuestionForStudent(q));

    return c.json({
      success: true,
      data: {
        ...paper,
        questions: parsedQuestions,
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch paper' }, 500);
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
      JOIN subjects s ON q.subject_id = s.id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
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
  } catch {
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch houses' }, 500);
  }
});

// Get house standings
// NOTE: static routes (/houses/standings, /houses/activity) must be
// registered BEFORE the `/houses/:id` param route below — Hono resolves
// first-registered-wins, so the param route would otherwise capture
// id='standings' / id='activity'.
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch standings' }, 500);
  }
});

// Get recent house activity
publicApp.get('/houses/activity', async (c) => {
  const limit = parseLimit(c, 20);

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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch activity' }, 500);
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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch house' }, 500);
  }
});

// Get house members
publicApp.get('/houses/:id/members', async (c) => {
  const id = c.req.param('id');
  const limit = parseLimit(c, 20);

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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch members' }, 500);
  }
});

// =====================
// BATTLE ENDPOINTS
// =====================

// Get available battles to join
publicApp.get('/battles/available', async (c) => {
  const now = new Date().toISOString();
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        u.name as challenger_name, u.avatar_url as challenger_avatar,
        s.name as subject_name
      FROM battles b
      JOIN users u ON b.challenger_id = u.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE b.status = 'waiting'
        AND (b.expires_at IS NULL OR b.expires_at > ?)
      ORDER BY b.created_at DESC
      LIMIT 20
    `).bind(now).all();

    const safeBattles = results.map((row: Record<string, unknown>) => {
      const safeBattle = { ...row };
      delete safeBattle.questions;
      return safeBattle;
    });

    return c.json({ success: true, data: safeBattles });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch battles' }, 500);
  }
});

// NOTE: GET /battles/history is served only by the app-level requireAuth
// route registered just before `app.route('/api', publicApp)` below
// (JWT-derived userId). The unauthenticated publicApp duplicate was removed:
// it let callers pass an arbitrary ?userId= to read anyone's battle history
// (IDOR), and publicApp's `/battles/:id` param route would shadow any
// protectedApp copy (Hono: first-registered matching route wins).

// Get battle by ID
publicApp.get('/battles/:id', async (c) => {
  const id = c.req.param('id');
  const now = new Date().toISOString();

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
        AND (b.expires_at IS NULL OR b.expires_at > ?)
    `).bind(id, now).first();

    if (!battle) {
      return c.json({ success: false, error: 'Battle not found' }, 404);
    }

    const parsedQuestions: unknown = battle.questions
      ? JSON.parse(battle.questions as string)
      : [];
    const storedQuestions = Array.isArray(parsedQuestions)
      ? parsedQuestions.filter(
          (question): question is Record<string, unknown> =>
            Boolean(question) && typeof question === 'object' && !Array.isArray(question),
        )
      : [];
    const storedQuestionIds = [
      ...new Set(
        storedQuestions
          .map((question) => question.id)
          .filter((questionId): questionId is string => typeof questionId === 'string'),
      ),
    ];

    let eligibleQuestionIds = new Set<string>();
    if (storedQuestionIds.length > 0) {
      const placeholders = storedQuestionIds.map(() => '?').join(', ');
      const { results: eligibleQuestions } = await c.env.DB.prepare(`
        SELECT q.id
        FROM questions q
        JOIN subjects subject
          ON subject.id = q.subject_id AND subject.is_active = 1
        JOIN topics question_topic
          ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
        WHERE q.id IN (${placeholders})
      `).bind(...storedQuestionIds).all<{ id: string }>();
      eligibleQuestionIds = new Set(eligibleQuestions.map((question) => question.id));
    }

    const safeBattle = { ...battle };
    delete safeBattle.questions;
    const data = {
      ...safeBattle,
      questions: storedQuestions
        .filter((question) => eligibleQuestionIds.has(String(question.id)))
        .map((question) => sanitizeQuestionForStudent(question)),
    };

    return c.json({ success: true, data });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch battle' }, 500);
  }
});

// =====================
// PUBLIC FLASHCARD ENDPOINTS (must be before mount)
// =====================

// Get flashcards for a specific deck (public endpoint for practice)
publicApp.get('/flashcards/decks/:id/cards', async (c) => {
  const deckId = c.req.param('id');

  try {
    const deck = await c.env.DB.prepare(`
      SELECT * FROM flashcard_decks WHERE id = ? AND is_public = 1
    `).bind(deckId).first();

    if (!deck) {
      return c.json({ success: false, error: 'Deck not found or not public' }, 404);
    }

    const { results: cards } = await c.env.DB.prepare(`
      SELECT id, front, back, image_url, hint, difficulty
      FROM flashcards WHERE deck_id = ?
      ORDER BY RANDOM()
    `).bind(deckId).all();

    return c.json({ cards: cards || [] });
  } catch (error) {
    console.error('Failed to fetch cards:', error);
    return c.json({ success: false, error: 'Failed to fetch cards' }, 500);
  }
});

// Get all public flashcard decks (for browsing)
publicApp.get('/flashcards/public', async (c) => {
  const subjectId = c.req.query('subject');
  const limit = parseLimit(c, 20);

  try {
    let query = `
      SELECT fd.*, COUNT(f.id) as card_count
      FROM flashcard_decks fd
      LEFT JOIN flashcards f ON f.deck_id = fd.id
      WHERE fd.is_public = 1
    `;
    const params: (string | number)[] = [];

    if (subjectId) {
      query += ` AND fd.subject_id = ?`;
      params.push(subjectId);
    }

    // Order by card_count DESC to prioritize decks with cards
    query += ` GROUP BY fd.id ORDER BY card_count DESC, fd.created_at DESC LIMIT ?`;
    params.push(limit);

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Failed to fetch public decks:', error);
    return c.json({ success: false, error: 'Failed to fetch decks' }, 500);
  }
});

// Get user's battle history (identity from JWT only). Registered on `app`
// BEFORE the publicApp mount: publicApp's `/battles/:id` param route is
// registered earlier than protectedApp's routes and would otherwise shadow
// `/battles/history` (Hono: first-registered matching route wins).
app.get('/api/battles/history', requireAuth, async (c) => {
  const userId = getUserId(c)!;
  const limit = parseLimit(c, 20);
  const now = new Date().toISOString();

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT b.*,
        c.name as challenger_name, c.avatar_url as challenger_avatar,
        o.name as opponent_name, o.avatar_url as opponent_avatar,
        s.name as subject_name,
        CASE
          WHEN b.challenger_id = ? THEN b.challenger_score
          ELSE b.opponent_score
        END as your_score,
        CASE
          WHEN b.challenger_id = ? THEN b.opponent_score
          ELSE b.challenger_score
        END as opponent_score,
        CASE
          WHEN b.challenger_id = ? THEN o.name
          ELSE c.name
        END as opponent_name_display
      FROM battles b
      JOIN users c ON b.challenger_id = c.id
      LEFT JOIN users o ON b.opponent_id = o.id
      LEFT JOIN subjects s ON b.subject_id = s.id
      WHERE (b.challenger_id = ? OR b.opponent_id = ?)
        AND (b.expires_at IS NULL OR b.expires_at > ?)
      ORDER BY b.created_at DESC
      LIMIT ?
    `).bind(userId, userId, userId, userId, userId, now, limit).all();

    // Shape the rows the way the Competition page consumes them
    // (your_score/opponent_score relative to the JWT user, opponent object).
    const formattedResults = results.map((battle: Record<string, unknown>) => ({
      id: battle.id,
      status: battle.status,
      winner_id: battle.winner_id,
      your_score: battle.your_score,
      opponent_score: battle.opponent_score,
      created_at: battle.created_at,
      opponent: {
        name: battle.opponent_name_display || 'Opponent',
      },
    }));

    return c.json({ success: true, data: formattedResults });
  } catch {
    return c.json({ success: false, error: 'Failed to fetch battle history' }, 500);
  }
});

// Get user's paper attempts history (identity from JWT only). Registered on
// `app` BEFORE the publicApp mount: publicApp's `/papers/:id` param route is
// registered earlier than protectedApp's routes and would otherwise shadow
// `/papers/attempts` (Hono: first-registered matching route wins).
app.get('/api/papers/attempts', requireAuth, async (c) => {
  const userId = getUserId(c)!;
  const limit = parseLimit(c, 20);
  const status = c.req.query('status'); // Optional filter: completed, abandoned, in_progress

  try {
    let query = `
      SELECT
        pa.id,
        pa.paper_id,
        pa.status,
        pa.time_allowed,
        pa.time_used,
        pa.total_score,
        pa.percentage,
        pa.started_at,
        pa.submitted_at,
        pp.title as paper_title,
        pp.total_marks as max_score,
        pt.name as paper_type
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      LEFT JOIN paper_types pt ON pp.paper_type_id = pt.id
      WHERE pa.user_id = ?
    `;
    const params: (string | number)[] = [userId];

    if (status) {
      query += ` AND pa.status = ?`;
      params.push(status);
    }

    query += ` ORDER BY pa.started_at DESC LIMIT ?`;
    params.push(limit);

    const attempts = await c.env.DB.prepare(query).bind(...params).all();

    // Transform to expected format
    const data = attempts.results.map((attempt: Record<string, unknown>) => ({
      id: attempt.id,
      paper_id: attempt.paper_id,
      status: attempt.status,
      total_score: attempt.total_score || 0,
      max_score: attempt.max_score || 100,
      percentage: attempt.percentage || 0,
      time_used: attempt.time_used || 0,
      submitted_at: attempt.submitted_at,
      started_at: attempt.started_at,
      paper: {
        title: attempt.paper_title,
        paper_type: attempt.paper_type || 'Paper 1',
      },
    }));

    return c.json(data);
  } catch (error) {
    console.error('Failed to fetch paper attempts:', error);
    return c.json({ success: false, error: 'Failed to fetch paper attempts' }, 500);
  }
});

// Get user's essay history (identity from JWT only). Registered on `app`
// BEFORE the publicApp mount: publicApp's `/essays/:questionId` param route
// is registered earlier than protectedApp's routes and would otherwise shadow
// `/essays/history` (Hono: first-registered matching route wins).
app.get('/api/essays/history', requireAuth, async (c) => {
  // Self only: identity comes only from the verified JWT.
  const userId = getUserId(c)!;
  const limit = parseLimit(c, 20);

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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch essay history' }, 500);
  }
});

// Question bank search (for question picker). Registered on `app` BEFORE
// the publicApp mount: publicApp's `/questions/:id` param route is
// registered earlier than protectedApp's routes and would otherwise shadow
// `/questions/bank` (Hono: first-registered matching route wins).
app.get('/api/questions/bank', requireAuth, async (c) => {
  const role = getUserRole(c);
  if (role !== 'admin' && role !== 'teacher') {
    return c.json({ success: false, error: 'Teacher or administrator access required' }, 403);
  }

  try {
    const search = c.req.query('search');
    const subjectId = c.req.query('subject');
    const topicId = c.req.query('topic');
    const difficulty = c.req.query('difficulty');
    const questionType = c.req.query('type');
    const limit = parseLimit(c, 20);
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
          options: transformQuestionOptions(q.options, q.correct_answer as string),
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

// Mount public routes
app.route('/api', publicApp);

// Get daily usage info for freemium limits
protectedApp.get('/usage/daily', async (c) => {
  // Identity comes only from the verified JWT (set by requireAuth).
  const userId = getUserId(c)!;

  try {
    const usage = await getDailyUsage(userId, c.env.DB);
    return c.json({
      success: true,
      data: usage,
    });
  } catch (error) {
    console.error('Failed to get daily usage:', error);
    return c.json({ success: false, error: 'Failed to get usage info' }, 500);
  }
});

// Get core subjects for an exam type (freemium feature)
protectedApp.get('/usage/core-subjects/:examType', async (c) => {
  const examType = c.req.param('examType');
  const coreSubjects = getCoreSubjects(examType);
  return c.json({
    success: true,
    data: {
      examType,
      coreSubjects,
    },
  });
});

// Submit answer
protectedApp.post('/questions/:id/attempt', async (c) => {
  const questionId = c.req.param('id');
  const parsedBody = await parseBoundedJsonBody(c, MAX_QUESTION_ATTEMPT_BODY_BYTES);
  if (!parsedBody.ok) {
    if (parsedBody.reason === 'too_large') {
      return c.json({
        success: false,
        error: 'Question attempt payload is too large',
        code: 'PAYLOAD_TOO_LARGE',
      }, 413);
    }
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }
  const body = parsedBody.body;
  const answer = typeof body.answer === 'string' ? body.answer : '';
  const clientRequestId = typeof body.clientRequestId === 'string'
    && /^[A-Za-z0-9_-]{16,128}$/.test(body.clientRequestId)
    ? body.clientRequestId
    : null;
  if (!answer.trim() || answer.length > MAX_QUESTION_ANSWER_LENGTH) {
    return c.json({ success: false, error: 'A valid answer is required' }, 400);
  }
  if (!clientRequestId) {
    return c.json({ success: false, error: 'A valid client request ID is required' }, 400);
  }
  if (
    body.timeTaken !== undefined
    && (!Number.isSafeInteger(body.timeTaken) || (body.timeTaken as number) < 0 || (body.timeTaken as number) > 86_400)
  ) {
    return c.json({ success: false, error: 'A valid timeTaken value is required' }, 400);
  }
  const submittedTimeTaken = body.timeTaken === undefined ? 0 : body.timeTaken as number;

  const userId = getUserId(c)!;

  try {
    const requestFingerprint = await sha256Hex(JSON.stringify({
      questionId,
      answer,
      timeTaken: submittedTimeTaken,
    }));

    const findReplay = async () => c.env.DB.prepare(`
      SELECT qa.id, qa.question_id, qa.request_fingerprint, qa.is_correct,
             qa.points_earned, q.correct_answer, q.explanation
      FROM question_attempts qa
      JOIN questions q ON q.id = qa.question_id
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      WHERE qa.user_id = ? AND qa.client_request_id = ?
    `).bind(userId, clientRequestId).first<{
      id: string;
      question_id: string;
      request_fingerprint: string;
      is_correct: number;
      points_earned: number | null;
      correct_answer: string;
      explanation: string | null;
    }>();

    const replayResponse = async (replay: NonNullable<Awaited<ReturnType<typeof findReplay>>>) => {
      if (replay.question_id !== questionId || replay.request_fingerprint !== requestFingerprint) {
        return c.json({
          success: false,
          error: 'Client request ID was already used for different answer data',
          code: 'IDEMPOTENCY_CONFLICT',
        }, 409);
      }

      const usage = await getDailyUsage(userId, c.env.DB);
      return c.json({
        success: true,
        data: {
          attemptId: replay.id,
          isCorrect: replay.is_correct === 1,
          correctAnswer: replay.correct_answer,
          explanation: replay.explanation,
          pointsEarned: Math.max(0, replay.points_earned ?? 0),
          usage: {
            used: usage.used,
            limit: usage.limit,
            remaining: usage.remaining,
            isUnlimited: usage.isUnlimited,
            showUpgradePrompt: !usage.isUnlimited && usage.remaining <= 3,
          },
          idempotent: true,
        },
      });
    };

    const replay = await findReplay();
    if (replay) return replayResponse(replay);

    const rateLimit = await checkRateLimit(
      c.env.DB,
      userId,
      'question-attempt-write',
      RATE_LIMITS['question-attempt-write'],
    );
    if (!rateLimit.allowed) return rateLimitResponse(c, rateLimit);

    // Resolve through the active subject before exposing answer material.
    const question = await c.env.DB.prepare(`
      SELECT q.*, s.slug AS subject_slug, et.slug AS exam_type_slug
      FROM questions q
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      JOIN exam_types et ON et.id = s.exam_type_id
      WHERE q.id = ?
    `).bind(questionId).first();

    if (!question) {
      return c.json({ success: false, error: 'Question not found' }, 404);
    }

    const premium = await isPremiumUser(userId, c.env.DB);
    if (!premium && !isCoreSubject(String(question.exam_type_slug), String(question.subject_slug))) {
      return c.json({
        success: false,
        error: 'This subject requires an active premium plan.',
        code: 'SUBJECT_PREMIUM_REQUIRED',
      }, 403);
    }

    let freeAllowance: Awaited<ReturnType<typeof checkCanAnswer>> | null = null;
    if (!premium) {
      freeAllowance = await checkCanAnswer(userId, c.env.DB);
      if (!freeAllowance.allowed) {
        const currentUsage = await getDailyUsage(userId, c.env.DB);
        return c.json({
          success: false,
          error: 'Daily question limit reached',
          code: 'LIMIT_REACHED',
          data: {
            usage: currentUsage,
            message: `You've used all ${DAILY_QUESTION_LIMIT} questions for today. Upgrade for unlimited practice!`,
          },
        }, 403);
      }
    }

    const isCorrect = isSubmittedAnswerCorrect(
      question.question_type,
      question.options,
      answer,
      String(question.correct_answer),
    );
    const pointsEarned = isCorrect ? (question.points as number) : 0;
    const progress = await prepareAttemptProgress(c.env.DB, {
      clientRequestId,
      requestFingerprint,
      userId,
      questionId,
      topicId: (question.topic_id as string | null) ?? null,
      examTypeId: (question.exam_type_id as string | null) ?? null,
      userAnswer: answer,
      isCorrect,
      timeTaken: submittedTimeTaken,
      points: (question.points as number | null) ?? 3,
    });

    let used = 0;
    let remaining = -1;
    let limit = -1;

    try {
      if (premium) {
        await c.env.DB.batch(progress.statements);
      } else {
        const allowance = prepareQuestionAllowance(userId, c.env.DB);
        const batchResults = await c.env.DB.batch([allowance, ...progress.statements]);
        const allowanceResult = batchResults[0] as {
          results?: Array<{ question_count?: unknown }>;
        };
        const returnedCount = Number(allowanceResult.results?.[0]?.question_count);
        used = Number.isFinite(returnedCount)
          ? returnedCount
          : DAILY_QUESTION_LIMIT - (freeAllowance?.remaining ?? DAILY_QUESTION_LIMIT) + 1;
        limit = DAILY_QUESTION_LIMIT;
        remaining = Math.max(0, limit - used);
      }
    } catch (writeError) {
      const concurrentReplay = await findReplay();
      if (concurrentReplay) return replayResponse(concurrentReplay);

      const message = writeError instanceof Error ? writeError.message : String(writeError);
      if (message.includes('DAILY_QUESTION_LIMIT_EXCEEDED')) {
        const currentUsage = await getDailyUsage(userId, c.env.DB);
        return c.json({
          success: false,
          error: 'Daily question limit reached',
          code: 'LIMIT_REACHED',
          data: {
            usage: currentUsage,
            message: `You've used all ${DAILY_QUESTION_LIMIT} questions for today. Upgrade for unlimited practice!`,
          },
        }, 403);
      }
      throw writeError;
    }

    const isUnlimited = limit === -1;
    const showUpgradePrompt = !isUnlimited && remaining <= 3;

    return c.json({
      success: true,
      data: {
        attemptId: progress.attemptId,
        isCorrect,
        correctAnswer: question.correct_answer,
        explanation: question.explanation,
        pointsEarned,
        usage: {
          used,
          limit,
          remaining,
          isUnlimited,
          showUpgradePrompt,
        },
        idempotent: false,
      },
    });
  } catch (error) {
    console.error('Failed to submit answer:', error);
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});
// Get user progress
protectedApp.get('/progress', async (c) => {
  const userId = getUserId(c)!;

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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch progress' }, 500);
  }
});

// Get user's practice sessions history
protectedApp.get('/practice/sessions', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const limit = parseLimit(c, 10);
  const offset = parseInt(c.req.query('offset') || '0');

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT id, mode, subject_id, topic_id, questions_count, correct_count,
             total_time, score, created_at, completed_at
      FROM practice_sessions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT ? OFFSET ?
    `).bind(userId, limit, offset).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Failed to fetch practice sessions:', error);
    return c.json({ success: false, error: 'Failed to fetch practice sessions' }, 500);
  }
});

// Create/save a practice session
protectedApp.post('/practice/sessions', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const parsedBody = await parseBoundedJsonBody(c, MAX_PRACTICE_SESSION_BODY_BYTES);
  if (!parsedBody.ok) {
    if (parsedBody.reason === 'too_large') {
      return c.json({ success: false, error: 'Practice session payload is too large' }, 413);
    }
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }
  const body = parsedBody.body;

  const allowedModes = new Set([
    'topic_drill',
    'speed_race',
    'flashcard',
    'competition_sim',
    'past_paper',
    'essay_practice',
  ]);
  const readOptionalId = (value: unknown, maximum = 128): string | null | undefined => {
    if (value === undefined || value === null || value === '') return null;
    if (typeof value !== 'string') return undefined;
    const trimmed = value.trim();
    return new RegExp(`^[A-Za-z0-9_-]{1,${maximum}}$`).test(trimmed) ? trimmed : undefined;
  };

  const mode = typeof body.mode === 'string' && allowedModes.has(body.mode) ? body.mode : null;
  const subjectId = readOptionalId(body.subjectId);
  const topicId = readOptionalId(body.topicId);
  const clientRequestId = readOptionalId(body.clientRequestId, 128);
  const attemptIds = Array.isArray(body.attemptIds)
    ? body.attemptIds.map((attemptId) => readOptionalId(attemptId, 128))
    : null;

  if (
    !mode
    || subjectId === undefined
    || topicId === undefined
    || !clientRequestId
    || !attemptIds
    || attemptIds.length < 1
    || attemptIds.length > MAX_PRACTICE_SESSION_ATTEMPTS
    || attemptIds.some((attemptId) => !attemptId)
    || new Set(attemptIds).size !== attemptIds.length
  ) {
    return c.json({ success: false, error: 'Invalid practice session payload' }, 400);
  }
  if (topicId && !subjectId) {
    return c.json({ success: false, error: 'A topic requires a subject' }, 400);
  }

  try {
    const normalizedAttemptIds = [...attemptIds] as string[];
    const requestFingerprint = await sha256Hex(JSON.stringify({
      mode,
      subjectId,
      topicId,
      attemptIds: [...normalizedAttemptIds].sort(),
    }));

    const findReplay = async () => c.env.DB.prepare(`
      SELECT id, request_fingerprint, questions_count, correct_count, total_time, score
      FROM practice_sessions
      WHERE user_id = ? AND client_request_id = ?
    `).bind(userId, clientRequestId).first<{
      id: string;
      request_fingerprint: string;
      questions_count: number;
      correct_count: number;
      total_time: number;
      score: number;
    }>();

    const replay = await findReplay();
    if (replay) {
      if (replay.request_fingerprint !== requestFingerprint) {
        return c.json({ success: false, error: 'Client request ID was already used for different session data' }, 409);
      }
      return c.json({
        success: true,
        data: {
          id: replay.id,
          questionsCount: replay.questions_count,
          correctCount: replay.correct_count,
          totalTime: replay.total_time,
          score: replay.score,
          idempotent: true,
        },
      });
    }

    const rateLimit = await checkRateLimit(
      c.env.DB,
      userId,
      'practice-session-save',
      RATE_LIMITS['practice-session-save'],
    );
    if (!rateLimit.allowed) return rateLimitResponse(c, rateLimit);

    if (subjectId) {
      const subject = await c.env.DB.prepare(
        'SELECT id FROM subjects WHERE id = ? AND is_active = 1'
      ).bind(subjectId).first();
      if (!subject) {
        return c.json({ success: false, error: 'Subject not found' }, 404);
      }
    }

    if (topicId) {
      const topic = await c.env.DB.prepare(
        'SELECT subject_id FROM topics WHERE id = ?'
      ).bind(topicId).first<{ subject_id: string }>();
      if (!topic) {
        return c.json({ success: false, error: 'Topic not found' }, 404);
      }
      if (topic.subject_id !== subjectId) {
        return c.json({ success: false, error: 'Topic does not belong to subject' }, 400);
      }
    }

    const placeholders = normalizedAttemptIds.map(() => '?').join(', ');
    const { results: attemptRows } = await c.env.DB.prepare(`
      SELECT qa.id, qa.is_correct, qa.points_earned, qa.time_taken,
             q.subject_id, q.topic_id, psa.session_id
      FROM question_attempts qa
      JOIN questions q ON q.id = qa.question_id
      LEFT JOIN practice_session_attempts psa ON psa.attempt_id = qa.id
      WHERE qa.user_id = ? AND qa.id IN (${placeholders})
    `).bind(userId, ...normalizedAttemptIds).all<{
      id: string;
      is_correct: number;
      points_earned: number | null;
      time_taken: number;
      subject_id: string;
      topic_id: string | null;
      session_id: string | null;
    }>();

    if (attemptRows.length !== normalizedAttemptIds.length) {
      return c.json({ success: false, error: 'Invalid attempt references' }, 400);
    }
    if (attemptRows.some((attempt) => attempt.session_id !== null)) {
      return c.json({ success: false, error: 'An attempt is already assigned to a completed session' }, 409);
    }
    if (subjectId && attemptRows.some((attempt) => attempt.subject_id !== subjectId)) {
      return c.json({ success: false, error: 'Attempt does not belong to requested subject' }, 400);
    }
    if (topicId && attemptRows.some((attempt) => attempt.topic_id !== topicId)) {
      return c.json({ success: false, error: 'Attempt does not belong to requested topic' }, 400);
    }

    const questionsCount = attemptRows.length;
    const correctCount = attemptRows.reduce((sum, attempt) => sum + (attempt.is_correct === 1 ? 1 : 0), 0);
    const totalTime = attemptRows.reduce((sum, attempt) => sum + Math.max(0, attempt.time_taken || 0), 0);
    const score = attemptRows.reduce((sum, attempt) => sum + Math.max(0, attempt.points_earned || 0), 0);

    const id = `ps_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
    const demoFlags = getDemoDataFlags(userId);

    const insertSession = c.env.DB.prepare(`
      INSERT INTO practice_sessions (
        id, user_id, mode, subject_id, topic_id, questions_count, correct_count,
        total_time, score, completed_at, is_demo_data, expires_at,
        client_request_id, request_fingerprint
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), ?, ?, ?, ?)
    `).bind(
      id,
      userId,
      mode,
      subjectId || null,
      topicId || null,
      questionsCount,
      correctCount,
      totalTime,
      score,
      demoFlags.is_demo_data,
      demoFlags.expires_at,
      clientRequestId,
      requestFingerprint,
    );
    const linkAttempts = normalizedAttemptIds.map((attemptId) => c.env.DB.prepare(`
      INSERT INTO practice_session_attempts (session_id, attempt_id)
      VALUES (?, ?)
    `).bind(id, attemptId));

    try {
      await c.env.DB.batch([insertSession, ...linkAttempts]);
    } catch (writeError) {
      const concurrentReplay = await findReplay();
      if (concurrentReplay && concurrentReplay.request_fingerprint === requestFingerprint) {
        return c.json({
          success: true,
          data: {
            id: concurrentReplay.id,
            questionsCount: concurrentReplay.questions_count,
            correctCount: concurrentReplay.correct_count,
            totalTime: concurrentReplay.total_time,
            score: concurrentReplay.score,
            idempotent: true,
          },
        });
      }
      throw writeError;
    }

    return c.json({
      success: true,
      data: { id, questionsCount, correctCount, totalTime, score, idempotent: false },
    });
  } catch (error) {
    console.error('Failed to create practice session:', error);
    return c.json({ success: false, error: 'Failed to save practice session' }, 500);
  }
});

// Get user analytics data
protectedApp.get('/analytics/user', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  try {
    // Get user basic stats
    const user = await c.env.DB.prepare(`
      SELECT xp_points, level, streak_days, longest_streak FROM users WHERE id = ?
    `).bind(userId).first();

    // Get weekly progress (last 7 days)
    const { results: weeklyData } = await c.env.DB.prepare(`
      SELECT
        date(created_at) as date,
        COUNT(*) as questions_attempted,
        SUM(CASE WHEN is_correct = 1 THEN 1 ELSE 0 END) as correct_answers
      FROM question_attempts
      WHERE user_id = ? AND created_at >= date('now', '-7 days')
      GROUP BY date(created_at)
      ORDER BY date ASC
    `).bind(userId).all();

    // Get subject performance
    const { results: subjectData } = await c.env.DB.prepare(`
      SELECT
        q.subject_id,
        COUNT(*) as total_attempted,
        SUM(CASE WHEN qa.is_correct = 1 THEN 1 ELSE 0 END) as correct,
        AVG(qa.time_taken) as avg_time
      FROM question_attempts qa
      JOIN questions q ON qa.question_id = q.id
      WHERE qa.user_id = ?
      GROUP BY q.subject_id
    `).bind(userId).all();

    // Get topic mastery
    const { results: topicMastery } = await c.env.DB.prepare(`
      SELECT topic_id, mastery_level, questions_attempted, questions_correct
      FROM user_progress
      WHERE user_id = ?
      ORDER BY mastery_level DESC
      LIMIT 10
    `).bind(userId).all();

    // Get recent practice sessions
    const { results: recentSessions } = await c.env.DB.prepare(`
      SELECT mode, questions_count, correct_count, score, created_at
      FROM practice_sessions
      WHERE user_id = ?
      ORDER BY created_at DESC
      LIMIT 5
    `).bind(userId).all();

    // Calculate strengths and weaknesses
    const subjectPerformance = (subjectData || []).map((s: Record<string, unknown>) => ({
      subjectId: s.subject_id,
      accuracy: s.total_attempted ? Math.round(((s.correct as number) / (s.total_attempted as number)) * 100) : 0,
      totalAttempted: s.total_attempted,
      avgTime: s.avg_time ? Math.round(s.avg_time as number) : 0,
    }));

    const sorted = [...subjectPerformance].sort((a, b) => b.accuracy - a.accuracy);
    const strengths = sorted.slice(0, 2).map(s => s.subjectId);
    const weaknesses = sorted.slice(-2).map(s => s.subjectId);

    return c.json({
      success: true,
      data: {
        xp: user?.xp_points || 0,
        level: user?.level || 1,
        streak: user?.streak_days || 0,
        longestStreak: user?.longest_streak || 0,
        weeklyProgress: weeklyData || [],
        subjectPerformance,
        topicMastery: topicMastery || [],
        recentSessions: recentSessions || [],
        strengths,
        weaknesses,
      }
    });
  } catch (error) {
    console.error('Failed to fetch analytics:', error);
    return c.json({ success: false, error: 'Failed to fetch analytics' }, 500);
  }
});

// =====================
// FLASHCARD ENDPOINTS
// =====================

// Get flashcard decks (user's + public)
protectedApp.get('/flashcards/decks', async (c) => {
  const userId = getUserId(c);
  const subjectId = c.req.query('subject');

  try {
    let query = `
      SELECT fd.*, COUNT(f.id) as actual_card_count
      FROM flashcard_decks fd
      LEFT JOIN flashcards f ON f.deck_id = fd.id
      WHERE (fd.user_id = ? OR fd.is_public = 1)
    `;
    const params: (string | null)[] = [userId || null];

    if (subjectId) {
      query += ` AND fd.subject_id = ?`;
      params.push(subjectId);
    }

    query += ` GROUP BY fd.id ORDER BY fd.created_at DESC`;

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Failed to fetch flashcard decks:', error);
    return c.json({ success: false, error: 'Failed to fetch decks' }, 500);
  }
});

// Get single deck with cards
protectedApp.get('/flashcards/decks/:id', async (c) => {
  const deckId = c.req.param('id');

  try {
    const deck = await c.env.DB.prepare(`
      SELECT * FROM flashcard_decks WHERE id = ?
    `).bind(deckId).first();

    if (!deck) {
      return c.json({ success: false, error: 'Deck not found' }, 404);
    }

    const { results: cards } = await c.env.DB.prepare(`
      SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at ASC
    `).bind(deckId).all();

    return c.json({
      ...deck,
      cards: cards || [],
    });
  } catch (error) {
    console.error('Failed to fetch deck:', error);
    return c.json({ success: false, error: 'Failed to fetch deck' }, 500);
  }
});

// Get cards due for review (spaced repetition)
protectedApp.get('/flashcards/due', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const limit = parseLimit(c, 20);

  try {
    // Get cards that are due for review or haven't been reviewed yet
    const { results } = await c.env.DB.prepare(`
      SELECT f.*, fd.name as deck_name, fd.subject_id,
             COALESCE(fr.next_review_at, datetime('1970-01-01')) as next_review
      FROM flashcards f
      JOIN flashcard_decks fd ON f.deck_id = fd.id
      LEFT JOIN (
        SELECT flashcard_id, MAX(reviewed_at) as last_review, next_review_at
        FROM flashcard_reviews
        WHERE user_id = ?
        GROUP BY flashcard_id
      ) fr ON f.id = fr.flashcard_id
      WHERE (fd.user_id = ? OR fd.is_public = 1)
        AND (fr.next_review_at IS NULL OR fr.next_review_at <= datetime('now'))
      ORDER BY COALESCE(fr.next_review_at, datetime('1970-01-01')) ASC
      LIMIT ?
    `).bind(userId, userId, limit).all();

    return c.json(results || []);
  } catch (error) {
    console.error('Failed to fetch due cards:', error);
    return c.json({ success: false, error: 'Failed to fetch due cards' }, 500);
  }
});

// Submit flashcard review (spaced repetition)
protectedApp.post('/flashcards/:id/review', async (c) => {
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  const cardId = c.req.param('id');
  const { rating } = await c.req.json();

  if (!rating || rating < 1 || rating > 5) {
    return c.json({ success: false, error: 'Rating must be between 1 and 5' }, 400);
  }

  try {
    // Get the card and its deck
    const card = await c.env.DB.prepare(`
      SELECT f.*, fd.id as deck_id FROM flashcards f
      JOIN flashcard_decks fd ON f.deck_id = fd.id
      WHERE f.id = ?
    `).bind(cardId).first();

    if (!card) {
      return c.json({ success: false, error: 'Card not found' }, 404);
    }

    // Get last review for this card
    const lastReview = await c.env.DB.prepare(`
      SELECT * FROM flashcard_reviews
      WHERE user_id = ? AND flashcard_id = ?
      ORDER BY reviewed_at DESC LIMIT 1
    `).bind(userId, cardId).first() as { ease_factor?: number; interval_days?: number; repetitions?: number } | null;

    // SM-2 algorithm for spaced repetition
    let easeFactor = lastReview?.ease_factor || 2.5;
    let interval = lastReview?.interval_days || 1;
    let repetitions = lastReview?.repetitions || 0;

    if (rating >= 3) {
      // Correct response
      if (repetitions === 0) {
        interval = 1;
      } else if (repetitions === 1) {
        interval = 6;
      } else {
        interval = Math.round(interval * easeFactor);
      }
      repetitions += 1;
      easeFactor = Math.max(1.3, easeFactor + 0.1 - (5 - rating) * (0.08 + (5 - rating) * 0.02));
    } else {
      // Incorrect response - reset
      repetitions = 0;
      interval = 1;
    }

    // Calculate next review date
    const nextReview = new Date();
    nextReview.setDate(nextReview.getDate() + interval);

    const reviewId = `fr_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

    await c.env.DB.prepare(`
      INSERT INTO flashcard_reviews (id, user_id, flashcard_id, deck_id, ease_rating, ease_factor, interval_days, repetitions, next_review_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).bind(reviewId, userId, cardId, card.deck_id, rating, easeFactor, interval, repetitions, nextReview.toISOString()).run();

    return c.json({
      success: true,
      data: {
        nextReviewAt: nextReview.toISOString(),
        interval,
        easeFactor,
        repetitions,
      },
    });
  } catch (error) {
    console.error('Failed to save review:', error);
    return c.json({ success: false, error: 'Failed to save review' }, 500);
  }
});

// =====================
// HOUSE CUP PROTECTED ENDPOINTS
// =====================

// Create custom house (admin only)
protectedApp.post('/houses', async (c) => {
  const { name, color, icon, description, schoolId } = await c.req.json();

  // Admin check uses the fresh DB role set by requireAuth, never a
  // caller-supplied id.
  if (getUserRole(c) !== 'admin') {
    return c.json({ success: false, error: 'Admin access required' }, 403);
  }

  try {
    const id = `house_${Date.now()}`;
    await c.env.DB.prepare(`
      INSERT INTO houses (id, name, color, icon, description, is_default, school_id)
      VALUES (?, ?, ?, ?, ?, 0, ?)
    `).bind(id, name, color, icon || 'shield', description || null, schoolId || null).run();

    return c.json({ success: true, data: { id, name, color, icon: icon || 'shield', description, isDefault: false, schoolId } });
  } catch {
    return c.json({ success: false, error: 'Failed to create house' }, 500);
  }
});

// Award house points (admin or teacher only — students must not self-award)
protectedApp.post('/houses/points', async (c) => {
  const { houseId, points, source, sourceId } = await c.req.json();
  const userId = getUserId(c)!;
  const userRole = getUserRole(c);

  if (userRole !== 'admin' && userRole !== 'teacher') {
    return c.json({ success: false, error: 'Only teachers and admins can award house points' }, 403);
  }

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
  } catch {
    return c.json({ success: false, error: 'Failed to award points' }, 500);
  }
});

// Update user's house (self or admin)
protectedApp.put('/users/:id/house', async (c) => {
  const id = c.req.param('id');
  const { houseId } = await c.req.json();
  const userId = getUserId(c)!;

  if (userId !== id && getUserRole(c) !== 'admin') {
    return c.json({ success: false, error: 'Forbidden' }, 403);
  }

  try {
    await c.env.DB.prepare(`
      UPDATE users SET house = ?, updated_at = datetime('now') WHERE id = ?
    `).bind(houseId, id).run();

    return c.json({ success: true, data: { userId: id, houseId } });
  } catch {
    return c.json({ success: false, error: 'Failed to update house' }, 500);
  }
});

// =====================
// BATTLE PROTECTED ENDPOINTS
// =====================

// Create a new battle (challenge)
protectedApp.post('/battles', async (c) => {
  const { subjectId, difficulty, questionCount } = await c.req.json();
  const userId = getUserId(c)!;

  try {
    // Fetch random questions for the battle
    let questionsQuery = `
      SELECT q.* FROM questions q
      JOIN subjects s ON s.id = q.subject_id AND s.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      WHERE q.question_type IN ('multiple_choice', 'direct_answer')
    `;
    const params: (string | number)[] = [];

    if (subjectId) {
      questionsQuery += ' AND q.subject_id = ?';
      params.push(subjectId);
    }
    if (difficulty) {
      questionsQuery += ' AND q.difficulty = ?';
      params.push(difficulty);
    }

    questionsQuery += ` ORDER BY RANDOM() LIMIT ?`;
    params.push(questionCount || 10);

    const { results: questions } = await c.env.DB.prepare(questionsQuery).bind(...params).all();

    // Parse and transform options to proper format
    const parsedQuestions = questions.map((q: Record<string, unknown>) => ({
      ...q,
      options: transformQuestionOptions(q.options, q.correct_answer as string),
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
  } catch {
    return c.json({ success: false, error: 'Failed to create battle' }, 500);
  }
});

// Join a battle
protectedApp.post('/battles/:id/join', async (c) => {
  const battleId = c.req.param('id');
  const userId = getUserId(c)!;

  const now = new Date().toISOString();
  try {
    // Check if battle exists and is waiting
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'waiting'
        AND (expires_at IS NULL OR expires_at > ?)
    `).bind(battleId, now).first();

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
  } catch {
    return c.json({ success: false, error: 'Failed to join battle' }, 500);
  }
});

// Submit answer in battle
protectedApp.post('/battles/:id/answer', async (c) => {
  const battleId = c.req.param('id');
  const { questionIndex, answer, timeTaken } = await c.req.json();
  const userId = getUserId(c)!;

  const now = new Date().toISOString();
  try {
    // Get battle
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status = 'active'
        AND (expires_at IS NULL OR expires_at > ?)
    `).bind(battleId, now).first();

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

    // Check answer using normalized comparison
    const { userNormalized, correctNormalized } = normalizeAnswerForComparison(
      answer,
      question.correct_answer
    );
    const isCorrect = userNormalized === correctNormalized;
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
      `).bind(battleId).first<{ challenger_score: number; opponent_score: number; challenger_id: string; opponent_id: string }>();

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
  } catch {
    return c.json({ success: false, error: 'Failed to submit answer' }, 500);
  }
});

// Cancel/forfeit battle
protectedApp.post('/battles/:id/cancel', async (c) => {
  const battleId = c.req.param('id');
  const userId = getUserId(c)!;

  const now = new Date().toISOString();
  try {
    const battle = await c.env.DB.prepare(`
      SELECT * FROM battles WHERE id = ? AND status IN ('waiting', 'active')
        AND (expires_at IS NULL OR expires_at > ?)
    `).bind(battleId, now).first();

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
  } catch {
    return c.json({ success: false, error: 'Failed to cancel battle' }, 500);
  }
});

// Get user's battle history: served by the app-level route registered before
// the publicApp mount (see above `app.route('/api', publicApp)`), because
// publicApp's `/battles/:id` param route would shadow a protectedApp copy.

// =============================================
// PAPER ATTEMPT ENDPOINTS (Timed Practice)
// =============================================

// Get user's paper attempts history: served by the app-level route registered
// before the publicApp mount (see above `app.route('/api', publicApp)`),
// because publicApp's `/papers/:id` param route would shadow a protectedApp
// copy (same pattern as /battles/history).

// Start a paper attempt
protectedApp.post('/papers/:id/attempt', async (c) => {
  const paperId = c.req.param('id');
  const userId = getUserId(c)!;

  try {
    // Get paper info
    const paper = await c.env.DB.prepare(`
      SELECT pp.*, pt.typical_duration
      FROM past_papers pp
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      JOIN subjects s ON s.id = pp.subject_id AND s.is_active = 1
      WHERE pp.id = ?
    `).bind(paperId).first();

    if (!paper) {
      return c.json({ success: false, error: 'Paper not found' }, 404);
    }

    const access = await getQuestionReadContext(c, String(paper.subject_id), undefined);
    if ('response' in access) return access.response;
    if (Number(paper.is_premium) === 1 && !access.premium) {
      return c.json({
        success: false,
        error: 'This past paper requires an active premium plan.',
        code: 'PAPER_PREMIUM_REQUIRED',
      }, 403);
    }

    // Auto-abandon stale attempts older than 24 hours for this user
    await c.env.DB.prepare(`
      UPDATE paper_attempts
      SET status = 'abandoned'
      WHERE user_id = ? AND status = 'in_progress'
      AND datetime(started_at) < datetime('now', '-24 hours')
    `).bind(userId).run();

    // Check for existing in-progress attempt (only recent ones now)
    const existing = await c.env.DB.prepare(`
      SELECT id, started_at FROM paper_attempts
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
    console.error('Paper attempt error:', error); // detail stays in logs
    return c.json({ success: false, error: 'Failed to start paper attempt' }, 500);
  }
});

// Abandon existing paper attempt
protectedApp.post('/papers/:id/abandon', async (c) => {
  const paperId = c.req.param('id');
  const userId = getUserId(c)!;

  try {
    await c.env.DB.prepare(`
      UPDATE paper_attempts
      SET status = 'abandoned'
      WHERE user_id = ? AND paper_id = ? AND status = 'in_progress'
    `).bind(userId, paperId).run();

    return c.json({ success: true, message: 'Attempt abandoned' });
  } catch (error) {
    console.error('Abandon attempt error:', error);
    return c.json({ success: false, error: 'Failed to abandon attempt' }, 500);
  }
});

// Save answer for paper attempt
protectedApp.put('/papers/attempts/:attemptId/answer', async (c) => {
  const attemptId = c.req.param('attemptId');
  const body = await parseJsonBody(c);
  const questionId = typeof body?.questionId === 'string' ? body.questionId.trim() : '';
  const answer = typeof body?.answer === 'string' ? body.answer : null;
  const rawTimeTaken = body?.timeTaken ?? 0;
  const timeTaken = typeof rawTimeTaken === 'number' ? rawTimeTaken : Number.NaN;
  const userId = getUserId(c)!;

  if (
    !questionId
    || answer === null
    || answer.length > MAX_QUESTION_ANSWER_LENGTH
    || !Number.isFinite(timeTaken)
    || timeTaken < 0
  ) {
    return c.json({ success: false, error: 'Invalid paper answer' }, 400);
  }

  try {
    // Authorize both the attempt owner and the question's membership in the
    // attempt's paper. A valid question from another paper must fail closed.
    const membership = await c.env.DB.prepare(`
      SELECT pa.id, pa.paper_id, q.id AS question_id
      FROM paper_attempts pa
      JOIN questions q ON q.past_paper_id = pa.paper_id AND q.id = ?
      JOIN subjects question_subject
        ON question_subject.id = q.subject_id AND question_subject.is_active = 1
      JOIN topics question_topic
        ON question_topic.id = q.topic_id AND question_topic.subject_id = q.subject_id
      WHERE pa.id = ? AND pa.user_id = ? AND pa.status = 'in_progress'
    `).bind(questionId, attemptId, userId).first();

    if (!membership) {
      return c.json({ success: false, error: 'Attempt or question not found' }, 404);
    }

    const answerId = `paa_${crypto.randomUUID()}`;
    const demoFlags = getDemoDataFlags(userId);
    await c.env.DB.prepare(`
      INSERT INTO paper_attempt_answers (
        id, paper_attempt_id, question_id, user_answer, time_taken,
        is_demo_data, expires_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(paper_attempt_id, question_id) DO UPDATE SET
        user_answer = excluded.user_answer,
        time_taken = excluded.time_taken,
        answered_at = datetime('now')
    `).bind(
      answerId,
      attemptId,
      questionId,
      answer,
      Math.round(timeTaken),
      demoFlags.is_demo_data,
      demoFlags.expires_at,
    ).run();

    return c.json({ success: true, data: { saved: true } });
  } catch (error) {
    console.error('Save paper answer error:', error);
    return c.json({ success: false, error: 'Failed to save answer' }, 500);
  }
});

// =============================================
// THEORY MARKING (shared marker for paper submits, /remark, and essays)
// =============================================

export const THEORY_MARKING_TIMEOUT_MS = 25_000;

export interface StructuredPartInput {
  part_label: string;
  part_text: string;
  marks: number;
  correct_answer: string;
}

export interface TheoryQuestionContext {
  questionType: string;
  questionText: string;
  marks: number;
  subjectName: string | null;
  correctAnswer: string | null;
  markingScheme: unknown;
  markingRubric: string | null;
  modelAnswer: string | null;
  requiredPoints: unknown;
  optionalPoints: unknown;
  structuredParts: StructuredPartInput[];
  wordLimits?: { min: number | null; max: number | null } | null;
}

export function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return Promise.race([
    promise,
    new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timed out after ${ms}ms`)), ms)),
  ]);
}

/**
 * Mark one theory answer against its marking scheme (or generic WAEC
 * criteria when no scheme exists). Every content field — scheme, model
 * answer, and the student answer — is untrusted data, never instructions.
 * Unparseable model output throws: a marking failure, not a guessed score.
 */
export async function gradeTheoryAnswer(
  env: Env,
  question: TheoryQuestionContext,
  studentAnswer: string,
): Promise<TheoryMarking> {
  const systemPrompt = `You are an experienced WAEC examiner marking a ${question.questionType} answer. Award marks strictly against the supplied marking points when they exist, otherwise against standard WAEC expectations for the question's mark allocation. Be fair, specific, and constructive.
${UNTRUSTED_AI_DATA_INSTRUCTION}

Return ONLY a JSON object with this structure:
{
  "score": number,
  "maxScore": number,
  "perPoint": [{"point": "string", "awarded": number, "maxMarks": number, "comment": "string"}],
  "feedback": "string",
  "strengths": ["string"],
  "improvements": ["string"]
}`;

  const userPrompt = `${formatUntrustedAiData('Marking inputs', {
    subject: question.subjectName,
    questionType: question.questionType,
    totalMarks: question.marks,
    question: question.questionText,
    markingScheme: question.markingScheme,
    markingRubric: question.markingRubric,
    modelAnswer: question.modelAnswer,
    requiredPoints: question.requiredPoints,
    optionalPoints: question.optionalPoints,
    structuredParts: question.structuredParts,
    expectedAnswer: question.correctAnswer,
    ...(question.wordLimits ? { wordLimits: question.wordLimits } : {}),
  })}

${formatUntrustedAiData('Student answer', studentAnswer)}

Mark the student answer using only the supplied data.`;

  const response = await callTextModel(env, {
    model: getMarkingModel(env),
    system: systemPrompt,
    user: userPrompt,
    maxTokens: 2048,
    temperature: 0.2,
  });

  const parsed = extractJsonObject(response);
  if (parsed === null) {
    console.error('Theory marking returned no JSON object; raw excerpt:', response.slice(0, 500));
    throw new Error('Theory marking output contained no JSON object');
  }
  try {
    return normalizeTheoryMarking(parsed, question.marks);
  } catch (error) {
    console.error('Theory marking failed normalization; raw excerpt:', response.slice(0, 500));
    throw error;
  }
}

/** Adapt the theory-marking contract to the legacy essay feedback shape
    (overallScore/overallFeedback/criteriaScores/strengths/areasForImprovement/
    suggestions) that essay_attempts consumers and EssayFeedback UI read. */
export function theoryMarkingToEssayFeedback(marking: TheoryMarking): Record<string, unknown> {
  return {
    overallScore: marking.score,
    overallFeedback: marking.feedback,
    criteriaScores: marking.perPoint.map((p) => ({
      criterionName: p.point,
      score: p.awarded,
      maxScore: p.maxMarks,
      feedback: p.comment,
    })),
    strengths: marking.strengths,
    areasForImprovement: marking.improvements,
    suggestions: marking.improvements,
  };
}

const MARKING_CONCURRENCY = 4;

type MarkingOutcome =
  | { answerId: string; kind: 'graded'; marking: TheoryMarking }
  | { answerId: string; kind: 'marking_failed' };

function parseJsonColumn(v: unknown): unknown {
  if (typeof v !== 'string' || v.length === 0) return null;
  try { return JSON.parse(v); } catch { return null; }
}

/** Structured parts for the given answer rows, one grouped query. */
async function loadStructuredParts(
  db: D1Database,
  attemptId: string,
): Promise<Map<string, StructuredPartInput[]>> {
  const byQuestion = new Map<string, StructuredPartInput[]>();
  const { results: parts } = await db.prepare(`
    SELECT sqp.question_id, sqp.part_label, sqp.part_text, sqp.marks, sqp.correct_answer
    FROM structured_question_parts sqp
    JOIN paper_attempt_answers paa ON paa.question_id = sqp.question_id
    WHERE paa.paper_attempt_id = ?
    ORDER BY sqp.display_order
  `).bind(attemptId).all<StructuredPartInput & { question_id: string }>();
  for (const p of parts) {
    const list = byQuestion.get(p.question_id) ?? [];
    list.push({
      part_label: p.part_label, part_text: p.part_text,
      marks: p.marks, correct_answer: p.correct_answer,
    });
    byQuestion.set(p.question_id, list);
  }
  return byQuestion;
}

/**
 * Mark theory answer rows in bounded parallel (4 at a time, per-call
 * timeout). Each outcome maps to a paper_attempt_answers update; failures
 * are 'marking_failed', never a fabricated score.
 */
async function markTheoryAnswers(
  env: Env,
  db: D1Database,
  answers: Record<string, unknown>[],
  attemptId: string,
  userId: string,
): Promise<{ outcomes: MarkingOutcome[]; statements: D1PreparedStatement[] }> {
  if (answers.length === 0) return { outcomes: [], statements: [] };
  const demoFlags = getDemoDataFlags(userId);
  // Only pay the parts query when a structured question is present.
  const partsByQuestion = answers.some((a) => String(a.question_type) === 'structured')
    ? await loadStructuredParts(db, attemptId)
    : new Map<string, StructuredPartInput[]>();

  const markOne = async (a: Record<string, unknown>): Promise<MarkingOutcome> => {
    try {
      const marking = await withTimeout(
        gradeTheoryAnswer(env, {
          questionType: String(a.question_type),
          questionText: String(a.question_text ?? ''),
          marks: Number(a.marks) || 0,
          subjectName: (a.subject_name as string) ?? null,
          correctAnswer: (a.correct_answer as string) ?? null,
          markingScheme: parseJsonColumn(a.marking_scheme),
          markingRubric: (a.marking_rubric as string) ?? null,
          modelAnswer: (a.model_answer as string) ?? null,
          requiredPoints: parseJsonColumn(a.required_points),
          optionalPoints: parseJsonColumn(a.optional_points),
          structuredParts: partsByQuestion.get(String(a.question_id)) ?? [],
        }, String(a.user_answer)),
        THEORY_MARKING_TIMEOUT_MS,
        `marking answer ${a.id}`,
      );
      return { answerId: String(a.id), kind: 'graded', marking };
    } catch (error) {
      console.error(`Theory marking failed for answer ${a.id}:`, error);
      return { answerId: String(a.id), kind: 'marking_failed' };
    }
  };

  const outcomes: MarkingOutcome[] = [];
  for (let i = 0; i < answers.length; i += MARKING_CONCURRENCY) {
    const settled = await Promise.allSettled(
      answers.slice(i, i + MARKING_CONCURRENCY).map(markOne),
    );
    for (const s of settled) {
      if (s.status === 'fulfilled') outcomes.push(s.value);
    }
  }

  const statements: D1PreparedStatement[] = [];
  for (const outcome of outcomes) {
    const a = answers.find((row) => String(row.id) === outcome.answerId);
    if (outcome.kind === 'graded') {
      statements.push(db.prepare(`
        UPDATE paper_attempt_answers
        SET marking_status = 'graded', ai_score = ?, ai_feedback = ?, marks_earned = ?
        WHERE id = ? AND paper_attempt_id = ?
      `).bind(
        outcome.marking.score, JSON.stringify(outcome.marking), outcome.marking.score,
        outcome.answerId, attemptId,
      ));
      // Paper-sit essays also land in the essay pipeline so they surface in
      // essay history; paper_attempt_id links them back to this attempt.
      // grading_status 'completed': prod's essay_attempts CHECK accepts only
      // pending/grading/completed/failed (verified against sqlite_master).
      if (a && String(a.question_type) === 'essay') {
        statements.push(db.prepare(`
          INSERT INTO essay_attempts (
            id, user_id, question_id, paper_attempt_id, answer_text,
            grading_type, grading_status, ai_score, ai_feedback, final_score,
            ai_graded_at, is_demo_data, expires_at
          ) VALUES (?, ?, ?, ?, ?, 'ai', 'completed', ?, ?, ?, datetime('now'), ?, ?)
        `).bind(
          `ea_${crypto.randomUUID()}`,
          userId,
          String(a.question_id),
          attemptId,
          String(a.user_answer),
          outcome.marking.score,
          JSON.stringify(theoryMarkingToEssayFeedback(outcome.marking)),
          outcome.marking.score,
          demoFlags.is_demo_data,
          demoFlags.expires_at,
        ));
      }
    } else {
      statements.push(db.prepare(`
        UPDATE paper_attempt_answers SET marking_status = 'marking_failed'
        WHERE id = ? AND paper_attempt_id = ?
      `).bind(outcome.answerId, attemptId));
    }
  }

  return { outcomes, statements };
}

const WAEC_GRADE_BANDS: ReadonlyArray<readonly [string, number]> = [
  ['A1', 75], ['B2', 70], ['B3', 65], ['C4', 60], ['C5', 55],
  ['C6', 50], ['D7', 45], ['E8', 40], ['F9', 0],
];

/** Deterministic WAEC percentage-band fallback when no boundary row exists. */
export function waecGradeForPercentage(percentage: number): string {
  const pct = Number.isFinite(percentage) ? percentage : 0;
  for (const [grade, threshold] of WAEC_GRADE_BANDS) {
    if (pct >= threshold) return grade;
  }
  return 'F9';
}

/**
 * Grade for an attempt: grade_boundaries rows (highest threshold ≤ the
 * attempt percentage wins; below the lowest threshold → lowest listed grade)
 * when the paper's specification/session/year match, else WAEC bands.
 */
export async function computeAttemptGrade(
  db: D1Database,
  paper: {
    specification_id: string | null;
    paper_component_id: string | null;
    session: string | null;
    year: number | null;
  },
  percentage: number,
): Promise<string> {
  if (paper.specification_id && paper.session && paper.year) {
    const { results } = await db.prepare(`
      SELECT grade, percentage FROM grade_boundaries
      WHERE specification_id = ? AND session = ? AND year = ?
        AND (paper_component_id = ? OR (paper_component_id IS NULL AND ? IS NULL))
        AND percentage IS NOT NULL
      ORDER BY percentage DESC
    `).bind(
      paper.specification_id, paper.session, paper.year,
      paper.paper_component_id, paper.paper_component_id,
    ).all<{ grade: string; percentage: number }>();
    for (const row of results) {
      if (percentage >= Number(row.percentage)) return String(row.grade);
    }
    if (results.length > 0) return String(results[results.length - 1].grade);
  }
  return waecGradeForPercentage(percentage);
}

/**
 * Recompute an attempt's totals and status from its current answer rows.
 * Totals = objective marks_earned + theory ai_score for 'graded' answers.
 * (Task 9 extends this helper to also compute and write paper_attempts.grade.)
 */
async function finalizeAttemptMarking(
  db: D1Database,
  attemptId: string,
  userId: string,
): Promise<{ status: 'graded' | 'partially_graded'; pending: number; failed: number; totalScore: number; grade: string }> {
  const { results: rows } = await db.prepare(`
    SELECT paa.marks_earned, paa.ai_score, paa.marking_status, q.question_type
    FROM paper_attempt_answers paa
    JOIN questions q ON q.id = paa.question_id
    WHERE paa.paper_attempt_id = ?
  `).bind(attemptId).all<Record<string, unknown>>();

  let totalScore = 0;
  let pending = 0;
  let failed = 0;
  for (const row of rows) {
    const status = row.marking_status as string | null;
    if (status === 'pending') pending += 1;
    else if (status === 'marking_failed') failed += 1;
    else if (status === 'graded') totalScore += Number(row.ai_score) || 0;
    else totalScore += Number(row.marks_earned) || 0; // objective / unmarked
  }

  const attempt = await db.prepare(`
    SELECT pp.total_marks, pp.specification_id, pp.paper_component_id, pp.session, pp.year
    FROM paper_attempts pa
    JOIN past_papers pp ON pa.paper_id = pp.id
    WHERE pa.id = ?
  `).bind(attemptId).first<{
    total_marks: number | null;
    specification_id: string | null;
    paper_component_id: string | null;
    session: string | null;
    year: number | null;
  }>();
  const totalMarks = Number(attempt?.total_marks) || 0;
  const percentage = totalMarks > 0 ? Math.round((totalScore / totalMarks) * 100) : 0;
  const status = pending === 0 && failed === 0 ? 'graded' : 'partially_graded';
  const grade = await computeAttemptGrade(db, {
    specification_id: attempt?.specification_id ?? null,
    paper_component_id: attempt?.paper_component_id ?? null,
    session: attempt?.session ?? null,
    year: attempt?.year ?? null,
  }, percentage);

  await db.prepare(`
    UPDATE paper_attempts
    SET status = ?, total_score = ?, max_score = ?, percentage = ?, grade = ?
    WHERE id = ? AND user_id = ?
  `).bind(status, totalScore, totalMarks, percentage, grade, attemptId, userId).run();

  return { status, pending, failed, totalScore, grade };
}

/**
 * Best-effort per-topic analytics for a graded paper attempt. Runs the
 * canonical question_attempts + user_progress pipeline (attempt-progress.ts)
 * and increments topic_mastery counters. Failures are logged, never thrown.
 */
async function writePaperAnalytics(
  env: Env,
  attemptId: string,
  userId: string,
  questionIds?: string[],
): Promise<void> {
  if (questionIds && questionIds.length === 0) return;
  try {
    const filter = questionIds
      ? ` AND paa.question_id IN (${questionIds.map(() => '?').join(',')})`
      : '';
    const { results: rows } = await env.DB.prepare(`
      SELECT paa.question_id, paa.user_answer, paa.is_correct, paa.time_taken,
             paa.marks_earned, paa.ai_score, paa.marking_status,
             q.topic_id, q.marks, q.points, q.exam_type_id
      FROM paper_attempt_answers paa
      JOIN questions q ON q.id = paa.question_id
      WHERE paa.paper_attempt_id = ?${filter}
    `).bind(attemptId, ...(questionIds ?? [])).all<Record<string, unknown>>();

    const attempt = await env.DB.prepare(`
      SELECT et.slug AS exam_type_slug, pp.exam_type_id
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      JOIN exam_types et ON et.id = pp.exam_type_id
      WHERE pa.id = ?
    `).bind(attemptId).first<{ exam_type_slug: string; exam_type_id: string }>();
    if (!attempt) return;

    const now = new Date().toISOString();
    const statements: D1PreparedStatement[] = [];
    for (const row of rows) {
      if (!row.topic_id) continue;
      const isTheory = row.marking_status !== null && row.marking_status !== undefined;
      if (isTheory && row.marking_status !== 'graded') continue; // pending/failed: no outcome yet
      const marks = Number(row.marks) || 0;
      const isCorrect = isTheory
        ? marks > 0 && (Number(row.ai_score) || 0) >= 0.5 * marks
        : Number(row.is_correct) === 1;
      const prepared = await prepareAttemptProgress(env.DB, {
        userId,
        questionId: String(row.question_id),
        topicId: String(row.topic_id),
        examTypeId: (row.exam_type_id as string) ?? null,
        userAnswer: String(row.user_answer ?? ''),
        isCorrect,
        timeTaken: Number(row.time_taken) || 0,
        points: Number(row.points) || 0,
        now,
      });
      statements.push(...prepared.statements);
      statements.push(env.DB.prepare(`
        INSERT INTO topic_mastery (
          id, user_id, topic_id, exam_type, mastery_level,
          practice_questions_attempted, practice_questions_correct,
          created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, 1, ?, ?, ?)
        ON CONFLICT(user_id, topic_id, exam_type) DO UPDATE SET
          practice_questions_attempted = practice_questions_attempted + 1,
          practice_questions_correct = practice_questions_correct + excluded.practice_questions_correct,
          mastery_level = ROUND(100.0 * (practice_questions_correct + excluded.practice_questions_correct) / (practice_questions_attempted + 1), 1),
          updated_at = excluded.updated_at
      `).bind(
        `tm_${crypto.randomUUID()}`,
        userId,
        String(row.topic_id),
        attempt.exam_type_slug,
        isCorrect ? 100 : 0,
        isCorrect ? 1 : 0,
        now,
        now,
      ));
    }
    if (statements.length > 0) await env.DB.batch(statements);
  } catch (error) {
    console.error(`Paper analytics write failed for attempt ${attemptId}:`, error);
  }
}

// Submit paper attempt
protectedApp.post('/papers/attempts/:attemptId/submit', async (c) => {
  const attemptId = c.req.param('attemptId');
  const body = await parseJsonBody(c);
  const rawTimeUsed = body?.timeUsed ?? 0;
  const timeUsed = typeof rawTimeUsed === 'number' ? rawTimeUsed : Number.NaN;
  const userId = getUserId(c)!;

  if (!Number.isFinite(timeUsed) || timeUsed < 0 || timeUsed > 24 * 60 * 60) {
    return c.json({ success: false, error: 'Invalid time used' }, 400);
  }

  try {
    const attempt = await c.env.DB.prepare(`
      SELECT pa.*, pp.total_marks, pp.specification_id, pp.paper_component_id, pp.session, pp.year,
             pp.exam_type_id, et.slug AS exam_type_slug
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      JOIN exam_types et ON et.id = pp.exam_type_id
      WHERE pa.id = ? AND pa.user_id = ? AND pa.status = 'in_progress'
    `).bind(attemptId, userId).first<Record<string, unknown>>();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or already submitted' }, 404);
    }
    // Server-side time authority: the client timer is UX only. 5-minute grace
    // covers submission latency; TakePaper auto-submits at 0:00 so honest
    // users never hit this.
    const timeAllowedMinutes = Number(attempt.time_allowed) || 0;
    if (timeAllowedMinutes > 0 && timeUsed > timeAllowedMinutes * 60 + 300) {
      return c.json({
        success: false,
        error: 'Time limit exceeded',
        code: 'time_limit_exceeded',
      }, 400);
    }

    const { results: answers } = await c.env.DB.prepare(`
      SELECT paa.*, q.correct_answer, q.marks, q.question_type, q.options,
            q.question_text, q.topic_id, q.points, s.name AS subject_name,
            eq.marking_scheme, eq.marking_rubric, eq.model_answer,
            eq.required_points, eq.optional_points
      FROM paper_attempt_answers paa
      JOIN paper_attempts pa ON pa.id = paa.paper_attempt_id
      JOIN questions q ON q.id = paa.question_id AND q.past_paper_id = pa.paper_id
      JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN essay_questions eq ON eq.question_id = q.id
      WHERE paa.paper_attempt_id = ?
      ORDER BY q.section, q.question_number
    `).bind(attemptId).all<Record<string, unknown>>();

    let totalScore = 0;
    const gradeStatements: D1PreparedStatement[] = [];

    for (const answerRow of answers) {
      const isObjective = ['multiple_choice', 'true_false'].includes(String(answerRow.question_type));
      if (!isObjective) continue;

      const isCorrect = isSubmittedAnswerCorrect(
        answerRow.question_type,
        answerRow.options,
        String(answerRow.user_answer ?? ''),
        String(answerRow.correct_answer ?? ''),
      );
      const marks = Number(answerRow.marks) || 0;
      const marksEarned = isCorrect ? marks : 0;
      totalScore += marksEarned;

      gradeStatements.push(c.env.DB.prepare(`
        UPDATE paper_attempt_answers
        SET is_correct = ?, marks_earned = ?
        WHERE id = ? AND paper_attempt_id = ?
      `).bind(isCorrect ? 1 : 0, marksEarned, answerRow.id, attemptId));
    }

    const THEORY_TYPES = new Set(['essay', 'structured', 'short_answer', 'calculation', 'direct_answer', 'comprehension']);

    const theoryAnswers = answers.filter((a) =>
      THEORY_TYPES.has(String(a.question_type)) && String(a.user_answer ?? '').trim().length > 0);

    let markingUnavailable = false;
    let payable = 0;
    if (theoryAnswers.length > 0) {
      const user = await c.env.DB.prepare(`
        SELECT u.ai_grading_credits, st.ai_grading_quota
        FROM users u
        LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
        WHERE u.id = ?
      `).bind(userId).first<{ ai_grading_credits: number | null; ai_grading_quota: number | null }>();
      const quota = Number(user?.ai_grading_quota) || 0;
      const credits = Number(user?.ai_grading_credits) || 0;

      if (quota === 0) {
        markingUnavailable = true; // tier has no AI grading — never fail the submit
      } else if (quota === -1) {
        payable = theoryAnswers.length; // unlimited tier: no deduction
      } else {
        payable = Math.min(theoryAnswers.length, credits);
        if (payable > 0) {
          const deduction = await c.env.DB.prepare(`
            UPDATE users SET ai_grading_credits = ai_grading_credits - ?
            WHERE id = ? AND ai_grading_credits >= ?
          `).bind(payable, userId, payable).run();
          if (deduction.meta.changes !== 1) {
            // Concurrent spend won the race: mark nothing, leave all pending
            // (retryable via /remark), never mark for free.
            console.error(`Credit deduction raced for user ${userId}; leaving theory pending`);
            payable = 0;
          }
        }
      }
    }

    // Mark every theory answer with content as pending up front so the
    // lifecycle is visible even when nothing is payable.
    for (const a of theoryAnswers) {
      gradeStatements.push(c.env.DB.prepare(`
        UPDATE paper_attempt_answers SET marking_status = 'pending'
        WHERE id = ? AND paper_attempt_id = ?
      `).bind(a.id, attemptId));
    }

    const paidTheory = theoryAnswers.slice(0, payable); // question order preserved

    const { outcomes, statements: markingStatements } =
      await markTheoryAnswers(c.env, c.env.DB, paidTheory, attemptId, userId);
    gradeStatements.push(...markingStatements);
    const gradedCount = outcomes.filter((o) => o.kind === 'graded').length;
    const failedCount = outcomes.filter((o) => o.kind === 'marking_failed').length;
    const theoryScore = outcomes.reduce(
      (sum, o) => sum + (o.kind === 'graded' ? o.marking.score : 0), 0,
    );
    totalScore += theoryScore;
    const pendingCount = theoryAnswers.length - gradedCount - failedCount;
    const attemptStatus =
      theoryAnswers.length === 0 || (gradedCount === theoryAnswers.length)
        ? 'graded'
        : 'partially_graded';

    const totalMarks = Number(attempt.total_marks) || 0;
    const percentageScore = totalMarks > 0
      ? Math.round((totalScore / totalMarks) * 100)
      : 0;
    const grade = await computeAttemptGrade(c.env.DB, {
      specification_id: (attempt.specification_id as string) ?? null,
      paper_component_id: (attempt.paper_component_id as string) ?? null,
      session: (attempt.session as string) ?? null,
      year: attempt.year === null || attempt.year === undefined ? null : Number(attempt.year),
    }, percentageScore);

    gradeStatements.push(c.env.DB.prepare(`
      UPDATE paper_attempts
      SET status = ?, time_used = ?, total_score = ?, max_score = ?,
          percentage = ?, grade = ?, submitted_at = datetime('now')
      WHERE id = ? AND user_id = ? AND status = 'in_progress'
    `).bind(attemptStatus, Math.round(timeUsed), totalScore, totalMarks, percentageScore, grade, attemptId, userId));

    await c.env.DB.batch(gradeStatements);

    await writePaperAnalytics(c.env, attemptId, userId);

    return c.json({
      success: true,
      data: {
        attemptId,
        totalScore,
        totalMarks,
        percentageScore,
        status: attemptStatus,
        grade,
        markingStatus: {
          theoryTotal: theoryAnswers.length,
          graded: gradedCount,
          failed: failedCount,
          pending: pendingCount,
        },
        ...(markingUnavailable ? { markingUnavailable: true } : {}),
      },
    });
  } catch (error) {
    console.error('Submit paper attempt error:', error);
    return c.json({ success: false, error: 'Failed to submit paper' }, 500);
  }
});

// Retry marking for failed/unpaid theory answers
protectedApp.post('/papers/attempts/:attemptId/remark', async (c) => {
  const attemptId = c.req.param('attemptId');
  const userId = getUserId(c)!;

  try {
    const attempt = await c.env.DB.prepare(`
      SELECT pa.*, pp.total_marks
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      WHERE pa.id = ? AND pa.status IN ('graded', 'partially_graded')
    `).bind(attemptId).first<Record<string, unknown>>();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found or not yet submitted' }, 404);
    }

    // IDOR guard: only the attempt's owner (or an admin) may trigger remarking
    // (same pattern as the essay grader).
    if (attempt.user_id !== userId && getUserRole(c) !== 'admin') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }

    const { results: retryable } = await c.env.DB.prepare(`
      SELECT paa.*, q.question_type, q.question_text, q.marks, q.correct_answer,
             q.topic_id, q.points, s.name AS subject_name,
             eq.marking_scheme, eq.marking_rubric, eq.model_answer,
             eq.required_points, eq.optional_points
      FROM paper_attempt_answers paa
      JOIN paper_attempts pa ON pa.id = paa.paper_attempt_id
      JOIN questions q ON q.id = paa.question_id AND q.past_paper_id = pa.paper_id
      JOIN subjects s ON s.id = q.subject_id
      LEFT JOIN essay_questions eq ON eq.question_id = q.id
      WHERE paa.paper_attempt_id = ? AND paa.marking_status IN ('marking_failed', 'pending')
      ORDER BY q.section, q.question_number
    `).bind(attemptId).all<Record<string, unknown>>();

    // Idempotent: nothing retryable → return current state.
    if (retryable.length === 0) {
      return c.json({
        success: true,
        data: { attemptId, status: attempt.status, remarked: 0, failed: 0, remaining: 0 },
      });
    }

    const failedAnswers = retryable.filter((a) => a.marking_status === 'marking_failed');
    const pendingAnswers = retryable.filter((a) => a.marking_status === 'pending');

    // Failed re-marks are free (paid at submit); pending need credits.
    let paidPending: Record<string, unknown>[] = [];
    if (pendingAnswers.length > 0) {
      const user = await c.env.DB.prepare(`
        SELECT u.ai_grading_credits, st.ai_grading_quota
        FROM users u
        LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
        WHERE u.id = ?
      `).bind(attempt.user_id).first<{ ai_grading_credits: number | null; ai_grading_quota: number | null }>();
      const quota = Number(user?.ai_grading_quota) || 0;
      const credits = Number(user?.ai_grading_credits) || 0;
      const payable = quota === -1 ? pendingAnswers.length
        : quota > 0 ? Math.min(pendingAnswers.length, credits)
        : 0;
      if (payable > 0 && quota !== -1) {
        const deduction = await c.env.DB.prepare(`
          UPDATE users SET ai_grading_credits = ai_grading_credits - ?
          WHERE id = ? AND ai_grading_credits >= ?
        `).bind(payable, attempt.user_id, payable).run();
        if (deduction.meta.changes === 1) {
          paidPending = pendingAnswers.slice(0, payable);
        } // raced deduction → mark none; they stay pending
      } else if (quota === -1) {
        paidPending = pendingAnswers;
      }
    }

    const toMark = [...failedAnswers, ...paidPending];

    // Shared fan-out — one marker, two entry points (submit and remark).
    const { outcomes, statements } = await markTheoryAnswers(c.env, c.env.DB, toMark, attemptId, String(attempt.user_id));
    // Nothing payable and nothing failed → nothing to persist; D1 rejects an
    // empty batch ("No SQL statements detected"), so skip it and report the
    // honest remainder instead of erroring.
    if (statements.length > 0) await c.env.DB.batch(statements);

    const remarked = outcomes.filter((o) => o.kind === 'graded').length;
    const failed = outcomes.filter((o) => o.kind === 'marking_failed').length;

    // Recompute totals + status from the full answer set.
    const final = await finalizeAttemptMarking(c.env.DB, attemptId, String(attempt.user_id));

    // Analytics only for answers this call transitioned to 'graded' — answers
    // graded at submit were already written, and graded answers are never
    // re-marked, so no double-count path exists.
    const gradedQuestionIds = outcomes
      .filter((o) => o.kind === 'graded')
      .map((o) => {
        const row = toMark.find((a) => String(a.id) === o.answerId);
        return row ? String(row.question_id) : null;
      })
      .filter((id): id is string => id !== null);
    await writePaperAnalytics(c.env, attemptId, String(attempt.user_id), gradedQuestionIds);

    return c.json({
      success: true,
      data: {
        attemptId,
        status: final.status,
        grade: final.grade,
        remarked,
        failed,
        remaining: final.pending + final.failed,
      },
    });
  } catch (error) {
    console.error('Remark paper attempt error:', error);
    return c.json({ success: false, error: 'Failed to remark paper' }, 500);
  }
});

// Get paper attempt results
protectedApp.get('/papers/attempts/:attemptId/results', async (c) => {
  const attemptId = c.req.param('attemptId');
  // Self-scope only: identity comes from the JWT; no admin query override.
  const userId = getUserId(c)!;

  try {
    const attempt = await c.env.DB.prepare(`
      SELECT pa.*, pa.percentage AS percentage_score, pp.title as paper_title,
             pp.year, s.name as subject_name, pt.name as paper_type_name
      FROM paper_attempts pa
      JOIN past_papers pp ON pa.paper_id = pp.id
      JOIN subjects s ON pp.subject_id = s.id
      JOIN paper_types pt ON pp.paper_type_id = pt.id
      WHERE pa.id = ? AND pa.user_id = ?
    `).bind(attemptId, userId).first<Record<string, unknown>>();

    if (!attempt) {
      return c.json({ success: false, error: 'Attempt not found' }, 404);
    }

    if (attempt.status === 'in_progress') {
      const { results: answers } = await c.env.DB.prepare(`
        SELECT paa.id, paa.paper_attempt_id, paa.question_id,
               paa.user_answer AS answer_text, paa.time_taken, paa.answered_at
        FROM paper_attempt_answers paa
        JOIN questions q ON q.id = paa.question_id AND q.past_paper_id = ?
        WHERE paa.paper_attempt_id = ?
        ORDER BY q.section, q.question_number
      `).bind(attempt.paper_id, attemptId).all();

      return c.json({ success: true, data: { attempt, answers } });
    }

    if (!['submitted', 'graded', 'partially_graded'].includes(String(attempt.status))) {
      return c.json({
        success: false,
        error: 'Results are not available for this attempt',
        code: 'RESULTS_UNAVAILABLE',
      }, 409);
    }

    const { results: answers } = await c.env.DB.prepare(`
      SELECT paa.*, paa.user_answer AS answer_text, q.question_text,
             q.correct_answer, q.explanation, q.marks, q.question_type
      FROM paper_attempt_answers paa
      JOIN questions q ON q.id = paa.question_id AND q.past_paper_id = ?
      WHERE paa.paper_attempt_id = ?
      ORDER BY q.section, q.question_number
    `).bind(attempt.paper_id, attemptId).all();

    return c.json({ success: true, data: { attempt, answers } });
  } catch (error) {
    console.error('Fetch paper results error:', error);
    return c.json({ success: false, error: 'Failed to fetch results' }, 500);
  }
});
// =============================================
// ESSAY SUBMISSION & GRADING ENDPOINTS
// =============================================

// Submit essay for grading
protectedApp.post('/essays/submit', async (c) => {
  // Identity comes only from the verified JWT — a body-supplied userId would
  // let a caller spend another user's AI grading credits.
  const userId = getUserId(c)!;
  const body = await parseJsonBody(c);
  const submission = parseEssaySubmission(body);
  if (!submission) {
    return c.json({ success: false, error: 'Invalid essay submission' }, 400);
  }
  const { questionId, answerText, gradingType, wordCount } = submission;

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
      wantsAIGrading ? 'pending' : 'completed',
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
        gradingStatus: wantsAIGrading ? 'pending' : 'completed',
      },
    });
  } catch {
    return c.json({ success: false, error: 'Failed to submit essay' }, 500);
  }
});

// AI grade essay (triggered after submission)
protectedApp.post('/essays/:attemptId/grade', async (c) => {
  const attemptId = c.req.param('attemptId');

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

    // IDOR guard: only the attempt's owner (or an admin) may trigger grading.
    if (attempt.user_id !== getUserId(c) && getUserRole(c) !== 'admin') {
      return c.json({ success: false, error: 'Forbidden' }, 403);
    }

    if (!c.env.AI) {
      return c.json({ success: false, error: 'AI grading is temporarily unavailable' }, 503);
    }

    // Atomically claim the pending attempt so concurrent requests cannot grade it twice.
    const gradingClaim = await c.env.DB.prepare(`
      UPDATE essay_attempts SET grading_status = 'grading'
      WHERE id = ? AND grading_status = 'pending'
    `).bind(attemptId).run();
    if (gradingClaim.meta.changes !== 1) {
      return c.json({ success: false, error: 'Essay grading is already in progress' }, 409);
    }

    // Shared theory marker; the adapter preserves the legacy feedback shape
    // that essay_attempts consumers and the EssayFeedback UI read.
    const marking = await withTimeout(
      gradeTheoryAnswer(c.env, {
        questionType: 'essay',
        questionText: String(attempt.question_text ?? ''),
        marks: Number(attempt.marks) || 0,
        subjectName: (attempt.subject_name as string) ?? null,
        correctAnswer: null,
        markingScheme: attempt.marking_scheme ? JSON.parse(attempt.marking_scheme as string) : null,
        markingRubric: (attempt.marking_rubric as string) ?? null,
        modelAnswer: null,
        requiredPoints: null,
        optionalPoints: null,
        structuredParts: [],
        wordLimits: {
          min: (attempt.word_limit_min as number) ?? null,
          max: (attempt.word_limit_max as number) ?? null,
        },
      }, String(attempt.answer_text)),
      THEORY_MARKING_TIMEOUT_MS,
      `essay grading ${attemptId}`,
    );
    const aiFeedback = theoryMarkingToEssayFeedback(marking);
    const aiScore = marking.score;

    // Update attempt with grading results
    await c.env.DB.prepare(`
      UPDATE essay_attempts
      SET grading_status = 'completed', ai_score = ?, ai_feedback = ?, final_score = ?, ai_graded_at = datetime('now')
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
  } catch {
    // Update status to failed
    await c.env.DB.prepare(`
      UPDATE essay_attempts SET grading_status = 'failed' WHERE id = ?
    `).bind(attemptId).run();

    return c.json({ success: false, error: 'Failed to grade essay' }, 500);
  }
});

// NOTE: GET /essays/history is served only by the app-level requireAuth
// route registered just before `app.route('/api', publicApp)` above
// (JWT-derived userId, self only). The protectedApp copy was
// removed: publicApp's `/essays/:questionId` param route is registered
// earlier and would shadow it (Hono: first-registered matching route wins).

// =====================
// AI TUTOR ENDPOINTS
// =====================

// AI explain question/answer
protectedApp.post('/ai/explain', async (c) => {
  const { question, userAnswer, correctAnswer, isCorrect, context } = await c.req.json();
  // Identity comes only from verified JWT context (body userId was spoofable).
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // COST CONTROL: per-user daily AI quota
  const quota = await checkRateLimit(c.env.DB, userId, 'ai');
  if (!quota.allowed) {
    return c.json({
      success: false,
      error: 'Daily AI limit reached. Try again tomorrow.',
      code: 'AI_LIMIT_REACHED',
      retryAfter: quota.retryAfter,
    }, 429);
  }

  try {
    const exam = getExamContext(context);
    const systemPrompt = `You are Brilla AI, a helpful tutor for ${exam.examDescription} preparation.
You specialize in ${exam.subjects}.
Be concise (2-3 paragraphs max), encouraging, and focus on helping students understand concepts for their ${exam.examType.toUpperCase()} exams.
${UNTRUSTED_AI_DATA_INSTRUCTION}`;

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

    try {
      explanation = await callTextModel(c.env, {
        model: getChatModel(c.env),
        system: systemPrompt,
        user: userPrompt,
        maxTokens: 1024,
      });
      provider = 'workers-ai';
    } catch (modelError) {
      console.error('AI explain model error:', modelError);
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
  const { message, context, userName, userPersonalization } = await c.req.json();
  // Identity comes only from verified JWT context (body userId was spoofable).
  const userId = getUserId(c);
  if (!userId) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }

  // COST CONTROL: per-user daily AI quota
  const quota = await checkRateLimit(c.env.DB, userId, 'ai');
  if (!quota.allowed) {
    return c.json({
      success: false,
      error: 'Daily AI limit reached. Try again tomorrow.',
      code: 'AI_LIMIT_REACHED',
      retryAfter: quota.retryAfter,
    }, 429);
  }

  try {
    const exam = getExamContext(context);
    const displayName = userName || userPersonalization?.preferredName || userPersonalization?.name;

    const systemPrompt = `You are Brilla AI, a warm, encouraging, and personable tutor for ${exam.examName} preparation.
You specialize in ${exam.subjects}.

PERSONALITY & COMMUNICATION STYLE:
- Be warm, friendly, and genuinely caring - like a supportive older sibling or favorite teacher
- Use the student's name naturally when it is supplied in the untrusted profile data
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

${UNTRUSTED_AI_DATA_INSTRUCTION}`;

    const userPrompt = `${formatUntrustedAiData('Student profile and current context', {
      displayName: displayName || null,
      context: context || null,
      weakAreas: userPersonalization?.weakAreas || [],
      strengths: userPersonalization?.strengths || [],
    })}

Student message:
${String(message || '').slice(0, 4000)}`;

    let response: string;
    let provider: string;

    try {
      response = await callTextModel(c.env, {
        model: getChatModel(c.env),
        system: systemPrompt,
        user: userPrompt,
        maxTokens: 1024,
      });
      provider = 'workers-ai';
    } catch (modelError) {
      console.error('AI chat model error:', modelError);
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
  const { question, hintLevel } = await c.req.json();

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
  } catch {
    return c.json({ success: false, error: 'Failed to generate hint' }, 500);
  }
});

// AI study plan generation
protectedApp.post('/ai/study-plan', async (c) => {
  const { weakTopics, context } = await c.req.json();

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
  } catch {
    return c.json({ success: false, error: 'Failed to generate study plan' }, 500);
  }
});

// =============================================
// USER SELF-SERVICE ENDPOINTS
// =============================================

// Middleware to verify authenticated user.
// requireAuth (protectedApp.use('*', requireAuth)) has already authenticated
// the request and set user/userId/userRole with the DB-fresh role. Trust that
// context instead of re-verifying the token — re-setting `user` from the raw
// JWT payload here would overwrite the fresh DB role with the frozen JWT role.
const userAuth: MiddlewareHandler<AppEnv> = async (c, next) => {
  if (!c.get('userId')) {
    return c.json({ success: false, error: 'Unauthorized' }, 401);
  }
  await next();
};

// Return the DB-fresh user behind the verified bearer token. The frontend uses
// this as the single authoritative bootstrap after a reload so duplicated or
// stale browser persistence cannot manufacture a logout (or preserve a stale
// role/status).
protectedApp.get('/auth/me', userAuth, async (c) => {
  const userId = c.get('userId');

  try {
    const user = await c.env.DB.prepare(`
      SELECT id, email, name, role, status, house, year_group, school_level,
             school_name, xp_points, level, streak_days, avatar_url,
             primary_exam_type_id, subscription_tier_id,
             subscription_expires_at, ai_grading_credits, email_verified,
             is_active, password_hash, created_at, updated_at
      FROM users
      WHERE id = ?
    `).bind(userId).first<Record<string, unknown>>();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    return c.json({
      success: true,
      data: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: c.get('userRole'),
        status: user.status,
        house: user.house,
        yearGroup: user.year_group,
        schoolLevel: user.school_level,
        schoolName: user.school_name,
        xpPoints: user.xp_points,
        level: user.level,
        streakDays: user.streak_days,
        avatarUrl: user.avatar_url,
        primaryExamTypeId: user.primary_exam_type_id,
        subscriptionTierId: user.subscription_tier_id,
        subscriptionExpiresAt: user.subscription_expires_at,
        aiGradingCredits: user.ai_grading_credits,
        emailVerified: user.email_verified,
        isActive: user.is_active,
        passwordSet: Boolean(user.password_hash),
        createdAt: user.created_at,
        updatedAt: user.updated_at,
      },
    });
  } catch (error) {
    console.error('Current user bootstrap error:', error);
    return c.json({ success: false, error: 'Failed to restore session' }, 500);
  }
});

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

// Sniff image magic bytes — never trust client-supplied file.type/extension
export function sniffImageType(bytes: Uint8Array): 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp' | null {
  if (bytes.length < 12) return null;
  if (bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47) return 'image/png';
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return 'image/jpeg';
  if (bytes[0] === 0x47 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x38) return 'image/gif';
  if (bytes[0] === 0x52 && bytes[1] === 0x49 && bytes[2] === 0x46 && bytes[3] === 0x46 &&
      bytes[8] === 0x57 && bytes[9] === 0x45 && bytes[10] === 0x42 && bytes[11] === 0x50) return 'image/webp';
  return null;
}

const IMAGE_EXTENSIONS: Record<string, string> = {
  'image/png': 'png',
  'image/jpeg': 'jpg',
  'image/gif': 'gif',
  'image/webp': 'webp',
};

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

    // Validate file size (5MB max) — reject before buffering the body into memory
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      return c.json({ success: false, error: 'File too large. Maximum size is 5MB.' }, 400);
    }

    // Read the file and sniff its real type from magic bytes
    const buffer = new Uint8Array(await file.arrayBuffer());
    const sniffedType = sniffImageType(buffer);
    if (!sniffedType) {
      return c.json({ success: false, error: 'Invalid file type. Please upload a JPEG, PNG, WebP, or GIF image.' }, 400);
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

    // Generate unique file key — extension comes from the sniffed type, not the client filename
    const fileKey = `avatars/${user.userId}_${Date.now()}.${IMAGE_EXTENSIONS[sniffedType]}`;

    // Upload to R2
    await c.env.LIBRARY_BUCKET.put(fileKey, buffer, {
      httpMetadata: {
        contentType: sniffedType,
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

// Get user's exam type preferences
protectedApp.get('/users/me/exam-preferences', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT uep.id, uep.exam_type_id as examTypeId, uep.is_primary as isPrimary,
             uep.target_year as targetYear,
             et.name, et.slug, et.description, et.icon, et.color
      FROM user_exam_preferences uep
      JOIN exam_types et ON uep.exam_type_id = et.id
      WHERE uep.user_id = ?
      ORDER BY uep.is_primary DESC, et.display_order
    `).bind(user.userId).all();

    // Get primary exam type from users table
    const userData = await c.env.DB.prepare(`
      SELECT primary_exam_type_id FROM users WHERE id = ?
    `).bind(user.userId).first();

    return c.json({
      success: true,
      data: {
        preferences: results,
        primaryExamTypeId: userData?.primary_exam_type_id || null
      }
    });
  } catch (error) {
    console.error('Error fetching exam preferences:', error);
    return c.json({ success: false, error: 'Failed to fetch exam preferences' }, 500);
  }
});

// Set/update user's exam type preferences
protectedApp.post('/users/me/exam-preferences', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const { examTypeIds, primaryExamTypeId } = await c.req.json();

  // Validate input
  if (!examTypeIds || !Array.isArray(examTypeIds) || examTypeIds.length === 0) {
    return c.json({ success: false, error: 'At least one exam type is required' }, 400);
  }

  if (!primaryExamTypeId || !examTypeIds.includes(primaryExamTypeId)) {
    return c.json({ success: false, error: 'Primary exam type must be one of the selected exam types' }, 400);
  }

  try {
    // Verify all exam types exist
    const placeholders = examTypeIds.map(() => '?').join(',');
    const { results: validExamTypes } = await c.env.DB.prepare(`
      SELECT id FROM exam_types WHERE id IN (${placeholders}) AND is_active = 1
    `).bind(...examTypeIds).all();

    if (validExamTypes.length !== examTypeIds.length) {
      return c.json({ success: false, error: 'One or more invalid exam types' }, 400);
    }

    // Delete existing preferences
    await c.env.DB.prepare(`
      DELETE FROM user_exam_preferences WHERE user_id = ?
    `).bind(user.userId).run();

    // Insert new preferences
    for (const examTypeId of examTypeIds) {
      const prefId = `pref_${user.userId}_${examTypeId}_${Date.now()}`;
      const isPrimary = examTypeId === primaryExamTypeId ? 1 : 0;

      await c.env.DB.prepare(`
        INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary)
        VALUES (?, ?, ?, ?)
      `).bind(prefId, user.userId, examTypeId, isPrimary).run();
    }

    // Update primary_exam_type_id in users table
    await c.env.DB.prepare(`
      UPDATE users SET primary_exam_type_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(primaryExamTypeId, user.userId).run();

    return c.json({
      success: true,
      data: { message: 'Exam preferences updated successfully' }
    });
  } catch (error) {
    console.error('Error updating exam preferences:', error);
    return c.json({ success: false, error: 'Failed to update exam preferences' }, 500);
  }
});

// Change password
protectedApp.post('/users/me/change-password', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const { currentPassword, newPassword, turnstileToken } = await c.req.json();
  const clientIp = c.req.header('CF-Connecting-IP') || c.req.header('X-Forwarded-For') || 'unknown';

  // Rate limiting - per user
  const userRateLimit = await checkRateLimit(c.env.DB, user.userId, 'change-password');
  if (!userRateLimit.allowed) {
    return rateLimitResponse(c, userRateLimit);
  }

  // Verify Turnstile token
  if (c.env.TURNSTILE_SECRET && turnstileToken) {
    const isValidTurnstile = await verifyTurnstile(turnstileToken, c.env.TURNSTILE_SECRET, clientIp);
    if (!isValidTurnstile) {
      return c.json({ success: false, error: 'Security verification failed. Please try again.' }, 400);
    }
  } else if (c.env.TURNSTILE_SECRET && !turnstileToken) {
    return c.json({ success: false, error: 'Security verification required.' }, 400);
  }

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
        session_version = session_version + 1,
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
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // 32 chars, excludes confusing ones
  const bytes = crypto.getRandomValues(new Uint8Array(6));
  // 256 % 32 === 0, so the modulo introduces no bias
  return Array.from(bytes, (b) => chars.charAt(b % chars.length)).join('');
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
      VALUES (?, NULL, ?, ?, ?, 'pending')
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
  } catch {
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
  } catch {
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
  } catch {
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

    // Authorization and the student's opt-out above remain the privacy boundary.
    const guidance = await getParentGuidance(c.env.DB, studentId);

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
        guidance,
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
  const limit = parseLimit(c, 30);

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
  } catch {
    return c.json({ success: false, error: 'Failed to fetch student activity' }, 500);
  }
});

// Parent: Get notifications
protectedApp.get('/parents/notifications', userAuth, async (c) => {
  const user = c.get('user') as UserPayload;
  const unreadOnly = c.req.query('unreadOnly') === 'true';
  const limit = parseLimit(c, 50);

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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
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
  } catch {
    return c.json({ success: false, error: 'Failed to update preferences' }, 500);
  }
});

// =============================================
// ADMIN USER MANAGEMENT ENDPOINTS
// =============================================

// Admin routes: shared middleware (verified JWT + fresh DB admin-role re-check,
// sets user/userId/userRole like the old adminAuth did).
const adminApp = new Hono<AppEnv>();
adminApp.use('*', requireAdmin);

// TTS spike (kept permanently, admin-only): runs the configured Aura TTS
// model on a short text and reports the raw response shape so response
// handling in /api/revision-classroom/tts can be validated against reality.
adminApp.post('/tts-spike', async (c) => {
  try {
    const body = await c.req.json().catch(() => ({}));
    const text = typeof body?.text === 'string' && body.text.trim().length > 0
      ? body.text.slice(0, 1500)
      : 'Hello from the Brilla whiteboard teacher.';
    const model = getTtsModel(c.env);
    const result: unknown = await c.env.AI.run(model as never, {
      text,
      speaker: 'luna',
      encoding: 'mp3',
    } as never);

    let shape = 'unknown';
    let contentType = 'unknown';
    let byteLength = 0;
    let isBase64 = false;
    let firstBytes = '';

    const describeBytes = (bytes: Uint8Array) => {
      byteLength = bytes.byteLength;
      firstBytes = Array.from(bytes.slice(0, 16))
        .map((b) => b.toString(16).padStart(2, '0'))
        .join(' ');
    };

    if (result instanceof ReadableStream) {
      shape = 'ReadableStream';
      const reader = result.getReader();
      const chunks: Uint8Array[] = [];
      for (;;) {
        const { done, value } = await reader.read();
        if (done) break;
        if (value) chunks.push(value instanceof Uint8Array ? value : new Uint8Array(value as ArrayBuffer));
      }
      const total = chunks.reduce((n, ch) => n + ch.byteLength, 0);
      const merged = new Uint8Array(total);
      let off = 0;
      for (const ch of chunks) { merged.set(ch, off); off += ch.byteLength; }
      describeBytes(merged);
    } else if (result instanceof ArrayBuffer) {
      shape = 'ArrayBuffer';
      describeBytes(new Uint8Array(result));
    } else if (result instanceof Uint8Array) {
      shape = 'Uint8Array';
      describeBytes(result);
    } else if (typeof result === 'string') {
      shape = 'string';
      contentType = 'text/base64?';
      isBase64 = /^[A-Za-z0-9+/=\s]+$/.test(result.slice(0, 200));
      byteLength = result.length;
      firstBytes = result.slice(0, 32);
    } else if (result && typeof result === 'object') {
      const obj = result as Record<string, unknown>;
      shape = `object(${Object.keys(obj).join(',')})`;
      if (typeof obj.audio === 'string') {
        isBase64 = true;
        byteLength = obj.audio.length;
        firstBytes = obj.audio.slice(0, 32);
      }
    }

    return c.json({
      success: true,
      model,
      shape,
      contentType,
      byteLength,
      isBase64,
      firstBytes,
    });
  } catch (error) {
    console.error('TTS spike error:', error);
    return c.json({ success: false, error: error instanceof Error ? error.message : 'TTS spike failed' }, 500);
  }
});

// Vision model spike (admin eval tool — verifies image input shape + quality
// for the "AI sees student work" feature). Accepts a base64 PNG/JPEG and a
// prompt, runs the configured vision model, and reports the runtime response
// shape so unwrapAiText behavior is observed, plus latency and output text.
// `inputShape` lets the spike iterate candidate request shapes without
// redeploying (whitelisted). Default is `openai-image-url` — the shape
// verified live on this account (see
// docs/superpowers/specs/2026-08-13-vision-spike-results.md). `guidedJson`
// (optional, schema object) is passed through to test guided_json conformance.
adminApp.post('/vision-spike', async (c) => {
  const { imageBase64, prompt, model, inputShape, guidedJson } = await c.req.json();

  if (!imageBase64 || typeof imageBase64 !== 'string' || imageBase64.length > 700_000) {
    return c.json({ success: false, error: 'imageBase64 is required (max ~500KB binary)' }, 400);
  }
  if (!prompt || typeof prompt !== 'string' || prompt.length > 2000) {
    return c.json({ success: false, error: 'prompt is required (max 2000 chars)' }, 400);
  }

  const chosenModel = typeof model === 'string' && model.startsWith('@cf/')
    ? model
    : getVisionModel(c.env);
  const SHAPES = [
    'message-image-array',
    'message-image-base64',
    'content-parts',
    'content-parts-base64',
    'toplevel-array',
    'openai-image-url',
  ];
  const shape = SHAPES.includes(inputShape) ? inputShape as string : 'openai-image-url';
  const started = Date.now();

  try {
    const base64 = imageBase64.replace(/^data:[^,]+,/, '');
    const bytes = Uint8Array.from(atob(base64), (ch) => ch.charCodeAt(0));
    const imageArray = [...bytes];
    let request: Record<string, unknown>;
    if (shape === 'message-image-base64') {
      request = { messages: [{ role: 'user', content: prompt, image: base64 }] };
    } else if (shape === 'content-parts') {
      request = { messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image', image: imageArray }] }] };
    } else if (shape === 'content-parts-base64') {
      request = { messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image', image: base64 }] }] };
    } else if (shape === 'toplevel-array') {
      request = { prompt, image: imageArray };
    } else if (shape === 'openai-image-url') {
      request = { messages: [{ role: 'user', content: [{ type: 'text', text: prompt }, { type: 'image_url', image_url: { url: `data:image/png;base64,${base64}` } }] }] };
    } else {
      request = { messages: [{ role: 'user', content: prompt, image: imageArray }] };
    }
    request.max_tokens = 1024;
    if (guidedJson && typeof guidedJson === 'object' && JSON.stringify(guidedJson).length <= 4000) {
      request.guided_json = guidedJson;
    }
    const result = await c.env.AI.run(chosenModel as any, request);
    const rawShape = result === null ? 'null'
      : typeof result === 'string' ? 'string'
      : 'response' in (result as object)
        ? `object-with-response-${typeof (result as any).response}`
        : `object-keys:${Object.keys(result as object).join('|')}`;
    return c.json({
      success: true,
      data: { model: chosenModel, inputShape: shape, ok: true, latencyMs: Date.now() - started, rawShape, output: unwrapAiText(result) },
    });
  } catch (error) {
    return c.json({
      success: true,
      data: { model: chosenModel, inputShape: shape, ok: false, latencyMs: Date.now() - started, rawShape: 'error', output: '', error: error instanceof Error ? error.message : String(error) },
    });
  }
});

// Dashboard stats
adminApp.get('/dashboard/stats', async (c) => {
  try {
    const today = new Date().toISOString().split('T')[0];
    const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
    const nowIso = new Date().toISOString();

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
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_trials WHERE status = 'active' AND expires_at > ?").bind(nowIso).first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'success'").first(),
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
      if (!c.env.LIBRARY_BUCKET) {
        storageStatus = 'degraded';
      } else {
        await c.env.LIBRARY_BUCKET.list({ limit: 1 });
      }
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
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'success' AND created_at >= datetime('now', 'start of month')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'success' AND created_at >= datetime('now', 'start of month', '-1 month') AND created_at < datetime('now', 'start of month')").first(),
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
    const nowIso = new Date().toISOString();
    const [active, trials, expiring, revenueThis, revenueLast] = await Promise.all([
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active'").first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_trials WHERE status = 'active' AND expires_at > ?").bind(nowIso).first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM user_subscriptions WHERE status = 'active' AND expires_at <= datetime('now', '+7 days')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'success' AND created_at >= datetime('now', 'start of month')").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM payment_transactions WHERE status = 'success' AND created_at >= datetime('now', 'start of month', '-1 month') AND created_at < datetime('now', 'start of month')").first(),
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
    const [total, active, referrals, conversions, earnings, pending, monthEarnings] = await Promise.all([
      c.env.DB.prepare('SELECT COUNT(*) as count FROM affiliate_profiles').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM affiliate_profiles WHERE is_active = 1').first(),
      c.env.DB.prepare('SELECT COUNT(*) as count FROM affiliate_referrals').first(),
      c.env.DB.prepare("SELECT COUNT(*) as count FROM affiliate_referrals WHERE status = 'converted'").first(),
      c.env.DB.prepare('SELECT COALESCE(SUM(total_earnings), 0) as total FROM affiliate_profiles').first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_payouts WHERE status = 'pending'").first(),
      c.env.DB.prepare("SELECT COALESCE(SUM(amount), 0) as total FROM affiliate_commissions WHERE created_at >= date('now', 'start of month')").first(),
    ]);

    const totalRefs = (referrals as { count: number })?.count || 0;
    const successRefs = (conversions as { count: number })?.count || 0;
    const conversionRate = totalRefs > 0 ? Math.round((successRefs / totalRefs) * 100) : 0;

    return c.json({
      success: true,
      data: {
        totalAffiliates: (total as { count: number })?.count || 0,
        activeAffiliates: (active as { count: number })?.count || 0,
        totalReferrals: totalRefs,
        successfulConversions: successRefs,
        totalEarnings: (earnings as { total: number })?.total || 0,
        pendingPayouts: (pending as { total: number })?.total || 0,
        conversionRate,
        earningsThisMonth: (monthEarnings as { total: number })?.total || 0,
      },
    });
  } catch (error) {
    console.error('Affiliate stats error:', error);
    return c.json({ success: false, error: 'Failed to fetch affiliate stats' }, 500);
  }
});

// Affiliate list
adminApp.get('/affiliates/list', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT a.id, a.user_id, u.name as user_name, u.email as user_email,
             a.referral_code, a.total_referrals, a.successful_conversions,
             a.total_earnings, a.pending_earnings, a.available_earnings,
             a.tier_id, t.name as tier_name, a.is_active, a.joined_at
      FROM affiliate_profiles a
      JOIN users u ON a.user_id = u.id
      LEFT JOIN affiliate_tiers t ON a.tier_id = t.id
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
      conversions: a.successful_conversions || 0,
      totalEarnings: a.total_earnings || 0,
      pendingEarnings: a.pending_earnings || 0,
      tier: a.tier_name || 'Scout',
      tierColor: '#10B981',
      joinedAt: a.joined_at,
      status: a.is_active ? 'active' : 'inactive',
    }));

    return c.json({ success: true, data: affiliates });
  } catch (error) {
    console.error('Affiliate list error:', error);
    return c.json({ success: false, error: 'Failed to fetch affiliates' }, 500);
  }
});

// Affiliate payouts
adminApp.get('/affiliates/payouts', async (c) => {
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT p.id, p.affiliate_id, u.name as affiliate_name, u.email as affiliate_email,
             p.amount, p.status, p.requested_at,
             p.processed_at, p.mobile_money_number, p.mobile_money_provider
      FROM affiliate_payouts p
      JOIN affiliate_profiles a ON p.affiliate_id = a.id
      JOIN users u ON a.user_id = u.id
      ORDER BY
        CASE p.status WHEN 'pending' THEN 0 ELSE 1 END,
        p.requested_at DESC
      LIMIT 100
    `).all();

    const payouts = (results || []).map((p: Record<string, unknown>) => ({
      id: p.id,
      affiliateId: p.affiliate_id,
      affiliateName: p.affiliate_name || 'Unknown',
      affiliateEmail: p.affiliate_email || '',
      amount: p.amount || 0,
      status: p.status || 'pending',
      requestedAt: p.requested_at,
      processedAt: p.processed_at,
      mobileMoneyNumber: p.mobile_money_number || 'Not set',
      mobileMoneyProvider: p.mobile_money_provider || 'MTN',
    }));

    return c.json({ success: true, data: payouts });
  } catch (error) {
    console.error('Affiliate payouts error:', error);
    return c.json({ success: false, error: 'Failed to fetch payouts' }, 500);
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

// Get all users with stats (paginated)
adminApp.get('/users', async (c) => {
  try {
    const limit = parseLimit(c, 50);
    const page = Math.max(1, parseInt(c.req.query('page') || '1', 10) || 1);
    const offset = (page - 1) * limit;

    const [{ results }, totalRow] = await Promise.all([
      c.env.DB.prepare(`
        SELECT id, email, name, role, status, email_verified, is_active,
               school_level, year_group, school_name, house,
               teacher_license_number, subjects_taught, years_experience, qualifications,
               xp_points, level, streak_days, last_login_at, created_at, updated_at,
               CASE WHEN password_hash IS NOT NULL AND password_hash != '' THEN 1 ELSE 0 END AS password_set
        FROM users
        ORDER BY created_at DESC
        LIMIT ? OFFSET ?
      `).bind(limit, offset).all(),
      c.env.DB.prepare('SELECT COUNT(*) as total FROM users').first(),
    ]);

    // Parse JSON fields
    const users = results.map((u: Record<string, unknown>) => ({
      ...u,
      subjectsTaught: u.subjects_taught ? JSON.parse(u.subjects_taught as string) : [],
    }));

    return c.json({
      success: true,
      data: {
        users,
        total: (totalRow as { total?: number } | null)?.total || 0,
        page,
        limit,
      },
    });
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
  } catch {
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
  } catch {
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

    const approvalResult = await c.env.DB.prepare(`
      UPDATE users SET
        status = 'approved',
        email_verified = 1,
        approved_by = ?,
        approved_at = datetime('now'),
        updated_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).bind(adminUser.userId, userId).run();

    // Only one concurrent approval request may own the transition and its
    // side effects, including referral rewards and trial creation.
    if ((approvalResult.meta.changes ?? 0) !== 1) {
      return c.json({
        success: false,
        error: 'User is no longer pending approval',
      }, 409);
    }

    // Referral points fire only after approval. Resolve an existing
    // attribution first; legacy referred_by-only records are backfilled.
    const referredBy = user.referred_by as string | null;
    if (referredBy) {
      try {
        const existingReferral = await c.env.DB.prepare(`
          SELECT ar.id, ap.user_id AS affiliate_user_id
          FROM affiliate_referrals ar
          JOIN affiliate_profiles ap ON ap.id = ar.affiliate_id
          WHERE ar.referred_user_id = ?
          LIMIT 1
        `).bind(userId).first<{ id: string; affiliate_user_id: string }>();

        if (existingReferral) {
          await awardReferralSignupPoints(c.env.DB, existingReferral.affiliate_user_id, userId);
        } else {
          const affiliate = await c.env.DB.prepare(`
            SELECT id, user_id, referral_code FROM affiliate_profiles
            WHERE referral_code = ? AND is_active = 1
          `).bind(referredBy.toUpperCase()).first<{ id: string; user_id: string; referral_code: string }>();

          if (affiliate) {
            await attributeReferral(c.env.DB, affiliate, userId, affiliate.referral_code);
            await awardReferralSignupPoints(c.env.DB, affiliate.user_id, userId);
          }
        }
      } catch (referralError) {
        // Log but don't fail the approval if referral attribution fails
        console.error('Failed to attribute referral on approval:', referralError);
      }
    }

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
  } catch {
    return c.json({ success: false, error: 'Failed to approve user' }, 500);
  }
});

// =============================================
// REFERRAL CODE REQUESTS (growth loop Task 5)
// =============================================

// List referral code requests, optionally filtered by status
adminApp.get('/referral-code-requests', async (c) => {
  try {
    const status = c.req.query('status');

    let query = 'SELECT * FROM referral_code_requests';
    const params: unknown[] = [];
    if (status) {
      query += ' WHERE status = ?';
      params.push(status);
    }
    query += ' ORDER BY created_at DESC LIMIT 200';

    const { results } = await c.env.DB.prepare(query).bind(...params).all();

    let countQuery = 'SELECT COUNT(*) as total FROM referral_code_requests';
    if (status) {
      countQuery += ' WHERE status = ?';
    }
    const countResult = await c.env.DB.prepare(countQuery).bind(...params).first();

    return c.json({
      success: true,
      data: { requests: results, total: countResult?.total || 0 },
    });
  } catch (error) {
    console.error('List referral code requests error:', error);
    return c.json({ success: false, error: 'Failed to fetch referral code requests' }, 500);
  }
});

// Fulfill a request by issuing an existing affiliate referral code
adminApp.post('/referral-code-requests/:id/fulfill', async (c) => {
  const requestId = c.req.param('id');
  // adminApp's Hono generic lacks Variables (pre-existing typing gap that
  // TS2769s the older handlers); requireAdmin sets 'user' — assert through
  // unknown so this new handler adds no new tsc error.
  const adminUser = (c as unknown as { get: (key: 'user') => UserPayload }).get('user');
  const body = await parseJsonBody(c);
  if (!body) return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  const { code } = body;

  if (!code) {
    return c.json({ success: false, error: 'Code is required' }, 400);
  }

  try {
    // The issued code must belong to a real, active affiliate profile
    const affiliate = await c.env.DB.prepare(
      'SELECT id FROM affiliate_profiles WHERE referral_code = ? AND is_active = 1'
    ).bind(String(code).toUpperCase()).first();

    if (!affiliate) {
      return c.json({ success: false, error: 'Unknown or inactive referral code' }, 400);
    }

    const result = await c.env.DB.prepare(`
      UPDATE referral_code_requests
      SET status = 'fulfilled', issued_code = ?, fulfilled_by = ?, fulfilled_at = datetime('now')
      WHERE id = ? AND status = 'pending'
    `).bind(String(code).toUpperCase(), adminUser.userId, requestId).run();

    if (!result.meta?.changes) {
      return c.json({ success: false, error: 'Request not found or already handled' }, 404);
    }

    return c.json({ success: true, data: { id: requestId, issuedCode: String(code).toUpperCase() } });
  } catch (error) {
    console.error('Fulfill referral code request error:', error);
    return c.json({ success: false, error: 'Failed to fulfill request' }, 500);
  }
});

// Reject a request
adminApp.post('/referral-code-requests/:id/reject', async (c) => {
  const requestId = c.req.param('id');

  try {
    const result = await c.env.DB.prepare(`
      UPDATE referral_code_requests
      SET status = 'rejected'
      WHERE id = ? AND status = 'pending'
    `).bind(requestId).run();

    if (!result.meta?.changes) {
      return c.json({ success: false, error: 'Request not found or already handled' }, 404);
    }

    return c.json({ success: true, data: { id: requestId } });
  } catch (error) {
    console.error('Reject referral code request error:', error);
    return c.json({ success: false, error: 'Failed to reject request' }, 500);
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
  } catch {
    return c.json({ success: false, error: 'Failed to reject user' }, 500);
  }
});

// Get user's exam preferences (admin)
adminApp.get('/users/:userId/exam-preferences', async (c) => {
  const { userId } = c.req.param();

  try {
    const { results } = await c.env.DB.prepare(`
      SELECT uep.id, uep.exam_type_id as examTypeId, uep.is_primary as isPrimary,
             uep.target_year as targetYear,
             et.name, et.slug, et.description, et.icon, et.color
      FROM user_exam_preferences uep
      JOIN exam_types et ON uep.exam_type_id = et.id
      WHERE uep.user_id = ?
      ORDER BY uep.is_primary DESC, et.display_order
    `).bind(userId).all();

    const userData = await c.env.DB.prepare(`
      SELECT primary_exam_type_id FROM users WHERE id = ?
    `).bind(userId).first();

    return c.json({
      success: true,
      data: {
        preferences: results,
        primaryExamTypeId: userData?.primary_exam_type_id || null
      }
    });
  } catch (error) {
    console.error('Error fetching user exam preferences:', error);
    return c.json({ success: false, error: 'Failed to fetch exam preferences' }, 500);
  }
});

// Set user's exam preferences (admin)
adminApp.post('/users/:userId/exam-preferences', async (c) => {
  const { userId } = c.req.param();
  const { examTypeIds, primaryExamTypeId } = await c.req.json();

  // Validate input
  if (!examTypeIds || !Array.isArray(examTypeIds) || examTypeIds.length === 0) {
    return c.json({ success: false, error: 'At least one exam type is required' }, 400);
  }

  if (!primaryExamTypeId || !examTypeIds.includes(primaryExamTypeId)) {
    return c.json({ success: false, error: 'Primary exam type must be one of the selected exam types' }, 400);
  }

  try {
    // Verify user exists
    const user = await c.env.DB.prepare('SELECT id FROM users WHERE id = ?').bind(userId).first();
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    // Verify all exam types exist
    const placeholders = examTypeIds.map(() => '?').join(',');
    const { results: validExamTypes } = await c.env.DB.prepare(`
      SELECT id FROM exam_types WHERE id IN (${placeholders}) AND is_active = 1
    `).bind(...examTypeIds).all();

    if (validExamTypes.length !== examTypeIds.length) {
      return c.json({ success: false, error: 'One or more invalid exam types' }, 400);
    }

    // Delete existing preferences
    await c.env.DB.prepare(`
      DELETE FROM user_exam_preferences WHERE user_id = ?
    `).bind(userId).run();

    // Insert new preferences
    for (const examTypeId of examTypeIds) {
      const prefId = `pref_${userId}_${examTypeId}_${Date.now()}`;
      const isPrimary = examTypeId === primaryExamTypeId ? 1 : 0;

      await c.env.DB.prepare(`
        INSERT INTO user_exam_preferences (id, user_id, exam_type_id, is_primary)
        VALUES (?, ?, ?, ?)
      `).bind(prefId, userId, examTypeId, isPrimary).run();
    }

    // Update primary_exam_type_id in users table
    await c.env.DB.prepare(`
      UPDATE users SET primary_exam_type_id = ?, updated_at = datetime('now')
      WHERE id = ?
    `).bind(primaryExamTypeId, userId).run();

    return c.json({
      success: true,
      data: { message: 'Exam preferences updated successfully' }
    });
  } catch (error) {
    console.error('Error updating user exam preferences:', error);
    return c.json({ success: false, error: 'Failed to update exam preferences' }, 500);
  }
});

// Create new user (admin-created, sends verification email)
adminApp.post('/users', async (c) => {
  const body = await c.req.json();
  const { email, name, role, schoolLevel, yearGroup, schoolName, house,
          teacherLicenseNumber, subjectsTaught, yearsExperience, qualifications } = body;
  const adminUser = c.get('user') as UserPayload;
  const appUrl = c.env.APP_URL || 'https://brilla.edu.gh';

  // No Turnstile here: this route sits behind requireAdmin, so the caller is
  // an authenticated admin — bot verification is for public endpoints only.

  // Role whitelist: admin-created accounts may only be one of the four
  // canonical roles (schema CHECK constraint enforces the same set).
  const ADMIN_CREATABLE_ROLES = ['student', 'teacher', 'parent', 'admin'];
  if (role && !ADMIN_CREATABLE_ROLES.includes(role)) {
    return c.json({ success: false, error: 'Invalid role' }, 400);
  }

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
      normalizeSchoolLevel(schoolLevel), yearGroup || null, schoolName || null, house || null,
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
        console.error('Failed to send verification email');
      }
    } else {
      console.warn('RESEND_API_KEY not configured; verification token was not logged');
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
      normalizeSchoolLevel(schoolLevel), yearGroup || null, schoolName || null, house || null,
      teacherLicenseNumber || null,
      subjectsTaught ? JSON.stringify(subjectsTaught) : null,
      yearsExperience || null, qualifications || null,
      userId
    ).run();

    return c.json({ success: true, data: { message: 'User updated successfully' } });
  } catch {
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
  } catch {
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
  } catch {
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
    const target = await c.env.DB.prepare(
      'SELECT email, role FROM users WHERE id = ?'
    ).bind(userId).first();

    await c.env.DB.prepare('DELETE FROM users WHERE id = ?').bind(userId).run();

    // Audit the deletion — hard-deleting an account must leave a trail.
    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: 'admin',
      action: 'user_delete',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Deleted user ${target?.email || 'unknown'} (role: ${target?.role || 'unknown'})`,
      ipAddress: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    });

    return c.json({ success: true, data: { message: 'User deleted' } });
  } catch {
    return c.json({ success: false, error: 'Failed to delete user' }, 500);
  }
});

// Send a password setup/reset link. This is intentionally separate from email
// verification: verified accounts may still need a password reset, and Google
// accounts may not have a password yet.
adminApp.post('/users/:id/send-password-reset', async (c) => {
  const userId = c.req.param('id');
  const adminUser = c.get('user') as UserPayload;
  const appUrl = c.env.APP_URL || 'https://brillaprep.org';

  if (!c.env.RESEND_API_KEY) {
    return c.json({ success: false, error: 'Email service not configured' }, 503);
  }

  const resetRateLimit = await checkRateLimit(c.env.DB, `admin-password-reset:${userId}`, 'forgot-password');
  if (!resetRateLimit.allowed) {
    return rateLimitResponse(c, resetRateLimit);
  }

  try {
    const user = await c.env.DB.prepare(
      'SELECT id, name, email FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const resetToken = generateToken();
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      UPDATE users SET
        password_reset_token = ?,
        password_reset_expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(resetToken, expiresAt, userId).run();

    const resetUrl = `${appUrl}/reset-password?token=${resetToken}`;
    const delivered = await sendEmail(
      c.env.RESEND_API_KEY,
      c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>',
      user.email as string,
      'Set or Reset Your Password - Brilla',
      getPasswordResetEmailHTML(user.name as string, resetUrl)
    );

    if (!delivered) {
      // Do not leave an unreachable token active when delivery fails.
      await c.env.DB.prepare(`
        UPDATE users SET
          password_reset_token = NULL,
          password_reset_expires_at = NULL,
          updated_at = datetime('now')
        WHERE id = ? AND password_reset_token = ?
      `).bind(userId, resetToken).run();
      return c.json({ success: false, error: 'Failed to send password reset email' }, 502);
    }

    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: 'admin',
      action: 'password_reset_email_sent',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: 'Sent a one-hour password setup/reset link',
      ipAddress: c.req.header('cf-connecting-ip') || 'unknown',
      userAgent: c.req.header('user-agent') || 'unknown',
    });

    return c.json({ success: true, data: { message: 'Password reset email sent' } });
  } catch (error) {
    console.error('Admin password reset email error:', error);
    return c.json({ success: false, error: 'Failed to send password reset email' }, 500);
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
  } catch {
    return c.json({ success: false, error: 'Failed to resend verification' }, 500);
  }
});

// Test notification email delivery (admin only)
adminApp.post('/test-notification', async (c) => {
  const adminUser = c.get('user') as UserPayload;

  if (!c.env.RESEND_API_KEY) {
    return c.json({ success: false, error: 'Email service not configured' }, 500);
  }

  try {
    const fromEmail = c.env.FROM_EMAIL || 'Brilla Study Platform <noreply@brillaprep.org>';

    // Get admin emails
    const { results: admins } = await c.env.DB.prepare(
      "SELECT email FROM users WHERE role = 'admin' AND status = 'approved' AND is_active = 1"
    ).all();
    const adminEmails = (admins as Array<{ email: string }>).map((a) => a.email);

    // Get additional notification emails
    const additionalEmails = getAdditionalNotificationEmails(c.env);
    const allRecipients = [...new Set([...adminEmails, ...additionalEmails])];

    if (allRecipients.length === 0) {
      return c.json({ success: false, error: 'No notification recipients configured' }, 400);
    }

    const testEmailHtml = `
      <!DOCTYPE html>
      <html>
      <head><meta charset="utf-8"></head>
      <body style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
          <h1 style="color: white; margin: 0;">🧪 Test Notification</h1>
        </div>
        <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px;">
          <p style="font-size: 16px; color: #374151;">This is a test notification from Brilla Study Platform.</p>
          <p style="font-size: 14px; color: #6b7280;">
            <strong>Triggered by:</strong> ${adminUser.email}<br>
            <strong>Timestamp:</strong> ${new Date().toISOString()}<br>
            <strong>Recipients:</strong> ${allRecipients.join(', ')}
          </p>
          <p style="font-size: 14px; color: #10b981;">✅ If you received this email, notifications are working correctly!</p>
        </div>
      </body>
      </html>
    `;

    // Send to all recipients
    const results: { email: string; success: boolean; error?: string }[] = [];
    for (const recipientEmail of allRecipients) {
      try {
        await sendEmail(
          c.env.RESEND_API_KEY,
          fromEmail,
          recipientEmail,
          '🧪 Test Notification - Brilla Study Platform',
          testEmailHtml
        );
        results.push({ email: recipientEmail, success: true });
      } catch (error) {
        results.push({ email: recipientEmail, success: false, error: String(error) });
      }
    }

    return c.json({
      success: true,
      data: {
        message: 'Test notifications sent',
        recipients: results
      }
    });
  } catch (error) {
    console.error('Test notification error:', error);
    return c.json({ success: false, error: 'Failed to send test notification' }, 500);
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

// Manually set a user's subscription tier (admin comp/upgrade)
adminApp.post('/users/:id/set-tier', async (c) => {
  const userId = c.req.param('id');
  const { tierId, durationDays } = await c.req.json();
  const adminUser = c.get('user') as UserPayload;
  const clientInfo = getClientInfo(c);

  if (!tierId || typeof tierId !== 'string') {
    return c.json({ success: false, error: 'tierId is required' }, 400);
  }
  if (typeof durationDays !== 'number' || !Number.isInteger(durationDays) || durationDays < 1 || durationDays > 3650) {
    return c.json({ success: false, error: 'durationDays must be an integer between 1 and 3650' }, 400);
  }

  try {
    const tier = await c.env.DB.prepare(
      'SELECT id, name, slug, ai_grading_quota FROM subscription_tiers WHERE id = ? AND is_active = 1'
    ).bind(tierId).first();

    if (!tier) {
      return c.json({ success: false, error: 'Tier not found or inactive' }, 404);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, email, subscription_tier_id FROM users WHERE id = ?'
    ).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const expiresAt = new Date(Date.now() + durationDays * 24 * 60 * 60 * 1000).toISOString();

    await c.env.DB.prepare(`
      UPDATE users SET
        subscription_tier_id = ?,
        subscription_expires_at = ?,
        updated_at = datetime('now')
      WHERE id = ?
    `).bind(tierId, expiresAt, userId).run();

    // Top up grading credits per tier quota (mirrors payment crediting)
    const quota = (tier.ai_grading_quota as number) || 0;
    let creditsAdded = 0;
    if (quota > 0) {
      creditsAdded = quota;
      await c.env.DB.prepare(`
        UPDATE users SET
          ai_grading_credits = COALESCE(ai_grading_credits, 0) + ?,
          updated_at = datetime('now')
        WHERE id = ?
      `).bind(quota, userId).run();
    }

    await logAudit({
      db: c.env.DB,
      userId: adminUser.userId,
      userEmail: adminUser.email,
      userRole: adminUser.role,
      action: 'set_subscription_tier',
      actionCategory: 'user_management',
      targetType: 'user',
      targetId: userId,
      targetDetails: `Set tier ${tier.name} (${tierId}) for ${user.email} (was ${user.subscription_tier_id || 'none'}). Expires: ${expiresAt.split('T')[0]} (+${durationDays}d). Credits added: ${creditsAdded}`,
      ...clientInfo,
    });

    return c.json({
      success: true,
      data: {
        message: `Subscription set to ${tier.name} for ${durationDays} days`,
        tierId,
        tierName: tier.name,
        expiresAt,
        creditsAdded,
      },
    });
  } catch (error) {
    console.error('Set tier error:', error);
    return c.json({ success: false, error: 'Failed to set subscription tier' }, 500);
  }
});

// Compare AI models side by side (admin eval tool)
adminApp.post('/ai-compare', async (c) => {
  const { prompt, systemPrompt, models } = await c.req.json();

  if (!prompt || typeof prompt !== 'string' || prompt.length > 8000) {
    return c.json({ success: false, error: 'prompt is required (max 8000 chars)' }, 400);
  }

  const modelList: string[] = Array.isArray(models) && models.length > 0
    ? models.slice(0, 3).filter((m: unknown) => typeof m === 'string' && m.startsWith('@cf/'))
    : [getChatModel(c.env), getGenerationModel(c.env)];

  const results = await Promise.all(modelList.map(async (model: string) => {
    const started = Date.now();
    try {
      const messages = [
        ...(systemPrompt ? [{ role: 'system' as const, content: String(systemPrompt).slice(0, 4000) }] : []),
        { role: 'user' as const, content: prompt },
      ];
      const result = await c.env.AI.run(model, {
        messages, max_tokens: 1024, temperature: 0.7,
      });
      const output = typeof result === 'object' && result !== null && 'response' in result
        ? (result as { response: string }).response
        : String(result);
      const tokensUsed = typeof result === 'object' && result !== null && 'usage' in result
        ? ((result as { usage?: { total_tokens?: number } }).usage?.total_tokens ?? null)
        : null;
      return { model, ok: true, latencyMs: Date.now() - started, output, tokensUsed };
    } catch (error) {
      return { model, ok: false, latencyMs: Date.now() - started, output: '', tokensUsed: null, error: error instanceof Error ? error.message : String(error) };
    }
  }));

  return c.json({ success: true, data: { results } });
});

// Get user subscription/trial details (admin view)
adminApp.get('/users/:id/subscription', async (c) => {
  const userId = c.req.param('id');

  try {
    // There is no user_subscriptions table — the tier lives on the user row.
    const user = await c.env.DB.prepare(`
      SELECT
        u.id, u.email, u.name, u.role, u.ai_grading_credits,
        u.trial_started_at, u.trial_expires_at,
        u.subscription_tier_id, u.subscription_expires_at,
        st.name as plan_name, st.slug as plan_slug,
        st.ai_grading_quota, st.price_monthly, st.price_yearly
      FROM users u
      LEFT JOIN subscription_tiers st ON u.subscription_tier_id = st.id
      WHERE u.id = ?
    `).bind(userId).first();

    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    const trial = await c.env.DB.prepare(`
      SELECT id, started_at, expires_at, status, tasks_completed, discount_percent
      FROM user_trials WHERE user_id = ?
    `).bind(userId).first();

    const now = new Date();

    let trialDaysRemaining = 0;
    if (trial && trial.status === 'active') {
      const expiresAt = new Date(trial.expires_at as string);
      trialDaysRemaining = Math.max(0, Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)));
    }

    const hasPaidTier = user.subscription_tier_id && user.subscription_tier_id !== 'tier_free';
    const subExpiresAt = user.subscription_expires_at ? new Date(user.subscription_expires_at as string) : null;
    const subActive = hasPaidTier && subExpiresAt ? subExpiresAt > now : false;
    const subscriptionDaysRemaining = subExpiresAt
      ? Math.max(0, Math.ceil((subExpiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
      : 0;

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
        subscription: hasPaidTier ? {
          planName: user.plan_name || user.subscription_tier_id,
          status: subActive ? 'active' : 'expired',
          billingCycle: (user.plan_slug as string || '').endsWith('yearly') ? 'yearly' : 'monthly',
          expiresAt: user.subscription_expires_at,
          daysRemaining: subscriptionDaysRemaining,
          aiGradingQuota: user.ai_grading_quota || 0,
        } : null,
      }
    });
  } catch (error) {
    console.error('Get user subscription error:', error);
    return c.json({ success: false, error: 'Failed to get subscription details' }, 500);
  }
});

// Growth loop: minimal founder knob for tuning a race cycle's target/window.
adminApp.patch('/race/cycles/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const updates: string[] = [];
    const binds: unknown[] = [];

    if (body.targetPoints !== undefined) {
      const target = Number(body.targetPoints);
      if (!Number.isFinite(target) || target <= 0) {
        return c.json({ success: false, error: 'targetPoints must be a positive number' }, 400);
      }
      updates.push('target_points = ?');
      binds.push(Math.round(target));
    }

    if (body.endsAt !== undefined) {
      if (typeof body.endsAt !== 'string' || isNaN(Date.parse(body.endsAt))) {
        return c.json({ success: false, error: 'endsAt must be a valid datetime string' }, 400);
      }
      updates.push('ends_at = ?');
      binds.push(body.endsAt);
    }

    if (updates.length === 0) {
      return c.json({ success: false, error: 'Nothing to update' }, 400);
    }

    binds.push(id);
    const result = await c.env.DB.prepare(
      `UPDATE race_cycles SET ${updates.join(', ')} WHERE id = ?`
    ).bind(...binds).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Cycle not found' }, 404);
    }
    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Admin update race cycle error:', error);
    return c.json({ success: false, error: 'Failed to update race cycle' }, 500);
  }
});

// ---------------------------------------------------------------------------
// Pilot schools admin (Task 1): school CRUD-lite, ambassador provisioning,
// and student assignment. Ambassador accounts are system-owned users with an
// unusable password sentinel; their affiliate profile's referral_code doubles
// as the school's invite code; registration still requires admin approval.
// ---------------------------------------------------------------------------

interface SchoolRow {
  id: string;
  name: string;
  slug: string;
  status: string;
  created_at: string;
}

adminApp.get('/schools', async (c) => {
  try {
    // One round-trip: studentCount and ambassadorCode are correlated
    // subqueries instead of N+1 lookups. The ambassador is identified as the
    // affiliate profile whose owner user belongs to the school and carries the
    // system-generated @ambassador.brilla mailbox.
    const result = await c.env.DB.prepare(`
      SELECT s.id, s.name, s.slug, s.status, s.created_at,
        (SELECT COUNT(*) FROM users u WHERE u.school_id = s.id
          AND u.email NOT LIKE '%@ambassador.brilla') AS student_count,
        (SELECT ap.referral_code FROM affiliate_profiles ap
         JOIN users au ON au.id = ap.user_id
         WHERE au.school_id = s.id AND au.email LIKE '%@ambassador.brilla'
         LIMIT 1) AS ambassador_code,
        sc.channel_id AS telegram_channel_id,
        sc.channel_name AS telegram_channel_name,
        sc.broken AS telegram_channel_broken
      FROM schools s
      LEFT JOIN school_channels sc ON sc.school_id = s.id
      ORDER BY s.created_at DESC
    `).all<SchoolRow & {
      student_count: number;
      ambassador_code: string | null;
      telegram_channel_id: string | null;
      telegram_channel_name: string | null;
      telegram_channel_broken: number | null;
    }>();

    const schools = (result.results || []).map((row) => ({
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      studentCount: row.student_count ?? 0,
      ambassadorCode: row.ambassador_code ?? null,
      telegramChannelId: row.telegram_channel_id ?? null,
      telegramChannelName: row.telegram_channel_name ?? null,
      telegramChannelBroken: Boolean(row.telegram_channel_broken),
      createdAt: row.created_at,
    }));
    return c.json({ success: true, data: { schools } });
  } catch (error) {
    console.error('Admin list schools error:', error);
    return c.json({ success: false, error: 'Failed to list schools' }, 500);
  }
});

adminApp.post('/schools', async (c) => {
  try {
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const slug = typeof body.slug === 'string' ? body.slug.trim().toLowerCase() : '';

    if (name.length < 2 || name.length > 100) {
      return c.json({ success: false, error: 'name must be 2-100 characters' }, 400);
    }
    if (!/^[a-z0-9-]{2,40}$/.test(slug)) {
      return c.json({ success: false, error: 'slug must be 2-40 chars of a-z, 0-9 and hyphens' }, 400);
    }

    const existing = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE slug = ?'
    ).bind(slug).first();
    if (existing) {
      return c.json({ success: false, error: 'A school with this slug already exists' }, 400);
    }

    const id = `sch_${slug}`;
    try {
      await c.env.DB.prepare(
        'INSERT INTO schools (id, name, slug) VALUES (?, ?, ?)'
      ).bind(id, name, slug).run();
    } catch (insertError) {
      // Race fallback: slug claimed between the check and the insert.
      if (String(insertError).includes('UNIQUE')) {
        return c.json({ success: false, error: 'A school with this slug already exists' }, 400);
      }
      throw insertError;
    }

    return c.json({ success: true, data: { id } });
  } catch (error) {
    console.error('Admin create school error:', error);
    return c.json({ success: false, error: 'Failed to create school' }, 500);
  }
});

// Telegram community channel (Task 6): upsert the school's channel row.
// Saving always resets broken = 0 — re-saving after re-adding the bot as a
// channel admin clears the flag. An empty channelId removes the row instead.
adminApp.put('/schools/:id/channel', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    if (typeof body.channelId !== 'string') {
      return c.json({ success: false, error: 'channelId is required' }, 400);
    }
    const channelId = body.channelId.trim();
    if (channelId.length > 64) {
      return c.json({ success: false, error: 'channelId must be at most 64 characters' }, 400);
    }
    const channelName =
      typeof body.channelName === 'string' && body.channelName.trim()
        ? body.channelName.trim()
        : null;

    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first<Pick<SchoolRow, 'id'>>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    if (channelId === '') {
      await c.env.DB.prepare(
        'DELETE FROM school_channels WHERE school_id = ?'
      ).bind(schoolId).run();
    } else {
      await c.env.DB.prepare(
        `INSERT INTO school_channels (school_id, channel_id, channel_name, broken)
         VALUES (?, ?, ?, 0)
         ON CONFLICT(school_id) DO UPDATE SET
           channel_id = excluded.channel_id,
           channel_name = excluded.channel_name,
           broken = 0`
      ).bind(schoolId, channelId, channelName).run();
    }

    return c.json({ success: true, data: { schoolId } });
  } catch (error) {
    console.error('Admin save school channel error:', error);
    return c.json({ success: false, error: 'Failed to save school channel' }, 500);
  }
});

adminApp.post('/schools/:id/ambassador', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    const code = typeof body.code === 'string' ? body.code.trim().toUpperCase() : '';
    if (!isValidReferralCode(code)) {
      return c.json({ success: false, error: 'Invalid referral code format' }, 400);
    }

    const school = await c.env.DB.prepare(
      'SELECT id, name, slug FROM schools WHERE id = ?'
    ).bind(schoolId).first<Pick<SchoolRow, 'id' | 'name' | 'slug'>>();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    // One ambassador per school: the ambassador is the user carrying this
    // school's system-generated @ambassador.brilla mailbox.
    const existingAmbassador = await c.env.DB.prepare(
      `SELECT id FROM users WHERE school_id = ? AND email LIKE '%@ambassador.brilla'`
    ).bind(schoolId).first();
    if (existingAmbassador) {
      return c.json({ success: false, error: 'School already has an ambassador' }, 409);
    }

    const codeTaken = await c.env.DB.prepare(
      'SELECT id FROM affiliate_profiles WHERE referral_code = ?'
    ).bind(code).first();
    if (codeTaken) {
      return c.json({ success: false, error: 'Referral code already in use' }, 409);
    }

    const userId = `user_${crypto.randomUUID()}`;
    const affiliateId = `aff_${crypto.randomUUID()}`;
    const email = `ambassador_${school.slug}@ambassador.brilla`;
    // Unusable password sentinel: not a hash any login attempt can match, and
    // greppable so these accounts are easy to audit. password_hash is NOT NULL
    // on prod, so NULL is not an option.
    const passwordSentinel = `disabled_ambassador_${crypto.randomUUID()}`;

    // User + affiliate profile commit atomically — a half-provisioned
    // ambassador (login without a code, or a code without an owner) must
    // never be observable.
    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO users (id, email, password_hash, name, role, status, is_active, email_verified, school_id)
        VALUES (?, ?, ?, ?, 'student', 'approved', 1, 1, ?)
      `).bind(userId, email, passwordSentinel, `${school.name} Ambassador`, schoolId),
      c.env.DB.prepare(`
        INSERT INTO affiliate_profiles (id, user_id, referral_code, tier_id)
        VALUES (?, ?, ?, 'tier_scout')
      `).bind(affiliateId, userId, code),
    ]);

    return c.json({ success: true, data: { userId, code } });
  } catch (error) {
    console.error('Admin provision ambassador error:', error);
    return c.json({ success: false, error: 'Failed to provision ambassador' }, 500);
  }
});

const ADMIN_EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

adminApp.post('/schools/:id/students', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }

    if (!Array.isArray(body.emails) || body.emails.length === 0) {
      return c.json({ success: false, error: 'emails must be a non-empty array' }, 400);
    }
    if (body.emails.length > 500) {
      return c.json({ success: false, error: 'Maximum 500 emails per request' }, 400);
    }

    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const skipped: { email: string; reason: string }[] = [];
    const validEmails: string[] = [];
    for (const raw of body.emails) {
      const email = typeof raw === 'string' ? raw.trim().toLowerCase() : '';
      if (!ADMIN_EMAIL_RE.test(email)) {
        skipped.push({ email: typeof raw === 'string' ? raw : String(raw), reason: 'invalid_email' });
        continue;
      }
      if (!validEmails.includes(email)) {
        validEmails.push(email);
      }
    }

    // Resolve which candidate emails exist, whether they are already
    // assigned, and whether they are assignable at all (approved students
    // only), so skipped reasons distinguish not_found / already_assigned /
    // not_eligible (a plain UPDATE ... WHERE school_id IS NULL would silently
    // change 0 rows for all three).
    interface BulkUserRow {
      id: string;
      email: string;
      school_id: string | null;
      role: string;
      status: string;
    }
    const existingByEmail = new Map<string, BulkUserRow>();
    if (validEmails.length > 0) {
      const placeholders = validEmails.map(() => '?').join(',');
      const found = await c.env.DB.prepare(
        `SELECT id, email, school_id, role, status FROM users WHERE email IN (${placeholders})`
      ).bind(...validEmails).all<BulkUserRow>();
      for (const row of found.results || []) {
        existingByEmail.set(row.email, row);
      }
    }

    const statements: D1PreparedStatement[] = [];
    let assigned = 0;
    for (const email of validEmails) {
      const user = existingByEmail.get(email);
      if (!user) {
        skipped.push({ email, reason: 'not_found' });
        continue;
      }
      if (user.school_id) {
        skipped.push({ email, reason: 'already_assigned' });
        continue;
      }
      if (user.role !== 'student' || user.status !== 'approved') {
        skipped.push({ email, reason: 'not_eligible' });
        continue;
      }
      // The school_id IS NULL + role/status guards stay in the SQL as a
      // backstop against a concurrent change between the SELECT above and
      // this batch.
      statements.push(
        c.env.DB.prepare(
          `UPDATE users SET school_id = ? WHERE email = ? AND school_id IS NULL
             AND role = 'student' AND status = 'approved'`
        ).bind(schoolId, email)
      );
      assigned++;
    }

    if (statements.length > 0) {
      await c.env.DB.batch(statements);
    }

    return c.json({ success: true, data: { assigned, skipped } });
  } catch (error) {
    console.error('Admin bulk assign students error:', error);
    return c.json({ success: false, error: 'Failed to assign students' }, 500);
  }
});

adminApp.post('/schools/:id/students/:userId', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const userId = c.req.param('userId');
    const body = await parseJsonBody(c);
    if (!body) {
      return c.json({ success: false, error: 'Invalid JSON body' }, 400);
    }
    const force = body.force === true;

    const school = await c.env.DB.prepare(
      'SELECT id FROM schools WHERE id = ?'
    ).bind(schoolId).first();
    if (!school) {
      return c.json({ success: false, error: 'School not found' }, 404);
    }

    const user = await c.env.DB.prepare(
      'SELECT id, school_id, role, status FROM users WHERE id = ?'
    ).bind(userId).first<{ id: string; school_id: string | null; role: string; status: string }>();
    if (!user) {
      return c.json({ success: false, error: 'User not found' }, 404);
    }

    if (user.role !== 'student' || user.status !== 'approved') {
      return c.json({ success: false, error: 'Only approved student accounts can be assigned to a school' }, 409);
    }

    if (user.school_id && user.school_id !== schoolId && !force) {
      return c.json({ success: false, error: 'User already assigned to a school; pass force to reassign' }, 409);
    }

    await c.env.DB.prepare(
      `UPDATE users SET school_id = ? WHERE id = ?
         AND role = 'student' AND status = 'approved'`
    ).bind(schoolId, userId).run();

    return c.json({ success: true, data: { userId, schoolId } });
  } catch (error) {
    console.error('Admin assign student error:', error);
    return c.json({ success: false, error: 'Failed to assign student' }, 500);
  }
});

adminApp.delete('/schools/:id/students/:userId', async (c) => {
  try {
    const schoolId = c.req.param('id');
    const userId = c.req.param('userId');

    const result = await c.env.DB.prepare(
      'UPDATE users SET school_id = NULL WHERE id = ? AND school_id = ?'
    ).bind(userId, schoolId).run();

    if (result.meta.changes === 0) {
      return c.json({ success: false, error: 'Student is not assigned to this school' }, 404);
    }
    return c.json({ success: true, data: { userId } });
  } catch (error) {
    console.error('Admin unassign student error:', error);
    return c.json({ success: false, error: 'Failed to unassign student' }, 500);
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
function generateMockExplanation(_question: string, correctAnswer: string, isCorrect?: boolean, userAnswer?: string, context?: string): string {
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

function generateMockHint(_question: string, level: number): string {
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
    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

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

    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

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

    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

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

    const whereConditions: string[] = [];
    const params: (string | number)[] = [];

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

    // Users whose trial expires in next 7 days (ISO comparisons against bound JS ISO params)
    const nowIso = new Date().toISOString();
    const weekAheadIso = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const expiringSoon = await c.env.DB.prepare(`
      SELECT COUNT(*) as count FROM user_trials
      WHERE status = 'active'
      AND expires_at > ?
      AND expires_at < ?
    `).bind(nowIso, weekAheadIso).first();

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
protectedApp.get('/admin/affiliates/stats', async (c) => {
  const userRole = c.get('userRole') as string;
  if (userRole !== 'admin') {
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
protectedApp.get('/admin/affiliates/list', async (c) => {
  const userRole = c.get('userRole') as string;
  if (userRole !== 'admin') {
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
protectedApp.get('/admin/affiliates/payouts', async (c) => {
  const userRole = c.get('userRole') as string;
  if (userRole !== 'admin') {
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
protectedApp.post('/admin/affiliates/payouts/:id/approve', async (c) => {
  const userRole = c.get('userRole') as string;
  const userId = c.get('userId') as string;
  if (userRole !== 'admin') {
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
    `).bind(userId, payoutId).run();

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
    `).bind(crypto.randomUUID(), userId, payoutId).run();

    return c.json({ success: true, message: 'Payout approved successfully' });
  } catch (error) {
    console.error('Approve payout error:', error);
    return c.json({ success: false, error: 'Failed to approve payout' }, 500);
  }
});

// =============================================
// ADMIN CONTENT MANAGEMENT ENDPOINTS
// =============================================

// Admin/Teacher: Get content list for management
protectedApp.get('/admin/content', async (c) => {
  const userRole = c.get('userRole') as string;
  if (userRole !== 'admin' && userRole !== 'teacher') {
    return c.json({ success: false, error: 'Teacher or admin access required' }, 403);
  }

  try {
    const url = new URL(c.req.url);
    const type = url.searchParams.get('type') || 'all';
    const status = url.searchParams.get('status') || 'all';
    const search = url.searchParams.get('search') || '';
    const limit = parseInt(url.searchParams.get('limit') || '50');

    // Aggregate content from multiple tables
    const contentItems: Array<Record<string, unknown>> = [];

    // Fetch topics
    if (type === 'all' || type === 'topic') {
      const { results: topics } = await c.env.DB.prepare(`
        SELECT
          t.id,
          t.name as title,
          'topic' as type,
          s.name as subject,
          'NSMQ' as examType,
          'published' as status,
          t.created_at as createdAt,
          t.created_at as updatedAt,
          'System' as author,
          0 as views
        FROM topics t
        LEFT JOIN subjects s ON t.subject_id = s.id
        WHERE (? = '' OR t.name LIKE '%' || ? || '%')
        ORDER BY t.created_at DESC
        LIMIT ?
      `).bind(search, search, limit).all();
      contentItems.push(...topics);
    }

    // Fetch questions count by subject
    if (type === 'all' || type === 'question') {
      const { results: questionSets } = await c.env.DB.prepare(`
        SELECT
          'qs_' || s.id as id,
          s.name || ' Question Bank' as title,
          'question' as type,
          s.name as subject,
          'NSMQ' as examType,
          'published' as status,
          datetime('now') as createdAt,
          datetime('now') as updatedAt,
          'System' as author,
          COUNT(q.id) as views
        FROM subjects s
        LEFT JOIN questions q ON q.subject_id = s.id
        GROUP BY s.id, s.name
        ORDER BY COUNT(q.id) DESC
      `).all();
      contentItems.push(...questionSets);
    }

    // Fetch papers
    if (type === 'all' || type === 'paper') {
      const { results: papers } = await c.env.DB.prepare(`
        SELECT
          p.id,
          p.name as title,
          'paper' as type,
          s.name as subject,
          UPPER(p.exam_type) as examType,
          CASE WHEN p.is_published = 1 THEN 'published' ELSE 'draft' END as status,
          p.created_at as createdAt,
          p.created_at as updatedAt,
          'Admin' as author,
          0 as views
        FROM papers p
        LEFT JOIN subjects s ON p.subject_id = s.id
        WHERE (? = '' OR p.name LIKE '%' || ? || '%')
        ORDER BY p.created_at DESC
        LIMIT ?
      `).bind(search, search, limit).all();
      contentItems.push(...papers);
    }

    // Fetch essay questions
    if (type === 'all' || type === 'essay') {
      const { results: essays } = await c.env.DB.prepare(`
        SELECT
          eq.id,
          SUBSTR(eq.question_text, 1, 50) || '...' as title,
          'essay' as type,
          s.name as subject,
          UPPER(eq.exam_type) as examType,
          CASE WHEN eq.ai_grading_enabled = 1 THEN 'published' ELSE 'draft' END as status,
          eq.created_at as createdAt,
          eq.created_at as updatedAt,
          'System' as author,
          0 as views
        FROM essay_questions eq
        LEFT JOIN subjects s ON eq.subject_id = s.id
        WHERE (? = '' OR eq.question_text LIKE '%' || ? || '%')
        ORDER BY eq.created_at DESC
        LIMIT ?
      `).bind(search, search, limit).all();
      contentItems.push(...essays);
    }

    // Filter by status if specified
    let filteredContent = contentItems;
    if (status !== 'all') {
      filteredContent = contentItems.filter(item => item.status === status);
    }

    // Sort by updatedAt descending
    filteredContent.sort((a, b) =>
      new Date(b.updatedAt as string).getTime() - new Date(a.updatedAt as string).getTime()
    );

    // Calculate stats
    const stats = {
      total: filteredContent.length,
      published: filteredContent.filter(c => c.status === 'published').length,
      drafts: filteredContent.filter(c => c.status === 'draft').length,
      views: filteredContent.reduce((sum, c) => sum + (Number(c.views) || 0), 0),
    };

    return c.json({
      success: true,
      data: filteredContent.slice(0, limit),
      stats,
    });
  } catch (error) {
    console.error('Admin content list error:', error);
    return c.json({ success: false, error: 'Failed to fetch content' }, 500);
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
            options: transformQuestionOptions(q.options, q.correct_answer as string),
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
        const { userNormalized, correctNormalized } = normalizeAnswerForComparison(
          answer,
          correctAnswer as string
        );
        isCorrect = userNormalized === correctNormalized;
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

// NOTE: GET /questions/bank is served only by the app-level requireAuth
// route registered just before `app.route('/api', publicApp)` above.
// publicApp's `/questions/:id` param route is registered earlier than
// protectedApp's routes and would shadow any protectedApp copy here
// (Hono: first-registered matching route wins).

// Search students (for adding to classes)
protectedApp.get('/students/search', async (c) => {
  try {
    const search = c.req.query('search');
    const schoolLevel = c.req.query('schoolLevel');
    const yearGroup = c.req.query('yearGroup');
    const limit = parseLimit(c, 20);

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

// Mount Recordings routes (whiteboard recordings)
app.route('/api/recordings', recordingsApp);
app.route('/api/whiteboards', whiteboardsApp);

// Mount Virtual Lab routes (server-side sessions, event stream, grading)
app.route('/api/lab', labApp);

// Mount Teacher Bonuses routes
app.route('/api/teacher-bonuses', teacherBonusesRouter);

// Mount Tutoring Marketplace routes
app.route('/api/tutoring', tutoringRouter);

// Mount Engagement Feature routes
app.route('/api/quickplay', quickPlayApp);
app.route('/api/learning', learningPathApp);
app.route('/api/activity', activityFeedApp);
app.route('/api/events', eventsApp);
app.route('/api/guidance', guidanceApp);
app.route('/api/team-battles', teamBattlesApp);
app.route('/api/cosmetics', cosmeticsApp);
app.route('/api/rewards', rewardsApp);
app.route('/api/engagement', engagementApp);
app.route('/api/friends', friendsApp);
app.route('/api/revision-classroom', revisionClassroomApp);
app.route('/api/study-rooms', studyRoomsApp);
app.route('/api/tutor-classroom', tutorClassroomApp);

// Mount Race routes (growth loop; /current authed, /cycles public, param-free paths)
app.route('/api/race', raceApp);

// Telegram bot webhook — deliberately unauthenticated (Telegram holds no user
// JWT); guarded by TELEGRAM_WEBHOOK_SECRET header check inside telegram.ts.
app.route('/api/telegram', telegramWebhookApp);

// Mount OAuth routes (public with internal auth handling)
app.route('/api/auth/oauth', oauthApp);

// Consent-gated referral marketing preferences, provider webhooks, and
// admin-only draft preparation. This router deliberately has no send endpoint.
app.route('/api/marketing', marketingCampaignsApp);

// Mount protected routes (must be after all protectedApp routes are defined)
app.route('/api', protectedApp);

// 404 handler
app.notFound((c) => {
  return c.json({ success: false, error: 'Not found' }, 404);
});

// Error handler
app.onError((err, c) => {
  console.error('Unhandled error:', err); // detail stays in logs
  return c.json({ success: false, error: 'Internal server error' }, 500);
});

// =============================================
// SCHEDULED HANDLER - Demo Data Cleanup (Cron)
// =============================================

// Cloudflare Worker with scheduled handler
export default {
  fetch: app.fetch,

  // Scheduled handler for Cron triggers
  async scheduled(_event: ScheduledEvent, env: Env, ctx: ExecutionContext): Promise<void> {
    console.log(`Scheduled cleanup triggered at ${new Date().toISOString()}`);

    try {
      const result = await cleanupExpiredDemoData(env.DB);
      console.log(`Demo data cleanup complete: ${result.rowsDeleted} rows deleted from ${result.tablesProcessed} tables`);
    } catch (error) {
      console.error('Demo data cleanup failed:', error);
    }

    // Clean up old rate limit records
    try {
      await cleanupRateLimits(env.DB);
      console.log('Rate limit cleanup complete');
    } catch (error) {
      console.error('Rate limit cleanup failed:', error);
    }

    // Clean up stale paper attempts (older than 48 hours)
    try {
      const stalePaperAttempts = await env.DB.prepare(`
        UPDATE paper_attempts
        SET status = 'abandoned'
        WHERE status = 'in_progress'
        AND datetime(started_at) < datetime('now', '-48 hours')
      `).run();
      console.log(`Stale paper attempts cleanup: ${stalePaperAttempts.meta.changes} attempts abandoned`);
    } catch (error) {
      console.error('Paper attempts cleanup failed:', error);
    }

    // Growth loop: crown ended race cycles, open next week's cycles
    try {
      const race = await runRaceCycleMaintenance(env.DB, Number(env.RACE_TARGET_POINTS) || 1000);
      console.log(`Race maintenance: ${race.crowned} crowned, ${race.opened} opened`);
    } catch (error) {
      console.error('Race cycle maintenance failed:', error);
    }

    // Reconcile stale subscription checkouts against Paystack. This never fails
    // rows based on age alone and processes a bounded provider-verified batch.
    if (env.PAYSTACK_SECRET_KEY) {
      ctx.waitUntil(
        runPaymentReconciliation(env.DB, env.PAYSTACK_SECRET_KEY)
          .then((result) => console.log(
            `Payment reconciliation: ${result.checked} checked, ${result.settled} settled, ${result.failed} failed, ${result.stillPending} pending, ${result.providerErrors} provider errors, ${result.affiliateRepairs} affiliate repairs`,
          ))
          .catch((error) => console.error('Payment reconciliation failed:', error)),
      );
    } else {
      console.error('Payment reconciliation skipped: PAYSTACK_SECRET_KEY is unavailable');
    }

    // Telegram community alerts: fire-and-forget. Cron "success" no longer
    // implies delivery success — failures log loudly but never fail the cron.
    ctx.waitUntil(
      runTelegramRaceAlerts(env.DB, env)
        .then((r) => console.log(`Telegram alerts: ${r.posts} posts, ${r.dms} DMs`))
        .catch((e) => console.error('Telegram race alerts failed:', e))
    );
  },
};
