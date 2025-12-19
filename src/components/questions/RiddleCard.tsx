import { useState } from 'react';
import { Lightbulb, Eye, CheckCircle, XCircle, ChevronRight } from 'lucide-react';
import type { Riddle } from '@/types';
import { Card, Button, Badge } from '@/components/common';
import { cn } from '@/utils';
import { SCORING } from '@/types';

interface RiddleCardProps {
  riddle: Riddle;
  riddleNumber?: number;
  onAnswer?: (answer: string, clueNumber: number) => { isCorrect: boolean; points: number };
  onNextClue?: () => void;
  className?: string;
}

export function RiddleCard({
  riddle,
  riddleNumber,
  onAnswer,
  onNextClue,
  className,
}: RiddleCardProps) {
  const [currentClue, setCurrentClue] = useState(1);
  const [userAnswer, setUserAnswer] = useState('');
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [pointsEarned, setPointsEarned] = useState(0);
  const [attempts, setAttempts] = useState<string[]>([]);

  const maxClues = riddle.clues.length;

  const getPointsForClue = (clue: number) => {
    if (clue === 1) return SCORING.ROUND_FIVE.CLUE_1;
    if (clue === 2) return SCORING.ROUND_FIVE.CLUE_2;
    return SCORING.ROUND_FIVE.CLUE_3_PLUS;
  };

  const handleSubmit = () => {
    if (!userAnswer.trim()) return;

    setAttempts([...attempts, userAnswer]);

    if (onAnswer) {
      const result = onAnswer(userAnswer, currentClue);
      if (result.isCorrect) {
        setIsCorrect(true);
        setIsAnswered(true);
        setPointsEarned(result.points);
      } else {
        // Wrong answer, reveal next clue if available
        if (currentClue < maxClues) {
          setCurrentClue(currentClue + 1);
          setUserAnswer('');
          onNextClue?.();
        } else {
          // No more clues
          setIsAnswered(true);
        }
      }
    } else {
      // Local check
      const correct = userAnswer.toLowerCase().trim() === riddle.answer.toLowerCase().trim();
      if (correct) {
        setIsCorrect(true);
        setIsAnswered(true);
        setPointsEarned(getPointsForClue(currentClue));
      } else {
        if (currentClue < maxClues) {
          setCurrentClue(currentClue + 1);
          setUserAnswer('');
        } else {
          setIsAnswered(true);
        }
      }
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Lightbulb className="w-5 h-5 text-secondary" />
          <span className="font-semibold text-neutral-900">
            Riddle {riddleNumber || ''}
          </span>
        </div>
        {!isAnswered && (
          <Badge variant="secondary">
            {getPointsForClue(currentClue)} points available
          </Badge>
        )}
        {isAnswered && isCorrect && (
          <Badge variant="success">+{pointsEarned} points</Badge>
        )}
      </div>

      {/* Clues */}
      <div className="space-y-3 mb-6">
        {riddle.clues.slice(0, currentClue).map((clue, index) => (
          <div
            key={index}
            className={cn(
              'p-4 rounded-lg border-l-4 animate-slide-up',
              index === currentClue - 1
                ? 'bg-secondary-50 border-secondary'
                : 'bg-neutral-50 border-neutral-300'
            )}
          >
            <div className="flex items-start gap-2">
              <span className="flex-shrink-0 w-6 h-6 rounded-full bg-secondary text-white text-sm font-medium flex items-center justify-center">
                {index + 1}
              </span>
              <p className="text-neutral-800">{clue}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Clue progress */}
      <div className="flex items-center gap-2 mb-4">
        <span className="text-sm text-neutral-500">Clues revealed:</span>
        <div className="flex gap-1">
          {Array.from({ length: maxClues }).map((_, index) => (
            <div
              key={index}
              className={cn(
                'w-2 h-2 rounded-full',
                index < currentClue ? 'bg-secondary' : 'bg-neutral-200'
              )}
            />
          ))}
        </div>
      </div>

      {/* Answer section */}
      {!isAnswered ? (
        <div className="space-y-3">
          <input
            type="text"
            value={userAnswer}
            onChange={(e) => setUserAnswer(e.target.value)}
            placeholder="What am I?"
            className="w-full px-4 py-3 text-lg rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
          />
          <div className="flex gap-2">
            <Button onClick={handleSubmit} disabled={!userAnswer.trim()}>
              Submit Answer
            </Button>
            {currentClue < maxClues && (
              <Button
                variant="outline"
                onClick={() => setCurrentClue(currentClue + 1)}
              >
                <Eye className="w-4 h-4 mr-2" />
                Reveal Next Clue (-{getPointsForClue(currentClue) - getPointsForClue(currentClue + 1)} pts)
              </Button>
            )}
          </div>

          {/* Previous attempts */}
          {attempts.length > 0 && (
            <div className="mt-4 p-3 bg-neutral-50 rounded-lg">
              <p className="text-sm text-neutral-500 mb-2">Previous attempts:</p>
              <div className="flex flex-wrap gap-2">
                {attempts.map((attempt, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-red-100 text-red-700 text-sm rounded"
                  >
                    {attempt}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      ) : (
        <div
          className={cn(
            'p-4 rounded-lg',
            isCorrect ? 'bg-green-50' : 'bg-red-50'
          )}
        >
          <div className="flex items-center gap-2 mb-3">
            {isCorrect ? (
              <>
                <CheckCircle className="w-6 h-6 text-green-600" />
                <span className="font-semibold text-green-800">
                  Correct! +{pointsEarned} points
                </span>
              </>
            ) : (
              <>
                <XCircle className="w-6 h-6 text-red-600" />
                <span className="font-semibold text-red-800">
                  Out of clues!
                </span>
              </>
            )}
          </div>
          <div className="flex items-center gap-2">
            <span className="text-neutral-600">The answer was:</span>
            <span className="font-bold text-lg text-neutral-900">{riddle.answer}</span>
          </div>

          {/* Show all clues after answer */}
          {!isCorrect && currentClue < maxClues && (
            <div className="mt-4 pt-4 border-t border-red-200">
              <p className="text-sm text-neutral-600 mb-2">Remaining clues:</p>
              <ul className="space-y-1 text-sm text-neutral-700">
                {riddle.clues.slice(currentClue).map((clue, index) => (
                  <li key={index} className="flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-neutral-400 mt-0.5" />
                    {clue}
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      )}
    </Card>
  );
}
