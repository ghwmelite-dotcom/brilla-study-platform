import { useCallback, useEffect, useState } from 'react';
import {
  BookOpen,
  ChevronDown,
  ChevronUp,
  Globe,
  Loader2,
  Lock,
  Pencil,
  Play,
  Plus,
  Trash2,
} from 'lucide-react';
import { Badge, Button, Card, ConfirmModal, Input, Modal, Select, Textarea } from '@/components/common';
import { api } from '@/lib/api';
import { useExamStore } from '@/stores/examStore';
import { cn } from '@/utils';
import { RetentionStatsCard, type DeckRetention } from './RetentionStats';

export interface UserFlashcardDeck {
  id: string;
  name: string;
  description: string | null;
  subject_id: string | null;
  topic_id: string | null;
  is_public: number;
  card_count: number;
  actual_card_count?: number;
  created_at: string;
  updated_at: string;
}

export interface DeckCard {
  id: string;
  front: string;
  back: string;
  hint?: string | null;
  image_url?: string | null;
  difficulty: number;
}

interface MyDecksProps {
  onStudyDeck: (deckName: string, cards: { id: string; front: string; back: string; category: string }[]) => void;
}

interface DeckFormState {
  name: string;
  description: string;
  subjectId: string;
  isPublic: boolean;
}

const emptyDeckForm: DeckFormState = { name: '', description: '', subjectId: '', isPublic: false };

interface CardFormState {
  front: string;
  back: string;
  hint: string;
  difficulty: number;
}

const emptyCardForm: CardFormState = { front: '', back: '', hint: '', difficulty: 1 };

const difficultyOptions = [
  { value: '1', label: '1 - Easiest' },
  { value: '2', label: '2' },
  { value: '3', label: '3' },
  { value: '4', label: '4' },
  { value: '5', label: '5 - Hardest' },
];

