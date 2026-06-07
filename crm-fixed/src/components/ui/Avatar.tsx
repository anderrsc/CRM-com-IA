import React from 'react';
import { cn } from '../../utils/cn';

interface AvatarProps {
  src?: string;
  name: string;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  ring?: boolean;
}

export const Avatar: React.FC<AvatarProps> = ({
  src,
  name,
  size = 'md',
  className,
  ring = false,
}) => {
  const sizes = {
    sm: 'w-8 h-8 text-xs',
    md: 'w-10 h-10 text-sm',
    lg: 'w-12 h-12 text-base',
    xl: 'w-16 h-16 text-lg',
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .slice(0, 2)
      .join('')
      .toUpperCase();
  };

  const gradients = [
    'from-zinc-950 to-red-700',
    'from-red-950 to-red-600',
    'from-black to-red-700',
    'from-zinc-800 to-red-800',
    'from-red-800 to-black',
    'from-zinc-900 to-red-600',
    'from-red-700 to-zinc-950',
    'from-black to-red-600',
  ];

  const getGradientFromName = (name: string) => {
    const index = name.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    return gradients[index % gradients.length];
  };

  if (src) {
    return (
      <img
        src={src}
        alt={name}
        className={cn(
          'rounded-full object-cover ring-2 ring-white shadow-md',
          sizes[size],
          ring && 'ring-4 ring-red-500/20',
          className
        )}
      />
    );
  }

  return (
    <div
      className={cn(
        'rounded-full flex items-center justify-center text-white font-bold',
        'bg-gradient-to-br shadow-md ring-2 ring-white',
        getGradientFromName(name),
        sizes[size],
        ring && 'ring-4 ring-red-500/20',
        className
      )}
    >
      {getInitials(name)}
    </div>
  );
};
