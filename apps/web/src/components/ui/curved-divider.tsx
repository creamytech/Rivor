"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface CurvedDividerProps {
  className?: string;
  variant?: 'wave' | 'curve' | 'flow';
  direction?: 'up' | 'down';
  color?: 'blue' | 'cyan' | 'teal' | 'indigo';
  animated?: boolean;
}

const CurvedDivider = React.forwardRef<HTMLDivElement, CurvedDividerProps>(
  ({ className, variant = 'wave', direction = 'down', color = 'blue', animated = true, ...props }, ref) => {
    const colorClasses = {
      blue: 'fill-blue-100 dark:fill-blue-900/20',
      cyan: 'fill-cyan-100 dark:fill-cyan-900/20',
      teal: 'fill-teal-100 dark:fill-teal-900/20',
      indigo: 'fill-indigo-100 dark:fill-indigo-900/20',
    };

    const wavePath = direction === 'down' 
      ? "M0,0 C50,25 50,75 100,100 L100,0 Z"
      : "M0,100 C50,75 50,25 100,0 L100,100 Z";

    const curvePath = direction === 'down'
      ? "M0,0 Q50,50 100,100 L100,0 Z"
      : "M0,100 Q50,50 100,0 L100,100 Z";

    const flowPath = direction === 'down'
      ? "M0,0 C25,20 75,80 100,100 L100,0 Z"
      : "M0,100 C25,80 75,20 100,0 L100,100 Z";

    const getPath = () => {
      switch (variant) {
        case 'wave':
          return wavePath;
        case 'curve':
          return curvePath;
        case 'flow':
          return flowPath;
        default:
          return wavePath;
      }
    };

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-8",
          animated && "animate-pulse",
          className
        )}
        {...props}
      >
        <svg
          className={cn(
            "w-full h-full",
            colorClasses[color],
            animated && "transition-all duration-1000"
          )}
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
        >
          <path
            d={getPath()}
            className={cn(
              colorClasses[color],
              animated && "transition-all duration-1000"
            )}
          />
        </svg>
        
        {/* Animated overlay for flow effect */}
        {animated && variant === 'flow' && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent",
              "animate-pulse"
            )}
            style={{
              animationDuration: '3s',
              animationDelay: '1s'
            }}
          />
        )}
      </div>
    );
  }
);

CurvedDivider.displayName = "CurvedDivider";

export { CurvedDivider };
