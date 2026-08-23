import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef, ReactNode } from 'react';
import { cn } from '@/utils';

interface AdminInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: ReactNode;
  rightIcon?: ReactNode;
}

export const AdminInput = forwardRef<HTMLInputElement, AdminInputProps>(
  ({ label, error, hint, leftIcon, rightIcon, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-admin-text mb-1.5">{label}</label>}
        <div className="relative">
          {leftIcon && <div className="absolute left-3 top-1/2 -translate-y-1/2 text-admin-text-muted">{leftIcon}</div>}
          <input
            ref={ref}
            className={cn(
              'admin-input',
              leftIcon ? '!pl-10' : '',
              rightIcon ? '!pr-10' : '',
              error && 'border-admin-accent-rose focus:ring-admin-accent-rose/50 focus:border-admin-accent-rose',
              className,
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-admin-text-muted">{rightIcon}</div>
          )}
        </div>
        {error && <p className="mt-1 text-sm text-admin-accent-rose">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-admin-text-muted">{hint}</p>}
      </div>
    );
  },
);

AdminInput.displayName = 'AdminInput';

interface AdminTextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const AdminTextarea = forwardRef<HTMLTextAreaElement, AdminTextareaProps>(
  ({ label, error, hint, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-admin-text mb-1.5">{label}</label>}
        <textarea
          ref={ref}
          className={cn(
            'admin-input resize-none',
            error && 'border-admin-accent-rose focus:ring-admin-accent-rose/50 focus:border-admin-accent-rose',
            className,
          )}
          {...props}
        />
        {error && <p className="mt-1 text-sm text-admin-accent-rose">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-admin-text-muted">{hint}</p>}
      </div>
    );
  },
);

AdminTextarea.displayName = 'AdminTextarea';

interface AdminSelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: Array<{ value: string; label: string }>;
}

export const AdminSelect = forwardRef<HTMLSelectElement, AdminSelectProps>(
  ({ label, error, hint, options, className, ...props }, ref) => {
    return (
      <div className="w-full">
        {label && <label className="block text-sm font-medium text-admin-text mb-1.5">{label}</label>}
        <select
          ref={ref}
          className={cn(
            'admin-input cursor-pointer',
            error && 'border-admin-accent-rose focus:ring-admin-accent-rose/50 focus:border-admin-accent-rose',
            className,
          )}
          {...props}
        >
          {options.map(option => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && <p className="mt-1 text-sm text-admin-accent-rose">{error}</p>}
        {hint && !error && <p className="mt-1 text-sm text-admin-text-muted">{hint}</p>}
      </div>
    );
  },
);

AdminSelect.displayName = 'AdminSelect';
