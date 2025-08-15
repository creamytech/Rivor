"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface DataEmptyProps {
  icon: ReactNode;
  title: string;
  description: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  className?: string;
}

export default function DataEmpty({
  icon,
  title,
  description,
  action,
  className = ''
}: DataEmptyProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      className={cn(
        'flex flex-col items-center justify-center p-12 text-center',
        className
      )}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? {} : {
        duration: 0.4,
        ease: [0.22, 1, 0.36, 1]
      }}
    >
      {/* Icon with gentle float */}
      <motion.div
        className="mb-6 text-slate-400 dark:text-slate-500"
        animate={prefersReducedMotion ? {} : {
          y: [0, -8, 0]
        }}
        transition={prefersReducedMotion ? {} : {
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut"
        }}
      >
        {icon}
      </motion.div>
      
      {/* Content */}
      <div className="max-w-md space-y-3">
        <h3 className="text-lg font-semibold text-slate-900 dark:text-slate-100">
          {title}
        </h3>
        <p className="text-slate-600 dark:text-slate-400">
          {description}
        </p>
      </div>
      
      {/* Action */}
      {action && (
        <motion.button
          onClick={action.onClick}
          className={cn(
            'mt-6 px-6 py-3 bg-gradient-to-r from-teal-500 to-azure-500',
            'text-white font-medium rounded-xl shadow-lg',
            'hover:shadow-xl hover:shadow-teal-500/25',
            'transition-all duration-200'
          )}
          whileHover={prefersReducedMotion ? {} : { 
            scale: 1.05,
            transition: { duration: 0.15 }
          }}
          whileTap={prefersReducedMotion ? {} : { scale: 0.95 }}
        >
          {action.label}
        </motion.button>
      )}
      
      {/* Decorative elements */}
      {!prefersReducedMotion && (
        <>
          {/* Floating dots */}
          {[...Array(3)].map((_, i) => (
            <motion.div
              key={i}
              className="absolute w-2 h-2 bg-teal-400/20 rounded-full"
              style={{
                left: `${30 + i * 20}%`,
                top: `${20 + i * 10}%`
              }}
              animate={{
                y: [0, -20, 0],
                opacity: [0.2, 0.5, 0.2]
              }}
              transition={{
                duration: 3 + i,
                repeat: Infinity,
                delay: i * 0.5,
                ease: "easeInOut"
              }}
            />
          ))}
        </>
      )}
    </motion.div>
  );
}
