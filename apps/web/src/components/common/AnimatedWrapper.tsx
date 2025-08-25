"use client";

import React from 'react';
import { motion, MotionProps } from 'framer-motion';
import { useAnimations, useAnimationProps } from '@/contexts/AnimationContext';

interface AnimatedWrapperProps extends Omit<MotionProps, 'children'> {
  children: React.ReactNode;
  as?: keyof typeof motion;
  className?: string;
  style?: React.CSSProperties;
}

/**
 * A wrapper component that conditionally applies Framer Motion animations
 * based on the user's animation preferences and system settings
 */
export function AnimatedWrapper({
  children,
  as = 'div',
  className,
  style,
  ...motionProps
}: AnimatedWrapperProps) {
  const animationProps = useAnimationProps(motionProps);
  const MotionComponent = motion[as] as any;

  return (
    <MotionComponent
      className={className}
      style={style}
      {...animationProps}
    >
      {children}
    </MotionComponent>
  );
}

/**
 * Specific animated components with sensible defaults
 */

export function AnimatedCard({ children, className, ...props }: AnimatedWrapperProps) {
  return (
    <AnimatedWrapper
      className={className}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      whileHover={{ y: -4, scale: 1.02 }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}

export function AnimatedButton({ children, className, ...props }: AnimatedWrapperProps) {
  return (
    <AnimatedWrapper
      className={className}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      transition={{ duration: 0.2 }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}

export function AnimatedList({ children, className, stagger = 0.1, ...props }: AnimatedWrapperProps & { stagger?: number }) {
  return (
    <AnimatedWrapper
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ staggerChildren: stagger }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}

export function AnimatedListItem({ children, className, ...props }: AnimatedWrapperProps) {
  return (
    <AnimatedWrapper
      className={className}
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}

export function AnimatedFadeIn({ children, className, delay = 0, ...props }: AnimatedWrapperProps & { delay?: number }) {
  return (
    <AnimatedWrapper
      className={className}
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5, delay }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}

export function AnimatedSlideIn({ 
  children, 
  className, 
  direction = 'up',
  distance = 20,
  ...props 
}: AnimatedWrapperProps & { 
  direction?: 'up' | 'down' | 'left' | 'right';
  distance?: number;
}) {
  const getInitialTransform = () => {
    switch (direction) {
      case 'up': return { y: distance };
      case 'down': return { y: -distance };
      case 'left': return { x: distance };
      case 'right': return { x: -distance };
      default: return { y: distance };
    }
  };

  return (
    <AnimatedWrapper
      className={className}
      initial={{ opacity: 0, ...getInitialTransform() }}
      animate={{ opacity: 1, y: 0, x: 0 }}
      exit={{ opacity: 0, ...getInitialTransform() }}
      transition={{ duration: 0.4 }}
      {...props}
    >
      {children}
    </AnimatedWrapper>
  );
}