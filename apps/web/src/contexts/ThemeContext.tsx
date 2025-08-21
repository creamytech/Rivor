"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';

type GlassTheme = 'black' | 'white';

interface GlassThemeContextValue {
  theme: GlassTheme;
  setTheme: (theme: GlassTheme) => void;
  toggleTheme: () => void;
  isTransitioning: boolean;
}

const GlassThemeContext = createContext<GlassThemeContextValue | undefined>(undefined);

export const useTheme = (): GlassThemeContextValue => {
  const context = useContext(GlassThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a GlassThemeProvider');
  }
  return context;
};

interface GlassThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<GlassThemeProviderProps> = ({ children }) => {
  const [theme, setThemeState] = useState<GlassTheme>('black');
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('rivor-glass-theme') as GlassTheme;
    if (savedTheme && (savedTheme === 'black' || savedTheme === 'white')) {
      setThemeState(savedTheme);
    }
  }, []);

  // Apply theme CSS variables and classes
  useEffect(() => {
    const root = document.documentElement;
    
    // Remove existing theme classes
    document.body.className = document.body.className.replace(/glass-theme-\w+/g, '');
    document.body.classList.add(`glass-theme-${theme}`);
    
    // Set data-theme attribute
    document.documentElement.setAttribute('data-glass-theme', theme);
    
    // Apply theme-specific CSS custom properties
    if (theme === 'black') {
      root.style.setProperty('--glass-bg', '#000000');
      root.style.setProperty('--glass-surface', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-surface-strong', 'rgba(255, 255, 255, 0.15)');
      root.style.setProperty('--glass-surface-subtle', 'rgba(255, 255, 255, 0.05)');
      root.style.setProperty('--glass-border', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--glass-border-strong', 'rgba(255, 255, 255, 0.3)');
      root.style.setProperty('--glass-text', '#ffffff');
      root.style.setProperty('--glass-text-muted', 'rgba(255, 255, 255, 0.7)');
      root.style.setProperty('--glass-text-subtle', 'rgba(255, 255, 255, 0.5)');
      root.style.setProperty('--glass-accent', '#ffffff');
      root.style.setProperty('--glass-shadow', 'rgba(255, 255, 255, 0.1)');
      root.style.setProperty('--glass-glow', 'rgba(255, 255, 255, 0.2)');
      root.style.setProperty('--glass-ripple', 'rgba(255, 255, 255, 0.3)');
    } else {
      root.style.setProperty('--glass-bg', '#ffffff');
      root.style.setProperty('--glass-surface', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--glass-surface-strong', 'rgba(0, 0, 0, 0.15)');
      root.style.setProperty('--glass-surface-subtle', 'rgba(0, 0, 0, 0.05)');
      root.style.setProperty('--glass-border', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--glass-border-strong', 'rgba(0, 0, 0, 0.3)');
      root.style.setProperty('--glass-text', '#000000');
      root.style.setProperty('--glass-text-muted', 'rgba(0, 0, 0, 0.7)');
      root.style.setProperty('--glass-text-subtle', 'rgba(0, 0, 0, 0.5)');
      root.style.setProperty('--glass-accent', '#000000');
      root.style.setProperty('--glass-shadow', 'rgba(0, 0, 0, 0.1)');
      root.style.setProperty('--glass-glow', 'rgba(0, 0, 0, 0.2)');
      root.style.setProperty('--glass-ripple', 'rgba(0, 0, 0, 0.3)');
    }

    // Create liquid glass animations
    createGlassAnimations(theme);
  }, [theme]);

  const createGlassAnimations = (currentTheme: GlassTheme) => {
    // Remove existing animations
    const existingStyle = document.getElementById('glass-animations');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new glass animations
    const style = document.createElement('style');
    style.id = 'glass-animations';
    const glowColor = currentTheme === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)';
    const rippleColor = currentTheme === 'black' ? 'rgba(255, 255, 255, 0.3)' : 'rgba(0, 0, 0, 0.3)';
    
    style.textContent = `
      @keyframes glassFloat {
        0%, 100% { transform: translateY(0px) scale(1); }
        50% { transform: translateY(-10px) scale(1.02); }
      }

      @keyframes glassGlow {
        0% { box-shadow: 0 0 20px ${glowColor}; }
        50% { box-shadow: 0 0 40px ${glowColor}, 0 0 60px ${glowColor}; }
        100% { box-shadow: 0 0 20px ${glowColor}; }
      }

      @keyframes glassRipple {
        0% {
          transform: scale(1);
          opacity: 0.3;
        }
        100% {
          transform: scale(2);
          opacity: 0;
        }
      }

      @keyframes liquidMorph {
        0% { border-radius: 20px; transform: scale(1); }
        25% { border-radius: 25px 15px; transform: scale(1.01); }
        50% { border-radius: 15px 25px; transform: scale(1.02); }
        75% { border-radius: 25px 20px; transform: scale(1.01); }
        100% { border-radius: 20px; transform: scale(1); }
      }

      @keyframes glassShimmer {
        0% { transform: translateX(-100%); opacity: 0; }
        50% { opacity: 1; }
        100% { transform: translateX(100%); opacity: 0; }
      }

      @keyframes bubbleFloat {
        0% { transform: translateY(100vh) scale(0); }
        10% { transform: translateY(90vh) scale(0.1); }
        90% { transform: translateY(-10vh) scale(0.8); }
        100% { transform: translateY(-20vh) scale(0); }
      }

      .glass-float { animation: glassFloat 6s ease-in-out infinite; }
      .glass-glow { animation: glassGlow 3s ease-in-out infinite; }
      .glass-morph { animation: liquidMorph 8s ease-in-out infinite; }
      .glass-shimmer::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, ${rippleColor}, transparent);
        animation: glassShimmer 3s infinite;
      }
    `;
    document.head.appendChild(style);
  };

  const setTheme = (newTheme: GlassTheme) => {
    if (newTheme === theme) return;

    setIsTransitioning(true);
    localStorage.setItem('rivor-glass-theme', newTheme);
    
    // Apply smooth transition
    document.documentElement.style.transition = 'all 0.6s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      setThemeState(newTheme);
      
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.style.transition = '';
      }, 600);
    }, 50);
  };

  const toggleTheme = () => {
    setTheme(theme === 'black' ? 'white' : 'black');
  };

  const value: GlassThemeContextValue = {
    theme,
    setTheme,
    toggleTheme,
    isTransitioning,
  };

  return (
    <GlassThemeContext.Provider value={value}>
      {children}
    </GlassThemeContext.Provider>
  );
};

// For backward compatibility with existing code
export const useThemeColors = () => {
  const { theme } = useTheme();
  return {
    background: theme === 'black' ? '#000000' : '#ffffff',
    surface: theme === 'black' ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)',
    text: theme === 'black' ? '#ffffff' : '#000000',
    textMuted: theme === 'black' ? 'rgba(255, 255, 255, 0.7)' : 'rgba(0, 0, 0, 0.7)',
    border: theme === 'black' ? 'rgba(255, 255, 255, 0.2)' : 'rgba(0, 0, 0, 0.2)',
    accent: theme === 'black' ? '#ffffff' : '#000000'
  };
};

export const useThemeVars = () => {
  return {
    '--glass-bg': 'var(--glass-bg)',
    '--glass-surface': 'var(--glass-surface)',
    '--glass-text': 'var(--glass-text)',
    '--glass-border': 'var(--glass-border)'
  };
};