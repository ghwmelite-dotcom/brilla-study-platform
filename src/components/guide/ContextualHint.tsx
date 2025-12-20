import { useState, useEffect, useRef } from 'react';
import { X, Lightbulb, ChevronRight } from 'lucide-react';
import { useGuideStore } from '@/stores/guideStore';

interface ContextualHintProps {
  id: string;
  children: React.ReactNode;
  content: string;
  title?: string;
  position?: 'top' | 'bottom' | 'left' | 'right';
  showOnce?: boolean;
  delay?: number;
  trigger?: 'hover' | 'auto' | 'click';
  actionLabel?: string;
  onAction?: () => void;
}

export function ContextualHint({
  id,
  children,
  content,
  title,
  position = 'top',
  showOnce = true,
  delay = 500,
  trigger = 'hover',
  actionLabel,
  onAction,
}: ContextualHintProps) {
  const { isHintDismissed, dismissHint } = useGuideStore();
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipStyle, setTooltipStyle] = useState<React.CSSProperties>({});
  const containerRef = useRef<HTMLDivElement>(null);
  const tooltipRef = useRef<HTMLDivElement>(null);
  const timeoutRef = useRef<NodeJS.Timeout>();

  const isDismissed = isHintDismissed(id);

  useEffect(() => {
    if (trigger === 'auto' && !isDismissed) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [trigger, delay, isDismissed]);

  useEffect(() => {
    if (isVisible && containerRef.current && tooltipRef.current) {
      const containerRect = containerRef.current.getBoundingClientRect();
      const tooltipRect = tooltipRef.current.getBoundingClientRect();
      const gap = 8;

      let top = 0;
      let left = 0;

      switch (position) {
        case 'top':
          top = -tooltipRect.height - gap;
          left = (containerRect.width - tooltipRect.width) / 2;
          break;
        case 'bottom':
          top = containerRect.height + gap;
          left = (containerRect.width - tooltipRect.width) / 2;
          break;
        case 'left':
          top = (containerRect.height - tooltipRect.height) / 2;
          left = -tooltipRect.width - gap;
          break;
        case 'right':
          top = (containerRect.height - tooltipRect.height) / 2;
          left = containerRect.width + gap;
          break;
      }

      setTooltipStyle({ top, left });
    }
  }, [isVisible, position]);

  const handleMouseEnter = () => {
    if (trigger === 'hover' && !isDismissed) {
      timeoutRef.current = setTimeout(() => {
        setIsVisible(true);
      }, delay);
    }
  };

  const handleMouseLeave = () => {
    if (trigger === 'hover') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsVisible(false);
    }
  };

  const handleClick = () => {
    if (trigger === 'click' && !isDismissed) {
      setIsVisible(!isVisible);
    }
  };

  const handleDismiss = () => {
    setIsVisible(false);
    if (showOnce) {
      dismissHint(id, true);
    }
  };

  const handleAction = () => {
    onAction?.();
    handleDismiss();
  };

  if (isDismissed && showOnce) {
    return <>{children}</>;
  }

  return (
    <div
      ref={containerRef}
      className="relative inline-block"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      onClick={handleClick}
    >
      {children}

      {isVisible && (
        <div
          ref={tooltipRef}
          className={`
            absolute z-50 w-64 bg-white rounded-xl shadow-xl border border-neutral-200
            animate-fadeIn
          `}
          style={tooltipStyle}
        >
          {/* Arrow */}
          <div
            className={`
              absolute w-3 h-3 bg-white border-neutral-200 transform rotate-45
              ${position === 'top' ? 'bottom-[-6px] left-1/2 -translate-x-1/2 border-r border-b' : ''}
              ${position === 'bottom' ? 'top-[-6px] left-1/2 -translate-x-1/2 border-l border-t' : ''}
              ${position === 'left' ? 'right-[-6px] top-1/2 -translate-y-1/2 border-t border-r' : ''}
              ${position === 'right' ? 'left-[-6px] top-1/2 -translate-y-1/2 border-b border-l' : ''}
            `}
          />

          {/* Content */}
          <div className="p-3">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Lightbulb className="w-3.5 h-3.5 text-amber-600" />
                </div>
                {title && (
                  <h4 className="font-medium text-sm text-neutral-900">{title}</h4>
                )}
              </div>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleDismiss();
                }}
                className="p-1 text-neutral-400 hover:text-neutral-600 hover:bg-neutral-100 rounded transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>

            <p className="text-sm text-neutral-600 mt-2">{content}</p>

            {actionLabel && onAction && (
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleAction();
                }}
                className="flex items-center gap-1 mt-3 text-sm text-primary hover:underline"
              >
                {actionLabel}
                <ChevronRight className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        </div>
      )}

      <style>{`
        @keyframes fadeIn {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
      `}</style>
    </div>
  );
}
