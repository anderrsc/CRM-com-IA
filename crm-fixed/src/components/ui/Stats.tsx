import React from 'react';
import { cn } from '../../utils/cn';

interface ProgressBarProps {
  value: number;
  max?: number;
  label?: string;
  showPercentage?: boolean;
  color?: 'red' | 'black';
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar: React.FC<ProgressBarProps> = ({
  value,
  max = 100,
  label,
  showPercentage = true,
  color = 'red',
  size = 'md',
}) => {
  const percentage = Math.min((value / max) * 100, 100);

  const colorClasses = {
    red: 'from-red-500 to-red-700',
    black: 'from-zinc-800 to-black',
  };

  const bgColors = {
    red: 'bg-red-100',
    black: 'bg-zinc-200',
  };

  const sizes = {
    sm: 'h-1.5',
    md: 'h-2.5',
    lg: 'h-4',
  };

  return (
    <div className="w-full">
      {(label || showPercentage) && (
        <div className="flex items-center justify-between mb-2">
          {label && <span className="text-sm font-semibold text-gray-700">{label}</span>}
          {showPercentage && (
            <span className="text-sm font-bold text-gray-900">{percentage.toFixed(0)}%</span>
          )}
        </div>
      )}
      <div className={cn('w-full rounded-full overflow-hidden', bgColors[color], sizes[size])}>
        <div
          className={cn(
            'h-full rounded-full bg-gradient-to-r transition-all duration-700 ease-out progress-bar',
            colorClasses[color]
          )}
          style={{ width: `${percentage}%` }}
        />
      </div>
    </div>
  );
};

interface StatCardProps {
  title: string;
  value: string | number;
  change?: number;
  changeLabel?: string;
  icon: React.ReactNode;
  iconColor?: string;
  iconBg?: string;
}

export const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  change,
  changeLabel,
  icon,
  iconColor = 'text-red-600',
  iconBg = 'bg-red-100',
}) => {
  const isPositive = change && change > 0;
  const isNegative = change && change < 0;

  return (
    <div className="bg-white rounded-lg p-5 shadow-sm border border-gray-100/80 card-hover">
      <div className="flex items-start justify-between">
        <div className={cn('p-3 rounded-lg', iconBg)}>
          <div className={iconColor}>{icon}</div>
        </div>
        {change !== undefined && (
          <div className={cn(
            'flex items-center gap-1 text-sm font-semibold px-2.5 py-1 rounded-full',
            isPositive && 'text-red-600 bg-red-50',
            isNegative && 'text-red-600 bg-red-50',
            !isPositive && !isNegative && 'text-gray-600 bg-gray-50'
          )}>
            <span>{isPositive ? '+' : ''}{change}%</span>
          </div>
        )}
      </div>
      <div className="mt-4">
        <h3 className="text-3xl font-bold text-gray-900">{value}</h3>
        <p className="text-sm font-medium text-gray-500 mt-1">{title}</p>
        {changeLabel && (
          <p className="text-xs text-gray-400 mt-1">{changeLabel}</p>
        )}
      </div>
    </div>
  );
};
