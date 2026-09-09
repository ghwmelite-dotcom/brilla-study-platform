import { describe, it, expect } from 'vitest';
import { sign } from 'hono/jwt';
import { flashcardDecksApp } from '../flashcard-decks';
import { createMockD1, type MockHandler } from './helpers/mockD1';

// Ownership/IDOR tests for custom flashcard decks: identity must come from
// the verified JWT (via shared requireAuth), and every write path must check
// deck ownership before touching flashcard_decks/flashcards rows.

const JWT_SECRET = 'test-secret-that-is-long-enough';

const authUser = { role: 'student', status: 'approved', is_active: 1, session_version: 0 };

function authHandler(): MockHandler {
  return {
    match: /SELECT role, status, is_active, session_version FROM users/,
    first: () => authUser,
  };
}

async function token(userId: string) {
  return sign(
    { userId, role: 'student', exp: Math.floor(Date.now() / 1000) + 3600, iat: Math.floor(Date.now() / 1000) },
    JWT_SECRET,
  );
}

function req(url: string, method: string, t: string | null, body?: unknown) {
  return new Request(url, {
    method,
    headers: {
      ...(t ? { Authorization: `Bearer ${t}` } : {}),
      ...(body !== undefined ? { 'Content-Type': 'application/json' } : {}),
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
}

const env = (db: unknown) => ({ DB: db as D1Database, JWT_SECRET, ENVIRONMENT: 'test' });

function deckRow(overrides: Record<string, unknown> = {}): Record<string, unknown> {
  return {
    id: 'deck_1',
    user_id: 'owner_1',
    name: 'My Deck',
    description: null,
    subject_id: null,
    topic_id: null,
    is_public: 0,
    card_count: 2,
    created_at: '2026-09-01T00:00:00Z',
    updated_at: '2026-09-01T00:00:00Z',
    ...overrides,
  };
}

const deckByIdHandler = (row: unknown): MockHandler => ({
  match: /SELECT \* FROM flashcard_decks WHERE id = \?/,
  first: () => row,
});

const cardWithDeckHandler = (row: unknown): MockHandler => ({
  match: /SELECT f\.id, f\.deck_id, fd\.user_id/,
  first: () => row,
});

const catchAll = (): MockHandler => ({
  match: /./,
  first: () => null,
  all: () => ({ results: [] }),
  run: () => ({ success: true, meta: { changes: 1 } }),
});

describe('authentication', () => {
  it('rejects requests without a token', async () => {
    const db = createMockD1([authHandler()]);
    const res = await flashcardDecksApp.fetch(req('http://x/mine', 'GET', null), env(db));
    expect(res.status).toBe(401);
  });
});

describe('GET /mine', () => {
  it('serves only the JWT identity and ignores a spoofed ?userId', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const t = await token('user_1');
    const res = await flashcardDecksApp.fetch(req('http://x/mine?userId=victim_1', 'GET', t), env(db));
    expect(res.status).toBe(200);

    const select = db.calls.find((c) => c.sql.includes('FROM flashcard_decks fd'));
    expect(select).toBeDefined();
    expect(select!.binds).toEqual(['user_1']);
    expect(select!.binds).not.toContain('victim_1');
  });
});

describe('POST / (create deck)', () => {
  it('creates a deck owned by the JWT user, ignoring a body userId', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const t = await token('attacker_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/', 'POST', t, { name: 'Physics formulas', userId: 'victim_1', isPublic: true }),
      env(db),
    );
    expect(res.status).toBe(201);

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO flashcard_decks'));
    expect(insert).toBeDefined();
    expect(insert!.binds[1]).toBe('attacker_1');
    expect(insert!.binds).not.toContain('victim_1');
    // is_public
    expect(insert!.binds[6]).toBe(1);
    // demo flags for a non-demo user
    expect(insert!.binds[7]).toBe(0);
    expect(insert!.binds[8]).toBeNull();

    const body = (await res.json()) as { data: { user_id: string; name: string } };
    expect(body.data.user_id).toBe('attacker_1');
    expect(body.data.name).toBe('Physics formulas');
  });

  it('rejects a missing/short name without inserting', async () => {
    const db = createMockD1([authHandler(), catchAll()]);
    const t = await token('user_1');
    const res = await flashcardDecksApp.fetch(req('http://x/', 'POST', t, { name: 'x' }), env(db));
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO flashcard_decks'))).toBe(false);
  });
});

