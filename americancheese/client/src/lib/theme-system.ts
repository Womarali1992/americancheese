/**
 * Theme System - Compatibility Layer
 *
 * This file maintains backward compatibility for components using the old theme-system
 * while delegating to color-themes.ts as the single source of truth.
 */

import {
  COLOR_THEMES,
  getActiveColorTheme,
  getThemeTier1Color,
  getThemeTier2Color,
  applyThemeToCSS,
  type ColorTheme
} from './color-themes';

// Re-export types and themes
export type { ColorTheme };
export const THEMES = COLOR_THEMES;
export const DEFAULT_THEME = 'earth-tone';

// Project theme overrides (in-memory storage)
const projectThemeOverrides = new Map<number, string>();

/**
 * Get the active global theme
 */
export function getGlobalTheme(): ColorTheme {
  return getActiveColorTheme();
}

/**
 * Get theme for a specific project (with fallback to global)
 */
export function getProjectTheme(projectId?: number, projectData?: {colorTheme?: string | null, useGlobalTheme?: boolean}): ColorTheme {
  // First try direct project data if provided
  if (projectData && projectData.colorTheme && !projectData.useGlobalTheme) {
    const normalizedKey = projectData.colorTheme.toLowerCase().replace(/\s+/g, '-');
    return COLOR_THEMES[normalizedKey] || getActiveColorTheme();
  }

  // Then try in-memory overrides
  if (projectId && projectThemeOverrides.has(projectId)) {
    const themeKey = projectThemeOverrides.get(projectId)!;
    return COLOR_THEMES[themeKey] || getActiveColorTheme();
  }

  return getActiveColorTheme();
}

/**
 * Set theme override for a specific project
 */
export function setProjectTheme(projectId: number, themeKey: string | null): void {
  if (themeKey && COLOR_THEMES[themeKey]) {
    projectThemeOverrides.set(projectId, themeKey);
    applyThemeToCSS(COLOR_THEMES[themeKey]);
    // Notify listeners about theme change
    try { listeners.forEach(cb => cb()); } catch {}
  } else {
    projectThemeOverrides.delete(projectId);
    applyThemeToCSS(getActiveColorTheme());
    // Notify listeners about theme change
    try { listeners.forEach(cb => cb()); } catch {}
  }
}

/**
 * Set the global theme
 */
export function setGlobalTheme(themeKey: string): void {
  const theme = COLOR_THEMES[themeKey];
  if (theme) {
    localStorage.setItem('colorTheme', themeKey);
    applyThemeToCSS(theme);
    // Notify listeners about theme change
    try { listeners.forEach(cb => cb()); } catch {}
  }
}

// Theme change listeners
const listeners = new Set<() => void>();

/**
 * Subscribe to theme changes
 */
export function onThemeChange(callback: () => void): () => void {
  listeners.add(callback);
  return () => listeners.delete(callback);
}

/**
 * Get color for a tier1 category
 */
export function getTier1Color(category: string, projectId?: number, theme?: ColorTheme): string {
  const activeTheme = theme || (projectId ? getProjectTheme(projectId) : getActiveColorTheme());
  return getThemeTier1Color(category, activeTheme);
}

/**
 * Get color for a tier2 category
 */
export function getTier2Color(category: string, projectId?: number, parentCategory?: string, theme?: ColorTheme): string {
  const activeTheme = theme || (projectId ? getProjectTheme(projectId) : getActiveColorTheme());
  return getThemeTier2Color(category, activeTheme, parentCategory);
}

/**
 * Get color for any category (auto-detects tier1 or tier2)
 */
export function getCategoryColor(category: string, projectId?: number): string {
  // Try tier1 first
  const tier1Color = getTier1Color(category, projectId);
  if (tier1Color !== getActiveColorTheme().tier1.default) {
    return tier1Color;
  }

  // Try tier2
  const tier2Color = getTier2Color(category, projectId);
  if (tier2Color !== getActiveColorTheme().tier2.other) {
    return tier2Color;
  }

  // Default fallback
  return '#6366f1';
}

/**
 * Get color from generic color palette by category name
 * Uses a hash function for consistent color assignment
 * @param category - Category name or index
 * @param projectId - Optional project ID
 * @param colorTheme - Optional theme name (e.g., "Earth Tone") - if provided, uses this theme directly
 */
export function getGenericColor(category: string | number, projectId?: number, colorTheme?: string): string {
  // If colorTheme is provided, use it directly (for dashboard showing multiple projects)
  let theme: ColorTheme;
  if (colorTheme) {
    const normalizedKey = colorTheme.toLowerCase().replace(/\s+/g, '-');
    theme = COLOR_THEMES[normalizedKey] || getActiveColorTheme();
  } else {
    theme = projectId ? getProjectTheme(projectId) : getActiveColorTheme();
  }

  // Build a distinct color palette from the 5 main tier1 subcategories
  // This provides much better visual distinction than picking from the 20 similar tier2 colors
  const colorPalette = [
    theme.tier1.subcategory1,
    theme.tier1.subcategory2,
    theme.tier1.subcategory3,
    theme.tier1.subcategory4,
    theme.tier1.subcategory5
  ];

  if (typeof category === 'number') {
    return colorPalette[category % colorPalette.length];
  }

  // Use hash function for string categories
  let hash = 0;
  const str = category.toLowerCase().trim();
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32-bit integer
  }

  const index = Math.abs(hash) % colorPalette.length;
  return colorPalette[index];
}

// Color utility functions
export const colorUtils = {
  /**
   * Convert hex to rgba with opacity
   */
  hexToRgba(hex: string, alpha: number = 1): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return `rgba(0, 0, 0, ${alpha})`;

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  },

  /**
   * Get a lighter version of a color
   */
  lighten(hex: string, amount: number = 0.1): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return hex;

    const r = Math.min(255, parseInt(result[1], 16) + Math.round(255 * amount));
    const g = Math.min(255, parseInt(result[2], 16) + Math.round(255 * amount));
    const b = Math.min(255, parseInt(result[3], 16) + Math.round(255 * amount));

    return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
  },

  /**
   * Get contrasting text color (black or white) for a background
   */
  getContrastText(hex: string): string {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    if (!result) return '#000000';

    const r = parseInt(result[1], 16);
    const g = parseInt(result[2], 16);
    const b = parseInt(result[3], 16);

    // Calculate relative luminance
    const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
    return luminance > 0.5 ? '#000000' : '#ffffff';
  }
};
