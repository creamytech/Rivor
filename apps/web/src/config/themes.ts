import { Theme, ThemeId } from '@/types/theme';
import { getAccessibleThemes } from '@/lib/theme-accessibility';
import { generateCompleteTheme } from '@/lib/theme-tokens';
import { applyReadabilityToThemeGradients } from '@/lib/gradient-readability';

export const themes: Record<ThemeId, Theme> = {
  mississippi: {
    id: 'mississippi',
    name: 'Mississippi',
    description: 'Luxury dark theme with gold accents',
    personality: 'Sophisticated riverboat luxury - opulent gold details on midnight navy',
    colors: {
      // Primary brand colors - Rich gold/amber luxury
      primary: '#D4AF37', // Pure gold
      primaryHover: '#B8941F', // Darker gold
      primaryMuted: 'rgba(212, 175, 55, 0.15)',
      
      // Secondary accent colors - Warm amber and copper
      secondary: '#CD853F', // Peru/copper
      secondaryHover: '#B8761C', // Darker copper
      secondaryMuted: 'rgba(205, 133, 63, 0.15)',
      
      // Background colors - Deep luxury navy
      background: '#0A0F1C', // Deepest navy
      backgroundSecondary: 'rgba(15, 23, 42, 0.98)', // Rich overlay
      backgroundTertiary: 'rgba(30, 41, 59, 0.95)', // Layered depth
      
      // Surface colors - Mahogany-inspired luxury
      surface: 'rgba(30, 41, 59, 0.92)', // Rich dark surface with transparency
      surfaceHover: 'rgba(51, 65, 85, 0.95)', // Elegant hover
      surfaceActive: 'rgba(71, 85, 105, 0.98)', // Luxurious active state
      surfaceAlt: 'rgba(20, 31, 49, 0.95)', // Sidebar/topbar - darker luxury
      
      // Border colors - Subtle gold elegance
      border: 'rgba(212, 175, 55, 0.15)', // Delicate gold borders
      borderHover: 'rgba(212, 175, 55, 0.35)', // Enhanced gold
      borderActive: 'rgba(212, 175, 55, 0.65)', // Rich gold focus
      
      // Text colors - Elegant contrast
      textPrimary: '#F8FAFC', // Pure white
      textSecondary: '#E2E8F0', // Soft white
      textMuted: '#CBD5E1', // Muted elegance
      textInverse: '#0A0F1C', // Deep navy for light backgrounds
      textOnSurface: '#F8FAFC', // White text on surface
      textOnSurfaceAlt: '#F8FAFC', // White text on sidebar/topbar
      
      // Accent colors - Riverboat luxury
      accent: '#FBBF24', // Bright gold accent
      accentHover: '#F59E0B', // Warm amber
      accentMuted: 'rgba(251, 191, 36, 0.2)',
      
      // Status colors - Luxury themed
      success: '#34D399', // Elegant emerald
      warning: '#FBBF24', // Luxury gold
      error: '#F87171', // Sophisticated coral
      info: '#60A5FA', // Rich blue
      
      // Special elements - Premium depth
      shadow: 'rgba(0, 0, 0, 0.5)', // Deep shadows
      gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.4) 0%, transparent 50%, rgba(0, 0, 0, 0.4) 100%), linear-gradient(135deg, #D4AF37 0%, #CD853F 50%, #B8941F 100%)',
      glassBg: 'rgba(10, 15, 28, 0.85)', // Rich glass effect
      glassBlur: 'blur(24px)', // Enhanced blur
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="80" height="80" viewBox="0 0 80 80" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23d4af37" fill-opacity="0.03"%3E%3Cpath d="M0 0h80v80H0V0zm40 40a20 20 0 1 1 0-40 20 20 0 0 1 0 40z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      texture: 'linear-gradient(45deg, rgba(212,175,55,0.02) 25%, transparent 25%, transparent 75%, rgba(212,175,55,0.02) 75%)',
    },
    animations: {
      river: 'mississippiRiver 15s ease-in-out infinite',
      glow: 'mississippiGlow 4s ease-in-out infinite alternate',
    },
  },

  amazon: {
    id: 'amazon',
    name: 'Amazon',
    description: 'Natural green theme with organic feel',
    personality: 'Living, breathing nature - vibrant forest canopy with organic flow',
    colors: {
      // Primary brand colors - Vibrant emerald life
      primary: '#10B981', // Emerald green
      primaryHover: '#059669', // Forest emerald
      primaryMuted: 'rgba(16, 185, 129, 0.12)',
      
      // Secondary accent colors - Natural earth tones
      secondary: '#0891B2', // Tropical teal
      secondaryHover: '#0E7490', // Deep teal
      secondaryMuted: 'rgba(8, 145, 178, 0.12)',
      
      // Background colors - Deep forest canopy
      background: '#0D1B0F', // Deep forest background
      backgroundSecondary: 'rgba(20, 39, 23, 0.95)', // Layered canopy
      backgroundTertiary: 'rgba(34, 84, 61, 0.90)', // Forest depth
      
      // Surface colors - Natural wood and leaves
      surface: 'rgba(20, 39, 23, 0.88)', // Natural surface
      surfaceHover: 'rgba(34, 84, 61, 0.92)', // Organic hover
      surfaceActive: 'rgba(45, 90, 61, 0.95)', // Living active state
      surfaceAlt: 'rgba(15, 29, 18, 0.92)', // Sidebar/topbar - deeper forest
      
      // Border colors - Organic growth patterns
      border: 'rgba(16, 185, 129, 0.18)', // Living borders
      borderHover: 'rgba(16, 185, 129, 0.35)', // Growing borders
      borderActive: 'rgba(8, 145, 178, 0.55)', // Tropical focus
      
      // Text colors - Natural contrast
      textPrimary: '#F0FDF4', // Fresh white
      textSecondary: '#DCFCE7', // Soft green white
      textMuted: '#BBF7D0', // Muted green
      textInverse: '#0D1B0F', // Deep forest
      textOnSurface: '#F0FDF4', // Fresh white on surface
      textOnSurfaceAlt: '#F0FDF4', // Fresh white on sidebar/topbar
      
      // Accent colors - Tropical vibrancy
      accent: '#06D6A0', // Tropical mint
      accentHover: '#04C48C', // Vibrant green
      accentMuted: 'rgba(6, 214, 160, 0.2)',
      
      // Status colors - Natural harmony
      success: '#22C55E', // Fresh green
      warning: '#FBBF24', // Golden sunlight
      error: '#FB7185', // Tropical flower
      info: '#06B6D4', // Crystal water
      
      // Special elements - Organic depth
      shadow: 'rgba(0, 0, 0, 0.4)', // Forest shadows
      gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%), linear-gradient(135deg, #10B981 0%, #059669 35%, #0891B2 100%)',
      glassBg: 'rgba(13, 27, 15, 0.82)', // Natural glass
      glassBlur: 'blur(20px)', // Organic blur
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%2310b981" fill-opacity="0.04"%3E%3Cpath d="M30 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15s-15 6.716-15 15c0 8.284 6.716 15 15 15zm0 30c8.284 0 15-6.716 15-15 0-8.284-6.716-15-15-15s-15 6.716-15 15c0 8.284 6.716 15 15 15z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      texture: 'radial-gradient(ellipse at center, rgba(16,185,129,0.02) 0%, transparent 70%)',
    },
    animations: {
      river: 'amazonRiver 18s ease-in-out infinite',
      glow: 'amazonGlow 5s ease-in-out infinite alternate',
    },
  },

  thames: {
    id: 'thames',
    name: 'Thames',
    description: 'Clean light theme with sophisticated greys',
    personality: 'Sophisticated fog - refined British elegance with crisp precision',
    colors: {
      // Primary brand colors - Refined silver and platinum
      primary: '#64748B', // Sophisticated slate
      primaryHover: '#475569', // Deeper slate
      primaryMuted: 'rgba(100, 116, 139, 0.15)',
      
      // Secondary accent colors - Misty blue elegance
      secondary: '#0EA5E9', // London fog blue
      secondaryHover: '#0284C7', // Deep fog blue
      secondaryMuted: 'rgba(14, 165, 233, 0.12)',
      
      // Background colors - Foggy sophistication
      background: '#F8FAFC', // Pure fog white
      backgroundSecondary: 'rgba(241, 245, 249, 0.98)', // Misty overlay
      backgroundTertiary: 'rgba(226, 232, 240, 0.95)', // Soft fog layer
      
      // Surface colors - Crystalline elegance
      surface: 'rgba(255, 255, 255, 0.95)', // Crystal surfaces
      surfaceHover: 'rgba(248, 250, 252, 0.98)', // Refined hover
      surfaceActive: 'rgba(241, 245, 249, 0.98)', // Elegant active
      surfaceAlt: 'rgba(241, 245, 249, 0.98)', // Sidebar/topbar - soft fog
      
      // Border colors - Sophisticated definition
      border: 'rgba(100, 116, 139, 0.12)', // Subtle definition
      borderHover: 'rgba(100, 116, 139, 0.25)', // Enhanced borders
      borderActive: 'rgba(14, 165, 233, 0.35)', // Fog blue focus
      
      // Text colors - Crisp readability
      textPrimary: '#0F172A', // Deep charcoal
      textSecondary: '#334155', // Medium charcoal
      textMuted: '#64748B', // Sophisticated grey
      textInverse: '#F8FAFC', // Pure white
      textOnSurface: '#0F172A', // Dark text on light surface
      textOnSurfaceAlt: '#0F172A', // Dark text on sidebar/topbar
      
      // Accent colors - London sophistication
      accent: '#0EA5E9', // Thames blue
      accentHover: '#0284C7', // Deep Thames
      accentMuted: 'rgba(14, 165, 233, 0.15)',
      
      // Status colors - Refined palette
      success: '#10B981', // British racing green
      warning: '#F59E0B', // London gold
      error: '#EF4444', // Refined red
      info: '#3B82F6', // Royal blue
      
      // Special elements - Misty effects
      shadow: 'rgba(15, 23, 42, 0.08)', // Soft shadows
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(135deg, #64748B 0%, #94A3B8 50%, #0EA5E9 100%)',
      glassBg: 'rgba(248, 250, 252, 0.92)', // Crystal glass
      glassBlur: 'blur(32px)', // Sophisticated blur
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="100" height="100" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg stroke="%2364748b" stroke-width="1" stroke-opacity="0.03"%3E%3Cpath d="M0 50h100M50 0v100"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      texture: 'linear-gradient(90deg, rgba(100,116,139,0.01) 50%, transparent 50%)',
    },
    animations: {
      river: 'thamesRiver 20s ease-in-out infinite',
      glow: 'thamesGlow 6s ease-in-out infinite alternate',
    },
  },

  colorado: {
    id: 'colorado',
    name: 'Colorado',
    description: 'Fresh light theme with crisp blues',
    personality: 'Crisp mountain air - energizing freshness with crystal clarity',
    colors: {
      // Primary brand colors - Crystal blue mountains
      primary: '#0EA5E9', // Sky blue
      primaryHover: '#0284C7', // Deep sky
      primaryMuted: 'rgba(14, 165, 233, 0.12)',
      
      // Secondary accent colors - Fresh mint snow
      secondary: '#06D6A0', // Fresh mint
      secondaryHover: '#04C48C', // Deep mint
      secondaryMuted: 'rgba(6, 214, 160, 0.12)',
      
      // Background colors - Pure snow and ice
      background: '#FFFFFF', // Pure snow white
      backgroundSecondary: 'rgba(248, 250, 252, 0.98)', // Snow crystal
      backgroundTertiary: 'rgba(241, 245, 249, 0.95)', // Ice layer
      
      // Surface colors - Crystalline purity
      surface: 'rgba(255, 255, 255, 0.98)', // Crystal surfaces
      surfaceHover: 'rgba(240, 249, 255, 0.98)', // Ice hover
      surfaceActive: 'rgba(224, 242, 254, 0.98)', // Active frost
      surfaceAlt: 'rgba(240, 249, 255, 0.98)', // Sidebar/topbar - ice crystal
      
      // Border colors - Fresh definition
      border: 'rgba(14, 165, 233, 0.08)', // Gentle definition
      borderHover: 'rgba(14, 165, 233, 0.18)', // Clear borders
      borderActive: 'rgba(6, 214, 160, 0.28)', // Mint focus
      
      // Text colors - Mountain clarity
      textPrimary: '#0F172A', // Deep mountain
      textSecondary: '#334155', // Stone grey
      textMuted: '#64748B', // Mountain mist
      textInverse: '#FFFFFF', // Pure white
      textOnSurface: '#0F172A', // Dark text on light surface
      textOnSurfaceAlt: '#0F172A', // Dark text on sidebar/topbar
      
      // Accent colors - Alpine energy
      accent: '#06D6A0', // Electric mint
      accentHover: '#04C48C', // Vibrant mint
      accentMuted: 'rgba(6, 214, 160, 0.15)',
      
      // Status colors - Fresh mountain palette
      success: '#22C55E', // Alpine green
      warning: '#F59E0B', // Sunrise gold
      error: '#EF4444', // Alpine rose
      info: '#0EA5E9', // Glacier blue
      
      // Special elements - Crystal effects
      shadow: 'rgba(14, 165, 233, 0.08)', // Soft blue shadows
      gradient: 'linear-gradient(135deg, rgba(255, 255, 255, 0.2) 0%, transparent 50%, rgba(255, 255, 255, 0.2) 100%), linear-gradient(135deg, #0EA5E9 0%, #06D6A0 50%, #22C55E 100%)',
      glassBg: 'rgba(255, 255, 255, 0.95)', // Crystal glass
      glassBlur: 'blur(20px)', // Fresh blur
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="120" height="120" viewBox="0 0 120 120" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%230ea5e9" fill-opacity="0.02"%3E%3Cpath d="M60 60l30-30v60l-30-30zm0 0l30 30h-60l30-30z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      texture: 'linear-gradient(45deg, rgba(14,165,233,0.01) 25%, transparent 25%, transparent 75%, rgba(6,214,160,0.01) 75%)',
    },
    animations: {
      river: 'coloradoRiver 10s ease-in-out infinite',
      glow: 'coloradoGlow 3s ease-in-out infinite alternate',
    },
  },

  nile: {
    id: 'nile',
    name: 'Nile',
    description: 'Warm theme with desert sunset colors',
    personality: 'Ancient luxury - warm desert sunset with terracotta and bronze elegance',
    colors: {
      // Primary brand colors - Rich terracotta and gold
      primary: '#CD7F32', // Rich bronze
      primaryHover: '#B8651A', // Darker bronze
      primaryMuted: 'rgba(205, 127, 50, 0.15)',
      
      // Secondary accent colors - Terracotta luxury
      secondary: '#D2691E', // Chocolate terracotta
      secondaryHover: '#B8441C', // Deep terracotta
      secondaryMuted: 'rgba(210, 105, 30, 0.15)',
      
      // Background colors - Warm sand and desert
      background: '#1A1512', // Deep desert night
      backgroundSecondary: 'rgba(41, 31, 20, 0.98)', // Sandy overlay
      backgroundTertiary: 'rgba(68, 51, 35, 0.95)', // Layered sand
      
      // Surface colors - Ancient stone and bronze
      surface: 'rgba(41, 31, 20, 0.92)', // Ancient surface
      surfaceHover: 'rgba(68, 51, 35, 0.95)', // Warmed stone
      surfaceActive: 'rgba(92, 69, 47, 0.98)', // Active bronze
      surfaceAlt: 'rgba(35, 26, 17, 0.95)', // Sidebar/topbar - deeper sand
      
      // Border colors - Luxurious bronze definition
      border: 'rgba(205, 127, 50, 0.18)', // Bronze borders
      borderHover: 'rgba(205, 127, 50, 0.35)', // Enhanced bronze
      borderActive: 'rgba(210, 105, 30, 0.55)', // Terracotta focus
      
      // Text colors - Desert elegance
      textPrimary: '#FEF3E2', // Warm sand white
      textSecondary: '#FAE8D4', // Soft sand
      textMuted: '#D6BC9A', // Muted sand
      textInverse: '#1A1512', // Deep desert
      textOnSurface: '#FEF3E2', // Warm white on surface
      textOnSurfaceAlt: '#FEF3E2', // Warm white on sidebar/topbar
      
      // Accent colors - Sunset luxury
      accent: '#DAA520', // Goldenrod sunset
      accentHover: '#B8941F', // Deep sunset gold
      accentMuted: 'rgba(218, 165, 32, 0.2)',
      
      // Status colors - Desert harmony
      success: '#228B22', // Desert oasis green
      warning: '#DAA520', // Sunset gold
      error: '#CD5C5C', // Desert rose
      info: '#4682B4', // Desert sky blue
      
      // Special elements - Ancient luxury
      shadow: 'rgba(0, 0, 0, 0.45)', // Deep desert shadows
      gradient: 'linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, transparent 50%, rgba(0, 0, 0, 0.3) 100%), linear-gradient(135deg, #CD7F32 0%, #D2691E 40%, #DAA520 100%)',
      glassBg: 'rgba(26, 21, 18, 0.85)', // Desert glass
      glassBlur: 'blur(28px)', // Ancient blur
    },
    patterns: {
      subtle: 'url("data:image/svg+xml,%3Csvg width="90" height="90" viewBox="0 0 90 90" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23cd7f32" fill-opacity="0.04"%3E%3Cpath d="M45 45l22.5-22.5v45L45 45zm0 0l22.5 22.5h-45L45 45zm0 0L22.5 22.5v45L45 45zm0 0L22.5 67.5h45L45 45z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")',
      texture: 'radial-gradient(circle at 30% 70%, rgba(205,127,50,0.03) 0%, transparent 50%), linear-gradient(60deg, rgba(210,105,30,0.02) 25%, transparent 25%, transparent 75%, rgba(218,165,32,0.02) 75%)',
    },
    animations: {
      river: 'nileRiver 12s ease-in-out infinite',
      glow: 'nileGlow 4.5s ease-in-out infinite alternate',
    },
  },
};

export const defaultTheme: ThemeId = 'mississippi';

// Export themes with accessibility analysis
export const accessibleThemes = getAccessibleThemes(themes);