import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Clock, Zap, Crown, X, Gift, Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';

interface TrialBannerProps {
  variant?: 'minimal' | 'full' | 'floating';
  onDismiss?: () => void;
}

export function TrialBanner({ variant = 'full', onDismiss }: TrialBannerProps) {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthStore();
  const { subscriptionStatus, trialStatus, fetchStatus } = useSubscriptionStore();
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [isAuthenticated, fetchStatus]);

  // Don't show if already subscribed
  if (subscriptionStatus?.status === 'active') return null;

  // Don't show if dismissed
  if (dismissed) return null;

  const handleDismiss = () => {
    setDismissed(true);
    onDismiss?.();
  };

  // Trial is active
  if (subscriptionStatus?.status === 'trial' && trialStatus) {
    const daysRemaining = trialStatus.daysRemaining;
    const isUrgent = daysRemaining <= 3;
    const discountPercent = trialStatus.discountPercent || 0;

    if (variant === 'minimal') {
      return (
        <div
          className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-sm font-medium ${
            isUrgent
              ? 'bg-red-100 text-red-700'
              : 'bg-accent-100 text-accent-dark'
          }`}
        >
          <Clock className="w-3.5 h-3.5" />
          <span>{daysRemaining} days left</span>
          {discountPercent > 0 && (
            <span className="bg-accent text-white px-2 py-0.5 rounded-full text-xs">
              {discountPercent}% OFF
            </span>
          )}
        </div>
      );
    }

    if (variant === 'floating') {
      return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div
            className={`rounded-2xl shadow-lg p-4 ${
              isUrgent
                ? 'bg-gradient-to-r from-red-500 to-orange-500'
                : 'bg-gradient-to-r from-primary to-accent'
            } text-white`}
          >
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-white/20 rounded-full transition-colors"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Clock className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold">
                  {isUrgent ? 'Trial Ending Soon!' : 'Free Trial Active'}
                </p>
                <p className="text-sm text-white/80">
                  {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} remaining
                </p>
              </div>
            </div>

            {discountPercent > 0 && (
              <div className="bg-white/20 rounded-lg p-2 mb-3 text-sm">
                <Gift className="w-4 h-4 inline mr-1" />
                Subscribe now and get {discountPercent}% off!
              </div>
            )}

            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-2 bg-white text-primary rounded-lg font-semibold hover:bg-neutral-100 transition-colors"
            >
              Upgrade Now
            </button>
          </div>
        </div>
      );
    }

    // Full variant
    return (
      <div
        className={`relative rounded-xl p-4 ${
          isUrgent
            ? 'bg-gradient-to-r from-red-500 to-orange-500'
            : 'bg-gradient-to-r from-primary to-accent'
        } text-white`}
      >
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">
                {isUrgent ? 'Your Trial is Ending Soon!' : 'Free Trial Active'}
              </h3>
              <p className="text-white/80">
                {daysRemaining} {daysRemaining === 1 ? 'day' : 'days'} left to explore premium features
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {discountPercent > 0 && (
              <div className="bg-white/20 rounded-full px-4 py-2 text-sm font-medium">
                <Gift className="w-4 h-4 inline mr-1" />
                {discountPercent}% Early Bird Discount
              </div>
            )}
            <button
              onClick={() => navigate('/pricing')}
              className="px-6 py-2 bg-white text-primary rounded-lg font-semibold hover:bg-neutral-100 transition-colors flex items-center gap-2"
            >
              <Crown className="w-4 h-4" />
              Upgrade Now
            </button>
          </div>
        </div>
      </div>
    );
  }

  // No trial started - show trial prompt
  if (subscriptionStatus?.status === 'free') {
    if (variant === 'minimal') {
      return (
        <button
          onClick={() => navigate('/pricing')}
          className="inline-flex items-center gap-2 px-3 py-1.5 bg-primary text-white rounded-full text-sm font-medium hover:bg-primary-dark transition-colors"
        >
          <Zap className="w-3.5 h-3.5" />
          <span>Start Free Trial</span>
        </button>
      );
    }

    if (variant === 'floating') {
      return (
        <div className="fixed bottom-4 right-4 z-50 max-w-sm">
          <div className="bg-white rounded-2xl shadow-lg p-4 border border-neutral-200">
            <button
              onClick={handleDismiss}
              className="absolute top-2 right-2 p-1 hover:bg-neutral-100 rounded-full transition-colors"
            >
              <X className="w-4 h-4 text-neutral-400" />
            </button>

            <div className="flex items-center gap-3 mb-3">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-neutral-900">Unlock Premium Features</p>
                <p className="text-sm text-neutral-500">14 days free, no credit card needed</p>
              </div>
            </div>

            <button
              onClick={() => navigate('/pricing')}
              className="w-full py-2 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors"
            >
              Start Free Trial
            </button>
          </div>
        </div>
      );
    }

    // Full variant
    return (
      <div className="relative bg-gradient-to-r from-primary to-accent rounded-xl p-4 text-white">
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-1 hover:bg-white/20 rounded-full transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex items-center justify-between flex-wrap gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-semibold text-lg">Unlock Your Full Potential</h3>
              <p className="text-white/80">Start your 14-day free trial today</p>
            </div>
          </div>

          <button
            onClick={() => navigate('/pricing')}
            className="px-6 py-2 bg-white text-primary rounded-lg font-semibold hover:bg-neutral-100 transition-colors flex items-center gap-2"
          >
            <Zap className="w-4 h-4" />
            Start Free Trial
          </button>
        </div>
      </div>
    );
  }

  return null;
}

export default TrialBanner;
