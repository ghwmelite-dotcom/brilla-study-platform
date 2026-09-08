import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildChildDigest,
  formatChildNotification,
  formatWeeklyDigest,
  runWeeklyParentDigests,
} from "../weekly-digests";
import { NOTIFY_DM_LIMIT } from "../telegram";
import { createMockD1, type MockHandler } from "./helpers/mockD1";

// Weekly parent digest: pure summary-builder tests plus cron fan-out tests
// against the real notifyUser (fetch stubbed, rate-limit window faked), so
// the shared 3 DM/day budget behavior is exercised end to end.

const BOT_TOKEN = "bot-token-test";

afterEach(() => {
  vi.unstubAllGlobals();
});

function stubTelegramFetch() {
  const fetchMock = vi
    .fn()
    .mockResolvedValue(
      new Response(JSON.stringify({ ok: true, result: { message_id: 1 } }), {
        status: 200,
      }),
    );
  vi.stubGlobal("fetch", fetchMock);
  return fetchMock;
}

// Same rate-limit fakes as telegram-notify.test.ts: totalRequests below the
// limit consumes a slot; at the limit the CTE insert is a no-op (null).
function rateLimitHandlers(totalRequests = 0): MockHandler[] {
  return [
    {
      match: /WITH usage\(total_requests\)[\s\S]*INSERT INTO rate_limits/,
      first: (binds) =>
        totalRequests >= Number(binds[6])
          ? null
          : { request_count: 1, total_requests: totalRequests + 1 },
    },
  ];
}

const PARENT_ROW = { parent_id: "parent_1" };
const CHILD = { id: "student_1", name: "Ama", streak_days: 5 };
const CHILD_2 = { id: "student_2", name: "Kofi", streak_days: 1 };
const STATS = { attempted: 10, correct: 8, study_seconds: 3900 };
const WEAK = { topic_name: "Fractions", subject_name: "Mathematics" };

function cronDb(opts: {
  children?: unknown[];
  linked?: boolean;
  budgetUsed?: number;
  stats?: unknown;
  weak?: unknown;
}) {
  const {
    children = [CHILD],
    linked = true,
    budgetUsed = 0,
    stats = STATS,
    weak = WEAK,
  } = opts;
  return createMockD1([
    {
      match: /JOIN users p ON/,
      all: () => ({ results: [PARENT_ROW] }),
    },
    {
      match: /JOIN users u ON u\.id = psl\.student_id/,
      all: () => ({ results: children }),
    },
    {
      match: /FROM question_attempts\s+WHERE user_id/,
      first: () => stats,
    },
    {
      match: /FROM question_attempts qa/,
      first: () => weak,
    },
    {
      match: /INSERT INTO parent_notifications/,
      run: () => ({ success: true, meta: { changes: 1 } }),
    },
    {
      match: /FROM telegram_links WHERE user_id = \? AND stale = 0/,
      first: () => (linked ? { chat_id: "777" } : null),
    },
    ...rateLimitHandlers(budgetUsed),
  ]);
}

const env = (db: unknown) => ({
  DB: db as D1Database,
  TELEGRAM_BOT_TOKEN: BOT_TOKEN,
});

describe("buildChildDigest", () => {
  it("computes rounded accuracy and study minutes", () => {
    const d = buildChildDigest({
      name: "Ama",
      questionsAttempted: 3,
      questionsCorrect: 2,
      studySeconds: 3900,
      streakDays: 5,
      weakestTopic: "Fractions (Mathematics)",
    });
    expect(d.accuracyPct).toBe(67);
    expect(d.studyMinutes).toBe(65);
  });

  it("null accuracy when the child attempted nothing", () => {
    const d = buildChildDigest({
      name: "Kofi",
      questionsAttempted: 0,
      questionsCorrect: 0,
      studySeconds: 0,
      streakDays: 0,
      weakestTopic: null,
    });
    expect(d.accuracyPct).toBeNull();
    expect(d.studyMinutes).toBe(0);
  });
});

