"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface RiverProgressProps {
  value: number;
  max?: number;
  className?: string;
  showShimmer?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'success' | 'warning' | 'error';
}

export default function RiverProgress({
  value,
  max = 100,
  className = '',
  showShimmer = true,
  size = 'md',
  variant = 'default'
}: RiverProgressProps) {
  const percentage = Math.min((value / max) * 100, 100);
  
  const sizeClasses = {
    sm: 'h-1',
    md: 'h-2',
    lg: 'h-3'
  };
  
  const variantClasses = {
    default: 'from-teal-400 to-azure-400',
    success: 'from-jade-400 to-teal-400',
    warning: 'from-amber-400 to-orange-400',
    error: 'from-red-400 to-rose-400'
  };

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={cn(
      'relative w-full bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden',
      sizeClasses[size],
      className
    )}>
      <motion.div
        className={cn(
          'h-full bg-gradient-to-r rounded-full relative',
          variantClasses[variant]
        )}
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{
          duration: prefersReducedMotion ? 0 : 0.8,
          ease: [0.22, 1, 0.36, 1]
        }}
      >
        {/* Flowing shimmer effect */}
        {showShimmer && !prefersReducedMotion && percentage > 0 && (
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent -skew-x-12"
            initial={{ x: '-100%' }}
            animate={{ x: '200%' }}
            transition={{
              duration: 2,
              repeat: Infinity,
              ease: 'linear',
              repeatDelay: 1
            }}
          />
        )}
      </motion.div>
      
      {/* Background glow for higher values */}
      {percentage > 70 && (
        <div 
          className={cn(
            'absolute inset-0 rounded-full opacity-20 blur-sm',
            variantClasses[variant],
            'bg-gradient-to-r'
          )}
          style={{ transform: 'scale(1.1)' }}
        />
      )}
    </div>
  );
}
