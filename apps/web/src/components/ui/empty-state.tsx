"use client";
import * as React from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actions?: Array<{
    label: string;
    onClick: () => void;
    variant?: 'default' | 'outline' | 'secondary';
    icon?: React.ReactNode;
  }>;
  illustration?: 'waves' | 'bubbles' | 'flow' | 'dots' | 'none';
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

const EmptyState = React.forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ 
    icon, 
    title, 
    description, 
    actions = [], 
    illustration = 'waves',
    size = 'md',
    className,
    ...props 
  }, ref) => {
    const sizeClasses = {
      sm: 'p-6',
      md: 'p-8',
      lg: 'p-12'
    };

    const iconSizes = {
      sm: 'h-8 w-8',
      md: 'h-12 w-12',
      lg: 'h-16 w-16'
    };

    const renderIllustration = () => {
      switch (illustration) {
        case 'waves':
          return (
            <div className="absolute inset-0 overflow-hidden opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M0,50 Q25,30 50,50 T100,50 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                />
                <path
                  d="M0,60 Q25,40 50,60 T100,60 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                  style={{ animationDelay: '0.5s' }}
                />
              </svg>
            </div>
          );
        case 'bubbles':
          return (
            <div className="absolute inset-0 overflow-hidden opacity-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <motion.div
                  key={i}
                  className="absolute rounded-full bg-current"
                  style={{
                    width: `${20 + i * 8}px`,
                    height: `${20 + i * 8}px`,
                    left: `${10 + i * 15}%`,
                    top: `${20 + (i % 3) * 25}%`,
                  }}
                  animate={{
                    y: [0, -10, 0],
                    opacity: [0.3, 0.7, 0.3],
                  }}
                  transition={{
                    duration: 3,
                    delay: i * 0.2,
                    repeat: Infinity,
                    ease: "easeInOut"
                  }}
                />
              ))}
            </div>
          );
        case 'flow':
          return (
            <div className="absolute inset-0 overflow-hidden opacity-5">
              <svg className="w-full h-full" viewBox="0 0 100 100" preserveAspectRatio="none">
                <path
                  d="M0,20 C20,10 40,30 60,20 S80,10 100,20 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                />
                <path
                  d="M0,40 C20,30 40,50 60,40 S80,30 100,40 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                  style={{ animationDelay: '1s' }}
                />
                <path
                  d="M0,60 C20,50 40,70 60,60 S80,50 100,60 L100,100 L0,100 Z"
                  fill="currentColor"
                  className="animate-pulse"
                  style={{ animationDelay: '2s' }}
                />
              </svg>
            </div>
          );
        case 'dots':
          return (
            <div className="absolute inset-0 overflow-hidden opacity-5">
              <div className="grid grid-cols-6 gap-2 h-full items-center justify-center">
                {Array.from({ length: 18 }).map((_, i) => (
                  <motion.div
                    key={i}
                    className="w-2 h-2 rounded-full bg-current"
                    animate={{
                      scale: [1, 1.2, 1],
                      opacity: [0.3, 0.8, 0.3],
                    }}
                    transition={{
                      duration: 2,
                      delay: i * 0.1,
                      repeat: Infinity,
                      ease: "easeInOut"
                    }}
                  />
                ))}
              </div>
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative text-center rounded-lg border border-dashed border-slate-200 dark:border-slate-700",
          sizeClasses[size],
          className
        )}
        {...props}
      >
        {renderIllustration()}
        
        <div className="relative z-10">
          {icon && (
            <motion.div
              initial={{ scale: 0, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className={cn(
                "mx-auto mb-4 flex items-center justify-center rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400",
                iconSizes[size]
              )}
            >
              {icon}
            </motion.div>
          )}
          
          <motion.h3
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.1, ease: "easeOut" }}
            className="text-lg font-semibold text-slate-900 dark:text-slate-100 mb-2"
          >
            {title}
          </motion.h3>
          
          <motion.p
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.2, ease: "easeOut" }}
            className="text-sm text-slate-600 dark:text-slate-400 mb-6 max-w-sm mx-auto"
          >
            {description}
          </motion.p>
          
          {actions.length > 0 && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              transition={{ duration: 0.5, delay: 0.3, ease: "easeOut" }}
              className="flex flex-col sm:flex-row gap-3 justify-center"
            >
              {actions.map((action, index) => (
                <Button
                  key={index}
                  variant={action.variant || 'default'}
                  onClick={action.onClick}
                  className="flex items-center gap-2"
                >
                  {action.icon}
                  {action.label}
                </Button>
              ))}
            </motion.div>
          )}
        </div>
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
