import { motion } from 'framer-motion';
import {
  Calendar,
  Clock,
  Video,
  Sparkles,
  Users,
  BookOpen,
  Play,
  Settings,
  Trash2,
  ExternalLink,
} from 'lucide-react';
import { cn } from '@/utils';

interface ScheduledSessionCardProps {
  session: {
    id: string;
    tutorId: string;
    studentId: string;
    subjectName?: string;
    topicName?: string;
    examType?: string;
    title?: string;
    description?: string;
    scheduledDatetime: string;
    scheduledDurationMinutes: number;
    roomCode?: string;
    aiCopilotEnabled: boolean;
    status: string;
    studentName?: string;
    studentAvatarUrl?: string;
  };
  role: 'tutor' | 'student';
  onStart?: () => void;
  onJoin?: () => void;
  onEdit?: () => void;
  onCancel?: () => void;
  className?: string;
}

export function ScheduledSessionCard({
  session,
  role,
  onStart,
  onJoin,
  onEdit,
  onCancel,
  className,
}: ScheduledSessionCardProps) {
  const scheduledDate = new Date(session.scheduledDatetime);
  const now = new Date();
  const isUpcoming = scheduledDate > now;
  const isToday = scheduledDate.toDateString() === now.toDateString();
  const isSoon = scheduledDate.getTime() - now.getTime() < 15 * 60 * 1000; // Within 15 minutes

  const formatDate = (date: Date) => {
    if (isToday) {
      return 'Today';
    }
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);
    if (date.toDateString() === tomorrow.toDateString()) {
      return 'Tomorrow';
    }
    return date.toLocaleDateString(undefined, {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
    });
  };

  const formatTime = (date: Date) => {
    return date.toLocaleTimeString(undefined, {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const statusColors = {
    scheduled: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
    waiting: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    active: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    completed: 'bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400',
    cancelled: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
  };

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        "bg-white dark:bg-slate-900 rounded-2xl border overflow-hidden",
        isSoon && isUpcoming
          ? "border-emerald-500 ring-2 ring-emerald-500/20"
          : "border-slate-200 dark:border-slate-800",
        className
      )}
    >
      {/* Header with date/time */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className={cn(
            "p-2.5 rounded-xl",
            isToday
              ? "bg-emerald-100 dark:bg-emerald-900/30"
              : "bg-violet-100 dark:bg-violet-900/30"
          )}>
            <Calendar className={cn(
              "w-5 h-5",
              isToday
                ? "text-emerald-600 dark:text-emerald-400"
                : "text-violet-600 dark:text-violet-400"
            )} />
          </div>
          <div>
            <p className="font-semibold text-slate-900 dark:text-white">
              {formatDate(scheduledDate)}
            </p>
            <div className="flex items-center gap-2 text-sm text-slate-500 dark:text-slate-400">
              <Clock className="w-3.5 h-3.5" />
              {formatTime(scheduledDate)}
              <span className="text-slate-300 dark:text-slate-600">•</span>
              {session.scheduledDurationMinutes} min
            </div>
          </div>
        </div>

        <span className={cn(
          "px-2.5 py-1 rounded-full text-xs font-medium",
          statusColors[session.status as keyof typeof statusColors] || statusColors.scheduled
        )}>
          {session.status === 'scheduled' && isSoon ? 'Starting Soon' : session.status}
        </span>
      </div>

      {/* Session details */}
      <div className="p-4 space-y-3">
        {/* Title */}
        <h3 className="font-semibold text-slate-900 dark:text-white">
          {session.title || `${session.subjectName} Session`}
        </h3>

        {/* Subject & Topic */}
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1.5 px-2.5 py-1 bg-slate-100 dark:bg-slate-800 rounded-lg text-sm text-slate-600 dark:text-slate-400">
            <BookOpen className="w-3.5 h-3.5" />
            {session.subjectName || 'General'}
          </span>
          {session.examType && (
            <span className="px-2.5 py-1 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 rounded-lg text-sm">
              {session.examType}
            </span>
          )}
          {session.aiCopilotEnabled && (
            <span className="flex items-center gap-1 px-2.5 py-1 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 rounded-lg text-sm">
              <Sparkles className="w-3.5 h-3.5" />
              AI Co-pilot
            </span>
          )}
        </div>

        {/* Description */}
        {session.description && (
          <p className="text-sm text-slate-600 dark:text-slate-400 line-clamp-2">
            {session.description}
          </p>
        )}

        {/* Participant info */}
        <div className="flex items-center gap-2 pt-2">
          {role === 'tutor' ? (
            <>
              {session.studentAvatarUrl ? (
                <img
                  src={session.studentAvatarUrl}
                  alt={session.studentName}
                  className="w-8 h-8 rounded-full"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-violet-400 to-purple-500 flex items-center justify-center text-white text-xs font-medium">
                  {session.studentName?.[0]?.toUpperCase() || 'S'}
                </div>
              )}
              <span className="text-sm text-slate-600 dark:text-slate-400">
                with <span className="font-medium text-slate-900 dark:text-white">{session.studentName || 'Student'}</span>
              </span>
            </>
          ) : (
            <span className="flex items-center gap-1.5 text-sm text-slate-600 dark:text-slate-400">
              <Users className="w-4 h-4" />
              Tutoring Session
            </span>
          )}
        </div>

        {/* Room code */}
        {session.roomCode && (
          <div className="flex items-center gap-2 p-2 bg-slate-50 dark:bg-slate-800/50 rounded-lg">
            <span className="text-xs text-slate-500 dark:text-slate-400">Room Code:</span>
            <code className="text-sm font-mono font-bold text-violet-600 dark:text-violet-400">
              {session.roomCode}
            </code>
          </div>
        )}
      </div>

      {/* Actions */}
      <div className="p-4 pt-0 flex gap-2">
        {session.status === 'scheduled' && isUpcoming && (
          <>
            {role === 'tutor' ? (
              <>
                {isSoon ? (
                  <button
                    onClick={onStart}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-colors"
                  >
                    <Play className="w-4 h-4" />
                    Start Session
                  </button>
                ) : (
                  <button
                    onClick={onEdit}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-violet-100 dark:bg-violet-900/30 text-violet-700 dark:text-violet-400 font-medium rounded-xl hover:bg-violet-200 dark:hover:bg-violet-900/50 transition-colors"
                  >
                    <Settings className="w-4 h-4" />
                    Edit
                  </button>
                )}
                <button
                  onClick={onCancel}
                  className="p-2.5 text-slate-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 className="w-5 h-5" />
                </button>
              </>
            ) : (
              <>
                {isSoon && session.roomCode ? (
                  <button
                    onClick={onJoin}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-emerald-600 to-teal-600 text-white font-medium rounded-xl hover:from-emerald-700 hover:to-teal-700 transition-colors"
                  >
                    <Video className="w-4 h-4" />
                    Join Session
                  </button>
                ) : (
                  <div className="flex-1 text-center py-2.5 text-slate-400 text-sm">
                    Session starts {formatDate(scheduledDate)} at {formatTime(scheduledDate)}
                  </div>
                )}
              </>
            )}
          </>
        )}

        {session.status === 'waiting' && (
          <button
            onClick={role === 'tutor' ? onStart : onJoin}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 text-white font-medium rounded-xl hover:from-amber-600 hover:to-orange-600 transition-colors animate-pulse"
          >
            <Video className="w-4 h-4" />
            {role === 'tutor' ? 'Resume Session' : 'Join Now'}
          </button>
        )}

        {session.status === 'active' && (
          <button
            onClick={onJoin}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 bg-gradient-to-r from-green-600 to-emerald-600 text-white font-medium rounded-xl hover:from-green-700 hover:to-emerald-700 transition-colors"
          >
            <ExternalLink className="w-4 h-4" />
            Rejoin Session
          </button>
        )}

        {session.status === 'completed' && (
          <div className="flex-1 text-center py-2 text-slate-400 text-sm">
            Session completed
          </div>
        )}
      </div>
    </motion.div>
  );
}

export default ScheduledSessionCard;
