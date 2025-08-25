"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';

interface AnimationSettings {
  enabled: boolean;
  reducedMotion: boolean; // System preference
}

interface AnimationContextType {
  animations: AnimationSettings;
  setAnimationsEnabled: (enabled: boolean) => void;
  shouldAnimate: boolean; // Combined preference check
}

const AnimationContext = createContext<AnimationContextType | undefined>(undefined);

export function AnimationProvider({ children }: { children: React.ReactNode }) {
  const [animations, setAnimations] = useState<AnimationSettings>({
    enabled: true,
    reducedMotion: false
  });

  const shouldAnimate = animations.enabled && !animations.reducedMotion;

  useEffect(() => {
    // Check system preference for reduced motion
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    
    const handleChange = (e: MediaQueryListEvent) => {
      setAnimations(prev => ({
        ...prev,
        reducedMotion: e.matches
      }));
    };

    // Initial check
    setAnimations(prev => ({
      ...prev,
      reducedMotion: mediaQuery.matches
    }));

    // Listen for changes
    mediaQuery.addEventListener('change', handleChange);

    // Load user preference from settings
    try {
      const savedSettings = localStorage.getItem('rivor-user-settings');
      if (savedSettings) {
        const parsedSettings = JSON.parse(savedSettings);
        if (parsedSettings.appearance?.animations !== undefined) {
          setAnimations(prev => ({
            ...prev,
            enabled: parsedSettings.appearance.animations
          }));
        }
      }
    } catch (error) {
      console.error('Failed to load animation preferences:', error);
    }

    return () => {
      mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    // Apply CSS class to body based on animation preference
    const body = document.body;
    
    if (shouldAnimate) {
      body.classList.remove('reduce-motion');
      body.classList.add('enable-animations');
    } else {
      body.classList.add('reduce-motion');
      body.classList.remove('enable-animations');
    }

    // Also set CSS custom property for conditional animations
    document.documentElement.style.setProperty(
      '--animation-duration', 
      shouldAnimate ? '1' : '0'
    );
    document.documentElement.style.setProperty(
      '--animation-enabled', 
      shouldAnimate ? '1' : '0'
    );

    console.log('Animation state updated:', { shouldAnimate, enabled: animations.enabled, reducedMotion: animations.reducedMotion });

    return () => {
      // Cleanup on unmount
      body.classList.remove('reduce-motion', 'enable-animations');
    };
  }, [shouldAnimate, animations.enabled, animations.reducedMotion]);

  const setAnimationsEnabled = (enabled: boolean) => {
    setAnimations(prev => ({
      ...prev,
      enabled
    }));

    // Save to localStorage settings
    try {
      const savedSettings = localStorage.getItem('rivor-user-settings');
      let settings = {};
      
      if (savedSettings) {
        settings = JSON.parse(savedSettings);
      }
      
      const updatedSettings = {
        ...settings,
        appearance: {
          ...((settings as any).appearance || {}),
          animations: enabled
        }
      };
      
      localStorage.setItem('rivor-user-settings', JSON.stringify(updatedSettings));
      console.log('Animation preference saved:', enabled);
    } catch (error) {
      console.error('Failed to save animation preference:', error);
    }
  };

  return (
    <AnimationContext.Provider
      value={{
        animations,
        setAnimationsEnabled,
        shouldAnimate
      }}
    >
      {children}
    </AnimationContext.Provider>
  );
}

export function useAnimations() {
  const context = useContext(AnimationContext);
  if (context === undefined) {
    throw new Error('useAnimations must be used within an AnimationProvider');
  }
  return context;
}

// Helper hook for conditional animations in components
export function useAnimationProps(defaultProps: any = {}) {
  const { shouldAnimate } = useAnimations();
  
  if (!shouldAnimate) {
    // Return props with animations disabled
    return {
      ...defaultProps,
      initial: false,
      animate: false,
      exit: false,
      transition: { duration: 0 },
      whileHover: undefined,
      whileTap: undefined,
      layoutId: undefined
    };
  }
  
  return defaultProps;
}