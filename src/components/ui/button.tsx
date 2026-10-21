import React, { forwardRef } from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger' | 'gold';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  isLoading?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading = false, children, disabled, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none active:scale-[0.98] cursor-pointer';

    const variants = {
      primary: 'bg-black text-white hover:bg-neutral-800 focus:ring-neutral-900 shadow-sm',
      gold: 'bg-gradient-to-r from-[#d5a667] to-[#c69b61] text-white hover:brightness-105 shadow-md shadow-[#c69b61]/20 focus:ring-[#c69b61]',
      secondary: 'bg-[#f7efe5] text-[#3d2f21] hover:bg-[#ebdccb] focus:ring-[#d5a667]',
      outline: 'border border-neutral-300 bg-white text-neutral-800 hover:bg-neutral-50 focus:ring-neutral-400',
      ghost: 'bg-transparent text-neutral-700 hover:bg-neutral-100 focus:ring-neutral-300',
      danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-600',
    };

    const sizes = {
      sm: 'text-xs px-3 py-1.5 gap-1.5',
      md: 'text-sm px-4 py-2.5 gap-2',
      lg: 'text-base px-6 py-3.5 gap-2.5',
      icon: 'h-10 w-10 p-0',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || isLoading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {isLoading && <Loader2 className="w-4 h-4 animate-spin shrink-0" />}
        {children}
      </button>
    );
  }
);

Button.displayName = 'Button';
