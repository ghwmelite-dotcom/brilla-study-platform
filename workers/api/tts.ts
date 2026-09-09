// General-purpose neural TTS (Deepgram Aura 2 via Workers AI) for AI voice
// conversations. Mirrors the revision-classroom /tts pipeline exactly:
// premium-only, R2-cached globally, 502 + ttsUnavailable on failure so the
// frontend falls back to browser speechSynthesis.

import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { isPremiumUser } from './usage-limits';
import { getTtsModel } from './ai-models';
import { ttsCacheKey, extractTtsAudio, TTS_SPEAKER } from './revision-classroom';

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
  AI: Ai; // Cloudflare Workers AI binding
  AI_MODEL_TTS?: string;
  RECORDINGS_BUCKET?: R2Bucket;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const TTS_SPEAK_MAX_CHARS = 2000;

// Aura 2 (English) speaker roster. Unknown/absent voice values fall back to
// TTS_SPEAKER so a bad client can never pick an invalid speaker.
const TTS_SPEAK_SPEAKERS = new Set([
  'asteria', 'luna', 'stella', 'athena', 'hera', 'orion',
  'arcas', 'perseus', 'angus', 'orchid', 'helios', 'zeus',
]);

const ttsApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

ttsApp.use('*', requireAuth);

// API Endpoint: Text-to-speech for AI voice replies (premium-only).
// R2-cached globally; the frontend falls back to speechSynthesis on any
// non-audio response (403 for free tier, 502 ttsUnavailable on failure).
ttsApp.post('/speak', async (c) => {
  // Premium-only — reject before any AI cost is incurred.
  const user = c.get('user');
  if (!(await isPremiumUser(user.userId, c.env.DB))) {
    return c.json({ success: false, error: 'Neural voice is a premium feature.' }, 403);
  }

  const body = await c.req.json().catch(() => null);
  const text = typeof body?.text === 'string' ? body.text.trim() : '';
  if (!text || text.length > TTS_SPEAK_MAX_CHARS) {
    return c.json({ success: false, error: `text is required and must be at most ${TTS_SPEAK_MAX_CHARS} characters` }, 400);
  }

  const requestedVoice = typeof body?.voice === 'string' ? body.voice.trim().toLowerCase() : '';
  const speaker = TTS_SPEAK_SPEAKERS.has(requestedVoice) ? requestedVoice : TTS_SPEAKER;

  const model = getTtsModel(c.env);
  const key = await ttsCacheKey(model, text, speaker);

  try {
    const cached = await c.env.RECORDINGS_BUCKET?.get(key);
    if (cached) {
      return new Response(cached.body, {
        headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Cache': 'hit' },
      });
    }

    const result: unknown = await c.env.AI.run(model as never, {
      text,
      speaker,
      encoding: 'mp3',
    } as never);
    const bytes = await extractTtsAudio(result);
    if (bytes.byteLength === 0) throw new Error('TTS returned empty audio');

    await c.env.RECORDINGS_BUCKET?.put(key, bytes, {
      httpMetadata: { contentType: 'audio/mpeg' },
    });

    return new Response(bytes, {
      headers: { 'Content-Type': 'audio/mpeg', 'X-TTS-Cache': 'miss' },
    });
  } catch (error) {
    console.error('TTS error:', error);
    return c.json({ success: false, error: 'TTS unavailable', ttsUnavailable: true }, 502);
  }
});

export { ttsApp };
