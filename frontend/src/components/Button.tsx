'use client';

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
  primary: 'bg-primary text-white hover:bg-opacity-90',
  secondary: 'bg-secondary text-white hover:bg-opacity-90',
  outline: 'border border-primary text-primary hover:bg-primary hover:text-white',
  ghost: 'text-primary hover:bg-gray-100',
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
      className={`rounded-lg font-semibold transition ${variantStyles[variant]} ${sizeStyles[size]} ${
        isDisabled ? 'opacity-50 cursor-not-allowed' : ''
      } ${className}`}
    >
      {loading ? 'Loading...' : children}
    </button>
  );
}
