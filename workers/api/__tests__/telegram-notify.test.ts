import { describe, it, expect, vi, afterEach } from 'vitest';
import {
  notifyUser,
  notifySchoolChannel,
  notifyPlatformChannel,
  NOTIFY_DM_LIMIT,
} from '../telegram';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Outbound notifier helpers: DM fan-out with 24h rate limiting, stale-link
// lifecycle (403 → stale=1), school-channel broken lifecycle (400/403 →
// broken=1 + admin notifications), platform channel best-effort posts.
// All three helpers must never throw.

const BOT_TOKEN = 'bot-token-test';

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubTelegramFetch(status = 200, body = { ok: true, result: { message_id: 1 } }) {
  const fetchMock = vi.fn().mockResolvedValue(
    new Response(JSON.stringify(body), { status }),
  );
  vi.stubGlobal('fetch', fetchMock);
  return fetchMock;
}

function sendMessageChats(fetchMock: ReturnType<typeof vi.fn>): string[] {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes('/sendMessage'))
    .map(([, init]) => String(JSON.parse((init as RequestInit).body as string).chat_id));
}

// Handlers covering the checkRateLimit custom-config path: window SUM query,
// current-window lookup, and the record insert/update.
function rateLimitHandlers(totalRequests = 0): MockHandler[] {
  return [
    {
      match: /SUM\(request_count\) as total_requests/,
      first: () => ({ total_requests: totalRequests, last_request: new Date().toISOString() }),
    },
    { match: /SELECT id, request_count FROM rate_limits/, first: () => null },
    { match: /INSERT INTO rate_limits/, run: () => ({ success: true, meta: { changes: 1 } }) },
    { match: /UPDATE rate_limits/, run: () => ({ success: true, meta: { changes: 1 } }) },
  ];
}

function notifyDb(extra: MockHandler[]) {
  return createMockD1([...extra, ...rateLimitHandlers()]);
}

describe('notifyUser (a) — unlinked user', () => {
  it('no telegram_links row → false, no Telegram fetch', async () => {
    const fetchMock = stubTelegramFetch();
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id/, first: () => null },
    ]);
    const sent = await notifyUser(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hi');
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('stale link → false, no Telegram fetch', async () => {
    const fetchMock = stubTelegramFetch();
    // stale = 0 filter means a stale row reads as "no row" — first() null.
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id = \? AND stale = 0/, first: () => null },
    ]);
    const sent = await notifyUser(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hi');
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });
});

describe('notifyUser (b) — linked user', () => {
  it('sends to the stored chat_id, returns true, records the notify rate-limit slot', async () => {
    const fetchMock = stubTelegramFetch();
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id/, first: () => ({ chat_id: '777' }) },
    ]);
    const sent = await notifyUser(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hello');
    expect(sent).toBe(true);

    // Telegram sendMessage hit the stored chat_id with the text.
    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(`https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`);
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.chat_id).toBe('777');
    expect(payload.text).toBe('hello');

    // checkRateLimit consumed a slot for endpoint 'notify' (check + consume in one call).
    const record = db.calls.find(
      (c) => /INSERT INTO rate_limits|UPDATE rate_limits/.test(c.sql) && c.binds.includes('notify'),
    );
    expect(record).toBeDefined();
    expect(record!.binds[0]).toBe('user_1');
  });
});

describe('notifyUser (c) — daily DM budget exhausted', () => {
  it('4th DM in 24h (rate_limits sum = 3) → false, no Telegram fetch, no extra record', async () => {
    const fetchMock = stubTelegramFetch();
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id/, first: () => ({ chat_id: '777' }) },
    ]);
    // Swap in an exhausted window.
    const exhausted = createMockD1([
      { match: /FROM telegram_links WHERE user_id/, first: () => ({ chat_id: '777' }) },
      ...rateLimitHandlers(NOTIFY_DM_LIMIT.maxRequests),
    ]);
    void db;
    const sent = await notifyUser(exhausted as never, { DB: exhausted as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hi');
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    expect(exhausted.calls.some((c) => /INSERT INTO rate_limits|UPDATE rate_limits/.test(c.sql))).toBe(false);
  });
});

