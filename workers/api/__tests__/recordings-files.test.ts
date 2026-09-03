import { describe, expect, it } from 'vitest';
import { sign } from 'hono/jwt';
import { recordingsApp } from '../recordings';
import { createMockD1, type MockD1 } from './helpers/mockD1';

// Regression tests for the recordings file-serving security audit:
// - /files/ must not serve private recordings to unauthenticated callers
// - access is gated on is_public, a valid share token, or a signed URL
// - uploads must reject content types outside the per-asset whitelist
// - responses must set nosniff and must not set Access-Control-Allow-Origin: *

const JWT_SECRET = 'test-secret-that-is-long-enough';

async function teacherAuth(userId = 'teacher_1') {
  const now = Math.floor(Date.now() / 1000);
  const token = await sign({ userId, role: 'teacher', iat: now, exp: now + 3600 }, JWT_SECRET);
  return { Authorization: `Bearer ${token}` };
}

function mockBucket(files: Record<string, { contentType: string; body?: string }>) {
  return {
    async get(key: string) {
      const file = files[key];
      if (!file) return null;
      return {
        body: new Blob([file.body ?? 'data']).stream(),
        httpMetadata: { contentType: file.contentType },
      };
    },
    async put() {},
    async delete() {},
  };
}

function fileServingDb(recording: { is_public: number; status: string } | null, share?: unknown): MockD1 {
  return createMockD1([
    {
      match: /SELECT is_public, status FROM whiteboard_recordings/,
      first: () => recording,
    },
    {
      match: /FROM recording_shares/,
      first: () => share ?? null,
    },
  ]);
}

function env(db: MockD1, bucket: ReturnType<typeof mockBucket>) {
  return { DB: db, JWT_SECRET, RECORDINGS_BUCKET: bucket, APP_URL: 'https://brillaprep.org' };
}

