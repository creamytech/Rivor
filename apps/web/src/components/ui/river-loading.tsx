import React from 'react';

interface RiverLoadingProps {
  text?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export function RiverLoading({ 
  text = "Flowing...", 
  size = 'md',
  className = '' 
}: RiverLoadingProps) {
  const sizeClasses = {
    sm: 'h-1 text-sm',
    md: 'h-2 text-base', 
    lg: 'h-3 text-lg'
  };

  return (
    <div className={`flex flex-col items-center gap-4 ${className}`}>
      {text && (
        <div className={`flow-gradient bg-clip-text text-transparent font-medium ${sizeClasses[size].split(' ')[1]}`}>
          {text}
        </div>
      )}
      <div className="w-full max-w-xs relative">
        <div className={`w-full bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden ${sizeClasses[size].split(' ')[0]}`}>
          <div className="h-full bg-gradient-to-r from-blue-400 via-teal-500 to-blue-600 rounded-full loading-flow"></div>
        </div>
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full animate-shimmer"></div>
      </div>
    </div>
  );
}

export function RiverSpinner({ size = 'md', className = '' }: { size?: 'sm' | 'md' | 'lg', className?: string }) {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12'
  };

  return (
    <div className={`${sizeClasses[size]} ${className}`}>
      <div className="w-full h-full border-2 border-gray-200 dark:border-gray-700 border-t-blue-500 rounded-full animate-spin"></div>
    </div>
  );
}

// River-themed dots loading
export function RiverDots({ className = '' }: { className?: string }) {
  return (
    <div className={`flex space-x-1 ${className}`}>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
          style={{ animationDelay: `${i * 0.1}s` }}
        ></div>
      ))}
    </div>
  );
}
