/**
 * Color System
 * Single source of truth for all color-related functionality
 *
 * Usage:
 * ```typescript
 * import { getTier1Color, getTier2Color, hexToRgba, useColors } from '@/lib/colors';
 *
 * // Direct function usage
 * const color = getTier1Color('structural', { projectTheme: 'molten-core' });
 *
 * // With hook (recommended for React components)
 * const { getTier1Color, getTier2Color, activeTheme } = useColors(projectId);
 * ```
 */

// Types
export type { Theme, ColorOptions, UseColorsReturn } from './types';

// Constants
export {
  TIER1_NAME_MAP,
  DEFAULT_COLORS,
  DEFAULT_THEME,
  THEME_STORAGE_KEY,
} from './constants';

// Themes
export {
  THEMES,
  getTheme,
  normalizeThemeName,
  EARTH_TONE,
  PASTEL,
  FUTURISTIC,
  CLASSIC_CONSTRUCTION,
  MOLTEN_CORE,
  NEON_NOIR,
  DUST_PLANET,
  CRYSTAL_CAVERN,
  PAPER_STUDIO,
  PAPER_BRIGHT,
  VELVET_LOUNGE,
  VOLCANIC_DUNES,
} from './themes';

// Resolver functions (main API)
export {
  getTier1Color,
  getTier2Color,
  getTaskColors,
  getStatusColor,
  getStatusBgColor,
  formatTaskStatus,
  resolveTheme,
  getGlobalTheme,
  setGlobalTheme,
  // Utilities
  hexToRgba,
  lightenColor,
  darkenColor,
  getContrastText,
} from './resolver';

// Re-export hook from hooks folder for convenience
export { useColors, useGlobalColors } from '../../hooks/useColors';
