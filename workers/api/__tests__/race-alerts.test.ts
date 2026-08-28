import { describe, it, expect, vi, afterEach } from "vitest";
import {
  runTelegramRaceAlerts,
  ALERT_FLAG_POSITION_PASSED,
  ALERT_FLAG_ENDING_SOON,
  STREAK_RESCUE_LIMIT,
} from "../race-alerts";
import { NOTIFY_DM_LIMIT } from "../telegram";
import { createMockD1, type MockHandler } from "./helpers/mockD1";

// Task 4 (Telegram community): cron alert wiring — winner announcements with a
// getChatMember name gate, cycle-start posts, position-passed / ending-soon
// DMs deduped by race_alert_state flag bits, and streak-rescue DMs gated by
// both the shared 'notify' bucket and a 1/day 'notify-streak' bucket.

const BOT_TOKEN = "bot-token-test";
const PLATFORM_CH = "-100999";
// A Wednesday — active-cycle windows below hang off this instant.
const NOW = new Date("2026-08-12T15:00:00Z");

afterEach(() => {
  vi.unstubAllGlobals();
  vi.restoreAllMocks();
});

function stubTelegramFetch(
  routes: Record<string, { status?: number; body?: unknown }> = {},
) {
  const fetchMock = vi.fn().mockImplementation(async (url: string) => {
    const method = String(url).split("/").pop()!;
    const r = routes[method] ?? { status: 200, body: { ok: true, result: {} } };
    return new Response(JSON.stringify(r.body ?? { ok: true }), {
      status: r.status ?? 200,
    });
  });
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

function sentMessages(
  fetchMock: ReturnType<typeof vi.fn>,
): { chat_id: string; text: string }[] {
  return fetchMock.mock.calls
    .filter(([url]) => String(url).includes("/sendMessage"))
    .map(([, init]) => JSON.parse((init as RequestInit).body as string));
}

// checkRateLimit mock plumbing: window SUM query (routable per endpoint via
// binds[1]), current-window lookup, and the record insert/update.
function rateLimitHandlers(
  totalFor: (endpoint: string) => number = () => 0,
): MockHandler[] {
  return [
    {
      match: /WITH usage\(total_requests\)[\s\S]*INSERT INTO rate_limits/,
      first: (binds) => {
        const total = totalFor(String(binds[1]));
        return total >= Number(binds[6])
          ? null
          : { request_count: 1, total_requests: total + 1 };
      },
    },
  ];
}

// Default empty results for the four section queries so each test only wires
// the section it exercises. Extra handlers go FIRST (mockD1 picks first match).
function alertsDb(
  extra: MockHandler[],
  totalFor?: (endpoint: string) => number,
) {
  return createMockD1([
    ...extra,
    {
      match: /UPDATE race_cycles SET winner_announced_at/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /UPDATE race_cycles SET start_announced_at/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    { match: /winner_announced_at IS NULL/, all: () => ({ results: [] }) },
    { match: /start_announced_at IS NULL/, all: () => ({ results: [] }) },
    { match: /rc\.target_points/, all: () => ({ results: [] }) },
    { match: /u\.streak_days > 0/, all: () => ({ results: [] }) },
    ...rateLimitHandlers(totalFor),
  ]) as unknown as D1Database & { calls: { sql: string; binds: unknown[] }[] };
}

function envFor(db: unknown) {
  return {
    DB: db as never,
    TELEGRAM_BOT_TOKEN: BOT_TOKEN,
    TELEGRAM_PLATFORM_CHANNEL_ID: PLATFORM_CH,
  };
}

const CROWNED_PLATFORM = {
  id: "cyc_1",
  scope: "platform",
  school_id: null,
  winner_name: "Ama",
  winner_user_id: "u_win",
};

describe("(a) winner announcement — member gate passes", () => {
  it("names the winner in the platform post, sets winner_announced_at, never reposts", async () => {
    let announced = false;
    const fetchMock = stubTelegramFetch(); // getChatMember defaults to 200 ok
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: announced ? [] : [CROWNED_PLATFORM] }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "777" }),
      },
      {
        match: /UPDATE race_cycles SET winner_announced_at/,
        run: () => {
          announced = true;
          return { success: true, meta: { changes: 1 } };
        },
      },
    ]);

    const first = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(first).toEqual({ posts: 1, dms: 0 });

    // getChatMember probed the platform channel with the winner's chat_id.
    const memberCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/getChatMember"),
    );
    expect(memberCall).toBeDefined();
    const memberPayload = JSON.parse(
      (memberCall![1] as RequestInit).body as string,
    );
    expect(memberPayload).toEqual({ chat_id: PLATFORM_CH, user_id: "777" });

    // Channel post names the winner.
    const posts = sentMessages(fetchMock);
    expect(posts.length).toBe(1);
    expect(posts[0].chat_id).toBe(PLATFORM_CH);
    expect(posts[0].text).toContain("Ama");

    // Dedup column set even though the send succeeded.
    const mark = db.calls.find((c) =>
      /UPDATE race_cycles SET winner_announced_at/.test(c.sql),
    );
    expect(mark).toBeDefined();
    expect(mark!.binds[0]).toBe("cyc_1");

    // Second run: the cycle no longer matches → no new Telegram traffic.
    const second = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(second).toEqual({ posts: 0, dms: 0 });
    expect(sentMessages(fetchMock).length).toBe(1);
  });
});

