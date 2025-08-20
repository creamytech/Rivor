/**
 * Canonical theme token specification and validation utilities
 */

import { Theme, ThemeId } from '@/types/theme';
import { getContrastRatio } from './contrast';

/**
 * Required theme tokens - any theme missing these is invalid
 */
export const REQUIRED_THEME_TOKENS = [
  // Background layers
  'background',
  'backgroundSecondary', 
  'backgroundTertiary',
  
  // Surface layers (cards, panels)
  'surface',
  'surfaceHover',
  'surfaceActive',
  'surfaceAlt', // For sidebar/topbar
  
  // Text colors (auto-derived based on surface)
  'textPrimary',
  'textSecondary', 
  'textMuted',
  'textInverse',
  'textOnSurface',
  'textOnSurfaceAlt',
  
  // Brand colors
  'primary',
  'primaryHover',
  'primaryMuted',
  'secondary',
  'secondaryHover', 
  'secondaryMuted',
  'accent',
  'accentHover',
  'accentMuted',
  
  // Status colors
  'success',
  'warning',
  'error',
  'info',
  
  // Border colors
  'border',
  'borderHover',
  'borderActive',
  
  // Special elements
  'shadow',
  'gradient',
  'glassBg',
  'glassBlur',
] as const;

export type RequiredThemeToken = typeof REQUIRED_THEME_TOKENS[number];

/**
 * Surface-to-text mappings for auto-derived foregrounds
 */
export const SURFACE_TEXT_MAPPINGS = {
  background: 'textPrimary',
  backgroundSecondary: 'textPrimary', 
  backgroundTertiary: 'textPrimary',
  surface: 'textOnSurface',
  surfaceHover: 'textOnSurface',
  surfaceActive: 'textOnSurface',
  surfaceAlt: 'textOnSurfaceAlt', // For sidebar/topbar
  primary: 'textInverse',
  secondary: 'textInverse',
  accent: 'textInverse',
  success: 'textInverse',
  warning: 'textInverse',
  error: 'textInverse',
  info: 'textInverse',
} as const;

/**
 * Validate theme has all required tokens
 */
export function validateThemeTokens(theme: Theme): {
  isValid: boolean;
  missingTokens: string[];
  invalidTokens: string[];
} {
  const missingTokens: string[] = [];
  const invalidTokens: string[] = [];
  
  // Check for missing required tokens
  for (const token of REQUIRED_THEME_TOKENS) {
    if (!(token in theme.colors)) {
      missingTokens.push(token);
    }
  }
  
  // Check for invalid color values
  for (const [token, value] of Object.entries(theme.colors)) {
    if (typeof value !== 'string' || (!value.startsWith('#') && !value.startsWith('rgb') && !value.startsWith('hsl') && !value.startsWith('var(') && !value.startsWith('linear-gradient') && !value.startsWith('radial-gradient') && !value.startsWith('rgba'))) {
      invalidTokens.push(token);
    }
  }
  
  return {
    isValid: missingTokens.length === 0 && invalidTokens.length === 0,
    missingTokens,
    invalidTokens,
  };
}

/**
 * Auto-derive text colors for all surfaces with WCAG AA compliance
 */
export function deriveTextColors(baseColors: Partial<Theme['colors']>): Theme['colors'] {
  const derivedColors = { ...baseColors } as Theme['colors'];
  
  // Helper to get best contrasting text color
  const getBestTextColor = (backgroundColor: string): string => {
    const whiteContrast = getContrastRatio('#FFFFFF', backgroundColor);
    const blackContrast = getContrastRatio('#000000', backgroundColor);
    
    // Return color that provides better contrast, prefer white for dark surfaces
    if (whiteContrast >= 4.5) return '#FFFFFF';
    if (blackContrast >= 4.5) return '#000000';
    
    // If neither meets AA, return the better one and flag for overlay
    return whiteContrast > blackContrast ? '#FFFFFF' : '#000000';
  };
  
  // Helper to get muted version of text color
  const getMutedTextColor = (textColor: string, backgroundColor: string): string => {
    if (textColor === '#FFFFFF') {
      // For white text, return a semi-transparent version
      return 'rgba(255, 255, 255, 0.7)';
    } else {
      // For black text, return a semi-transparent version
      return 'rgba(0, 0, 0, 0.7)';
    }
  };
  
  // Derive text colors for each surface
  if (derivedColors.background) {
    derivedColors.textPrimary = getBestTextColor(derivedColors.background);
    derivedColors.textSecondary = getMutedTextColor(derivedColors.textPrimary, derivedColors.background);
    derivedColors.textMuted = derivedColors.textPrimary === '#FFFFFF' ? 'rgba(255, 255, 255, 0.5)' : 'rgba(0, 0, 0, 0.5)';
  }
  
  if (derivedColors.surface) {
    derivedColors.textOnSurface = getBestTextColor(derivedColors.surface);
  }
  
  if (derivedColors.surfaceAlt) {
    derivedColors.textOnSurfaceAlt = getBestTextColor(derivedColors.surfaceAlt);
  }
  
  // Text inverse is opposite of primary text
  derivedColors.textInverse = derivedColors.textPrimary === '#FFFFFF' ? '#000000' : '#FFFFFF';
  
  return derivedColors;
}

