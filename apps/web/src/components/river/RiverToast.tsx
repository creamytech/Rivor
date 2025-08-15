"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '@/lib/utils';
import { X, CheckCircle, AlertCircle, Info, AlertTriangle } from 'lucide-react';
import { createContext, useContext, useState, ReactNode, useCallback } from 'react';

interface ToastData {
  id: string;
  title: string;
  description?: string;
  type: 'success' | 'error' | 'warning' | 'info';
  duration?: number;
  action?: {
    label: string;
    onClick: () => void;
  };
}

interface ToastContextType {
  toasts: ToastData[];
  addToast: (toast: Omit<ToastData, 'id'>) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastData[]>([]);

  const addToast = useCallback((toast: Omit<ToastData, 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9);
    const newToast = { ...toast, id };
    
    setToasts(prev => [...prev, newToast]);
    
    // Auto remove after duration
    const duration = toast.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeToast(id);
      }, duration);
    }
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(toast => toast.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, addToast, removeToast }}>
      {children}
      <ToastContainer />
    </ToastContext.Provider>
  );
}

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }
  return context;
}

function ToastContainer() {
  const { toasts, removeToast } = useToast();
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  return (
    <div className="fixed top-4 right-4 z-50 space-y-2 max-w-sm">
      <AnimatePresence>
        {toasts.map((toast) => (
          <Toast
            key={toast.id}
            toast={toast}
            onRemove={() => removeToast(toast.id)}
            prefersReducedMotion={prefersReducedMotion}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}

interface ToastProps {
  toast: ToastData;
  onRemove: () => void;
  prefersReducedMotion: boolean;
}

function Toast({ toast, onRemove, prefersReducedMotion }: ToastProps) {
  const icons = {
    success: CheckCircle,
    error: AlertCircle,
    warning: AlertTriangle,
    info: Info
  };

  const colors = {
    success: 'border-jade-200 bg-jade-50 text-jade-900 dark:border-jade-800 dark:bg-jade-950 dark:text-jade-100',
    error: 'border-red-200 bg-red-50 text-red-900 dark:border-red-800 dark:bg-red-950 dark:text-red-100',
    warning: 'border-amber-200 bg-amber-50 text-amber-900 dark:border-amber-800 dark:bg-amber-950 dark:text-amber-100',
    info: 'border-azure-200 bg-azure-50 text-azure-900 dark:border-azure-800 dark:bg-azure-950 dark:text-azure-100'
  };

  const iconColors = {
    success: 'text-jade-500',
    error: 'text-red-500',
    warning: 'text-amber-500',
    info: 'text-azure-500'
  };

  const Icon = icons[toast.type];

  return (
    <motion.div
      layout
      initial={prefersReducedMotion ? {} : { 
        opacity: 0, 
        x: 300,
        scale: 0.95
      }}
      animate={prefersReducedMotion ? {} : { 
        opacity: 1, 
        x: 0,
        scale: 1
      }}
      exit={prefersReducedMotion ? {} : { 
        opacity: 0, 
        x: 300,
        scale: 0.95
      }}
      transition={prefersReducedMotion ? {} : {
        type: "spring",
        stiffness: 300,
        damping: 30
      }}
      className={cn(
        'relative p-4 rounded-xl border shadow-lg backdrop-blur-sm',
        'max-w-sm overflow-hidden',
        colors[toast.type]
      )}
    >
      {/* Flowing border accent */}
      {!prefersReducedMotion && (
        <motion.div
          className="absolute top-0 left-0 right-0 h-0.5 bg-gradient-to-r from-transparent via-current to-transparent opacity-30"
          initial={{ x: '-100%' }}
          animate={{ x: '100%' }}
          transition={{
            duration: 2,
            ease: 'linear',
            repeat: Infinity,
            repeatDelay: 3
          }}
        />
      )}

      <div className="flex items-start gap-3">
        <Icon className={cn('h-5 w-5 mt-0.5 flex-shrink-0', iconColors[toast.type])} />
        
        <div className="flex-1 min-w-0">
          <h4 className="font-semibold text-sm">{toast.title}</h4>
          {toast.description && (
            <p className="text-sm opacity-80 mt-1">{toast.description}</p>
          )}
          
          {toast.action && (
            <button
              onClick={toast.action.onClick}
              className="text-sm font-medium underline mt-2 hover:no-underline"
            >
              {toast.action.label}
            </button>
          )}
        </div>
        
        <button
          onClick={onRemove}
          className="flex-shrink-0 p-1 rounded-lg hover:bg-black/5 dark:hover:bg-white/5 transition-colors"
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </motion.div>
  );
}
