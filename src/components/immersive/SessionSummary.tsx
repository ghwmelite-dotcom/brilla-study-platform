import { motion } from 'framer-motion';
import {
  Clock,
  MessageCircle,
  Lightbulb,
  PenTool,
  Trophy,
  ArrowRight,
  X,
} from 'lucide-react';

interface SessionStats {
  startTime: number;
  questionsAsked: number;
  conceptsCovered: number;
  drawingsCreated: number;
  timeSpent: number;
}

interface SessionSummaryProps {
  stats: SessionStats;
  onClose: () => void;
  onContinue: () => void;
}

export function SessionSummary({ stats, onClose, onContinue }: SessionSummaryProps) {
  const formatTime = (minutes: number): string => {
    if (minutes < 1) return 'Less than a minute';
    if (minutes === 1) return '1 minute';
    if (minutes < 60) return `${minutes} minutes`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m`;
  };

  const getEncouragement = (): { emoji: string; message: string } => {
    if (stats.timeSpent >= 30) {
      return { emoji: '🏆', message: 'Amazing focus session!' };
    }
    if (stats.timeSpent >= 15) {
      return { emoji: '🌟', message: 'Great study session!' };
    }
    if (stats.questionsAsked >= 3) {
      return { emoji: '🧠', message: 'Curious mind at work!' };
    }
    return { emoji: '👍', message: 'Good start!' };
  };

  const encouragement = getEncouragement();

  const statItems = [
    {
      icon: Clock,
      label: 'Time Focused',
      value: formatTime(stats.timeSpent),
      color: 'text-blue-400',
      bgColor: 'bg-blue-500/20',
    },
    {
      icon: MessageCircle,
      label: 'Questions Asked',
      value: stats.questionsAsked.toString(),
      color: 'text-emerald-400',
      bgColor: 'bg-emerald-500/20',
    },
    {
      icon: Lightbulb,
      label: 'Concepts Explored',
      value: stats.conceptsCovered.toString(),
      color: 'text-amber-400',
      bgColor: 'bg-amber-500/20',
    },
    {
      icon: PenTool,
      label: 'Annotations Made',
      value: stats.drawingsCreated.toString(),
      color: 'text-violet-400',
      bgColor: 'bg-violet-500/20',
    },
  ];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 bg-slate-950/95 backdrop-blur-xl flex items-center justify-center p-4"
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ delay: 0.1, type: 'spring', damping: 20 }}
        className="w-full max-w-md bg-gradient-to-br from-slate-900 to-slate-800 rounded-3xl border border-white/10 shadow-2xl overflow-hidden"
      >
        {/* Header */}
        <div className="relative p-8 text-center bg-gradient-to-br from-violet-500/20 to-purple-500/10 border-b border-white/5">
          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full bg-white/5 hover:bg-white/10 text-white/40 hover:text-white/60 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Encouragement */}
          <motion.div
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ delay: 0.3, type: 'spring', damping: 10 }}
            className="text-5xl mb-4"
          >
            {encouragement.emoji}
          </motion.div>
          <h2 className="text-2xl font-semibold text-white mb-2">
            {encouragement.message}
          </h2>
          <p className="text-white/50">
            Session Complete
          </p>
        </div>

        {/* Stats */}
        <div className="p-6 space-y-4">
          {statItems.map((item, index) => {
            const Icon = item.icon;
            return (
              <motion.div
                key={item.label}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + index * 0.1 }}
                className="flex items-center gap-4 p-4 bg-white/5 rounded-2xl"
              >
                <div className={`w-12 h-12 rounded-xl ${item.bgColor} flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <p className="text-white/50 text-sm">{item.label}</p>
                  <p className="text-white text-lg font-semibold">{item.value}</p>
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Actions */}
        <div className="p-6 pt-2 space-y-3">
          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6 }}
            onClick={onContinue}
            className="w-full py-4 px-6 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 rounded-xl text-white font-semibold flex items-center justify-center gap-2 transition-all shadow-lg shadow-violet-500/25"
          >
            Continue Learning
            <ArrowRight className="w-5 h-5" />
          </motion.button>

          <motion.button
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.7 }}
            onClick={onClose}
            className="w-full py-4 px-6 bg-white/5 hover:bg-white/10 rounded-xl text-white/60 hover:text-white font-medium transition-all"
          >
            Exit to Dashboard
          </motion.button>
        </div>

        {/* Footer hint */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.5 }}
          transition={{ delay: 0.8 }}
          className="px-6 pb-6 text-center"
        >
          <p className="text-xs text-white/30 flex items-center justify-center gap-2">
            <Trophy className="w-3 h-3" />
            Keep up the great work!
          </p>
        </motion.div>
      </motion.div>
    </motion.div>
  );
}

export default SessionSummary;
