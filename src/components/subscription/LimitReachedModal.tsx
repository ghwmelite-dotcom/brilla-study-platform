/**
 * Limit Reached Modal
 * Shows when user has used all daily questions
 */

import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { X, Crown, Clock, Zap, ArrowRight } from 'lucide-react';
import { Button } from '@/components/common';
import { useUsageStore } from '@/stores';
import { formatTimeUntilReset, DAILY_QUESTION_LIMIT } from '@/config';

interface LimitReachedModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpgrade?: () => void;
}

export function LimitReachedModal({
  isOpen,
  onClose,
  onUpgrade,
}: LimitReachedModalProps) {
  const navigate = useNavigate();
  const { dailyUsage } = useUsageStore();
  const [timeLeft, setTimeLeft] = useState('');

  useEffect(() => {
    if (!dailyUsage?.resetsAt) return;

    const updateTime = () => {
      setTimeLeft(formatTimeUntilReset(dailyUsage.resetsAt));
    };

    updateTime();
    const interval = setInterval(updateTime, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [dailyUsage?.resetsAt]);

  const handleUpgrade = () => {
    if (onUpgrade) {
      onUpgrade();
    } else {
      navigate('/pricing');
    }
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative bg-white rounded-2xl shadow-xl max-w-md w-full overflow-hidden animate-in zoom-in-95">
        {/* Close button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1 rounded-full hover:bg-neutral-100 transition-colors z-10"
        >
          <X className="w-5 h-5 text-neutral-500" />
        </button>

        {/* Header with gradient */}
        <div className="bg-gradient-to-br from-amber-500 to-orange-500 px-6 pt-8 pb-12 text-white text-center">
          <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <Zap className="w-8 h-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Daily Limit Reached</h2>
          <p className="text-white/90">
            You've used all {DAILY_QUESTION_LIMIT} questions for today
          </p>
        </div>

        {/* Content */}
        <div className="px-6 py-6 -mt-6 bg-white rounded-t-3xl relative">
          {/* Timer */}
          <div className="flex items-center justify-center gap-2 mb-6 p-3 bg-neutral-50 rounded-xl">
            <Clock className="w-5 h-5 text-neutral-500" />
            <span className="text-neutral-600">Questions reset in</span>
            <span className="font-bold text-neutral-900">{timeLeft}</span>
          </div>

          {/* Premium benefits */}
          <div className="mb-6">
            <h3 className="font-semibold text-neutral-900 mb-3">
              Upgrade to Premium for:
            </h3>
            <ul className="space-y-2">
              {[
                'Unlimited daily questions',
                'Access to all subjects (not just core)',
                'AI Essay Grading',
                'Advanced analytics',
                'Priority support',
              ].map((benefit, i) => (
                <li key={i} className="flex items-center gap-2 text-neutral-700">
                  <div className="w-5 h-5 rounded-full bg-emerald-100 flex items-center justify-center">
                    <svg className="w-3 h-3 text-emerald-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                  <span>{benefit}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* CTAs */}
          <div className="space-y-3">
            <Button
              onClick={handleUpgrade}
              className="w-full bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 text-white"
            >
              <Crown className="w-4 h-4 mr-2" />
              Upgrade to Premium
              <ArrowRight className="w-4 h-4 ml-2" />
            </Button>
            <button
              onClick={onClose}
              className="w-full py-2 text-neutral-500 hover:text-neutral-700 text-sm font-medium transition-colors"
            >
              I'll wait for tomorrow
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default LimitReachedModal;
