/**
 * Accessibility contrast utilities for WCAG AA/AAA compliance
 */

/**
 * Convert hex color to RGB values
 */
function hexToRgb(hex: string): { r: number; g: number; b: number } | null {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result
    ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16),
      }
    : null;
}

/**
 * Calculate relative luminance of a color
 */
function getLuminance(rgb: { r: number; g: number; b: number }): number {
  const { r, g, b } = rgb;
  
  // Convert RGB to sRGB
  const sR = r / 255;
  const sG = g / 255;
  const sB = b / 255;
  
  // Apply gamma correction
  const rLinear = sR <= 0.03928 ? sR / 12.92 : Math.pow((sR + 0.055) / 1.055, 2.4);
  const gLinear = sG <= 0.03928 ? sG / 12.92 : Math.pow((sG + 0.055) / 1.055, 2.4);
  const bLinear = sB <= 0.03928 ? sB / 12.92 : Math.pow((sB + 0.055) / 1.055, 2.4);
  
  // Calculate luminance
  return 0.2126 * rLinear + 0.7152 * gLinear + 0.0722 * bLinear;
}

/**
 * Calculate contrast ratio between two colors
 */
export function getContrastRatio(color1: string, color2: string): number {
  const rgb1 = hexToRgb(color1);
  const rgb2 = hexToRgb(color2);
  
  if (!rgb1 || !rgb2) return 0;
  
  const lum1 = getLuminance(rgb1);
  const lum2 = getLuminance(rgb2);
  
  const brightest = Math.max(lum1, lum2);
  const darkest = Math.min(lum1, lum2);
  
  return (brightest + 0.05) / (darkest + 0.05);
}

/**
 * Check if contrast ratio meets WCAG AA standards
 */
export function meetsWCAG_AA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 3.0 : ratio >= 4.5;
}

/**
 * Check if contrast ratio meets WCAG AAA standards
 */
export function meetsWCAG_AAA(foreground: string, background: string, isLargeText: boolean = false): boolean {
  const ratio = getContrastRatio(foreground, background);
  return isLargeText ? ratio >= 4.5 : ratio >= 7.0;
}

/**
 * Get accessibility level for a color combination
 */
export function getAccessibilityLevel(foreground: string, background: string, isLargeText: boolean = false): 'AAA' | 'AA' | 'Fail' {
  if (meetsWCAG_AAA(foreground, background, isLargeText)) return 'AAA';
  if (meetsWCAG_AA(foreground, background, isLargeText)) return 'AA';
  return 'Fail';
}

/**
 * Generate an accessible color variant with better contrast
 */
export function generateAccessibleColor(
  originalColor: string,
  backgroundColor: string,
  targetRatio: number = 4.5
): string {
  const bgRgb = hexToRgb(backgroundColor);
  const originalRgb = hexToRgb(originalColor);
  
  if (!bgRgb || !originalRgb) return originalColor;
  
  const bgLuminance = getLuminance(bgRgb);
  
  // Determine if we should lighten or darken
  const shouldLighten = bgLuminance < 0.5;
  
  // Binary search for the right luminance
  let low = 0;
  let high = 1;
  let bestColor = originalColor;
  
  for (let i = 0; i < 20; i++) { // Max 20 iterations
    const targetLuminance = (low + high) / 2;
    const testColor = luminanceToHex(targetLuminance, originalRgb);
    const ratio = getContrastRatio(testColor, backgroundColor);
    
    if (Math.abs(ratio - targetRatio) < 0.1) {
      bestColor = testColor;
      break;
    }
    
    if (ratio < targetRatio) {
      if (shouldLighten) {
        low = targetLuminance;
      } else {
        high = targetLuminance;
      }
    } else {
      if (shouldLighten) {
        high = targetLuminance;
      } else {
        low = targetLuminance;
      }
    }
    
    bestColor = testColor;
  }
  
  return bestColor;
}

/**
 * Convert luminance back to hex color (approximation)
 */
function luminanceToHex(targetLuminance: number, originalRgb: { r: number; g: number; b: number }): string {
  // This is a simplified approach - in practice you might want a more sophisticated method
  const factor = Math.sqrt(targetLuminance / getLuminance(originalRgb));
  
  const r = Math.min(255, Math.max(0, Math.round(originalRgb.r * factor)));
  const g = Math.min(255, Math.max(0, Math.round(originalRgb.g * factor)));
  const b = Math.min(255, Math.max(0, Math.round(originalRgb.b * factor)));
  
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Create overlay gradient for improving contrast
 */
export function createContrastOverlay(
  backgroundColor: string,
  intensity: number = 0.1
): string {
  const rgb = hexToRgb(backgroundColor);
  if (!rgb) return 'transparent';
  
  const luminance = getLuminance(rgb);
  const isDark = luminance < 0.5;
  
  // Create overlay that improves contrast
  const overlayColor = isDark 
    ? `rgba(255, 255, 255, ${intensity})` 
    : `rgba(0, 0, 0, ${intensity})`;
    
  return `linear-gradient(135deg, ${overlayColor} 0%, transparent 50%, ${overlayColor} 100%)`;
}