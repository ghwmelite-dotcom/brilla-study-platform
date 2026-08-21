import { useState, useEffect, useMemo, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  Headphones,
  Send,
  Sparkles,
  X,
  Minimize2,
  Maximize2,
  Volume2,
  VolumeX,
  AlertTriangle,
  Lightbulb,
  BookOpen,
  Clock,
  ChevronDown,
} from 'lucide-react';
import { useTutorClassroomStore } from '@/stores/tutorClassroomStore';
import { cn } from '@/utils';

interface ObservingSessionPanelProps {
  sessionId: string;
  onClose: () => void;
  className?: string;
}

type TutorModeType = 'observe' | 'co_teach' | 'takeover';

const modeOptions: { value: TutorModeType; label: string; icon: React.ReactNode; description: string }[] = [
  {
    value: 'observe',
    label: 'Observe',
    icon: <Eye className="w-4 h-4" />,
    description: 'Watch silently without student knowing',
  },
  {
    value: 'co_teach',
    label: 'Co-Teach',
    icon: <Users className="w-4 h-4" />,
    description: 'Help alongside the AI tutor',
  },
  {
    value: 'takeover',
    label: 'Take Over',
    icon: <Headphones className="w-4 h-4" />,
    description: 'Fully control the teaching session',
  },
];

const quickMessages = [
  { emoji: '👍', label: 'Great job!', message: 'Great job! Keep it up!' },
  { emoji: '💪', label: 'You can do it!', message: "You're doing well, keep trying!" },
  { emoji: '🤔', label: 'Think about it', message: 'Take a moment to think about this...' },
  { emoji: '✨', label: 'Almost there', message: "You're almost there! Just one more step." },
];

const aiGuidanceOptions = [
  { label: 'Slow down', value: 'slow_down', description: 'Ask AI to explain more slowly' },
  { label: 'Give example', value: 'give_example', description: 'Request a worked example' },
  { label: 'Simplify', value: 'simplify', description: 'Use simpler language' },
  { label: 'More practice', value: 'more_practice', description: 'Generate practice problems' },
  { label: 'Check understanding', value: 'check_understanding', description: 'Add comprehension check' },
  { label: 'Move on', value: 'move_on', description: 'Proceed to next topic' },
];

