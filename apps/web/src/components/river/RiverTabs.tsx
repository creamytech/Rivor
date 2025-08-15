"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface Tab {
  id: string;
  label: string;
  icon?: ReactNode;
  count?: number;
  disabled?: boolean;
}

interface RiverTabsProps {
  tabs: Tab[];
  value: string;
  onChange: (value: string) => void;
  variant?: 'default' | 'pills' | 'underline';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

export default function RiverTabs({
  tabs,
  value,
  onChange,
  variant = 'underline',
  size = 'md',
  className = ''
}: RiverTabsProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const sizeClasses = {
    sm: 'px-3 py-2 text-sm',
    md: 'px-4 py-3 text-sm',
    lg: 'px-6 py-4 text-base'
  };

  const renderUnderlineVariant = () => (
    <div className={cn('flex items-center', className)}>
      <div className="relative flex">
        {tabs.map((tab, index) => {
          const isActive = value === tab.id;
          const isDisabled = tab.disabled;
          
          return (
            <button
              key={tab.id}
              onClick={() => !isDisabled && onChange(tab.id)}
              disabled={isDisabled}
              className={cn(
                'relative flex items-center gap-2 font-medium transition-colors border-b-2 border-transparent',
                sizeClasses[size],
                isActive 
                  ? 'text-slate-900 dark:text-slate-100' 
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
                isDisabled && 'opacity-50 cursor-not-allowed'
              )}
            >
              {/* Active underline with flow animation */}
              {isActive && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-teal-400 via-azure-400 to-jade-400"
                  layoutId="activeUnderline"
                  initial={prefersReducedMotion ? {} : { scaleX: 0 }}
                  animate={prefersReducedMotion ? {} : { scaleX: 1 }}
                  transition={prefersReducedMotion ? {} : {
                    type: "spring",
                    stiffness: 300,
                    damping: 30
                  }}
                />
              )}
              
              {/* Flowing underline animation */}
              {isActive && !prefersReducedMotion && (
                <motion.div
                  className="absolute bottom-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-white/60 to-transparent"
                  animate={{
                    x: ['-100%', '100%']
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'linear'
                  }}
                />
              )}
              
              {/* Content */}
              <div className="flex items-center gap-2">
                {tab.icon && (
                  <span className={cn(
                    'transition-colors',
                    isActive 
                      ? 'text-teal-500' 
                      : 'text-slate-400 group-hover:text-slate-500'
                  )}>
                    {tab.icon}
                  </span>
                )}
                <span>{tab.label}</span>
                {tab.count !== undefined && (
                  <span className={cn(
                    'px-2 py-0.5 text-xs rounded-full',
                    isActive 
                      ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                      : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
                  )}>
                    {tab.count}
                  </span>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );

  const renderPillsVariant = () => (
    <div className={cn('flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        const isDisabled = tab.disabled;
        
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'relative flex items-center gap-2 font-medium rounded-lg transition-colors',
              sizeClasses[size],
              isActive 
                ? 'text-slate-900 dark:text-slate-100' 
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-200',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {/* Active background */}
            {isActive && (
              <motion.div
                className="absolute inset-0 bg-white dark:bg-slate-700 rounded-lg shadow-sm"
                layoutId="activePill"
                initial={prefersReducedMotion ? {} : { opacity: 0 }}
                animate={prefersReducedMotion ? {} : { opacity: 1 }}
                transition={prefersReducedMotion ? {} : {
                  type: "spring",
                  stiffness: 300,
                  damping: 30
                }}
              />
            )}
            
            {/* Content */}
            <div className="relative z-10 flex items-center gap-2">
              {tab.icon && (
                <span className={cn(
                  'transition-colors',
                  isActive 
                    ? 'text-teal-500' 
                    : 'text-slate-400'
                )}>
                  {tab.icon}
                </span>
              )}
              <span>{tab.label}</span>
              {tab.count !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.5 text-xs rounded-full',
                  isActive 
                    ? 'bg-slate-100 dark:bg-slate-600 text-slate-700 dark:text-slate-300'
                    : 'bg-slate-200 dark:bg-slate-700 text-slate-500 dark:text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
            </div>
          </button>
        );
      })}
    </div>
  );

  const renderDefaultVariant = () => (
    <div className={cn('flex items-center gap-1', className)}>
      {tabs.map((tab) => {
        const isActive = value === tab.id;
        const isDisabled = tab.disabled;
        
        return (
          <button
            key={tab.id}
            onClick={() => !isDisabled && onChange(tab.id)}
            disabled={isDisabled}
            className={cn(
              'flex items-center gap-2 font-medium rounded-lg transition-colors',
              sizeClasses[size],
              isActive 
                ? 'bg-teal-50 text-teal-700 dark:bg-teal-950 dark:text-teal-300' 
                : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800 hover:text-slate-800 dark:hover:text-slate-200',
              isDisabled && 'opacity-50 cursor-not-allowed'
            )}
          >
            {tab.icon && (
              <span className={cn(
                'transition-colors',
                isActive 
                  ? 'text-teal-500' 
                  : 'text-slate-400'
              )}>
                {tab.icon}
              </span>
            )}
            <span>{tab.label}</span>
            {tab.count !== undefined && (
              <span className={cn(
                'px-2 py-0.5 text-xs rounded-full',
                isActive 
                  ? 'bg-teal-100 text-teal-700 dark:bg-teal-900 dark:text-teal-300'
                  : 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400'
              )}>
                {tab.count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );

  switch (variant) {
    case 'pills':
      return renderPillsVariant();
    case 'underline':
      return renderUnderlineVariant();
    default:
      return renderDefaultVariant();
  }
}
