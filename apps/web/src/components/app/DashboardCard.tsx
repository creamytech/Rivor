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
      transition={{ duration: 0.5, ease: [0.23, 1, 0.32, 1] }}
      whileHover={{ 
        scale: 1.02, 
        transition: { duration: 0.4, ease: [0.23, 1, 0.32, 1] } 
      }}
      className={cn(
        'card h-full w-full flex flex-col p-6',
        'relative group',
        className
      )}
      style={{
        maxWidth: 'none',
        width: '100%'
      }}
      {...props}
    >
      {/* Enhanced liquid glass gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-rivor-aqua/8 to-rivor-teal/6 opacity-0 group-hover:opacity-100 transition-all duration-500 rounded-[1.25rem] pointer-events-none" />
      
      {/* Liquid shimmer effect on hover */}
      <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-r from-transparent via-rivor-aqua/10 to-transparent transform -skew-x-12 -translate-x-full group-hover:translate-x-full transition-transform duration-1000 ease-out" />
      </div>
      
      {/* Content container with enhanced z-index */}
      <div className="relative z-20 h-full flex flex-col">
        {children}
      </div>
    </motion.div>
  );
}
