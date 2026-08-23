import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, Zap, Crown, Star, ArrowRight, Clock, Gift, Sparkles } from 'lucide-react';
import { useSubscriptionStore } from '@/stores/subscriptionStore';
import { useAuthStore } from '@/stores/authStore';
import type { SubscriptionPlan } from '@/types';

type BillingCycle = 'monthly' | 'yearly';

function getPlanBillingCycle(plan: SubscriptionPlan): BillingCycle {
  if (plan.priceYearly != null && plan.priceMonthly == null) {
    return 'yearly';
  }
  return 'monthly';
}

function getPlanPrice(plan: SubscriptionPlan): number | null {
  const billingCycle = getPlanBillingCycle(plan);
  const price = billingCycle === 'yearly' ? plan.priceYearly : plan.priceMonthly;
  return typeof price === 'number' && price > 0 ? price : null;
}

export default function Pricing() {
  const navigate = useNavigate();
  const { user, isAuthenticated } = useAuthStore();
  const {
    plans,
    subscriptionStatus,
    trialStatus,
    fetchPlans,
    fetchStatus,
    startTrial,
    initializePayment,
  } = useSubscriptionStore();

  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPlans();
    if (isAuthenticated) {
      fetchStatus();
    }
  }, [fetchPlans, fetchStatus, isAuthenticated]);

  const handleStartTrial = async () => {
    if (!isAuthenticated) {
      navigate('/register?trial=true');
      return;
    }

    const success = await startTrial();
    if (success) {
      navigate('/dashboard');
    }
  };

  const handleSelectPlan = async (plan: SubscriptionPlan) => {
    if (!isAuthenticated) {
      navigate('/register?plan=' + plan.id);
      return;
    }

    const billingCycle = getPlanBillingCycle(plan);
    setSelectedPlan(plan.id);
    setIsProcessing(true);

    const result = await initializePayment(plan.id, billingCycle);

    if (result?.authorizationUrl) {
      // Redirect to Paystack checkout
      window.location.href = result.authorizationUrl;
    } else {
      setIsProcessing(false);
      setSelectedPlan(null);
    }
  };

  // Filter plans based on user role
  const userRole = user?.role || 'student';
  const filteredPlans = plans.filter(plan => {
    if (plan.id === 'tier_free') return true;
    return plan.userType === userRole;
  });

  const monthlyPlanPrice = filteredPlans.find(
    plan => getPlanBillingCycle(plan) === 'monthly' && getPlanPrice(plan) != null,
  )?.priceMonthly ?? null;

  const hasTrialAvailable = !trialStatus && subscriptionStatus?.status === 'free';
  const isOnTrial = subscriptionStatus?.status === 'trial';
  const isSubscribed = subscriptionStatus?.status === 'active';

  // Early bird discount
  const discountPercent = trialStatus?.discountPercent || 0;

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white py-12 px-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-neutral-900 mb-4">
            Choose Your Learning Journey
          </h1>
          <p className="text-lg text-neutral-600 max-w-2xl mx-auto">
            Unlock your full potential with Brilla. Start with a free trial or jump right into premium features.
          </p>

          {/* Trial Banner */}
          {hasTrialAvailable && (
            <div className="mt-8 inline-flex items-center gap-3 bg-gradient-to-r from-primary to-accent text-white px-6 py-3 rounded-full">
              <Gift className="w-5 h-5" />
              <span className="font-medium">Start your 14-day free trial today!</span>
              <button
                onClick={handleStartTrial}
                className="bg-white text-primary px-4 py-1.5 rounded-full text-sm font-semibold hover:bg-neutral-100 transition-colors"
              >
                Start Free Trial
              </button>
            </div>
          )}

          {/* Trial Status */}
          {isOnTrial && trialStatus && (
            <div className="mt-8 inline-flex items-center gap-3 bg-accent-100 text-accent-dark px-6 py-3 rounded-full">
              <Clock className="w-5 h-5" />
              <span className="font-medium">
                {trialStatus.daysRemaining} days left in your trial
              </span>
              {discountPercent > 0 && (
                <span className="bg-accent text-white px-3 py-1 rounded-full text-sm font-semibold">
                  {discountPercent}% OFF if you subscribe now!
                </span>
              )}
            </div>
          )}
        </div>

        {/* Pricing Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Free Tier */}
          <div className="bg-white rounded-2xl border border-neutral-200 p-6 relative">
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-2">
                <Zap className="w-5 h-5 text-neutral-400" />
                <h3 className="text-lg font-semibold text-neutral-900">Free</h3>
              </div>
              <p className="text-sm text-neutral-500">Get started with basic features</p>
            </div>

            <div className="mb-6">
              <div className="flex items-baseline">
                <span className="text-4xl font-bold text-neutral-900">0</span>
                <span className="text-lg text-neutral-500 ml-1">GHS</span>
              </div>
              <p className="text-sm text-neutral-500 mt-1">Forever free</p>
            </div>

            <ul className="space-y-3 mb-8">
              {['Unlimited practice questions', 'Model answers', 'Basic analytics', 'Community access'].map((feature) => (
                <li key={feature} className="flex items-center gap-2 text-sm text-neutral-600">
                  <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                  <span>{feature}</span>
                </li>
              ))}
            </ul>

            <button
              disabled={isSubscribed || isOnTrial}
              className="w-full py-3 px-4 rounded-xl border border-neutral-300 text-neutral-700 font-medium hover:bg-neutral-50 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubscribed ? 'Current Plan' : isOnTrial ? 'On Trial' : 'Current Plan'}
            </button>
          </div>

          {/* Premium Plans */}
          {filteredPlans
            .filter(plan => plan.id !== 'tier_free')
            .map((plan, index) => {
              const billingCycle = getPlanBillingCycle(plan);
              const price = getPlanPrice(plan);
              const monthlyEquivalent = billingCycle === 'yearly' && price != null
                ? Math.round(price / 12)
                : null;
              const savings = billingCycle === 'yearly' && price != null && monthlyPlanPrice != null
                ? Math.max(0, monthlyPlanPrice * 12 - price)
                : 0;
              const isPopular = billingCycle === 'yearly' || index === 0;
              const discountedPrice = discountPercent > 0 && price != null
                ? Math.round(price * (1 - discountPercent / 100))
                : price;

              return (
                <div
                  key={plan.id}
                  className={`bg-white rounded-2xl p-6 relative ${
                    isPopular
                      ? 'border-2 border-primary shadow-lg'
                      : 'border border-neutral-200'
                  }`}
                >
                  {isPopular && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                      <span className="bg-primary text-white text-sm font-medium px-4 py-1 rounded-full flex items-center gap-1">
                        <Star className="w-3.5 h-3.5" />
                        Most Popular
                      </span>
                    </div>
                  )}

                  <div className="mb-6">
                    <div className="flex items-center gap-2 mb-2">
                      <Crown className={`w-5 h-5 ${isPopular ? 'text-primary' : 'text-accent'}`} />
                      <h3 className="text-lg font-semibold text-neutral-900">{plan.name}</h3>
                    </div>
                    <p className="text-sm text-neutral-500">{plan.description}</p>
                  </div>

                  <div className="mb-6">
                    {discountPercent > 0 && price != null && (
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-lg text-neutral-400 line-through">{price} GHS</span>
                        <span className="bg-green-100 text-green-700 text-xs px-2 py-0.5 rounded-full">
                          {discountPercent}% OFF
                        </span>
                      </div>
                    )}
                    {price != null ? (
                      <div className="flex items-baseline">
                        <span className="text-4xl font-bold text-neutral-900">
                          {discountPercent > 0 ? discountedPrice : price}
                        </span>
                        <span className="text-lg text-neutral-500 ml-1">GHS</span>
                        <span className="text-sm text-neutral-400 ml-2">
                          /{billingCycle === 'yearly' ? 'year' : 'month'}
                        </span>
                      </div>
                    ) : (
                      <p className="text-lg font-semibold text-neutral-700">Price unavailable</p>
                    )}
                    {billingCycle === 'yearly' && monthlyEquivalent != null && (
                      <p className="text-sm text-neutral-500 mt-1">
                        {monthlyEquivalent} GHS/month
                        {savings > 0 && (
                          <span className="text-green-600 ml-2">Save {savings} GHS</span>
                        )}
                      </p>
                    )}
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-center gap-2 text-sm text-neutral-600">
                        <Check className="w-4 h-4 text-green-500 flex-shrink-0" />
                        <span>{feature.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</span>
                      </li>
                    ))}
                    {plan.aiGradingQuota === -1 ? (
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                        <span className="font-medium">Unlimited AI Grading</span>
                      </li>
                    ) : plan.aiGradingQuota > 0 && (
                      <li className="flex items-center gap-2 text-sm text-neutral-600">
                        <Sparkles className="w-4 h-4 text-accent flex-shrink-0" />
                        <span>{plan.aiGradingQuota} AI Gradings/month</span>
                      </li>
                    )}
                  </ul>

                  <button
                    onClick={() => handleSelectPlan(plan)}
                    disabled={isProcessing || isSubscribed || price == null}
                    className={`w-full py-3 px-4 rounded-xl font-medium transition-all flex items-center justify-center gap-2 ${
                      isPopular
                        ? 'bg-primary text-white hover:bg-primary-dark'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800'
                    } disabled:opacity-50 disabled:cursor-not-allowed`}
                  >
                    {isProcessing && selectedPlan === plan.id ? (
                      <>
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        Processing...
                      </>
                    ) : isSubscribed ? (
                      'Current Plan'
                    ) : (
                      <>
                        Get Started
                        <ArrowRight className="w-4 h-4" />
                      </>
                    )}
                  </button>
                </div>
              );
            })}
        </div>

        {/* FAQ or Additional Info */}
        <div className="mt-16 text-center">
          <h2 className="text-2xl font-bold text-neutral-900 mb-4">
            Why Choose Brilla Premium?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 mt-8 max-w-4xl mx-auto">
            <div className="text-center">
              <div className="w-12 h-12 bg-primary-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Sparkles className="w-6 h-6 text-primary" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">AI-Powered Grading</h3>
              <p className="text-sm text-neutral-600">
                Get instant, detailed feedback on your essays from our AI tutor
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Crown className="w-6 h-6 text-accent" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Advanced Analytics</h3>
              <p className="text-sm text-neutral-600">
                Track your progress with detailed performance insights
              </p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center mx-auto mb-4">
                <Gift className="w-6 h-6 text-green-600" />
              </div>
              <h3 className="font-semibold text-neutral-900 mb-2">Earn While You Learn</h3>
              <p className="text-sm text-neutral-600">
                Join our affiliate program and earn rewards for referrals
              </p>
            </div>
          </div>
        </div>

        {/* CTA for Affiliates */}
        <div className="mt-16 bg-gradient-to-r from-primary to-accent rounded-2xl p-8 text-white text-center">
          <h2 className="text-2xl font-bold mb-4">Become a Brilla Ambassador</h2>
          <p className="text-white/90 mb-6 max-w-xl mx-auto">
            Refer friends to Brilla and earn up to 50% commission on every subscription.
            The more you share, the more you earn!
          </p>
          <button
            onClick={() => navigate('/affiliate')}
            className="bg-white text-primary px-8 py-3 rounded-xl font-semibold hover:bg-neutral-100 transition-colors"
          >
            Join Affiliate Program
          </button>
        </div>
      </div>
    </div>
  );
}