describe('GET /files/* authorization', () => {
  const bucket = () => mockBucket({
    'recordings/rec_private/audio.webm': { contentType: 'audio/webm' },
    'recordings/rec_public/audio.webm': { contentType: 'audio/webm' },
  });

  it('rejects an unauthenticated request for a private recording file', async () => {
    const db = fileServingDb({ is_public: 0, status: 'active' });
    const res = await recordingsApp.request(
      '/files/recordings/rec_private/audio.webm',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(403);
  });

  it('returns 404 for an unknown recording id (no existence leak)', async () => {
    const db = fileServingDb(null);
    const res = await recordingsApp.request(
      '/files/recordings/rec_unknown/audio.webm',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 for deleted recordings', async () => {
    const db = fileServingDb({ is_public: 1, status: 'deleted' });
    const res = await recordingsApp.request(
      '/files/recordings/rec_public/audio.webm',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(404);
  });

  it('returns 404 for paths outside the recordings/<id>/<asset> shape', async () => {
    const db = fileServingDb({ is_public: 1, status: 'active' });
    const res = await recordingsApp.request(
      '/files/recordings/',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(404);
  });

  it('serves is_public recordings without auth, with nosniff and no wildcard CORS', async () => {
    const db = fileServingDb({ is_public: 1, status: 'active' });
    const res = await recordingsApp.request(
      '/files/recordings/rec_public/audio.webm',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(200);
    expect(res.headers.get('Content-Type')).toBe('audio/webm');
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
    expect(res.headers.get('Access-Control-Allow-Origin')).not.toBe('*');
  });

  it('serves a private recording with a valid share token', async () => {
    const share = { expires_at: null, max_views: null, current_views: 0 };
    const db = fileServingDb({ is_public: 0, status: 'active' }, share);
    const res = await recordingsApp.request(
      '/files/recordings/rec_private/audio.webm?share=validtoken123',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(200);

    const shareLookup = db.calls.find((call) => call.sql.includes('FROM recording_shares'));
    expect(shareLookup?.binds).toEqual(['validtoken123', 'rec_private']);
  });

  it('rejects an expired share token', async () => {
    const share = {
      expires_at: new Date(Date.now() - 60_000).toISOString(),
      max_views: null,
      current_views: 0,
    };
    const db = fileServingDb({ is_public: 0, status: 'active' }, share);
    const res = await recordingsApp.request(
      '/files/recordings/rec_private/audio.webm?share=expiredtoken',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(403);
  });

  it('rejects a share token that has exhausted its view limit', async () => {
    const share = { expires_at: null, max_views: 3, current_views: 3 };
    const db = fileServingDb({ is_public: 0, status: 'active' }, share);
    const res = await recordingsApp.request(
      '/files/recordings/rec_private/audio.webm?share=maxedtoken',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(403);
  });

  it('rejects a revoked or unknown share token', async () => {
    // No matching active share row -> lookup returns null.
    const db = fileServingDb({ is_public: 0, status: 'active' }, null);
    const res = await recordingsApp.request(
      '/files/recordings/rec_private/audio.webm?share=revokedtoken',
      {},
      env(db, bucket()),
    );

    expect(res.status).toBe(403);
  });
});

describe('signed file URLs', () => {
  const recordingRow = {
    id: 'rec_private',
    teacher_id: 'teacher_1',
    title: 'Lesson',
    description: null,
    duration: 60000,
    thumbnail_url: '/api/recordings/files/recordings/rec_private/thumbnail.png',
    canvas_events_url: '/api/recordings/files/recordings/rec_private/events.json',
    audio_url: '/api/recordings/files/recordings/rec_private/audio.webm',
    webcam_url: null,
    canvas_width: 1200,
    canvas_height: 800,
    initial_canvas_json: null,
    subject_id: null,
    topic_id: null,
    status: 'active',
    is_public: 0,
    view_count: 0,
    created_at: '2026-01-01T00:00:00.000Z',
    updated_at: '2026-01-01T00:00:00.000Z',
    teacher_name: 'Teacher One',
  };

  function signedUrlDb(): MockD1 {
    return createMockD1([
      {
        match: /role, status, is_active, session_version FROM users/,
        first: () => ({ role: 'teacher', status: 'approved', is_active: 1, session_version: 0 }),
      },
      {
        match: /SELECT wr\.\*, u\.name as teacher_name/,
        first: () => recordingRow,
      },
      {
        match: /SELECT is_public, status FROM whiteboard_recordings/,
        first: () => ({ is_public: 0, status: 'active' }),
      },
      { match: /FROM recording_shares/, first: () => null },
    ]);
  }

  const bucket = () => mockBucket({
    'recordings/rec_private/events.json': { contentType: 'application/json', body: '{"events":[]}' },
    'recordings/rec_private/audio.webm': { contentType: 'audio/webm' },
  });

  async function mintSignedUrl(): Promise<string> {
    const res = await recordingsApp.request('/rec_private', {
      headers: await teacherAuth(),
    }, env(signedUrlDb(), bucket()));
    expect(res.status).toBe(200);
    const body = await res.json() as { data: { canvasEventsUrl: string } };
    // Strip the API mount prefix so the URL targets recordingsApp directly.
    return body.data.canvasEventsUrl.replace('/api/recordings', '');
  }

  it('mints signed asset URLs from the authorized metadata endpoint and serves them', async () => {
    const signedPath = await mintSignedUrl();
    expect(signedPath).toMatch(/\/files\/recordings\/rec_private\/events\.json\?sig=[0-9a-f]{64}&exp=\d+/);

    const res = await recordingsApp.request(signedPath, {}, env(signedUrlDb(), bucket()));
    expect(res.status).toBe(200);
    expect(res.headers.get('X-Content-Type-Options')).toBe('nosniff');
  });

  it('rejects a tampered signature', async () => {
    const signedPath = await mintSignedUrl();
    const tampered = signedPath.replace(/sig=[0-9a-f]{2}/, 'sig=ff');

    const res = await recordingsApp.request(tampered, {}, env(signedUrlDb(), bucket()));
    expect(res.status).toBe(403);
  });

  it('rejects an expired signature', async () => {
    const signedPath = await mintSignedUrl();
    const expired = signedPath.replace(/exp=\d+/, `exp=${Date.now() - 1000}`);

    const res = await recordingsApp.request(expired, {}, env(signedUrlDb(), bucket()));
    expect(res.status).toBe(403);
  });

  it('rejects a signature replayed against a different asset path', async () => {
    const signedPath = await mintSignedUrl();
    const replayed = signedPath.replace('events.json', 'audio.webm');

    const res = await recordingsApp.request(replayed, {}, env(signedUrlDb(), bucket()));
    expect(res.status).toBe(403);
  });
});

describe('PUT /upload/:recordingId/:fileType content-type whitelist', () => {
  function uploadDb(): MockD1 {
    return createMockD1([
      {
        match: /role, status, is_active, session_version FROM users/,
        first: () => ({ role: 'teacher', status: 'approved', is_active: 1, session_version: 0 }),
      },
      {
        match: /SELECT id, teacher_id FROM whiteboard_recordings/,
        first: () => ({ id: 'rec_1', teacher_id: 'teacher_1' }),
      },
      {
        match: /UPDATE whiteboard_recordings SET \w+ = \?/,
        run: () => ({ success: true, meta: { changes: 1 } }),
      },
    ]);
  }

  async function upload(fileType: string, contentType: string | null) {
    const headers: Record<string, string> = { ...(await teacherAuth()) };
    if (contentType !== null) headers['Content-Type'] = contentType;
    return recordingsApp.request(`/upload/rec_1/${fileType}`, {
      method: 'PUT',
      headers,
      body: new Blob(['data']),
    }, env(uploadDb(), mockBucket({})));
  }

  it('rejects a disallowed content type (text/html) with 415', async () => {
    const res = await upload('audio', 'text/html');
    expect(res.status).toBe(415);
  });

  it('rejects a missing content type with 415', async () => {
    const res = await upload('events', null);
    expect(res.status).toBe(415);
  });

  it('rejects a mismatched asset content type (audio upload as image/png) with 415', async () => {
    const res = await upload('audio', 'image/png');
    expect(res.status).toBe(415);
  });

  it('accepts audio/webm with codec parameters', async () => {
    const res = await upload('audio', 'audio/webm;codecs=opus');
    expect(res.status).toBe(200);
  });

  it('accepts application/json for canvas events', async () => {
    const res = await upload('events', 'application/json');
    expect(res.status).toBe(200);
  });

  it('accepts image/png for thumbnails', async () => {
    const res = await upload('thumbnail', 'image/png');
    expect(res.status).toBe(200);
  });
});
