'use client';

import { Loader2 } from 'lucide-react';
import { ReactNode } from 'react';

interface ButtonProps {
  children: ReactNode;
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  disabled?: boolean;
  loading?: boolean;
  className?: string;
}

const variantStyles = {
  primary: 'border border-primary/10 bg-primary text-white shadow-sm hover:bg-primary/90',
  secondary: 'border border-secondary/20 bg-secondary text-secondary-foreground shadow-sm hover:bg-secondary/90',
  outline: 'border border-primary/40 bg-white text-primary hover:bg-primary hover:text-white',
  ghost: 'border border-transparent bg-transparent text-primary hover:bg-slate-100',
};

const sizeStyles = {
  sm: 'px-3 py-1 text-sm',
  md: 'px-6 py-2 text-base',
  lg: 'px-8 py-3 text-lg',
};

export default function Button({
  children,
  onClick,
  type = 'button',
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
}: ButtonProps) {
  const isDisabled = disabled || loading;
  return (
    <button
      type={type}
      onClick={onClick}
      disabled={isDisabled}
      className={`inline-flex items-center justify-center gap-2 rounded-full font-semibold transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:ring-offset-2 ${variantStyles[variant]} ${sizeStyles[size]} ${
        isDisabled ? 'cursor-not-allowed opacity-60' : 'hover:-translate-y-0.5 active:scale-[0.98]'
      } ${className}`.trim()}
    >
      {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : children}
    </button>
  );
}
