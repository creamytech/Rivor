import * as React from "react"
import { Slot } from "@radix-ui/react-slot"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const buttonVariants = cva(
  "inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md text-sm font-medium transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--focus)] disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "bg-[var(--foreground)] text-[var(--background)] hover:bg-[color-mix(in_oklab,var(--foreground)_90%,transparent)]",
        destructive: "bg-red-500 text-white hover:bg-red-600",
        outline: "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        secondary: "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[color-mix(in_oklab,var(--muted)_80%,transparent)]",
        ghost: "hover:bg-[var(--muted)] hover:text-[var(--foreground)]",
        link: "text-[var(--foreground)] underline-offset-4 hover:underline",
        brand: "brand-gradient text-white hover:opacity-90 shadow-sm",
      },
      size: {
        default: "h-9 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-10 rounded-md px-8",
        icon: "h-9 w-9",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
)

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : "button"
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    )
  }
)
Button.displayName = "Button"

export { Button, buttonVariants }
