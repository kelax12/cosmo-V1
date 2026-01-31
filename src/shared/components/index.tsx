// =============================================================================
// SHARED UI COMPONENTS - Composants réutilisables
// =============================================================================

import React, { memo, forwardRef, InputHTMLAttributes, ButtonHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

// =============================================================================
// GOOGLE ICON
// =============================================================================
export const GoogleIcon = memo(() => (
  <svg className="w-5 h-5" viewBox="0 0 24 24">
    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
  </svg>
));
GoogleIcon.displayName = 'GoogleIcon';

// =============================================================================
// FORM INPUT
// =============================================================================
interface FormInputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const FormInput = memo(forwardRef<HTMLInputElement, FormInputProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <input
        ref={ref}
        className={cn(
          "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
          "placeholder:text-slate-500",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
));
FormInput.displayName = 'FormInput';

// =============================================================================
// FORM TEXTAREA
// =============================================================================
interface FormTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const FormTextarea = memo(forwardRef<HTMLTextAreaElement, FormTextareaProps>(
  ({ label, error, className, ...props }, ref) => (
    <div className="space-y-2">
      {label && (
        <label className="block text-sm font-medium text-slate-300">
          {label}
        </label>
      )}
      <textarea
        ref={ref}
        className={cn(
          "w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white",
          "focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all",
          "placeholder:text-slate-500 resize-none",
          error && "border-red-500 focus:ring-red-500",
          className
        )}
        {...props}
      />
      {error && <p className="text-red-400 text-sm">{error}</p>}
    </div>
  )
));
FormTextarea.displayName = 'FormTextarea';

// =============================================================================
// LOADING BUTTON
// =============================================================================
interface LoadingButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  loading?: boolean;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
}

const buttonVariants = {
  primary: "bg-blue-600 hover:bg-blue-500 text-white shadow-lg shadow-blue-900/20",
  secondary: "bg-slate-700 hover:bg-slate-600 text-white",
  danger: "bg-red-600 hover:bg-red-500 text-white",
  ghost: "bg-transparent hover:bg-slate-800 text-slate-300",
};

const buttonSizes = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2.5",
  lg: "px-6 py-3 text-lg",
};

export const LoadingButton = memo(forwardRef<HTMLButtonElement, LoadingButtonProps>(
  ({ loading, variant = 'primary', size = 'md', className, children, disabled, ...props }, ref) => (
    <button
      ref={ref}
      disabled={loading || disabled}
      className={cn(
        "font-semibold rounded-xl transition-all flex items-center justify-center gap-2",
        "disabled:opacity-50 disabled:cursor-not-allowed",
        buttonVariants[variant],
        buttonSizes[size],
        className
      )}
      {...props}
    >
      {loading && <Loader2 className="w-4 h-4 animate-spin" />}
      {children}
    </button>
  )
));
LoadingButton.displayName = 'LoadingButton';

// =============================================================================
// DIVIDER
// =============================================================================
export const Divider = memo<{ text?: string; className?: string }>(({ text, className }) => (
  <div className={cn("relative", className)}>
    <div className="absolute inset-0 flex items-center">
      <div className="w-full border-t border-slate-700"></div>
    </div>
    {text && (
      <div className="relative flex justify-center text-sm">
        <span className="px-4 bg-slate-900 text-slate-500">{text}</span>
      </div>
    )}
  </div>
));
Divider.displayName = 'Divider';

// =============================================================================
// CARD
// =============================================================================
interface CardProps {
  children: React.ReactNode;
  className?: string;
  padding?: 'none' | 'sm' | 'md' | 'lg';
}

const cardPadding = {
  none: "",
  sm: "p-3",
  md: "p-4",
  lg: "p-6",
};

export const Card = memo<CardProps>(({ children, className, padding = 'md' }) => (
  <div className={cn(
    "bg-slate-900 border border-slate-800 rounded-xl",
    cardPadding[padding],
    className
  )}>
    {children}
  </div>
));
Card.displayName = 'Card';

// =============================================================================
// EMPTY STATE
// =============================================================================
interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

export const EmptyState = memo<EmptyStateProps>(({ icon, title, description, action }) => (
  <div className="flex flex-col items-center justify-center py-12 text-center">
    {icon && <div className="text-slate-500 mb-4">{icon}</div>}
    <h3 className="text-lg font-semibold text-slate-300 mb-2">{title}</h3>
    {description && <p className="text-slate-500 mb-4 max-w-sm">{description}</p>}
    {action}
  </div>
));
EmptyState.displayName = 'EmptyState';

// =============================================================================
// BADGE
// =============================================================================
interface BadgeProps {
  children: React.ReactNode;
  variant?: 'default' | 'success' | 'warning' | 'danger' | 'info';
  className?: string;
}

const badgeVariants = {
  default: "bg-slate-700 text-slate-300",
  success: "bg-emerald-900/50 text-emerald-400 border-emerald-700",
  warning: "bg-amber-900/50 text-amber-400 border-amber-700",
  danger: "bg-red-900/50 text-red-400 border-red-700",
  info: "bg-blue-900/50 text-blue-400 border-blue-700",
};

export const Badge = memo<BadgeProps>(({ children, variant = 'default', className }) => (
  <span className={cn(
    "inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border",
    badgeVariants[variant],
    className
  )}>
    {children}
  </span>
));
Badge.displayName = 'Badge';

// =============================================================================
// SKELETON
// =============================================================================
export const Skeleton = memo<{ className?: string }>(({ className }) => (
  <div className={cn("animate-pulse bg-slate-800 rounded", className)} />
));
Skeleton.displayName = 'Skeleton';

// =============================================================================
// PRIORITY INDICATOR
// =============================================================================
interface PriorityIndicatorProps {
  priority: number;
  size?: 'sm' | 'md';
}

const priorityColors: Record<number, string> = {
  1: 'bg-red-500',
  2: 'bg-orange-500',
  3: 'bg-yellow-500',
  4: 'bg-blue-500',
  5: 'bg-slate-500',
};

export const PriorityIndicator = memo<PriorityIndicatorProps>(({ priority, size = 'md' }) => {
  const sizeClass = size === 'sm' ? 'w-2 h-2' : 'w-3 h-3';
  return (
    <div 
      className={cn(sizeClass, "rounded-full", priorityColors[priority] || priorityColors[5])}
      title={`Priorité ${priority}`}
    />
  );
});
PriorityIndicator.displayName = 'PriorityIndicator';

// =============================================================================
// COLOR DOT
// =============================================================================
export const ColorDot = memo<{ color: string; size?: 'sm' | 'md' | 'lg' }>(({ color, size = 'md' }) => {
  const sizeClass = { sm: 'w-2 h-2', md: 'w-3 h-3', lg: 'w-4 h-4' }[size];
  return <div className={cn(sizeClass, "rounded-full")} style={{ backgroundColor: color }} />;
});
ColorDot.displayName = 'ColorDot';
