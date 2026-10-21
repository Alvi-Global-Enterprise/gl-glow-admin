import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'gold' | 'outline' | 'success' | 'warning' | 'danger' | 'info';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const variants = {
    default: 'bg-neutral-100 text-neutral-800 border-neutral-200',
    gold: 'bg-[#f7efe5] text-[#8c652f] border-[#d5a667]/40 font-medium',
    outline: 'border border-neutral-300 text-neutral-700 bg-white',
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    warning: 'bg-amber-50 text-amber-700 border-amber-200',
    danger: 'bg-rose-50 text-rose-700 border-rose-200',
    info: 'bg-blue-50 text-blue-700 border-blue-200',
  };

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 rounded-md border',
    md: 'text-xs px-2.5 py-1 rounded-lg border font-medium',
  };

  return (
    <span
      className={cn('inline-flex items-center gap-1.5 transition-colors', variants[variant], sizes[size], className)}
      {...props}
    >
      {children}
    </span>
  );
};
