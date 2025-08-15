import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("skeleton loading-flow rounded-md bg-[var(--muted)]", className)}
      {...props}
    />
  )
}

export { Skeleton }