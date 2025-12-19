import { useState, useEffect, useCallback } from 'react';
import { Zap, Clock } from 'lucide-react';
import type { Question } from '@/types';
import { Card, Button, Badge, ProgressBar } from '@/components/common';
import { MathText } from '@/components/questions';
import { cn } from '@/utils';
import { SCORING } from '@/types';

interface SpeedRaceProps {
  questions: Question[];
  onComplete?: (results: SpeedRaceResults) => void;
  onExit?: () => void;
}

interface SpeedRaceResults {
  questionsAttempted: number;
  correctAnswers: number;
  avgTime: number;
  score: number;
  fastestAnswer: number;
}

export function SpeedRace({
  questions,
  onComplete,
  onExit,
}: SpeedRaceProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [userAnswer, setUserAnswer] = useState('');
  const [timeRemaining, setTimeRemaining] = useState(10);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);
  const [score, setScore] = useState(0);
  const [correctCount, setCorrectCount] = useState(0);
  const [times, setTimes] = useState<number[]>([]);
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [isComplete, setIsComplete] = useState(false);
  const [showResult, setShowResult] = useState(false);

  const currentQuestion = questions[currentIndex];

  // Timer
  useEffect(() => {
    if (isAnswered || isComplete) return;

    const interval = setInterval(() => {
      setTimeRemaining((prev) => {
        if (prev <= 1) {
          handleTimeUp();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [currentIndex, isAnswered, isComplete]);

  const handleTimeUp = useCallback(() => {
    if (isAnswered) return;

    setIsAnswered(true);
    setIsCorrect(false);
    setShowResult(true);
    setScore((prev) => prev + SCORING.ROUND_TWO.WRONG);
    setTimes((prev) => [...prev, 10]);
  }, [isAnswered]);

  const handleSubmit = () => {
    if (!userAnswer.trim() || isAnswered) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const correct =
      userAnswer.toLowerCase().trim() ===
      currentQuestion.correctAnswer.toLowerCase().trim();

    setIsAnswered(true);
    setIsCorrect(correct);
    setShowResult(true);
    setTimes((prev) => [...prev, timeTaken]);

    if (correct) {
      setCorrectCount((prev) => prev + 1);
      setScore((prev) => prev + SCORING.ROUND_TWO.FIRST);
    } else {
      setScore((prev) => prev + SCORING.ROUND_TWO.WRONG);
    }
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex((prev) => prev + 1);
      setUserAnswer('');
      setTimeRemaining(10);
      setIsAnswered(false);
      setIsCorrect(false);
      setShowResult(false);
      setQuestionStartTime(Date.now());
    } else {
      completeRace();
    }
  };

  const completeRace = () => {
    const avgTime = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;
    const fastestAnswer = times.length > 0 ? Math.min(...times) : 0;

    setIsComplete(true);
    onComplete?.({
      questionsAttempted: questions.length,
      correctAnswers: correctCount,
      avgTime,
      score,
      fastestAnswer,
    });
  };

  if (isComplete) {
    const avgTime = times.length > 0
      ? Math.round(times.reduce((a, b) => a + b, 0) / times.length)
      : 0;

    return (
      <Card className="p-8 text-center max-w-md mx-auto">
        <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-yellow-100 flex items-center justify-center">
          <Zap className="w-8 h-8 text-yellow-600" />
        </div>

        <h2 className="text-2xl font-bold text-neutral-900 mb-2">
          Speed Race Complete!
        </h2>

        <div className="grid grid-cols-2 gap-4 my-6">
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">Score</p>
            <p className="text-2xl font-bold text-primary">{score}</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">Correct</p>
            <p className="text-2xl font-bold text-green-600">
              {correctCount}/{questions.length}
            </p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">Avg Time</p>
            <p className="text-2xl font-bold text-neutral-900">{avgTime}s</p>
          </div>
          <div className="p-4 bg-neutral-50 rounded-lg">
            <p className="text-sm text-neutral-500">Fastest</p>
            <p className="text-2xl font-bold text-yellow-600">
              {Math.min(...times)}s
            </p>
          </div>
        </div>

        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={() => {
              setCurrentIndex(0);
              setUserAnswer('');
              setTimeRemaining(10);
              setIsAnswered(false);
              setScore(0);
              setCorrectCount(0);
              setTimes([]);
              setIsComplete(false);
              setShowResult(false);
              setQuestionStartTime(Date.now());
            }}
            fullWidth
          >
            Try Again
          </Button>
          {onExit && (
            <Button onClick={onExit} fullWidth>
              Exit
            </Button>
          )}
        </div>
      </Card>
    );
  }

  const timerColor = timeRemaining <= 3 ? 'text-red-600' : timeRemaining <= 5 ? 'text-yellow-600' : 'text-primary';

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Zap className="w-5 h-5 text-yellow-500" />
          <span className="font-semibold">Speed Race</span>
          <Badge variant="neutral">
            {currentIndex + 1}/{questions.length}
          </Badge>
        </div>
        <div className="flex items-center gap-4">
          <Badge variant="primary">Score: {score}</Badge>
          <Badge variant="success">{correctCount} correct</Badge>
        </div>
      </div>

      {/* Progress */}
      <ProgressBar
        value={((currentIndex + 1) / questions.length) * 100}
        variant="secondary"
      />

      {/* Timer */}
      <div className="text-center">
        <div className={cn(
          'inline-flex items-center gap-2 px-6 py-3 rounded-full bg-neutral-100',
          timeRemaining <= 3 && 'animate-pulse bg-red-100'
        )}>
          <Clock className={cn('w-6 h-6', timerColor)} />
          <span className={cn('text-4xl font-bold font-display tabular-nums', timerColor)}>
            {timeRemaining}
          </span>
        </div>
      </div>

      {/* Question */}
      <Card className="p-6">
        <h3 className="text-xl font-semibold text-neutral-900 mb-6 text-center">
          <MathText text={currentQuestion.questionText} />
        </h3>

        {!showResult ? (
          <div className="max-w-md mx-auto space-y-4">
            <input
              type="text"
              value={userAnswer}
              onChange={(e) => setUserAnswer(e.target.value)}
              placeholder="Type your answer..."
              className="w-full px-4 py-3 text-lg text-center rounded-lg border-2 border-neutral-300 focus:border-primary focus:ring-2 focus:ring-primary/20"
              onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
              autoFocus
            />
            <Button onClick={handleSubmit} fullWidth disabled={!userAnswer.trim()}>
              Submit
            </Button>
          </div>
        ) : (
          <div className="text-center space-y-4">
            <div className={cn(
              'p-4 rounded-lg',
              isCorrect ? 'bg-green-50' : 'bg-red-50'
            )}>
              <p className={cn(
                'text-lg font-semibold',
                isCorrect ? 'text-green-800' : 'text-red-800'
              )}>
                {isCorrect ? 'Correct!' : 'Incorrect'}
                {isCorrect && ` +${SCORING.ROUND_TWO.FIRST} points`}
                {!isCorrect && ` ${SCORING.ROUND_TWO.WRONG} points`}
              </p>
              {!isCorrect && (
                <p className="mt-2 text-neutral-600">
                  Correct answer: <span className="font-medium text-green-800">
                    <MathText text={currentQuestion.correctAnswer} />
                  </span>
                </p>
              )}
            </div>
            <Button onClick={handleNext}>
              {currentIndex < questions.length - 1 ? 'Next Question' : 'See Results'}
            </Button>
          </div>
        )}
      </Card>
    </div>
  );
}
