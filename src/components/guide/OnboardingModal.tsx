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
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-2 sm:p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={skipOnboarding}
      />

      {/* Modal - Scrollable container for small screens */}
      <div className="relative w-full max-w-lg max-h-[95vh] sm:max-h-[90vh] bg-white rounded-xl sm:rounded-2xl shadow-2xl overflow-hidden flex flex-col">
        {/* Skip button */}
        <button
          onClick={skipOnboarding}
          className="absolute top-2 right-2 sm:top-4 sm:right-4 p-1.5 sm:p-2 text-white/80 hover:text-white hover:bg-white/20 rounded-full transition-colors z-10"
          aria-label="Skip onboarding"
        >
          <X className="w-4 h-4 sm:w-5 sm:h-5" />
        </button>

        {/* Header gradient - Responsive height */}
        <div className="relative h-32 sm:h-40 md:h-48 bg-gradient-to-br from-primary via-primary to-accent overflow-hidden flex-shrink-0">
          {/* Decorative circles - Hidden on very small screens */}
          <div className="hidden sm:block absolute -top-10 -right-10 w-32 md:w-40 h-32 md:h-40 bg-white/10 rounded-full" />
          <div className="hidden sm:block absolute -bottom-16 md:-bottom-20 -left-16 md:-left-20 w-48 md:w-60 h-48 md:h-60 bg-white/5 rounded-full" />

          {/* Icon - Responsive sizing */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div
              className={`
                w-16 h-16 sm:w-20 sm:h-20 md:w-24 md:h-24 bg-white/20 rounded-full flex items-center justify-center
                transition-all duration-300
                ${isAnimating ? 'scale-90 opacity-0' : 'scale-100 opacity-100'}
              `}
            >
              <Icon className="w-8 h-8 sm:w-10 sm:h-10 md:w-12 md:h-12 text-white" />
            </div>
          </div>

          {/* Step indicator */}
          <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex gap-1.5 sm:gap-2">
            {onboardingSteps.map((_, index) => (
              <button
                key={index}
                onClick={() => {
                  if (index < onboardingStep) {
                    // Allow clicking on completed steps to go back
                    setDirection('prev');
                    setIsAnimating(true);
                    setTimeout(() => {
                      useGuideStore.setState({ onboardingStep: index });
                      setIsAnimating(false);
                    }, 200);
                  }
                }}
                className={`
                  h-1.5 sm:h-2 rounded-full transition-all duration-300
                  ${index === onboardingStep
                    ? 'w-5 sm:w-6 bg-white'
                    : index < onboardingStep
                    ? 'w-1.5 sm:w-2 bg-white/80 cursor-pointer hover:bg-white'
                    : 'w-1.5 sm:w-2 bg-white/30'
                  }
                `}
                aria-label={`Step ${index + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Content - Scrollable */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1">
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
            <h2 className="text-lg sm:text-xl md:text-2xl font-bold text-neutral-900 mb-1 sm:mb-2">
              {currentStep.title}
            </h2>
            <p className="text-sm sm:text-base text-neutral-600 mb-4 sm:mb-6">
              {currentStep.description}
            </p>

            {/* Features list - Responsive spacing */}
            {currentStep.features && (
              <div className="space-y-2 sm:space-y-3 mb-4 sm:mb-6">
                {currentStep.features.map((feature, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-2 sm:gap-3 p-2 sm:p-3 bg-neutral-50 rounded-lg"
                    style={{
                      animationDelay: `${index * 100}ms`,
                    }}
                  >
                    <div className="w-4 h-4 sm:w-5 sm:h-5 bg-primary/10 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                      <Check className="w-2.5 h-2.5 sm:w-3 sm:h-3 text-primary" />
                    </div>
                    <span className="text-xs sm:text-sm text-neutral-700">{feature}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Navigation - Fixed at bottom */}
        <div className="flex items-center justify-between p-4 sm:p-6 pt-3 sm:pt-4 border-t border-neutral-100 flex-shrink-0 bg-white">
          <button
            onClick={handlePrev}
            disabled={isFirstStep}
            className={`
              flex items-center gap-1 sm:gap-2 px-3 sm:px-4 py-2 rounded-lg transition-all text-sm sm:text-base
              ${isFirstStep
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-100 active:scale-95'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            <span className="hidden xs:inline">Back</span>
          </button>

          {/* Step counter for mobile */}
          <span className="text-xs text-neutral-400 sm:hidden">
            {onboardingStep + 1} / {onboardingSteps.length}
          </span>

          <button
            onClick={handleNext}
            className="flex items-center gap-1 sm:gap-2 px-4 sm:px-6 py-2 sm:py-2.5 bg-gradient-to-r from-primary to-accent text-white rounded-lg hover:shadow-lg active:scale-95 sm:hover:scale-105 transition-all text-sm sm:text-base font-medium"
          >
            {isLastStep ? (
              <>
                <span>Get Started</span>
                <Rocket className="w-4 h-4" />
              </>
            ) : (
              <>
                <span>Next</span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
