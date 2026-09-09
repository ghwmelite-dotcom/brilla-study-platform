import { Hono } from 'hono';
import { requireAuth } from './auth-middleware';
import { parseJsonBody } from './http';
import { getDemoDataFlags } from './demoUtils';

// Custom flashcard decks: owner-only CRUD on flashcard_decks + flashcards.
// The existing read/review endpoints in index.ts already include user-owned
// decks (fd.user_id = ? OR fd.is_public = 1), so decks created here are
// immediately reviewable through the spaced-repetition flow.

interface Env {
  DB: D1Database;
  JWT_SECRET: string;
}

interface UserPayload {
  userId: string;
  email: string;
  role: string;
}

const flashcardDecksApp = new Hono<{ Bindings: Env; Variables: { user: UserPayload } }>();

// All deck-management routes require a verified JWT (sets user on context).
flashcardDecksApp.use('*', requireAuth);

const generateId = (prefix: string) => `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;

// Abuse caps for a free authenticated write endpoint.
const MAX_DECKS_PER_USER = 50;
const MAX_CARDS_PER_DECK = 200;

const NAME_MIN = 2;
const NAME_MAX = 100;
const DESCRIPTION_MAX = 500;
const FRONT_MAX = 1000;
const BACK_MAX = 2000;
const HINT_MAX = 500;

interface DeckRow {
  id: string;
  user_id: string | null;
  name: string;
  description: string | null;
  subject_id: string | null;
  topic_id: string | null;
  is_public: number;
  card_count: number;
  created_at: string;
  updated_at: string;
}

function validateDeckFields(body: Record<string, any>): string | null {
  if (body.name !== undefined) {
    if (typeof body.name !== 'string' || body.name.trim().length < NAME_MIN || body.name.trim().length > NAME_MAX) {
      return `Deck name must be between ${NAME_MIN} and ${NAME_MAX} characters.`;
    }
  }
  if (body.description !== undefined && body.description !== null) {
    if (typeof body.description !== 'string' || body.description.length > DESCRIPTION_MAX) {
      return `Description must be ${DESCRIPTION_MAX} characters or fewer.`;
    }
  }
  if (body.subjectId !== undefined && body.subjectId !== null && typeof body.subjectId !== 'string') {
    return 'subjectId must be a string.';
  }
  if (body.topicId !== undefined && body.topicId !== null && typeof body.topicId !== 'string') {
    return 'topicId must be a string.';
  }
  return null;
}

function validateCardFields(body: Record<string, any>, partial: boolean): string | null {
  if (!partial || body.front !== undefined) {
    if (typeof body.front !== 'string' || body.front.trim().length === 0 || body.front.length > FRONT_MAX) {
      return `Card front is required and must be ${FRONT_MAX} characters or fewer.`;
    }
  }
  if (!partial || body.back !== undefined) {
    if (typeof body.back !== 'string' || body.back.trim().length === 0 || body.back.length > BACK_MAX) {
      return `Card back is required and must be ${BACK_MAX} characters or fewer.`;
    }
  }
  if (body.hint !== undefined && body.hint !== null) {
    if (typeof body.hint !== 'string' || body.hint.length > HINT_MAX) {
      return `Hint must be ${HINT_MAX} characters or fewer.`;
    }
  }
  if (body.imageUrl !== undefined && body.imageUrl !== null) {
    if (typeof body.imageUrl !== 'string' || body.imageUrl.length > 2048) {
      return 'imageUrl must be a string of 2048 characters or fewer.';
    }
  }
  if (body.difficulty !== undefined && body.difficulty !== null) {
    if (!Number.isInteger(body.difficulty) || body.difficulty < 1 || body.difficulty > 5) {
      return 'Difficulty must be an integer between 1 and 5.';
    }
  }
  return null;
}

// Load a deck for a write path. Returns the deck, or the error response to
// send. Not-found decks answer 404; decks owned by someone else answer 403.
async function getOwnedDeck(
  db: D1Database,
  deckId: string,
  userId: string,
): Promise<{ deck: DeckRow } | { error: Response }> {
  const deck = await db.prepare('SELECT * FROM flashcard_decks WHERE id = ?').bind(deckId).first<DeckRow>();
  if (!deck) {
    return { error: jsonError('Deck not found', 404) };
  }
  if (deck.user_id !== userId) {
    return { error: jsonError('You do not own this deck', 403) };
  }
  return { deck };
}

function jsonError(error: string, status: 400 | 401 | 403 | 404 | 500): Response {
  return new Response(JSON.stringify({ success: false, error }), {
    status,
    headers: { 'Content-Type': 'application/json' },
  });
}

// =============================================
// RETENTION METRICS
// =============================================

const RETENTION_WINDOW_DAYS = 30;
const MIN_REVIEWS_FOR_METRIC = 10;

interface RetentionDeckRow {
  deck_id: string;
  deck_name: string;
  reviews_30d: number;
  recalled_30d: number;
  mature_reviews_30d: number;
  mature_recalled_30d: number;
}

const pct = (recalled: number, total: number): number | null =>
  total > 0 ? Math.round((recalled / total) * 1000) / 10 : null;

// Per-user flashcard retention: share of reviews in the trailing 30 days
// rated ease_rating >= 3 (recalled), overall and per deck. Mature retention
// restricts to reviews of cards with repetitions >= 2 (Anki-style). Users
// with fewer than MIN_REVIEWS_FOR_METRIC recent reviews get no number.
flashcardDecksApp.get('/retention', async (c) => {
  const user = c.get('user');
  try {
    const { results: deckRows } = await c.env.DB.prepare(`
      SELECT
        fr.deck_id,
        fd.name AS deck_name,
        COUNT(*) AS reviews_30d,
        SUM(CASE WHEN fr.ease_rating >= 3 THEN 1 ELSE 0 END) AS recalled_30d,
        SUM(CASE WHEN fr.repetitions >= 2 THEN 1 ELSE 0 END) AS mature_reviews_30d,
        SUM(CASE WHEN fr.repetitions >= 2 AND fr.ease_rating >= 3 THEN 1 ELSE 0 END) AS mature_recalled_30d
      FROM flashcard_reviews fr
      JOIN flashcard_decks fd ON fd.id = fr.deck_id
      WHERE fr.user_id = ?
        AND datetime(fr.reviewed_at) >= datetime('now', '-${RETENTION_WINDOW_DAYS} days')
      GROUP BY fr.deck_id
      ORDER BY reviews_30d DESC
    `).bind(user.userId).all<RetentionDeckRow>();

    // Cards whose most recent review is due now.
    const dueRow = await c.env.DB.prepare(`
      SELECT COUNT(*) AS due_now
      FROM flashcard_reviews fr
      WHERE fr.user_id = ?
        AND fr.next_review_at IS NOT NULL
        AND datetime(fr.next_review_at) <= datetime('now')
        AND fr.reviewed_at = (
          SELECT MAX(fr2.reviewed_at) FROM flashcard_reviews fr2
          WHERE fr2.user_id = fr.user_id AND fr2.flashcard_id = fr.flashcard_id
        )
    `).bind(user.userId).first<{ due_now: number }>();

    const rows = deckRows || [];
    const totalReviews30d = rows.reduce((sum, r) => sum + r.reviews_30d, 0);
    const totalRecalled30d = rows.reduce((sum, r) => sum + r.recalled_30d, 0);
    const matureReviews30d = rows.reduce((sum, r) => sum + r.mature_reviews_30d, 0);
    const matureRecalled30d = rows.reduce((sum, r) => sum + r.mature_recalled_30d, 0);
    const insufficientData = totalReviews30d < MIN_REVIEWS_FOR_METRIC;

    return c.json({
      success: true,
      data: {
        windowDays: RETENTION_WINDOW_DAYS,
        totalReviews30d,
        insufficientData,
        retentionRate: insufficientData ? null : pct(totalRecalled30d, totalReviews30d),
        matureReviews30d,
        matureRetentionRate:
          insufficientData || matureReviews30d === 0 ? null : pct(matureRecalled30d, matureReviews30d),
        dueNow: dueRow?.due_now ?? 0,
        decks: rows.map((r) => ({
          deckId: r.deck_id,
          deckName: r.deck_name,
          reviews30d: r.reviews_30d,
          insufficientData: r.reviews_30d < MIN_REVIEWS_FOR_METRIC,
          retentionRate: r.reviews_30d < MIN_REVIEWS_FOR_METRIC ? null : pct(r.recalled_30d, r.reviews_30d),
          matureReviews30d: r.mature_reviews_30d,
          matureRetentionRate:
            r.reviews_30d < MIN_REVIEWS_FOR_METRIC || r.mature_reviews_30d === 0
              ? null
              : pct(r.mature_recalled_30d, r.mature_reviews_30d),
        })),
      },
    });
  } catch (error) {
    console.error('Failed to compute flashcard retention:', error);
    return c.json({ success: false, error: 'Failed to compute retention' }, 500);
  }
});

// =============================================
// DECK ROUTES
// =============================================

// List the caller's own decks with live card counts.
flashcardDecksApp.get('/mine', async (c) => {
  const user = c.get('user');
  try {
    const { results } = await c.env.DB.prepare(`
      SELECT fd.*, COUNT(f.id) as actual_card_count
      FROM flashcard_decks fd
      LEFT JOIN flashcards f ON f.deck_id = fd.id
      WHERE fd.user_id = ?
      GROUP BY fd.id
      ORDER BY fd.updated_at DESC
    `).bind(user.userId).all();

    return c.json({ success: true, data: results || [] });
  } catch (error) {
    console.error('Failed to fetch user decks:', error);
    return c.json({ success: false, error: 'Failed to fetch decks' }, 500);
  }
});

// Create a deck owned by the caller.
flashcardDecksApp.post('/', async (c) => {
  const user = c.get('user');
  const body = await parseJsonBody(c);
  if (!body) {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const validationError = validateDeckFields(body);
  if (validationError) {
    return c.json({ success: false, error: validationError }, 400);
  }
  if (typeof body.name !== 'string') {
    return c.json({ success: false, error: 'Deck name is required.' }, 400);
  }

  try {
    const countRow = await c.env.DB.prepare(
      'SELECT COUNT(*) as count FROM flashcard_decks WHERE user_id = ?',
    ).bind(user.userId).first<{ count: number }>();
    if ((countRow?.count ?? 0) >= MAX_DECKS_PER_USER) {
      return c.json({ success: false, error: `You can create at most ${MAX_DECKS_PER_USER} decks.` }, 400);
    }

    const id = generateId('deck');
    const isPublic = body.isPublic ? 1 : 0;
    const demoFlags = getDemoDataFlags(user.userId);

    await c.env.DB.prepare(`
      INSERT INTO flashcard_decks (id, user_id, name, description, subject_id, topic_id, is_public, card_count, is_demo_data, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, 0, ?, ?)
    `).bind(
      id,
      user.userId,
      body.name.trim(),
      body.description || null,
      body.subjectId || null,
      body.topicId || null,
      isPublic,
      demoFlags.is_demo_data,
      demoFlags.expires_at,
    ).run();

    return c.json({
      success: true,
      data: {
        id,
        user_id: user.userId,
        name: body.name.trim(),
        description: body.description || null,
        subject_id: body.subjectId || null,
        topic_id: body.topicId || null,
        is_public: isPublic,
        card_count: 0,
      },
    }, 201);
  } catch (error) {
    console.error('Failed to create deck:', error);
    return c.json({ success: false, error: 'Failed to create deck' }, 500);
  }
});

// Read one deck with its cards. Owner always; anyone only when public.
flashcardDecksApp.get('/:id', async (c) => {
  const user = c.get('user');
  const deckId = c.req.param('id');

  try {
    const deck = await c.env.DB.prepare(
      'SELECT * FROM flashcard_decks WHERE id = ?',
    ).bind(deckId).first<DeckRow>();

    if (!deck) {
      return c.json({ success: false, error: 'Deck not found' }, 404);
    }
    if (deck.is_public !== 1 && deck.user_id !== user.userId) {
      return c.json({ success: false, error: 'This deck is private' }, 403);
    }

    const { results: cards } = await c.env.DB.prepare(
      'SELECT * FROM flashcards WHERE deck_id = ? ORDER BY created_at ASC',
    ).bind(deckId).all();

    return c.json({ success: true, data: { ...deck, cards: cards || [] } });
  } catch (error) {
    console.error('Failed to fetch deck:', error);
    return c.json({ success: false, error: 'Failed to fetch deck' }, 500);
  }
});

// Update a deck (owner only).
flashcardDecksApp.put('/:id', async (c) => {
  const user = c.get('user');
  const deckId = c.req.param('id');
  const body = await parseJsonBody(c);
  if (!body) {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const validationError = validateDeckFields(body);
  if (validationError) {
    return c.json({ success: false, error: validationError }, 400);
  }

  const result = await getOwnedDeck(c.env.DB, deckId, user.userId);
  if ('error' in result) return result.error;

  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (body.name !== undefined) {
    sets.push('name = ?');
    params.push(body.name.trim());
  }
  if (body.description !== undefined) {
    sets.push('description = ?');
    params.push(body.description || null);
  }
  if (body.subjectId !== undefined) {
    sets.push('subject_id = ?');
    params.push(body.subjectId || null);
  }
  if (body.topicId !== undefined) {
    sets.push('topic_id = ?');
    params.push(body.topicId || null);
  }
  if (body.isPublic !== undefined) {
    sets.push('is_public = ?');
    params.push(body.isPublic ? 1 : 0);
  }

  if (sets.length === 0) {
    return c.json({ success: false, error: 'No fields to update.' }, 400);
  }

  sets.push("updated_at = datetime('now')");
  params.push(deckId);

  try {
    await c.env.DB.prepare(
      `UPDATE flashcard_decks SET ${sets.join(', ')} WHERE id = ?`,
    ).bind(...params).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM flashcard_decks WHERE id = ?',
    ).bind(deckId).first<DeckRow>();

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update deck:', error);
    return c.json({ success: false, error: 'Failed to update deck' }, 500);
  }
});

// Delete a deck, its cards and its review history (owner only). Rows are
// deleted explicitly rather than relying on FK cascade enforcement.
flashcardDecksApp.delete('/:id', async (c) => {
  const user = c.get('user');
  const deckId = c.req.param('id');

  const result = await getOwnedDeck(c.env.DB, deckId, user.userId);
  if ('error' in result) return result.error;

  try {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM flashcard_reviews WHERE deck_id = ?').bind(deckId),
      c.env.DB.prepare('DELETE FROM flashcards WHERE deck_id = ?').bind(deckId),
      c.env.DB.prepare('DELETE FROM flashcard_decks WHERE id = ?').bind(deckId),
    ]);

    return c.json({ success: true, data: { id: deckId, deleted: true } });
  } catch (error) {
    console.error('Failed to delete deck:', error);
    return c.json({ success: false, error: 'Failed to delete deck' }, 500);
  }
});

// =============================================
// CARD ROUTES
// =============================================

// Add a card to an owned deck.
flashcardDecksApp.post('/:id/cards', async (c) => {
  const user = c.get('user');
  const deckId = c.req.param('id');
  const body = await parseJsonBody(c);
  if (!body) {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const validationError = validateCardFields(body, false);
  if (validationError) {
    return c.json({ success: false, error: validationError }, 400);
  }

  const result = await getOwnedDeck(c.env.DB, deckId, user.userId);
  if ('error' in result) return result.error;

  try {
    if (result.deck.card_count >= MAX_CARDS_PER_DECK) {
      return c.json({ success: false, error: `A deck can hold at most ${MAX_CARDS_PER_DECK} cards.` }, 400);
    }

    const cardId = generateId('fc');
    const difficulty = body.difficulty ?? 1;

    await c.env.DB.batch([
      c.env.DB.prepare(`
        INSERT INTO flashcards (id, deck_id, front, back, image_url, hint, difficulty)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(cardId, deckId, body.front.trim(), body.back.trim(), body.imageUrl || null, body.hint || null, difficulty),
      c.env.DB.prepare(`
        UPDATE flashcard_decks SET card_count = card_count + 1, updated_at = datetime('now') WHERE id = ?
      `).bind(deckId),
    ]);

    return c.json({
      success: true,
      data: {
        id: cardId,
        deck_id: deckId,
        front: body.front.trim(),
        back: body.back.trim(),
        image_url: body.imageUrl || null,
        hint: body.hint || null,
        difficulty,
      },
    }, 201);
  } catch (error) {
    console.error('Failed to add card:', error);
    return c.json({ success: false, error: 'Failed to add card' }, 500);
  }
});

