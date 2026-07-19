'use client';

import { Eye, EyeOff } from 'lucide-react';
import { useState } from 'react';

interface FormInputProps {
  label: string;
  name: string;
  type?: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  showPasswordToggle?: boolean;
}

export default function FormInput({
  label,
  name,
  type = 'text',
  value,
  onChange,
  error,
  required = false,
  placeholder,
  disabled = false,
  className = '',
  showPasswordToggle = false,
}: FormInputProps) {
  const [showPassword, setShowPassword] = useState(false);
  const resolvedType = type === 'password' && showPassword ? 'text' : type;

  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <div className="relative">
        <input
          id={name}
          name={name}
          type={resolvedType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          disabled={disabled}
          className={`w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 pr-12 text-sm font-medium text-slate-950 shadow-sm transition placeholder:text-slate-600 focus:border-[#9b7a2f] focus:outline-none focus:ring-2 focus:ring-[#9b7a2f]/20 ${
            error
              ? 'border-red-500 focus:ring-red-500'
              : 'border-[#d8caa7] focus:border-[#9b7a2f]'
          } ${disabled ? 'cursor-not-allowed bg-slate-100 text-slate-500 placeholder:text-slate-400' : 'bg-[#fcfaf7] text-slate-950 placeholder:text-slate-600'}` + (className ? ` ${className}` : '')}
        />
        {showPasswordToggle && type === 'password' && (
          <button
            type="button"
            onClick={() => setShowPassword((current) => !current)}
            className="absolute inset-y-0 right-3 flex items-center text-slate-600 transition hover:text-slate-900"
            aria-label={showPassword ? 'Hide password' : 'Show password'}
          >
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        )}
      </div>
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
