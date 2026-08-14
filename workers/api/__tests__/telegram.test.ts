import { describe, it, expect, vi, afterEach } from 'vitest';
import { sign } from 'hono/jwt';
import { telegramWebhookApp, CONNECT_POINTS, LINK_TOKEN_TTL_MS } from '../telegram';
import { notificationsApp } from '../notifications';
import { createMockD1 } from './helpers/mockD1';

// Telegram core module: bot webhook (secret-guarded, unauthenticated), the
// /start link-token handshake (idempotent consume, chat_id uniqueness,
// one-time connect points), and the authed link/status/community endpoints.

const JWT_SECRET = 'test-secret-that-is-long-enough';
const WEBHOOK_SECRET = 'whsec-test';
const BOT_TOKEN = 'bot-token-test';
const ACTIVE_USER = { role: 'student', status: 'approved', is_active: 1 };
const TOKEN = 'A'.repeat(22); // matches /^[A-Za-z0-9_-]{22}$/
const FUTURE = new Date(Date.now() + LINK_TOKEN_TTL_MS).toISOString();

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubTelegramFetch() {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), { status: 200 }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function sentTexts(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes('/sendMessage'))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string).text as string);
}

function startRequest(text: string, chatId = 555, username = 'student1', secret = WEBHOOK_SECRET) {
  const headers: Record<string, string> = { 'content-type': 'application/json' };
  if (secret) headers['X-Telegram-Bot-Api-Secret-Token'] = secret;
  return new Request('http://x/webhook', {
    method: 'POST',
    headers,
    body: JSON.stringify({ message: { text, chat: { id: chatId }, from: { username } } }),
  });
}

function webhookEnv(db: unknown) {
  return {
    DB: db,
    TELEGRAM_WEBHOOK_SECRET: WEBHOOK_SECRET,
    TELEGRAM_BOT_TOKEN: BOT_TOKEN,
  };
}

interface HandshakeOpts {
  tokenRow?: unknown;
  consumeChanges?: number;
  chatHolder?: unknown;
  existingLink?: unknown;
}

function handshakeDb(opts: HandshakeOpts) {
  return createMockD1([
    { match: /FROM telegram_link_tokens WHERE token/, first: () => opts.tokenRow ?? null },
    {
      match: /UPDATE telegram_link_tokens SET used_at/,
      run: () => ({ success: true, meta: { changes: opts.consumeChanges ?? 1 } }),
    },
    { match: /FROM telegram_links WHERE chat_id/, first: () => opts.chatHolder ?? null },
    { match: /FROM telegram_links WHERE user_id/, first: () => opts.existingLink ?? null },
    { match: /INSERT INTO telegram_links/, run: () => ({ success: true, meta: { changes: 1 } }) },
    // awardPoints('notification_subscribe'): uncapped source → no cap query;
    // no active cycle → first() null; user has no house → house insert skipped.
    { match: /UPDATE users SET xp_points/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /FROM race_cycles/, first: () => null },
    { match: /INSERT INTO points_ledger/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /SELECT house FROM users/, first: () => null },
  ]);
}

describe('telegram webhook — secret validation (a)', () => {
  it('401 when the secret header is missing', async () => {
    const res = await telegramWebhookApp.fetch(
      startRequest('/start', 555, 'u', ''),
      webhookEnv(createMockD1([])),
    );
    expect(res.status).toBe(401);
  });

  it('401 when the secret is wrong', async () => {
    const res = await telegramWebhookApp.fetch(
      startRequest('/start', 555, 'u', 'wrong-secret'),
      webhookEnv(createMockD1([])),
    );
    expect(res.status).toBe(401);
  });

  it('401 when TELEGRAM_WEBHOOK_SECRET is not configured', async () => {
    const res = await telegramWebhookApp.fetch(startRequest('/start'), {
      DB: createMockD1([]),
      TELEGRAM_BOT_TOKEN: BOT_TOKEN,
    });
    expect(res.status).toBe(401);
  });

  it('200 when the secret is correct (non-/start updates acknowledged)', async () => {
    const res = await telegramWebhookApp.fetch(
      startRequest('hello there'),
      webhookEnv(createMockD1([])),
    );
    expect(res.status).toBe(200);
  });
});

