import { useState, useEffect } from 'react';
import { CheckCircle, XCircle, HelpCircle, Clock } from 'lucide-react';
import type { Question } from '@/types';
import { Card, Button, Timer, Badge, DifficultyBadge } from '@/components/common';
import { cn, formatTime } from '@/utils';
import { MathText } from './MathText';

interface QuestionCardProps {
  question: Question;
  questionNumber?: number;
  totalQuestions?: number;
  showTimer?: boolean;
  timeRemaining?: number;
  isTimerRunning?: boolean;
  onTimerTick?: () => void;
  onTimeUp?: () => void;
  onAnswer?: (answer: string) => void;
  onSkip?: () => void;
  selectedAnswer?: string | null;
  isAnswerRevealed?: boolean;
  showExplanation?: boolean;
  className?: string;
}

export function QuestionCard({
  question,
  questionNumber,
  totalQuestions,
  showTimer = false,
  timeRemaining = 30,
  isTimerRunning = false,
  onTimerTick,
  onTimeUp,
  onAnswer,
  onSkip,
  selectedAnswer,
  isAnswerRevealed = false,
  showExplanation = true,
  className,
}: QuestionCardProps) {
  const [localAnswer, setLocalAnswer] = useState('');

  const isCorrect = selectedAnswer?.toLowerCase().trim() ===
                    question.correctAnswer.toLowerCase().trim();

  useEffect(() => {
    setLocalAnswer('');
  }, [question.id]);

  const handleSubmit = () => {
    if (question.questionType === 'direct_answer' && localAnswer) {
      onAnswer?.(localAnswer);
    }
  };

  return (
    <Card className={cn('p-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          {questionNumber && totalQuestions && (
            <Badge variant="neutral">
              {questionNumber} / {totalQuestions}
            </Badge>
          )}
          <DifficultyBadge difficulty={question.difficulty} />
        </div>

        {showTimer && onTimerTick && (
          <Timer
            duration={question.timeLimit}
            remaining={timeRemaining}
            isRunning={isTimerRunning}
            onTick={onTimerTick}
            onComplete={onTimeUp}
            size="sm"
          />
        )}
      </div>

      {/* Question */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-2">
          <MathText text={question.questionText} />
        </h3>

        {question.imageUrl && (
          <img
            src={question.imageUrl}
            alt="Question illustration"
            className="max-w-full h-auto rounded-lg mt-4"
          />
        )}
      </div>

      {/* Answer Section */}
      <div className="space-y-4">
        {/* Multiple Choice */}
        {question.questionType === 'multiple_choice' && question.options && (
          <MultipleChoiceOptions
            options={question.options}
            selectedAnswer={selectedAnswer}
            correctAnswer={question.correctAnswer}
            isRevealed={isAnswerRevealed}
            onSelect={onAnswer}
          />
        )}

        {/* True/False */}
        {question.questionType === 'true_false' && (
          <TrueFalseOptions
            selectedAnswer={selectedAnswer}
            correctAnswer={question.correctAnswer}
            isRevealed={isAnswerRevealed}
            onSelect={onAnswer}
          />
        )}

        {/* Direct Answer */}
        {question.questionType === 'direct_answer' && (
          <div className="space-y-3">
            {!isAnswerRevealed ? (
              <>
                <input
                  type="text"
                  value={localAnswer}
                  onChange={(e) => setLocalAnswer(e.target.value)}
                  placeholder="Type your answer..."
                  className="w-full px-4 py-3 text-lg rounded-lg border border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
                  disabled={isAnswerRevealed}
                  onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                />
                <div className="flex gap-2">
                  <Button onClick={handleSubmit} disabled={!localAnswer}>
                    Submit Answer
                  </Button>
                  {onSkip && (
                    <Button variant="ghost" onClick={onSkip}>
                      Skip
                    </Button>
                  )}
                </div>
              </>
            ) : (
              <div className={cn(
                'p-4 rounded-lg',
                isCorrect ? 'bg-green-50' : 'bg-red-50'
              )}>
                <div className="flex items-center gap-2 mb-2">
                  {isCorrect ? (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  ) : (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                  <span className={cn(
                    'font-medium',
                    isCorrect ? 'text-green-800' : 'text-red-800'
                  )}>
                    {isCorrect ? 'Correct!' : 'Incorrect'}
                  </span>
                </div>
                {!isCorrect && selectedAnswer && (
                  <p className="text-sm text-neutral-600 mb-2">
                    Your answer: <span className="font-medium">{selectedAnswer}</span>
                  </p>
                )}
                <p className="text-sm">
                  <span className="text-neutral-600">Correct answer: </span>
                  <span className="font-medium text-green-800">
                    <MathText text={question.correctAnswer} />
                  </span>
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Explanation */}
      {isAnswerRevealed && showExplanation && question.explanation && (
        <div className="mt-4 p-4 bg-blue-50 rounded-lg">
          <div className="flex items-start gap-2">
            <HelpCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h4 className="font-medium text-blue-900 mb-1">Explanation</h4>
              <p className="text-sm text-blue-800">
                <MathText text={question.explanation} />
              </p>
            </div>
          </div>
        </div>
      )}
    </Card>
  );
}

// Multiple Choice Options Component
interface MultipleChoiceOptionsProps {
  options: { id: string; text: string; isCorrect: boolean }[];
  selectedAnswer?: string | null;
  correctAnswer: string;
  isRevealed: boolean;
  onSelect?: (answer: string) => void;
}

function MultipleChoiceOptions({
  options,
  selectedAnswer,
  correctAnswer,
  isRevealed,
  onSelect,
}: MultipleChoiceOptionsProps) {
  return (
    <div className="space-y-2">
      {options.map((option, index) => {
        const letter = String.fromCharCode(65 + index); // A, B, C, D
        const isSelected = selectedAnswer === option.id;
        const isCorrectOption = option.isCorrect;

        let bgColor = 'bg-white hover:bg-neutral-50';
        let borderColor = 'border-neutral-200';
        let textColor = 'text-neutral-900';

        if (isRevealed) {
          if (isCorrectOption) {
            bgColor = 'bg-green-50';
            borderColor = 'border-green-500';
            textColor = 'text-green-900';
          } else if (isSelected && !isCorrectOption) {
            bgColor = 'bg-red-50';
            borderColor = 'border-red-500';
            textColor = 'text-red-900';
          }
        } else if (isSelected) {
          bgColor = 'bg-primary-50';
          borderColor = 'border-primary';
          textColor = 'text-primary-dark';
        }

        return (
          <button
            key={option.id}
            onClick={() => !isRevealed && onSelect?.(option.id)}
            disabled={isRevealed}
            className={cn(
              'w-full flex items-center gap-3 p-4 rounded-lg border-2 transition-all text-left',
              bgColor,
              borderColor,
              textColor,
              !isRevealed && 'cursor-pointer'
            )}
          >
            <span className={cn(
              'w-8 h-8 rounded-full flex items-center justify-center font-medium text-sm border-2',
              isRevealed && isCorrectOption ? 'border-green-500 bg-green-500 text-white' :
              isRevealed && isSelected && !isCorrectOption ? 'border-red-500 bg-red-500 text-white' :
              isSelected ? 'border-primary bg-primary text-white' :
              'border-neutral-300 bg-white text-neutral-600'
            )}>
              {letter}
            </span>
            <span className="flex-1">
              <MathText text={option.text} />
            </span>
            {isRevealed && isCorrectOption && (
              <CheckCircle className="w-5 h-5 text-green-600" />
            )}
            {isRevealed && isSelected && !isCorrectOption && (
              <XCircle className="w-5 h-5 text-red-600" />
            )}
          </button>
        );
      })}
    </div>
  );
}

// True/False Options Component
interface TrueFalseOptionsProps {
  selectedAnswer?: string | null;
  correctAnswer: string;
  isRevealed: boolean;
  onSelect?: (answer: string) => void;
}

function TrueFalseOptions({
  selectedAnswer,
  correctAnswer,
  isRevealed,
  onSelect,
}: TrueFalseOptionsProps) {
  const options = [
    { value: 'true', label: 'True' },
    { value: 'false', label: 'False' },
  ];

  return (
    <div className="flex gap-4">
      {options.map((option) => {
        const isSelected = selectedAnswer?.toLowerCase() === option.value;
        const isCorrectOption = correctAnswer.toLowerCase() === option.value;

        let bgColor = 'bg-white hover:bg-neutral-50';
        let borderColor = 'border-neutral-200';

        if (isRevealed) {
          if (isCorrectOption) {
            bgColor = 'bg-green-50';
            borderColor = 'border-green-500';
          } else if (isSelected) {
            bgColor = 'bg-red-50';
            borderColor = 'border-red-500';
          }
        } else if (isSelected) {
          bgColor = 'bg-primary-50';
          borderColor = 'border-primary';
        }

        return (
          <button
            key={option.value}
            onClick={() => !isRevealed && onSelect?.(option.value)}
            disabled={isRevealed}
            className={cn(
              'flex-1 py-4 px-6 rounded-lg border-2 font-medium transition-all',
              bgColor,
              borderColor,
              !isRevealed && 'cursor-pointer'
            )}
          >
            <div className="flex items-center justify-center gap-2">
              <span>{option.label}</span>
              {isRevealed && isCorrectOption && (
                <CheckCircle className="w-5 h-5 text-green-600" />
              )}
              {isRevealed && isSelected && !isCorrectOption && (
                <XCircle className="w-5 h-5 text-red-600" />
              )}
            </div>
          </button>
        );
      })}
    </div>
  );
}
