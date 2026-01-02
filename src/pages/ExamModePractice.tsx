import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams, useLocation } from 'react-router-dom';
import { Loader2 } from 'lucide-react';
import { ExamLayout, ExamQuestionCard } from '@/components/exam';
import { api } from '@/services/api';
import { useExamStore, useThemeStore } from '@/stores';
import { cn } from '@/utils';
import type { Question } from '@/types';

interface ApiQuestion {
  id: string;
  topic_id: string | null;
  subject_id: string;
  question_text: string;
  question_type: string;
  round_type: string;
  options: Array<{ id: string; text: string }> | null;
  correct_answer: string;
  explanation: string | null;
  difficulty: string;
  points: number;
  marks: number;
  time_limit: number;
  image_url: string | null;
}

const transformQuestion = (q: ApiQuestion): Question => ({
  id: q.id,
  topicId: q.topic_id || '',
  subjectId: q.subject_id,
  questionText: q.question_text,
  questionType: q.question_type as Question['questionType'],
  roundType: q.round_type as Question['roundType'],
  options: q.options as Question['options'],
  correctAnswer: q.correct_answer,
  explanation: q.explanation || undefined,
  difficulty: q.difficulty as Question['difficulty'],
  points: q.points,
  marks: q.marks,
  timeLimit: q.time_limit,
  imageUrl: q.image_url || undefined,
  createdAt: new Date().toISOString(),
});

interface PracticeResult {
  questionId: string;
  isCorrect: boolean;
  answer: string;
  timeTaken: number;
}