export function ObservingSessionPanel({
  sessionId,
  onClose,
  className,
}: ObservingSessionPanelProps) {
  const {
    observedSessionDetails,
    observedSessionEvents,
    sendMessage,
    guideAI,
    changeMode,
    leaveSession,
    pollSessionUpdates,
  } = useTutorClassroomStore();

  const session = observedSessionDetails.get(sessionId);
  const events = useMemo(() => observedSessionEvents.get(sessionId) || [], [observedSessionEvents, sessionId]);

  const [currentMode, setCurrentMode] = useState<TutorModeType>('observe');
  const [messageText, setMessageText] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [showModeSelector, setShowModeSelector] = useState(false);
  const [showAIGuidance, setShowAIGuidance] = useState(false);
  const [isVisibleToStudent, setIsVisibleToStudent] = useState(true);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const pollingRef = useRef<NodeJS.Timeout | null>(null);

  // Start polling for updates
  useEffect(() => {
    pollingRef.current = setInterval(() => {
      pollSessionUpdates(sessionId);
    }, 2000);

    return () => {
      if (pollingRef.current) {
        clearInterval(pollingRef.current);
      }
    };
  }, [sessionId, pollSessionUpdates]);

  // Scroll to bottom on new events
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [events]);

  const handleModeChange = async (mode: TutorModeType) => {
    setCurrentMode(mode);
    await changeMode(sessionId, mode);
    setShowModeSelector(false);
  };

  const handleSendMessage = async () => {
    if (!messageText.trim()) return;

    await sendMessage(sessionId, messageText, isVisibleToStudent);
    setMessageText('');
  };

  const handleQuickMessage = async (message: string) => {
    await sendMessage(sessionId, message, true);
  };

  const handleAIGuidance = async (guidance: string) => {
    await guideAI(sessionId, guidance);
    setShowAIGuidance(false);
  };

  const handleLeave = async () => {
    await leaveSession(sessionId);
    onClose();
  };

  if (!session) {
    return (
      <div className={cn("bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 p-8 text-center", className)}>
        <AlertTriangle className="w-8 h-8 text-amber-500 mx-auto mb-3" />
        <p className="text-slate-600 dark:text-slate-400">Session not found or has ended</p>
        <button onClick={onClose} className="mt-4 text-violet-600 hover:text-violet-700">
          Close
        </button>
      </div>
    );
  }

  const struggleColor = session.struggleScore >= 70 ? 'red' : session.struggleScore >= 40 ? 'amber' : 'emerald';

  return (
    <motion.div
      layout
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col",
        isExpanded ? "h-[600px]" : "h-auto",
        className
      )}
    >
      {/* Header */}
      <div className="p-4 border-b border-slate-200 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          {/* Student info */}
          <div className="relative">
            {session.studentAvatarUrl ? (
              <img src={session.studentAvatarUrl} alt={session.studentName} className="w-10 h-10 rounded-full" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-medium">
                {session.studentName?.[0]?.toUpperCase() || 'S'}
              </div>
            )}
            <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 dark:text-white">
              {session.studentName || 'Student'}
            </h3>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              {session.subjectName} • {session.topicName || 'General'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Mode selector */}
          <div className="relative">
            <button
              onClick={() => setShowModeSelector(!showModeSelector)}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                currentMode === 'observe' && "bg-violet-100 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400",
                currentMode === 'co_teach' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
                currentMode === 'takeover' && "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400",
              )}
            >
              {modeOptions.find(m => m.value === currentMode)?.icon}
              {modeOptions.find(m => m.value === currentMode)?.label}
              <ChevronDown className="w-3 h-3" />
            </button>

            <AnimatePresence>
              {showModeSelector && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  className="absolute right-0 top-full mt-1 w-56 bg-white dark:bg-slate-800 rounded-xl shadow-lg border border-slate-200 dark:border-slate-700 z-10 overflow-hidden"
                >
                  {modeOptions.map(mode => (
                    <button
                      key={mode.value}
                      onClick={() => handleModeChange(mode.value)}
                      className={cn(
                        "w-full flex items-start gap-3 p-3 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors text-left",
                        currentMode === mode.value && "bg-slate-50 dark:bg-slate-700/50"
                      )}
                    >
                      <div className={cn(
                        "p-1.5 rounded-lg",
                        mode.value === 'observe' && "bg-violet-100 text-violet-600 dark:bg-violet-900/30 dark:text-violet-400",
                        mode.value === 'co_teach' && "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400",
                        mode.value === 'takeover' && "bg-blue-100 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400",
                      )}>
                        {mode.icon}
                      </div>
                      <div>
                        <p className="font-medium text-slate-900 dark:text-white text-sm">{mode.label}</p>
                        <p className="text-xs text-slate-500 dark:text-slate-400">{mode.description}</p>
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Struggle score */}
          <div className={cn(
            "px-2.5 py-1 rounded-lg text-sm font-bold",
            struggleColor === 'red' && "bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400",
            struggleColor === 'amber' && "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400",
            struggleColor === 'emerald' && "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400",
          )}>
            {Math.round(session.struggleScore)}%
          </div>

          {/* Controls */}
          <button
            onClick={() => setIsExpanded(!isExpanded)}
            className="p-2 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
          >
            {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
          </button>

          <button
            onClick={handleLeave}
            className="p-2 text-slate-400 hover:text-red-500 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Expanded content */}
      <AnimatePresence>
        {isExpanded && (
          <motion.div
            initial={{ height: 0 }}
            animate={{ height: 'auto' }}
            exit={{ height: 0 }}
            className="flex-1 flex flex-col overflow-hidden"
          >
            {/* Session status bar */}
            <div className="px-4 py-2 bg-slate-50 dark:bg-slate-800/50 flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <BookOpen className="w-4 h-4" />
                  {session.currentPhase}
                </span>
                <span className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400">
                  <Clock className="w-4 h-4" />
                  {session.lessonProgressPercent}% complete
                </span>
              </div>
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-white transition-colors"
              >
                {isMuted ? <VolumeX className="w-4 h-4" /> : <Volume2 className="w-4 h-4" />}
              </button>
            </div>

            {/* Events/Messages area */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {events.length === 0 ? (
                <div className="text-center py-8 text-slate-400">
                  <Eye className="w-8 h-8 mx-auto mb-2 opacity-50" />
                  <p>Observing session...</p>
                  <p className="text-sm">New events will appear here</p>
                </div>
              ) : (
                events.map((event) => (
                  <div
                    key={event.id}
                    className={cn(
                      "p-3 rounded-xl",
                      event.tutorId
                        ? "bg-emerald-50 dark:bg-emerald-900/20 ml-8"
                        : "bg-slate-100 dark:bg-slate-800 mr-8"
                    )}
                  >
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-1">
                      {event.tutorId ? 'You' : event.eventType === 'ai_message' ? 'AI Tutor' : 'Student'}
                    </p>
                    <p className="text-sm text-slate-700 dark:text-slate-300">
                      {event.content || event.eventType}
                    </p>
                  </div>
                ))
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Quick actions */}
            {currentMode !== 'observe' && (
              <div className="px-4 py-2 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {quickMessages.map((msg) => (
                    <button
                      key={msg.label}
                      onClick={() => handleQuickMessage(msg.message)}
                      className="flex-shrink-0 flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 dark:bg-slate-800 rounded-full text-sm hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
                    >
                      <span>{msg.emoji}</span>
                      <span className="text-slate-600 dark:text-slate-400">{msg.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* AI Guidance panel */}
            <AnimatePresence>
              {showAIGuidance && (
                <motion.div
                  initial={{ height: 0, opacity: 0 }}
                  animate={{ height: 'auto', opacity: 1 }}
                  exit={{ height: 0, opacity: 0 }}
                  className="px-4 py-3 bg-violet-50 dark:bg-violet-900/20 border-t border-violet-200 dark:border-violet-800"
                >
                  <p className="text-xs font-medium text-violet-700 dark:text-violet-300 mb-2 flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    Guide AI Behavior
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {aiGuidanceOptions.map((option) => (
                      <button
                        key={option.value}
                        onClick={() => handleAIGuidance(option.value)}
                        className="px-3 py-1.5 bg-white dark:bg-slate-800 text-violet-700 dark:text-violet-300 text-sm rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/50 transition-colors"
                        title={option.description}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Message input */}
            {currentMode !== 'observe' && (
              <div className="p-4 border-t border-slate-200 dark:border-slate-800">
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowAIGuidance(!showAIGuidance)}
                    className={cn(
                      "p-2.5 rounded-xl transition-colors",
                      showAIGuidance
                        ? "bg-violet-100 text-violet-600 dark:bg-violet-900/40 dark:text-violet-400"
                        : "bg-slate-100 dark:bg-slate-800 text-slate-400 hover:text-violet-600"
                    )}
                    title="Guide AI"
                  >
                    <Lightbulb className="w-5 h-5" />
                  </button>

                  <div className="flex-1 relative">
                    <input
                      type="text"
                      value={messageText}
                      onChange={(e) => setMessageText(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendMessage()}
                      placeholder={isVisibleToStudent ? "Message to student..." : "Private note..."}
                      className="w-full px-4 py-2.5 pr-24 bg-slate-100 dark:bg-slate-800 rounded-xl text-sm focus:ring-2 focus:ring-violet-500/20 focus:outline-none"
                    />
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                      <button
                        onClick={() => setIsVisibleToStudent(!isVisibleToStudent)}
                        className={cn(
                          "p-1.5 rounded-lg text-xs transition-colors",
                          isVisibleToStudent
                            ? "bg-emerald-100 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400"
                            : "bg-slate-200 dark:bg-slate-700 text-slate-500"
                        )}
                        title={isVisibleToStudent ? "Visible to student" : "Private note"}
                      >
                        {isVisibleToStudent ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
                      </button>
                    </div>
                  </div>

                  <button
                    onClick={handleSendMessage}
                    disabled={!messageText.trim()}
                    className="p-2.5 bg-violet-600 text-white rounded-xl hover:bg-violet-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    <Send className="w-5 h-5" />
                  </button>
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}

// Add missing import
function EyeOff(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24" />
      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68" />
      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61" />
      <line x1="2" x2="22" y1="2" y2="22" />
    </svg>
  );
}

export default ObservingSessionPanel;
