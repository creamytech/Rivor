"use client";
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  RefreshCw, 
  XCircle, 
  Activity,
  Shield,
  Zap
} from 'lucide-react';

interface StatusBadgeProps {
  status: 'connected' | 'backfilling' | 'live' | 'token_issue' | 'disconnected' | 'error' | 'pending';
  label?: string;
  size?: 'sm' | 'md' | 'lg';
  showIcon?: boolean;
  showPulse?: boolean;
  className?: string;
}

export default function StatusBadge({
  status,
  label,
  size = 'md',
  showIcon = true,
  showPulse = true,
  className = ''
}: StatusBadgeProps) {
  const config = {
    connected: {
      icon: CheckCircle,
      label: label || 'Connected',
      colors: 'bg-jade-50 text-jade-700 border-jade-200 dark:bg-jade-950 dark:text-jade-300 dark:border-jade-800',
      iconColor: 'text-jade-500',
      pulse: false
    },
    backfilling: {
      icon: RefreshCw,
      label: label || 'Backfilling',
      colors: 'bg-azure-50 text-azure-700 border-azure-200 dark:bg-azure-950 dark:text-azure-300 dark:border-azure-800',
      iconColor: 'text-azure-500',
      pulse: true
    },
    live: {
      icon: Zap,
      label: label || 'Live',
      colors: 'bg-teal-50 text-teal-700 border-teal-200 dark:bg-teal-950 dark:text-teal-300 dark:border-teal-800',
      iconColor: 'text-teal-500',
      pulse: true
    },
    token_issue: {
      icon: Shield,
      label: label || 'Token Issue',
      colors: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950 dark:text-amber-300 dark:border-amber-800',
      iconColor: 'text-amber-500',
      pulse: false
    },
    disconnected: {
      icon: XCircle,
      label: label || 'Disconnected',
      colors: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800',
      iconColor: 'text-slate-500',
      pulse: false
    },
    error: {
      icon: AlertCircle,
      label: label || 'Error',
      colors: 'bg-red-50 text-red-700 border-red-200 dark:bg-red-950 dark:text-red-300 dark:border-red-800',
      iconColor: 'text-red-500',
      pulse: false
    },
    pending: {
      icon: Clock,
      label: label || 'Pending',
      colors: 'bg-slate-50 text-slate-700 border-slate-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-800',
      iconColor: 'text-slate-500',
      pulse: true
    }
  };

  const sizeClasses = {
    sm: 'px-2 py-1 text-xs',
    md: 'px-3 py-1.5 text-sm',
    lg: 'px-4 py-2 text-base'
  };

  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-4 w-4',
    lg: 'h-5 w-5'
  };

  const currentConfig = config[status];
  const Icon = currentConfig.icon;
  const shouldPulse = showPulse && currentConfig.pulse;

  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <motion.div
      className={cn(
        'inline-flex items-center gap-2 rounded-full border font-medium',
        sizeClasses[size],
        currentConfig.colors,
        className
      )}
      initial={prefersReducedMotion ? {} : { opacity: 0, scale: 0.95 }}
      animate={prefersReducedMotion ? {} : { opacity: 1, scale: 1 }}
      transition={prefersReducedMotion ? {} : {
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
    >
      {showIcon && (
        <div className="relative">
          <Icon className={cn(iconSizes[size], currentConfig.iconColor)} />
          
          {/* Pulse ring for active states */}
          {shouldPulse && !prefersReducedMotion && (
            <motion.div
              className={cn(
                'absolute inset-0 rounded-full border-2 opacity-30',
                currentConfig.iconColor.replace('text-', 'border-')
              )}
              animate={{
                scale: [1, 1.5],
                opacity: [0.3, 0]
              }}
              transition={{
                duration: 2,
                repeat: Infinity,
                ease: "easeOut"
              }}
            />
          )}
        </div>
      )}
      
      <span>{currentConfig.label}</span>
      
      {/* Animated icon rotation for active states */}
      {(status === 'backfilling' || status === 'pending') && !prefersReducedMotion && showIcon && (
        <motion.div
          className="absolute"
          animate={{ rotate: 360 }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: "linear"
          }}
        >
          <Activity className={cn(iconSizes[size], 'opacity-0')} />
        </motion.div>
      )}
    </motion.div>
  );
}
