"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SkeletonFlowProps {
  className?: string;
  lines?: number;
  variant?: 'text' | 'card' | 'list';
}

export default function SkeletonFlow({
  className = '',
  lines = 3,
  variant = 'text'
}: SkeletonFlowProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const shimmerAnimation = prefersReducedMotion ? {} : {
    x: ['-100%', '100%']
  };

  const shimmerTransition = prefersReducedMotion ? {} : {
    duration: 2,
    repeat: Infinity,
    ease: 'linear'
  };

  if (variant === 'card') {
    return (
      <div className={cn('rounded-2xl bg-slate-100 dark:bg-slate-800 p-6 overflow-hidden', className)}>
        <div className="relative">
          {/* Avatar */}
          <div className="w-12 h-12 bg-slate-200 dark:bg-slate-700 rounded-full mb-4 overflow-hidden">
            {!prefersReducedMotion && (
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                animate={shimmerAnimation}
                transition={shimmerTransition}
              />
            )}
          </div>
          
          {/* Title */}
          <div className="h-5 bg-slate-200 dark:bg-slate-700 rounded-lg mb-3 w-3/4 overflow-hidden">
            {!prefersReducedMotion && (
              <motion.div
                className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                animate={shimmerAnimation}
                transition={shimmerTransition}
              />
            )}
          </div>
          
          {/* Content lines */}
          {[...Array(lines)].map((_, i) => (
            <div
              key={i}
              className={cn(
                'h-3 bg-slate-200 dark:bg-slate-700 rounded-lg mb-2 overflow-hidden',
                i === lines - 1 ? 'w-1/2' : 'w-full'
              )}
            >
              {!prefersReducedMotion && (
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                  animate={shimmerAnimation}
                  transition={{
                    ...shimmerTransition,
                    delay: i * 0.1
                  }}
                />
              )}
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={cn('space-y-4', className)}>
        {[...Array(lines)].map((_, i) => (
          <div key={i} className="flex items-center gap-3">
            {/* Icon placeholder */}
            <div className="w-10 h-10 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden">
              {!prefersReducedMotion && (
                <motion.div
                  className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                  animate={shimmerAnimation}
                  transition={{
                    ...shimmerTransition,
                    delay: i * 0.1
                  }}
                />
              )}
            </div>
            
            {/* Content */}
            <div className="flex-1 space-y-2">
              <div className="h-4 bg-slate-200 dark:bg-slate-700 rounded-lg w-3/4 overflow-hidden">
                {!prefersReducedMotion && (
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                    animate={shimmerAnimation}
                    transition={{
                      ...shimmerTransition,
                      delay: i * 0.1
                    }}
                  />
                )}
              </div>
              <div className="h-3 bg-slate-200 dark:bg-slate-700 rounded-lg w-1/2 overflow-hidden">
                {!prefersReducedMotion && (
                  <motion.div
                    className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
                    animate={shimmerAnimation}
                    transition={{
                      ...shimmerTransition,
                      delay: i * 0.15
                    }}
                  />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  // Default text variant
  return (
    <div className={cn('space-y-3', className)}>
      {[...Array(lines)].map((_, i) => (
        <div
          key={i}
          className={cn(
            'h-4 bg-slate-200 dark:bg-slate-700 rounded-lg overflow-hidden',
            i === lines - 1 ? 'w-3/4' : 'w-full'
          )}
        >
          {!prefersReducedMotion && (
            <motion.div
              className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent dark:via-slate-600/60"
              animate={shimmerAnimation}
              transition={{
                ...shimmerTransition,
                delay: i * 0.1
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}
