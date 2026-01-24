/**
 * Color System Types
 * Single source of truth for all color-related types
 */

/**
 * Simplified Theme Structure
 * - tier1: Array of exactly 5 colors (indexed 0-4)
 * - tier2: Array of exactly 20 colors (indexed 0-19)
 *
 * Relationship: Each tier1 color maps to 5 tier2 colors
 * - tier1[0] -> tier2[0..4]
 * - tier1[1] -> tier2[5..9]
 * - tier1[2] -> tier2[10..14]
 * - tier1[3] -> tier2[15..19]
 * - tier1[4] -> uses tier2[0..4] as fallback
 */
export interface Theme {
  name: string;
  description: string;
  tier1: [string, string, string, string, string]; // Exactly 5 colors
  tier2: string[]; // Exactly 20 colors
}

/**
 * Options for color resolution
 */
export interface ColorOptions {
  /** Project's custom theme name (from database) */
  projectTheme?: string | null;
  /** Global theme name (from localStorage) */
  globalTheme?: string;
  /** Parent tier1 category name (required for tier2 lookups) */
  tier1Parent?: string | null;
  /** Index of the category within its group (0-4) */
  index?: number;
}

/**
 * Return type from useColors hook
 */
export interface UseColorsReturn {
  /** Get color for a tier1 category */
  getTier1Color: (categoryName: string, index?: number) => string;
  /** Get color for a tier2 category */
  getTier2Color: (categoryName: string, tier1Parent?: string | null, index?: number) => string;
  /** Get both tier1 and tier2 colors for a task */
  getTaskColors: (tier1?: string | null, tier2?: string | null) => { tier1Color: string; tier2Color: string };
  /** Current active theme */
  activeTheme: Theme;
  /** Whether project data is still loading */
  isLoading: boolean;
  /** Whether project has a custom theme */
  hasProjectTheme: boolean;
}
