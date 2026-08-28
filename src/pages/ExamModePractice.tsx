import { useState, useEffect, useCallback, useRef } from "react";
import type { ComponentProps } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { AlertCircle, Loader2 } from "lucide-react";
import { ExamLayout, ExamQuestionCard } from "@/components/exam";
import {
  DailyUsageIndicator,
  LimitReachedModal,
} from "@/components/subscription";
import { api } from "@/lib/api";
import { getQuestionBankError } from "@/lib/subjectAvailability";
import { useExamStore } from "@/stores/examStore";
import { useThemeStore } from "@/stores/themeStore";
import { useUsageStore } from "@/stores/usageStore";
import { cn } from "@/utils";
import type { Question } from "@/types";

interface ApiQuestion {
  id: string;
  topic_id: string | null;
  subject_id: string;
  question_text: string;
  question_type: string;
  round_type: string;
  options: Array<{ id: string; text: string }> | null;
  correct_answer?: string;
  explanation?: string | null;
  difficulty: string;
  points: number;
  marks: number;
  time_limit: number;
  image_url: string | null;
}

const transformQuestion = (q: ApiQuestion): Question => ({
  id: q.id,
  topicId: q.topic_id || "",
  subjectId: q.subject_id,
  questionText: q.question_text,
  questionType: q.question_type as Question["questionType"],
  roundType: q.round_type as Question["roundType"],
  options: q.options as Question["options"],
  correctAnswer: q.correct_answer || "",
  explanation: q.explanation || undefined,
  difficulty: q.difficulty as Question["difficulty"],
  points: q.points,
  marks: q.marks,
  timeLimit: q.time_limit,
  imageUrl: q.image_url || undefined,
  createdAt: new Date().toISOString(),
});

interface PracticeResult {
  attemptId: string;
  questionId: string;
  isCorrect: boolean;
  answer: string;
  timeTaken: number;
}

interface PendingAttemptRequest {
  questionId: string;
  answer: string;
  timeTaken: number;
  clientRequestId: string;
}

