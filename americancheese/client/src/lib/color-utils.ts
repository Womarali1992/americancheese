/**
 * Color Utilities
 *
 * Clean, consolidated color utility functions for the application.
 * This is the RECOMMENDED entry point for color operations.
 *
 * Usage:
 *   import { getTier1Color, getTier2Color, hexToRgba } from '@/lib/color-utils';
 *
 * For theme application, use:
 *   import { applyProjectTheme, getProjectTheme } from '@/lib/project-themes';
 *
 * For theme context in React components, use:
 *   import { useThemeContext } from '@/components/SimpleThemeProvider';
 */

// Re-export core color resolution functions from unified-color-system
export {
  // Main color resolution functions
  getTier1Color,
  getTier2Color,
  getStatusColor,
  getCategoryColor,
  getTaskColors,

  // Color manipulation utilities
  hexToRgba,
  hexToRgb,
  hexToRgbString,
  lightenColor,
  darkenColor,
  hexToRgbWithOpacity,

  // Status utilities
  getStatusBorderColor,
  getStatusBgColor,
  getStatusStyles,
  getProgressColor,

  // Category utilities
  getTier1CategoryColor,
  getCategoryColorSync,
  formatCategoryName,
  formatTaskStatus,

  // Module/Project utilities
  getModuleColor,
  getProjectColor,
  getChartColors,

  // Tailwind helpers
  hexToTailwindBorder,
  hexToTailwindBg,
  hexToTailwindText,

  // CSS application
  applyThemeColorsToCSS,

  // Constants
  FALLBACK_COLORS,
  DEFAULT_COLORS,

  // Types
  type CategoryData,
  type ProjectThemeData,
} from './unified-color-system';

// Re-export theme types and definitions
export { COLOR_THEMES, type ColorTheme } from './color-themes';

// Re-export project theme utilities
export { getProjectTheme, applyProjectTheme, PROJECT_THEMES, type ProjectTheme } from './project-themes';

/**
 * Utility: Get contrasting text color (black or white) for a background
 */
export function getContrastText(hex: string): string {
  if (!hex || typeof hex !== 'string') return '#000000';

  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return '#000000';

  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  // Calculate relative luminance using sRGB
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5 ? '#000000' : '#ffffff';
}

/**
 * Utility: Generate a color palette from a base color
 */
export function generatePalette(baseColor: string, count: number = 5): string[] {
  const cleanHex = baseColor.replace('#', '');
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  const palette: string[] = [];

  for (let i = 0; i < count; i++) {
    const factor = 0.6 + (i * 0.2); // Range from 0.6 to 1.4
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));

    palette.push(
      '#' +
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0')
    );
  }

  return palette;
}

/**
 * Utility: Mix two colors together
 */
export function mixColors(color1: string, color2: string, ratio: number = 0.5): string {
  const c1 = color1.replace('#', '');
  const c2 = color2.replace('#', '');

  const r1 = parseInt(c1.substr(0, 2), 16);
  const g1 = parseInt(c1.substr(2, 2), 16);
  const b1 = parseInt(c1.substr(4, 2), 16);

  const r2 = parseInt(c2.substr(0, 2), 16);
  const g2 = parseInt(c2.substr(2, 2), 16);
  const b2 = parseInt(c2.substr(4, 2), 16);

  const r = Math.round(r1 * (1 - ratio) + r2 * ratio);
  const g = Math.round(g1 * (1 - ratio) + g2 * ratio);
  const b = Math.round(b1 * (1 - ratio) + b2 * ratio);

  return '#' +
    r.toString(16).padStart(2, '0') +
    g.toString(16).padStart(2, '0') +
    b.toString(16).padStart(2, '0');
}

/**
 * Utility: Check if a color is light or dark
 */
export function isLightColor(hex: string): boolean {
  if (!hex || typeof hex !== 'string') return true;

  const cleanHex = hex.replace('#', '');
  if (cleanHex.length !== 6) return true;

  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance > 0.5;
}

/**
 * Utility: Adjust color saturation
 */
export function adjustSaturation(hex: string, amount: number): string {
  const cleanHex = hex.replace('#', '');
  let r = parseInt(cleanHex.substr(0, 2), 16);
  let g = parseInt(cleanHex.substr(2, 2), 16);
  let b = parseInt(cleanHex.substr(4, 2), 16);

  // Convert to HSL
  r /= 255; g /= 255; b /= 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;

  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }

  // Adjust saturation
  s = Math.max(0, Math.min(1, s + amount));

  // Convert back to RGB
  const hue2rgb = (p: number, q: number, t: number) => {
    if (t < 0) t += 1;
    if (t > 1) t -= 1;
    if (t < 1/6) return p + (q - p) * 6 * t;
    if (t < 1/2) return q;
    if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
    return p;
  };

  let newR, newG, newB;
  if (s === 0) {
    newR = newG = newB = l;
  } else {
    const q = l < 0.5 ? l * (1 + s) : l + s - l * s;
    const p = 2 * l - q;
    newR = hue2rgb(p, q, h + 1/3);
    newG = hue2rgb(p, q, h);
    newB = hue2rgb(p, q, h - 1/3);
  }

  return '#' +
    Math.round(newR * 255).toString(16).padStart(2, '0') +
    Math.round(newG * 255).toString(16).padStart(2, '0') +
    Math.round(newB * 255).toString(16).padStart(2, '0');
}
