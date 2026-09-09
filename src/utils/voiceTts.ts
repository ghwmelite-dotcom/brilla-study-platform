// Server neural TTS for AI voice conversations (Deepgram Aura 2 via
// POST /api/tts/speak), with an in-memory object-URL cache keyed by
// voice+text. Every failure mode (no token, 403 for free tier, 502
// ttsUnavailable, network error, play() rejection) returns null so the
// caller can fall back to browser speechSynthesis silently.

import { fetchServerTtsAudioUrl } from './whiteboardTts';

const SPEAK_PATH = '/tts/speak';

const cache = new Map<string, Promise<string | null>>();

function cacheKey(text: string, voice?: string): string {
  return `${voice ?? ''}|${text}`;
}

// Fire-and-forget warm of the client cache (and, on a miss, the server-side
// R2 cache). Errors are swallowed by design.
export function prefetchVoiceTtsAudio(text?: string, voice?: string): void {
  if (!text || typeof window === 'undefined') return;
  const key = cacheKey(text, voice);
  if (!cache.has(key)) {
    cache.set(key, fetchServerTtsAudioUrl(SPEAK_PATH, text, voice));
  }
}

// Returns a started Audio element, or null when server audio is unavailable
// (caller falls back to speechSynthesis).
export async function playVoiceTtsAudio(text: string, voice?: string): Promise<HTMLAudioElement | null> {
  prefetchVoiceTtsAudio(text, voice);
  const url = await cache.get(cacheKey(text, voice))!;
  if (!url) return null;
  try {
    const audio = new Audio(url);
    await audio.play();
    return audio;
  } catch {
    return null;
  }
}

// Revoke every cached object URL (call on unmount).
export function releaseVoiceTtsAudioCache(): void {
  cache.forEach((p) => {
    void p.then((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  });
  cache.clear();
}
