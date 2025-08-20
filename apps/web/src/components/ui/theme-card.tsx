import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const themeCardVariants = cva(
  "rounded-xl shadow transition-all duration-300",
  {
    variants: {
      variant: {
        default: "border border-[var(--border)] bg-[var(--muted)] text-[var(--foreground)]",
        surface: "bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-textPrimary)] hover:bg-[var(--theme-surfaceHover)] hover:border-[var(--theme-borderHover)]",
        glass: "bg-[var(--theme-glassBg)] backdrop-blur-[var(--theme-glassBlur)] border border-[var(--theme-borderHover)] text-[var(--theme-textPrimary)] hover:border-[var(--theme-borderActive)]",
        luxury: "bg-[var(--theme-backgroundSecondary)] border-2 border-[var(--theme-borderActive)] text-[var(--theme-textPrimary)] shadow-xl hover:shadow-2xl relative overflow-hidden",
        accent: "bg-[var(--theme-accentMuted)] border border-[var(--theme-accent)] text-[var(--theme-textPrimary)] hover:bg-[var(--theme-accent)] hover:text-[var(--theme-textInverse)]",
        pattern: "bg-[var(--theme-surface)] border border-[var(--theme-border)] text-[var(--theme-textPrimary)] relative before:absolute before:inset-0 before:bg-[var(--theme-pattern-subtle)] before:opacity-30",
      },
      size: {
        sm: "p-4",
        default: "p-6",
        lg: "p-8",
      },
      glow: {
        none: "",
        subtle: "shadow-lg hover:shadow-xl",
        strong: "shadow-xl hover:shadow-2xl ring-1 ring-[var(--theme-primary)]/20 hover:ring-[var(--theme-primary)]/40",
      }
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      glow: "none",
    },
  }
)

export interface ThemeCardProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof themeCardVariants> {
  gradient?: boolean;
  animated?: boolean;
}

const ThemeCard = React.forwardRef<HTMLDivElement, ThemeCardProps>(
  ({ className, variant, size, glow, gradient, animated, children, ...props }, ref) => {
    const baseClasses = themeCardVariants({ variant, size, glow, className });
    const gradientClasses = gradient ? "bg-gradient-to-br from-[var(--theme-surface)] to-[var(--theme-backgroundSecondary)]" : "";
    const animatedClasses = animated ? "hover:scale-[1.02] transition-transform duration-300" : "";
    
    return (
      <div
        ref={ref}
        className={cn(baseClasses, gradientClasses, animatedClasses)}
        {...props}
      >
        {variant === "luxury" && (
          <div className="absolute inset-0 bg-gradient-to-br from-[var(--theme-primary)]/5 to-[var(--theme-secondary)]/5 pointer-events-none" />
        )}
        <div className="relative z-10">
          {children}
        </div>
      </div>
    )
  }
)
ThemeCard.displayName = "ThemeCard"

const ThemeCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 mb-4", className)} {...props} />
))
ThemeCardHeader.displayName = "ThemeCardHeader"

const ThemeCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold text-lg leading-none tracking-tight text-[var(--theme-textPrimary)]", className)}
    {...props}
  />
))
ThemeCardTitle.displayName = "ThemeCardTitle"

const ThemeCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-[var(--theme-textMuted)]", className)}
    {...props}
  />
))
ThemeCardDescription.displayName = "ThemeCardDescription"

const ThemeCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("", className)} {...props} />
))
ThemeCardContent.displayName = "ThemeCardContent"

const ThemeCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center mt-4 pt-4 border-t border-[var(--theme-border)]", className)}
    {...props}
  />
))
ThemeCardFooter.displayName = "ThemeCardFooter"

export { 
  ThemeCard, 
  ThemeCardHeader, 
  ThemeCardFooter, 
  ThemeCardTitle, 
  ThemeCardDescription, 
  ThemeCardContent,
  themeCardVariants
}