describe('GET /:id (read deck)', () => {
  it('lets the owner read a private deck with its cards', async () => {
    const cardsHandler: MockHandler = {
      match: /SELECT \* FROM flashcards WHERE deck_id = \?/,
      all: () => ({ results: [{ id: 'fc_1', front: 'Q', back: 'A' }] }),
    };
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), cardsHandler]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'GET', t), env(db));
    expect(res.status).toBe(200);
    const body = (await res.json()) as { data: { id: string; cards: unknown[] } };
    expect(body.data.id).toBe('deck_1');
    expect(body.data.cards).toHaveLength(1);
  });

  it('blocks a non-owner from reading a private deck', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'GET', t), env(db));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('FROM flashcards WHERE deck_id'))).toBe(false);
  });

  it('lets a non-owner read a public deck', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow({ is_public: 1 })), catchAll()]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'GET', t), env(db));
    expect(res.status).toBe(200);
  });

  it('returns 404 for a missing deck', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(null), catchAll()]);
    const t = await token('user_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_nope', 'GET', t), env(db));
    expect(res.status).toBe(404);
  });
});

describe('PUT /:id (update deck)', () => {
  it('blocks a non-owner and never issues the UPDATE', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'PUT', t, { name: 'Hijacked' }), env(db));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('UPDATE flashcard_decks'))).toBe(false);
  });

  it('lets the owner rename the deck and flip visibility', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/deck_1', 'PUT', t, { name: 'Renamed deck', isPublic: true }),
      env(db),
    );
    expect(res.status).toBe(200);

    const update = db.calls.find((c) => c.sql.includes('UPDATE flashcard_decks'));
    expect(update).toBeDefined();
    expect(update!.sql).toContain('name = ?');
    expect(update!.sql).toContain('is_public = ?');
    expect(update!.binds[0]).toBe('Renamed deck');
    expect(update!.binds[1]).toBe(1);
    expect(update!.binds[update!.binds.length - 1]).toBe('deck_1');
  });

  it('rejects an empty update', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'PUT', t, {}), env(db));
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('UPDATE flashcard_decks'))).toBe(false);
  });
});

describe('DELETE /:id', () => {
  it('blocks a non-owner and never issues a DELETE', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'DELETE', t), env(db));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.startsWith('DELETE FROM'))).toBe(false);
  });

  it('lets the owner delete the deck, its cards and its reviews', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(req('http://x/deck_1', 'DELETE', t), env(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM flashcard_reviews WHERE deck_id'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM flashcards WHERE deck_id'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM flashcard_decks WHERE id'))).toBe(true);
  });
});

describe('POST /:id/cards', () => {
  it('blocks a non-owner from adding cards and never issues the INSERT', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/deck_1/cards', 'POST', t, { front: 'Q', back: 'A' }),
      env(db),
    );
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO flashcards'))).toBe(false);
  });

  it('lets the owner add a card and increments card_count', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/deck_1/cards', 'POST', t, { front: ' What is g? ', back: '9.81 m/s^2', hint: 'gravity', difficulty: 3 }),
      env(db),
    );
    expect(res.status).toBe(201);

    const insert = db.calls.find((c) => c.sql.includes('INSERT INTO flashcards'));
    expect(insert).toBeDefined();
    expect(insert!.binds[1]).toBe('deck_1');
    expect(insert!.binds[2]).toBe('What is g?');
    expect(insert!.binds[6]).toBe(3);

    const bump = db.calls.find((c) => c.sql.includes('card_count = card_count + 1'));
    expect(bump).toBeDefined();
    expect(bump!.binds[0]).toBe('deck_1');
  });

  it('rejects invalid difficulty', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/deck_1/cards', 'POST', t, { front: 'Q', back: 'A', difficulty: 9 }),
      env(db),
    );
    expect(res.status).toBe(400);
    expect(db.calls.some((c) => c.sql.includes('INSERT INTO flashcards'))).toBe(false);
  });

  it('rejects a card without a back', async () => {
    const db = createMockD1([authHandler(), deckByIdHandler(deckRow()), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/deck_1/cards', 'POST', t, { front: 'Q' }),
      env(db),
    );
    expect(res.status).toBe(400);
  });
});

