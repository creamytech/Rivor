import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"
import { cn } from "@/lib/utils"

const chipVariants = cva(
  "inline-flex items-center gap-1 px-2 py-1 rounded-2xl text-xs font-medium border transition-all duration-200",
  {
    variants: {
      intent: {
        buyer: "chip-buyer",
        seller: "chip-seller", 
        renter: "chip-renter",
        default: "chip",
      },
      confidence: {
        70: "confidence-70",
        80: "confidence-80",
        90: "confidence-90",
        100: "confidence-100",
      },
      size: {
        sm: "text-xs px-1.5 py-0.5",
        md: "text-xs px-2 py-1",
        lg: "text-sm px-3 py-1.5",
      },
    },
    defaultVariants: {
      intent: "default",
      size: "md",
    },
  }
)

export interface ChipProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof chipVariants> {
  children: React.ReactNode
}

const Chip = React.forwardRef<HTMLDivElement, ChipProps>(
  ({ className, intent, confidence, size, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(chipVariants({ intent, confidence, size, className }))}
        {...props}
      >
        {children}
      </div>
    )
  }
)
Chip.displayName = "Chip"

export { Chip, chipVariants }
