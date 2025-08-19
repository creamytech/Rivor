import React from 'react';
import { motion, type Variants } from "framer-motion";
import { cn } from '@/lib/utils';
import { riverTheme } from '@/lib/river-theme';

const cardVariants: Variants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0 }
};

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function DashboardCard({ children, className, ...props }: DashboardCardProps) {
  return (
    <motion.div
      variants={cardVariants}
      initial="hidden"
      animate="visible"
      transition={{ duration: 0.5 }}
      className={cn('h-full w-full overflow-hidden flex flex-col p-4', className)}
      style={{
        boxShadow: riverTheme.elevation[2],
        borderRadius: riverTheme.radius['2xl'],
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
