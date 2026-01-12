import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Eye,
  Users,
  AlertTriangle,
  HandHelping,
  Search,
  Filter,
  RefreshCcw,
  Bell,
  Maximize2,
  Clock,
  BookOpen,
  GraduationCap,
  Loader2,
  X,
} from 'lucide-react';
import { useTutorClassroomStore } from '@/stores/tutorClassroomStore';
import { TutorAvailabilitySettings } from '@/components/tutor-classroom/TutorAvailabilitySettings';
import { cn } from '@/utils';

// Observable session card component
function ObservableSessionCard({
  session,
  isObserving,
  onStartObserving,
  onStopObserving,
}: {
  session: any;
  isObserving: boolean;
  onStartObserving: () => void;
  onStopObserving: () => void;
}) {
  const struggleColor = session.struggleScore >= 70 ? 'red' : session.struggleScore >= 40 ? 'amber' : 'emerald';

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden transition-all",
        isObserving
          ? "border-violet-500 ring-2 ring-violet-500/20"
          : "border-slate-200 dark:border-slate-800 hover:border-slate-300 dark:hover:border-slate-700"
      )}
    >
      {/* Session header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3">
            {/* Student avatar */}
            <div className="relative">
              {session.studentAvatarUrl ? (
                <img
                  src={session.studentAvatarUrl}
                  alt={session.studentName}
                  className="w-10 h-10 rounded-full object-cover"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white font-medium">
                  {session.studentName?.[0]?.toUpperCase() || 'S'}
                </div>
              )}
              {/* Active indicator */}
              <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full border-2 border-white dark:border-slate-900" />
            </div>
            <div>
              <h4 className="font-medium text-slate-900 dark:text-white">
                {session.studentName || 'Anonymous Student'}
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                {session.subjectName || 'Unknown Subject'}
              </p>
            </div>
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
        </div>
      </div>

      {/* Session details */}
      <div className="p-4 space-y-3">
        {/* Topic & Lesson */}
        <div className="flex items-center gap-2 text-sm text-slate-600 dark:text-slate-400">
          <BookOpen className="w-4 h-4 flex-shrink-0" />
          <span className="truncate">{session.topicName || session.lessonTitle || 'General Revision'}</span>
        </div>

        {/* Exam type & Phase */}
        <div className="flex items-center gap-4 text-sm">
          {session.examType && (
            <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
              <GraduationCap className="w-4 h-4" />
              {session.examType}
            </span>
          )}
          <span className="flex items-center gap-1.5 text-slate-500 dark:text-slate-400">
            <Clock className="w-4 h-4" />
            {session.currentPhase}
          </span>
        </div>

        {/* Progress bar */}
        <div className="space-y-1">
          <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400">
            <span>Lesson Progress</span>
            <span>{session.lessonProgressPercent}%</span>
          </div>
          <div className="h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
            <motion.div
              initial={{ width: 0 }}
              animate={{ width: `${session.lessonProgressPercent}%` }}
              className="h-full bg-violet-500 rounded-full"
            />
          </div>
        </div>

        {/* Struggle indicators */}
        {session.struggleScore >= 40 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {session.consecutiveWrongAnswers > 0 && (
              <span className="px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded text-xs">
                {session.consecutiveWrongAnswers} wrong answers
              </span>
            )}
            {session.timeStuckSeconds > 60 && (
              <span className="px-2 py-0.5 bg-amber-50 dark:bg-amber-900/20 text-amber-600 dark:text-amber-400 rounded text-xs">
                Stuck {Math.floor(session.timeStuckSeconds / 60)}m
              </span>
            )}
            {session.clarificationRequestsCount > 0 && (
              <span className="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded text-xs">
                {session.clarificationRequestsCount} clarifications
              </span>
            )}
          </div>
        )}

        {/* Last AI message preview */}
        {session.lastAiMessage && (
          <p className="text-xs text-slate-400 dark:text-slate-500 line-clamp-2 italic">
            AI: "{session.lastAiMessage}"
          </p>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        {isObserving ? (
          <>
            <button
              onClick={onStopObserving}
              className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
            >
              <X className="w-4 h-4" />
              Stop
            </button>
            <button
              className="flex items-center justify-center gap-2 px-4 py-2 bg-violet-600 text-white rounded-xl hover:bg-violet-700 transition-colors"
            >
              <Maximize2 className="w-4 h-4" />
              Focus
            </button>
          </>
        ) : (
          <button
            onClick={onStartObserving}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Start Observing
          </button>
        )}
      </div>
    </motion.div>
  );
}

