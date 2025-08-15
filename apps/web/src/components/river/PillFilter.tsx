"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface PillFilterProps {
  options: Array<{
    id: string;
    label: string;
    count?: number;
  }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function PillFilter({
  options,
  value,
  onChange,
  className = ''
}: PillFilterProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className={cn('flex items-center gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl', className)}>
      {options.map((option) => {
        const isActive = value === option.id;
        
        return (
          <button
            key={option.id}
            onClick={() => onChange(option.id)}
            className={cn(
              'relative px-4 py-2 rounded-lg text-sm font-medium transition-colors',
              'hover:bg-white/50 dark:hover:bg-slate-700/50',
              isActive 
                ? 'text-slate-900 dark:text-slate-100' 
                : 'text-slate-600 dark:text-slate-400'
            )}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                layoutId="activeTab"
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={prefersReducedMotion ? {} : { opacity: 1 }}
                transition={prefersReducedMotion ? {} : {
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              />
            )}
            
            {/* Flowing underline */}
            {isActive && !prefersReducedMotion && (
              <motion.div
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 to-azure-400 rounded-full"
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                transition={{
                  duration: 0.3,
                  ease: [0.22, 1, 0.36, 1]
                }}
              />
            )}
            
            {/* Content */}
            <span className="relative z-10 flex items-center gap-2">
              {option.label}
              {option.count !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                )}>
                  {option.count}
                </span>
              )}
            </span>
            
            {/* Hover ripple */}
            {!prefersReducedMotion && (
              <motion.div
                className="absolute inset-0 bg-teal-400/10 rounded-lg opacity-0"
                whileHover={{ opacity: 1 }}
                transition={{ duration: 0.15 }}
              />
            )}
          </button>
        );
      })}
    </div>
  );
}