describe("(b) winner announcement — winner is NOT a channel member", () => {
  it("post omits the name and the winner gets a join-the-channel DM", async () => {
    const fetchMock = stubTelegramFetch({
      getChatMember: {
        status: 400,
        body: { ok: false, description: "user not found" },
      },
    });
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_PLATFORM] }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "777" }),
      },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 1, dms: 1 });

    const msgs = sentMessages(fetchMock);
    const channelPost = msgs.find((m) => m.chat_id === PLATFORM_CH)!;
    const dm = msgs.find((m) => m.chat_id === "777")!;
    expect(channelPost.text).not.toContain("Ama");
    expect(channelPost.text).toContain("race has a winner");
    expect(dm.text).toMatch(/join the .* channel to see your win announced/i);

    // Announced marker still set (no catch-up storm on the next pass).
    expect(
      db.calls.some((c) =>
        /UPDATE race_cycles SET winner_announced_at/.test(c.sql),
      ),
    ).toBe(true);
  });
});

describe("(c) school-scoped winner announcement", () => {
  const CROWNED_SCHOOL = {
    ...CROWNED_PLATFORM,
    id: "cyc_s",
    scope: "school",
    school_id: "sch_1",
    winner_user_id: null,
    winner_name: null,
  };

  it("posts to the school channel when a school_channels row exists", async () => {
    const fetchMock = stubTelegramFetch();
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_SCHOOL] }),
      },
      {
        match: /FROM school_channels WHERE school_id/,
        first: () => ({ channel_id: "-100123" }),
      },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 1, dms: 0 });
    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].chat_id).toBe("-100123");
  });

  it("skips the post when the school has no channel row, but still marks announced", async () => {
    const fetchMock = stubTelegramFetch();
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_SCHOOL] }),
      },
      { match: /FROM school_channels WHERE school_id/, first: () => null },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 0, dms: 0 });
    expect(sentMessages(fetchMock).length).toBe(0);
    const mark = db.calls.find((c) =>
      /UPDATE race_cycles SET winner_announced_at/.test(c.sql),
    );
    expect(mark).toBeDefined();
    expect(mark!.binds[0]).toBe("cyc_s");
  });
});

describe("(c2) school-scoped winner — membership gate targets the school channel", () => {
  const CROWNED_SCHOOL_WINNER = {
    ...CROWNED_PLATFORM,
    id: "cyc_sw",
    scope: "school",
    school_id: "sch_1",
  };

  it("gate probes the school channel; member winner is named in the school post", async () => {
    const fetchMock = stubTelegramFetch(); // getChatMember defaults to 200 ok
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_SCHOOL_WINNER] }),
      },
      {
        match: /FROM school_channels WHERE school_id/,
        first: () => ({ channel_id: "-100123" }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "777" }),
      },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 1, dms: 0 });

    // getChatMember probed the SCHOOL channel, not the platform channel.
    const memberCall = fetchMock.mock.calls.find(([url]) =>
      String(url).includes("/getChatMember"),
    );
    expect(memberCall).toBeDefined();
    const memberPayload = JSON.parse(
      (memberCall![1] as RequestInit).body as string,
    );
    expect(memberPayload).toEqual({ chat_id: "-100123", user_id: "777" });

    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].chat_id).toBe("-100123");
    expect(msgs[0].text).toContain("Ama");
  });

  it("non-member winner: unnamed school post + DM referencing the school channel", async () => {
    const fetchMock = stubTelegramFetch({
      getChatMember: {
        status: 400,
        body: { ok: false, description: "user not found" },
      },
    });
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_SCHOOL_WINNER] }),
      },
      {
        match: /FROM school_channels WHERE school_id/,
        first: () => ({ channel_id: "-100123" }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "777" }),
      },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 1, dms: 1 });

    const msgs = sentMessages(fetchMock);
    const channelPost = msgs.find((m) => m.chat_id === "-100123")!;
    const dm = msgs.find((m) => m.chat_id === "777")!;
    expect(channelPost.text).not.toContain("Ama");
    expect(dm.text).toMatch(/school.*channel to see your win announced/i);
    expect(dm.text).not.toMatch(/community channel/i);
  });
});

