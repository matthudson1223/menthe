import React from 'react';
import { cn } from '../../utils/helpers';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: 'default' | 'bordered' | 'elevated';
}

export const Card = React.memo<CardProps>(({
  children,
  variant = 'default',
  className,
  ...props
}) => {
  const variantStyles = {
    default: 'bg-white dark:bg-slate-900 rounded-xl shadow-sm border border-slate-200 dark:border-slate-800',
    bordered: 'bg-white dark:bg-slate-900 rounded-xl border-2 border-slate-200 dark:border-slate-700',
    elevated: 'bg-white dark:bg-slate-900 rounded-xl shadow-lg border border-slate-200 dark:border-slate-800',
  };

  return (
    <div
      className={cn(
        'transition-colors',
        variantStyles[variant],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
});

Card.displayName = 'Card';

export interface CardHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardHeader = React.memo<CardHeaderProps>(({ children, className, ...props }) => {
  return (
    <div className={cn('p-4 md:p-6 border-b border-slate-100 dark:border-slate-800', className)} {...props}>
      {children}
    </div>
  );
});

CardHeader.displayName = 'CardHeader';

export interface CardContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const CardContent = React.memo<CardContentProps>(({ children, className, ...props }) => {
  return (
    <div className={cn('p-4 md:p-6', className)} {...props}>
      {children}
    </div>
  );
});

CardContent.displayName = 'CardContent';