describe("formatWeeklyDigest / formatChildNotification", () => {
  const full = buildChildDigest({
    name: "Ama",
    questionsAttempted: 10,
    questionsCorrect: 8,
    studySeconds: 3900,
    streakDays: 5,
    weakestTopic: "Fractions (Mathematics)",
  });
  const idle = buildChildDigest({
    name: "Kofi",
    questionsAttempted: 0,
    questionsCorrect: 0,
    studySeconds: 0,
    streakDays: 1,
    weakestTopic: null,
  });

  it("one block per child with all populated fields", () => {
    const text = formatWeeklyDigest([full]);
    expect(text).toContain("👤 Ama");
    expect(text).toContain("10 questions answered (80% correct)");
    expect(text).toContain("Study time: 1h 5m");
    expect(text).toContain("Streak: 5 days 🔥");
    expect(text).toContain("Focus area: Fractions (Mathematics)");
  });

  it("omits study time / focus area when absent and flags inactivity", () => {
    const text = formatWeeklyDigest([idle]);
    expect(text).toContain("No questions answered this week");
    expect(text).not.toContain("Study time");
    expect(text).not.toContain("Focus area");
    expect(text).not.toContain("🔥");
  });

  it("renders multiple children as separate blocks", () => {
    const text = formatWeeklyDigest([full, idle]);
    expect(text).toContain("👤 Ama");
    expect(text).toContain("👤 Kofi");
    expect(text.indexOf("Ama")).toBeLessThan(text.indexOf("Kofi"));
  });

  it("notification body summarizes one child in a sentence", () => {
    expect(formatChildNotification(full)).toBe(
      "Ama answered 10 questions this week with 80% accuracy. Study time: 1h 5m. Current streak: 5 days. Focus area: Fractions (Mathematics).",
    );
    expect(formatChildNotification(idle)).toBe(
      "Kofi didn't answer any questions this week. Current streak: 1 days.",
    );
  });
});

describe("runWeeklyParentDigests", () => {
  it("fan-out: sends one DM per linked parent and writes one notification per child", async () => {
    const fetchMock = stubTelegramFetch();
    const db = cronDb({ children: [CHILD, CHILD_2] });
    const r = await runWeeklyParentDigests(db as never, env(db));

    expect(r).toEqual({
      parents: 1,
      digestsSent: 1,
      digestsSkipped: 0,
      notificationsWritten: 2,
    });

    const [url, init] = fetchMock.mock.calls[0];
    expect(String(url)).toBe(
      `https://api.telegram.org/bot${BOT_TOKEN}/sendMessage`,
    );
    const payload = JSON.parse((init as RequestInit).body as string);
    expect(payload.chat_id).toBe("777");
    expect(payload.text).toContain("👤 Ama");
    expect(payload.text).toContain("👤 Kofi");

    const notifs = db.calls.filter((c) =>
      /INSERT INTO parent_notifications/.test(c.sql),
    );
    expect(notifs.map((c) => c.binds[2]).sort()).toEqual([
      "student_1",
      "student_2",
    ]);
    for (const n of notifs) {
      expect(n.binds[1]).toBe("parent_1");
      expect(n.sql).toContain("'weekly_summary'");
    }
  });

  it("skip-when-over-budget: exhausted 3 DM/day window → skip logged in counts, no fetch, notification still written", async () => {
    const fetchMock = stubTelegramFetch();
    const db = cronDb({ budgetUsed: NOTIFY_DM_LIMIT.maxRequests });
    const r = await runWeeklyParentDigests(db as never, env(db));

    expect(r.digestsSent).toBe(0);
    expect(r.digestsSkipped).toBe(1);
    expect(r.notificationsWritten).toBe(1);
    expect(fetchMock).not.toHaveBeenCalled();
  });

  it("unlinked parent: no Telegram fetch, not counted as a skip, in-app notification still written", async () => {
    const fetchMock = stubTelegramFetch();
    const db = cronDb({ linked: false });
    const r = await runWeeklyParentDigests(db as never, env(db));

    expect(r).toEqual({
      parents: 1,
      digestsSent: 0,
      digestsSkipped: 0,
      notificationsWritten: 1,
    });
    expect(fetchMock).not.toHaveBeenCalled();
    expect(
      db.calls.some((c) => /INSERT INTO parent_notifications/.test(c.sql)),
    ).toBe(true);
  });

  it("child with no weekly activity still produces a notification and DM", async () => {
    stubTelegramFetch();
    const db = cronDb({
      stats: { attempted: 0, correct: 0, study_seconds: 0 },
      weak: null,
    });
    const r = await runWeeklyParentDigests(db as never, env(db));

    expect(r.digestsSent).toBe(1);
    expect(r.notificationsWritten).toBe(1);
    const notif = db.calls.find((c) =>
      /INSERT INTO parent_notifications/.test(c.sql),
    );
    expect(String(notif!.binds[3])).toContain(
      "didn't answer any questions this week",
    );
  });
});
