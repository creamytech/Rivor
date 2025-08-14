import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const badgeVariants = cva(
  "inline-flex items-center rounded-md border px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-[var(--focus)] focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-[var(--foreground)] text-[var(--background)] shadow hover:bg-[color-mix(in_oklab,var(--foreground)_80%,transparent)]",
        secondary: "border-transparent bg-[var(--muted)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--muted)_80%,transparent)]",
        destructive: "border-transparent bg-red-500 text-white shadow hover:bg-red-500/80",
        outline: "text-[var(--foreground)] border-[var(--border)]",
        brand: "border-transparent brand-gradient text-white shadow",
        status: "border-transparent bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
)

export interface BadgeProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return (
    <div className={cn(badgeVariants({ variant }), className)} {...props} />
  )
}

export { Badge, badgeVariants }
