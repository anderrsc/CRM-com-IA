import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../utils/cn';

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
  showClose?: boolean;
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  children,
  size = 'md',
  showClose = true,
}) => {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    
    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
    }
    
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const sizes = {
    sm: 'max-w-none',
    md: 'max-w-none',
    lg: 'max-w-none',
    xl: 'max-w-none',
    full: 'max-w-none',
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-white">
      <div className="min-h-screen w-full">
        <div className={cn(
          'relative min-h-screen w-full bg-white animate-fadeIn',
          sizes[size]
        )}>
          {(title || showClose) && (
            <div className="sticky top-0 z-10 flex items-center justify-between border-b border-gray-100 bg-white/95 px-4 py-4 backdrop-blur sm:px-6 lg:px-8">
              {title && (
                <h2 className="text-xl font-bold text-gray-900">{title}</h2>
              )}
              {showClose && (
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors text-gray-400 hover:text-gray-600 ml-auto"
                >
                  <X className="w-5 h-5" />
                </button>
              )}
            </div>
          )}

          <div className="w-full px-4 py-5 sm:px-6 lg:px-8">
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};
