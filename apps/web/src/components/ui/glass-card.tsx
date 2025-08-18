import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'gradient' | 'ripple'
  intensity?: 'light' | 'medium' | 'strong'
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', intensity = 'medium', children, ...props }, ref) => {
    const baseClasses = cn(
      "glass rippleHover",
      "rounded-2xl border border-foam-20 backdrop-blur-8 transition-all duration-300",
      {
        'bg-depth-100/60': intensity === 'light',
        'bg-depth-100/80': intensity === 'medium',
        'bg-depth-100/90': intensity === 'strong',
      },
      {
        'bg-gradient-to-br from-current-500/10 via-current-600/10 to-current-700/10': variant === 'gradient',
        'hover:bg-gradient-to-br hover:from-current-500/20 hover:via-current-600/20 hover:to-current-700/20': variant === 'gradient',
      },
      {
        'relative overflow-hidden': variant === 'ripple',
      },
      className
    )

    return (
      <div ref={ref} className={baseClasses} {...props}>
        {variant === 'ripple' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-foam-20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
        {children}
      </div>
    )
  }
)
GlassCard.displayName = "GlassCard"

const GlassCardHeader = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("flex flex-col space-y-1.5 p-6", className)} {...props} />
))
GlassCardHeader.displayName = "GlassCardHeader"

const GlassCardTitle = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLHeadingElement>
>(({ className, ...props }, ref) => (
  <h3
    ref={ref}
    className={cn("font-semibold leading-none tracking-tight gradient-text", className)}
    {...props}
  />
))
GlassCardTitle.displayName = "GlassCardTitle"

const GlassCardDescription = React.forwardRef<
  HTMLParagraphElement,
  React.HTMLAttributes<HTMLParagraphElement>
>(({ className, ...props }, ref) => (
  <p
    ref={ref}
    className={cn("text-sm text-foam-60", className)}
    {...props}
  />
))
GlassCardDescription.displayName = "GlassCardDescription"

const GlassCardContent = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div ref={ref} className={cn("p-6 pt-0", className)} {...props} />
))
GlassCardContent.displayName = "GlassCardContent"

const GlassCardFooter = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    className={cn("flex items-center p-6 pt-0", className)}
    {...props}
  />
))
GlassCardFooter.displayName = "GlassCardFooter"

export { GlassCard, GlassCardHeader, GlassCardFooter, GlassCardTitle, GlassCardDescription, GlassCardContent }