describe('telegram webhook — /start handshake (b)', () => {
  it('valid token links the chat, awards 100 notification_subscribe points, replies', async () => {
    const fetchMock = stubTelegramFetch();
    const db = handshakeDb({
      tokenRow: { token: TOKEN, user_id: 'user_1', expires_at: FUTURE, used_at: null },
    });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(res.status).toBe(200);

    // Link upserted for the token's user with the chat_id + username.
    const linkInsert = db.calls.find((c) => /INSERT INTO telegram_links/.test(c.sql));
    expect(linkInsert).toBeDefined();
    expect(linkInsert!.binds[0]).toBe('user_1');
    expect(linkInsert!.binds[1]).toBe('555');
    expect(linkInsert!.binds[2]).toBe('student1');

    // Connect points awarded via awardPoints → points_ledger with the house source.
    const ledger = db.calls.find((c) => /INSERT INTO points_ledger/.test(c.sql));
    expect(ledger).toBeDefined();
    expect(ledger!.binds[1]).toBe('user_1');
    expect(ledger!.binds[2]).toBe(CONNECT_POINTS);
    expect(ledger!.binds[3]).toBe('notification_subscribe');
    expect(ledger!.binds[4]).toBe('555');

    // Confirmation sent through the Bot API envelope.
    expect(fetchMock).toHaveBeenCalled();
    const [url] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`);
    expect(sentTexts(fetchMock).some((t) => t.includes('Connected'))).toBe(true);
  });
});

describe('telegram webhook — replay idempotency (c)', () => {
  it('replayed /start (guarded update changes=0) → no second award, still 200', async () => {
    const fetchMock = stubTelegramFetch();
    const db = handshakeDb({
      tokenRow: { token: TOKEN, user_id: 'user_1', expires_at: FUTURE, used_at: null },
      consumeChanges: 0,
    });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO telegram_links/.test(c.sql))).toBe(false);
    expect(sentTexts(fetchMock).some((t) => t.includes('already used'))).toBe(true);
  });
});

describe('telegram webhook — expired token (d)', () => {
  it('expired token → polite failure reply, no consume, no award', async () => {
    const fetchMock = stubTelegramFetch();
    const past = new Date(Date.now() - 1000).toISOString();
    const db = handshakeDb({
      tokenRow: { token: TOKEN, user_id: 'user_1', expires_at: past, used_at: null },
    });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /UPDATE telegram_link_tokens/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(sentTexts(fetchMock).some((t) => t.includes('expired'))).toBe(true);
  });

  it('unknown token → polite failure reply, no award', async () => {
    const fetchMock = stubTelegramFetch();
    const db = handshakeDb({ tokenRow: null });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(sentTexts(fetchMock).length).toBe(1);
  });
});

describe('telegram webhook — chat_id held by another user (e)', () => {
  it('no upsert, no award, reply says the Telegram account is already linked', async () => {
    const fetchMock = stubTelegramFetch();
    const db = handshakeDb({
      tokenRow: { token: TOKEN, user_id: 'user_1', expires_at: FUTURE, used_at: null },
      chatHolder: { user_id: 'user_other' },
    });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => /INSERT INTO telegram_links/.test(c.sql))).toBe(false);
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(sentTexts(fetchMock).some((t) => t.includes('already linked'))).toBe(true);
  });
});

describe('telegram webhook — relink same user (f)', () => {
  it('upsert refreshes the link but no second award', async () => {
    const fetchMock = stubTelegramFetch();
    const db = handshakeDb({
      tokenRow: { token: TOKEN, user_id: 'user_1', expires_at: FUTURE, used_at: null },
      chatHolder: { user_id: 'user_1' },
      existingLink: { user_id: 'user_1' },
    });
    const res = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`, 999), webhookEnv(db));
    expect(res.status).toBe(200);

    const linkInsert = db.calls.find((c) => /INSERT INTO telegram_links/.test(c.sql));
    expect(linkInsert).toBeDefined();
    expect(linkInsert!.binds[1]).toBe('999'); // chat_id refreshed
    expect(db.calls.some((c) => /INSERT INTO points_ledger/.test(c.sql))).toBe(false);
    expect(sentTexts(fetchMock).some((t) => t.includes('reconnected'))).toBe(true);
  });
});

