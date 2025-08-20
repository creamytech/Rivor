/**
 * Theme accessibility analysis and enhancement utilities
 */

import { Theme, ThemeId } from '@/types/theme';
import { getAccessibilityLevel, createContrastOverlay, meetsWCAG_AA } from './contrast';

/**
 * Analyze a theme for accessibility compliance
 */
export function analyzeThemeAccessibility(theme: Theme): Theme['accessibility'] {
  // Check primary text contrast ratios
  const primaryTextLevel = getAccessibilityLevel(
    theme.colors.textPrimary,
    theme.colors.background
  );
  
  const secondaryTextLevel = getAccessibilityLevel(
    theme.colors.textSecondary, 
    theme.colors.background
  );
  
  const surfaceTextLevel = getAccessibilityLevel(
    theme.colors.textPrimary,
    theme.colors.surface
  );
  
  // Determine overall WCAG level (use the lowest)
  const levels = [primaryTextLevel, secondaryTextLevel, surfaceTextLevel];
  let wcagLevel: 'AA' | 'AAA' | 'Fail' = 'AAA';
  
  if (levels.includes('Fail')) {
    wcagLevel = 'Fail';
  } else if (levels.includes('AA')) {
    wcagLevel = 'AA';
  }
  
  // Check if theme needs contrast overlay
  const needsOverlay = wcagLevel === 'Fail' || 
    !meetsWCAG_AA(theme.colors.textPrimary, theme.colors.background) ||
    !meetsWCAG_AA(theme.colors.textPrimary, theme.colors.surface);
  
  // Generate contrast overlay if needed
  const contrastOverlay = needsOverlay 
    ? createContrastOverlay(theme.colors.background, 0.15)
    : undefined;
  
  return {
    wcagLevel,
    needsOverlay,
    contrastOverlay,
    highContrastMode: false, // Can be toggled by user
  };
}

/**
 * Get all themes with accessibility analysis
 */
export function getAccessibleThemes(themes: Record<ThemeId, Theme>): Record<ThemeId, Theme> {
  const accessibleThemes: Record<ThemeId, Theme> = {} as Record<ThemeId, Theme>;
  
  for (const [id, theme] of Object.entries(themes) as [ThemeId, Theme][]) {
    accessibleThemes[id] = {
      ...theme,
      accessibility: analyzeThemeAccessibility(theme),
    };
  }
  
  return accessibleThemes;
}

/**
 * Create high contrast variant of a theme
 */
export function createHighContrastVariant(theme: Theme): Theme {
  return {
    ...theme,
    colors: {
      ...theme.colors,
      // Ensure maximum contrast for text
      textPrimary: '#FFFFFF',
      textSecondary: '#E5E5E5',
      textMuted: '#CCCCCC',
      background: '#000000',
      backgroundSecondary: '#1A1A1A',
      backgroundTertiary: '#333333',
      surface: '#1A1A1A',
      surfaceHover: '#333333',
      border: 'rgba(255, 255, 255, 0.2)',
      borderHover: 'rgba(255, 255, 255, 0.3)',
    },
    accessibility: {
      ...theme.accessibility,
      highContrastMode: true,
      wcagLevel: 'AAA',
      needsOverlay: false,
    },
  };
}

/**
 * Apply accessibility enhancements to a theme
 */
export function applyAccessibilityEnhancements(theme: Theme, options?: {
  forceHighContrast?: boolean;
  overlayIntensity?: number;
}): Theme {
  const analysis = analyzeThemeAccessibility(theme);
  
  if (options?.forceHighContrast) {
    return createHighContrastVariant(theme);
  }
  
  // Apply automatic contrast overlay if needed
  if (analysis.needsOverlay) {
    const overlayIntensity = options?.overlayIntensity || 0.15;
    
    return {
      ...theme,
      colors: {
        ...theme.colors,
        // Add overlay to background elements
        background: `linear-gradient(${analysis.contrastOverlay}, ${theme.colors.background})`,
        surface: `linear-gradient(${createContrastOverlay(theme.colors.surface, overlayIntensity)}, ${theme.colors.surface})`,
      },
      accessibility: analysis,
    };
  }
  
  return {
    ...theme,
    accessibility: analysis,
  };
}