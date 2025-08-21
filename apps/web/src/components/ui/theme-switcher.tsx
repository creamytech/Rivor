"use client";

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Palette, Check, X, RotateCcw, Shield, AlertTriangle, CheckCircle } from 'lucide-react';
import { useTheme } from '@/contexts/ThemeContext';
import { ThemeId } from '@/types/theme';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { getThemeHealth } from '@/lib/theme-tokens';

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
  const [hoverPreview, setHoverPreview] = useState<ThemeId | null>(null);
  const [livePreviewMode, setLivePreviewMode] = useState(false);
  const [showToast, setShowToast] = useState(false);
  const [originalTheme, setOriginalTheme] = useState<ThemeId | null>(null);

  const handleThemeSelect = (selectedTheme: ThemeId) => {
    if (selectedTheme === themeId) return;
    
    setOriginalTheme(themeId);
    setTheme(selectedTheme);
    setIsOpen(false);
    setHoverPreview(null);
    setShowToast(true);
    
    // Auto-hide toast after 5 seconds
    setTimeout(() => setShowToast(false), 5000);
  };

  const handleThemePreview = (selectedTheme: ThemeId | null) => {
    if (!isTransitioning) {
      setHoverPreview(selectedTheme);
    }
  };

  const handleUndoTheme = () => {
    if (originalTheme) {
      setTheme(originalTheme);
      setOriginalTheme(null);
    }
    setShowToast(false);
  };

  const handleConfirmTheme = () => {
    setOriginalTheme(null);
    setShowToast(false);
  };

  const getThemePreviewStyle = (theme: ThemeId) => {
    const themeConfig = themes[theme];
    return {
      background: themeConfig.colors.gradient,
    };
  };

  const ThemePreview: React.FC<{ themeId: ThemeId }> = ({ themeId: id }) => {
    const theme = themes[id];
    const isActive = themeId === id;
    const isPreview = hoverPreview === id;
    const themeHealth = getThemeHealth(theme);

    // Get theme-specific personality effects
    const getThemeEffects = () => {
      switch (id) {
        case 'mississippi':
          return {
            shadow: '0 8px 32px rgba(212, 175, 55, 0.2), 0 0 20px rgba(205, 133, 63, 0.1)',
            glowClass: 'theme-luxury-animation',
            personality: '🛥️ Luxury Riverboat Elegance',
          };
        case 'amazon':
          return {
            shadow: '0 8px 32px rgba(16, 185, 129, 0.2), 0 0 20px rgba(8, 145, 178, 0.1)',
            glowClass: 'theme-growth-animation',
            personality: '🌿 Living, Breathing Nature',
          };
        case 'thames':
          return {
            shadow: '0 8px 32px rgba(100, 116, 139, 0.15), 0 0 20px rgba(14, 165, 233, 0.1)',
            glowClass: 'theme-fog-animation',
            personality: '🌫️ Sophisticated London Fog',
          };
        case 'colorado':
          return {
            shadow: '0 8px 32px rgba(14, 165, 233, 0.15), 0 0 20px rgba(6, 214, 160, 0.1)',
            glowClass: 'theme-snow-animation',
            personality: '🏔️ Crisp Mountain Air',
          };
        case 'nile':
          return {
            shadow: '0 8px 32px rgba(205, 127, 50, 0.2), 0 0 20px rgba(210, 105, 30, 0.1)',
            glowClass: 'theme-sunset-animation',
            personality: '🏜️ Ancient Desert Luxury',
          };
        default:
          return {
            shadow: '0 8px 32px rgba(0, 0, 0, 0.1)',
            glowClass: '',
            personality: '',
          };
      }
    };

    const effects = getThemeEffects();

    return (
      <motion.div
        className={`relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-500 glass-theme-surface ${
          isActive 
            ? 'border-current ring-2 ring-current/20' 
            : 'border-transparent hover:border-current/50'
        } ${isPreview ? 'ring-2 ring-current/30' : ''} ${effects.glowClass}`}
        style={{
          backgroundColor: theme.colors.surface,
          borderColor: isActive || isPreview ? theme.colors.primary : 'transparent',
          color: theme.colors.textPrimary,
          boxShadow: isActive || isPreview ? effects.shadow : 'none',
        }}
        onClick={() => handleThemeSelect(id)}
        onMouseEnter={() => handleThemePreview(id)}
        onMouseLeave={() => handleThemePreview(null)}
        whileHover={{ scale: 1.03, y: -4 }}
        whileTap={{ scale: 0.97 }}
      >
        {/* Enhanced Theme Preview Visual */}
        <div className="mb-3">
          <div 
            className="h-20 w-full rounded-lg mb-2 relative overflow-hidden"
            style={{
              background: theme.colors.gradient,
            }}
          >
            {/* Background Pattern Overlay */}
            {theme.patterns?.subtle && (
              <div 
                className="absolute inset-0 opacity-10"
                style={{
                  backgroundImage: theme.patterns.subtle,
                  backgroundSize: '40px 40px',
                }}
              />
            )}

            {/* Enhanced Mini UI Elements */}
            <div className="absolute top-2 left-2 right-2 flex gap-2">
              <motion.div 
                className="h-2 w-6 rounded-full"
                style={{ backgroundColor: theme.colors.textPrimary }}
                initial={{ opacity: 0.4, width: '1rem' }}
                animate={{ opacity: 0.8, width: '1.5rem' }}
                transition={{ duration: 2, repeat: Infinity, repeatType: 'reverse' }}
              />
              <motion.div 
                className="h-2 w-8 rounded-full"
                style={{ backgroundColor: theme.colors.textSecondary }}
                initial={{ opacity: 0.3, scale: 0.8 }}
                animate={{ opacity: 0.6, scale: 1 }}
                transition={{ duration: 1.5, repeat: Infinity, repeatType: 'reverse', delay: 0.3 }}
              />
            </div>
            
            {/* Theme-specific visual elements */}
            <div className="absolute inset-0 flex items-center justify-center">
              <motion.div
                className="text-2xl"
                animate={{ 
                  scale: [1, 1.1, 1],
                  rotate: id === 'mississippi' ? [0, 2, 0] : [0, 0, 0],
                  filter: id === 'thames' ? ['blur(0px)', 'blur(1px)', 'blur(0px)'] : ['blur(0px)'],
                }}
                transition={{ 
                  duration: id === 'nile' ? 4 : id === 'colorado' ? 2 : 3, 
                  repeat: Infinity,
                  ease: "easeInOut" 
                }}
              >
                {id === 'mississippi' && '⚜️'}
                {id === 'amazon' && '🌱'}
                {id === 'thames' && '🌊'}
                {id === 'colorado' && '❄️'}
                {id === 'nile' && '🏛️'}
              </motion.div>
            </div>

            <div className="absolute bottom-2 left-2 right-2 flex gap-1">
              <motion.div 
                className="h-2 w-10 rounded"
                style={{ backgroundColor: theme.colors.accent }}
                initial={{ opacity: 0.6, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 1, repeat: Infinity, repeatType: 'reverse' }}
              />
              <motion.div 
                className="h-2 w-6 rounded"
                style={{ backgroundColor: theme.colors.secondary }}
                initial={{ opacity: 0.4, y: 2 }}
                animate={{ opacity: 0.8, y: 0 }}
                transition={{ duration: 1.2, repeat: Infinity, repeatType: 'reverse', delay: 0.4 }}
              />
            </div>
            
            {/* Theme-specific flowing animation */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(90deg, transparent 0%, ${theme.colors.textPrimary}30 50%, transparent 100%)`,
                width: '60%',
              }}
              animate={{
                x: ['-100%', '160%'],
                opacity: [0.2, 0.6, 0.2],
              }}
              transition={{
                duration: id === 'mississippi' ? 4 : id === 'amazon' ? 5 : id === 'thames' ? 6 : id === 'colorado' ? 3 : 4.5,
                repeat: Infinity,
                ease: "easeInOut",
              }}
            />

            {/* Glass effect overlay for certain themes */}
            {(id === 'thames' || id === 'colorado') && (
              <div 
                className="absolute inset-0 rounded-lg"
                style={{
                  background: theme.colors.glassBg,
                  backdropFilter: theme.colors.glassBlur,
                  opacity: 0.3,
                }}
              />
            )}
          </div>
        </div>

        {/* Enhanced Theme Info */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold text-sm" style={{ color: theme.colors.textPrimary }}>
              {theme.name}
            </h4>
            {isActive && (
              <motion.div
                initial={{ scale: 0, rotate: -180 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                <Check className="h-4 w-4" style={{ color: theme.colors.primary }} />
              </motion.div>
            )}
          </div>
          <p className="text-xs opacity-80 line-clamp-2" style={{ color: theme.colors.textSecondary }}>
            {theme.description}
          </p>
          <div className="text-[11px] pt-1 border-t border-current/10" style={{ color: theme.colors.textMuted }}>
            <span className="opacity-90">{effects.personality}</span>
          </div>
          <div className="text-xs pt-1" style={{ color: theme.colors.textMuted }}>
            <em>"{theme.personality}"</em>
          </div>
        </div>

        {/* Enhanced Token Chips */}
        <div className="mt-3 space-y-2">
          <div className="grid grid-cols-3 gap-1">
            <div className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: theme.colors.primary }} 
              />
              <span className="text-[10px] opacity-70">Primary</span>
            </div>
            <div className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: theme.colors.secondary }} 
              />
              <span className="text-[10px] opacity-70">Secondary</span>
            </div>
            <div className="text-center">
              <div 
                className="w-4 h-4 rounded-full mx-auto mb-1" 
                style={{ backgroundColor: theme.colors.accent }} 
              />
              <span className="text-[10px] opacity-70">Accent</span>
            </div>
          </div>
          
          {/* Additional tokens */}
          <div className="flex justify-between text-[10px] opacity-60">
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: theme.colors.success || theme.colors.primary }} 
              />
              <span>Success</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: theme.colors.warning || theme.colors.accent }} 
              />
              <span>Warning</span>
            </div>
            <div className="flex items-center gap-1">
              <div 
                className="w-2 h-2 rounded-full" 
                style={{ backgroundColor: theme.colors.border }} 
              />
              <span>Border</span>
            </div>
          </div>
        </div>

        {/* Theme Health Indicator */}
        <div className="mt-2 pt-2 border-t border-current/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              {themeHealth.status === 'healthy' && (
                <>
                  <CheckCircle className="h-3 w-3 text-green-500" />
                  <span className="text-[10px] text-green-600">{themeHealth.wcagLevel}</span>
                </>
              )}
              {themeHealth.status === 'warning' && (
                <>
                  <Shield className="h-3 w-3 text-blue-500" />
                  <span className="text-[10px] text-blue-600">{themeHealth.wcagLevel}</span>
                </>
              )}
              {themeHealth.status === 'error' && (
                <>
                  <AlertTriangle className="h-3 w-3 text-amber-500" />
                  <span className="text-[10px] text-amber-600">Issues</span>
                </>
              )}
            </div>
            {themeHealth.issues.length > 0 && (
              <div className="text-[9px] opacity-60" title={themeHealth.issues.join('; ')}>
                {themeHealth.issues.length} issue{themeHealth.issues.length !== 1 ? 's' : ''}
              </div>
            )}
          </div>
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
                  backgroundColor: 'var(--glass-surface)',
                  borderColor: 'var(--glass-border)',
                }}
              >
                <div className="p-3">
                  <h3 className="font-semibold text-sm mb-3 glass-theme-text" style={{ color: 'var(--glass-text)' }}>
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
                          <div className="flex items-center gap-2">
                            <div className="font-medium text-sm glass-theme-text" style={{ color: 'var(--glass-text)' }}>
                              {themes[id as ThemeId].name}
                            </div>
                            {themes[id as ThemeId].accessibility && (
                              <div className="flex items-center">
                                {themes[id as ThemeId].accessibility?.wcagLevel === 'AAA' && (
                                  <CheckCircle className="h-3 w-3 text-green-500" title="WCAG AAA Compliant" />
                                )}
                                {themes[id as ThemeId].accessibility?.wcagLevel === 'AA' && (
                                  <Shield className="h-3 w-3 text-blue-500" title="WCAG AA Compliant" />
                                )}
                                {themes[id as ThemeId].accessibility?.wcagLevel === 'Fail' && (
                                  <AlertTriangle className="h-3 w-3 text-amber-500" title="Accessibility Enhanced" />
                                )}
                              </div>
                            )}
                          </div>
                          <div className="text-xs glass-theme-text-muted" style={{ color: 'var(--glass-text-muted)' }}>
                            {themes[id as ThemeId].description}
                          </div>
                        </div>
                        {themeId === id && (
                          <Check className="h-4 w-4 glass-theme-primary" style={{ color: 'var(--glass-primary)' }} />
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
    <>
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold mb-2 glass-theme-text" style={{ color: 'var(--glass-text)' }}>
            Theme Selection
          </h3>
          <p className="text-sm glass-theme-text-secondary" style={{ color: 'var(--glass-text-secondary)' }}>
            Choose a theme that matches your style and workflow preferences
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.keys(themes).map((id) => (
            <ThemePreview key={id} themeId={id as ThemeId} />
          ))}
        </div>
      </div>

      {/* Apply/Undo Toast */}
      <AnimatePresence>
        {showToast && originalTheme && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 50, scale: 0.9 }}
            className="fixed bottom-6 right-6 z-50 bg-background border border-border rounded-xl shadow-2xl p-4 min-w-[320px] glass-theme-surface"
            style={{
              backgroundColor: 'var(--glass-surface)',
              borderColor: 'var(--glass-border)',
            }}
          >
            <div className="flex items-start gap-3">
              <div 
                className="w-8 h-8 rounded-lg flex items-center justify-center glass-theme-primary"
                style={{ backgroundColor: 'var(--glass-primary)' }}
              >
                <Check className="h-4 w-4 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold text-sm mb-1 glass-theme-text" style={{ color: 'var(--glass-text)' }}>
                  Theme Updated
                </h4>
                <p className="text-xs mb-3 glass-theme-text-secondary" style={{ color: 'var(--glass-text-secondary)' }}>
                  Switched to {currentTheme.name}. You can undo this change.
                </p>
                <div className="flex gap-2">
                  <Button
                    onClick={handleUndoTheme}
                    variant="outline"
                    size="sm"
                    className="h-7 text-xs"
                  >
                    <RotateCcw className="h-3 w-3 mr-1" />
                    Undo
                  </Button>
                  <Button
                    onClick={handleConfirmTheme}
                    size="sm"
                    className="h-7 text-xs"
                    className="glass-theme-primary"
                    style={{
                      backgroundColor: 'var(--glass-primary)',
                      color: 'white',
                      border: 'none'
                    }}
                  >
                    Keep Changes
                  </Button>
                </div>
              </div>
              <Button
                onClick={() => setShowToast(false)}
                variant="ghost"
                size="icon"
                className="h-6 w-6 p-0"
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};