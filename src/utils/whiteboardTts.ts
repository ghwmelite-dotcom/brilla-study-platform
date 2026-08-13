// Server TTS for the AI whiteboard (Deepgram Aura 2 via
// POST /api/revision-classroom/tts), with an in-memory object-URL cache.
// Every failure mode (no token, non-200, network error, play() rejection)
// returns null so the caller can fall back to browser speechSynthesis.

const API_BASE_URL = import.meta.env.VITE_API_URL || '/api';

const cache = new Map<string, Promise<string | null>>();

async function fetchAudioUrl(text: string): Promise<string | null> {
  try {
    const token = localStorage.getItem('brilla_token');
    if (!token) return null;
    const res = await fetch(`${API_BASE_URL}/revision-classroom/tts`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ text }),
    });
    if (!res.ok) return null;
    const blob = await res.blob();
    if (blob.size === 0) return null;
    return URL.createObjectURL(blob);
  } catch {
    return null;
  }
}

// Fire-and-forget warm of the client cache (and, on a miss, the server-side
// R2 cache). Errors are swallowed by design.
export function prefetchTtsAudio(text?: string): void {
  if (!text || typeof window === 'undefined') return;
  if (!cache.has(text)) {
    cache.set(text, fetchAudioUrl(text));
  }
}

// Returns a started Audio element, or null when server audio is unavailable
// (caller falls back to speechSynthesis).
export async function playTtsAudio(text: string): Promise<HTMLAudioElement | null> {
  prefetchTtsAudio(text);
  const url = await cache.get(text)!;
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
export function releaseTtsAudioCache(): void {
  cache.forEach((p) => {
    void p.then((url) => {
      if (url) URL.revokeObjectURL(url);
    });
  });
  cache.clear();
}
