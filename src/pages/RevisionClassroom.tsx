import { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
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
} from 'lucide-react';
import {
  useAuthStore,
  useExamStore,
  useRevisionClassroomStore,
} from '@/stores';
import type { ExamTypeSlug } from '@/types';
import { subjects as examSubjects } from '@/data/examData';
import type { TeachingPhase } from '@/stores/revisionClassroomStore';

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
}: {
  examType: ExamTypeSlug;
  onSelectSubject: (subjectId: string, subjectName: string) => void;
}) {
  // Get subjects for the current exam type
  const subjects = examSubjects.filter((s) => {
    if (examType === 'bece') return s.examTypeId === 'bece';
    if (examType === 'wassce') return s.examTypeId === 'wassce';
    if (examType === 'nsmq') return ['mathematics', 'physics', 'chemistry', 'biology'].some(sub => s.slug.includes(sub));
    if (examType === 'igcse') return s.examTypeId === 'igcse';
    if (examType === 'cambridge-as' || examType === 'cambridge-a-level') return s.examTypeId === 'cambridge_as' || s.examTypeId === 'cambridge_a2';
    if (examType === 'edexcel-as' || examType === 'edexcel-a-level') return s.examTypeId === 'edexcel_as' || s.examTypeId === 'edexcel_a2';
    return false;
  });

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {subjects.map((subject) => (
        <button
          key={subject.id}
          onClick={() => onSelectSubject(subject.id, subject.name)}
          className="group p-6 bg-white rounded-xl border-2 border-neutral-200 hover:border-primary/50 hover:shadow-lg transition-all duration-200 text-left"
        >
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
          <div className="mt-4 flex items-center text-primary opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-sm font-medium">Start Revision</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </div>
        </button>
      ))}
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
  const { user } = useAuthStore();
  const { currentExamType, examTypes } = useExamStore();
  const {
    currentSession,
    pastSessions,
    currentLesson,
    lessonPlan,
    aiTeachingState,
    aiMessages,
    isLoading: _isLoading,
    error,
    startRevisionSession,
    pauseSession,
    completeSession,
    startLesson,
    respondToAI,
    askQuestion,
    requestAITeaching: _requestAITeaching,
    resetClassroom: _resetClassroom,
  } = useRevisionClassroomStore();

  // Suppress unused variable warnings (used in future implementations)
  void _isLoading;
  void _requestAITeaching;
  void _resetClassroom;

  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [showSubjectSelector, setShowSubjectSelector] = useState(!currentSession);

  // Get exam type info
  const examTypeInfo = examTypes.find(e => e.slug === currentExamType);

  // Handle subject selection
  const handleSelectSubject = async (subjectId: string, subjectName: string) => {
    if (!user) return;

    await startRevisionSession(
      user.id,
      currentExamType,
      subjectId,
      subjectName
    );
    setShowSubjectSelector(false);
  };

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

          {/* Exam Type Badge */}
          <div className="mb-6 flex items-center gap-2">
            <span className="px-3 py-1 bg-primary/10 text-primary rounded-full text-sm font-medium">
              {examTypeInfo?.name || currentExamType.toUpperCase()}
            </span>
            <span className="text-neutral-400">|</span>
            <span className="text-neutral-600 text-sm">AI-Led Comprehensive Revision</span>
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
          <SubjectSelector examType={currentExamType} onSelectSubject={handleSelectSubject} />

          {/* Past sessions */}
          {pastSessions.length > 0 && (
            <div className="mt-8">
              <h2 className="text-lg font-semibold text-neutral-900 mb-4">Continue Previous Sessions</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {pastSessions.filter(s => s.status === 'paused').slice(0, 3).map((session) => (
                  <button
                    key={session.id}
                    onClick={() => {
                      // Resume session logic would go here
                    }}
                    className="p-4 bg-white rounded-xl border border-neutral-200 hover:border-primary/50 hover:shadow-md transition-all text-left"
                  >
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-neutral-900">{session.subjectName}</span>
                      <span className="text-xs text-amber-600 bg-amber-50 px-2 py-0.5 rounded">Paused</span>
                    </div>
                    <div className="flex items-center gap-2 text-sm text-neutral-500">
                      <BarChart3 className="w-4 h-4" />
                      <span>{session.progressPercentage}% complete</span>
                    </div>
                    <div className="mt-3 h-1.5 bg-neutral-100 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary/60 rounded-full"
                        style={{ width: `${session.progressPercentage}%` }}
                      />
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
            <AITeachingDisplay
              aiState={aiTeachingState}
              messages={aiMessages}
              onRespond={respondToAI}
              onAskQuestion={askQuestion}
              onContinue={handleContinue}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center p-8">
              <Loader2 className="w-8 h-8 text-primary animate-spin mb-4" />
              <p className="text-neutral-600">Loading your lesson...</p>
            </div>
          )}
        </div>
      </div>

      {/* Error toast */}
      {error && (
        <div className="fixed bottom-4 right-4 bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl shadow-lg">
          <p className="text-sm">{error}</p>
        </div>
      )}
    </div>
  );
}
