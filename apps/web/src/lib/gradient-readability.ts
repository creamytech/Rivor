/**
 * Gradient readability overlay utilities for WCAG compliance
 */

import { getContrastRatio } from './contrast';

/**
 * Generate a readability overlay for gradient backgrounds
 */
export function createGradientOverlay(
  gradientColor: string,
  textColor: string,
  overlayIntensity: number = 0.4
): string {
  // Extract primary color from gradient (simplified)
  const primaryColor = extractPrimaryColorFromGradient(gradientColor);
  const contrast = getContrastRatio(textColor, primaryColor);
  
  // If contrast is already good, no overlay needed
  if (contrast >= 4.5) {
    return 'transparent';
  }
  
  // Determine overlay color based on text color
  const isLightText = textColor === '#FFFFFF' || textColor.startsWith('rgba(255');
  const overlayColor = isLightText 
    ? `rgba(0, 0, 0, ${overlayIntensity})`
    : `rgba(255, 255, 255, ${overlayIntensity})`;
  
  return overlayColor;
}

/**
 * Extract the primary/dominant color from a gradient string
 */
function extractPrimaryColorFromGradient(gradient: string): string {
  // Simple regex to extract first hex color from gradient
  const hexMatch = gradient.match(/#[a-fA-F0-9]{6}/);
  if (hexMatch) {
    return hexMatch[0];
  }
  
  // Fallback to a middle gray if no color found
  return '#808080';
}

/**
 * Create a composited readability gradient that improves text contrast
 */
export function createReadabilityGradient(
  originalGradient: string,
  textColor: string,
  options: {
    overlayIntensity?: number;
    overlayDirection?: string;
  } = {}
): string {
  const { overlayIntensity = 0.3, overlayDirection = '135deg' } = options;
  
  const overlayColor = createGradientOverlay(originalGradient, textColor, overlayIntensity);
  
  if (overlayColor === 'transparent') {
    return originalGradient;
  }
  
  // Create a gradient overlay that improves readability
  return `linear-gradient(${overlayDirection}, ${overlayColor} 0%, transparent 50%, ${overlayColor} 100%), ${originalGradient}`;
}

/**
 * Apply readability overlay to theme gradients
 */
export function applyReadabilityToThemeGradients(
  gradient: string,
  textColor: string,
  surfaceType: 'header' | 'card' | 'button' | 'background' = 'header'
): string {
  const intensityMap = {
    header: 0.4,    // Headers need strong overlays
    card: 0.2,      // Cards need subtle overlays
    button: 0.3,    // Buttons need moderate overlays
    background: 0.1 // Backgrounds need very light overlays
  };
  
  const intensity = intensityMap[surfaceType];
  
  return createReadabilityGradient(gradient, textColor, {
    overlayIntensity: intensity,
    overlayDirection: surfaceType === 'header' ? '90deg' : '135deg'
  });
}

/**
 * Get accessible text color for gradient backgrounds
 */
export function getAccessibleTextForGradient(gradient: string): string {
  const primaryColor = extractPrimaryColorFromGradient(gradient);
  const whiteContrast = getContrastRatio('#FFFFFF', primaryColor);
  const blackContrast = getContrastRatio('#000000', primaryColor);
  
  // Return the color with better contrast
  return whiteContrast >= blackContrast ? '#FFFFFF' : '#000000';
}

/**
 * Validate gradient accessibility and suggest improvements
 */
export function validateGradientAccessibility(
  gradient: string,
  textColor: string
): {
  isAccessible: boolean;
  contrastRatio: number;
  suggestedOverlay?: string;
  suggestedTextColor?: string;
} {
  const primaryColor = extractPrimaryColorFromGradient(gradient);
  const contrastRatio = getContrastRatio(textColor, primaryColor);
  const isAccessible = contrastRatio >= 4.5;
  
  const result = {
    isAccessible,
    contrastRatio,
  } as any;
  
  if (!isAccessible) {
    result.suggestedOverlay = createGradientOverlay(gradient, textColor);
    result.suggestedTextColor = getAccessibleTextForGradient(gradient);
  }
  
  return result;
}