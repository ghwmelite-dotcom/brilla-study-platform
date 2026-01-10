import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  GraduationCap,
  ChevronRight,
  BookOpen,
  Target,
  TrendingUp,
  X,
  Sparkles,
  Award,
  CheckCircle2,
} from 'lucide-react';
import { useExamBoardStore } from '@/stores/examBoardStore';
import { cn } from '@/utils';

interface OALevelBannerProps {
  variant?: 'full' | 'compact' | 'card';
  dismissible?: boolean;
  className?: string;
}

export function OALevelBanner({
  variant = 'full',
  dismissible = true,
  className,
}: OALevelBannerProps) {
  const { setupComplete, userSpecifications, fetchUserSpecifications } = useExamBoardStore();
  const [isDismissed, setIsDismissed] = useState(false);

  // Check localStorage for dismissed state
  useEffect(() => {
    const dismissed = localStorage.getItem('oalevel_banner_dismissed');
    if (dismissed) {
      const dismissedDate = new Date(dismissed);
      const now = new Date();
      // Show again after 7 days
      if (now.getTime() - dismissedDate.getTime() < 7 * 24 * 60 * 60 * 1000) {
        setIsDismissed(true);
      }
    }
  }, []);

  // Fetch user specifications on mount
  useEffect(() => {
    fetchUserSpecifications();
  }, [fetchUserSpecifications]);

  const handleDismiss = () => {
    setIsDismissed(true);
    localStorage.setItem('oalevel_banner_dismissed', new Date().toISOString());
  };

  // Don't show if already set up or dismissed
  if (setupComplete || userSpecifications.length > 0 || isDismissed) {
    return null;
  }

  // Full banner variant - hero style
  if (variant === 'full') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-2xl bg-gradient-to-br from-blue-600 via-indigo-600 to-purple-700',
          'shadow-lg',
          className
        )}
      >
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl transform translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-white rounded-full blur-3xl transform -translate-x-1/2 translate-y-1/2" />
        </div>

        {/* Floating icons */}
        <div className="absolute top-4 right-16 opacity-20">
          <Award className="w-12 h-12 text-white animate-pulse" />
        </div>
        <div className="absolute bottom-4 right-8 opacity-20">
          <BookOpen className="w-10 h-10 text-white" />
        </div>

        {/* Content */}
        <div className="relative z-10 p-6 md:p-8">
          {dismissible && (
            <button
              onClick={handleDismiss}
              className="absolute top-4 right-4 p-1.5 rounded-full bg-white/10 hover:bg-white/20 transition-colors"
              aria-label="Dismiss"
            >
              <X className="w-4 h-4 text-white" />
            </button>
          )}

          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-6">
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-3">
                <div className="p-2.5 bg-white/20 rounded-xl backdrop-blur-sm">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <span className="px-3 py-1 bg-amber-400/90 text-amber-900 text-xs font-bold rounded-full uppercase tracking-wide">
                  New Feature
                </span>
              </div>

              <h2 className="text-2xl md:text-3xl font-bold text-white mb-2">
                Cambridge & Edexcel Exam Prep
              </h2>
              <p className="text-blue-100 text-sm md:text-base max-w-xl">
                Prepare for IGCSE, AS Level, and A-Level exams with syllabus-mapped content,
                past papers, and personalized grade predictions.
              </p>

              {/* Features list */}
              <div className="flex flex-wrap gap-4 mt-4">
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span>Official Syllabi</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span>Past Papers</span>
                </div>
                <div className="flex items-center gap-2 text-white/90 text-sm">
                  <CheckCircle2 className="w-4 h-4 text-green-300" />
                  <span>Grade Predictor</span>
                </div>
              </div>
            </div>

            <div className="flex flex-col gap-3">
              <Link
                to="/exam-setup"
                className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-white text-indigo-600 font-semibold rounded-xl hover:bg-blue-50 transition-all shadow-lg hover:shadow-xl hover:scale-[1.02] active:scale-[0.98]"
              >
                Set Up Now
                <ChevronRight className="w-5 h-5" />
              </Link>
              <p className="text-blue-200 text-xs text-center">
                Takes less than 2 minutes
              </p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Compact banner variant - slim bar
  if (variant === 'compact') {
    return (
      <div
        className={cn(
          'relative overflow-hidden rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600',
          className
        )}
      >
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <div className="p-1.5 bg-white/20 rounded-lg">
              <GraduationCap className="w-5 h-5 text-white" />
            </div>
            <div>
              <p className="text-white font-medium text-sm">
                O-Level & A-Level Prep Available!
              </p>
              <p className="text-blue-200 text-xs">
                Cambridge & Edexcel syllabi now supported
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <Link
              to="/exam-setup"
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-white text-indigo-600 font-medium text-sm rounded-lg hover:bg-blue-50 transition-colors"
            >
              Set Up
              <ChevronRight className="w-4 h-4" />
            </Link>
            {dismissible && (
              <button
                onClick={handleDismiss}
                className="p-1.5 rounded-lg hover:bg-white/10 transition-colors"
                aria-label="Dismiss"
              >
                <X className="w-4 h-4 text-white" />
              </button>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Card variant - sidebar style
  return (
    <div
      className={cn(
        'relative overflow-hidden rounded-xl border border-indigo-200 bg-gradient-to-br from-indigo-50 to-purple-50',
        className
      )}
    >
      {dismissible && (
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 rounded-full hover:bg-neutral-200/50 transition-colors z-10"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4 text-neutral-400" />
        </button>
      )}

      <div className="p-5">
        {/* Header */}
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2.5 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-xl shadow-md">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="font-bold text-neutral-900">O/A Level Prep</h3>
            <p className="text-xs text-neutral-500">Cambridge & Edexcel</p>
          </div>
        </div>

        {/* Description */}
        <p className="text-sm text-neutral-600 mb-4">
          Access syllabus-mapped content, past papers, and grade predictions for IGCSE and A-Level exams.
        </p>

        {/* Features */}
        <div className="space-y-2 mb-5">
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center">
              <Target className="w-3 h-3 text-green-600" />
            </div>
            <span className="text-neutral-700">Set target grades</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center">
              <BookOpen className="w-3 h-3 text-blue-600" />
            </div>
            <span className="text-neutral-700">Track syllabus progress</span>
          </div>
          <div className="flex items-center gap-2 text-sm">
            <div className="w-5 h-5 rounded-full bg-purple-100 flex items-center justify-center">
              <TrendingUp className="w-3 h-3 text-purple-600" />
            </div>
            <span className="text-neutral-700">Predict your grades</span>
          </div>
        </div>

        {/* CTA */}
        <Link
          to="/exam-setup"
          className="flex items-center justify-center gap-2 w-full px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium text-sm rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md hover:shadow-lg"
        >
          <Sparkles className="w-4 h-4" />
          Get Started
        </Link>
      </div>
    </div>
  );
}

export default OALevelBanner;
