"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette, Check, Moon, Sun, Monitor } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { Button } from '@/components/ui/button';

interface ThemeSwitcherProps {
  showInNavigation?: boolean;
  compact?: boolean;
}

const themes = [
  {
    id: 'black' as const,
    name: 'Black Glass',
    description: 'Dark theme with transparent glass effects',
    icon: Moon
  },
  {
    id: 'white' as const,
    name: 'White Glass', 
    description: 'Light theme with subtle glass aesthetics',
    icon: Sun
  }
];

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  showInNavigation = false, 
  compact = false 
}) => {
  const { theme, setTheme, toggleTheme, isTransitioning } = useTheme();
  const [isOpen, setIsOpen] = useState(false);

  const currentTheme = themes.find(t => t.id === theme) || themes[0];

  const handleThemeSelect = (selectedTheme: 'black' | 'white') => {
    if (selectedTheme === theme) return;
    setTheme(selectedTheme);
    setIsOpen(false);
  };

  if (compact || showInNavigation) {
    return (
      <div className="relative">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => setIsOpen(!isOpen)}
          className={`flex items-center gap-2 ${showInNavigation ? 'text-current' : ''}`}
          disabled={isTransitioning}
        >
          <Palette className="h-4 w-4" />
          {!compact && <span>{currentTheme.name}</span>}
          <ChevronDown className={`h-3 w-3 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
        </Button>

        <AnimatePresence>
          {isOpen && (
            <>
              {/* Backdrop */}
              <div 
                className="fixed inset-0 z-40" 
                onClick={() => setIsOpen(false)}
              />
              
              {/* Dropdown */}
              <motion.div
                initial={{ opacity: 0, y: -10, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -10, scale: 0.95 }}
                className="absolute right-0 top-full mt-2 w-64 z-50 rounded-xl border shadow-2xl glass-modal"
              >
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: 'var(--glass-text)' }}>
                    Choose Theme
                  </h3>
                  <div className="space-y-2">
                    {themes.map((themeOption) => {
                      const Icon = themeOption.icon;
                      return (
                        <div
                          key={themeOption.id}
                          className="flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors"
                          style={{
                            background: 'transparent'
                          }}
                          onMouseEnter={(e) => {
                            e.currentTarget.style.background = 'var(--glass-surface-hover)';
                          }}
                          onMouseLeave={(e) => {
                            e.currentTarget.style.background = 'transparent';
                          }}
                          onClick={() => handleThemeSelect(themeOption.id)}
                        >
                          <div className="flex items-center justify-center w-8 h-8 rounded-lg" 
                               style={{ backgroundColor: 'var(--glass-surface)' }}>
                            <Icon className="h-4 w-4" style={{ color: 'var(--glass-text)' }} />
                          </div>
                          <div className="flex-1">
                            <div className="font-medium text-sm" style={{ color: 'var(--glass-text)' }}>
                              {themeOption.name}
                            </div>
                            <div className="text-xs" style={{ color: 'var(--glass-text-muted)' }}>
                              {themeOption.description}
                            </div>
                          </div>
                          {theme === themeOption.id && (
                            <Check className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </motion.div>
            </>
          )}
        </AnimatePresence>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-lg font-semibold mb-2" style={{ color: 'var(--glass-text)' }}>
          Theme Selection
        </h3>
        <p className="text-sm" style={{ color: 'var(--glass-text-secondary)' }}>
          Choose between light and dark themes
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {themes.map((themeOption) => {
          const Icon = themeOption.icon;
          const isActive = theme === themeOption.id;
          
          return (
            <motion.div
              key={themeOption.id}
              className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
                isActive 
                  ? 'border-current ring-2 ring-current/20' 
                  : 'border-transparent hover:border-current/50'
              }`}
              style={{
                backgroundColor: 'var(--glass-surface)',
                borderColor: isActive ? 'var(--glass-primary)' : 'transparent',
                color: 'var(--glass-text)',
              }}
              onClick={() => handleThemeSelect(themeOption.id)}
              whileHover={{ scale: 1.02, y: -2 }}
              whileTap={{ scale: 0.98 }}
            >
              {/* Theme Preview */}
              <div className="mb-3">
                <div 
                  className="h-16 w-full rounded-lg mb-2 relative overflow-hidden border"
                  style={{
                    backgroundColor: themeOption.id === 'black' ? '#000000' : '#ffffff',
                    borderColor: 'var(--glass-border)',
                  }}
                >
                  {/* Preview UI Elements */}
                  <div className="absolute top-2 left-2 right-2 flex gap-2">
                    <div 
                      className="h-2 w-6 rounded-full"
                      style={{ 
                        backgroundColor: themeOption.id === 'black' ? '#ffffff' : '#000000',
                        opacity: 0.6 
                      }}
                    />
                    <div 
                      className="h-2 w-8 rounded-full"
                      style={{ 
                        backgroundColor: themeOption.id === 'black' ? '#ffffff' : '#000000',
                        opacity: 0.4 
                      }}
                    />
                  </div>
                  
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Icon 
                      className="h-8 w-8" 
                      style={{ 
                        color: themeOption.id === 'black' ? '#ffffff' : '#000000',
                        opacity: 0.7 
                      }} 
                    />
                  </div>
                </div>
              </div>

              {/* Theme Info */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <h4 className="font-semibold text-sm" style={{ color: 'var(--glass-text)' }}>
                    {themeOption.name}
                  </h4>
                  {isActive && (
                    <motion.div
                      initial={{ scale: 0, rotate: -180 }}
                      animate={{ scale: 1, rotate: 0 }}
                      transition={{ type: "spring", stiffness: 200, damping: 15 }}
                    >
                      <Check className="h-4 w-4" style={{ color: 'var(--glass-primary)' }} />
                    </motion.div>
                  )}
                </div>
                <p className="text-xs" style={{ color: 'var(--glass-text-secondary)' }}>
                  {themeOption.description}
                </p>
              </div>
            </motion.div>
          );
        })}
      </div>
      
      {/* Quick Toggle Button */}
      <div className="flex justify-center pt-4">
        <Button
          onClick={toggleTheme}
          disabled={isTransitioning}
          className="flex items-center gap-2"
          style={{
            backgroundColor: 'var(--glass-surface)',
            borderColor: 'var(--glass-border)',
            color: 'var(--glass-text)',
          }}
          variant="outline"
        >
          {theme === 'black' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
          Switch to {theme === 'black' ? 'Light' : 'Dark'} Theme
        </Button>
      </div>
    </div>
  );
};