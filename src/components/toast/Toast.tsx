import { useEffect, useState } from 'react';
import {
  Trophy,
  Star,
  Flame,
  Sparkles,
  X,
  CheckCircle,
  AlertCircle,
  AlertTriangle,
  Info,
  TrendingUp,
  Zap,
} from 'lucide-react';
import type { Toast as ToastType } from '@/stores/toastStore';
import { cn } from '@/utils';

interface ToastProps {
  toast: ToastType;
  onClose: () => void;
}

// Achievement icon mapping
const achievementIcons: Record<string, React.ReactNode> = {
  first_steps: <Star className="w-8 h-8 text-yellow-400" />,
  quiz_master: <Trophy className="w-8 h-8 text-amber-400" />,
  streak_starter: <Flame className="w-8 h-8 text-orange-400" />,
  knowledge_seeker: <Sparkles className="w-8 h-8 text-purple-400" />,
  battle_champion: <Trophy className="w-8 h-8 text-indigo-400" />,
  default: <Trophy className="w-8 h-8 text-yellow-400" />,
};

export function Toast({ toast, onClose }: ToastProps) {
  const [isExiting, setIsExiting] = useState(false);
  const [progress, setProgress] = useState(100);

  useEffect(() => {
    if (toast.duration && toast.duration > 0) {
      const startTime = Date.now();
      const interval = setInterval(() => {
        const elapsed = Date.now() - startTime;
        const remaining = Math.max(0, 100 - (elapsed / toast.duration!) * 100);
        setProgress(remaining);
      }, 50);

      return () => clearInterval(interval);
    }
  }, [toast.duration]);

  const handleClose = () => {
    setIsExiting(true);
    setTimeout(onClose, 300);
  };

  // Render based on toast type
  if (toast.type === 'achievement') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl shadow-2xl',
          'bg-gradient-to-r from-yellow-500 via-amber-500 to-orange-500',
          'transform transition-all duration-300',
          isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
          'animate-bounce-in'
        )}
      >
        {/* Sparkle effect background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(255,255,255,0.3),transparent_50%)]" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_50%,rgba(255,255,255,0.2),transparent_50%)]" />

        <div className="relative flex items-center gap-4 p-4 min-w-[320px]">
          {/* Achievement Icon */}
          <div className="flex-shrink-0 w-16 h-16 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center animate-pulse-glow">
            {toast.achievement && achievementIcons[toast.achievement.id] || achievementIcons.default}
          </div>

          {/* Content */}
          <div className="flex-1 text-white">
            <div className="flex items-center gap-2 mb-1">
              <Star className="w-4 h-4 animate-spin-slow" />
              <span className="text-sm font-medium uppercase tracking-wider opacity-90">
                Achievement Unlocked
              </span>
            </div>
            <h3 className="text-lg font-bold">{toast.achievement?.name || toast.message}</h3>
            {toast.achievement?.description && (
              <p className="text-sm opacity-80 mt-0.5">{toast.achievement.description}</p>
            )}
            {toast.achievement?.xpReward && (
              <div className="flex items-center gap-1 mt-1 text-sm font-medium">
                <Zap className="w-4 h-4" />
                +{toast.achievement.xpReward} XP
              </div>
            )}
          </div>

          {/* Close button */}
          <button
            onClick={handleClose}
            className="flex-shrink-0 p-1 rounded-full hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {/* Progress bar */}
        {toast.duration && toast.duration > 0 && (
          <div className="h-1 bg-black/20">
            <div
              className="h-full bg-white/50 transition-all duration-100"
              style={{ width: `${progress}%` }}
            />
          </div>
        )}
      </div>
    );
  }

  if (toast.type === 'level_up') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl shadow-2xl',
          'bg-gradient-to-r from-purple-600 via-indigo-600 to-blue-600',
          'transform transition-all duration-300',
          isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
          'animate-bounce-in'
        )}
      >
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,rgba(255,255,255,0.2),transparent_70%)]" />

        <div className="relative flex items-center gap-4 p-4 min-w-[280px]">
          <div className="flex-shrink-0 w-14 h-14 rounded-full bg-white/20 flex items-center justify-center">
            <TrendingUp className="w-8 h-8 text-white animate-bounce" />
          </div>

          <div className="flex-1 text-white">
            <div className="text-sm font-medium uppercase tracking-wider opacity-90">Level Up!</div>
            <div className="text-2xl font-bold">Level {toast.newLevel}</div>
          </div>

          <button onClick={handleClose} className="p-1 rounded-full hover:bg-white/20">
            <X className="w-5 h-5 text-white" />
          </button>
        </div>

        {toast.duration && toast.duration > 0 && (
          <div className="h-1 bg-black/20">
            <div className="h-full bg-white/50 transition-all duration-100" style={{ width: `${progress}%` }} />
          </div>
        )}
      </div>
    );
  }

  if (toast.type === 'xp') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-lg shadow-lg',
          'bg-gradient-to-r from-green-500 to-emerald-500',
          'transform transition-all duration-300',
          isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
          'animate-slide-in'
        )}
      >
        <div className="flex items-center gap-3 px-4 py-3 text-white min-w-[200px]">
          <Zap className="w-6 h-6 animate-pulse" />
          <div>
            <div className="font-bold">{toast.title}</div>
            {toast.message && <div className="text-sm opacity-80">{toast.message}</div>}
          </div>
        </div>
      </div>
    );
  }

  if (toast.type === 'streak') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl shadow-lg',
          'bg-gradient-to-r from-orange-500 to-red-500',
          'transform transition-all duration-300',
          isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
          'animate-bounce-in'
        )}
      >
        <div className="flex items-center gap-4 p-4 text-white min-w-[260px]">
          <div className="flex-shrink-0 w-12 h-12 rounded-full bg-white/20 flex items-center justify-center">
            <Flame className="w-7 h-7 animate-pulse" />
          </div>
          <div>
            <div className="text-xl font-bold">{toast.title}</div>
            <div className="text-sm opacity-80">{toast.message}</div>
          </div>
          <button onClick={handleClose} className="ml-auto p-1 rounded-full hover:bg-white/20">
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // Standard toasts (success, error, warning, info)
  const typeStyles = {
    success: {
      bg: 'bg-green-50 border-green-200',
      icon: <CheckCircle className="w-5 h-5 text-green-500" />,
      text: 'text-green-800',
    },
    error: {
      bg: 'bg-red-50 border-red-200',
      icon: <AlertCircle className="w-5 h-5 text-red-500" />,
      text: 'text-red-800',
    },
    warning: {
      bg: 'bg-amber-50 border-amber-200',
      icon: <AlertTriangle className="w-5 h-5 text-amber-500" />,
      text: 'text-amber-800',
    },
    info: {
      bg: 'bg-blue-50 border-blue-200',
      icon: <Info className="w-5 h-5 text-blue-500" />,
      text: 'text-blue-800',
    },
  };

  const style = typeStyles[toast.type as keyof typeof typeStyles] || typeStyles.info;

  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-lg border shadow-lg',
        style.bg,
        'transform transition-all duration-300',
        isExiting ? 'translate-x-full opacity-0' : 'translate-x-0 opacity-100',
        'animate-slide-in'
      )}
    >
      <div className="flex items-start gap-3 p-4 min-w-[280px]">
        <div className="flex-shrink-0 mt-0.5">{style.icon}</div>
        <div className="flex-1">
          <h4 className={cn('font-medium', style.text)}>{toast.title}</h4>
          {toast.message && <p className={cn('text-sm mt-0.5 opacity-80', style.text)}>{toast.message}</p>}
        </div>
        <button
          onClick={handleClose}
          className={cn('flex-shrink-0 p-1 rounded hover:bg-black/5', style.text)}
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {toast.duration && toast.duration > 0 && (
        <div className="h-0.5 bg-black/10">
          <div
            className={cn(
              'h-full transition-all duration-100',
              toast.type === 'success' && 'bg-green-500',
              toast.type === 'error' && 'bg-red-500',
              toast.type === 'warning' && 'bg-amber-500',
              toast.type === 'info' && 'bg-blue-500'
            )}
            style={{ width: `${progress}%` }}
          />
        </div>
      )}
    </div>
  );
}
