/**
 * Color Resolver
 * Single source of truth for all color resolution logic
 */

import type { Theme, ColorOptions } from './types';
import { TIER1_NAME_MAP, DEFAULT_COLORS, DEFAULT_THEME, THEME_STORAGE_KEY } from './constants';
import { getTheme, THEMES, EARTH_TONE } from './themes';

/**
 * Get the global theme from localStorage
 */
export function getGlobalTheme(): Theme {
  if (typeof localStorage === 'undefined') {
    return EARTH_TONE;
  }

  try {
    const themeName = localStorage.getItem(THEME_STORAGE_KEY);
    if (themeName) {
      return getTheme(themeName);
    }
  } catch {
    // localStorage access can throw in some environments
  }

  return EARTH_TONE;
}

/**
 * Set the global theme in localStorage
 */
export function setGlobalTheme(themeName: string): void {
  if (typeof localStorage === 'undefined') return;

  try {
    const normalized = themeName.toLowerCase().replace(/\s+/g, '-');
    localStorage.setItem(THEME_STORAGE_KEY, normalized);
  } catch {
    // localStorage access can throw in some environments
  }
}

/**
 * Resolve which theme to use based on priority:
 * 1. Project-specific theme (if provided)
 * 2. Global theme (from localStorage)
 * 3. Default theme (earth-tone)
 */
export function resolveTheme(options: ColorOptions = {}): Theme {
  // Priority 1: Project-specific theme
  if (options.projectTheme) {
    return getTheme(options.projectTheme);
  }

  // Priority 2: Global theme
  if (options.globalTheme) {
    return getTheme(options.globalTheme);
  }

  // Priority 3: Get from localStorage or default
  return getGlobalTheme();
}

/**
 * Get the tier1 index for a category name
 * Returns 0-4 based on known category names, or uses hash for unknown names
 */
function getTier1Index(categoryName: string): number {
  const normalized = categoryName.toLowerCase().trim();

  // Check known mappings
  if (normalized in TIER1_NAME_MAP) {
    return TIER1_NAME_MAP[normalized];
  }

  // For unknown categories, use deterministic hash
  const hash = simpleHash(normalized);
  return hash % 5;
}

/**
 * Simple hash function for deterministic color assignment
 */
function simpleHash(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = ((hash << 5) - hash) + str.charCodeAt(i);
    hash = hash & hash; // Convert to 32-bit integer
  }
  return Math.abs(hash);
}

/**
 * Get a tier1 category color
 *
 * @param categoryName - The name of the tier1 category
 * @param options - Optional: projectTheme, globalTheme, index
 * @returns Hex color string
 */
export function getTier1Color(
  categoryName: string,
  options: ColorOptions = {}
): string {
  if (!categoryName) return DEFAULT_COLORS.tier1;

  const theme = resolveTheme(options);

  // Use provided index if available, otherwise look up by name
  const index = options.index ?? getTier1Index(categoryName);

  // Clamp to valid range [0, 4]
  const clampedIndex = Math.max(0, Math.min(4, index));

  return theme.tier1[clampedIndex] || DEFAULT_COLORS.tier1;
}

/**
 * Get a tier2 category color
 *
 * The tier2 color is determined by:
 * 1. Which tier1 parent it belongs to (determines the group of 5 colors)
 * 2. Its index within that tier1's children (determines which of the 5 colors)
 *
 * @param categoryName - The name of the tier2 category
 * @param options - Optional: projectTheme, globalTheme, tier1Parent, index
 * @returns Hex color string
 */
export function getTier2Color(
  categoryName: string,
  options: ColorOptions = {}
): string {
  if (!categoryName) return DEFAULT_COLORS.tier2;

  const theme = resolveTheme(options);

  // Determine which group of 5 colors to use based on tier1 parent
  let groupIndex = 0;
  if (options.tier1Parent) {
    const tier1Index = getTier1Index(options.tier1Parent);
    // Map tier1 index (0-4) to tier2 group (0-4)
    // Each tier1 now has its own tier2 group (tier2 has 25 colors: 5 groups of 5)
    groupIndex = tier1Index % 5;
  }

  // Calculate the starting index for this group in tier2 array
  const groupStart = groupIndex * 5;

  // Determine which color within the group (0-4)
  let colorOffset: number;
  if (options.index !== undefined) {
    // Use provided index
    colorOffset = options.index % 5;
  } else {
    // Use hash of category name for deterministic assignment
    colorOffset = simpleHash(categoryName.toLowerCase().trim()) % 5;
  }

  const tier2Index = groupStart + colorOffset;

  // Ensure we're within bounds
  if (tier2Index >= 0 && tier2Index < theme.tier2.length) {
    return theme.tier2[tier2Index];
  }

  return DEFAULT_COLORS.tier2;
}