export function MyDecks({ onStudyDeck }: MyDecksProps) {
  const { subjects: examSubjects } = useExamStore();

  const [decks, setDecks] = useState<UserFlashcardDeck[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [retentionByDeck, setRetentionByDeck] = useState<Record<string, DeckRetention>>({});

  const handleRetentionLoaded = useCallback((stats: { decks: DeckRetention[] } | null) => {
    const map: Record<string, DeckRetention> = {};
    for (const d of stats?.decks || []) map[d.deckId] = d;
    setRetentionByDeck(map);
  }, []);

  // Deck create/edit modal
  const [deckModalOpen, setDeckModalOpen] = useState(false);
  const [editingDeck, setEditingDeck] = useState<UserFlashcardDeck | null>(null);
  const [deckForm, setDeckForm] = useState<DeckFormState>(emptyDeckForm);
  const [deckSaving, setDeckSaving] = useState(false);
  const [deckFormError, setDeckFormError] = useState<string | null>(null);

  // Delete confirmation
  const [deleteTarget, setDeleteTarget] = useState<UserFlashcardDeck | null>(null);
  const [deleting, setDeleting] = useState(false);

  // Expanded deck + card management
  const [expandedDeckId, setExpandedDeckId] = useState<string | null>(null);
  const [cardsByDeck, setCardsByDeck] = useState<Record<string, DeckCard[]>>({});
  const [cardsLoading, setCardsLoading] = useState(false);
  const [cardForm, setCardForm] = useState<CardFormState>(emptyCardForm);
  const [cardSaving, setCardSaving] = useState(false);
  const [cardFormError, setCardFormError] = useState<string | null>(null);
  const [editingCardId, setEditingCardId] = useState<string | null>(null);
  const [editCardForm, setEditCardForm] = useState<CardFormState>(emptyCardForm);
  const [deleteCardTarget, setDeleteCardTarget] = useState<DeckCard | null>(null);
  const [deletingCard, setDeletingCard] = useState(false);

  const loadDecks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await api.get<UserFlashcardDeck[]>('/flashcard-decks/mine');
      if (res.success && Array.isArray(res.data)) {
        setDecks(res.data);
      } else {
        setError(res.error || 'Failed to load your decks.');
      }
    } catch {
      setError('Failed to load your decks.');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDecks();
  }, [loadDecks]);

  const subjectOptions = [
    { value: '', label: 'No subject' },
    ...examSubjects.map((s) => ({ value: s.id, label: s.name })),
  ];

  const openCreateModal = () => {
    setEditingDeck(null);
    setDeckForm(emptyDeckForm);
    setDeckFormError(null);
    setDeckModalOpen(true);
  };

  const openEditModal = (deck: UserFlashcardDeck) => {
    setEditingDeck(deck);
    setDeckForm({
      name: deck.name,
      description: deck.description || '',
      subjectId: deck.subject_id || '',
      isPublic: deck.is_public === 1,
    });
    setDeckFormError(null);
    setDeckModalOpen(true);
  };

  const saveDeck = async () => {
    if (deckForm.name.trim().length < 2) {
      setDeckFormError('Deck name must be at least 2 characters.');
      return;
    }
    setDeckSaving(true);
    setDeckFormError(null);
    const payload = {
      name: deckForm.name.trim(),
      description: deckForm.description.trim() || null,
      subjectId: deckForm.subjectId || null,
      isPublic: deckForm.isPublic,
    };
    try {
      const res = editingDeck
        ? await api.put<UserFlashcardDeck>(`/flashcard-decks/${editingDeck.id}`, payload)
        : await api.post<UserFlashcardDeck>('/flashcard-decks', payload);
      if (res.success) {
        setDeckModalOpen(false);
        await loadDecks();
      } else {
        setDeckFormError(res.error || 'Failed to save deck.');
      }
    } catch {
      setDeckFormError('Failed to save deck.');
    } finally {
      setDeckSaving(false);
    }
  };

  const deleteDeck = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    try {
      const res = await api.delete(`/flashcard-decks/${deleteTarget.id}`);
      if (res.success) {
        if (expandedDeckId === deleteTarget.id) setExpandedDeckId(null);
        setDeleteTarget(null);
        await loadDecks();
      } else {
        setError(res.error || 'Failed to delete deck.');
        setDeleteTarget(null);
      }
    } catch {
      setError('Failed to delete deck.');
      setDeleteTarget(null);
    } finally {
      setDeleting(false);
    }
  };

  const loadCards = async (deckId: string) => {
    setCardsLoading(true);
    try {
      const res = await api.get<UserFlashcardDeck & { cards: DeckCard[] }>(`/flashcard-decks/${deckId}`);
      if (res.success && res.data) {
        setCardsByDeck((prev) => ({ ...prev, [deckId]: res.data!.cards || [] }));
      } else {
        setError(res.error || 'Failed to load cards.');
      }
    } catch {
      setError('Failed to load cards.');
    } finally {
      setCardsLoading(false);
    }
  };

  const toggleExpand = async (deckId: string) => {
    if (expandedDeckId === deckId) {
      setExpandedDeckId(null);
      return;
    }
    setExpandedDeckId(deckId);
    setEditingCardId(null);
    setCardForm(emptyCardForm);
    setCardFormError(null);
    await loadCards(deckId);
  };

  const addCard = async (deckId: string) => {
    if (!cardForm.front.trim() || !cardForm.back.trim()) {
      setCardFormError('Front and back are both required.');
      return;
    }
    setCardSaving(true);
    setCardFormError(null);
    try {
      const res = await api.post<DeckCard>(`/flashcard-decks/${deckId}/cards`, {
        front: cardForm.front.trim(),
        back: cardForm.back.trim(),
        hint: cardForm.hint.trim() || null,
        difficulty: cardForm.difficulty,
      });
      if (res.success) {
        setCardForm(emptyCardForm);
        await loadCards(deckId);
        await loadDecks();
      } else {
        setCardFormError(res.error || 'Failed to add card.');
      }
    } catch {
      setCardFormError('Failed to add card.');
    } finally {
      setCardSaving(false);
    }
  };

  const startEditCard = (card: DeckCard) => {
    setEditingCardId(card.id);
    setEditCardForm({
      front: card.front,
      back: card.back,
      hint: card.hint || '',
      difficulty: card.difficulty || 1,
    });
  };

  const saveCard = async (deckId: string, cardId: string) => {
    if (!editCardForm.front.trim() || !editCardForm.back.trim()) {
      return;
    }
    setCardSaving(true);
    try {
      const res = await api.put<DeckCard>(`/flashcard-decks/cards/${cardId}`, {
        front: editCardForm.front.trim(),
        back: editCardForm.back.trim(),
        hint: editCardForm.hint.trim() || null,
        difficulty: editCardForm.difficulty,
      });
      if (res.success) {
        setEditingCardId(null);
        await loadCards(deckId);
      } else {
        setError(res.error || 'Failed to update card.');
      }
    } catch {
      setError('Failed to update card.');
    } finally {
      setCardSaving(false);
    }
  };

  const deleteCard = async () => {
    if (!deleteCardTarget || !expandedDeckId) return;
    setDeletingCard(true);
    try {
      const res = await api.delete(`/flashcard-decks/cards/${deleteCardTarget.id}`);
      if (res.success) {
        setDeleteCardTarget(null);
        await loadCards(expandedDeckId);
        await loadDecks();
      } else {
        setError(res.error || 'Failed to delete card.');
        setDeleteCardTarget(null);
      }
    } catch {
      setError('Failed to delete card.');
      setDeleteCardTarget(null);
    } finally {
      setDeletingCard(false);
    }
  };

  const studyDeck = async (deck: UserFlashcardDeck) => {
    const res = await api.get<UserFlashcardDeck & { cards: DeckCard[] }>(`/flashcard-decks/${deck.id}`);
    const cards = res.success && res.data ? res.data.cards || [] : [];
    if (cards.length === 0) {
      setError('This deck has no cards yet. Add some cards first!');
      return;
    }
    setError(null);
    onStudyDeck(
      deck.name,
      cards.map((c) => ({ id: c.id, front: c.front, back: c.back, category: deck.name })),
    );
  };

  return (
    <section>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-neutral-900">My Flashcard Decks</h2>
        <Button size="sm" onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
          New Deck
        </Button>
      </div>

      <RetentionStatsCard onLoaded={handleRetentionLoaded} />

      {error && (
        <Card className="p-4 mb-4 border-red-200 bg-red-50">
          <p className="text-sm text-red-600">{error}</p>
        </Card>
      )}

      {loading ? (
        <div className="flex items-center justify-center p-8">
          <Loader2 className="w-6 h-6 text-primary animate-spin" />
        </div>
      ) : decks.length === 0 ? (
        <Card className="p-8 text-center">
          <BookOpen className="w-10 h-10 text-neutral-300 mx-auto mb-3" />
          <p className="text-neutral-600 mb-1">You haven't created any decks yet.</p>
          <p className="text-sm text-neutral-400 mb-4">
            Create your own flashcards and review them with spaced repetition.
          </p>
          <Button onClick={openCreateModal} leftIcon={<Plus className="w-4 h-4" />}>
            Create Your First Deck
          </Button>
        </Card>
      ) : (
        <div className="space-y-3">
          {decks.map((deck) => {
            const cardCount = deck.actual_card_count ?? deck.card_count;
            const isExpanded = expandedDeckId === deck.id;
            const cards = cardsByDeck[deck.id] || [];
            return (
              <Card key={deck.id} className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <button
                    className="flex items-center gap-3 flex-1 text-left min-w-0"
                    onClick={() => toggleExpand(deck.id)}
                  >
                    <div className="p-2 rounded-lg bg-green-100 shrink-0">
                      <BookOpen className="w-4 h-4 text-green-600" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-medium text-neutral-900 truncate">{deck.name}</p>
                      <div className="flex items-center gap-2 text-xs text-neutral-500">
                        <span>{cardCount} {cardCount === 1 ? 'card' : 'cards'}</span>
                        {retentionByDeck[deck.id]?.retentionRate != null && (
                          <Badge variant="success">
                            {retentionByDeck[deck.id].retentionRate}% recall
                          </Badge>
                        )}
                        {deck.is_public === 1 ? (
                          <Badge variant="success">
                            <Globe className="w-3 h-3 mr-1" />
                            Public
                          </Badge>
                        ) : (
                          <Badge variant="neutral">
                            <Lock className="w-3 h-3 mr-1" />
                            Private
                          </Badge>
                        )}
                      </div>
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-4 h-4 text-neutral-400 shrink-0" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-neutral-400 shrink-0" />
                    )}
                  </button>
                  <div className="flex items-center gap-1 shrink-0">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => studyDeck(deck)}
                      disabled={cardCount === 0}
                      leftIcon={<Play className="w-3 h-3" />}
                    >
                      Study
                    </Button>
                    <Button size="sm" variant="ghost" onClick={() => openEditModal(deck)} aria-label="Edit deck">
                      <Pencil className="w-4 h-4" />
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setDeleteTarget(deck)}
                      aria-label="Delete deck"
                      className="text-red-500 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>

                {deck.description && !isExpanded && (
                  <p className="mt-2 text-sm text-neutral-500">{deck.description}</p>
                )}

                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-neutral-100 space-y-3">
                    {cardsLoading ? (
                      <div className="flex items-center justify-center p-4">
                        <Loader2 className="w-5 h-5 text-primary animate-spin" />
                      </div>
                    ) : (
                      <>
                        {cards.length === 0 && (
                          <p className="text-sm text-neutral-500">No cards yet. Add your first card below.</p>
                        )}
                        {cards.map((card) => (
                          <div key={card.id} className="rounded-lg border border-neutral-100 p-3">
                            {editingCardId === card.id ? (
                              <div className="space-y-2">
                                <Textarea
                                  label="Front"
                                  rows={2}
                                  value={editCardForm.front}
                                  onChange={(e) => setEditCardForm((f) => ({ ...f, front: e.target.value }))}
                                />
                                <Textarea
                                  label="Back"
                                  rows={2}
                                  value={editCardForm.back}
                                  onChange={(e) => setEditCardForm((f) => ({ ...f, back: e.target.value }))}
                                />
                                <div className="grid grid-cols-2 gap-2">
                                  <Input
                                    label="Hint (optional)"
                                    value={editCardForm.hint}
                                    onChange={(e) => setEditCardForm((f) => ({ ...f, hint: e.target.value }))}
                                  />
                                  <Select
                                    label="Difficulty"
                                    options={difficultyOptions}
                                    value={String(editCardForm.difficulty)}
                                    onChange={(e) => setEditCardForm((f) => ({ ...f, difficulty: parseInt(e.target.value, 10) }))}
                                  />
                                </div>
                                <div className="flex gap-2 justify-end">
                                  <Button size="sm" variant="ghost" onClick={() => setEditingCardId(null)}>
                                    Cancel
                                  </Button>
                                  <Button
                                    size="sm"
                                    isLoading={cardSaving}
                                    onClick={() => saveCard(deck.id, card.id)}
                                    disabled={!editCardForm.front.trim() || !editCardForm.back.trim()}
                                  >
                                    Save Card
                                  </Button>
                                </div>
                              </div>
                            ) : (
                              <div className="flex items-start justify-between gap-3">
                                <div className="min-w-0">
                                  <p className="text-sm font-medium text-neutral-900">{card.front}</p>
                                  <p className="text-sm text-neutral-500 mt-1">{card.back}</p>
                                  {card.hint && (
                                    <p className="text-xs text-neutral-400 mt-1">Hint: {card.hint}</p>
                                  )}
                                </div>
                                <div className="flex items-center gap-1 shrink-0">
                                  <Button size="sm" variant="ghost" onClick={() => startEditCard(card)} aria-label="Edit card">
                                    <Pencil className="w-3 h-3" />
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => setDeleteCardTarget(card)}
                                    aria-label="Delete card"
                                    className="text-red-500 hover:text-red-600 hover:bg-red-50"
                                  >
                                    <Trash2 className="w-3 h-3" />
                                  </Button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}

                        {/* Add-card form */}
                        <div className={cn('rounded-lg border border-dashed border-neutral-200 p-3 space-y-2')}>
                          <p className="text-sm font-medium text-neutral-700">Add a card</p>
                          <Textarea
                            placeholder="Front — the question or prompt"
                            rows={2}
                            value={cardForm.front}
                            onChange={(e) => setCardForm((f) => ({ ...f, front: e.target.value }))}
                          />
                          <Textarea
                            placeholder="Back — the answer"
                            rows={2}
                            value={cardForm.back}
                            onChange={(e) => setCardForm((f) => ({ ...f, back: e.target.value }))}
                          />
                          <div className="grid grid-cols-2 gap-2">
                            <Input
                              placeholder="Hint (optional)"
                              value={cardForm.hint}
                              onChange={(e) => setCardForm((f) => ({ ...f, hint: e.target.value }))}
                            />
                            <Select
                              options={difficultyOptions}
                              value={String(cardForm.difficulty)}
                              onChange={(e) => setCardForm((f) => ({ ...f, difficulty: parseInt(e.target.value, 10) }))}
                            />
                          </div>
                          {cardFormError && (
                            <p className="text-sm text-red-600" role="alert">{cardFormError}</p>
                          )}
                          <div className="flex justify-end">
                            <Button
                              size="sm"
                              isLoading={cardSaving}
                              onClick={() => addCard(deck.id)}
                              disabled={!cardForm.front.trim() || !cardForm.back.trim()}
                              leftIcon={<Plus className="w-3 h-3" />}
                            >
                              Add Card
                            </Button>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Create/edit deck modal */}
      <Modal
        isOpen={deckModalOpen}
        onClose={() => setDeckModalOpen(false)}
        title={editingDeck ? 'Edit Deck' : 'Create Deck'}
        footer={
          <>
            <Button variant="ghost" onClick={() => setDeckModalOpen(false)} disabled={deckSaving}>
              Cancel
            </Button>
            <Button isLoading={deckSaving} onClick={saveDeck} disabled={deckForm.name.trim().length < 2}>
              {editingDeck ? 'Save Changes' : 'Create Deck'}
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <Input
            label="Deck name"
            placeholder="e.g. WASSCE Physics Formulas"
            value={deckForm.name}
            onChange={(e) => setDeckForm((f) => ({ ...f, name: e.target.value }))}
            maxLength={100}
          />
          <Textarea
            label="Description (optional)"
            placeholder="What is this deck for?"
            rows={2}
            value={deckForm.description}
            onChange={(e) => setDeckForm((f) => ({ ...f, description: e.target.value }))}
            maxLength={500}
          />
          <Select
            label="Subject (optional)"
            options={subjectOptions}
            value={deckForm.subjectId}
            onChange={(e) => setDeckForm((f) => ({ ...f, subjectId: e.target.value }))}
          />
          <label className="flex items-center gap-2 text-sm text-neutral-700 cursor-pointer">
            <input
              type="checkbox"
              checked={deckForm.isPublic}
              onChange={(e) => setDeckForm((f) => ({ ...f, isPublic: e.target.checked }))}
              className="rounded border-neutral-300 text-primary focus:ring-primary"
            />
            Make this deck public (other students can study it)
          </label>
          {deckFormError && (
            <p className="text-sm text-red-600" role="alert">{deckFormError}</p>
          )}
        </div>
      </Modal>

      {/* Delete deck confirmation */}
      <ConfirmModal
        isOpen={deleteTarget !== null}
        onClose={() => setDeleteTarget(null)}
        onConfirm={deleteDeck}
        title="Delete Deck"
        message={`Delete "${deleteTarget?.name}" and all its cards? This cannot be undone.`}
        confirmText="Delete"
        variant="danger"
        isLoading={deleting}
      />

      {/* Delete card confirmation */}
      <ConfirmModal
        isOpen={deleteCardTarget !== null}
        onClose={() => setDeleteCardTarget(null)}
        onConfirm={deleteCard}
        title="Delete Card"
        message="Delete this flashcard? This cannot be undone."
        confirmText="Delete"
        variant="danger"
        isLoading={deletingCard}
      />
    </section>
  );
}
