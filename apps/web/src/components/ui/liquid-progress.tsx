"use client";
import * as React from "react";
import { cn } from "@/lib/utils";

interface LiquidProgressProps {
  value: number;
  max?: number;
  className?: string;
  variant?: 'default' | 'river' | 'wave';
  color?: 'blue' | 'green' | 'red' | 'yellow' | 'purple';
  animated?: boolean;
}

const LiquidProgress = React.forwardRef<HTMLDivElement, LiquidProgressProps>(
  ({ value, max = 100, className, variant = 'default', color = 'blue', animated = true, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    const colorClasses = {
      blue: 'from-blue-400 to-blue-600',
      green: 'from-green-400 to-green-600',
      red: 'from-red-400 to-red-600',
      yellow: 'from-yellow-400 to-yellow-600',
      purple: 'from-purple-400 to-purple-600',
    };

    const waveClasses = cn(
      "absolute inset-0 bg-gradient-to-r",
      colorClasses[color],
      "opacity-80"
    );

    const liquidClasses = cn(
      "absolute inset-0 bg-gradient-to-r",
      colorClasses[color],
      "transition-all duration-1000 ease-out"
    );

    return (
      <div
        ref={ref}
        className={cn(
          "relative w-full h-3 bg-slate-200 dark:bg-slate-700 rounded-full overflow-hidden",
          className
        )}
        {...props}
      >
        {/* Liquid Fill */}
        <div
          className={liquidClasses}
          style={{ 
            width: `${percentage}%`,
            transition: animated ? 'width 1s cubic-bezier(0.4, 0, 0.2, 1)' : 'none'
          }}
        />
        
        {/* Wave Effect for River Variant */}
        {variant === 'river' && animated && (
          <>
            <div
              className={cn(waveClasses, "animate-pulse")}
              style={{ 
                width: `${percentage}%`,
                animationDelay: '0s',
                animationDuration: '2s'
              }}
            />
            <div
              className={cn(waveClasses, "animate-pulse")}
              style={{ 
                width: `${percentage}%`,
                animationDelay: '1s',
                animationDuration: '2s'
              }}
            />
          </>
        )}
        
        {/* Wave Effect for Wave Variant */}
        {variant === 'wave' && animated && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent",
              "animate-pulse"
            )}
            style={{ 
              width: `${percentage}%`,
              animationDuration: '1.5s'
            }}
          />
        )}
        
        {/* Shimmer Effect */}
        {animated && (
          <div
            className={cn(
              "absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent",
              "animate-pulse"
            )}
            style={{ 
              width: `${percentage}%`,
              animationDuration: '3s',
              animationDelay: '0.5s'
            }}
          />
        )}
      </div>
    );
  }
);

LiquidProgress.displayName = "LiquidProgress";

export { LiquidProgress };
