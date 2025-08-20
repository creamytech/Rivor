import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const themeBadgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--theme-surface)] text-[var(--theme-textPrimary)] hover:bg-[var(--theme-surfaceHover)]",
        primary: "border-transparent bg-[var(--theme-primary)] text-[var(--theme-textInverse)] hover:bg-[var(--theme-primaryHover)] shadow-lg",
        secondary: "border-transparent bg-[var(--theme-secondary)] text-[var(--theme-textInverse)] hover:bg-[var(--theme-secondaryHover)] shadow-lg",
        accent: "border-transparent bg-[var(--theme-accent)] text-[var(--theme-textInverse)] hover:bg-[var(--theme-accentHover)] shadow-lg",
        outline: "border-[var(--theme-border)] text-[var(--theme-textPrimary)] hover:bg-[var(--theme-surfaceHover)] hover:border-[var(--theme-borderHover)]",
        glass: "border-[var(--theme-borderHover)] bg-[var(--theme-glassBg)] backdrop-blur-[var(--theme-glassBlur)] text-[var(--theme-textPrimary)] hover:border-[var(--theme-borderActive)]",
        luxury: "border-2 border-[var(--theme-borderActive)] bg-[var(--theme-gradient)] text-[var(--theme-textInverse)] shadow-xl hover:shadow-2xl hover:scale-105",
        success: "border-transparent bg-[var(--theme-success)] text-white hover:opacity-90 shadow-md",
        warning: "border-transparent bg-[var(--theme-warning)] text-white hover:opacity-90 shadow-md",
        error: "border-transparent bg-[var(--theme-error)] text-white hover:opacity-90 shadow-md",
        info: "border-transparent bg-[var(--theme-info)] text-white hover:opacity-90 shadow-md",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        default: "px-2.5 py-0.5 text-xs",
        lg: "px-3 py-1 text-sm",
      },
      glow: {
        none: "",
        subtle: "shadow-md hover:shadow-lg",
        strong: "shadow-lg hover:shadow-xl ring-2 ring-[var(--theme-primary)]/20 hover:ring-[var(--theme-primary)]/40",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface ThemeBadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themeBadgeVariants> {
  animated?: boolean;
  dot?: boolean;
}

function ThemeBadge({
  className,
  variant,
  size,
  glow,
  animated,
  dot,
  children,
  ...props
}: ThemeBadgeProps) {
  const animatedClasses = animated ? "hover:scale-110 transition-transform duration-200" : "";
  
  return (
    <div 
      className={cn(themeBadgeVariants({ variant, size, glow }), animatedClasses, className)} 
      {...props}
    >
      {dot && (
        <span className="mr-1 h-1.5 w-1.5 rounded-full bg-current opacity-60" />
      )}
      {children}
    </div>
  )
}

export { ThemeBadge, themeBadgeVariants }