"use client";

import { motion } from 'framer-motion';
import { useTheme } from '@/contexts/ThemeContext';
import { Sun, Moon } from 'lucide-react';

export default function GlassThemeToggle() {
  const { theme, toggleTheme, isTransitioning } = useTheme();

  return (
    <motion.button
      onClick={toggleTheme}
      disabled={isTransitioning}
      className={`glass-theme-toggle ${theme === 'white' ? 'white' : ''}`}
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      initial={false}
      animate={{ 
        opacity: isTransitioning ? 0.7 : 1 
      }}
      transition={{ 
        type: "spring", 
        stiffness: 500, 
        damping: 30 
      }}
      aria-label={`Switch to ${theme === 'black' ? 'white' : 'black'} glass theme`}
      style={{
        background: 'var(--glass-surface)',
        border: '1px solid var(--glass-border)',
        borderRadius: '20px',
        backdropFilter: 'blur(16px) saturate(1.1)',
        WebkitBackdropFilter: 'blur(16px) saturate(1.1)',
        width: '60px',
        height: '32px',
        position: 'relative',
        cursor: 'pointer',
        transition: 'var(--glass-transition-fast)',
        overflow: 'hidden'
      }}
    >
      {/* Animated Background Indicator */}
      <motion.div
        className="absolute inset-0 rounded-[20px] opacity-20"
        animate={{
          background: theme === 'black' 
            ? 'linear-gradient(135deg, rgba(255,255,255,0.1), rgba(255,255,255,0.05))' 
            : 'linear-gradient(135deg, rgba(0,0,0,0.1), rgba(0,0,0,0.05))'
        }}
        transition={{ duration: 0.6 }}
      />

      {/* Sliding Toggle Indicator */}
      <motion.div
        className="absolute top-[2px] left-[2px] w-7 h-7 rounded-full flex items-center justify-center"
        style={{
          background: 'var(--glass-accent)',
          boxShadow: '0 2px 8px var(--glass-shadow)'
        }}
        animate={{
          x: theme === 'white' ? 28 : 0,
          rotate: theme === 'white' ? 180 : 0
        }}
        transition={{
          type: "spring",
          stiffness: 500,
          damping: 25
        }}
      >
        {/* Icon that morphs between sun and moon */}
        <motion.div
          animate={{
            scale: theme === 'white' ? 1 : 0.8,
            opacity: theme === 'white' ? 1 : 0.6
          }}
          transition={{ duration: 0.3 }}
        >
          {theme === 'white' ? (
            <Sun 
              className="w-4 h-4" 
              style={{ color: 'var(--glass-bg)' }}
            />
          ) : (
            <Moon 
              className="w-4 h-4" 
              style={{ color: 'var(--glass-bg)' }}
            />
          )}
        </motion.div>
      </motion.div>

      {/* Ripple effect on click */}
      {isTransitioning && (
        <motion.div
          className="absolute inset-0 rounded-[20px]"
          style={{
            background: `radial-gradient(circle, var(--glass-ripple) 0%, transparent 70%)`
          }}
          initial={{ scale: 0, opacity: 0.6 }}
          animate={{ scale: 2, opacity: 0 }}
          transition={{ duration: 0.6 }}
        />
      )}

      {/* Liquid shimmer effect */}
      <motion.div
        className="absolute inset-0 rounded-[20px] opacity-30"
        style={{
          background: `linear-gradient(90deg, transparent, var(--glass-ripple), transparent)`,
          transform: 'translateX(-100%)'
        }}
        animate={{
          transform: isTransitioning ? 'translateX(100%)' : 'translateX(-100%)'
        }}
        transition={{
          duration: 0.8,
          ease: "easeInOut"
        }}
      />
    </motion.button>
  );
}