describe('telegram webhook — mid-handler failure regression (award atomicity)', () => {
  it('award throws after the link upsert → fresh link rolled back; retry awards exactly once', async () => {
    const fetchMock = stubTelegramFetch();
    const TOKEN2 = 'B'.repeat(22);
    let ledgerInserted = 0;
    let failLedger = true;
    const db = createMockD1([
      {
        match: /FROM telegram_link_tokens WHERE token/,
        first: (binds) => ({ token: binds[0], user_id: 'user_1', expires_at: FUTURE, used_at: null }),
      },
      { match: /UPDATE telegram_link_tokens SET used_at/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /FROM telegram_links WHERE chat_id/, first: () => null },
      // Rolled back after attempt 1, so the retry also sees no prior row.
      { match: /FROM telegram_links WHERE user_id/, first: () => null },
      { match: /INSERT INTO telegram_links/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /DELETE FROM telegram_links/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /UPDATE users SET xp_points/, run: () => ({ success: true, meta: { changes: 1 } }) },
      { match: /FROM race_cycles/, first: () => null },
      {
        match: /INSERT INTO points_ledger/,
        run: () => {
          if (failLedger) {
            failLedger = false;
            throw new Error('simulated D1 fault');
          }
          ledgerInserted++;
          return { success: true, meta: { changes: 1 } };
        },
      },
      { match: /SELECT house FROM users/, first: () => null },
    ]);

    // Attempt 1: D1 fault inside awardPoints → rollback + polite failure reply.
    const first = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN}`), webhookEnv(db));
    expect(first.status).toBe(200);
    expect(ledgerInserted).toBe(0);
    expect(db.calls.some((c) => /DELETE FROM telegram_links/.test(c.sql))).toBe(true);
    expect(sentTexts(fetchMock).some((t) => t.includes('went wrong'))).toBe(true);

    // Retry with a fresh token (the first was consumed): no prior link row
    // (rolled back) → the award fires again and succeeds — exactly once total.
    const second = await telegramWebhookApp.fetch(startRequest(`/start ${TOKEN2}`), webhookEnv(db));
    expect(second.status).toBe(200);
    expect(ledgerInserted).toBe(1);
    expect(sentTexts(fetchMock).some((t) => t.includes('Connected'))).toBe(true);
    // One failed attempt + one success; never two successful ledger inserts.
    expect(db.calls.filter((c) => /INSERT INTO points_ledger/.test(c.sql)).length).toBe(2);
  });
});

// ---- authed endpoints on notificationsApp ----

async function jwtFor(userId: string) {
  return sign(
    { userId, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function notifDb(extra: { linkRow?: unknown } = {}) {
  return createMockD1([
    { match: /SELECT role, status, is_active, session_version FROM users/, first: () => ACTIVE_USER },
    { match: /INSERT INTO telegram_link_tokens/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /FROM telegram_links WHERE user_id/, first: () => extra.linkRow ?? null },
  ]);
}

describe('POST /notifications/telegram/link (g)', () => {
  it('401 without a JWT', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/link', { method: 'POST' }),
      { DB: notifDb(), JWT_SECRET },
    );
    expect(res.status).toBe(401);
  });

  it('503 when TELEGRAM_BOT_USERNAME is not configured', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: notifDb(), JWT_SECRET },
    );
    expect(res.status).toBe(503);
  });

  it('mints a 22-char token, persists ~10-min expiry, returns the start URL', async () => {
    const db = notifDb();
    const before = Date.now();
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/link', {
        method: 'POST',
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: db, JWT_SECRET, TELEGRAM_BOT_USERNAME: 'BrillaPrepBot' },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { success: boolean; data: { startUrl: string; expiresAt: string } };
    expect(body.success).toBe(true);

    const m = body.data.startUrl.match(/^https:\/\/t\.me\/BrillaPrepBot\?start=([A-Za-z0-9_-]{22})$/);
    expect(m).not.toBeNull();
    const token = m![1];

    const expiresMs = new Date(body.data.expiresAt).getTime();
    expect(expiresMs - before).toBeGreaterThan(LINK_TOKEN_TTL_MS - 5000);
    expect(expiresMs - before).toBeLessThanOrEqual(LINK_TOKEN_TTL_MS + 5000);

    const insert = db.calls.find((c) => /INSERT INTO telegram_link_tokens/.test(c.sql));
    expect(insert).toBeDefined();
    expect(insert!.binds[0]).toBe(token);
    expect(insert!.binds[1]).toBe('user_1');
    expect(insert!.binds[2]).toBe(body.data.expiresAt);
  });
});

describe('GET /notifications/telegram/status + /community (h)', () => {
  it('status → linked:false without a row', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/status', {
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: notifDb(), JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { linked: boolean; username: string | null; stale: boolean } };
    expect(body.data).toEqual({ linked: false, username: null, stale: false });
  });

  it('status → linked:true, stale:true with a stale row', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/status', {
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: notifDb({ linkRow: { username: 'student1', stale: 1 } }), JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { linked: boolean; username: string | null; stale: boolean } };
    expect(body.data).toEqual({ linked: true, username: 'student1', stale: true });
  });

  it('community → url:null when TELEGRAM_COMMUNITY_URL is unset', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/community', {
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: notifDb(), JWT_SECRET },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { url: string | null } };
    expect(body.data.url).toBeNull();
  });

  it('community → returns the configured URL', async () => {
    const res = await notificationsApp.fetch(
      new Request('http://x/telegram/community', {
        headers: { Authorization: `Bearer ${await jwtFor('user_1')}` },
      }),
      { DB: notifDb(), JWT_SECRET, TELEGRAM_COMMUNITY_URL: 'https://t.me/brillaprep' },
    );
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { url: string | null } };
    expect(body.data.url).toBe('https://t.me/brillaprep');
  });
});