// Load a card together with its parent deck for card write paths.
async function getOwnedCard(
  db: D1Database,
  cardId: string,
  userId: string,
): Promise<{ card: { id: string; deck_id: string } } | { error: Response }> {
  const card = await db.prepare(`
    SELECT f.id, f.deck_id, fd.user_id
    FROM flashcards f
    JOIN flashcard_decks fd ON f.deck_id = fd.id
    WHERE f.id = ?
  `).bind(cardId).first<{ id: string; deck_id: string; user_id: string | null }>();

  if (!card) {
    return { error: jsonError('Card not found', 404) };
  }
  if (card.user_id !== userId) {
    return { error: jsonError('You do not own this card', 403) };
  }
  return { card: { id: card.id, deck_id: card.deck_id } };
}

// Update a card (owner of the parent deck only).
flashcardDecksApp.put('/cards/:cardId', async (c) => {
  const user = c.get('user');
  const cardId = c.req.param('cardId');
  const body = await parseJsonBody(c);
  if (!body) {
    return c.json({ success: false, error: 'Invalid JSON body' }, 400);
  }

  const validationError = validateCardFields(body, true);
  if (validationError) {
    return c.json({ success: false, error: validationError }, 400);
  }

  const result = await getOwnedCard(c.env.DB, cardId, user.userId);
  if ('error' in result) return result.error;

  const sets: string[] = [];
  const params: (string | number | null)[] = [];
  if (body.front !== undefined) {
    sets.push('front = ?');
    params.push(body.front.trim());
  }
  if (body.back !== undefined) {
    sets.push('back = ?');
    params.push(body.back.trim());
  }
  if (body.hint !== undefined) {
    sets.push('hint = ?');
    params.push(body.hint || null);
  }
  if (body.imageUrl !== undefined) {
    sets.push('image_url = ?');
    params.push(body.imageUrl || null);
  }
  if (body.difficulty !== undefined && body.difficulty !== null) {
    sets.push('difficulty = ?');
    params.push(body.difficulty);
  }

  if (sets.length === 0) {
    return c.json({ success: false, error: 'No fields to update.' }, 400);
  }

  sets.push("updated_at = datetime('now')");
  params.push(cardId);

  try {
    await c.env.DB.prepare(
      `UPDATE flashcards SET ${sets.join(', ')} WHERE id = ?`,
    ).bind(...params).run();

    const updated = await c.env.DB.prepare(
      'SELECT * FROM flashcards WHERE id = ?',
    ).bind(cardId).first();

    return c.json({ success: true, data: updated });
  } catch (error) {
    console.error('Failed to update card:', error);
    return c.json({ success: false, error: 'Failed to update card' }, 500);
  }
});

// Delete a card (owner of the parent deck only).
flashcardDecksApp.delete('/cards/:cardId', async (c) => {
  const user = c.get('user');
  const cardId = c.req.param('cardId');

  const result = await getOwnedCard(c.env.DB, cardId, user.userId);
  if ('error' in result) return result.error;

  try {
    await c.env.DB.batch([
      c.env.DB.prepare('DELETE FROM flashcard_reviews WHERE flashcard_id = ?').bind(cardId),
      c.env.DB.prepare('DELETE FROM flashcards WHERE id = ?').bind(cardId),
      c.env.DB.prepare(`
        UPDATE flashcard_decks SET card_count = MAX(card_count - 1, 0), updated_at = datetime('now') WHERE id = ?
      `).bind(result.card.deck_id),
    ]);

    return c.json({ success: true, data: { id: cardId, deleted: true } });
  } catch (error) {
    console.error('Failed to delete card:', error);
    return c.json({ success: false, error: 'Failed to delete card' }, 500);
  }
});

export { flashcardDecksApp };
