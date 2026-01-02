import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Users, ChevronRight } from 'lucide-react';
import { cn } from '@/utils';
import { Button } from '@/components/common';
import { useEngagementStore, type EngagementNudge, getNudgeIcon, getPriorityColor } from '@/stores/engagementStore';
import { Link } from 'react-router-dom';

interface FriendNudgeProps {
  nudge: EngagementNudge;
  onDismiss?: () => void;
  className?: string;
}

export function FriendNudge({ nudge, onDismiss, className }: FriendNudgeProps) {
  const { dismissNudge } = useEngagementStore();

  const handleDismiss = () => {
    dismissNudge(nudge.id);
    onDismiss?.();
  };

  if (nudge.dismissed) return null;

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={cn(
        'relative bg-white rounded-xl shadow-lg border border-neutral-200 overflow-hidden',
        className
      )}
    >
      {/* Priority indicator */}
      <div className={cn('absolute left-0 top-0 bottom-0 w-1', getPriorityColor(nudge.priority))} />

      <div className="p-4 pl-5">
        <div className="flex items-start gap-3">
          {/* Icon */}
          <div className="w-10 h-10 rounded-full bg-primary-100 flex items-center justify-center text-xl flex-shrink-0">
            {getNudgeIcon(nudge.type)}
          </div>

          {/* Content */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <h4 className="font-semibold text-neutral-900 truncate">{nudge.title}</h4>
              <button
                onClick={handleDismiss}
                className="p-0.5 rounded-full text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-sm text-neutral-500 mt-0.5 line-clamp-2">{nudge.message}</p>

            {/* Action */}
            <Link to={nudge.actionLink} onClick={handleDismiss}>
              <Button size="sm" variant="outline" className="mt-3">
                {nudge.actionLabel}
                <ChevronRight className="w-3 h-3 ml-1" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// Nudge container for displaying multiple nudges
interface NudgeContainerProps {
  className?: string;
  maxVisible?: number;
}

export function NudgeContainer({ className, maxVisible = 3 }: NudgeContainerProps) {
  const { nudges, clearExpiredNudges } = useEngagementStore();

  // Clear expired nudges on mount
  useEffect(() => {
    clearExpiredNudges();
  }, [clearExpiredNudges]);

  const visibleNudges = nudges
    .filter((n) => !n.dismissed)
    .slice(0, maxVisible);

  if (visibleNudges.length === 0) return null;

  return (
    <div className={cn('fixed bottom-4 right-4 z-40 space-y-3 w-80', className)}>
      <AnimatePresence>
        {visibleNudges.map((nudge) => (
          <FriendNudge key={nudge.id} nudge={nudge} />
        ))}
      </AnimatePresence>
    </div>
  );
}

// Compact nudge for inline display
interface CompactNudgeProps {
  nudge: EngagementNudge;
  className?: string;
}

export function CompactNudge({ nudge, className }: CompactNudgeProps) {
  const { dismissNudge } = useEngagementStore();

  if (nudge.dismissed) return null;

  return (
    <Link
      to={nudge.actionLink}
      onClick={() => dismissNudge(nudge.id)}
      className={cn(
        'flex items-center gap-3 p-3 rounded-lg border border-neutral-200 bg-white hover:shadow-md transition-shadow',
        className
      )}
    >
      <span className="text-lg">{getNudgeIcon(nudge.type)}</span>
      <div className="flex-1 min-w-0">
        <p className="font-medium text-neutral-900 truncate text-sm">{nudge.title}</p>
        <p className="text-xs text-neutral-500 truncate">{nudge.message}</p>
      </div>
      <ChevronRight className="w-4 h-4 text-neutral-400 flex-shrink-0" />
    </Link>
  );
}

// Friend activity nudge specifically
interface FriendActivityNudgeProps {
  friendName: string;
  friendAvatar?: string;
  activity: string;
  timestamp: string;
  onJoin?: () => void;
  className?: string;
}

export function FriendActivityNudge({
  friendName,
  friendAvatar,
  activity,
  timestamp,
  onJoin,
  className,
}: FriendActivityNudgeProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={cn(
        'bg-white rounded-xl shadow-lg border border-neutral-200 p-4',
        className
      )}
    >
      <div className="flex items-center gap-3">
        {/* Avatar */}
        <div className="relative">
          {friendAvatar ? (
            <img
              src={friendAvatar}
              alt={friendName}
              className="w-12 h-12 rounded-full object-cover"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-primary-100 flex items-center justify-center">
              <span className="text-primary font-bold">
                {friendName.split(' ').map((n) => n[0]).join('')}
              </span>
            </div>
          )}
          {/* Online indicator */}
          <div className="absolute bottom-0 right-0 w-3 h-3 rounded-full bg-emerald-500 border-2 border-white" />
        </div>

        {/* Content */}
        <div className="flex-1">
          <p className="font-medium text-neutral-900">{friendName}</p>
          <p className="text-sm text-neutral-500">{activity}</p>
          <p className="text-xs text-neutral-400">{timestamp}</p>
        </div>

        {/* Action */}
        <Button size="sm" onClick={onJoin}>
          <Users className="w-4 h-4 mr-1" />
          Join
        </Button>
      </div>
    </motion.div>
  );
}

export default FriendNudge;
