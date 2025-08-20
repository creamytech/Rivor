export interface Theme {
  id: string;
  name: string;
  description: string;
  personality: string;
  colors: {
    // Primary brand colors
    primary: string;
    primaryHover: string;
    primaryMuted: string;
    
    // Secondary accent colors
    secondary: string;
    secondaryHover: string;
    secondaryMuted: string;
    
    // Background colors
    background: string;
    backgroundSecondary: string;
    backgroundTertiary: string;
    
    // Surface colors (cards, panels)
    surface: string;
    surfaceHover: string;
    surfaceActive: string;
    
    // Border colors
    border: string;
    borderHover: string;
    borderActive: string;
    
    // Text colors
    textPrimary: string;
    textSecondary: string;
    textMuted: string;
    textInverse: string;
    
    // Accent colors for highlights
    accent: string;
    accentHover: string;
    accentMuted: string;
    
    // Status colors
    success: string;
    warning: string;
    error: string;
    info: string;
    
    // Special UI elements
    shadow: string;
    gradient: string;
    glassBg: string;
    glassBlur: string;
  };
  patterns?: {
    subtle?: string;
    texture?: string;
  };
  animations?: {
    river?: string;
    glow?: string;
  };
  accessibility?: {
    contrastOverlay?: string;
    highContrastMode?: boolean;
    wcagLevel?: 'AA' | 'AAA' | 'Fail';
    needsOverlay?: boolean;
  };
}

export type ThemeId = 'mississippi' | 'amazon' | 'thames' | 'colorado' | 'nile';

export interface ThemeContextValue {
  currentTheme: Theme;
  themeId: ThemeId;
  setTheme: (themeId: ThemeId) => void;
  themes: Record<ThemeId, Theme>;
  isTransitioning: boolean;
}