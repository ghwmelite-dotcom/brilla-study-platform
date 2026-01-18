import { InputHTMLAttributes, TextareaHTMLAttributes, forwardRef } from 'react';
import { cn } from '@/utils';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  hint?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, hint, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-medium text-neutral-700 dark:text-slate-200 mb-1"
          >
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-400">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            aria-describedby={hint ? `${inputId}-hint` : undefined}
            aria-invalid={error ? 'true' : undefined}
            className={cn(
              'w-full px-4 py-2 rounded-lg border transition-all duration-200',
              'focus:outline-none focus:ring-2 focus:border-transparent',
              'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
              'placeholder:text-neutral-500 dark:placeholder:text-slate-400',
              error
                ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
                : 'border-neutral-300 focus:ring-primary bg-white',
              leftIcon ? 'pl-10' : undefined,
              rightIcon ? 'pr-10' : undefined,
              props.disabled ? 'bg-neutral-100 dark:bg-slate-700 cursor-not-allowed' : undefined,
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center text-neutral-400">
              {rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400" id={`${inputId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';

// Textarea
interface TextareaProps extends TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  hint?: string;
}

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ className, label, error, hint, id, ...props }, ref) => {
    const textareaId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={textareaId}
            className="block text-sm font-medium text-neutral-700 dark:text-slate-200 mb-1"
          >
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          id={textareaId}
          aria-describedby={hint ? `${textareaId}-hint` : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-2 rounded-lg border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'resize-none',
            'dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
            error
              ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-neutral-300 focus:ring-primary bg-white',
            props.disabled && 'bg-neutral-100 dark:bg-slate-700 cursor-not-allowed',
            className
          )}
          {...props}
        />
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400" id={`${textareaId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Textarea.displayName = 'Textarea';

// Select
interface SelectProps extends InputHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  hint?: string;
  options: { value: string; label: string }[];
  placeholder?: string;
}

export const Select = forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, label, error, hint, options, placeholder, id, ...props }, ref) => {
    const selectId = id || props.name;

    return (
      <div className="w-full">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-sm font-medium text-neutral-700 dark:text-slate-200 mb-1"
          >
            {label}
          </label>
        )}
        <select
          ref={ref}
          id={selectId}
          aria-describedby={hint ? `${selectId}-hint` : undefined}
          aria-invalid={error ? 'true' : undefined}
          className={cn(
            'w-full px-4 py-2 rounded-lg border transition-all duration-200',
            'focus:outline-none focus:ring-2 focus:border-transparent',
            'appearance-none bg-white dark:bg-slate-800 dark:text-slate-100 dark:border-slate-600',
            error
              ? 'border-red-300 focus:ring-red-500 bg-red-50 dark:bg-red-900/20'
              : 'border-neutral-300 focus:ring-primary',
            props.disabled && 'bg-neutral-100 dark:bg-slate-700 cursor-not-allowed',
            className
          )}
          {...props}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value}>
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="mt-1 text-sm text-red-600 dark:text-red-400" role="alert">
            {error}
          </p>
        )}
        {hint && !error && (
          <p className="mt-1 text-sm text-neutral-600 dark:text-slate-400" id={`${selectId}-hint`}>
            {hint}
          </p>
        )}
      </div>
    );
  }
);

Select.displayName = 'Select';
