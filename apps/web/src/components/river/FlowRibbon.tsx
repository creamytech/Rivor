"use client";
import { useEffect, useRef } from 'react';
import { motion } from 'framer-motion';

interface FlowRibbonProps {
  className?: string;
  opacity?: number;
  speed?: number;
  disabled?: boolean;
}

export default function FlowRibbon({ 
  className = '', 
  opacity = 0.1, 
  speed = 60,
  disabled = false 
}: FlowRibbonProps) {
  const pathRef = useRef<SVGPathElement>(null);

  // Respect reduced motion preference
  const prefersReducedMotion = typeof window !== 'undefined' 
    ? window.matchMedia('(prefers-reduced-motion: reduce)').matches 
    : false;

  if (disabled || prefersReducedMotion) {
    return (
      <div 
        className={`fixed top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-teal-400 to-transparent opacity-${Math.round(opacity * 10)} ${className}`}
        style={{ opacity }}
      />
    );
  }

  return (
    <div className={`fixed top-0 left-0 w-full h-8 pointer-events-none overflow-hidden ${className}`}>
      <svg
        width="100%"
        height="100%"
        viewBox="0 0 1200 32"
        preserveAspectRatio="none"
        className="absolute inset-0"
      >
        <defs>
          <linearGradient id="flowGradient" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgb(20, 184, 166)" stopOpacity="0" />
            <stop offset="25%" stopColor="rgb(20, 184, 166)" stopOpacity={opacity} />
            <stop offset="50%" stopColor="rgb(56, 189, 248)" stopOpacity={opacity * 1.2} />
            <stop offset="75%" stopColor="rgb(74, 222, 128)" stopOpacity={opacity} />
            <stop offset="100%" stopColor="rgb(74, 222, 128)" stopOpacity="0" />
          </linearGradient>
          
          <filter id="glow">
            <feGaussianBlur stdDeviation="2" result="coloredBlur"/>
            <feMerge> 
              <feMergeNode in="coloredBlur"/>
              <feMergeNode in="SourceGraphic"/>
            </feMerge>
          </filter>
        </defs>
        
        <motion.path
          ref={pathRef}
          d="M0,16 Q300,8 600,16 T1200,16"
          stroke="url(#flowGradient)"
          strokeWidth="2"
          fill="none"
          filter="url(#glow)"
          initial={{ pathLength: 0, opacity: 0 }}
          animate={{ 
            pathLength: 1,
            opacity: 1,
            strokeDashoffset: [0, -100]
          }}
          transition={{
            pathLength: { duration: 2, ease: "easeInOut" },
            opacity: { duration: 1 },
            strokeDashoffset: {
              duration: speed,
              repeat: Infinity,
              ease: "linear"
            }
          }}
          strokeDasharray="50 50"
        />
        
        {/* Floating particles */}
        {[...Array(3)].map((_, i) => (
          <motion.circle
            key={i}
            r="1.5"
            fill="rgb(56, 189, 248)"
            opacity={opacity * 0.8}
            initial={{ 
              cx: -10,
              cy: 16 + (i - 1) * 4
            }}
            animate={{
              cx: 1210,
              cy: [
                16 + (i - 1) * 4,
                16 + (i - 1) * 4 + Math.sin(i) * 3,
                16 + (i - 1) * 4
              ]
            }}
            transition={{
              duration: speed + i * 5,
              repeat: Infinity,
              ease: "linear",
              delay: i * 10
            }}
          />
        ))}
      </svg>
    </div>
  );
}
