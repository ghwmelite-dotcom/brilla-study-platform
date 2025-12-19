import { useState, useEffect, useCallback } from 'react';
import { ArrowRight, RotateCcw, Trophy, Target } from 'lucide-react';
import type { Question } from '@/types';
import { QuestionCard } from '@/components/questions';
import { Button, Card, ProgressBar, Badge } from '@/components/common';
import { cn, formatTime, calculateAccuracy } from '@/utils';
import { useQuizStore } from '@/stores';

interface TopicDrillProps {
  questions: Question[];
  topicName: string;
  onComplete?: (results: DrillResults) => void;
  onExit?: () => void;
}

interface DrillResults {
  questionsAttempted: number;
  correctAnswers: number;
  accuracy: number;
  totalTime: number;
  score: number;
  answers: { questionId: string; isCorrect: boolean; timeTaken: number }[];
}

export function TopicDrill({
  questions,
  topicName,
  onComplete,
  onExit,
}: TopicDrillProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [isAnswerRevealed, setIsAnswerRevealed] = useState(false);
  const [results, setResults] = useState<DrillResults['answers']>([]);
  const [score, setScore] = useState(0);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);

  const {
    timeRemaining,
    isTimerRunning,
    startTimer,
    decrementTimer,
  } = useQuizStore();

  const currentQuestion = questions[currentIndex];
  const progress = ((currentIndex + 1) / questions.length) * 100;
  const correctCount = results.filter((r) => r.isCorrect).length;

  useEffect(() => {
    if (currentQuestion) {
      startTimer(currentQuestion.timeLimit);
      setQuestionStartTime(Date.now());
    }
  }, [currentIndex, currentQuestion, startTimer]);

  const handleAnswer = useCallback((answer: string) => {
    if (isAnswerRevealed) return;

    setSelectedAnswer(answer);
    setIsAnswerRevealed(true);

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect =
      answer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();

    const pointsEarned = isCorrect ? currentQuestion.points : 0;
    setScore((prev) => prev + pointsEarned);

    setResults((prev) => [
      ...prev,
      {
        questionId: currentQuestion.id,
        isCorrect,
        timeTaken,
      },
    ]);
  }, [currentQuestion, isAnswerRevealed, questionStartTime]);

  const handleTimeUp = useCallback(() => {
    if (!isAnswerRevealed) {
      handleAnswer(''); // Auto-submit empty answer on timeout
    }
  }, [handleAnswer, isAnswerRevealed]);

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerRevealed(false);
    } else {
      completeQuiz();
    }
  };

  const completeQuiz = () => {
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const finalResults: DrillResults = {
      questionsAttempted: questions.length,
      correctAnswers: correctCount + (results.length === currentIndex ? 0 : 1),
      accuracy: calculateAccuracy(correctCount, results.length),
      totalTime,
      score,
      answers: results,
    };

    setIsComplete(true);
    onComplete?.(finalResults);
  };

  if (isComplete) {
    return (
      <DrillComplete
        results={{
          questionsAttempted: questions.length,
          correctAnswers: correctCount,
          accuracy: calculateAccuracy(correctCount, questions.length),
          totalTime: Math.floor((Date.now() - startTime) / 1000),
          score,
          answers: results,
        }}
        topicName={topicName}
        onRetry={() => {
          setCurrentIndex(0);
          setSelectedAnswer(null);
          setIsAnswerRevealed(false);
          setResults([]);
          setScore(0);
          setIsComplete(false);
        }}
        onExit={onExit}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-neutral-900">{topicName}</h2>
          <p className="text-neutral-500">Topic Drill</p>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="primary">
            Score: {score}
          </Badge>
          <Badge variant="success">
            {correctCount}/{results.length} correct
          </Badge>
        </div>
      </div>

      {/* Progress */}
      <div className="space-y-2">
        <div className="flex justify-between text-sm text-neutral-500">
          <span>Question {currentIndex + 1} of {questions.length}</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <ProgressBar value={progress} variant="primary" />
      </div>

      {/* Question */}
      <QuestionCard
        question={currentQuestion}
        questionNumber={currentIndex + 1}
        totalQuestions={questions.length}
        showTimer
        timeRemaining={timeRemaining}
        isTimerRunning={isTimerRunning && !isAnswerRevealed}
        onTimerTick={decrementTimer}
        onTimeUp={handleTimeUp}
        selectedAnswer={selectedAnswer}
        isAnswerRevealed={isAnswerRevealed}
        onAnswer={handleAnswer}
      />

      {/* Navigation */}
      {isAnswerRevealed && (
        <div className="flex justify-end">
          <Button onClick={handleNext} rightIcon={<ArrowRight className="w-4 h-4" />}>
            {currentIndex < questions.length - 1 ? 'Next Question' : 'Finish'}
          </Button>
        </div>
      )}
    </div>
  );
}

// Drill Complete Component
interface DrillCompleteProps {
  results: DrillResults;
  topicName: string;
  onRetry: () => void;
  onExit?: () => void;
}

function DrillComplete({ results, topicName, onRetry, onExit }: DrillCompleteProps) {
  const accuracyColor = results.accuracy >= 80 ? 'text-green-600' :
                        results.accuracy >= 60 ? 'text-yellow-600' : 'text-red-600';

  return (
    <Card className="p-8 text-center max-w-md mx-auto">
      <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-primary-100 flex items-center justify-center">
        <Trophy className="w-8 h-8 text-primary" />
      </div>

      <h2 className="text-2xl font-bold text-neutral-900 mb-2">
        Drill Complete!
      </h2>
      <p className="text-neutral-500 mb-6">{topicName}</p>

      <div className="grid grid-cols-2 gap-4 mb-6">
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-500">Score</p>
          <p className="text-2xl font-bold text-primary">{results.score}</p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-500">Accuracy</p>
          <p className={cn('text-2xl font-bold', accuracyColor)}>
            {results.accuracy}%
          </p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-500">Correct</p>
          <p className="text-2xl font-bold text-green-600">
            {results.correctAnswers}/{results.questionsAttempted}
          </p>
        </div>
        <div className="p-4 bg-neutral-50 rounded-lg">
          <p className="text-sm text-neutral-500">Time</p>
          <p className="text-2xl font-bold text-neutral-900">
            {formatTime(results.totalTime)}
          </p>
        </div>
      </div>

      <div className="flex gap-3">
        <Button variant="outline" onClick={onRetry} fullWidth leftIcon={<RotateCcw className="w-4 h-4" />}>
          Try Again
        </Button>
        {onExit && (
          <Button onClick={onExit} fullWidth leftIcon={<Target className="w-4 h-4" />}>
            Back to Topics
          </Button>
        )}
      </div>
    </Card>
  );
}
