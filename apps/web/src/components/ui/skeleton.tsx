import { cn } from "@/lib/utils"

function Skeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn("animate-pulse rounded-md bg-slate-200 dark:bg-slate-700", className)}
      {...props}
    />
  )
}

// River flow skeleton with gentle gradient animation
function RiverSkeleton({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-md bg-gradient-to-r from-slate-200 via-slate-300 to-slate-200 dark:from-slate-700 dark:via-slate-600 dark:to-slate-700",
        "before:absolute before:inset-0 before:-translate-x-full before:animate-[shimmer_2s_infinite]",
        "before:bg-gradient-to-r before:from-transparent before:via-white/20 before:to-transparent",
        className
      )}
      {...props}
    />
  )
}

// List skeleton for inbox/contacts
function ListSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center gap-3 p-3">
          <RiverSkeleton className="h-10 w-10 rounded-full" />
          <div className="flex-1 space-y-2">
            <RiverSkeleton className="h-4 w-3/4" />
            <RiverSkeleton className="h-3 w-1/2" />
          </div>
          <RiverSkeleton className="h-4 w-16" />
        </div>
      ))}
    </div>
  )
}

// Card skeleton for dashboard widgets
function CardSkeleton() {
  return (
    <div className="p-4 space-y-3">
      <div className="flex items-center gap-2">
        <RiverSkeleton className="h-5 w-5 rounded" />
        <RiverSkeleton className="h-4 w-24" />
      </div>
      <RiverSkeleton className="h-8 w-16" />
      <RiverSkeleton className="h-3 w-32" />
    </div>
  )
}

// Table skeleton
function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex gap-4 p-3 border-b border-slate-200 dark:border-slate-700">
        {Array.from({ length: columns }).map((_, i) => (
          <RiverSkeleton key={i} className="h-4 flex-1" />
        ))}
      </div>
      {/* Rows */}
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-3">
          {Array.from({ length: columns }).map((_, j) => (
            <RiverSkeleton key={j} className="h-4 flex-1" />
          ))}
        </div>
      ))}
    </div>
  )
}

export { Skeleton, RiverSkeleton, ListSkeleton, CardSkeleton, TableSkeleton }