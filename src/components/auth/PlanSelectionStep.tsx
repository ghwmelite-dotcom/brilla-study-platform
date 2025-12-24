import { useState } from 'react';
import {
  Check,
  Crown,
  Sparkles,
  Gift,
  Clock,
  Star,
  Zap,
  BookOpen,
  Brain,
  BarChart3,
  Users,
  FileText,
} from 'lucide-react';
import { cn } from '@/utils';

type UserRole = 'student' | 'teacher';
type BillingCycle = 'monthly' | 'yearly';

interface PlanSelectionStepProps {
  role: UserRole;
  selectedTierId: string | null;
  onSelectTier: (tierId: string) => void;
  onBack: () => void;
  onContinue: () => void;
}

interface PlanFeature {
  icon: React.ReactNode;
  text: string;
  highlight?: boolean;
}

export function PlanSelectionStep({
  role,
  selectedTierId,
  onSelectTier,
  onBack,
  onContinue,
}: PlanSelectionStepProps) {
  const [billingCycle, setBillingCycle] = useState<BillingCycle>('monthly');

  const isStudent = role === 'student';

  // Pricing based on user type
  const pricing = isStudent
    ? { monthly: 50, yearly: 480, yearlyMonthly: 40 }
    : { monthly: 75, yearly: 720, yearlyMonthly: 60 };

  const yearlySavings = isStudent ? 120 : 180;
  const savingsPercent = 20;

  // Tier IDs based on role and billing
  const getTierId = (isPremium: boolean) => {
    if (!isPremium) return 'tier_free';
    if (isStudent) {
      return billingCycle === 'monthly' ? 'tier_student_monthly' : 'tier_student_yearly';
    }
    return billingCycle === 'monthly' ? 'tier_teacher_monthly' : 'tier_teacher_yearly';
  };

  const freeFeatures: PlanFeature[] = [
    { icon: <BookOpen className="w-4 h-4" />, text: 'Unlimited practice questions' },
    { icon: <FileText className="w-4 h-4" />, text: 'Model answers & explanations' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'Basic progress tracking' },
    { icon: <Users className="w-4 h-4" />, text: 'Community access' },
  ];

  const studentPremiumFeatures: PlanFeature[] = [
    { icon: <Brain className="w-4 h-4" />, text: 'AI-powered essay grading', highlight: true },
    { icon: <Sparkles className="w-4 h-4" />, text: 'Detailed personalized feedback', highlight: true },
    { icon: <FileText className="w-4 h-4" />, text: 'Full WASSCE past papers library' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'Advanced analytics & insights' },
    { icon: <Zap className="w-4 h-4" />, text: 'Priority support' },
    { icon: <Star className="w-4 h-4" />, text: 'Early access to new features' },
  ];

  const teacherPremiumFeatures: PlanFeature[] = [
    { icon: <Brain className="w-4 h-4" />, text: 'Unlimited AI essay grading', highlight: true },
    { icon: <Users className="w-4 h-4" />, text: 'Class management tools', highlight: true },
    { icon: <FileText className="w-4 h-4" />, text: 'Assessment builder' },
    { icon: <BarChart3 className="w-4 h-4" />, text: 'Student analytics dashboard' },
    { icon: <Sparkles className="w-4 h-4" />, text: 'Bulk grading features' },
    { icon: <Zap className="w-4 h-4" />, text: 'Priority support' },
  ];

  const premiumFeatures = isStudent ? studentPremiumFeatures : teacherPremiumFeatures;

  const isPremiumSelected = selectedTierId && selectedTierId !== 'tier_free';

  return (
    <div className="space-y-6">
      {/* Trial Banner */}
      <div className="bg-gradient-to-r from-amber-50 to-yellow-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 bg-amber-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Gift className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <h3 className="font-semibold text-amber-900">14-Day Free Trial</h3>
            <p className="text-sm text-amber-700 mt-0.5">
              Try Premium free for 14 days after approval. No payment required until you decide to continue.
            </p>
            <div className="flex items-center gap-4 mt-2">
              <span className="inline-flex items-center gap-1 text-xs font-medium text-amber-800 bg-amber-100 px-2 py-1 rounded-full">
                <Clock className="w-3 h-3" />
                Pay after approval
              </span>
              <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-100 px-2 py-1 rounded-full">
                <Star className="w-3 h-3" />
                Early bird discounts
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Billing Toggle */}
      <div className="flex items-center justify-center gap-3">
        <button
          type="button"
          onClick={() => setBillingCycle('monthly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all',
            billingCycle === 'monthly'
              ? 'bg-primary text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          Monthly
        </button>
        <button
          type="button"
          onClick={() => setBillingCycle('yearly')}
          className={cn(
            'px-4 py-2 rounded-lg text-sm font-medium transition-all relative',
            billingCycle === 'yearly'
              ? 'bg-primary text-white shadow-md'
              : 'text-neutral-600 hover:bg-neutral-100'
          )}
        >
          Yearly
          <span className="absolute -top-2 -right-2 bg-green-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
            -{savingsPercent}%
          </span>
        </button>
      </div>

      {/* Plan Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Free Plan */}
        <button
          type="button"
          onClick={() => onSelectTier('tier_free')}
          className={cn(
            'relative text-left p-5 rounded-xl border-2 transition-all',
            selectedTierId === 'tier_free'
              ? 'border-primary bg-primary/5 ring-2 ring-primary/20'
              : 'border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
          )}
        >
          {selectedTierId === 'tier_free' && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="mb-4">
            <h3 className="text-lg font-bold text-neutral-900">Free</h3>
            <div className="mt-2">
              <span className="text-3xl font-bold text-neutral-900">GHS 0</span>
              <span className="text-neutral-500">/forever</span>
            </div>
          </div>

          <ul className="space-y-2.5">
            {freeFeatures.map((feature, idx) => (
              <li key={idx} className="flex items-center gap-2 text-sm text-neutral-600">
                <span className="text-neutral-400">{feature.icon}</span>
                {feature.text}
              </li>
            ))}
          </ul>
        </button>

        {/* Premium Plan */}
        <button
          type="button"
          onClick={() => onSelectTier(getTierId(true))}
          className={cn(
            'relative text-left p-5 rounded-xl border-2 transition-all',
            isPremiumSelected
              ? 'border-primary bg-gradient-to-br from-primary/5 to-accent/5 ring-2 ring-primary/20'
              : 'border-primary/50 hover:border-primary bg-gradient-to-br from-primary/5 to-accent/5'
          )}
        >
          {/* Popular badge */}
          <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gradient-to-r from-primary to-accent text-white text-xs font-bold px-3 py-1 rounded-full flex items-center gap-1">
            <Crown className="w-3 h-3" />
            RECOMMENDED
          </div>

          {isPremiumSelected && (
            <div className="absolute top-3 right-3 w-6 h-6 bg-primary rounded-full flex items-center justify-center">
              <Check className="w-4 h-4 text-white" />
            </div>
          )}

          <div className="mb-4 mt-2">
            <h3 className="text-lg font-bold text-neutral-900">Premium</h3>
            <div className="mt-2">
              {billingCycle === 'yearly' ? (
                <>
                  <span className="text-3xl font-bold text-neutral-900">GHS {pricing.yearlyMonthly}</span>
                  <span className="text-neutral-500">/month</span>
                  <div className="text-sm text-neutral-500 mt-0.5">
                    <span className="line-through">GHS {pricing.monthly * 12}</span>
                    <span className="ml-2 text-green-600 font-medium">
                      GHS {pricing.yearly}/year
                    </span>
                  </div>
                  <div className="text-xs text-green-600 font-medium mt-1">
                    Save GHS {yearlySavings}/year
                  </div>
                </>
              ) : (
                <>
                  <span className="text-3xl font-bold text-neutral-900">GHS {pricing.monthly}</span>
                  <span className="text-neutral-500">/month</span>
                </>
              )}
            </div>
          </div>

          <ul className="space-y-2.5">
            {premiumFeatures.map((feature, idx) => (
              <li
                key={idx}
                className={cn(
                  'flex items-center gap-2 text-sm',
                  feature.highlight ? 'text-primary font-medium' : 'text-neutral-600'
                )}
              >
                <span className={feature.highlight ? 'text-primary' : 'text-neutral-400'}>
                  {feature.icon}
                </span>
                {feature.text}
              </li>
            ))}
          </ul>

          <div className="mt-4 pt-3 border-t border-neutral-200">
            <p className="text-xs text-neutral-500 flex items-center gap-1">
              <Gift className="w-3 h-3" />
              14-day free trial included
            </p>
          </div>
        </button>
      </div>

      {/* Info Note */}
      <p className="text-center text-xs text-neutral-500">
        You won't be charged during registration. Payment is only required after your account is approved
        and your 14-day trial ends.
      </p>

      {/* Navigation */}
      <div className="flex gap-3 pt-2">
        <button
          type="button"
          onClick={onBack}
          className="flex-1 py-2.5 border border-neutral-300 text-neutral-700 font-medium rounded-lg hover:bg-neutral-50 transition-colors"
        >
          Back
        </button>
        <button
          type="button"
          onClick={onContinue}
          disabled={!selectedTierId}
          className="flex-1 py-2.5 bg-gradient-to-r from-primary to-accent text-white font-medium rounded-lg hover:shadow-lg transition-all disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Continue
        </button>
      </div>
    </div>
  );
}
