/**
 * River Theme Design System
 * "Where Deals Flow Seamlessly"
 * 
 * Deep navy canvas with subtle flowing gradients
 * River palette: teal, azure, jade
 */

// Core Color Palette - River Inspired
export const riverColors = {
  // Deep navy canvas
  navy: {
    50: '#f8fafc',
    100: '#f1f5f9', 
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a', // Primary canvas
    950: '#020617'
  },
  
  // Teal accent
  teal: {
    50: '#f0fdfa',
    100: '#ccfbf1',
    200: '#99f6e4',
    300: '#5eead4',
    400: '#2dd4bf', // Primary accent
    500: '#14b8a6',
    600: '#0d9488',
    700: '#0f766e',
    800: '#115e59',
    900: '#134e4a',
    950: '#042f2e'
  },
  
  // Azure accent
  azure: {
    50: '#f0f9ff',
    100: '#e0f2fe',
    200: '#bae6fd',
    300: '#7dd3fc',
    400: '#38bdf8', // Secondary accent
    500: '#0ea5e9',
    600: '#0284c7',
    700: '#0369a1',
    800: '#075985',
    900: '#0c4a6e',
    950: '#082f49'
  },
  
  // Jade accent
  jade: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80', // Tertiary accent
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
    950: '#052e16'
  }
} as const;

// Typography Scale
export const typography = {
  scale: {
    xs: '0.75rem',    // 12px
    sm: '0.875rem',   // 14px
    base: '1rem',     // 16px
    lg: '1.125rem',   // 18px
    xl: '1.25rem',    // 20px
    '2xl': '1.5rem',  // 24px
    '3xl': '2rem',    // 32px
    '4xl': '2.5rem',  // 40px
    '5xl': '3rem'     // 48px
  },
  
  weights: {
    normal: '400',
    medium: '500',
    semibold: '600',
    bold: '700'
  },
  
  families: {
    ui: 'Inter, system-ui, -apple-system, sans-serif',
    display: 'Inter, system-ui, -apple-system, sans-serif'
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