describe("(d) cycle-start post", () => {
  it("posts once for a freshly opened cycle and sets start_announced_at", async () => {
    const fetchMock = stubTelegramFetch();
    const db = alertsDb([
      {
        match: /start_announced_at IS NULL/,
        all: () => ({
          results: [
            {
              id: "cyc_new",
              scope: "platform",
              school_id: null,
              starts_at: "2026-08-10 00:00:00",
              ends_at: "2026-08-17 00:00:00",
            },
          ],
        }),
      },
    ]);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res).toEqual({ posts: 1, dms: 0 });

    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].chat_id).toBe(PLATFORM_CH);
    expect(msgs[0].text).toMatch(/race/i);

    const mark = db.calls.find((c) =>
      /UPDATE race_cycles SET start_announced_at/.test(c.sql),
    );
    expect(mark).toBeDefined();
    expect(mark!.binds[0]).toBe("cyc_new");
  });
});

// Active cycle shared by (e): far from ending so ending-soon stays silent.
const ACTIVE_CYCLE = {
  id: "cyc_a",
  scope: "platform",
  school_id: null,
  starts_at: "2026-08-10 00:00:00",
  ends_at: "2026-08-17 00:00:00",
  target_points: 1000,
};

const RANKED = [
  { user_id: "u_1", score: 900 },
  { user_id: "u_2", score: 800 },
  { user_id: "u_3", score: 700 },
  { user_id: "u_4", score: 600 },
  { user_id: "u_5", score: 500 },
];

function positionDb(stateForU5: {
  last_rank: number;
  last_score: number;
  alerted_flags: number;
}) {
  return alertsDb([
    { match: /rc\.target_points/, all: () => ({ results: [ACTIVE_CYCLE] }) },
    { match: /SUM\(pl\.points\) AS score/, all: () => ({ results: RANKED }) },
    {
      match: /FROM race_alert_state WHERE user_id/,
      first: (binds) => (binds[0] === "u_5" ? stateForU5 : null),
    },
    {
      match: /INSERT INTO race_alert_state/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /FROM telegram_links WHERE user_id/,
      first: () => ({ chat_id: "555" }),
    },
  ]);
}

describe("(e) position-passed DM", () => {
  it("last_rank 3 → current rank 5: DM sent, flags |= ALERT_FLAG_POSITION_PASSED", async () => {
    const fetchMock = stubTelegramFetch();
    const db = positionDb({ last_rank: 3, last_score: 650, alerted_flags: 0 });

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(1);

    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].chat_id).toBe("555");
    expect(msgs[0].text).toContain("#5");

    const upsert = db.calls.find(
      (c) => /INSERT INTO race_alert_state/.test(c.sql) && c.binds[0] === "u_5",
    );
    expect(upsert).toBeDefined();
    expect(upsert!.sql).toMatch(/ON CONFLICT\(user_id, cycle_id\)/);
    expect(upsert!.binds[1]).toBe("cyc_a");
    expect(upsert!.binds[2]).toBe(5); // last_rank updated to current
    expect(upsert!.binds[4] as number).toBe(ALERT_FLAG_POSITION_PASSED);
  });

  it("flag already set → no DM, but rank still tracked", async () => {
    const fetchMock = stubTelegramFetch();
    const db = positionDb({
      last_rank: 3,
      last_score: 650,
      alerted_flags: ALERT_FLAG_POSITION_PASSED,
    });

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(0);
    expect(sentMessages(fetchMock).length).toBe(0);

    const upsert = db.calls.find(
      (c) => /INSERT INTO race_alert_state/.test(c.sql) && c.binds[0] === "u_5",
    );
    expect(upsert).toBeDefined();
    expect(upsert!.binds[2]).toBe(5);
    expect(upsert!.binds[4] as number).toBe(ALERT_FLAG_POSITION_PASSED); // unchanged
  });
});

