import { useState } from 'react';
import { RotateCcw, ChevronLeft, ChevronRight, Shuffle, Check, X } from 'lucide-react';
import type { Topic } from '@/types';
import { Card, Button, Badge } from '@/components/common';
import { MathText, FormulaList } from '@/components/questions';
import { cn, shuffleArray } from '@/utils';

interface FlashcardItem {
  id: string;
  front: string;
  back: string;
  category?: string;
}

interface FlashcardProps {
  cards: FlashcardItem[];
  title?: string;
  onComplete?: (results: { known: number; unknown: number }) => void;
}

export function Flashcard({ cards, title, onComplete }: FlashcardProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isFlipped, setIsFlipped] = useState(false);
  const [knownCards, setKnownCards] = useState<Set<string>>(new Set());
  const [unknownCards, setUnknownCards] = useState<Set<string>>(new Set());
  const [cardOrder, setCardOrder] = useState(cards);
  const [isComplete, setIsComplete] = useState(false);

  const currentCard = cardOrder[currentIndex];
  const progress = ((knownCards.size + unknownCards.size) / cards.length) * 100;

  const handleFlip = () => {
    setIsFlipped(!isFlipped);
  };

  const handleKnow = () => {
    setKnownCards((prev) => new Set([...prev, currentCard.id]));
    goToNext();
  };

  const handleDontKnow = () => {
    setUnknownCards((prev) => new Set([...prev, currentCard.id]));
    goToNext();
  };

  const goToNext = () => {
    setIsFlipped(false);
    if (currentIndex < cardOrder.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      setIsComplete(true);
      onComplete?.({
        known: knownCards.size + 1, // Include current if marked
        unknown: unknownCards.size,
      });
    }
  };

  const goToPrevious = () => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setIsFlipped(false);
    }
  };

  const handleShuffle = () => {
    setCardOrder(shuffleArray(cards));
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setIsComplete(false);
  };

  const handleReset = () => {
    setCurrentIndex(0);
    setIsFlipped(false);
    setKnownCards(new Set());
    setUnknownCards(new Set());
    setIsComplete(false);
  };

  if (isComplete) {
    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <h2 className="text-2xl font-bold text-neutral-900 mb-4">
          Session Complete!
        </h2>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-green-50 rounded-lg">
            <p className="text-sm text-green-600">Got it</p>
            <p className="text-3xl font-bold text-green-700">{knownCards.size}</p>
          </div>
          <div className="p-4 bg-red-50 rounded-lg">
            <p className="text-sm text-red-600">Need Review</p>
            <p className="text-3xl font-bold text-red-700">{unknownCards.size}</p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline" onClick={handleShuffle} fullWidth>
            <Shuffle className="w-4 h-4 mr-2" />
            Shuffle & Restart
          </Button>
          <Button onClick={handleReset} fullWidth>
            <RotateCcw className="w-4 h-4 mr-2" />
            Try Again
          </Button>
        </div>
      </Card>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          {title && <h2 className="font-semibold text-neutral-900">{title}</h2>}
          <p className="text-sm text-neutral-500">
            Card {currentIndex + 1} of {cardOrder.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant="success">{knownCards.size} known</Badge>
          <Badge variant="error">{unknownCards.size} to review</Badge>
          <Button variant="ghost" size="sm" onClick={handleShuffle}>
            <Shuffle className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full bg-neutral-200 rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all"
          style={{ width: `${progress}%` }}
        />
      </div>

      {/* Flashcard */}
      <div
        className="relative h-80 cursor-pointer perspective-1000"
        onClick={handleFlip}
      >
        <div
          className={cn(
            'absolute inset-0 transition-transform duration-500 transform-style-3d',
            isFlipped && 'rotate-y-180'
          )}
        >
          {/* Front */}
          <Card
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center p-8 backface-hidden',
              isFlipped && 'invisible'
            )}
          >
            {currentCard.category && (
              <Badge variant="neutral" className="mb-4">
                {currentCard.category}
              </Badge>
            )}
            <p className="text-xl font-medium text-neutral-900 text-center">
              <MathText text={currentCard.front} />
            </p>
            <p className="mt-4 text-sm text-neutral-400">
              Click to reveal answer
            </p>
          </Card>

          {/* Back */}
          <Card
            className={cn(
              'absolute inset-0 flex flex-col items-center justify-center p-8 backface-hidden rotate-y-180',
              !isFlipped && 'invisible'
            )}
          >
            <p className="text-xl font-medium text-primary text-center">
              <MathText text={currentCard.back} />
            </p>
          </Card>
        </div>
      </div>

      {/* Controls */}
      <div className="flex items-center justify-between">
        <Button
          variant="ghost"
          onClick={goToPrevious}
          disabled={currentIndex === 0}
        >
          <ChevronLeft className="w-5 h-5" />
          Previous
        </Button>

        {isFlipped && (
          <div className="flex gap-3">
            <Button variant="outline" onClick={handleDontKnow} className="text-red-600 border-red-300 hover:bg-red-50">
              <X className="w-4 h-4 mr-2" />
              Don't Know
            </Button>
            <Button onClick={handleKnow} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-2" />
              Got It!
            </Button>
          </div>
        )}

        <Button
          variant="ghost"
          onClick={() => {
            setIsFlipped(false);
            setCurrentIndex((prev) => Math.min(prev + 1, cardOrder.length - 1));
          }}
          disabled={currentIndex === cardOrder.length - 1}
        >
          Next
          <ChevronRight className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Topic Flashcards - Generate flashcards from topic formulas
interface TopicFlashcardsProps {
  topic: Topic;
  onComplete?: (results: { known: number; unknown: number }) => void;
}

export function TopicFlashcards({ topic, onComplete }: TopicFlashcardsProps) {
  const cards: FlashcardItem[] = topic.keyFormulas?.map((formula, index) => ({
    id: `${topic.id}_formula_${index}`,
    front: `What is the formula for ${formula.split('=')[0].trim()}?`,
    back: formula,
    category: topic.name,
  })) || [];

  if (cards.length === 0) {
    return (
      <Card className="p-8 text-center">
        <p className="text-neutral-500">No flashcards available for this topic.</p>
      </Card>
    );
  }

  return <Flashcard cards={cards} title={`${topic.name} Formulas`} onComplete={onComplete} />;
}
