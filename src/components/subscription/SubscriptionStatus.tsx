import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Crown, Clock, Zap, ArrowRight, Settings, CreditCard } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';

export function SubscriptionStatus() {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const {
    subscriptionStatus,
    trialStatus,
    isLoading,
    fetchStatus,
    fetchPaymentHistory,
  } = useSubscriptionStore();

  useEffect(() => {
    fetchStatus();
    fetchPaymentHistory();
  }, [fetchStatus, fetchPaymentHistory]);

  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-card p-6 animate-pulse">
        <div className="h-6 bg-neutral-200 rounded w-1/3 mb-4"></div>
        <div className="h-4 bg-neutral-200 rounded w-2/3 mb-2"></div>
        <div className="h-4 bg-neutral-200 rounded w-1/2"></div>
      </div>
    );
  }

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  // Active subscription
  if (subscriptionStatus?.status === 'active') {
    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-accent to-accent-dark p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Crown className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Premium Active</h3>
              <p className="text-sm text-white/80">{subscriptionStatus.planName}</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Plan Type</p>
              <p className="font-semibold text-neutral-900">
                {user?.role === 'teacher' ? 'Teacher Premium' : 'Student Premium'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Billing Cycle</p>
              <p className="font-semibold text-neutral-900 capitalize">
                {subscriptionStatus.billingCycle || 'Monthly'}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Started</p>
              <p className="font-semibold text-neutral-900">
                {formatDate(subscriptionStatus.startedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Renews On</p>
              <p className="font-semibold text-neutral-900">
                {formatDate(subscriptionStatus.expiresAt)}
              </p>
            </div>
          </div>

          <div className="border-t border-neutral-100 pt-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-sm text-neutral-500">
                <CreditCard className="w-4 h-4" />
                <span>Auto-renewal enabled</span>
              </div>
              <button
                onClick={() => navigate('/settings')}
                className="text-sm text-primary hover:underline flex items-center gap-1"
              >
                <Settings className="w-4 h-4" />
                Manage
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Trial active
  if (subscriptionStatus?.status === 'trial' && trialStatus) {
    const daysRemaining = trialStatus.daysRemaining;
    const progress = ((14 - daysRemaining) / 14) * 100;

    return (
      <div className="bg-white rounded-xl shadow-card overflow-hidden">
        <div className="bg-gradient-to-r from-primary to-accent p-4 text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
              <Clock className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-semibold">Free Trial</h3>
              <p className="text-sm text-white/80">{daysRemaining} days remaining</p>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-neutral-500">Trial Progress</span>
              <span className="font-medium text-neutral-900">
                Day {14 - daysRemaining} of 14
              </span>
            </div>
            <div className="h-2 bg-neutral-100 rounded-full overflow-hidden">
              <div
                className="h-full bg-gradient-to-r from-primary to-accent rounded-full transition-all"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-neutral-500">Started</p>
              <p className="font-semibold text-neutral-900">
                {formatDate(trialStatus.startedAt)}
              </p>
            </div>
            <div>
              <p className="text-sm text-neutral-500">Expires</p>
              <p className="font-semibold text-neutral-900">
                {formatDate(trialStatus.expiresAt)}
              </p>
            </div>
          </div>

          {trialStatus.discountPercent && trialStatus.discountPercent > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <p className="text-sm text-green-700">
                <span className="font-semibold">{trialStatus.discountPercent}% Early Bird Discount</span>
                {' '}available if you subscribe now!
              </p>
            </div>
          )}

          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            Upgrade to Premium
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Free tier
  return (
    <div className="bg-white rounded-xl shadow-card overflow-hidden">
      <div className="bg-neutral-100 p-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-neutral-200 rounded-full flex items-center justify-center">
            <Zap className="w-5 h-5 text-neutral-500" />
          </div>
          <div>
            <h3 className="font-semibold text-neutral-900">Free Plan</h3>
            <p className="text-sm text-neutral-500">Limited features</p>
          </div>
        </div>
      </div>

      <div className="p-6 space-y-4">
        <p className="text-neutral-600">
          Upgrade to unlock AI grading, advanced analytics, and premium study materials.
        </p>

        <div className="space-y-2">
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 bg-primary text-white rounded-lg font-semibold hover:bg-primary-dark transition-colors flex items-center justify-center gap-2"
          >
            Start 14-Day Free Trial
            <ArrowRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/pricing')}
            className="w-full py-3 bg-neutral-100 text-neutral-700 rounded-lg font-medium hover:bg-neutral-200 transition-colors"
          >
            View Plans
          </button>
        </div>
      </div>
    </div>
  );
}

export default SubscriptionStatus;