/**
 * Create gradient overlay for better text readability
 */
export function createReadabilityOverlay(gradientColor: string, textColor: string): string {
  const contrast = getContrastRatio(textColor, gradientColor);
  
  if (contrast >= 4.5) {
    return 'transparent'; // No overlay needed
  }
  
  // Create semi-transparent overlay to improve contrast
  const overlayOpacity = textColor === '#FFFFFF' ? 0.4 : 0.6;
  const overlayColor = textColor === '#FFFFFF' ? 'rgba(0, 0, 0, ' + overlayOpacity + ')' : 'rgba(255, 255, 255, ' + overlayOpacity + ')';
  
  return overlayColor;
}

/**
 * Generate complete theme with auto-derived colors and validation
 */
export function generateCompleteTheme(baseTheme: Partial<Theme>): Theme & { validation: ReturnType<typeof validateThemeTokens> } {
  // Start with base theme
  const theme: Theme = {
    id: baseTheme.id || 'unknown',
    name: baseTheme.name || 'Unnamed Theme',
    description: baseTheme.description || '',
    personality: baseTheme.personality || '',
    colors: baseTheme.colors || {} as any,
    patterns: baseTheme.patterns,
    animations: baseTheme.animations,
    accessibility: baseTheme.accessibility,
  };
  
  // Auto-derive missing colors
  theme.colors = deriveTextColors(theme.colors);
  
  // Ensure all required tokens have fallbacks
  const fallbacks: Partial<Theme['colors']> = {
    surfaceAlt: theme.colors.backgroundSecondary || theme.colors.surface || theme.colors.background,
    textOnSurface: theme.colors.textPrimary,
    textOnSurfaceAlt: theme.colors.textPrimary,
    shadow: 'rgba(0, 0, 0, 0.1)',
    glassBg: theme.colors.surface + '90',
    glassBlur: 'blur(12px)',
  };
  
  // Apply fallbacks for missing tokens
  for (const [token, fallback] of Object.entries(fallbacks)) {
    if (!theme.colors[token as keyof Theme['colors']]) {
      (theme.colors as any)[token] = fallback;
    }
  }
  
  // Validate the final theme
  const validation = validateThemeTokens(theme);
  
  return { ...theme, validation };
}

/**
 * Get theme health summary
 */
export function getThemeHealth(theme: Theme): {
  status: 'healthy' | 'warning' | 'error';
  issues: string[];
  wcagLevel: 'AA' | 'AAA' | 'Fail';
} {
  const validation = validateThemeTokens(theme);
  const issues: string[] = [];
  let status: 'healthy' | 'warning' | 'error' = 'healthy';
  
  if (!validation.isValid) {
    status = 'error';
    if (validation.missingTokens.length > 0) {
      issues.push(`Missing tokens: ${validation.missingTokens.join(', ')}`);
    }
    if (validation.invalidTokens.length > 0) {
      issues.push(`Invalid tokens: ${validation.invalidTokens.join(', ')}`);
    }
  }
  
  // Check contrast ratios
  const contrastIssues: string[] = [];
  
  // Check key contrast pairs
  const contrastChecks = [
    { fg: theme.colors.textPrimary, bg: theme.colors.background, name: 'Primary text on background' },
    { fg: theme.colors.textOnSurface, bg: theme.colors.surface, name: 'Text on surface' },
    { fg: theme.colors.textOnSurfaceAlt, bg: theme.colors.surfaceAlt, name: 'Text on sidebar/topbar' },
  ];
  
  let lowestLevel: 'AA' | 'AAA' | 'Fail' = 'AAA';
  
  for (const check of contrastChecks) {
    if (check.fg && check.bg) {
      const contrast = getContrastRatio(check.fg, check.bg);
      if (contrast < 3) {
        contrastIssues.push(`${check.name}: ${contrast.toFixed(1)}:1 (Fail)`);
        lowestLevel = 'Fail';
      } else if (contrast < 4.5) {
        contrastIssues.push(`${check.name}: ${contrast.toFixed(1)}:1 (Below AA)`);
        if (lowestLevel === 'AAA') lowestLevel = 'Fail';
      } else if (contrast < 7) {
        if (lowestLevel === 'AAA') lowestLevel = 'AA';
      }
    }
  }
  
  if (contrastIssues.length > 0) {
    issues.push(...contrastIssues);
    if (status === 'healthy') status = 'warning';
  }
  
  return {
    status,
    issues,
    wcagLevel: lowestLevel,
  };
}