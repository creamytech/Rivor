"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { ReactNode } from 'react';

interface FlowCardProps {
  children: ReactNode;
  className?: string;
  glassy?: boolean;
  hoverable?: boolean;
  withRipple?: boolean;
  variant?: 'default' | 'elevated' | 'hero';
}

export default function FlowCard({
  children,
  className = '',
  glassy = false,
  hoverable = true,
  withRipple = true,
  variant = 'default'
}: FlowCardProps) {
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  const variantClasses = {
    default: 'bg-[var(--color-navy-50)] dark:bg-[var(--color-navy-800)] shadow-sm',
    elevated: 'bg-[var(--color-navy-50)] dark:bg-[var(--color-navy-800)] shadow-lg',
    hero: 'bg-gradient-to-br from-[var(--color-navy-50)]/95 to-[var(--color-navy-100)]/95 dark:from-[var(--color-navy-800)]/95 dark:to-[var(--color-navy-900)]/95 shadow-xl backdrop-blur-sm'
  };

  const glassyClasses = glassy
    ? 'backdrop-blur-md bg-[var(--color-navy-50)]/80 dark:bg-[var(--color-navy-800)]/80 border border-white/20'
    : '';

  return (
    <motion.div
      className={cn(
        'rounded-[var(--radius-2xl)] border border-[var(--color-navy-200)] dark:border-[var(--color-navy-700)] overflow-hidden',
        variantClasses[variant],
        glassyClasses,
        hoverable && 'cursor-pointer',
        className
      )}
      initial={prefersReducedMotion ? {} : { opacity: 0, y: 20 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, y: 0 }}
      transition={prefersReducedMotion ? {} : {
        duration: 0.3,
        ease: [0.22, 1, 0.36, 1]
      }}
      whileHover={
        !prefersReducedMotion && hoverable && withRipple
          ? { 
              scale: 1.02,
              transition: { duration: 0.18, ease: [0.22, 1, 0.36, 1] }
            }
          : hoverable && !prefersReducedMotion
          ? {
              borderColor: 'var(--color-teal-500)',
              transition: { duration: 0.2 }
            }
          : {}
      }
      whileTap={
        !prefersReducedMotion && withRipple 
          ? { scale: 0.98 }
          : {}
      }
    >
      {/* Subtle noise texture overlay */}
      <div 
        className="absolute inset-0 opacity-[0.02] pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Ccircle cx='7' cy='7' r='1'/%3E%3Ccircle cx='27' cy='17' r='1'/%3E%3Ccircle cx='47' cy='27' r='1'/%3E%3Ccircle cx='17' cy='37' r='1'/%3E%3Ccircle cx='37' cy='47' r='1'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
        }}
      />
      
      {/* Content */}
      <div className="relative z-10">
        {children}
      </div>
      
      {/* Flowing border accent */}
      {variant === 'hero' && !prefersReducedMotion && (
        <motion.div
          className="absolute inset-0 rounded-[var(--radius-2xl)]"
          style={{
            background: 'linear-gradient(90deg, transparent, rgba(20, 184, 166, 0.3), transparent)',
            backgroundSize: '200% 100%'
          }}
          animate={{
            backgroundPosition: ['0% 0%', '200% 0%']
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'linear'
          }}
        />
      )}
    </motion.div>
  );
}
