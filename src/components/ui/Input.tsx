import React from 'react';
import { cn } from '../../utils/cn';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  helperText?: string;
}

export const Input: React.FC<InputProps> = ({
  label,
  error,
  icon,
  iconRight,
  helperText,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <div className="relative group">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-red-500 transition-colors">
            {icon}
          </div>
        )}
        <input
          className={cn(
            'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900',
            'focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500',
            'placeholder:text-gray-400 transition-all duration-200',
            'disabled:bg-gray-100 disabled:cursor-not-allowed disabled:opacity-60',
            'hover:border-gray-300',
            icon && 'pl-10',
            iconRight && 'pr-10',
            error && 'border-red-500 focus:ring-red-500/10 focus:border-red-500',
            className
          )}
          {...props}
        />
        {iconRight && (
          <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
            {iconRight}
          </div>
        )}
      </div>
      {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
      {helperText && !error && <p className="mt-1.5 text-sm text-gray-500">{helperText}</p>}
    </div>
  );
};

interface TextAreaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const TextArea: React.FC<TextAreaProps> = ({
  label,
  error,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <textarea
        className={cn(
          'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500',
          'placeholder:text-gray-400 transition-all duration-200 resize-none',
          'hover:border-gray-300',
          error && 'border-red-500 focus:ring-red-500/10 focus:border-red-500',
          className
        )}
        {...props}
      />
      {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string }[];
}

export const Select: React.FC<SelectProps> = ({
  label,
  error,
  options,
  className,
  ...props
}) => {
  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          {label}
        </label>
      )}
      <select
        className={cn(
          'w-full px-3.5 py-2.5 bg-white border border-gray-300 rounded-lg text-gray-900',
          'focus:outline-none focus:ring-2 focus:ring-red-500/10 focus:border-red-500',
          'transition-all duration-200 cursor-pointer appearance-none',
          'hover:border-gray-300',
          'bg-[url("data:image/svg+xml,%3csvg xmlns=%27http://www.w3.org/2000/svg%27 fill=%27none%27 viewBox=%270 0 20 20%27%3e%3cpath stroke=%27%236b7280%27 stroke-linecap=%27round%27 stroke-linejoin=%27round%27 stroke-width=%271.5%27 d=%27M6 8l4 4 4-4%27/%3e%3c/svg%3e")]',
          'bg-[length:1.5em_1.5em] bg-[right_0.75rem_center] bg-no-repeat',
          error && 'border-red-500 focus:ring-red-500/10 focus:border-red-500',
          className
        )}
        {...props}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
      {error && <p className="mt-1.5 text-sm text-red-500 font-medium">{error}</p>}
    </div>
  );
};