describe("(f) ending-soon DM", () => {
  const ENDING_CYCLE = {
    ...ACTIVE_CYCLE,
    id: "cyc_e",
    ends_at: "2026-08-12 20:00:00",
  }; // 5h left

  function endingDb(state: unknown) {
    return alertsDb([
      { match: /rc\.target_points/, all: () => ({ results: [ENDING_CYCLE] }) },
      {
        match: /SUM\(pl\.points\) AS score/,
        all: () => ({ results: [RANKED[0]] }),
      },
      { match: /FROM race_alert_state WHERE user_id/, first: () => state },
      {
        match: /INSERT INTO race_alert_state/,
        run: () => ({ success: true, meta: { changes: 1 } }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "111" }),
      },
    ]);
  }

  it("ends_at within 12h and flag unset → DM + ALERT_FLAG_ENDING_SOON", async () => {
    const fetchMock = stubTelegramFetch();
    const db = endingDb(null); // no state row yet

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(1);

    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].text).toMatch(/ends in under 12 hours|final push/i);

    const upsert = db.calls.find((c) =>
      /INSERT INTO race_alert_state/.test(c.sql),
    );
    expect(upsert!.binds[4] as number).toBe(ALERT_FLAG_ENDING_SOON);
  });

  it("flag already set → no DM", async () => {
    const fetchMock = stubTelegramFetch();
    const db = endingDb({
      last_rank: 1,
      last_score: 900,
      alerted_flags: ALERT_FLAG_ENDING_SOON,
    });

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(0);
    expect(sentMessages(fetchMock).length).toBe(0);
  });
});

describe("(g) streak-rescue DM", () => {
  const streakRow = { id: "u_s", streak_days: 7 };
  const streakHandlers: MockHandler[] = [
    { match: /u\.streak_days > 0/, all: () => ({ results: [streakRow] }) },
    {
      match: /FROM telegram_links WHERE user_id/,
      first: () => ({ chat_id: "321" }),
    },
  ];

  it("linked user 22h+ idle → one DM gated by both notify-streak and notify buckets", async () => {
    const fetchMock = stubTelegramFetch();
    const db = alertsDb(streakHandlers);

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(1);

    const msgs = sentMessages(fetchMock);
    expect(msgs.length).toBe(1);
    expect(msgs[0].chat_id).toBe("321");
    expect(msgs[0].text).toContain("7-day streak");

    // Both buckets consumed: 'notify-streak' by the rescue gate, 'notify' inside notifyUser.
    const recorded = db.calls
      .filter((c) => /INSERT INTO rate_limits|UPDATE rate_limits/.test(c.sql))
      .map((c) => c.binds[1]);
    expect(recorded).toContain("notify-streak");
    expect(recorded).toContain("notify");

    // Constants wired as documented.
    expect(STREAK_RESCUE_LIMIT).toEqual({
      maxRequests: 1,
      windowMs: 24 * 60 * 60 * 1000,
    });
    expect(NOTIFY_DM_LIMIT.maxRequests).toBe(3);
  });

  it("notify-streak bucket already used today → no DM", async () => {
    const fetchMock = stubTelegramFetch();
    const db = alertsDb(streakHandlers, (endpoint) =>
      endpoint === "notify-streak" ? 1 : 0,
    );

    const res = await runTelegramRaceAlerts(db, envFor(db), NOW);
    expect(res.dms).toBe(0);
    expect(sentMessages(fetchMock).length).toBe(0);
  });
});

describe("(h) Telegram outage", () => {
  it("fetch throws everywhere → resolves with zero counts, logs, still marks announced", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn().mockRejectedValue(new Error("network down")),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});
    const db = alertsDb([
      {
        match: /winner_announced_at IS NULL/,
        all: () => ({ results: [CROWNED_PLATFORM] }),
      },
      {
        match: /FROM telegram_links WHERE user_id/,
        first: () => ({ chat_id: "777" }),
      },
      {
        match: /u\.streak_days > 0/,
        all: () => ({ results: [{ id: "u_s", streak_days: 3 }] }),
      },
    ]);

    await expect(runTelegramRaceAlerts(db, envFor(db), NOW)).resolves.toEqual({
      posts: 0,
      dms: 0,
    });
    expect(errSpy).toHaveBeenCalled();
    // Dedup marker still written: an outage must not queue a stale-post storm.
    expect(
      db.calls.some((c) =>
        /UPDATE race_cycles SET winner_announced_at/.test(c.sql),
      ),
    ).toBe(true);
  });
});