// Handoff request card component
function HandoffRequestCard({
  request,
  onAccept,
  onDecline,
}: {
  request: any;
  onAccept: () => void;
  onDecline: () => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      className="bg-gradient-to-r from-amber-50 to-orange-50 dark:from-amber-900/20 dark:to-orange-900/20 rounded-xl border border-amber-200 dark:border-amber-800/50 p-4"
    >
      <div className="flex items-start gap-3">
        <div className="p-2 bg-amber-100 dark:bg-amber-900/40 rounded-lg">
          <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <h4 className="font-medium text-slate-900 dark:text-white">
              {request.studentName || 'Student'} needs help
            </h4>
            <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-bold rounded">
              {Math.round(request.struggleScore)}%
            </span>
          </div>
          <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">
            {request.subjectName} • {request.topicName || 'General'}
          </p>
          {request.handoffReason && (
            <p className="text-sm text-amber-700 dark:text-amber-400 mt-2">
              "{request.handoffReason}"
            </p>
          )}
          <div className="flex gap-2 mt-3">
            <button
              onClick={onAccept}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 text-white text-sm font-medium rounded-lg hover:bg-emerald-700 transition-colors"
            >
              <HandHelping className="w-4 h-4" />
              Accept
            </button>
            <button
              onClick={onDecline}
              className="px-3 py-1.5 bg-slate-200 dark:bg-slate-700 text-slate-600 dark:text-slate-300 text-sm font-medium rounded-lg hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors"
            >
              Decline
            </button>
          </div>
        </div>
        <span className="text-xs text-slate-400">
          {new Date(request.requestedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
        </span>
      </div>
    </motion.div>
  );
}

export function TutorObservationDashboard() {
  const {
    availability,
    observableSessions,
    isLoadingObservable,
    observations,
    pendingHandoffs,
    fetchObservableSessions,
    startObserving,
    stopObserving,
    fetchPendingHandoffs,
    acceptHandoff,
    declineHandoff,
    startPolling,
    stopPolling,
  } = useTutorClassroomStore();

  const [showSettings, setShowSettings] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExamType, setSelectedExamType] = useState<string | null>(null);

  // Start polling on mount
  useEffect(() => {
    fetchObservableSessions();
    fetchPendingHandoffs();
    startPolling();

    return () => {
      stopPolling();
    };
  }, [fetchObservableSessions, fetchPendingHandoffs, startPolling, stopPolling]);

  // Filter sessions
  const filteredSessions = observableSessions.filter(session => {
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (
        !session.studentName?.toLowerCase().includes(query) &&
        !session.subjectName?.toLowerCase().includes(query) &&
        !session.topicName?.toLowerCase().includes(query)
      ) {
        return false;
      }
    }
    if (selectedExamType && session.examType !== selectedExamType) {
      return false;
    }
    return true;
  });

  // Sort by struggle score (highest first)
  const sortedSessions = [...filteredSessions].sort((a, b) => b.struggleScore - a.struggleScore);

  // Stats
  const activeObservations = observations.size;
  const highStruggleSessions = observableSessions.filter(s => s.struggleScore >= 60).length;
  const isOnline = availability?.isOnline;

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950">
      {/* Header */}
      <header className="sticky top-0 z-40 bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border-b border-slate-200 dark:border-slate-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-xl">
                <Eye className="w-6 h-6 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <h1 className="text-xl font-bold text-slate-900 dark:text-white">
                  AI Classroom Observation
                </h1>
                <p className="text-sm text-slate-500 dark:text-slate-400">
                  Monitor and assist students learning with AI
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Status indicator */}
              <div className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium",
                isOnline
                  ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-500 dark:text-slate-400"
              )}>
                <div className={cn(
                  "w-2 h-2 rounded-full",
                  isOnline ? "bg-green-500 animate-pulse" : "bg-slate-400"
                )} />
                {isOnline ? 'Online' : 'Offline'}
              </div>

              {/* Notifications */}
              <button className="relative p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors">
                <Bell className="w-5 h-5" />
                {pendingHandoffs.length > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 text-white text-xs font-bold rounded-full flex items-center justify-center">
                    {pendingHandoffs.length}
                  </span>
                )}
              </button>

              {/* Settings */}
              <button
                onClick={() => setShowSettings(!showSettings)}
                className="p-2 text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
              >
                <Filter className="w-5 h-5" />
              </button>
            </div>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Settings panel */}
        <AnimatePresence>
          {showSettings && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              exit={{ opacity: 0, height: 0 }}
              className="mb-8"
            >
              <TutorAvailabilitySettings />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Stats row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-violet-100 dark:bg-violet-900/30 rounded-lg">
                <Users className="w-5 h-5 text-violet-600 dark:text-violet-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {observableSessions.length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Active Sessions</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/30 rounded-lg">
                <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {highStruggleSessions}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Need Help</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 dark:bg-emerald-900/30 rounded-lg">
                <Eye className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {activeObservations}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Observing</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-slate-900 rounded-xl border border-slate-200 dark:border-slate-800 p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <HandHelping className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-slate-900 dark:text-white">
                  {pendingHandoffs.length}
                </p>
                <p className="text-sm text-slate-500 dark:text-slate-400">Handoff Requests</p>
              </div>
            </div>
          </div>
        </div>

        {/* Handoff requests (if any) */}
        <AnimatePresence>
          {pendingHandoffs.length > 0 && (
            <motion.section
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mb-8"
            >
              <h2 className="text-lg font-semibold text-slate-900 dark:text-white mb-4 flex items-center gap-2">
                <HandHelping className="w-5 h-5 text-amber-500" />
                Handoff Requests
                <span className="px-2 py-0.5 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-sm font-bold rounded-full">
                  {pendingHandoffs.length}
                </span>
              </h2>
              <div className="space-y-3">
                {pendingHandoffs.map(request => (
                  <HandoffRequestCard
                    key={request.sessionId}
                    request={request}
                    onAccept={() => acceptHandoff(request.sessionId)}
                    onDecline={() => declineHandoff(request.sessionId)}
                  />
                ))}
              </div>
            </motion.section>
          )}
        </AnimatePresence>

        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student, subject, or topic..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl focus:ring-2 focus:ring-violet-500/20 focus:border-violet-500 transition-all"
            />
          </div>

          <div className="flex gap-2">
            {['WASSCE', 'BECE', 'IGCSE'].map(type => (
              <button
                key={type}
                onClick={() => setSelectedExamType(selectedExamType === type ? null : type)}
                className={cn(
                  "px-4 py-2.5 rounded-xl text-sm font-medium transition-colors",
                  selectedExamType === type
                    ? "bg-violet-600 text-white"
                    : "bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-400 hover:border-violet-300"
                )}
              >
                {type}
              </button>
            ))}

            <button
              onClick={() => fetchObservableSessions()}
              disabled={isLoadingObservable}
              className="p-2.5 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-white transition-colors"
            >
              <RefreshCcw className={cn("w-5 h-5", isLoadingObservable && "animate-spin")} />
            </button>
          </div>
        </div>

        {/* Sessions grid */}
        {isLoadingObservable && observableSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16">
            <Loader2 className="w-8 h-8 text-violet-500 animate-spin mb-4" />
            <p className="text-slate-500 dark:text-slate-400">Loading sessions...</p>
          </div>
        ) : sortedSessions.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="p-4 bg-slate-100 dark:bg-slate-800 rounded-2xl mb-4">
              <Users className="w-8 h-8 text-slate-400" />
            </div>
            <h3 className="text-lg font-medium text-slate-900 dark:text-white mb-2">
              No active sessions
            </h3>
            <p className="text-slate-500 dark:text-slate-400 max-w-sm">
              {searchQuery || selectedExamType
                ? "No sessions match your filters. Try adjusting your search."
                : "There are no students currently learning with AI. Check back later!"}
            </p>
          </div>
        ) : (
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {sortedSessions.map(session => (
                <ObservableSessionCard
                  key={session.id}
                  session={session}
                  isObserving={observations.has(session.id)}
                  onStartObserving={() => startObserving(session.id)}
                  onStopObserving={() => stopObserving(session.id)}
                />
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>
    </div>
  );
}

export default TutorObservationDashboard;
