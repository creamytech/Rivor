"use client";

import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { Theme, ThemeId, ThemeContextValue } from '@/types/theme';
import { themes, defaultTheme, accessibleThemes } from '@/config/themes';

const ThemeContext = createContext<ThemeContextValue | undefined>(undefined);

export const useTheme = (): ThemeContextValue => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

interface ThemeProviderProps {
  children: ReactNode;
}

export const ThemeProvider: React.FC<ThemeProviderProps> = ({ children }) => {
  const [themeId, setThemeId] = useState<ThemeId>(defaultTheme);
  const [isTransitioning, setIsTransitioning] = useState(false);

  // Load theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('rivor-theme') as ThemeId;
    if (savedTheme && themes[savedTheme]) {
      setThemeId(savedTheme);
    }
  }, []);

  // Apply theme CSS variables
  useEffect(() => {
    const theme = themes[themeId];
    const root = document.documentElement;

    // Apply all theme colors as CSS custom properties
    Object.entries(theme.colors).forEach(([key, value]) => {
      root.style.setProperty(`--theme-${key}`, value);
    });

    // Apply surface-specific text colors to ensure proper contrast
    root.style.setProperty('--surface-alt-bg', theme.colors.surfaceAlt);
    root.style.setProperty('--surface-alt-text', theme.colors.textOnSurfaceAlt);
    root.style.setProperty('--surface-bg', theme.colors.surface);
    root.style.setProperty('--surface-text', theme.colors.textOnSurface);

    // Apply theme-specific patterns and animations
    if (theme.patterns?.subtle) {
      root.style.setProperty('--theme-pattern-subtle', `url("${theme.patterns.subtle}")`);
    }

    // Add theme class to body for additional styling
    document.body.className = document.body.className.replace(/theme-\w+/g, '');
    document.body.classList.add(`theme-${themeId}`);

    // Create theme-specific keyframes
    createThemeKeyframes(theme);
  }, [themeId]);

  const createThemeKeyframes = (theme: Theme) => {
    // Remove existing theme keyframes
    const existingStyle = document.getElementById('theme-keyframes');
    if (existingStyle) {
      existingStyle.remove();
    }

    // Create new keyframes for theme-specific animations
    const style = document.createElement('style');
    style.id = 'theme-keyframes';
    style.textContent = `
      @keyframes ${themeId}River {
        0% {
          background-position: 0% 50%;
          opacity: 0.3;
        }
        50% {
          background-position: 100% 50%;
          opacity: 0.6;
        }
        100% {
          background-position: 200% 50%;
          opacity: 0.3;
        }
      }

      @keyframes ${themeId}Glow {
        0% {
          box-shadow: 0 0 20px ${theme.colors.primary}20;
        }
        100% {
          box-shadow: 0 0 40px ${theme.colors.primary}40, 0 0 60px ${theme.colors.secondary}20;
        }
      }

      @keyframes ${themeId}Flow {
        0% {
          transform: translateX(-100%);
        }
        100% {
          transform: translateX(100%);
        }
      }

      .theme-river-animation {
        animation: ${themeId}River 8s linear infinite;
      }

      .theme-glow-animation {
        animation: ${themeId}Glow 3s ease-in-out infinite alternate;
      }

      .theme-flow-animation {
        animation: ${themeId}Flow 6s linear infinite;
      }
    `;
    document.head.appendChild(style);
  };

  const setTheme = (newThemeId: ThemeId) => {
    if (newThemeId === themeId) return;

    setIsTransitioning(true);
    
    // Save to localStorage
    localStorage.setItem('rivor-theme', newThemeId);
    
    // Apply smooth transition
    document.documentElement.style.transition = 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)';
    
    setTimeout(() => {
      setThemeId(newThemeId);
      
      setTimeout(() => {
        setIsTransitioning(false);
        document.documentElement.style.transition = '';
      }, 300);
    }, 50);
  };

  const value: ThemeContextValue = {
    currentTheme: accessibleThemes[themeId],
    themeId,
    setTheme,
    themes: accessibleThemes,
    isTransitioning,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

// Hook for theme-aware styling
export const useThemeColors = () => {
  const { currentTheme } = useTheme();
  return currentTheme.colors;
};

// Hook for theme-aware CSS variables
export const useThemeVars = () => {
  const { currentTheme } = useTheme();
  
  const vars: Record<string, string> = {};
  Object.entries(currentTheme.colors).forEach(([key, value]) => {
    vars[`--theme-${key}`] = value;
  });
  
  return vars;
};