"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette, Check } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeId } from '@/types/theme';
import { Button } from '@/components/ui/button';

interface ThemeSwitcherProps {
  showInNavigation?: boolean;
  compact?: boolean;
}

export const ThemeSwitcher: React.FC<ThemeSwitcherProps> = ({ 
  showInNavigation = false, 
  compact = false 
}) => {
  const { currentTheme, themeId, setTheme, themes, isTransitioning } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const [previewTheme, setPreviewTheme] = useState<ThemeId | null>(null);

  const handleThemeSelect = (selectedTheme: ThemeId) => {
    setTheme(selectedTheme);
    setIsOpen(false);
    setPreviewTheme(null);
  };

  const handleThemePreview = (selectedTheme: ThemeId | null) => {
    if (!isTransitioning) {
      setPreviewTheme(selectedTheme);
    }
  };

  const getThemePreviewStyle = (theme: ThemeId) => {
    const themeConfig = themes[theme];
    return {
      background: `linear-gradient(135deg, ${themeConfig.colors.primary} 0%, ${themeConfig.colors.secondary} 100%)`,
    };
  };

  const ThemePreview: React.FC<{ themeId: ThemeId }> = ({ themeId: id }) => {
    const theme = themes[id];
    const isActive = themeId === id;
    const isPreview = previewTheme === id;

    return (
      <motion.div
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-300 ${
          isActive 
            ? 'border-current ring-2 ring-current/20' 
            : 'border-transparent hover:border-current/50'
        } ${isPreview ? 'ring-2 ring-current/30' : ''}`}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: isActive || isPreview ? theme.colors.primary : 'transparent',
          color: theme.colors.textPrimary,
        }}
        onClick={() => handleThemeSelect(id)}
        onMouseEnter={() => handleThemePreview(id)}
        onMouseLeave={() => handleThemePreview(null)}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {/* Theme Preview Visual */}
        <div className="mb-3">
          <div 
            className="h-16 w-full rounded-lg mb-2 relative overflow-hidden"
            style={{
              background: theme.colors.gradient,
            }}
          >
            {/* Mini UI Elements */}
            <div className="absolute top-2 left-2 right-2 flex gap-1">
              <div 
                className="h-1 w-4 rounded-full opacity-60"
                style={{ backgroundColor: theme.colors.textPrimary }}
              />
              <div 
                className="h-1 w-6 rounded-full opacity-40"
                style={{ backgroundColor: theme.colors.textSecondary }}
              />
            </div>
            <div className="absolute bottom-2 left-2 right-2 flex gap-1">
              <div 
                className="h-2 w-8 rounded opacity-80"
                style={{ backgroundColor: theme.colors.accent }}
              />
              <div 
                className="h-2 w-6 rounded opacity-60"
                style={{ backgroundColor: theme.colors.secondary }}
              />
            </div>
            
            {/* Flowing animation preview */}
            <motion.div
              className="absolute inset-0 opacity-30"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.colors.textPrimary}40 50%, transparent 100%)`,
                width: '50%',
              }}
              animate={{
                x: ['-100%', '200%'],
              }}
              transition={{
                duration: 3,
                repeat: Infinity,
                ease: "linear",
              }}
            />
          </div>
        </div>

        {/* Theme Info */}
        <div className="space-y-1">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm" style={{ color: theme.colors.textPrimary }}>
              {theme.name}
            </h4>
            {isActive && (
              <Check className="h-4 w-4" style={{ color: theme.colors.primary }} />
            )}
          </div>
          <p className="text-xs opacity-80 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
            {theme.description}
          </p>
          <div className="text-xs pt-1 border-t border-current/10" style={{ color: theme.colors.textMuted }}>
            <em>{theme.personality}</em>
          </div>
        </div>

        {/* Color Palette Preview */}
        <div className="flex gap-1 mt-3">
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: theme.colors.primary }} 
          />
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: theme.colors.secondary }} 
          />
          <div 
            className="w-3 h-3 rounded-full" 
            style={{ backgroundColor: theme.colors.accent }} 
          />
        </div>
      </motion.div>
    );
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
                className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[90vw] z-50 rounded-xl border shadow-2xl"
                style={{
                  backgroundColor: currentTheme.colors.surface,
                  borderColor: currentTheme.colors.border,
                }}
              >
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-3" style={{ color: currentTheme.colors.textPrimary }}>
                    Choose Your River Theme
                  </h3>
                  <div className="space-y-2">
                    {Object.keys(themes).map((id) => (
                      <div
                        key={id}
                        className="flex items-center gap-3 p-2 rounded-lg cursor-pointer hover:bg-white/5"
                        onClick={() => handleThemeSelect(id as ThemeId)}
                      >
                        <div className="flex gap-1">
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themes[id as ThemeId].colors.primary }} 
                          />
                          <div 
                            className="w-3 h-3 rounded-full" 
                            style={{ backgroundColor: themes[id as ThemeId].colors.secondary }} 
                          />
                        </div>
                        <div className="flex-1">
                          <div className="font-medium text-sm" style={{ color: currentTheme.colors.textPrimary }}>
                            {themes[id as ThemeId].name}
                          </div>
                          <div className="text-xs" style={{ color: currentTheme.colors.textMuted }}>
                            {themes[id as ThemeId].description}
                          </div>
                        </div>
                        {themeId === id && (
                          <Check className="h-4 w-4" style={{ color: currentTheme.colors.primary }} />
                        )}
                      </div>
                    ))}
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
        <h3 className="text-lg font-semibold mb-2" style={{ color: currentTheme.colors.textPrimary }}>
          Theme Selection
        </h3>
        <p className="text-sm" style={{ color: currentTheme.colors.textSecondary }}>
          Choose a theme that matches your style and workflow preferences
        </p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {Object.keys(themes).map((id) => (
          <ThemePreview key={id} themeId={id as ThemeId} />
        ))}
      </div>
    </div>
  );
};