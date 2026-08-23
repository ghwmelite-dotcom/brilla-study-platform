import {
  type KeyboardEvent as ReactKeyboardEvent,
  type ReactNode,
  useCallback,
  useEffect,
  useId,
  useLayoutEffect,
  useRef,
  useState,
} from 'react';
import { createPortal } from 'react-dom';

const VIEWPORT_GUTTER = 12;
const MENU_GAP = 8;

interface MenuPosition {
  left: number;
  top: number;
}
const MENU_ITEM_SELECTOR = '[role="menuitem"]:not(:disabled)';
const FOCUSABLE_SELECTOR =
  'a[href], button:not(:disabled), input:not(:disabled), select:not(:disabled), textarea:not(:disabled), [tabindex]:not([tabindex="-1"])';

interface AdminDropdownMenuProps {
  isOpen: boolean;
  onOpenChange: (isOpen: boolean) => void;
  trigger: ReactNode;
  children: ReactNode;
  ariaLabel: string;
  disabled?: boolean;
  triggerClassName?: string;
  menuClassName?: string;
}

/**
 * Viewport-positioned admin menu. Rendering through a portal keeps table action
 * menus visible when their rows sit inside horizontally scrollable containers.
 */
export function AdminDropdownMenu({
  isOpen,
  onOpenChange,
  trigger,
  children,
  ariaLabel,
  disabled = false,
  triggerClassName,
  menuClassName,
}: AdminDropdownMenuProps) {
  const menuId = useId();
  const triggerRef = useRef<HTMLButtonElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState<MenuPosition | null>(null);

  const updatePosition = useCallback(() => {
    const triggerElement = triggerRef.current;
    const menuElement = menuRef.current;

    if (!triggerElement || !menuElement) return;

    const triggerRect = triggerElement.getBoundingClientRect();
    const menuRect = menuElement.getBoundingClientRect();
    const maxLeft = Math.max(VIEWPORT_GUTTER, window.innerWidth - menuRect.width - VIEWPORT_GUTTER);
    const left = Math.min(Math.max(VIEWPORT_GUTTER, triggerRect.right - menuRect.width), maxLeft);

    const spaceBelow = window.innerHeight - triggerRect.bottom - VIEWPORT_GUTTER;
    const canOpenAbove = triggerRect.top - MENU_GAP - menuRect.height >= VIEWPORT_GUTTER;
    const top =
      spaceBelow >= menuRect.height || !canOpenAbove
        ? Math.min(triggerRect.bottom + MENU_GAP, window.innerHeight - menuRect.height - VIEWPORT_GUTTER)
        : triggerRect.top - menuRect.height - MENU_GAP;

    setPosition({
      left,
      top: Math.max(VIEWPORT_GUTTER, top),
    });
  }, []);

  const getEnabledMenuItems = useCallback(
    () => Array.from(menuRef.current?.querySelectorAll<HTMLElement>(MENU_ITEM_SELECTOR) ?? []),
    [],
  );

  const moveFocusFromTrigger = useCallback(
    (backwards: boolean) => {
      const triggerElement = triggerRef.current;
      if (!triggerElement) return;

      const focusableElements = Array.from(document.querySelectorAll<HTMLElement>(FOCUSABLE_SELECTOR)).filter(
        element => !menuRef.current?.contains(element),
      );
      const triggerIndex = focusableElements.indexOf(triggerElement);
      const nextIndex = backwards ? triggerIndex - 1 : triggerIndex + 1;
      const nextElement = focusableElements[nextIndex];

      onOpenChange(false);
      (nextElement ?? triggerElement).focus();
    },
    [onOpenChange],
  );

  useLayoutEffect(() => {
    if (!isOpen) {
      setPosition(null);
      return;
    }

    updatePosition();
    const items = getEnabledMenuItems();
    items.forEach((item, index) => {
      item.tabIndex = index === 0 ? 0 : -1;
    });
    items[0]?.focus();
  }, [getEnabledMenuItems, isOpen, updatePosition]);

  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onOpenChange(false);
        triggerRef.current?.focus();
      }
    };

    const handleViewportChange = () => {
      const triggerRect = triggerRef.current?.getBoundingClientRect();
      if (!triggerRect) return;

      const triggerIsOutsideViewport =
        triggerRect.bottom <= 0 ||
        triggerRect.top >= window.innerHeight ||
        triggerRect.right <= 0 ||
        triggerRect.left >= window.innerWidth;
      if (triggerIsOutsideViewport) {
        onOpenChange(false);
        return;
      }

      updatePosition();
    };

    window.addEventListener('resize', handleViewportChange);
    window.addEventListener('scroll', handleViewportChange, true);
    document.addEventListener('keydown', handleKeyDown);

    return () => {
      window.removeEventListener('resize', handleViewportChange);
      window.removeEventListener('scroll', handleViewportChange, true);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onOpenChange, updatePosition]);

  const handleMenuKeyDown = (event: ReactKeyboardEvent<HTMLDivElement>) => {
    if (event.key === 'Tab') {
      event.preventDefault();
      moveFocusFromTrigger(event.shiftKey);
      return;
    }

    if (!['ArrowDown', 'ArrowUp', 'Home', 'End'].includes(event.key)) return;

    const items = getEnabledMenuItems();
    if (items.length === 0) return;

    event.preventDefault();
    const currentIndex = items.indexOf(document.activeElement as HTMLElement);
    let nextIndex = 0;

    if (event.key === 'End') {
      nextIndex = items.length - 1;
    } else if (event.key === 'ArrowDown') {
      nextIndex = currentIndex < 0 ? 0 : (currentIndex + 1) % items.length;
    } else if (event.key === 'ArrowUp') {
      nextIndex = currentIndex <= 0 ? items.length - 1 : currentIndex - 1;
    }

    items.forEach(item => {
      item.tabIndex = -1;
    });
    const nextItem = items[nextIndex];
    nextItem.tabIndex = 0;
    nextItem.focus();
  };

  const menu =
    isOpen && typeof document !== 'undefined'
      ? createPortal(
          <>
            <div className="fixed inset-0 z-[90]" aria-hidden="true" onClick={() => onOpenChange(false)} />
            <div
              ref={menuRef}
              id={menuId}
              role="menu"
              aria-label={ariaLabel}
              onKeyDown={handleMenuKeyDown}
              className={[
                'fixed z-[100] w-52 max-w-[calc(100vw-1.5rem)] max-h-[calc(100vh-1.5rem)] overflow-y-auto rounded-xl border border-admin-border bg-admin-bg-secondary py-1.5 shadow-2xl',
                'focus:outline-none',
                menuClassName,
              ]
                .filter(Boolean)
                .join(' ')}
              style={{
                left: position?.left ?? 0,
                top: position?.top ?? 0,
                visibility: position ? 'visible' : 'hidden',
              }}
            >
              {children}
            </div>
          </>,
          document.body,
        )
      : null;

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={ariaLabel}
        aria-haspopup="menu"
        aria-expanded={isOpen}
        aria-controls={isOpen ? menuId : undefined}
        disabled={disabled}
        onClick={() => onOpenChange(!isOpen)}
        className={triggerClassName}
      >
        {trigger}
      </button>
      {menu}
    </>
  );
}
