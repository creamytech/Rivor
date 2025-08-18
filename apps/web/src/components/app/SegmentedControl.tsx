"use client";

import { useState } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface SegmentedControlProps {
  options: Array<{
    value: string;
    label: string;
    count?: number;
  }>;
  value: string;
  onChange: (value: string) => void;
  className?: string;
}

export default function SegmentedControl({
  options,
  value,
  onChange,
  className
}: SegmentedControlProps) {
  const activeIndex = options.findIndex(option => option.value === value);

  return (
    <div className={cn(
      "relative inline-flex rounded-lg bg-[var(--muted)] p-1",
      className
    )}>
      {options.map((option, index) => (
        <button
          key={option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "relative px-3 py-1.5 text-sm font-medium rounded-md transition-all duration-200",
            "hover:text-[var(--foreground)]",
            value === option.value 
              ? "text-[var(--foreground)]" 
              : "text-[var(--muted-foreground)]"
          )}
        >
          <span className="flex items-center gap-2">
            {option.label}
            {option.count !== undefined && (
              <span className={cn(
                "px-1.5 py-0.5 text-xs rounded-full",
                value === option.value
                  ? "bg-[var(--foreground)] text-[var(--background)]"
                  : "bg-[var(--border)] text-[var(--muted-foreground)]"
              )}>
                {option.count}
              </span>
            )}
          </span>
          
          {value === option.value && (
            <motion.div
              layoutId="active-segment"
              className="absolute inset-0 bg-[var(--background)] rounded-md shadow-sm"
              initial={false}
              transition={{ type: "spring", stiffness: 500, damping: 30 }}
            />
          )}
        </button>
      ))}
    </div>
  );
}