export default function ExamModePractice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { currentExamType } = useExamStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === 'dark';

  // Get params from URL or state
  const mode = searchParams.get('mode') || 'drill'; // drill, speed
  const subject = searchParams.get('subject') || 'all';
  const difficulty = searchParams.get('difficulty') || 'all';
  const count = parseInt(searchParams.get('count') || '10', 10);
  const passedQuestions = (location.state as { questions?: Question[] })?.questions;

  const [questions, setQuestions] = useState<Question[]>(passedQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(new Set());
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [isLoading, setIsLoading] = useState(!passedQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());

  // Fetch questions if not passed
  useEffect(() => {
    if (passedQuestions) return;

    const fetchQuestions = async () => {
      setIsLoading(true);
      try {
        let url = `/questions?limit=${count}`;
        if (mode === 'speed') {
          url += '&round=speed_race';
        }
        if (subject !== 'all') {
          url += `&subject=${subject}`;
        }
        if (difficulty !== 'all') {
          url += `&difficulty=${difficulty}`;
        }

        const data = await api.get(url) as ApiQuestion[];
        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data.map(transformQuestion));
        } else {
          navigate('/practice', { replace: true });
        }
      } catch (error) {
        console.error('Failed to load questions:', error);
        navigate('/practice', { replace: true });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [passedQuestions, mode, subject, difficulty, count, navigate]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleAnswerSelect = useCallback((answer: string) => {
    if (!currentQuestion || showFeedback) return;

    const timeTaken = Math.floor((Date.now() - questionStartTime) / 1000);
    const isCorrect = answer.toLowerCase().trim() === currentQuestion.correctAnswer.toLowerCase().trim();

    setAnswers((prev) => ({ ...prev, [currentQuestion.id]: answer }));
    setAnsweredSet((prev) => new Set([...prev, currentQuestion.id]));

    setResults((prev) => [
      ...prev.filter(r => r.questionId !== currentQuestion.id),
      { questionId: currentQuestion.id, isCorrect, answer, timeTaken }
    ]);

    // For drill mode, show immediate feedback
    if (mode === 'drill') {
      setShowFeedback(true);
    }
  }, [currentQuestion, questionStartTime, showFeedback, mode]);

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
      setShowFeedback(false);
    }
  }, [currentIndex, totalQuestions]);

  const handlePrevious = useCallback(() => {
    if (currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
      setQuestionStartTime(Date.now());
      setShowFeedback(false);
    }
  }, [currentIndex]);

  const handleQuestionSelect = useCallback((index: number) => {
    setCurrentIndex(index);
    setQuestionStartTime(Date.now());
    setShowFeedback(false);
  }, []);

  const handleMarkForReview = useCallback(() => {
    if (!currentQuestion) return;
    setMarkedForReview((prev) => {
      const next = new Set(prev);
      if (next.has(currentQuestion.id)) {
        next.delete(currentQuestion.id);
      } else {
        next.add(currentQuestion.id);
      }
      return next;
    });
  }, [currentQuestion]);

  const handleSubmit = useCallback(async () => {
    setIsSubmitting(true);
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const correctCount = results.filter(r => r.isCorrect).length;
    const score = results.reduce((acc, r) => {
      const q = questions.find(q => q.id === r.questionId);
      return acc + (r.isCorrect ? (q?.points || 1) : 0);
    }, 0);

    try {
      // Save session to API
      await api.post('/practice/sessions', {
        mode: mode === 'speed' ? 'speed_race' : 'topic_drill',
        subject_id: subject !== 'all' ? subject : null,
        questions_count: totalQuestions,
        correct_count: correctCount,
        total_time: totalTime,
        score,
        answers: results,
      });
    } catch (error) {
      console.error('Failed to save session:', error);
    }

    // Navigate to results
    navigate('/practice/results', {
      state: {
        mode,
        totalQuestions,
        correctCount,
        totalTime,
        score,
        results,
        questions,
      },
    });
  }, [startTime, results, questions, mode, subject, totalQuestions, navigate]);

  const handleExit = useCallback(() => {
    navigate('/practice');
  }, [navigate]);

  if (isLoading) {
    return (
      <div className={cn(
        "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300",
        isDark
          ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
          : "bg-gradient-to-br from-slate-100 via-white to-slate-100"
      )}>
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={isDark ? "text-white/70" : "text-slate-600"}>Loading questions...</p>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return null;
  }

  // Map question ID to index-based ID for the layout
  const answeredByIndex = new Set(
    Array.from(answeredSet).map(id => {
      const idx = questions.findIndex(q => q.id === id);
      return `q_${idx}`;
    })
  );

  const markedByIndex = new Set(
    Array.from(markedForReview).map(id => {
      const idx = questions.findIndex(q => q.id === id);
      return `q_${idx}`;
    })
  );

  const currentResult = results.find(r => r.questionId === currentQuestion.id);

  return (
    <ExamLayout
      title={mode === 'speed' ? 'Speed Race' : 'Topic Drill'}
      subtitle={`${currentExamType.toUpperCase()} Practice`}
      totalQuestions={totalQuestions}
      currentQuestion={currentIndex + 1}
      answeredQuestions={answeredByIndex}
      markedForReview={markedByIndex}
      timeLimit={mode === 'speed' ? count * 10 : 0} // 10 seconds per question in speed mode
      onExit={handleExit}
      onSubmit={handleSubmit}
      onPrevious={handlePrevious}
      onNext={showFeedback || mode === 'speed' ? handleNext : undefined}
      onMarkForReview={handleMarkForReview}
      onQuestionSelect={handleQuestionSelect}
      isSubmitting={isSubmitting}
      examType={mode === 'speed' ? 'speed' : 'practice'}
    >
      <ExamQuestionCard
        questionNumber={currentIndex + 1}
        questionText={currentQuestion.questionText}
        questionType={currentQuestion.questionType as any}
        options={currentQuestion.options?.map((opt, i) => ({
          id: `opt_${i}`,
          text: typeof opt === 'string' ? opt : opt.text,
          isCorrect: (typeof opt === 'string' ? opt : opt.text).toLowerCase() === currentQuestion.correctAnswer.toLowerCase()
        }))}
        selectedAnswer={answers[currentQuestion.id]}
        onAnswerSelect={handleAnswerSelect}
        imageUrl={currentQuestion.imageUrl}
        marks={currentQuestion.marks || currentQuestion.points}
        difficulty={currentQuestion.difficulty}
        showFeedback={showFeedback}
        isCorrect={currentResult?.isCorrect}
        correctAnswer={currentQuestion.correctAnswer}
        explanation={currentQuestion.explanation}
        timeLimit={mode === 'speed' ? currentQuestion.timeLimit || 10 : undefined}
        onTimeUp={mode === 'speed' ? handleNext : undefined}
      />
    </ExamLayout>
  );
}