/**
 * Get both tier1 and tier2 colors for a task
 *
 * @param tier1Category - The tier1 category name (optional)
 * @param tier2Category - The tier2 category name (optional)
 * @param options - Color resolution options
 * @returns Object with tier1Color and tier2Color
 */
export function getTaskColors(
  tier1Category: string | null | undefined,
  tier2Category: string | null | undefined,
  options: ColorOptions = {}
): { tier1Color: string; tier2Color: string } {
  const tier1Color = tier1Category
    ? getTier1Color(tier1Category, options)
    : DEFAULT_COLORS.tier1;

  const tier2Color = tier2Category
    ? getTier2Color(tier2Category, { ...options, tier1Parent: tier1Category })
    : tier1Color; // Fall back to tier1 color if no tier2

  return { tier1Color, tier2Color };
}

/**
 * Get a status color
 */
export function getStatusColor(status?: string | null): string {
  if (!status) return DEFAULT_COLORS.status.default;

  const normalized = status.toLowerCase().replace(/[_\s-]/g, '');

  if (normalized.includes('complet')) return DEFAULT_COLORS.status.completed;
  if (normalized.includes('activ')) return DEFAULT_COLORS.status.active;
  if (normalized.includes('progress')) return DEFAULT_COLORS.status.in_progress;
  if (normalized.includes('pending')) return DEFAULT_COLORS.status.pending;

  return DEFAULT_COLORS.status.default;
}

/**
 * Get a status background color (with opacity)
 */
export function getStatusBgColor(status?: string | null): string {
  const color = getStatusColor(status);
  return hexToRgba(color, 0.1);
}

/**
 * Format a task status for display
 */
export function formatTaskStatus(status?: string | null): string {
  if (!status) return 'Not Started';

  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

// ==================== Color Utilities ====================

/**
 * Convert hex color to rgba string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Parse the hex values
  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Handle invalid hex
  if (isNaN(r) || isNaN(g) || isNaN(b)) {
    return `rgba(99, 102, 241, ${alpha})`; // Default to indigo
  }

  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color by a factor (0-1 ratio or 0-100 percentage)
 * @param hex - Hex color string
 * @param factor - Amount to lighten (0.9 or 90 both mean 90% lighter)
 */
export function lightenColor(hex: string, factor: number): string {
  const cleanHex = hex.replace('#', '');

  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  // Normalize factor: if <= 1, treat as ratio; if > 1, treat as percentage
  const normalizedFactor = factor <= 1 ? factor : factor / 100;

  r = Math.min(255, Math.floor(r + (255 - r) * normalizedFactor));
  g = Math.min(255, Math.floor(g + (255 - g) * normalizedFactor));
  b = Math.min(255, Math.floor(b + (255 - b) * normalizedFactor));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Darken a hex color by a factor (0-1 ratio or 0-100 percentage)
 * @param hex - Hex color string
 * @param factor - Amount to darken (0.2 or 20 both mean 20% darker)
 */
export function darkenColor(hex: string, factor: number): string {
  const cleanHex = hex.replace('#', '');

  let r = parseInt(cleanHex.substring(0, 2), 16);
  let g = parseInt(cleanHex.substring(2, 4), 16);
  let b = parseInt(cleanHex.substring(4, 6), 16);

  // Normalize factor: if <= 1, treat as ratio; if > 1, treat as percentage
  const normalizedFactor = factor <= 1 ? factor : factor / 100;

  r = Math.max(0, Math.floor(r * (1 - normalizedFactor)));
  g = Math.max(0, Math.floor(g * (1 - normalizedFactor)));
  b = Math.max(0, Math.floor(b * (1 - normalizedFactor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

/**
 * Get contrasting text color (black or white) for a background color
 */
export function getContrastText(hex: string): string {
  const cleanHex = hex.replace('#', '');

  const r = parseInt(cleanHex.substring(0, 2), 16);
  const g = parseInt(cleanHex.substring(2, 4), 16);
  const b = parseInt(cleanHex.substring(4, 6), 16);

  // Calculate relative luminance
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;

  return luminance > 0.5 ? '#000000' : '#ffffff';
}
