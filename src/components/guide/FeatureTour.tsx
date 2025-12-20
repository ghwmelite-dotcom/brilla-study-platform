import { useState, useEffect, useCallback, useRef } from 'react';
import { X, ChevronLeft, ChevronRight, Lightbulb } from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';

interface SpotlightPosition {
  top: number;
  left: number;
  width: number;
  height: number;
}

export function FeatureTour() {
  const { activeTour, tourStep, tourSteps, nextTourStep, prevTourStep, endTour } = useGuideStore();
  const [spotlight, setSpotlight] = useState<SpotlightPosition | null>(null);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const tooltipRef = useRef<HTMLDivElement>(null);

  const currentStep = tourSteps[tourStep];
  const isFirstStep = tourStep === 0;
  const isLastStep = tourStep === tourSteps.length - 1;
  const progress = ((tourStep + 1) / tourSteps.length) * 100;

  const updatePosition = useCallback(() => {
    if (!currentStep) return;

    const target = document.querySelector(currentStep.target);
    if (!target) {
      // Target not found, show centered
      setSpotlight(null);
      setTooltipPosition({
        top: window.innerHeight / 2 - 100,
        left: window.innerWidth / 2 - 175,
      });
      return;
    }

    const rect = target.getBoundingClientRect();
    const padding = currentStep.spotlightPadding ?? 8;

    setSpotlight({
      top: rect.top - padding + window.scrollY,
      left: rect.left - padding,
      width: rect.width + padding * 2,
      height: rect.height + padding * 2,
    });

    // Calculate tooltip position based on placement
    const tooltipWidth = 350;
    const tooltipHeight = 200;
    const gap = 16;

    let top = 0;
    let left = 0;

    switch (currentStep.placement) {
      case 'top':
        top = rect.top - tooltipHeight - gap + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'bottom':
        top = rect.bottom + gap + window.scrollY;
        left = rect.left + rect.width / 2 - tooltipWidth / 2;
        break;
      case 'left':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.left - tooltipWidth - gap;
        break;
      case 'right':
        top = rect.top + rect.height / 2 - tooltipHeight / 2 + window.scrollY;
        left = rect.right + gap;
        break;
      case 'center':
      default:
        top = window.innerHeight / 2 - tooltipHeight / 2;
        left = window.innerWidth / 2 - tooltipWidth / 2;
    }

    // Keep tooltip in viewport
    left = Math.max(16, Math.min(left, window.innerWidth - tooltipWidth - 16));
    top = Math.max(16, Math.min(top, window.innerHeight - tooltipHeight - 16 + window.scrollY));

    setTooltipPosition({ top, left });

    // Scroll target into view if needed
    target.scrollIntoView({ behavior: 'smooth', block: 'center' });
  }, [currentStep]);

  useEffect(() => {
    if (activeTour && currentStep) {
      setIsVisible(false);
      setTimeout(() => {
        updatePosition();
        setIsVisible(true);
      }, 100);

      window.addEventListener('resize', updatePosition);
      window.addEventListener('scroll', updatePosition);

      return () => {
        window.removeEventListener('resize', updatePosition);
        window.removeEventListener('scroll', updatePosition);
      };
    }
  }, [activeTour, currentStep, updatePosition]);

  if (!activeTour || !currentStep) return null;

  return (
    <div className="fixed inset-0 z-[90]">
      {/* Overlay with spotlight cutout */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none">
        <defs>
          <mask id="spotlight-mask">
            <rect x="0" y="0" width="100%" height="100%" fill="white" />
            {spotlight && (
              <rect
                x={spotlight.left}
                y={spotlight.top}
                width={spotlight.width}
                height={spotlight.height}
                rx="8"
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          x="0"
          y="0"
          width="100%"
          height="100%"
          fill="rgba(0, 0, 0, 0.75)"
          mask="url(#spotlight-mask)"
        />
      </svg>

      {/* Spotlight border */}
      {spotlight && (
        <div
          className="absolute pointer-events-none transition-all duration-300"
          style={{
            top: spotlight.top,
            left: spotlight.left,
            width: spotlight.width,
            height: spotlight.height,
          }}
        >
          <div className="absolute inset-0 rounded-lg border-2 border-primary animate-pulse" />
          <div className="absolute inset-0 rounded-lg shadow-[0_0_0_4px_rgba(var(--primary-rgb),0.2)]" />
        </div>
      )}

      {/* Click blocker (allows clicking on spotlight area) */}
      <div
        className="absolute inset-0 cursor-pointer"
        onClick={() => endTour()}
        style={{
          clipPath: spotlight
            ? `polygon(
                0 0, 100% 0, 100% 100%, 0 100%, 0 0,
                ${spotlight.left}px ${spotlight.top}px,
                ${spotlight.left}px ${spotlight.top + spotlight.height}px,
                ${spotlight.left + spotlight.width}px ${spotlight.top + spotlight.height}px,
                ${spotlight.left + spotlight.width}px ${spotlight.top}px,
                ${spotlight.left}px ${spotlight.top}px
              )`
            : undefined,
        }}
      />

      {/* Tooltip */}
      <div
        ref={tooltipRef}
        className={`
          absolute w-[350px] bg-white rounded-xl shadow-2xl overflow-hidden
          transition-all duration-300
          ${isVisible ? 'opacity-100 scale-100' : 'opacity-0 scale-95'}
        `}
        style={{
          top: tooltipPosition.top,
          left: tooltipPosition.left,
        }}
      >
        {/* Progress bar */}
        <div className="h-1 bg-neutral-100">
          <div
            className="h-full bg-gradient-to-r from-primary to-accent transition-all duration-300"
            style={{ width: `${progress}%` }}
          />
        </div>

        {/* Header */}
        <div className="p-4 border-b border-neutral-100">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center">
                <Lightbulb className="w-4 h-4 text-primary" />
              </div>
              <div>
                <p className="text-xs text-neutral-400">
                  Step {tourStep + 1} of {tourSteps.length}
                </p>
                <h3 className="font-semibold text-neutral-900">
                  {currentStep.title}
                </h3>
              </div>
            </div>
            <button
              onClick={() => endTour()}
              className="p-1.5 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded-lg transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-4">
          <p className="text-sm text-neutral-600 leading-relaxed">
            {currentStep.content}
          </p>
        </div>

        {/* Navigation */}
        <div className="p-4 pt-0 flex items-center justify-between">
          <button
            onClick={prevTourStep}
            disabled={isFirstStep}
            className={`
              flex items-center gap-1 px-3 py-1.5 text-sm rounded-lg transition-colors
              ${isFirstStep
                ? 'text-neutral-300 cursor-not-allowed'
                : 'text-neutral-600 hover:bg-neutral-100'
              }
            `}
          >
            <ChevronLeft className="w-4 h-4" />
            Back
          </button>

          <div className="flex gap-1">
            {tourSteps.map((_, index) => (
              <div
                key={index}
                className={`
                  w-1.5 h-1.5 rounded-full transition-colors
                  ${index === tourStep ? 'bg-primary' : 'bg-neutral-200'}
                `}
              />
            ))}
          </div>

          <button
            onClick={nextTourStep}
            className="flex items-center gap-1 px-4 py-1.5 text-sm bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            {isLastStep ? 'Finish' : 'Next'}
            {!isLastStep && <ChevronRight className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
