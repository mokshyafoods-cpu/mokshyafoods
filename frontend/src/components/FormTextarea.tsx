'use client';

interface FormTextareaProps {
  label: string;
  name: string;
  value: string;
  onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void;
  error?: string;
  required?: boolean;
  placeholder?: string;
  rows?: number;
}

export default function FormTextarea({
  label,
  name,
  value,
  onChange,
  error,
  required = false,
  placeholder,
  rows = 4,
}: FormTextareaProps) {
  return (
    <div className="space-y-2">
      <label htmlFor={name} className="block text-sm font-semibold text-slate-800">
        {label}
        {required && <span className="ml-1 text-red-500">*</span>}
      </label>
      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        className={`w-full rounded-2xl border border-[#d8caa7] bg-[#fcfaf7] px-4 py-2.5 text-sm font-medium text-slate-950 shadow-sm transition placeholder:text-slate-600 focus:border-[#9b7a2f] focus:outline-none focus:ring-2 focus:ring-[#9b7a2f]/20 ${
          error
            ? 'border-red-500 focus:ring-red-500'
            : 'border-[#d8caa7] focus:border-[#9b7a2f]'
        } bg-[#fcfaf7] text-slate-950 placeholder:text-slate-600`}
      />
      {error && <p className="text-sm text-red-500">{error}</p>}
    </div>
  );
}
