import { Sun, Moon, Monitor } from 'lucide-react';
import { useThemeStore, type Theme } from '@/stores/themeStore';
import { cn } from '@/utils';
import { useState, useRef, useEffect } from 'react';

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
  variant?: 'icon' | 'switch' | 'dropdown';
}

export function ThemeToggle({ className, showLabel = false, variant = 'switch' }: ThemeToggleProps) {
  const { theme, resolvedTheme, setTheme } = useThemeStore();
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: 'light', label: 'Light', icon: <Sun className="w-4 h-4" /> },
    { value: 'dark', label: 'Dark', icon: <Moon className="w-4 h-4" /> },
    { value: 'system', label: 'System', icon: <Monitor className="w-4 h-4" /> },
  ];

  // Sleek animated switch toggle
  if (variant === 'switch') {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'group relative flex items-center gap-2 p-1.5 rounded-full transition-all duration-300',
          'bg-neutral-100 dark:bg-slate-700/50',
          'hover:bg-neutral-200 dark:hover:bg-slate-600/50',
          'focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2',
          'dark:focus:ring-offset-slate-800',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        {/* Toggle track */}
        <div className="relative w-14 h-7 rounded-full bg-gradient-to-r from-amber-400 to-orange-500 dark:from-indigo-600 dark:to-purple-600 transition-all duration-500 overflow-hidden">
          {/* Stars (visible in dark mode) */}
          <div className="absolute inset-0 opacity-0 dark:opacity-100 transition-opacity duration-500">
            <div className="absolute top-1 left-2 w-0.5 h-0.5 bg-white rounded-full animate-pulse" />
            <div className="absolute top-2 left-4 w-1 h-1 bg-white rounded-full animate-pulse delay-100" />
            <div className="absolute top-3 left-1 w-0.5 h-0.5 bg-white rounded-full animate-pulse delay-200" />
          </div>

          {/* Sun rays (visible in light mode) */}
          <div className="absolute inset-0 opacity-100 dark:opacity-0 transition-opacity duration-500">
            <div className="absolute top-1/2 left-3 w-2 h-0.5 bg-yellow-200/50 -translate-y-1/2 rounded-full" />
            <div className="absolute top-2 left-4 w-0.5 h-2 bg-yellow-200/50 rounded-full" />
          </div>

          {/* Toggle knob */}
          <div
            className={cn(
              'absolute top-0.5 w-6 h-6 rounded-full transition-all duration-500 ease-out',
              'flex items-center justify-center',
              'bg-white shadow-lg',
              'transform',
              resolvedTheme === 'dark' ? 'translate-x-7' : 'translate-x-0.5'
            )}
          >
            {/* Sun icon */}
            <Sun
              className={cn(
                'absolute w-4 h-4 text-amber-500 transition-all duration-300',
                resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
              )}
            />
            {/* Moon icon */}
            <Moon
              className={cn(
                'absolute w-4 h-4 text-indigo-600 transition-all duration-300',
                resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
              )}
            />
          </div>
        </div>

        {showLabel && (
          <span className="text-sm font-medium text-neutral-600 dark:text-slate-300 ml-1">
            {resolvedTheme === 'dark' ? 'Dark' : 'Light'}
          </span>
        )}
      </button>
    );
  }

  // Simple icon toggle
  if (variant === 'icon') {
    return (
      <button
        onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
        className={cn(
          'relative p-2 rounded-lg transition-all duration-300',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          className
        )}
        aria-label={`Switch to ${resolvedTheme === 'dark' ? 'light' : 'dark'} mode`}
      >
        <div className="relative w-5 h-5">
          <Sun
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-500',
              resolvedTheme === 'dark' ? 'opacity-0 rotate-90 scale-0' : 'opacity-100 rotate-0 scale-100'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-500',
              resolvedTheme === 'dark' ? 'opacity-100 rotate-0 scale-100' : 'opacity-0 -rotate-90 scale-0'
            )}
          />
        </div>
      </button>
    );
  }

  // Dropdown variant
  return (
    <div ref={dropdownRef} className={cn('relative', className)}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          'flex items-center gap-2 px-3 py-2 rounded-lg transition-all duration-200',
          'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100',
          'dark:text-slate-400 dark:hover:text-slate-100 dark:hover:bg-slate-700',
          'focus:outline-none focus:ring-2 focus:ring-primary/50',
          isOpen && 'bg-neutral-100 dark:bg-slate-700'
        )}
      >
        <div className="relative w-5 h-5">
          <Sun
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-300',
              theme === 'light' ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Moon
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-300',
              theme === 'dark' ? 'opacity-100' : 'opacity-0'
            )}
          />
          <Monitor
            className={cn(
              'absolute inset-0 w-5 h-5 transition-all duration-300',
              theme === 'system' ? 'opacity-100' : 'opacity-0'
            )}
          />
        </div>
        {showLabel && (
          <span className="text-sm font-medium">
            {themeOptions.find((t) => t.value === theme)?.label}
          </span>
        )}
      </button>

      {/* Dropdown menu */}
      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div
            className={cn(
              'absolute right-0 mt-2 w-40 py-1 z-20',
              'bg-white dark:bg-slate-800 rounded-xl shadow-lg',
              'border border-neutral-200 dark:border-slate-700',
              'animate-fade-in'
            )}
          >
            {themeOptions.map((option) => (
              <button
                key={option.value}
                onClick={() => {
                  setTheme(option.value);
                  setIsOpen(false);
                }}
                className={cn(
                  'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                  'hover:bg-neutral-100 dark:hover:bg-slate-700',
                  theme === option.value
                    ? 'text-primary dark:text-primary-light bg-primary/5 dark:bg-primary/10'
                    : 'text-neutral-700 dark:text-slate-300'
                )}
              >
                {option.icon}
                <span className="font-medium">{option.label}</span>
                {theme === option.value && (
                  <div className="ml-auto w-2 h-2 rounded-full bg-primary" />
                )}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
