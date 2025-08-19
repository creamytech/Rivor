import { motion, type Variants } from "framer-motion";
import { cn } from "@/lib/utils";
import type { HTMLAttributes } from "react";

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

export interface DashboardCardProps extends HTMLAttributes<HTMLDivElement> {}

export function DashboardCard({ children, className, ...props }: DashboardCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
      className={cn("h-full", className)}
      {...props}
    >
      {children}
    </motion.div>
  );
}

export default DashboardCard;
