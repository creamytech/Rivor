import React from 'react';
import { cn } from '@/lib/utils';
import { riverTheme } from '@/lib/river-theme';

interface DashboardCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export default function DashboardCard({ children, className, ...props }: DashboardCardProps) {
  return (
    <div
      className={cn('h-full w-full overflow-hidden flex flex-col p-4', className)}
      style={{
        boxShadow: riverTheme.elevation[2],
        borderRadius: riverTheme.radius['2xl'],
      }}
      {...props}
    >
      {children}
    </div>
  );
}

