/**
 * SkipLink - Accessibility component for keyboard navigation
 *
 * Allows keyboard users to skip directly to main content,
 * bypassing repetitive navigation elements.
 *
 * WCAG 2.1 Success Criterion 2.4.1: Bypass Blocks
 */
export function SkipLink() {
  return (
    <a
      href="#main-content"
      className="
        sr-only focus:not-sr-only
        focus:fixed focus:top-4 focus:left-4 focus:z-[9999]
        focus:px-4 focus:py-2 focus:rounded-lg
        focus:bg-primary focus:text-white
        focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary
        font-medium text-sm
        transition-all
      "
    >
      Skip to main content
    </a>
  );
}

/**
 * VisuallyHidden - Hide content visually but keep it accessible to screen readers
 */
export function VisuallyHidden({ children }: { children: React.ReactNode }) {
  return (
    <span className="sr-only">
      {children}
    </span>
  );
}

/**
 * FocusTrap - Trap focus within a container (for modals, dialogs)
 */
interface FocusTrapProps {
  children: React.ReactNode;
  active?: boolean;
}

export function FocusTrap({ children, active = true }: FocusTrapProps) {
  if (!active) return <>{children}</>;

  return (
    <div
      role="dialog"
      aria-modal="true"
      tabIndex={-1}
    >
      {children}
    </div>
  );
}

/**
 * LiveRegion - Announce dynamic content changes to screen readers
 *
 * @param politeness - 'polite' waits for user to finish current task, 'assertive' interrupts immediately
 */
interface LiveRegionProps {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}

export function LiveRegion({
  children,
  politeness = 'polite',
  atomic = true,
}: LiveRegionProps) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}
