import React from 'react';
import { cn } from '../../utils/cn';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'ghost' | 'outline' | 'gradient';
  size?: 'xs' | 'sm' | 'md' | 'lg';
  loading?: boolean;
  icon?: React.ReactNode;
  iconRight?: React.ReactNode;
  children?: React.ReactNode;
  fullWidth?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  size = 'md',
  loading = false,
  icon,
  iconRight,
  children,
  className,
  disabled,
  fullWidth = false,
  ...props
}) => {
  const baseStyles = `
    inline-flex min-h-10 items-center justify-center font-semibold rounded-lg 
    transition-all duration-200 ease-out
    focus:outline-none focus:ring-2 focus:ring-offset-2 
    disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none
    active:scale-[0.98]
    btn-glow
  `;
  
  const variants = {
    primary: `
      bg-red-700 text-white 
      hover:bg-red-800 
      focus:ring-red-600 
      shadow-sm shadow-red-700/20
    `,
    secondary: `
      bg-zinc-900 text-white 
      hover:bg-black 
      focus:ring-gray-500
      shadow-sm shadow-gray-500/20
    `,
    success: `
      bg-zinc-900 text-white 
      hover:bg-black 
      focus:ring-zinc-700
      shadow-sm shadow-zinc-500/20
    `,
    danger: `
      bg-red-600 text-white 
      hover:bg-red-700 
      focus:ring-red-500
      shadow-sm shadow-red-500/20
    `,
    warning: `
      bg-red-950 text-white 
      hover:bg-red-900 
      focus:ring-red-900
      shadow-sm shadow-red-900/20
    `,
    ghost: `
      bg-transparent text-gray-700 
      hover:bg-gray-100 hover:text-gray-900
      focus:ring-gray-500
    `,
    outline: `
      border border-red-700 text-red-700 bg-transparent
      hover:bg-red-50 hover:border-red-800
      focus:ring-red-700
    `,
    gradient: `
      bg-gradient-to-r from-zinc-950 via-red-700 to-zinc-950 
      bg-[length:200%_100%] text-white
      hover:bg-right
      focus:ring-red-700
      shadow-lg shadow-red-700/25 hover:shadow-xl hover:shadow-red-700/30
      transition-all duration-500
    `,
  };

  const sizes = {
    xs: 'px-2.5 py-1.5 text-xs gap-1.5',
    sm: 'px-3 py-2 text-sm gap-2',
    md: 'px-4 py-2.5 text-sm gap-2',
    lg: 'min-h-11 px-5 py-3 text-base gap-2.5',
  };

  return (
    <button
      className={cn(
        baseStyles, 
        variants[variant], 
        sizes[size], 
        fullWidth && 'w-full',
        className
      )}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? (
        <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
          <circle 
            className="opacity-25" 
            cx="12" cy="12" r="10" 
            stroke="currentColor" 
            strokeWidth="4" 
            fill="none" 
          />
          <path 
            className="opacity-75" 
            fill="currentColor" 
            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" 
          />
        </svg>
      ) : icon}
      {children}
      {iconRight && !loading && iconRight}
    </button>
  );
};
