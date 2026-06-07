import React from 'react';
import { cn } from '../../utils/cn';

interface CardProps {
  children: React.ReactNode;
  className?: string;
  hover?: boolean;
  padding?: 'none' | 'sm' | 'md' | 'lg';
  variant?: 'default' | 'gradient' | 'glass' | 'bordered';
  onClick?: () => void;
  style?: React.CSSProperties;
}

export const Card: React.FC<CardProps> = ({ 
  children, 
  className, 
  hover = false,
  padding = 'md',
  variant = 'default',
  onClick,
  style 
}) => {
  const paddings = {
    none: '',
    sm: 'p-3.5',
    md: 'p-4',
    lg: 'p-5',
  };

  const variants = {
    default: 'bg-white border border-gray-200/80 shadow-sm shadow-gray-200/60',
    gradient: 'bg-gradient-to-br from-white to-gray-50/80 border border-gray-200/70 shadow-sm shadow-gray-200/50',
    glass: 'glass',
    bordered: 'bg-white border border-gray-300',
  };

  return (
    <div 
      className={cn(
        'rounded-lg transition-all duration-200',
        variants[variant],
        paddings[padding],
        hover && 'card-hover cursor-pointer',
        onClick && 'cursor-pointer',
        className
      )}
      onClick={onClick}
      style={style}
    >
      {children}
    </div>
  );
};

interface CardHeaderProps {
  title: string;
  subtitle?: string;
  action?: React.ReactNode;
  icon?: React.ReactNode;
  iconBg?: string;
}

export const CardHeader: React.FC<CardHeaderProps> = ({ 
  title, 
  subtitle, 
  action, 
  icon,
  iconBg = 'bg-gradient-to-br from-red-500 to-red-600'
}) => {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between mb-4">
      <div className="flex items-center gap-3">
        {icon && (
          <div className={cn(
            'p-2 rounded-lg text-white shadow-sm',
            iconBg
          )}>
            {icon}
          </div>
        )}
        <div>
          <h3 className="text-base font-bold text-gray-900">{title}</h3>
          {subtitle && <p className="text-sm text-gray-500 mt-0.5">{subtitle}</p>}
        </div>
      </div>
      {action}
    </div>
  );
};
