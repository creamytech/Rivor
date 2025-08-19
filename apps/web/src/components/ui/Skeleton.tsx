import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

export interface SkeletonProps extends HTMLAttributes<HTMLDivElement> {}

export function Skeleton({ className, ...props }: SkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0.6, y: 2 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.8, repeat: Infinity, repeatType: "reverse" }}
      className={cn("rounded-md bg-[var(--muted)]", className)}
      {...props}
    />
  );
}

export default Skeleton;
