import { useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  BookOpen,
  Brain,
  Sparkles,
  ChevronRight,
  Pause,
  SkipForward,
  CheckCircle2,
  Circle,
  Send,
  Loader2,
  Target,
  TrendingUp,
  ArrowLeft,
  HelpCircle,
  ChevronDown,
  Zap,
  Award,
  BarChart3,
  Presentation,
  MessageSquare,
  Mic,
  Focus,
  Clock,
  AlertTriangle,
  UserPlus,
  X,
  Calendar,
  RefreshCw,
  Trophy,
  Flame,
  Star,
  Timer,
  Lock,
} from 'lucide-react';
import { AIWhiteboardTeacher } from '@/components/whiteboard/AIWhiteboardTeacher';
import { VoiceConversation } from '@/components/voice/VoiceConversation';
import {
  useAuthStore,
  useExamStore,
  useRevisionClassroomStore,
} from '@/stores';
import type { ExamTypeSlug } from '@/types';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { subjects as examSubjects, examTypes } from '@/data/examData';
import type { TeachingPhase } from '@/stores/revisionClassroomStore';
import { GUIDANCE_EXAM_OPTIONS, getGuidanceSubjects } from '@/lib/guidanceExamCatalog';

// Beautiful AI Typing Indicator Component
function AITypingIndicator({ phase }: { phase?: TeachingPhase }) {
  const [dotIndex, setDotIndex] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setDotIndex((prev) => (prev + 1) % 4);
    }, 400);
    return () => clearInterval(interval);
  }, []);

  // Phase-specific messages
  const phaseMessages: Record<TeachingPhase, string> = {
    hook: 'Crafting an engaging hook',
    explain: 'Preparing explanation',
    check: 'Creating comprehension check',
    practice: 'Generating practice problem',
    confirm: 'Evaluating your response',
    connect: 'Finding connections',
  };

  const message = phase ? phaseMessages[phase] : 'Thinking';

  return (
    <div className="flex gap-3">
      {/* AI Avatar with animated gradient border */}
      <div className="relative flex-shrink-0">
        <div className="absolute inset-0 w-10 h-10 rounded-full bg-gradient-to-r from-violet-500 via-purple-500 to-fuchsia-500 animate-spin-slow opacity-75 blur-sm" />
        <div className="relative w-10 h-10 bg-gradient-to-br from-violet-600 to-purple-600 rounded-full flex items-center justify-center shadow-lg">
          <Brain className="w-5 h-5 text-white animate-pulse" />
        </div>
      </div>

      {/* Typing bubble */}
      <div className="relative">
        {/* Glow effect */}
        <div className="absolute inset-0 bg-gradient-to-r from-violet-500/20 to-purple-500/20 rounded-2xl blur-xl" />

        {/* Main bubble */}
        <div className="relative bg-gradient-to-br from-white to-violet-50/50 rounded-2xl rounded-tl-sm p-4 shadow-lg border border-violet-100/50 min-w-[200px]">
          {/* Animated header */}
          <div className="flex items-center gap-2 mb-3">
            <div className="flex items-center gap-1">
              <Sparkles className="w-4 h-4 text-violet-500" />
              <span className="text-xs font-semibold bg-gradient-to-r from-violet-600 to-purple-600 bg-clip-text text-transparent">
                AI Teacher
              </span>
            </div>
            <div className="flex-1 h-px bg-gradient-to-r from-violet-200 to-transparent" />
          </div>

          {/* Message with animated dots */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-neutral-600">{message}</span>
            <span className="text-sm text-violet-500 w-6">
              {'.'.repeat(dotIndex + 1)}
            </span>
          </div>

          {/* Animated dots */}
          <div className="flex items-center gap-1.5 mt-3">
            {[0, 1, 2].map((i) => (
              <div
                key={i}
                className="w-2 h-2 rounded-full bg-gradient-to-r from-violet-500 to-purple-500"
                style={{
                  animation: 'bounce 1.4s ease-in-out infinite',
                  animationDelay: `${i * 0.16}s`,
                }}
              />
            ))}
          </div>

          {/* Subtle progress line */}
          <div className="mt-3 h-1 bg-violet-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-violet-500 via-purple-500 to-violet-500 rounded-full"
              style={{
                animation: 'shimmer 2s linear infinite',
                backgroundSize: '200% 100%',
              }}
            />
          </div>
        </div>
      </div>

      {/* Custom keyframes in a style tag */}
      <style>{`
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}

// Subject selection component
function SubjectSelector({
  examType,
  onSelectSubject,
  isLoading = false,
  selectedSubjectId,
}: {
  examType: ExamTypeSlug;
  onSelectSubject: (subjectId: string, subjectName: string) => void;
  isLoading?: boolean;
  selectedSubjectId?: string;
}) {
  // Get subjects for the current exam type
  // examTypeId in subjects uses format: exam_wassce, exam_bece, exam_nsmq, igcse, cambridge_a2
  const subjects = examSubjects.filter((s) => {
    if (examType === 'bece') return s.examTypeId === 'exam_bece';
    if (examType === 'wassce') return s.examTypeId === 'exam_wassce';
    if (examType === 'nsmq') return s.examTypeId === 'exam_nsmq';
    if (examType === 'igcse') return s.examTypeId === 'igcse';
    if (examType === 'cambridge-as') return s.examTypeId === 'cambridge_as';
    if (examType === 'cambridge-a-level') return s.examTypeId === 'cambridge_a2';
    if (examType === 'edexcel-as') return s.examTypeId === 'edexcel_as';
    if (examType === 'edexcel-a-level') return s.examTypeId === 'edexcel_a2';
    return false;
  });

  if (subjects.length === 0) {
    return (
      <div className="text-center py-12 bg-white rounded-xl border border-neutral-200">
        <BookOpen className="w-12 h-12 text-neutral-300 mx-auto mb-4" />
        <p className="text-neutral-500">No subjects available for {examType.toUpperCase()}</p>
        <p className="text-sm text-neutral-400 mt-1">Please check back later or select a different exam type.</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => {
        const isSelected = selectedSubjectId === subject.id;
        const isDisabled = isLoading;

        return (
          <button
            key={subject.id}
            onClick={() => !isDisabled && onSelectSubject(subject.id, subject.name)}
            disabled={isDisabled}
            className={`group p-6 bg-white rounded-xl border-2 transition-all duration-200 text-left relative overflow-hidden ${
              isSelected
                ? 'border-primary bg-primary/5'
                : 'border-neutral-200 hover:border-primary/50 hover:shadow-lg'
            } ${isDisabled ? 'opacity-70 cursor-wait' : 'cursor-pointer'}`}
          >
            {/* Loading overlay */}
            {isSelected && isLoading && (
              <div className="absolute inset-0 bg-white/80 flex items-center justify-center z-10">
                <div className="flex items-center gap-2 text-primary">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm font-medium">Starting session...</span>
                </div>
              </div>
            )}

            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center mb-4"
              style={{ backgroundColor: `${subject.color}20` }}
            >
              <BookOpen className="w-6 h-6" style={{ color: subject.color }} />
            </div>
            <h3 className="font-semibold text-neutral-900 mb-1 group-hover:text-primary transition-colors">
              {subject.name}
            </h3>
            <p className="text-sm text-neutral-500">{subject.description}</p>
            <div className={`mt-4 flex items-center text-primary transition-opacity ${
              isSelected ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'
            }`}>
              <span className="text-sm font-medium">
                {isSelected && isLoading ? 'Loading...' : 'Start Revision'}
              </span>
              <ChevronRight className="w-4 h-4 ml-1" />
            </div>
          </button>
        );
      })}
    </div>
  );
}

// Lesson sidebar component
function LessonSidebar({
  lessons,
  currentLessonId,
  onSelectLesson,
  isCollapsed,
  onToggleCollapse,
}: {
  lessons: ReturnType<typeof useRevisionClassroomStore.getState>['lessonPlan'];
  currentLessonId?: string;
  onSelectLesson: (lessonId: string) => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}) {
  const completedCount = lessons.filter(l => l.status === 'completed').length;
  const progress = lessons.length > 0 ? Math.round((completedCount / lessons.length) * 100) : 0;

  return (
    <div className={`bg-white rounded-xl border border-neutral-200 overflow-hidden transition-all duration-300 ${isCollapsed ? 'w-16' : 'w-72'}`}>
      {/* Header */}
      <div className="p-4 border-b border-neutral-100 flex items-center justify-between">
        {!isCollapsed && (
          <div>
            <h3 className="font-semibold text-neutral-900">Lesson Plan</h3>
            <p className="text-xs text-neutral-500">{completedCount}/{lessons.length} completed</p>
          </div>
        )}
        <button
          onClick={onToggleCollapse}
          className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
        >
          {isCollapsed ? <ChevronRight className="w-5 h-5" /> : <ChevronDown className="w-5 h-5" />}
        </button>
      </div>

      {/* Progress bar */}
      {!isCollapsed && (
        <div className="px-4 py-2">
          <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-500"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      )}

      {/* Lesson list */}
      <div className={`overflow-y-auto ${isCollapsed ? 'p-2' : 'p-4'}`} style={{ maxHeight: 'calc(100vh - 300px)' }}>
        <div className="space-y-2">
          {lessons.map((lesson, index) => {
            const isActive = lesson.id === currentLessonId;
            const isCompleted = lesson.status === 'completed';
            const isSkipped = lesson.status === 'skipped';

            return (
              <button
                key={lesson.id}
                onClick={() => onSelectLesson(lesson.id)}
                disabled={isActive}
                className={`w-full flex items-start gap-3 p-3 rounded-lg transition-all duration-200 ${
                  isActive
                    ? 'bg-primary/10 border border-primary/20'
                    : 'hover:bg-neutral-50 border border-transparent'
                } ${isCollapsed ? 'justify-center' : ''}`}
              >
                {/* Status indicator */}
                <div className="flex-shrink-0 mt-0.5">
                  {isCompleted ? (
                    <CheckCircle2 className="w-5 h-5 text-green-500" />
                  ) : isActive ? (
                    <div className="w-5 h-5 rounded-full border-2 border-primary bg-primary/20 flex items-center justify-center">
                      <div className="w-2 h-2 rounded-full bg-primary" />
                    </div>
                  ) : isSkipped ? (
                    <SkipForward className="w-5 h-5 text-neutral-400" />
                  ) : (
                    <Circle className="w-5 h-5 text-neutral-300" />
                  )}
                </div>

                {!isCollapsed && (
                  <div className="flex-1 text-left">
                    <p className={`text-sm font-medium ${isActive ? 'text-primary' : isCompleted ? 'text-neutral-600' : 'text-neutral-900'}`}>
                      {index + 1}. {lesson.topicName}
                    </p>
                    {isActive && (
                      <p className="text-xs text-primary/70 mt-0.5">Currently learning...</p>
                    )}
                    {isCompleted && (
                      <p className="text-xs text-green-600 mt-0.5">Completed</p>
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// AI Teaching Display component
function AITeachingDisplay({
  aiState,
  messages,
  onRespond,
  onAskQuestion,
  onContinue,
}: {
  aiState: ReturnType<typeof useRevisionClassroomStore.getState>['aiTeachingState'];
  messages: ReturnType<typeof useRevisionClassroomStore.getState>['aiMessages'];
  onRespond: (response: string) => void;
  onAskQuestion: (question: string) => void;
  onContinue: () => void;
}) {
  const [inputValue, setInputValue] = useState('');
  const [showQuestionInput, setShowQuestionInput] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, aiState.currentMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputValue.trim()) return;

    if (showQuestionInput) {
      onAskQuestion(inputValue);
    } else {
      onRespond(inputValue);
    }
    setInputValue('');
    setShowQuestionInput(false);
  };

  // Phase display names
  const phaseNames: Record<string, string> = {
    hook: 'Getting Started',
    explain: 'Learning the Concept',
    check: 'Understanding Check',
    practice: 'Practice Time',
    confirm: 'Wrapping Up',
    connect: 'Making Connections',
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header with phase indicator */}
      <div className="bg-gradient-to-r from-primary to-accent p-4 rounded-t-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Brain className="w-5 h-5 text-white" />
            </div>
            <div className="text-white">
              <h3 className="font-semibold">Brilla AI Teacher</h3>
              <p className="text-sm text-white/80">{phaseNames[aiState.currentPhase] || 'Teaching'}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {['hook', 'explain', 'check', 'practice', 'confirm', 'connect'].map((phase, index) => (
              <div
                key={phase}
                className={`w-2 h-2 rounded-full transition-all ${
                  phase === aiState.currentPhase
                    ? 'w-6 bg-white'
                    : index < ['hook', 'explain', 'check', 'practice', 'confirm', 'connect'].indexOf(aiState.currentPhase)
                    ? 'bg-white/80'
                    : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-neutral-50">
        {messages.map((msg) => (
          <div key={msg.id} className="space-y-3">
            {/* AI Message */}
            {msg.aiMessage && (
              <div className="flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 bg-primary/10 rounded-full flex items-center justify-center">
                  <Sparkles className="w-4 h-4 text-primary" />
                </div>
                <div className="flex-1 bg-white rounded-xl rounded-tl-sm p-4 shadow-sm border border-neutral-100">
                  <div className="prose prose-sm max-w-none">
                    {msg.aiMessage.split('\n').map((line, i) => (
                      <p key={i} className={`${line.startsWith('**') ? 'font-semibold' : ''} mb-2 last:mb-0`}>
                        {line.replace(/\*\*/g, '')}
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* User Response */}
            {msg.userResponse && (
              <div className="flex gap-3 justify-end">
                <div className="bg-primary text-white rounded-xl rounded-tr-sm p-4 max-w-[80%]">
                  <p className="text-sm">{msg.userResponse}</p>
                </div>
              </div>
            )}
          </div>
        ))}

        {/* AI Typing Animation */}
        {aiState.isThinking && (
          <AITypingIndicator phase={aiState.currentPhase} />
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input area */}
      <div className="p-4 border-t border-neutral-200 bg-white rounded-b-xl">
        {aiState.awaitingResponse ? (
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder={showQuestionInput ? 'Ask your question...' : 'Type your answer...'}
              className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        ) : !aiState.isThinking ? (
          <div className="flex gap-2">
            <button
              onClick={onContinue}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 transition-colors"
            >
              <span>Continue</span>
              <ChevronRight className="w-4 h-4" />
            </button>
            <button
              onClick={() => setShowQuestionInput(!showQuestionInput)}
              className="px-4 py-3 border border-neutral-200 rounded-xl hover:bg-neutral-50 transition-colors"
            >
              <HelpCircle className="w-5 h-5 text-neutral-600" />
            </button>
          </div>
        ) : null}

        {showQuestionInput && !aiState.awaitingResponse && (
          <form onSubmit={handleSubmit} className="mt-2 flex gap-2">
            <input
              type="text"
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              placeholder="Ask a question about this topic..."
              className="flex-1 px-4 py-3 border border-neutral-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary"
            />
            <button
              type="submit"
              disabled={!inputValue.trim()}
              className="px-4 py-3 bg-primary text-white rounded-xl hover:bg-primary/90 disabled:opacity-50 transition-colors"
            >
              <Send className="w-5 h-5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

// Main Revision Classroom component
export default function RevisionClassroom() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuthStore();
  const { currentExamType } = useExamStore();
  const {
    currentSession,
    pastSessions,
    currentLesson,
    lessonPlan,
    aiTeachingState,
    aiMessages,
    whiteboardOutline,
    whiteboardSteps,
    whiteboardTotalSteps,
    whiteboardStepLoading,
    whiteboardStepError,
    isWhiteboardLoading,
    whiteboardMode,
    whiteboardLocked,
    whiteboardFallback,
    checkWorkResult,
    checkWorkLoading,
    askAboutResult,
    askAboutLoading,
    aiLimitReached,
    freeAiRemaining,
    isLoading,
    error,
    stats,
    struggleSignals,
    handoffState,
    currentCheckpoints,
    startRevisionSession,
    resumeSession,
    pauseSession,
    completeSession,
    startLesson,
    respondToAI,
    askQuestion,
    requestWhiteboardTeaching,
    fetchNextWhiteboardStep,
    checkMyWork,
    checkPhotoWork,
    clearCheckWorkResult,
    askAboutPoint,
    toggleWhiteboardMode,
    answerCheckpoint,
    fetchStats,
    fetchPastSessions,
    fetchDueTopics,
    updateStruggleSignals,
    requestHumanTutor,
    acceptHandoffSuggestion,
    declineHandoffSuggestion,
  } = useRevisionClassroomStore();

  const { getFeatureAccess } = useSubscriptionStore();
  const [whiteboardAllowed, setWhiteboardAllowed] = useState<boolean | null>(null);

  useEffect(() => {
    if (!user) return;
    getFeatureAccess().then((access) => {
      setWhiteboardAllowed(access.features.whiteboard === true);
    });
  }, [user, getFeatureAccess]);

  // Badge shows whenever access is not positively confirmed (incl. loading);
  // the upgrade card only renders once we know the feature is denied or locked,
  // so the whiteboard never flashes a paywall while entitlements load.
  const whiteboardAccessible = whiteboardAllowed === true && !whiteboardLocked;
  const showWhiteboardUpgradeCard = whiteboardAllowed === false || whiteboardLocked;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(!currentSession);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isVoiceProcessing, setIsVoiceProcessing] = useState(false);
  const [dueTopics, setDueTopics] = useState<ReturnType<typeof useRevisionClassroomStore.getState>['topicMasteries'][string][]>([]);
  const [pendingVoiceInput, setPendingVoiceInput] = useState<string>('');
  const [checkpointFeedback, setCheckpointFeedback] = useState<{isCorrect: boolean; feedback: string} | null>(null);
  const lastResponseTimeRef = useRef<number>(Date.now());
  const deepLinkFiredRef = useRef(false);

  // Fetch stats and past sessions on mount
  useEffect(() => {
    if (user) {
      fetchStats(currentExamType);
      fetchPastSessions(undefined, currentExamType);
      fetchDueTopics(currentExamType).then(setDueTopics);
    }
  }, [user, currentExamType, fetchStats, fetchPastSessions, fetchDueTopics]);

  // Track struggle signals - time stuck
  useEffect(() => {
    if (!currentLesson || !aiTeachingState.awaitingResponse) return;

    const interval = setInterval(() => {
      const timeSinceLastActivity = Math.floor((Date.now() - lastResponseTimeRef.current) / 1000);
      if (timeSinceLastActivity > 60) { // More than 1 minute stuck
        updateStruggleSignals({
          timeStuckSeconds: timeSinceLastActivity,
        });
      }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
  }, [currentLesson, aiTeachingState.awaitingResponse, updateStruggleSignals]);

  // Loading state for subject selection
  const [isStartingSession, setIsStartingSession] = useState(false);
  const [selectedSubjectId, setSelectedSubjectId] = useState<string>('');
  const [sessionError, setSessionError] = useState<string>('');
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);

  // Handle subject selection
  const handleSelectSubject = useCallback(async (
    subjectId: string,
    subjectName: string,
    topicId?: string,
    topicName?: string,
    examTypeOverride?: ExamTypeSlug,
  ) => {
    // Check if user is logged in - API requires authentication
    if (!user) {
      setShowLoginPrompt(true);
      setSelectedSubjectId(subjectId);
      return;
    }

    setSelectedSubjectId(subjectId);
    setIsStartingSession(true);
    setSessionError('');

    try {
      await startRevisionSession(
        user.id,
        examTypeOverride ?? currentExamType,
        subjectId,
        subjectName,
        topicId ? 'topic_review' : 'full_revision',
        topicId,
        topicName,
      );

      // Wait a moment for state to update
      await new Promise(resolve => setTimeout(resolve, 100));

      // Check the store state after the call
      const storeState = useRevisionClassroomStore.getState();

      if (storeState.error) {
        setSessionError(storeState.error);
        setIsStartingSession(false);
        return;
      }

      if (storeState.currentSession) {
        // Session created successfully
        setShowSubjectSelector(false);
      } else {
        setSessionError('Session could not be created. Please check your connection and try again.');
      }
    } catch (err) {
      console.error('Failed to start session:', err);
      setSessionError(err instanceof Error ? err.message : 'Failed to start session. Please try again.');
    } finally {
      setIsStartingSession(false);
    }
  }, [currentExamType, startRevisionSession, user]);

  // Treat Counselor Brie roadmap query parameters as untrusted input. Only a
  // catalog exam/subject pair and bounded identifiers may auto-start.
  useEffect(() => {
    if (deepLinkFiredRef.current || currentSession || !user) return;
    const subjectId = searchParams.get('subject')?.trim() ?? '';
    const rawExam = searchParams.get('exam')?.trim() ?? '';
    if (!subjectId || !rawExam || !/^[A-Za-z0-9_-]{1,128}$/.test(subjectId)) return;

    const examOption = GUIDANCE_EXAM_OPTIONS.find(
      (exam) => exam.apiId === rawExam || exam.slug === rawExam,
    );
    if (!examOption) return;
    const subject = getGuidanceSubjects(examOption.slug).find((item) => item.id === subjectId);
    if (!subject) return;

    const rawTopicId = searchParams.get('topic')?.trim() ?? '';
    const topicId = /^[A-Za-z0-9_-]{1,128}$/.test(rawTopicId) ? rawTopicId : undefined;
    const rawTopicName = searchParams.get('topicName')?.trim();
    const topicName = rawTopicName && rawTopicName.length <= 160 ? rawTopicName : undefined;

    deepLinkFiredRef.current = true;
    if (examOption.slug !== currentExamType) {
      useExamStore.getState().setExamType(examOption.slug);
    }
    void handleSelectSubject(subject.id, subject.name, topicId, topicName, examOption.slug);
  }, [currentExamType, currentSession, handleSelectSubject, searchParams, user]);

  // Handle continue button
  const handleContinue = () => {
    if (aiTeachingState.currentPhase === 'connect') {
      // Move to next lesson
      if (currentLesson) {
        const currentIndex = lessonPlan.findIndex(l => l.id === currentLesson.id);
        const nextLesson = lessonPlan[currentIndex + 1];
        if (nextLesson) {
          startLesson(nextLesson.id);
        } else {
          // Complete session
          completeSession();
          setShowSubjectSelector(true);
        }
      }
    } else {
      // Continue to next phase
      respondToAI('continue');
    }
  };

  // Handle back button
  const handleBack = () => {
    if (currentSession) {
      pauseSession();
    }
    navigate(-1);
  };

  // Handle resume session
  const handleResumeSession = async (sessionId: string) => {
    await resumeSession(sessionId);
    setShowSubjectSelector(false);
  };

  // Handle checkpoint answer - integrated into respondToAI with feedback tracking
  const handleCheckpointResponse = async (response: string) => {
    lastResponseTimeRef.current = Date.now();

    // Check if we have checkpoints and are in check/practice phase
    if (currentCheckpoints.length > 0 && (aiTeachingState.currentPhase === 'check' || aiTeachingState.currentPhase === 'practice')) {
      const checkpoint = currentCheckpoints[0];
      const result = await answerCheckpoint(checkpoint.id, response);

      // Show feedback toast
      setCheckpointFeedback({
        isCorrect: result.isCorrect,
        feedback: result.aiFeedback || (result.isCorrect ? 'Correct! Well done!' : `The correct answer was: ${checkpoint.correctAnswer}`),
      });

      // Clear feedback after delay
      setTimeout(() => setCheckpointFeedback(null), 3000);

      // Track struggle signals
      if (!result.isCorrect) {
        updateStruggleSignals({
          consecutiveWrongAnswers: struggleSignals.consecutiveWrongAnswers + 1,
        });
      } else {
        updateStruggleSignals({
          consecutiveWrongAnswers: 0,
        });
      }
    }

    // Continue with normal AI response flow
    respondToAI(response);
  };

  // Handle voice message - sends to AI and returns spoken response
  const handleVoiceMessage = async (text: string): Promise<string> => {
    setIsVoiceProcessing(true);
    lastResponseTimeRef.current = Date.now();

    try {
      // Store the current message count to detect new responses
      const currentMessageCount = aiMessages.length;

      // Send to AI tutor
      await askQuestion(text);

      // Wait a bit for state to update, then get the latest AI message
      await new Promise(resolve => setTimeout(resolve, 100));

      // Get the store state directly to get the latest message
      const storeState = useRevisionClassroomStore.getState();
      const latestMessages = storeState.aiMessages;

      // Find the new AI message (should be after user's message)
      if (latestMessages.length > currentMessageCount) {
        const newAiMessage = latestMessages[latestMessages.length - 1];
        if (newAiMessage?.aiMessage) {
          return newAiMessage.aiMessage;
        }
      }

      return "I've processed your question. Please check the chat for my response.";
    } catch (error) {
      console.error('Voice message error:', error);
      return "I'm sorry, I couldn't process your question. Please try again.";
    } finally {
      setIsVoiceProcessing(false);
    }
  };

  // Handle voice transcript (for display in chat)
  const handleVoiceTranscript = (text: string, isFinal: boolean) => {
    if (isFinal && text.trim()) {
      setPendingVoiceInput(text);
      lastResponseTimeRef.current = Date.now();

      // If awaiting response, use it as the response
      if (aiTeachingState.awaitingResponse) {
        respondToAI(text);
        setPendingVoiceInput('');
      }
    } else if (!isFinal) {
      // Show interim transcript
      setPendingVoiceInput(text);
    }
  };

  // Show subject selector if no session
  if (showSubjectSelector || !currentSession) {
    return (
      <div className="min-h-screen bg-neutral-50 p-4 md:p-6">
        <div className="max-w-6xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-8">
            <button
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-neutral-900">AI Revision Classroom</h1>
              <p className="text-neutral-500">Select a subject to start your personalized revision</p>
            </div>
          </div>

          {/* Exam Type Selector */}
          <div className="mb-6">
            <p className="text-sm text-neutral-500 mb-2">Select your exam type:</p>
            <div className="flex flex-wrap gap-2">
              {examTypes.filter(e => e.isActive).map((exam) => (
                <button
                  key={exam.slug}
                  onClick={() => useExamStore.getState().setExamType(exam.slug)}
                  className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                    currentExamType === exam.slug
                      ? 'bg-primary text-white shadow-md'
                      : 'bg-white border border-neutral-200 text-neutral-700 hover:border-primary/50 hover:text-primary'
                  }`}
                >
                  {exam.name}
                </button>
              ))}
            </div>
          </div>

          {/* Features highlight */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            {[
              { icon: Brain, title: 'AI Teacher', desc: 'Proactive personalized teaching' },
              { icon: Target, title: 'Exam Focused', desc: 'Aligned to your exam board' },
              { icon: TrendingUp, title: 'Track Progress', desc: 'Master every topic' },
              { icon: Zap, title: 'Interactive', desc: 'Ask questions anytime' },
            ].map((feature, i) => (
              <div key={i} className="flex items-center gap-3 p-4 bg-white rounded-xl border border-neutral-200">
                <div className="w-10 h-10 bg-primary/10 rounded-lg flex items-center justify-center">
                  <feature.icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-neutral-900 text-sm">{feature.title}</p>
                  <p className="text-xs text-neutral-500">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Subject selector */}
          <h2 className="text-lg font-semibold text-neutral-900 mb-4">Choose a Subject</h2>
          <SubjectSelector
            examType={currentExamType}
            onSelectSubject={handleSelectSubject}
            isLoading={isStartingSession}
            selectedSubjectId={selectedSubjectId}
          />

          {/* Error Display */}
          {sessionError && (
            <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-red-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="font-medium text-red-800">Failed to start session</p>
                <p className="text-sm text-red-600 mt-1">{sessionError}</p>
                <button
                  onClick={() => setSessionError('')}
                  className="text-sm text-red-700 underline mt-2 hover:text-red-800"
                >
                  Dismiss
                </button>
              </div>
            </div>
          )}

          {/* Login Prompt Modal */}
          {showLoginPrompt && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowLoginPrompt(false)} />
              <div className="relative bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full">
                <button
                  onClick={() => setShowLoginPrompt(false)}
                  className="absolute top-4 right-4 p-1 hover:bg-neutral-100 rounded-full"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>

                <div className="text-center mb-6">
                  <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-4">
                    <Brain className="w-8 h-8 text-primary" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900">Sign In Required</h3>
                  <p className="text-neutral-500 mt-2">
                    Please sign in to start your AI-powered revision session. Your progress will be saved automatically.
                  </p>
                </div>

                <div className="space-y-3">
                  <button
                    onClick={() => navigate('/login?redirect=/revision-classroom')}
                    className="w-full py-3 bg-primary text-white rounded-xl font-medium hover:bg-primary/90 transition-colors"
                  >
                    Sign In
                  </button>
                  <button
                    onClick={() => navigate('/register?redirect=/revision-classroom')}
                    className="w-full py-3 border border-neutral-200 text-neutral-700 rounded-xl font-medium hover:bg-neutral-50 transition-colors"
                  >
                    Create Free Account
                  </button>
                  <button
                    onClick={() => setShowLoginPrompt(false)}
                    className="w-full py-2 text-neutral-500 text-sm hover:text-neutral-700"
                  >
                    Maybe Later
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Stats Dashboard */}
          {stats && (
            <div className="mt-8 mb-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Your Progress</h2>
              <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-violet-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Clock className="w-5 h-5 text-violet-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalTimeMinutes || 0}</p>
                  <p className="text-xs text-neutral-500">Minutes Studied</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <CheckCircle2 className="w-5 h-5 text-green-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.sessionsCompleted || 0}</p>
                  <p className="text-xs text-neutral-500">Sessions Done</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Trophy className="w-5 h-5 text-amber-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.topicsMastered || 0}</p>
                  <p className="text-xs text-neutral-500">Topics Mastered</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <TrendingUp className="w-5 h-5 text-blue-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.averageMastery || 0}%</p>
                  <p className="text-xs text-neutral-500">Avg Mastery</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-pink-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Award className="w-5 h-5 text-pink-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.achievementCount || 0}</p>
                  <p className="text-xs text-neutral-500">Achievements</p>
                </div>
                <div className="p-4 bg-white rounded-xl border border-neutral-200 text-center">
                  <div className="w-10 h-10 bg-orange-100 rounded-lg flex items-center justify-center mx-auto mb-2">
                    <Star className="w-5 h-5 text-orange-600" />
                  </div>
                  <p className="text-2xl font-bold text-neutral-900">{stats.totalXP || 0}</p>
                  <p className="text-xs text-neutral-500">Total XP</p>
                </div>
              </div>
            </div>
          )}

          {/* Due for Revision (Spaced Repetition) */}
          {dueTopics.length > 0 && (
            <div className="mt-8 mb-8">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Calendar className="w-5 h-5 text-amber-500" />
                  <h2 className="text-lg font-semibold text-neutral-900">Due for Revision</h2>
                </div>
                <span className="text-sm text-amber-600 bg-amber-50 px-3 py-1 rounded-full">
                  {dueTopics.length} topics need review
                </span>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {dueTopics.slice(0, 6).map((topic) => (
                  <button
                    key={topic.id}
                    onClick={() => handleSelectSubject(topic.topicId, topic.topicName || 'Topic')}
                    className="p-4 bg-gradient-to-br from-amber-50 to-orange-50 rounded-xl border border-amber-200 hover:border-amber-400 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900">{topic.topicName}</span>
                      <RefreshCw className="w-4 h-4 text-amber-500" />
                    </div>
                    <div className="flex items-center gap-4 text-xs text-neutral-500">
                      <span className="flex items-center gap-1">
                        <BarChart3 className="w-3 h-3" />
                        {topic.masteryLevel}% mastery
                      </span>
                      <span className="flex items-center gap-1">
                        <Flame className="w-3 h-3" />
                        {topic.revisionCount}x revised
                      </span>
                    </div>
                    <div className="mt-2 text-xs text-amber-600 font-medium">
                      Click to review now
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Past sessions */}
          {pastSessions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Continue Previous Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastSessions.filter(s => s.status === 'paused').slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => handleResumeSession(session.id)}
                    disabled={isLoading}
                    className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary/50 hover:shadow-md transition-all text-left disabled:opacity-50"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900">{session.subjectName}</span>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Paused</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <BarChart3 className="w-4 h-4" />
                      <span>{session.progressPercentage}% complete</span>
                    </div>
                    <div className="mt-2 text-xs text-neutral-400">
                      {session.lessonsCompleted}/{session.totalLessons} lessons • Last active: {new Date(session.lastActivityAt).toLocaleDateString()}
                    </div>
                    <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${session.progressPercentage}%` }}
                      />
                    </div>
                    <div className="mt-3 flex items-center justify-center gap-2 text-primary text-sm font-medium">
                      <ChevronRight className="w-4 h-4" />
                      Resume Session
                    </div>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // Main classroom view
  return (
    <div className="min-h-screen bg-neutral-50">
      {/* Top bar */}
      <div className="bg-white border-b border-neutral-200 px-4 py-3">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button
              onClick={handleBack}
              className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="font-semibold text-neutral-900">{currentSession.subjectName}</h1>
              <p className="text-sm text-neutral-500">
                {currentLesson?.topicName || 'Loading...'} | {currentSession.examType.toUpperCase()}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            {/* Progress indicator */}
            <div className="hidden md:flex items-center gap-2 text-sm">
              <Award className="w-4 h-4 text-amber-500" />
              <span className="text-neutral-600">{currentSession.lessonsCompleted}/{currentSession.totalLessons} lessons</span>
            </div>

            {freeAiRemaining !== null && freeAiRemaining >= 0 && (
              <span className="hidden md:inline text-xs text-neutral-500 bg-neutral-100 px-2 py-1 rounded-full">
                {freeAiRemaining} free explanations left today
              </span>
            )}

            {/* Mode toggle */}
            <div className="flex items-center gap-1 bg-neutral-100 p-1 rounded-lg">
              <button
                onClick={() => whiteboardMode && toggleWhiteboardMode()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  !whiteboardMode
                    ? 'bg-white text-primary shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <MessageSquare className="w-4 h-4" />
                <span className="hidden sm:inline">Chat</span>
              </button>
              <button
                onClick={() => !whiteboardMode && toggleWhiteboardMode()}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-md text-sm font-medium transition-all ${
                  whiteboardMode
                    ? 'bg-white text-violet-600 shadow-sm'
                    : 'text-neutral-600 hover:text-neutral-900'
                }`}
              >
                <Presentation className="w-4 h-4" />
                <span className="hidden sm:inline">Whiteboard</span>
                {!whiteboardAccessible && <Lock className="w-3 h-3 text-amber-500" />}
              </button>
            </div>

            {/* Voice toggle */}
            <button
              onClick={() => setVoiceEnabled(!voiceEnabled)}
              className={`p-2 rounded-lg transition-all ${
                voiceEnabled
                  ? 'bg-emerald-500 text-white shadow-md'
                  : 'bg-neutral-100 hover:bg-neutral-200 text-neutral-600'
              }`}
              title={voiceEnabled ? 'Disable voice' : 'Enable voice conversation'}
            >
              <Mic className="w-5 h-5" />
            </button>

            {/* Focus Mode button */}
            <button
              onClick={() => {
                const params = new URLSearchParams();
                if (currentSession?.subjectId) params.set('subject', currentSession.subjectId);
                if (currentLesson?.topicId) params.set('topic', currentLesson.topicId);
                if (currentLesson?.id) params.set('lesson', currentLesson.id);
                navigate(`/immersive-learning?${params.toString()}`);
              }}
              className="flex items-center gap-2 px-3 py-2 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-lg shadow-md transition-all"
              title="Enter Focus Mode - Zero distraction learning"
            >
              <Focus className="w-4 h-4" />
              <span className="text-sm font-medium hidden sm:inline">Focus Mode</span>
            </button>

            {/* Session controls */}
            <div className="flex items-center gap-2">
              <button
                onClick={pauseSession}
                className="p-2 hover:bg-neutral-100 rounded-lg transition-colors"
                title="Pause session"
              >
                <Pause className="w-5 h-5 text-neutral-600" />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto p-4 flex gap-4">
        {/* Lesson sidebar */}
        <LessonSidebar
          lessons={lessonPlan}
          currentLessonId={currentLesson?.id}
          onSelectLesson={startLesson}
          isCollapsed={sidebarCollapsed}
          onToggleCollapse={() => setSidebarCollapsed(!sidebarCollapsed)}
        />

        {/* AI Teaching area */}
        <div className="flex-1 bg-white rounded-xl border border-neutral-200 overflow-hidden" style={{ height: 'calc(100vh - 140px)' }}>
          {currentLesson ? (
            whiteboardMode ? (
              showWhiteboardUpgradeCard ? (
                <div className="flex flex-col items-center justify-center h-full text-center p-8">
                  <div className="w-16 h-16 bg-gradient-to-br from-violet-500 to-purple-600 rounded-2xl flex items-center justify-center mb-4">
                    <Presentation className="w-8 h-8 text-white" />
                  </div>
                  <h3 className="text-xl font-bold text-neutral-900 mb-2">AI Whiteboard Teacher</h3>
                  <p className="text-neutral-600 max-w-md mb-6">
                    Watch the AI teacher draw diagrams, worked examples and concept maps while
                    explaining your topic — a premium feature.
                  </p>
                  <div className="grid grid-cols-2 gap-3 w-full max-w-md mb-6 opacity-50 pointer-events-none" aria-hidden="true">
                    {['Labeled Diagram', 'Step-by-Step', 'Worked Example', 'Concept Map'].map((name) => (
                      <div key={name} className="flex items-center justify-center gap-2 p-3 rounded-xl bg-neutral-100 text-neutral-500 text-sm font-medium">
                        <Lock className="w-4 h-4" /> {name}
                      </div>
                    ))}
                  </div>
                  <button
                    onClick={() => navigate('/pricing')}
                    className="px-6 py-3 bg-gradient-to-r from-violet-600 to-purple-600 text-white rounded-xl font-medium hover:from-violet-700 hover:to-purple-700 transition-all shadow-lg"
                  >
                    Upgrade to unlock
                  </button>
                </div>
              ) : (
                <AIWhiteboardTeacher
                  outline={whiteboardOutline}
                  steps={whiteboardSteps}
                  totalSteps={whiteboardTotalSteps}
                  isLoading={isWhiteboardLoading}
                  stepLoading={whiteboardStepLoading}
                  stepError={whiteboardStepError}
                  onRequestContent={requestWhiteboardTeaching}
                  onNeedStep={fetchNextWhiteboardStep}
                  fallback={whiteboardFallback}
                  onCheckWork={checkMyWork}
                  checkWorkResult={checkWorkResult}
                  checkWorkLoading={checkWorkLoading}
                  onAskAboutPoint={askAboutPoint}
                  askAboutResult={askAboutResult}
                  askAboutLoading={askAboutLoading}
                  onPhotoCheckWork={checkPhotoWork}
                  onClearCheckWork={clearCheckWorkResult}
                  className="h-full"
                />
              )
            ) : (
              <div className="flex flex-col h-full">
                {aiLimitReached && (
                  <div className="p-4 bg-amber-50 border-b border-amber-200 flex items-center justify-between gap-3">
                    <p className="text-sm text-amber-800">
                      You've used today's 10 free AI explanations. Upgrade for unlimited, or come back tomorrow.
                    </p>
                    <button
                      onClick={() => navigate('/pricing')}
                      className="text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 px-3 py-1.5 rounded-lg"
                    >
                      Upgrade
                    </button>
                  </div>
                )}
                <div className="flex-1 min-h-0">
                  <AITeachingDisplay
                    aiState={aiTeachingState}
                    messages={aiMessages}
                    onRespond={handleCheckpointResponse}
                    onAskQuestion={askQuestion}
                    onContinue={handleContinue}
                  />
                </div>
              </div>
            )
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-neutral-600">Loading your lesson...</p>
            </div>
          )}
        </div>
      </div>

      {/* Voice Conversation - Floating mode */}
      {voiceEnabled && currentLesson && (
        <VoiceConversation
          onTranscript={handleVoiceTranscript}
          onSendMessage={handleVoiceMessage}
          isProcessing={isVoiceProcessing || aiTeachingState.isThinking}
          mode="floating"
          autoSpeak={true}
          voiceSettings={{
            rate: 0.95,
            pitch: 1.0,
            volume: 1.0,
          }}
        />
      )}

      {/* Struggle Detection & Tutor Handoff UI */}
      {handoffState.status === 'suggested' && (
        <div className="fixed bottom-20 right-4 z-40 animate-slide-up">
          <div className="bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-300 rounded-2xl shadow-xl p-5 max-w-sm">
            <div className="flex items-start gap-3 mb-4">
              <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">Need Some Help?</h4>
                <p className="text-sm text-neutral-600 mt-1">
                  It looks like you might be struggling with this topic. Would you like to connect with a human tutor for personalized assistance?
                </p>
              </div>
            </div>

            {/* Struggle indicators */}
            <div className="bg-white/60 rounded-lg p-3 mb-4">
              <p className="text-xs text-neutral-500 mb-2">We noticed:</p>
              <div className="space-y-1">
                {struggleSignals.consecutiveWrongAnswers > 1 && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <X className="w-3 h-3" /> {struggleSignals.consecutiveWrongAnswers} incorrect answers in a row
                  </p>
                )}
                {struggleSignals.timeStuckSeconds > 120 && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <Timer className="w-3 h-3" /> Spending extra time on this question
                  </p>
                )}
                {struggleSignals.clarificationRequestsCount > 2 && (
                  <p className="text-xs text-amber-700 flex items-center gap-1">
                    <HelpCircle className="w-3 h-3" /> Multiple clarification requests
                  </p>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={acceptHandoffSuggestion}
                className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-lg font-medium hover:from-amber-600 hover:to-orange-600 transition-all"
              >
                <UserPlus className="w-4 h-4" />
                Get Human Help
              </button>
              <button
                onClick={declineHandoffSuggestion}
                className="px-4 py-2.5 border border-neutral-200 rounded-lg text-neutral-600 hover:bg-neutral-50 transition-all"
              >
                I'm OK
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Handoff Pending Status */}
      {(handoffState.status === 'pending' || handoffState.status === 'requested') && (
        <div className="fixed bottom-20 right-4 z-40">
          <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-blue-200 rounded-2xl shadow-xl p-5 max-w-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center animate-pulse">
                <UserPlus className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <h4 className="font-semibold text-neutral-900">Finding a Tutor</h4>
                <p className="text-sm text-neutral-600">Please wait while we connect you...</p>
              </div>
            </div>
            <div className="flex items-center gap-2 text-xs text-blue-600">
              <Loader2 className="w-4 h-4 animate-spin" />
              <span>Looking for available tutors...</span>
            </div>
          </div>
        </div>
      )}

      {/* Request Human Tutor Button (always visible in main view) */}
      {currentLesson && handoffState.status === 'none' && (
        <button
          onClick={() => requestHumanTutor('Student requested help')}
          className="fixed bottom-20 left-4 z-30 flex items-center gap-2 px-4 py-2.5 bg-white border border-neutral-200 rounded-xl shadow-lg hover:shadow-xl hover:border-primary/50 transition-all group"
          title="Request help from a human tutor"
        >
          <UserPlus className="w-5 h-5 text-neutral-500 group-hover:text-primary transition-colors" />
          <span className="text-sm font-medium text-neutral-600 group-hover:text-primary transition-colors">
            Get Human Help
          </span>
        </button>
      )}

      {/* Pending Voice Input Display */}
      {pendingVoiceInput && !aiTeachingState.awaitingResponse && (
        <div className="fixed bottom-32 left-1/2 transform -translate-x-1/2 z-30">
          <div className="bg-white border border-neutral-200 rounded-xl shadow-lg px-4 py-2 flex items-center gap-2">
            <Mic className="w-4 h-4 text-emerald-500 animate-pulse" />
            <span className="text-sm text-neutral-600">{pendingVoiceInput}</span>
          </div>
        </div>
      )}

      {/* Checkpoint Feedback Toast */}
      {checkpointFeedback && (
        <div className={`fixed top-20 left-1/2 transform -translate-x-1/2 z-50 animate-slide-down`}>
          <div className={`px-6 py-4 rounded-xl shadow-xl flex items-center gap-3 ${
            checkpointFeedback.isCorrect
              ? 'bg-gradient-to-r from-green-500 to-emerald-500 text-white'
              : 'bg-gradient-to-r from-red-500 to-rose-500 text-white'
          }`}>
            {checkpointFeedback.isCorrect ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : (
              <X className="w-6 h-6" />
            )}
            <div>
              <p className="font-semibold">{checkpointFeedback.isCorrect ? 'Correct!' : 'Not quite right'}</p>
              <p className="text-sm opacity-90">{checkpointFeedback.feedback}</p>
            </div>
          </div>
        </div>
      )}

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg z-50">
          <p className="text-sm">{error}</p>
        </div>
      )}

      {/* CSS Animations */}
      <style>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        @keyframes slide-down {
          from {
            opacity: 0;
            transform: translateX(-50%) translateY(-20px);
          }
          to {
            opacity: 1;
            transform: translateX(-50%) translateY(0);
          }
        }
        .animate-slide-up {
          animation: slide-up 0.3s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.3s ease-out;
        }
      `}</style>
    </div>
  );
}