describe('PUT /cards/:cardId', () => {
  it('blocks a non-owner (deck belongs to someone else) and never issues the UPDATE', async () => {
    const db = createMockD1([
      authHandler(),
      cardWithDeckHandler({ id: 'fc_1', deck_id: 'deck_1', user_id: 'owner_1' }),
      catchAll(),
    ]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/cards/fc_1', 'PUT', t, { front: 'Hijacked' }), env(db));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.includes('UPDATE flashcards'))).toBe(false);
  });

  it('lets the deck owner edit the card', async () => {
    const db = createMockD1([
      authHandler(),
      cardWithDeckHandler({ id: 'fc_1', deck_id: 'deck_1', user_id: 'owner_1' }),
      catchAll(),
    ]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(
      req('http://x/cards/fc_1', 'PUT', t, { back: 'New answer', difficulty: 4 }),
      env(db),
    );
    expect(res.status).toBe(200);

    const update = db.calls.find((c) => c.sql.includes('UPDATE flashcards SET'));
    expect(update).toBeDefined();
    expect(update!.sql).toContain('back = ?');
    expect(update!.sql).toContain('difficulty = ?');
    expect(update!.binds[0]).toBe('New answer');
    expect(update!.binds[1]).toBe(4);
    expect(update!.binds[update!.binds.length - 1]).toBe('fc_1');
  });

  it('returns 404 for a missing card', async () => {
    const db = createMockD1([authHandler(), cardWithDeckHandler(null), catchAll()]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(req('http://x/cards/fc_nope', 'PUT', t, { back: 'B' }), env(db));
    expect(res.status).toBe(404);
  });
});

describe('GET /retention', () => {
  // Per-user fixture rows, keyed by user id. The handler filters on binds[0]
  // so it simulates the WHERE fr.user_id = ? clause, and the due-count
  // handler does the same for the dueNow query.
  const reviewRowsByUser: Record<string, Record<string, number | string>[]> = {
    user_a: [
      { deck_id: 'deck_1', deck_name: 'Physics', reviews_30d: 6, recalled_30d: 5, mature_reviews_30d: 4, mature_recalled_30d: 3 },
      { deck_id: 'deck_2', deck_name: 'Chemistry', reviews_30d: 4, recalled_30d: 2, mature_reviews_30d: 2, mature_recalled_30d: 2 },
    ],
    user_b: [
      { deck_id: 'deck_9', deck_name: 'Biology', reviews_30d: 20, recalled_30d: 20, mature_reviews_30d: 10, mature_recalled_30d: 10 },
    ],
    sparse_user: [
      { deck_id: 'deck_3', deck_name: 'Math', reviews_30d: 9, recalled_30d: 9, mature_reviews_30d: 9, mature_recalled_30d: 9 },
    ],
    new_user: [],
  };
  const dueByUser: Record<string, number> = { user_a: 3, user_b: 12, sparse_user: 0, new_user: 0 };

  const retentionHandlers = (): MockHandler[] => [
    authHandler(),
    {
      match: /FROM flashcard_reviews fr\s+JOIN flashcard_decks/,
      all: (binds) => ({ results: reviewRowsByUser[binds[0] as string] || [] }),
    },
    {
      match: /SELECT COUNT\(\*\) AS due_now/,
      first: (binds) => ({ due_now: dueByUser[binds[0] as string] ?? 0 }),
    },
  ];

  it('rejects requests without a token', async () => {
    const db = createMockD1([authHandler()]);
    const res = await flashcardDecksApp.fetch(req('http://x/retention', 'GET', null), env(db));
    expect(res.status).toBe(401);
  });

  it('computes overall retention, mature retention, due count and per-deck breakdown', async () => {
    const db = createMockD1(retentionHandlers());
    const t = await token('user_a');
    const res = await flashcardDecksApp.fetch(req('http://x/retention', 'GET', t), env(db));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: {
        windowDays: number;
        totalReviews30d: number;
        insufficientData: boolean;
        retentionRate: number | null;
        matureReviews30d: number;
        matureRetentionRate: number | null;
        dueNow: number;
        decks: {
          deckId: string;
          deckName: string;
          reviews30d: number;
          retentionRate: number | null;
          matureReviews30d: number;
          matureRetentionRate: number | null;
        }[];
      };
    };
    const d = body.data;
    expect(d.windowDays).toBe(30);
    expect(d.totalReviews30d).toBe(10);
    expect(d.insufficientData).toBe(false);
    // 7 of 10 reviews recalled
    expect(d.retentionRate).toBe(70);
    // mature subset: 5 of 6 recalled → 83.3
    expect(d.matureReviews30d).toBe(6);
    expect(d.matureRetentionRate).toBe(83.3);
    expect(d.dueNow).toBe(3);
    expect(d.decks).toHaveLength(2);
    expect(d.decks[0]).toMatchObject({ deckId: 'deck_1', deckName: 'Physics', reviews30d: 6 });
    expect(d.decks[1]).toMatchObject({ deckId: 'deck_2', deckName: 'Chemistry', reviews30d: 4 });
    // Per-deck rows below the 10-review minimum report no number.
    expect(d.decks[0].retentionRate).toBeNull();
    expect(d.decks[1].matureRetentionRate).toBeNull();
  });

  it('marks users with fewer than 10 recent reviews as insufficientData with no numbers', async () => {
    const db = createMockD1(retentionHandlers());
    const t = await token('sparse_user');
    const res = await flashcardDecksApp.fetch(req('http://x/retention', 'GET', t), env(db));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: { totalReviews30d: number; insufficientData: boolean; retentionRate: number | null; matureRetentionRate: number | null };
    };
    expect(body.data.totalReviews30d).toBe(9);
    expect(body.data.insufficientData).toBe(true);
    expect(body.data.retentionRate).toBeNull();
    expect(body.data.matureRetentionRate).toBeNull();
  });

  it('returns insufficientData for a user with no reviews at all', async () => {
    const db = createMockD1(retentionHandlers());
    const t = await token('new_user');
    const res = await flashcardDecksApp.fetch(req('http://x/retention', 'GET', t), env(db));
    expect(res.status).toBe(200);

    const body = (await res.json()) as {
      data: { totalReviews30d: number; insufficientData: boolean; dueNow: number; decks: unknown[] };
    };
    expect(body.data.totalReviews30d).toBe(0);
    expect(body.data.insufficientData).toBe(true);
    expect(body.data.dueNow).toBe(0);
    expect(body.data.decks).toEqual([]);
  });

  it('scopes every query to the JWT user so user A never sees user B numbers', async () => {
    const db = createMockD1(retentionHandlers());
    const t = await token('user_a');
    const res = await flashcardDecksApp.fetch(req('http://x/retention?userId=user_b', 'GET', t), env(db));
    expect(res.status).toBe(200);

    // Both queries must bind the JWT identity and nothing else.
    const retentionQuery = db.calls.find((c) => c.sql.includes('JOIN flashcard_decks'));
    const dueQuery = db.calls.find((c) => c.sql.includes('AS due_now'));
    expect(retentionQuery!.binds).toEqual(['user_a']);
    expect(dueQuery!.binds).toEqual(['user_a']);

    const body = (await res.json()) as {
      data: { totalReviews30d: number; retentionRate: number | null; dueNow: number; decks: { deckId: string }[] };
    };
    // user_b has 20 reviews at 100% retention; user_a's payload must reflect only user_a.
    expect(body.data.totalReviews30d).toBe(10);
    expect(body.data.retentionRate).toBe(70);
    expect(body.data.dueNow).toBe(3);
    expect(body.data.decks.some((deck) => deck.deckId === 'deck_9')).toBe(false);
  });
});

describe('DELETE /cards/:cardId', () => {
  it('blocks a non-owner and never issues a DELETE', async () => {
    const db = createMockD1([
      authHandler(),
      cardWithDeckHandler({ id: 'fc_1', deck_id: 'deck_1', user_id: 'owner_1' }),
      catchAll(),
    ]);
    const t = await token('intruder_1');
    const res = await flashcardDecksApp.fetch(req('http://x/cards/fc_1', 'DELETE', t), env(db));
    expect(res.status).toBe(403);
    expect(db.calls.some((c) => c.sql.startsWith('DELETE FROM'))).toBe(false);
  });

  it('lets the owner delete the card and decrements card_count', async () => {
    const db = createMockD1([
      authHandler(),
      cardWithDeckHandler({ id: 'fc_1', deck_id: 'deck_1', user_id: 'owner_1' }),
      catchAll(),
    ]);
    const t = await token('owner_1');
    const res = await flashcardDecksApp.fetch(req('http://x/cards/fc_1', 'DELETE', t), env(db));
    expect(res.status).toBe(200);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM flashcard_reviews WHERE flashcard_id'))).toBe(true);
    expect(db.calls.some((c) => c.sql.includes('DELETE FROM flashcards WHERE id'))).toBe(true);

    const dec = db.calls.find((c) => c.sql.includes('card_count = MAX(card_count - 1, 0)'));
    expect(dec).toBeDefined();
    expect(dec!.binds[0]).toBe('deck_1');
  });
});
