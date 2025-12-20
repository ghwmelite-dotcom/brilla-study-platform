import { useState } from 'react';
import {
  X,
  ChevronLeft,
  ChevronRight,
  Sparkles,
  GraduationCap,
  Target,
  Bot,
  TrendingUp,
  Rocket,
  Check,
} from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';
import { onboardingSteps } from '@/data/guides';

const iconMap: Record<string, React.ElementType> = {
  Sparkles,
  GraduationCap,
  Target,
  Bot,
  TrendingUp,
  Rocket,
};

export function OnboardingModal() {
  const {
    showOnboarding,
    onboardingStep,
    nextOnboardingStep,
    prevOnboardingStep,
    skipOnboarding,
    completeOnboarding,
  } = useGuideStore();

  const [isAnimating, setIsAnimating] = useState(false);
  const [direction, setDirection] = useState<'next' | 'prev'>('next');

  const currentStep = onboardingSteps[onboardingStep];
  const isLastStep = onboardingStep === onboardingSteps.length - 1;
  const isFirstStep = onboardingStep === 0;
  const Icon = iconMap[currentStep?.icon || 'Sparkles'] || Sparkles;

  const handleNext = () => {
    if (isLastStep) {
      completeOnboarding();
    } else {
      setDirection('next');
      setIsAnimating(true);
      setTimeout(() => {
        nextOnboardingStep();
        setIsAnimating(false);
      }, 200);
    }
  };

  const handlePrev = () => {
    setDirection('prev');
    setIsAnimating(true);
    setTimeout(() => {
      prevOnboardingStep();
      setIsAnimating(false);
    }, 200);
  };

  if (!showOnboarding) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={skipOnboarding}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden">
        {/* Skip button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-4 right-4 p-2 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-full transition-colors z-10"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header gradient */}
        <div className="relative h-48 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden">
          {/* Decorative circles */}
          <div className="absolute -top-10 -right-10 w-40 h-40 bg-white/10 rounded-full" />
          <div className="absolute -bottom-20 -left-20 w-60 h-60 bg-white/5 rounded-full" />

          {/* Icon */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`
                w-24 h-24 bg-white/20 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
              `}
            >
              <Icon className="w-12 h-12 text-white" />
            </div>
          </div>

          {/* Step indicator */}
          <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
            {onboardingSteps.map((_, index) => (
              <div
                key={index}
                className={`
                  w-2 h-2 rounded-full transition-all duration-300
                  ${index === onboardingStep
                    ? 'w-6 bg-white'
                    : index < onboardingStep
                    ? 'bg-white/80'
                    : 'bg-white/30'
                  }
                `}
              />
            ))}
          </div>
        </div>

        {/* Content */}
        <div className="p-6">
          <div
            className={`
              transition-all duration-200
              ${isAnimating
                ? direction === 'next'
                  ? '-translate-x-4 opacity-0'
                  : 'translate-x-4 opacity-0'
                : 'translate-x-0 opacity-100'
              }
            `}
          >
            <h2 className="text-2xl font-bold text-neutral-900 mb-2">
              {currentStep.title}
            </h2>
            <p className="text-neutral-600 mb-6">
              {currentStep.description}
            </p>

            {/* Features list */}
            {currentStep.features && (
              <div className="space-y-3 mb-6">
                {currentStep.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-3 bg-neutral-50 rounded-lg"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="w-5 h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-3 h-3 text-primary" />
                    </div>
                    <span className="text-sm text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-4 border-t border-neutral-100">
            <button
              onClick={handlePrev}
              disabled={isFirstStep}
              className={`
                flex items-center gap-2 px-4 py-2 rounded-lg transition-all
                ${isFirstStep
                  ? 'text-neutral-300 cursor-not-allowed'
                  : 'text-neutral-600 hover:bg-neutral-100'
                }
              `}
            >
              <ChevronLeft className="w-4 h-4" />
              Back
            </button>

            <button
              onClick={handleNext}
              className="flex items-center gap-2 px-6 py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg hover:scale-105 transition-all"
            >
              {isLastStep ? (
                <>
                  Get Started
                  <Rocket className="w-4 h-4" />
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
