import React from 'react';
import { cn } from '../../utils/helpers';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  fullWidth?: boolean;
}

export const Input = React.memo<InputProps>(
  React.forwardRef<HTMLInputElement, InputProps>(
    ({ label, error, icon, fullWidth = false, className, ...props }, ref) => {
      return (
        <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
          {label && (
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </label>
          )}
          <div className="relative">
            {icon && (
              <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                {icon}
              </div>
            )}
            <input
              ref={ref}
              className={cn(
                'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors',
                icon && 'pl-10',
                error && 'border-red-500 focus:ring-red-500/20',
                className
              )}
              {...props}
            />
          </div>
          {error && (
            <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          )}
        </div>
      );
    }
  )
);

Input.displayName = 'Input';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
  fullWidth?: boolean;
}

export const Textarea = React.memo<TextareaProps>(
  React.forwardRef<HTMLTextAreaElement, TextareaProps>(
    ({ label, error, fullWidth = false, className, ...props }, ref) => {
      return (
        <div className={cn('flex flex-col gap-1', fullWidth && 'w-full')}>
          {label && (
            <label className="text-sm font-medium text-slate-700 dark:text-slate-300">
              {label}
            </label>
          )}
          <textarea
            ref={ref}
            className={cn(
              'w-full rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-3 py-2 text-slate-900 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 transition-colors resize-none',
              error && 'border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
          {error && (
            <span className="text-xs text-red-600 dark:text-red-400">{error}</span>
          )}
        </div>
      );
    }
  )
);

Textarea.displayName = 'Textarea';
