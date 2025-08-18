"use client";

import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface ToolbarProps {
  children: React.ReactNode;
  className?: string;
}

export default function Toolbar({ children, className }: ToolbarProps) {
  return (
    <div className={cn(
      "sticky top-[calc(56px+var(--header-height,0px))] z-10 bg-[color-mix(in_oklab,var(--background)98%,transparent)] backdrop-blur-sm border-b border-[var(--border)]",
      className
    )}>
      <div className="px-6 py-3">
        {children}
      </div>
    </div>
  );
}

interface ToolbarItemProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolbarItem({ children, className }: ToolbarItemProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      {children}
    </div>
  );
}

interface ToolbarGroupProps {
  children: React.ReactNode;
  className?: string;
}

export function ToolbarGroup({ children, className }: ToolbarGroupProps) {
  return (
    <div className={cn("flex items-center gap-4", className)}>
      {children}
    </div>
  );
}
