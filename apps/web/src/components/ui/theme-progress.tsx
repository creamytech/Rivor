import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const themeProgressVariants = cva(
  "relative h-2 w-full overflow-hidden rounded-full",
  {
    variants: {
      variant: {
        default: "bg-[var(--theme-surface)]",
        glass: "bg-[var(--theme-glassBg)] backdrop-blur-[var(--theme-glassBlur)] border border-[var(--theme-borderHover)]",
        luxury: "bg-[var(--theme-backgroundSecondary)] border-2 border-[var(--theme-borderActive)] shadow-inner",
        pattern: "bg-[var(--theme-surface)] relative before:absolute before:inset-0 before:bg-[var(--theme-pattern-subtle)] before:opacity-30",
      },
      size: {
        sm: "h-1",
        default: "h-2",
        lg: "h-3",
        xl: "h-4",
      },
      glow: {
        none: "",
        subtle: "shadow-sm",
        strong: "shadow-md ring-1 ring-[var(--theme-primary)]/20",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default", 
      glow: "none",
    },
  }
)

const themeProgressFillVariants = cva(
  "h-full w-full flex-1 transition-all duration-500 ease-out",
  {
    variants: {
      fillVariant: {
        primary: "bg-[var(--theme-primary)]",
        gradient: "bg-[var(--theme-gradient)]",
        accent: "bg-[var(--theme-accent)]",
        success: "bg-[var(--theme-success)]",
        warning: "bg-[var(--theme-warning)]",
        error: "bg-[var(--theme-error)]",
        animated: "bg-[var(--theme-gradient)] bg-[length:200%_100%] animate-pulse",
      },
      glow: {
        none: "",
        subtle: "shadow-sm",
        strong: "shadow-lg drop-shadow-lg",
      }
    },
    defaultVariants: {
      fillVariant: "primary",
      glow: "none",
    },
  }
)

export interface ThemeProgressProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themeProgressVariants> {
  value?: number;
  max?: number;
  fillVariant?: VariantProps<typeof themeProgressFillVariants>["fillVariant"];
  fillGlow?: VariantProps<typeof themeProgressFillVariants>["glow"];
  animated?: boolean;
  showValue?: boolean;
  label?: string;
}

const ThemeProgress = React.forwardRef<HTMLDivElement, ThemeProgressProps>(
  ({ 
    className, 
    variant, 
    size, 
    glow, 
    fillVariant, 
    fillGlow,
    value = 0, 
    max = 100, 
    animated,
    showValue,
    label,
    ...props 
  }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);
    
    return (
      <div className="w-full space-y-1">
        {(label || showValue) && (
          <div className="flex justify-between items-center text-sm">
            {label && (
              <span className="text-[var(--theme-textSecondary)] font-medium">{label}</span>
            )}
            {showValue && (
              <span className="text-[var(--theme-textMuted)] tabular-nums">
                {Math.round(percentage)}%
              </span>
            )}
          </div>
        )}
        <div
          ref={ref}
          className={cn(themeProgressVariants({ variant, size, glow, className }))}
          {...props}
        >
          <div
            className={cn(
              themeProgressFillVariants({ fillVariant, glow: fillGlow }),
              animated && "bg-gradient-to-r from-[var(--theme-primary)] via-[var(--theme-accent)] to-[var(--theme-secondary)] bg-[length:200%_100%] animate-[shimmer_2s_infinite]"
            )}
            style={{
              transform: `translateX(-${100 - percentage}%)`,
            }}
          />
          {variant === "luxury" && (
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-[shimmer_3s_infinite]" />
          )}
        </div>
      </div>
    )
  }
)
ThemeProgress.displayName = "ThemeProgress"

export { ThemeProgress, themeProgressVariants, themeProgressFillVariants }