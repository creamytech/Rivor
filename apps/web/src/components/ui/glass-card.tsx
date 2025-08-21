import * as React from "react"
import { cn } from "@/lib/utils"

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  variant?: 'default' | 'gradient' | 'ripple' | 'river-flow'
  intensity?: 'light' | 'medium' | 'strong'
  flowDirection?: 'left' | 'right' | 'up' | 'down'
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, variant = 'default', intensity = 'medium', flowDirection = 'right', children, ...props }, ref) => {
    const baseClasses = cn(
      "glass-card glass-hover-tilt glass-click-ripple",
      {
        'glass-bubble': variant === 'gradient',
        'glass-droplet': variant === 'ripple',
        'glass-panel': variant === 'river-flow',
      },
      className
    )

    const flowClasses = cn(
      "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700",
      {
        'bg-gradient-to-r from-transparent via-blue-400/10 to-transparent -translate-x-full group-hover:translate-x-full': 
          variant === 'river-flow' && flowDirection === 'right',
        'bg-gradient-to-l from-transparent via-cyan-400/10 to-transparent translate-x-full group-hover:-translate-x-full': 
          variant === 'river-flow' && flowDirection === 'left',
        'bg-gradient-to-b from-transparent via-teal-400/10 to-transparent -translate-y-full group-hover:translate-y-full': 
          variant === 'river-flow' && flowDirection === 'down',
        'bg-gradient-to-t from-transparent via-indigo-400/10 to-transparent translate-y-full group-hover:-translate-y-full': 
          variant === 'river-flow' && flowDirection === 'up',
      }
    )

    return (
      <div ref={ref} className={cn(baseClasses, "group")} {...props}>
        {variant === 'ripple' && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
        )}
        {variant === 'river-flow' && (
          <div className={flowClasses} />
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
    className={cn("font-semibold leading-none tracking-tight glass-heading", className)}
    style={{ color: 'var(--glass-text)' }}
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
    className={cn("text-sm", className)}
    style={{ color: 'var(--glass-text-secondary)' }}
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