export default function ExamModePractice() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const location = useLocation();
  const { currentExamType } = useExamStore();
  const { resolvedTheme } = useThemeStore();
  const isDark = resolvedTheme === "dark";

  // Freemium usage tracking
  const {
    dailyUsage,
    fetchDailyUsage,
    setUsageFromResponse,
    checkLimitReached,
  } = useUsageStore();
  const [showLimitModal, setShowLimitModal] = useState(false);

  // Get params from URL or state
  const mode = searchParams.get("mode") || "drill"; // drill, speed
  const topic = searchParams.get("topic") || "";
  const subject = searchParams.get("subject") || "all";
  const difficulty = searchParams.get("difficulty") || "all";
  const count = parseInt(searchParams.get("count") || "10", 10);
  const passedQuestions = (location.state as { questions?: Question[] })
    ?.questions;

  const [questions, setQuestions] = useState<Question[]>(passedQuestions || []);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [answeredSet, setAnsweredSet] = useState<Set<string>>(new Set());
  const [markedForReview, setMarkedForReview] = useState<Set<string>>(
    new Set(),
  );
  const [results, setResults] = useState<PracticeResult[]>([]);
  const [isLoading, setIsLoading] = useState(!passedQuestions);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isAnswerSubmitting, setIsAnswerSubmitting] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);
  const [attemptError, setAttemptError] = useState<string | null>(null);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [startTime] = useState(Date.now());
  const [questionStartTime, setQuestionStartTime] = useState(Date.now());
  const [clientRequestId] = useState(() => crypto.randomUUID());
  const pendingAttemptRequests = useRef<Record<string, PendingAttemptRequest>>(
    {},
  );

  // Fetch daily usage on mount
  useEffect(() => {
    fetchDailyUsage();
  }, [fetchDailyUsage]);

  // Check if limit is already reached before starting
  useEffect(() => {
    if (dailyUsage && checkLimitReached()) {
      setShowLimitModal(true);
    }
  }, [dailyUsage, checkLimitReached]);

  // Fetch questions if not passed
  useEffect(() => {
    if (passedQuestions) return;

    const fetchQuestions = async () => {
      setIsLoading(true);
      setError(null);
      try {
        let url = `/questions?limit=${count}`;
        if (mode === "speed") {
          url += "&round=speed_race";
        }
        if (topic) {
          url += `&topic=${topic}`;
        }
        if (subject !== "all") {
          url += `&subject=${subject}`;
        }
        if (difficulty !== "all") {
          url += `&difficulty=${difficulty}`;
        }

        const res = await api.get<ApiQuestion[]>(url);
        const data = res.success ? res.data : null;

        if (data && Array.isArray(data) && data.length > 0) {
          setQuestions(data.map(transformQuestion));
        } else {
          setError(
            getQuestionBankError(res, "No questions found for this topic."),
          );
        }
      } catch (err) {
        console.error("Failed to load questions:", err);
        setError(
          `Failed to load questions: ${err instanceof Error ? err.message : "Unknown error"}`,
        );
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [passedQuestions, mode, topic, subject, difficulty, count, navigate]);

  const currentQuestion = questions[currentIndex];
  const totalQuestions = questions.length;

  const handleAnswerSelect = useCallback(
    async (answer: string) => {
      if (!currentQuestion || showFeedback || isAnswerSubmitting) return;

      const existingRequest =
        pendingAttemptRequests.current[currentQuestion.id];
      const pendingRequest =
        existingRequest?.answer === answer
          ? existingRequest
          : {
              questionId: currentQuestion.id,
              answer,
              timeTaken: Math.floor((Date.now() - questionStartTime) / 1000),
              clientRequestId: crypto.randomUUID(),
            };
      pendingAttemptRequests.current[currentQuestion.id] = pendingRequest;

      setAttemptError(null);
      setIsAnswerSubmitting(true);
      setAnswers((prev) => ({
        ...prev,
        [currentQuestion.id]: pendingRequest.answer,
      }));

      try {
        // Submit answer to API (tracks usage for freemium)
        // Note: userId is taken from JWT on the server side
        const response = await api.post<{
          attemptId: string;
          isCorrect: boolean;
          correctAnswer: string;
          explanation: string;
          pointsEarned: number;
          usage?: {
            used: number;
            limit: number;
            remaining: number;
            isUnlimited: boolean;
            showUpgradePrompt: boolean;
          };
        }>(`/questions/${currentQuestion.id}/attempt`, {
          answer: pendingRequest.answer,
          timeTaken: pendingRequest.timeTaken,
          clientRequestId: pendingRequest.clientRequestId,
        });

        if (!response.success || !response.data) {
          if (response.code === "LIMIT_REACHED") {
            setShowLimitModal(true);
            return;
          }

          setAttemptError(
            response.error ||
              "Your answer could not be submitted. Please try again.",
          );
          return;
        }

        if (response.success && response.data) {
          const { attemptId, isCorrect, correctAnswer, explanation, usage } =
            response.data;

          setQuestions((current) =>
            current.map((question) =>
              question.id === currentQuestion.id
                ? { ...question, correctAnswer, explanation }
                : question,
            ),
          );
          setAnsweredSet((prev) => new Set([...prev, currentQuestion.id]));

          // Update local usage from API response
          if (usage) {
            setUsageFromResponse(usage);

            // Show warning toast when approaching limit
            if (usage.showUpgradePrompt && !usage.isUnlimited) {
              // Could show a toast here
            }

            // Show modal if limit reached
            if (usage.remaining <= 0 && !usage.isUnlimited) {
              setShowLimitModal(true);
            }
          }

          setResults((prev) => [
            ...prev.filter((r) => r.questionId !== currentQuestion.id),
            {
              attemptId,
              questionId: currentQuestion.id,
              isCorrect,
              answer: pendingRequest.answer,
              timeTaken: pendingRequest.timeTaken,
            },
          ]);
          delete pendingAttemptRequests.current[currentQuestion.id];
          // For drill mode, show immediate feedback
          if (mode === "drill") {
            setShowFeedback(true);
          }
        }
      } catch (error) {
        console.error("Failed to submit answer:", error);
        setAttemptError(
          "Your answer could not be submitted. Please retry before continuing.",
        );
      } finally {
        setIsAnswerSubmitting(false);
      }
    },
    [
      currentQuestion,
      questionStartTime,
      showFeedback,
      isAnswerSubmitting,
      mode,
      setUsageFromResponse,
    ],
  );

  const handleNext = useCallback(() => {
    if (currentIndex < totalQuestions - 1) {
      setCurrentIndex((prev) => prev + 1);
      setQuestionStartTime(Date.now());
      setShowFeedback(false);
      setAttemptError(null);
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
    if (isSubmitting) return;

    setIsSubmitting(true);
    setSubmitError(null);
    const totalTime = Math.floor((Date.now() - startTime) / 1000);
    const correctCount = results.filter((r) => r.isCorrect).length;
    const score = results.reduce((acc, r) => {
      const q = questions.find((q) => q.id === r.questionId);
      return acc + (r.isCorrect ? q?.points || 1 : 0);
    }, 0);

    try {
      // Save session to API
      const response = await api.post<{ id: string }>("/practice/sessions", {
        mode: mode === "speed" ? "speed_race" : "topic_drill",
        subjectId: subject !== "all" ? subject : null,
        topicId: topic || null,
        clientRequestId,
        attemptIds: results.map((result) => result.attemptId),
      });

      if (!response.success || !response.data?.id) {
        setSubmitError(
          response.error ||
            "Your completed practice session could not be saved.",
        );
        return;
      }

      // Navigate only after the Worker confirms persistence.
      navigate("/practice/results", {
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
    } catch (error) {
      console.error("Failed to save session:", error);
      setSubmitError("Your completed practice session could not be saved.");
    } finally {
      setIsSubmitting(false);
    }
  }, [
    isSubmitting,
    startTime,
    results,
    questions,
    mode,
    subject,
    topic,
    totalQuestions,
    navigate,
    clientRequestId,
  ]);

  const handleExit = useCallback(() => {
    navigate("/practice");
  }, [navigate]);

  if (isLoading) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300",
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-slate-100 via-white to-slate-100",
        )}
      >
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-purple-500 animate-spin mx-auto mb-4" />
          <p className={isDark ? "text-white/70" : "text-slate-600"}>
            Loading questions...
          </p>
          <p
            className={cn(
              "text-sm mt-2",
              isDark ? "text-white/50" : "text-slate-400",
            )}
          >
            Topic: {topic || "all"} | Mode: {mode}
          </p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300",
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-slate-100 via-white to-slate-100",
        )}
      >
        <div className="text-center max-w-md p-6">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h2
            className={cn(
              "text-xl font-bold mb-2",
              isDark ? "text-white" : "text-slate-900",
            )}
          >
            Error Loading Questions
          </h2>
          <p
            className={cn(
              "mb-4 text-sm",
              isDark ? "text-white/70" : "text-slate-600",
            )}
          >
            {error}
          </p>
          <div className="flex gap-2 justify-center">
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
            >
              Retry
            </button>
            <button
              onClick={() => navigate("/practice")}
              className="px-4 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700"
            >
              Go Back
            </button>
          </div>
        </div>
      </div>
    );
  }

  if (!currentQuestion) {
    return (
      <div
        className={cn(
          "fixed inset-0 z-50 flex items-center justify-center transition-colors duration-300",
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-slate-100 via-white to-slate-100",
        )}
      >
        <div className="text-center">
          <p className={isDark ? "text-white/70" : "text-slate-600"}>
            No questions available
          </p>
          <p
            className={cn(
              "text-sm mt-2",
              isDark ? "text-white/50" : "text-slate-400",
            )}
          >
            Topic: {topic || "none"} | Questions loaded: {questions.length}
          </p>
          <button
            onClick={() => navigate("/practice")}
            className="mt-4 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700"
          >
            Go Back
          </button>
        </div>
      </div>
    );
  }

  // Map question ID to index-based ID for the layout
  const answeredByIndex = new Set(
    Array.from(answeredSet).map((id) => {
      const idx = questions.findIndex((q) => q.id === id);
      return `q_${idx}`;
    }),
  );

  const markedByIndex = new Set(
    Array.from(markedForReview).map((id) => {
      const idx = questions.findIndex((q) => q.id === id);
      return `q_${idx}`;
    }),
  );

  const currentResult = results.find(
    (r) => r.questionId === currentQuestion.id,
  );

  return (
    <ExamLayout
      title={mode === "speed" ? "Speed Race" : "Topic Drill"}
      subtitle={`${currentExamType.toUpperCase()} Practice`}
      totalQuestions={totalQuestions}
      currentQuestion={currentIndex + 1}
      answeredQuestions={answeredByIndex}
      markedForReview={markedByIndex}
      timeLimit={mode === "speed" ? count * 10 : 0} // 10 seconds per question in speed mode
      onExit={handleExit}
      onSubmit={handleSubmit}
      onPrevious={handlePrevious}
      onNext={showFeedback || mode === "speed" ? handleNext : undefined}
      onMarkForReview={handleMarkForReview}
      onQuestionSelect={handleQuestionSelect}
      isSubmitting={isSubmitting}
      isNextDisabled={isAnswerSubmitting || (mode !== "speed" && !showFeedback)}
      examType={mode === "speed" ? "speed" : "practice"}
    >
      <ExamQuestionCard
        questionNumber={currentIndex + 1}
        questionText={currentQuestion.questionText}
        questionType={
          currentQuestion.questionType as ComponentProps<
            typeof ExamQuestionCard
          >["questionType"]
        }
        options={currentQuestion.options?.map((opt, i) => ({
          id: typeof opt === "string" ? String.fromCharCode(65 + i) : opt.id,
          text: typeof opt === "string" ? opt : opt.text,
          isCorrect:
            Boolean(currentQuestion.correctAnswer) &&
            ((typeof opt === "string"
              ? String.fromCharCode(65 + i)
              : opt.id
            ).toLowerCase() === currentQuestion.correctAnswer.toLowerCase() ||
              (typeof opt === "string" ? opt : opt.text).toLowerCase() ===
                currentQuestion.correctAnswer.toLowerCase()),
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
        timeLimit={
          mode === "speed" ? currentQuestion.timeLimit || 10 : undefined
        }
        onTimeUp={mode === "speed" ? handleNext : undefined}
        isSubmitting={isAnswerSubmitting}
      />

      {isAnswerSubmitting && (
        <div
          role="status"
          className={cn(
            "mx-6 mb-6 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm lg:mx-8",
            isDark
              ? "border-blue-400/20 bg-blue-400/10 text-blue-200"
              : "border-blue-200 bg-blue-50 text-blue-800",
          )}
        >
          <Loader2 aria-hidden="true" className="h-4 w-4 animate-spin" />
          Checking your answer…
        </div>
      )}

      {attemptError && !isAnswerSubmitting && (
        <div
          role="alert"
          className={cn(
            "mx-6 mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm lg:mx-8",
            isDark
              ? "border-red-400/20 bg-red-400/10 text-red-200"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <span>{attemptError} Your selection has been kept.</span>
            <button
              type="button"
              onClick={() => {
                const selectedAnswer = answers[currentQuestion.id];
                if (selectedAnswer) void handleAnswerSelect(selectedAnswer);
              }}
              disabled={!answers[currentQuestion.id]}
              className="rounded-lg border border-current/20 px-3 py-1.5 font-semibold transition-colors hover:bg-current/10 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Retry submission
            </button>
          </div>
        </div>
      )}

      {submitError && !isSubmitting && (
        <div
          role="alert"
          className={cn(
            "mx-6 mb-6 flex items-start gap-2 rounded-xl border px-4 py-3 text-sm lg:mx-8",
            isDark
              ? "border-red-400/20 bg-red-400/10 text-red-200"
              : "border-red-200 bg-red-50 text-red-800",
          )}
        >
          <AlertCircle aria-hidden="true" className="mt-0.5 h-4 w-4 shrink-0" />
          <div className="flex flex-1 flex-wrap items-center justify-between gap-3">
            <span>{submitError} Your completed answers are still here.</span>
            <button
              type="button"
              onClick={() => void handleSubmit()}
              className="rounded-lg border border-current/20 px-3 py-1.5 font-semibold transition-colors hover:bg-current/10"
            >
              Retry session save
            </button>
          </div>
        </div>
      )}

      {/* Daily usage indicator (for free users) */}
      {dailyUsage && !dailyUsage.isUnlimited && (
        <div className="fixed bottom-4 right-4 z-40">
          <DailyUsageIndicator variant="compact" />
        </div>
      )}

      {/* Limit reached modal */}
      <LimitReachedModal
        isOpen={showLimitModal}
        onClose={() => {
          setShowLimitModal(false);
          // If limit reached, navigate back to practice selection
          if (checkLimitReached()) {
            navigate("/practice");
          }
        }}
      />
    </ExamLayout>
  );
}
