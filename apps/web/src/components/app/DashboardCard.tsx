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
      whileHover={{ scale: 1.02, transition: { duration: 0.2 } }}
      className={cn(
        'h-full w-full overflow-hidden flex flex-col p-6',
        'bg-gradient-to-br from-white/95 to-white/80 dark:from-slate-900/95 dark:to-slate-800/80',
        'border border-border/50 backdrop-blur-sm',
        'hover:shadow-xl hover:border-border/80 transition-all duration-300',
        'rounded-2xl relative group',
        className
      )}
      style={{
        boxShadow: riverTheme.elevation[2],
      }}
      {...props}
    >
      {/* Subtle gradient overlay on hover */}
      <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-teal-500/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 rounded-2xl" />
      
      {/* Content container */}
      <div className="relative z-10 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