describe('notifyUser (d) — user blocked the bot', () => {
  it('403 from Telegram → marks the link stale, returns false', async () => {
    stubTelegramFetch(403, { ok: false, description: 'Forbidden: bot was blocked by the user' });
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id/, first: () => ({ chat_id: '777' }) },
      { match: /UPDATE telegram_links SET stale = 1/, run: () => ({ success: true, meta: { changes: 1 } }) },
    ]);
    const sent = await notifyUser(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hi');
    expect(sent).toBe(false);

    const staleUpdate = db.calls.find((c) => /UPDATE telegram_links SET stale = 1/.test(c.sql));
    expect(staleUpdate).toBeDefined();
    expect(staleUpdate!.binds[0]).toBe('user_1');
  });

  it('non-403 failure → false, link left untouched', async () => {
    stubTelegramFetch(500, { ok: false });
    const db = notifyDb([
      { match: /FROM telegram_links WHERE user_id/, first: () => ({ chat_id: '777' }) },
    ]);
    const sent = await notifyUser(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'user_1', 'hi');
    expect(sent).toBe(false);
    expect(db.calls.some((c) => /UPDATE telegram_links SET stale/.test(c.sql))).toBe(false);
  });
});

describe('notifySchoolChannel (e) — channel rejects the post', () => {
  for (const status of [400, 403]) {
    it(`${status} → marks channel broken, notifies every admin with /admin/schools link`, async () => {
      stubTelegramFetch(status, { ok: false });
      const db = notifyDb([
        { match: /FROM school_channels WHERE school_id/, first: () => ({ channel_id: '-100123' }) },
        { match: /UPDATE school_channels SET broken = 1/, run: () => ({ success: true, meta: { changes: 1 } }) },
        {
          match: /FROM users WHERE role = 'admin'/,
          all: () => ({ results: [{ id: 'admin_1' }, { id: 'admin_2' }] }),
        },
        { match: /INSERT INTO notifications/, run: () => ({ success: true, meta: { changes: 1 } }) },
      ]);
      const sent = await notifySchoolChannel(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'school_9', 'post');
      expect(sent).toBe(false);

      const brokenUpdate = db.calls.find((c) => /UPDATE school_channels SET broken = 1/.test(c.sql));
      expect(brokenUpdate).toBeDefined();
      expect(brokenUpdate!.binds[0]).toBe('school_9');

      const notifs = db.calls.filter((c) => /INSERT INTO notifications/.test(c.sql));
      expect(notifs.length).toBe(2);
      expect(notifs.map((c) => c.binds[1]).sort()).toEqual(['admin_1', 'admin_2']);
      for (const n of notifs) {
        expect(n.binds[2]).toBe('system');
        expect(n.binds[6]).toBe('/admin/schools'); // link column
      }
    });
  }

  it('no active channel row → false, no Telegram fetch', async () => {
    const fetchMock = stubTelegramFetch();
    const db = notifyDb([
      { match: /FROM school_channels WHERE school_id/, first: () => null },
    ]);
    const sent = await notifySchoolChannel(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'school_9', 'post');
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('successful post → true', async () => {
    const fetchMock = stubTelegramFetch();
    const db = notifyDb([
      { match: /FROM school_channels WHERE school_id/, first: () => ({ channel_id: '-100123' }) },
    ]);
    const sent = await notifySchoolChannel(db as never, { DB: db as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'school_9', 'post');
    expect(sent).toBe(true);
    expect(sendMessageChats(fetchMock)).toEqual(['-100123']);
  });
});

describe('notifyPlatformChannel (f) — best-effort platform posts', () => {
  it('TELEGRAM_PLATFORM_CHANNEL_ID unset → false, no Telegram fetch', async () => {
    const fetchMock = stubTelegramFetch();
    const sent = await notifyPlatformChannel({ DB: createMockD1([]) as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN }, 'post');
    expect(sent).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it('posts to the configured channel → true', async () => {
    const fetchMock = stubTelegramFetch();
    const sent = await notifyPlatformChannel(
      { DB: createMockD1([]) as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN, TELEGRAM_PLATFORM_CHANNEL_ID: '-100999' },
      'post',
    );
    expect(sent).toBe(true);
    expect(sendMessageChats(fetchMock)).toEqual(['-100999']);
  });

  it('fetch throws → false, never throws', async () => {
    vi.stubGlobal('fetch', vi.fn().mockRejectedValue(new Error('network down')));
    const sent = await notifyPlatformChannel(
      { DB: createMockD1([]) as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN, TELEGRAM_PLATFORM_CHANNEL_ID: '-100999' },
      'post',
    );
    expect(sent).toBe(false);
  });

  it('non-ok Telegram response → false, never throws', async () => {
    stubTelegramFetch(403, { ok: false });
    const sent = await notifyPlatformChannel(
      { DB: createMockD1([]) as never, TELEGRAM_BOT_TOKEN: BOT_TOKEN, TELEGRAM_PLATFORM_CHANNEL_ID: '-100999' },
      'post',
    );
    expect(sent).toBe(false);
  });
});
