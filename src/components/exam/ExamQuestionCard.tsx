import { useState, useEffect } from 'react';
import { CheckCircle, HelpCircle, Loader2 } from 'lucide-react';
import { cn } from '@/utils';
import { useThemeStore } from '@/stores/themeStore';

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface ExamQuestionCardProps {
  questionNumber: number;
  questionText: string;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'direct_answer' | 'essay';
  options?: QuestionOption[];
  selectedAnswer?: string;
  onAnswerSelect: (answer: string) => void;
  imageUrl?: string;
  marks?: number;
  showFeedback?: boolean;
  isCorrect?: boolean;
  correctAnswer?: string;
  explanation?: string;
  difficulty?: 'easy' | 'medium' | 'hard' | 'expert';
  timeLimit?: number;
  onTimeUp?: () => void;
}

export function ExamQuestionCard({
  questionNumber,
  questionText,
  questionType,
  options = [],
  selectedAnswer,
  onAnswerSelect,
  imageUrl,
  marks = 1,
  showFeedback = false,
  isCorrect,
  correctAnswer,
  explanation,
  difficulty,
  timeLimit,
  onTimeUp,
}: ExamQuestionCardProps) {
  const [localTimeRemaining, setLocalTimeRemaining] = useState(timeLimit || 0);
  const [imageLoading, setImageLoading] = useState(!!imageUrl);
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // Per-question timer
  useEffect(() => {
    if (!timeLimit || timeLimit === 0) return;

    setLocalTimeRemaining(timeLimit);
    const interval = setInterval(() => {
      setLocalTimeRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(interval);
          onTimeUp?.();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [timeLimit, questionNumber, onTimeUp]);

  const difficultyColors = {
    easy: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    medium: 'bg-amber-500/10 text-amber-400 border-amber-500/20',
    hard: 'bg-red-500/10 text-red-400 border-red-500/20',
    expert: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  };

  return (
    <div className="p-6 lg:p-8">
      {/* Question Header */}
      <div className="flex items-start justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className={cn("text-sm font-semibold", isDark ? "text-white/50" : "text-slate-500")}>
            Question {questionNumber}
          </span>
          {difficulty && (
            <span className={cn(
              'px-2 py-0.5 rounded-full text-xs font-medium border capitalize',
              difficultyColors[difficulty]
            )}>
              {difficulty}
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          {timeLimit && timeLimit > 0 && (
            <span className={cn(
              'px-3 py-1 rounded-lg text-sm font-mono font-medium',
              localTimeRemaining <= 10
                ? 'bg-red-500/20 text-red-400 animate-pulse'
                : localTimeRemaining <= 30
                  ? 'bg-amber-500/20 text-amber-400'
                  : isDark ? 'bg-white/5 text-white/70' : 'bg-slate-100 text-slate-700'
            )}>
              {localTimeRemaining}s
            </span>
          )}
          <span className={cn("text-sm", isDark ? "text-white/50" : "text-slate-500")}>
            {marks} mark{marks !== 1 ? 's' : ''}
          </span>
        </div>
      </div>

      {/* Question Image */}
      {imageUrl && (
        <div className="relative mb-6 rounded-xl overflow-hidden bg-white/5">
          {imageLoading && (
            <div className="absolute inset-0 flex items-center justify-center">
              <Loader2 className="w-8 h-8 text-white/30 animate-spin" />
            </div>
          )}
          <img
            src={imageUrl}
            alt="Question illustration"
            className={cn(
              'max-h-64 w-auto mx-auto transition-opacity',
              imageLoading ? 'opacity-0' : 'opacity-100'
            )}
            onLoad={() => setImageLoading(false)}
          />
        </div>
      )}

      {/* Question Text */}
      <div className="mb-8">
        <p className={cn("text-lg lg:text-xl leading-relaxed", isDark ? "text-white" : "text-slate-900")}>
          {questionText}
        </p>
      </div>

      {/* Answer Options */}
      {questionType === 'multiple_choice' && options.length > 0 && (
        <div className="space-y-3">
          {options.map((option, index) => {
            const isSelected = selectedAnswer === option.text;
            const letterIndex = String.fromCharCode(65 + index);
            const showCorrect = showFeedback && option.isCorrect;
            const showWrong = showFeedback && isSelected && !option.isCorrect;

            return (
              <button
                key={option.id || index}
                onClick={() => !showFeedback && onAnswerSelect(option.text)}
                disabled={showFeedback}
                className={cn(
                  'w-full flex items-center gap-4 p-4 lg:p-5 rounded-2xl border-2 text-left transition-all group',
                  !showFeedback && !isSelected && (isDark
                    ? 'border-white/10 bg-white/[0.02] hover:border-white/20 hover:bg-white/[0.05]'
                    : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'),
                  !showFeedback && isSelected && 'border-blue-500/50 bg-blue-500/10',
                  showCorrect && 'border-emerald-500/50 bg-emerald-500/10',
                  showWrong && 'border-red-500/50 bg-red-500/10'
                )}
              >
                {/* Option letter */}
                <span
                  className={cn(
                    'w-10 h-10 rounded-xl flex items-center justify-center font-semibold text-sm transition-all shrink-0',
                    !showFeedback && !isSelected && (isDark
                      ? 'bg-white/10 text-white/70 group-hover:bg-white/20'
                      : 'bg-slate-100 text-slate-600 group-hover:bg-slate-200'),
                    !showFeedback && isSelected && 'bg-blue-500 text-white',
                    showCorrect && 'bg-emerald-500 text-white',
                    showWrong && 'bg-red-500 text-white'
                  )}
                >
                  {showCorrect ? <CheckCircle className="w-5 h-5" /> :
                   showWrong ? '✕' : letterIndex}
                </span>

                {/* Option text */}
                <span className={cn(
                  'flex-1 text-base lg:text-lg',
                  !showFeedback && !isSelected && (isDark ? 'text-white/80' : 'text-slate-700'),
                  !showFeedback && isSelected && (isDark ? 'text-white' : 'text-blue-700'),
                  showCorrect && (isDark ? 'text-emerald-300' : 'text-emerald-700'),
                  showWrong && (isDark ? 'text-red-300' : 'text-red-700')
                )}>
                  {option.text}
                </span>

                {/* Selection indicator */}
                {!showFeedback && (
                  <span className={cn(
                    'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all shrink-0',
                    isSelected ? 'border-blue-500 bg-blue-500' : 'border-white/20'
                  )}>
                    {isSelected && <CheckCircle className="w-4 h-4 text-white" />}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      )}

      {/* True/False */}
      {questionType === 'true_false' && (
        <div className="flex gap-4">
          {['True', 'False'].map((option) => {
            const isSelected = selectedAnswer?.toLowerCase() === option.toLowerCase();
            const showCorrect = showFeedback && correctAnswer?.toLowerCase() === option.toLowerCase();
            const showWrong = showFeedback && isSelected && correctAnswer?.toLowerCase() !== option.toLowerCase();

            return (
              <button
                key={option}
                onClick={() => !showFeedback && onAnswerSelect(option.toLowerCase())}
                disabled={showFeedback}
                className={cn(
                  'flex-1 py-5 rounded-2xl font-semibold text-lg border-2 transition-all',
                  !showFeedback && !isSelected && (isDark
                    ? 'border-white/10 bg-white/[0.02] text-white/70 hover:border-white/20 hover:bg-white/[0.05]'
                    : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'),
                  !showFeedback && isSelected && (isDark ? 'border-blue-500/50 bg-blue-500/10 text-blue-400' : 'border-blue-500 bg-blue-50 text-blue-700'),
                  showCorrect && (isDark ? 'border-emerald-500/50 bg-emerald-500/10 text-emerald-400' : 'border-emerald-500 bg-emerald-50 text-emerald-700'),
                  showWrong && (isDark ? 'border-red-500/50 bg-red-500/10 text-red-400' : 'border-red-500 bg-red-50 text-red-700')
                )}
              >
                {option}
              </button>
            );
          })}
        </div>
      )}

      {/* Short Answer / Direct Answer */}
      {(questionType === 'short_answer' || questionType === 'direct_answer') && (
        <div className="relative">
          <input
            type="text"
            value={selectedAnswer || ''}
            onChange={(e) => onAnswerSelect(e.target.value)}
            disabled={showFeedback}
            placeholder="Type your answer here..."
            className={cn(
              'w-full px-5 py-4 rounded-2xl border-2 text-lg',
              isDark
                ? 'bg-white/[0.02] text-white placeholder:text-white/30'
                : 'bg-white text-slate-900 placeholder:text-slate-400',
              'focus:outline-none transition-all',
              !showFeedback && (isDark
                ? 'border-white/10 focus:border-blue-500/50 focus:bg-white/[0.05]'
                : 'border-slate-200 focus:border-blue-500 focus:bg-slate-50'),
              showFeedback && isCorrect && 'border-emerald-500/50 bg-emerald-500/10',
              showFeedback && !isCorrect && 'border-red-500/50 bg-red-500/10'
            )}
          />
          {showFeedback && (
            <span className={cn(
              'absolute right-4 top-1/2 -translate-y-1/2',
              isCorrect ? 'text-emerald-400' : 'text-red-400'
            )}>
              {isCorrect ? <CheckCircle className="w-6 h-6" /> : '✕'}
            </span>
          )}
        </div>
      )}

      {/* Essay */}
      {questionType === 'essay' && (
        <textarea
          value={selectedAnswer || ''}
          onChange={(e) => onAnswerSelect(e.target.value)}
          disabled={showFeedback}
          placeholder="Write your essay answer here..."
          rows={8}
          className={cn(
            'w-full px-5 py-4 rounded-2xl border-2 text-base',
            isDark
              ? 'bg-white/[0.02] text-white placeholder:text-white/30'
              : 'bg-white text-slate-900 placeholder:text-slate-400',
            'focus:outline-none transition-all resize-none',
            !showFeedback && (isDark
              ? 'border-white/10 focus:border-blue-500/50 focus:bg-white/[0.05]'
              : 'border-slate-200 focus:border-blue-500 focus:bg-slate-50')
          )}
        />
      )}

      {/* Feedback / Explanation */}
      {showFeedback && explanation && (
        <div className={cn(
          'mt-6 p-5 rounded-2xl border',
          isCorrect
            ? 'bg-emerald-500/5 border-emerald-500/20'
            : 'bg-amber-500/5 border-amber-500/20'
        )}>
          <div className="flex items-start gap-3">
            <HelpCircle className={cn(
              'w-5 h-5 mt-0.5 shrink-0',
              isCorrect ? 'text-emerald-400' : 'text-amber-400'
            )} />
            <div>
              <p className={cn("font-medium mb-1", isDark ? "text-white" : "text-slate-900")}>
                {isCorrect ? 'Correct!' : 'Explanation'}
              </p>
              <p className={cn("text-sm leading-relaxed", isDark ? "text-white/70" : "text-slate-600")}>
                {explanation}
              </p>
              {!isCorrect && correctAnswer && (
                <p className="mt-2 text-sm">
                  <span className={isDark ? "text-white/50" : "text-slate-500"}>Correct answer: </span>
                  <span className="text-emerald-500 font-medium">{correctAnswer}</span>
                </p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
