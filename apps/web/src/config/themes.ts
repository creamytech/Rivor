import { Theme, ThemeId } from '@/types/theme';
import { getAccessibleThemes } from '@/lib/theme-accessibility';

export const themes: Record<ThemeId, Theme> = {
  mississippi: {
    id: 'mississippi',
    name: 'Mississippi',
    description: 'Deep navy blues with gold accents reminiscent of the riverboat era',
    personality: 'Sophisticated and professional - perfect for established agents who value tradition and elegance',
    colors: {
      // Primary brand colors - deep navy and river blues
      primary: '#1E3A8A', // Deep navy blue
      primaryHover: '#1E40AF', // Slightly lighter navy
      primaryMuted: '#1E3A8A20', // Navy with transparency
      
      // Secondary accent colors - gold and amber
      secondary: '#F59E0B', // Rich gold
      secondaryHover: '#D97706', // Darker gold
      secondaryMuted: '#F59E0B20', // Gold with transparency
      
      // Background colors - dark river tones
      background: '#0F172A', // Very dark navy
      backgroundSecondary: '#1E293B', // Dark slate
      backgroundTertiary: '#334155', // Medium slate
      
      // Surface colors - cards and panels
      surface: '#1E293B', // Dark slate for cards
      surfaceHover: '#334155', // Hover state
      surfaceActive: '#475569', // Active state
      
      // Border colors
      border: 'rgba(148, 163, 184, 0.1)', // Subtle slate
      borderHover: 'rgba(148, 163, 184, 0.2)',
      borderActive: 'rgba(245, 158, 11, 0.3)', // Gold tint
      
      // Text colors
      textPrimary: '#F8FAFC', // Almost white
      textSecondary: '#CBD5E1', // Light slate
      textMuted: '#94A3B8', // Medium slate
      textInverse: '#0F172A', // Dark for light backgrounds
      
      // Accent colors
      accent: '#FBBF24', // Amber gold
      accentHover: '#F59E0B',
      accentMuted: '#FBBF2420',
      
      // Status colors
      success: '#10B981', // Emerald green
      warning: '#F59E0B', // Amber
      error: '#EF4444', // Red
      info: '#3B82F6', // Blue
      
      // Special elements
      shadow: 'rgba(0, 0, 0, 0.25)',
      gradient: 'linear-gradient(135deg, #1E3A8A 0%, #F59E0B 100%)',
      glassBg: 'rgba(30, 41, 59, 0.8)',
      glassBlur: 'blur(12px)',
    },
    patterns: {
      subtle: 'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(245,158,11,0.03)"%3E%3Cpath d="M0 0h40v40H0z"/%3E%3Cpath d="M0 10h40M0 30h40" stroke="rgba(245,158,11,0.05)" stroke-width="1"/%3E%3C/g%3E%3C/svg%3E',
    },
    animations: {
      river: 'mississippiRiver 8s linear infinite',
      glow: 'mississippiGlow 3s ease-in-out infinite alternate',
    },
  },

  amazon: {
    id: 'amazon',
    name: 'Amazon',
    description: 'Rich emerald greens and forest tones with natural wood accents',
    personality: 'Lush and natural - ideal for eco-conscious agents and nature lovers',
    colors: {
      // Primary brand colors - emerald and forest greens
      primary: '#059669', // Emerald green
      primaryHover: '#047857', // Darker emerald
      primaryMuted: '#05966920', // Emerald with transparency
      
      // Secondary accent colors - vibrant teal
      secondary: '#0D9488', // Teal
      secondaryHover: '#0F766E', // Darker teal
      secondaryMuted: '#0D948820', // Teal with transparency
      
      // Background colors - deep forest tones
      background: '#1A2E05', // Very dark forest green
      backgroundSecondary: '#22543D', // Dark green
      backgroundTertiary: '#2D5A3D', // Medium forest green
      
      // Surface colors
      surface: '#22543D', // Dark green for cards
      surfaceHover: '#2D5A3D', // Hover state
      surfaceActive: '#38A169', // Active state with more vibrant green
      
      // Border colors
      border: 'rgba(16, 185, 129, 0.1)', // Subtle emerald
      borderHover: 'rgba(16, 185, 129, 0.2)',
      borderActive: 'rgba(13, 148, 136, 0.3)', // Teal tint
      
      // Text colors
      textPrimary: '#F7FAFC', // Almost white
      textSecondary: '#E2E8F0', // Very light gray
      textMuted: '#A0AEC0', // Medium gray
      textInverse: '#1A2E05', // Dark for light backgrounds
      
      // Accent colors
      accent: '#38BDF8', // Sky blue (water accent)
      accentHover: '#0EA5E9',
      accentMuted: '#38BDF820',
      
      // Status colors
      success: '#10B981', // Emerald
      warning: '#F59E0B', // Amber
      error: '#EF4444', // Red
      info: '#06B6D4', // Cyan
      
      // Special elements
      shadow: 'rgba(0, 0, 0, 0.3)',
      gradient: 'linear-gradient(135deg, #059669 0%, #0D9488 100%)',
      glassBg: 'rgba(34, 84, 61, 0.8)',
      glassBlur: 'blur(12px)',
    },
    patterns: {
      subtle: 'data:image/svg+xml,%3Csvg width="40" height="40" viewBox="0 0 40 40" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(13,148,136,0.03)"%3E%3Ccircle cx="10" cy="10" r="2"/%3E%3Ccircle cx="30" cy="30" r="2"/%3E%3C/g%3E%3C/svg%3E',
    },
    animations: {
      river: 'amazonRiver 8s linear infinite',
      glow: 'amazonGlow 3s ease-in-out infinite alternate',
    },
  },

  thames: {
    id: 'thames',
    name: 'Thames',
    description: 'Elegant silver and charcoal grays with cool blue fog accents',
    personality: 'Clean and sophisticated - perfect for luxury real estate and minimalist preferences',
    colors: {
      // Primary brand colors - elegant grays
      primary: '#475569', // Slate gray
      primaryHover: '#334155', // Darker slate
      primaryMuted: '#47556920', // Slate with transparency
      
      // Secondary accent colors - London fog blue
      secondary: '#0EA5E9', // Sky blue
      secondaryHover: '#0284C7', // Darker sky blue
      secondaryMuted: '#0EA5E920', // Blue with transparency
      
      // Background colors - sophisticated grays
      background: '#0F172A', // Very dark slate
      backgroundSecondary: '#1E293B', // Dark slate
      backgroundTertiary: '#334155', // Medium slate
      
      // Surface colors
      surface: '#1E293B', // Dark slate for cards
      surfaceHover: '#334155', // Hover state
      surfaceActive: '#475569', // Active state
      
      // Border colors
      border: 'rgba(148, 163, 184, 0.1)', // Subtle slate
      borderHover: 'rgba(148, 163, 184, 0.2)',
      borderActive: 'rgba(14, 165, 233, 0.3)', // Blue tint
      
      // Text colors
      textPrimary: '#F8FAFC', // Pure white
      textSecondary: '#E2E8F0', // Light gray
      textMuted: '#94A3B8', // Medium gray
      textInverse: '#0F172A', // Dark for light backgrounds
      
      // Accent colors
      accent: '#38BDF8', // Bright sky blue
      accentHover: '#0EA5E9',
      accentMuted: '#38BDF820',
      
      // Status colors
      success: '#10B981', // Emerald
      warning: '#F59E0B', // Amber
      error: '#EF4444', // Red
      info: '#3B82F6', // Blue
      
      // Special elements
      shadow: 'rgba(0, 0, 0, 0.2)',
      gradient: 'linear-gradient(135deg, #475569 0%, #0EA5E9 100%)',
      glassBg: 'rgba(30, 41, 59, 0.9)',
      glassBlur: 'blur(16px)',
    },
    patterns: {
      subtle: 'data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" stroke="rgba(14,165,233,0.05)" stroke-width="1"%3E%3Cpath d="M0 30h60M30 0v60"/%3E%3C/g%3E%3C/svg%3E',
    },
    animations: {
      river: 'thamesRiver 8s linear infinite',
      glow: 'thamesGlow 3s ease-in-out infinite alternate',
    },
  },

  colorado: {
    id: 'colorado',
    name: 'Colorado',
    description: 'Cool mountain blues and snow whites with fresh mint highlights',
    personality: 'Clean and energizing - great for outdoor-loving agents and fresh perspectives',
    colors: {
      // Primary brand colors - mountain blues
      primary: '#1E40AF', // Royal blue
      primaryHover: '#1D4ED8', // Brighter blue
      primaryMuted: '#1E40AF20', // Blue with transparency
      
      // Secondary accent colors - fresh mint
      secondary: '#10B981', // Emerald mint
      secondaryHover: '#059669', // Darker mint
      secondaryMuted: '#10B98120', // Mint with transparency
      
      // Background colors - clean mountain tones
      background: '#0C1629', // Deep mountain blue
      backgroundSecondary: '#1E293B', // Slate blue
      backgroundTertiary: '#334155', // Lighter slate
      
      // Surface colors
      surface: '#1E293B', // Clean slate for cards
      surfaceHover: '#334155', // Hover state
      surfaceActive: '#3B82F6', // Active bright blue
      
      // Border colors
      border: 'rgba(59, 130, 246, 0.1)', // Subtle blue
      borderHover: 'rgba(59, 130, 246, 0.2)',
      borderActive: 'rgba(16, 185, 129, 0.3)', // Mint tint
      
      // Text colors
      textPrimary: '#F8FAFC', // Snow white
      textSecondary: '#E2E8F0', // Light frost
      textMuted: '#94A3B8', // Medium gray
      textInverse: '#0C1629', // Dark for light backgrounds
      
      // Accent colors
      accent: '#06B6D4', // Cyan (glacier water)
      accentHover: '#0891B2',
      accentMuted: '#06B6D420',
      
      // Status colors
      success: '#10B981', // Mint green
      warning: '#F59E0B', // Amber
      error: '#EF4444', // Red
      info: '#3B82F6', // Blue
      
      // Special elements
      shadow: 'rgba(0, 0, 0, 0.15)',
      gradient: 'linear-gradient(135deg, #1E40AF 0%, #10B981 50%, #06B6D4 100%)',
      glassBg: 'rgba(30, 41, 59, 0.7)',
      glassBlur: 'blur(20px)',
    },
    patterns: {
      subtle: 'data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(6,182,212,0.03)"%3E%3Cpolygon points="40,0 80,40 40,80 0,40"/%3E%3C/g%3E%3C/svg%3E',
    },
    animations: {
      river: 'coloradoRiver 8s linear infinite',
      glow: 'coloradoGlow 3s ease-in-out infinite alternate',
    },
  },

  nile: {
    id: 'nile',
    name: 'Nile',
    description: 'Warm sandy beiges and desert golds with sunset purples and copper accents',
    personality: 'Luxurious and elegant - perfect for high-end market focus and premium branding',
    colors: {
      // Primary brand colors - desert golds
      primary: '#D97706', // Rich amber gold
      primaryHover: '#B45309', // Darker amber
      primaryMuted: '#D9770620', // Gold with transparency
      
      // Secondary accent colors - sunset purple
      secondary: '#7C3AED', // Rich violet
      secondaryHover: '#6D28D9', // Darker violet
      secondaryMuted: '#7C3AED20', // Purple with transparency
      
      // Background colors - warm desert tones
      background: '#1C1917', // Very dark brown
      backgroundSecondary: '#292524', // Dark warm gray
      backgroundTertiary: '#44403C', // Medium warm gray
      
      // Surface colors
      surface: '#292524', // Warm dark gray for cards
      surfaceHover: '#44403C', // Hover state
      surfaceActive: '#78716C', // Active state
      
      // Border colors
      border: 'rgba(217, 119, 6, 0.1)', // Subtle gold
      borderHover: 'rgba(217, 119, 6, 0.2)',
      borderActive: 'rgba(124, 58, 237, 0.3)', // Purple tint
      
      // Text colors
      textPrimary: '#FEF7ED', // Warm white (cream)
      textSecondary: '#F3E8FF', // Light lavender
      textMuted: '#A8A29E', // Warm gray
      textInverse: '#1C1917', // Dark for light backgrounds
      
      // Accent colors
      accent: '#F59E0B', // Bright gold
      accentHover: '#D97706',
      accentMuted: '#F59E0B20',
      
      // Status colors
      success: '#10B981', // Emerald
      warning: '#F59E0B', // Amber gold
      error: '#EF4444', // Red
      info: '#8B5CF6', // Purple
      
      // Special elements
      shadow: 'rgba(0, 0, 0, 0.4)',
      gradient: 'linear-gradient(135deg, #D97706 0%, #7C3AED 50%, #DC2626 100%)',
      glassBg: 'rgba(41, 37, 36, 0.8)',
      glassBlur: 'blur(12px)',
    },
    patterns: {
      subtle: 'data:image/svg+xml,%3Csvg width="50" height="50" viewBox="0 0 50 50" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="rgba(217,119,6,0.03)"%3E%3Cpath d="M25,5 L35,25 L25,45 L15,25 Z"/%3E%3C/g%3E%3C/svg%3E',
    },
    animations: {
      river: 'nileRiver 8s linear infinite',
      glow: 'nileGlow 3s ease-in-out infinite alternate',
    },
  },
};

export const defaultTheme: ThemeId = 'mississippi';

// Export themes with accessibility analysis
export const accessibleThemes = getAccessibleThemes(themes);