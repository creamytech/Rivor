/**
 * Real Estate Brand Theme
 * Trusted blues with warm gold accents
 */

// Core Color Palette
export const riverColors = {
  // Neutral foundation
  neutral: {
    50: '#f8fafc',
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
    950: '#020617'
  },

  // Brand blue
  blue: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
    950: '#172554'
  },

  // Accent gold
  gold: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
    950: '#451a03'
  },

  // Success green
  green: {
    50: '#ecfdf5',
    100: '#d1fae5',
    200: '#a7f3d0',
    300: '#6ee7b7',
    400: '#34d399',
    500: '#10b981',
    600: '#059669',
    700: '#047857',
    800: '#065f46',
    900: '#064e3b',
    950: '#022c22'
  }
} as const;

// Typography Scale
export const typography = {
  scale: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '2rem',
    '4xl': '2.5rem',
    '5xl': '3rem'
  },

  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },

  families: {
    ui: 'Poppins, system-ui, -apple-system, sans-serif',
    display: '"Playfair Display", serif'
  }
} as const;

// Elevation & Shadows
export const elevation = {
  // Soft shadows for glassy cards
  1: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
  2: '0 1px 3px 0 rgb(0 0 0 / 0.1), 0 1px 2px -1px rgb(0 0 0 / 0.1)',
  3: '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
  4: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
  5: '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
  6: '0 25px 50px -12px rgb(0 0 0 / 0.25)'
} as const;

// Border Radius
export const radius = {
  sm: '0.375rem',   // 6px
  md: '0.5rem',     // 8px
  lg: '0.75rem',    // 12px
  xl: '1rem',       // 16px
  '2xl': '1.5rem',  // 24px - primary for cards
  '3xl': '2rem'     // 32px
} as const;

// Motion & Animation
export const motion = {
  // Flow easing - gentle and natural
  easing: {
    flow: 'cubic-bezier(0.22, 1, 0.36, 1)',
    gentle: 'cubic-bezier(0.25, 0.46, 0.45, 0.94)',
    spring: 'cubic-bezier(0.34, 1.56, 0.64, 1)'
  },
  
  duration: {
    fast: '150ms',
    normal: '200ms',
    slow: '300ms',
    slower: '500ms'
  },
  
  // River ripple scales
  ripple: {
    scale: 1.05,
    duration: '180ms'
  }
} as const;

// Spacing Scale (8px grid)
export const spacing = {
  0: '0',
  1: '0.25rem',   // 4px
  2: '0.5rem',    // 8px
  3: '0.75rem',   // 12px
  4: '1rem',      // 16px
  5: '1.25rem',   // 20px
  6: '1.5rem',    // 24px
  8: '2rem',      // 32px
  10: '2.5rem',   // 40px
  12: '3rem',     // 48px
  16: '4rem',     // 64px
  20: '5rem',     // 80px
  24: '6rem'      // 96px
} as const;

// Theme Configuration
export const riverTheme = {
  colors: riverColors,
  typography,
  elevation,
  radius,
  motion,
  spacing
} as const;

export type RiverTheme = typeof riverTheme;
