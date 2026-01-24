/**
 * Color Themes
 * 12 predefined color themes with simplified structure
 *
 * Each theme has:
 * - tier1: Array of 5 colors (indexed 0-4)
 * - tier2: Array of 25 colors (indexed 0-24)
 *
 * Tier1 to Tier2 mapping:
 * - tier1[0] -> tier2[0..4]   (5 colors)
 * - tier1[1] -> tier2[5..9]   (5 colors)
 * - tier1[2] -> tier2[10..14] (5 colors)
 * - tier1[3] -> tier2[15..19] (5 colors)
 * - tier1[4] -> tier2[20..24] (5 colors)
 */

import type { Theme } from './types';

/**
 * Earth Tone Theme
 * Natural earthy colors inspired by traditional building materials
 */
export const EARTH_TONE: Theme = {
  name: 'Earth Tone',
  description: 'Natural earthy colors inspired by traditional building materials',
  tier1: ['#556b2f', '#8b4513', '#475569', '#b45309', '#5c4033'],
  tier2: [
    // Group 0 (tier1[0] - green/olive family)
    '#3d5a22', '#475e29', '#556b2f', '#6b8e3a', '#7da647',
    // Group 1 (tier1[1] - brown/earth family)
    '#6b3410', '#7a3e13', '#8b4513', '#a0522d', '#b8651b',
    // Group 2 (tier1[2] - blue/slate family)
    '#334155', '#3d4a5c', '#475569', '#5a6a7f', '#64748b',
    // Group 3 (tier1[3] - orange/terracotta family)
    '#92400e', '#a14a0d', '#b45309', '#c2621e', '#d97706',
    // Group 4 (tier1[4] - dark brown/cocoa family)
    '#3d2817', '#4a3324', '#5c4033', '#6e4d3e', '#7f5a4a',
  ],
};

/**
 * Pastel Theme
 * Soft, modern colors for a clean and contemporary look
 */
export const PASTEL: Theme = {
  name: 'Pastel',
  description: 'Soft, modern colors for a clean and contemporary look',
  tier1: ['#93c5fd', '#a5b4fc', '#fda4af', '#fcd34d', '#d8b4fe'],
  tier2: [
    // Group 0 (blue family)
    '#93c5fd', '#bfdbfe', '#60a5fa', '#3b82f6', '#2563eb',
    // Group 1 (indigo/purple family)
    '#a5b4fc', '#818cf8', '#6366f1', '#4f46e5', '#4338ca',
    // Group 2 (rose/pink family)
    '#fda4af', '#fb7185', '#f43f5e', '#e11d48', '#be123c',
    // Group 3 (yellow/amber family)
    '#fcd34d', '#fbbf24', '#f59e0b', '#d97706', '#b45309',
    // Group 4 (purple/violet family)
    '#d8b4fe', '#c084fc', '#a855f7', '#9333ea', '#7e22ce',
  ],
};

/**
 * Futuristic Theme
 * Bold, vibrant colors for a modern tech-forward look
 */
export const FUTURISTIC: Theme = {
  name: 'Futuristic',
  description: 'Bold, vibrant colors for a modern tech-forward look',
  tier1: ['#3b82f6', '#8b5cf6', '#ec4899', '#ff9800', '#6366f1'],
  tier2: [
    // Group 0 (blue family)
    '#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd',
    // Group 1 (violet/purple family)
    '#7c3aed', '#8b5cf6', '#a78bfa', '#c4b5fd', '#ddd6fe',
    // Group 2 (pink/rose family)
    '#be185d', '#db2777', '#ec4899', '#f472b6', '#f9a8d4',
    // Group 3 (orange/mango family)
    '#e65100', '#f57c00', '#ff9800', '#ffa726', '#ffb74d',
    // Group 4 (indigo family)
    '#4f46e5', '#5a51eb', '#6366f1', '#7c7af5', '#9595f9',
  ],
};

/**
 * Classic Construction Theme
 * Bold construction colors with excellent visibility and contrast
 */
export const CLASSIC_CONSTRUCTION: Theme = {
  name: 'Classic Construction',
  description: 'Bold construction colors with excellent visibility and contrast',
  tier1: ['#d97706', '#0369a1', '#dc2626', '#16a34a', '#eab308'],
  tier2: [
    // Group 0 (orange/amber family - structural)
    '#92400e', '#b45309', '#d97706', '#f59e0b', '#fbbf24',
    // Group 1 (blue family - systems)
    '#075985', '#0369a1', '#0284c7', '#0ea5e9', '#38bdf8',
    // Group 2 (red family - sheathing/barriers)
    '#991b1b', '#b91c1c', '#dc2626', '#ef4444', '#f87171',
    // Group 3 (green family - finishings)
    '#15803d', '#16a34a', '#22c55e', '#4ade80', '#86efac',
    // Group 4 (yellow family)
    '#ca8a04', '#d9a006', '#eab308', '#f5c518', '#fad728',
  ],
};

/**
 * Molten Core Theme
 * Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks
 */
export const MOLTEN_CORE: Theme = {
  name: 'Molten Core',
  description: 'Intense volcanic reds and lava-glow oranges contrasted with charcoal blacks',
  tier1: ['#330000', '#8B0000', '#FF4500', '#FFA500', '#BF5700'],
  tier2: [
    // Group 0 (dark/black family)
    '#0F0000', '#220000', '#330000', '#4F0000', '#661a00',
    // Group 1 (red family)
    '#660000', '#8B0000', '#AA0000', '#BB0000', '#CC0000',
    // Group 2 (orange family)
    '#CC3300', '#DD4400', '#FF4500', '#FF6600', '#FF7700',
    // Group 3 (amber/yellow family)
    '#CC8500', '#DD9500', '#FFAA00', '#FFA500', '#FFB700',
    // Group 4 (burnt orange family)
    '#8F4000', '#A54A00', '#BF5700', '#D46300', '#E87000',
  ],
};

/**
 * Neon Noir Theme
 * Dark cyberpunk noir with bright neon accents
 */
export const NEON_NOIR: Theme = {
  name: 'Neon Noir',
  description: 'Dark cyberpunk noir with bright neon accents - black, cyan, pink, and yellow',
  tier1: ['#1a1a1a', '#00ffff', '#ff00ff', '#ffff00', '#ec4899'],
  tier2: [
    // Group 0 (black/dark family)
    '#000000', '#0a0a0a', '#1a1a1a', '#2a2a2a', '#404040',
    // Group 1 (cyan family)
    '#008b8b', '#00a0a0', '#00cccc', '#00e5e5', '#00ffff',
    // Group 2 (magenta/pink family)
    '#cc00cc', '#dd00dd', '#ff00ff', '#ff33ff', '#ff66ff',
    // Group 3 (yellow family)
    '#cccc00', '#dddd00', '#ffff00', '#ffff33', '#ffff66',
    // Group 4 (hot pink family)
    '#be185d', '#db2777', '#ec4899', '#f472b6', '#f9a8d4',
  ],
};

/**
 * Dust Planet Theme
 * Sci-fi desert tones with alien mauves and muted rust
 */
export const DUST_PLANET: Theme = {
  name: 'Dust Planet',
  description: 'Sci-fi desert tones with alien mauves and muted rust',
  tier1: ['#5C4033', '#A0522D', '#8B4513', '#9370DB', '#6B4423'],
  tier2: [
    // Group 0 (bronze family)
    '#3D2914', '#4A3319', '#5C4033', '#6B4423', '#7E5A40',
    // Group 1 (clay family)
    '#8B4513', '#996633', '#A0522D', '#AA6642', '#B47A58',
    // Group 2 (rust family)
    '#703A00', '#7E4200', '#8B4513', '#964B00', '#A56000',
    // Group 3 (lilac/purple family)
    '#7B68EE', '#8470FF', '#9370DB', '#A080FF', '#B090FF',
    // Group 4 (dark bronze family)
    '#4a2e18', '#5a391f', '#6B4423', '#7c502a', '#8d5c32',
  ],
};

/**
 * Crystal Cavern Theme
 * Gem-like tones - sapphire, emerald, and topaz - for a luminous effect
 */
export const CRYSTAL_CAVERN: Theme = {
  name: 'Crystal Cavern',
  description: 'Gem-like tones - sapphire, emerald, and topaz - for a luminous effect',
  tier1: ['#0F52BA', '#50C878', '#FFD700', '#E6E6FA', '#4169E1'],
  tier2: [
    // Group 0 (sapphire/blue family)
    '#0C4295', '#0F52BA', '#1E6BDB', '#4289E8', '#60A5FA',
    // Group 1 (emerald/green family)
    '#2E8B57', '#3CB371', '#50C878', '#66CDAA', '#7FFFD4',
    // Group 2 (gold/yellow family)
    '#B8860B', '#DAA520', '#FFD700', '#FFDF00', '#FFED4E',
    // Group 3 (crystal/lavender family)
    '#9370DB', '#CCCCFF', '#D8D8FF', '#E6E6FA', '#EEE8FF',
    // Group 4 (royal blue family)
    '#2850b8', '#3660cc', '#4169E1', '#5a7de8', '#7391ef',
  ],
};

/**
 * Paper Studio Theme
 * Minimalist, tactile tones inspired by recycled paper and raw design materials
 */
export const PAPER_STUDIO: Theme = {
  name: 'Paper Studio',
  description: 'Minimalist, tactile tones inspired by recycled paper and raw design materials',
  tier1: ['#DCDCDC', '#B0A990', '#A9A9A9', '#F5F5DC', '#C0C0C0'],
  tier2: [
    // Group 0 (gray family)
    '#A9A9A9', '#BEBEBE', '#DCDCDC', '#E8E8E8', '#F5F5F5',
    // Group 1 (taupe family)
    '#998877', '#A99983', '#B0A990', '#696969', '#808080',
    // Group 2 (graphite family)
    '#A9A9A9', '#C0C0C0', '#D3D3D3', '#F0E9D2', '#F2EAD7',
    // Group 3 (cream family)
    '#F5F5DC', '#F5F5F0', '#F8F8FF', '#FFF8E7', '#C8C8C8',
    // Group 4 (silver family)
    '#A8A8A8', '#B4B4B4', '#C0C0C0', '#CCCCCC', '#D8D8D8',
  ],
};

/**
 * Paper Bright Theme
 * Vibrant, high-visibility paper tones with enhanced contrast and clarity
 */
export const PAPER_BRIGHT: Theme = {
  name: 'Paper Bright',
  description: 'Vibrant, high-visibility paper tones with enhanced contrast and clarity',
  tier1: ['#E8D4A2', '#8B7355', '#6B7280', '#D4A574', '#94A3B8'],
  tier2: [
    // Group 0 (custard/blonde family)
    '#D4C59A', '#DDD0A4', '#E8D4A2', '#F0DFAF', '#F5E9C0',
    // Group 1 (cardboard/taupe family)
    '#6D5A47', '#7A6750', '#8B7355', '#9B8365', '#AA9275',
    // Group 2 (slate/gray family)
    '#4B5563', '#64748B', '#6B7280', '#94A3B8', '#B0B8C4',
    // Group 3 (kraft/tan family)
    '#C89960', '#D4A574', '#DDB87F', '#E8C9A1', '#F0DEC0',
    // Group 4 (cool gray/blue-gray family)
    '#7a8a9c', '#8795a8', '#94A3B8', '#a5b3c4', '#b6c3d0',
  ],
};

/**
 * Velvet Lounge Theme
 * Rich, luxurious theme with deep velvet tones and moody accents
 */
export const VELVET_LOUNGE: Theme = {
  name: 'Velvet Lounge',
  description: 'Rich, luxurious theme with deep velvet tones and moody accents',
  tier1: ['#4B0082', '#800000', '#2F4F4F', '#BA55D3', '#483D8B'],
  tier2: [
    // Group 0 (plum/purple family)
    '#2A004C', '#3A0069', '#4B0082', '#5C1A98', '#6A359C',
    // Group 1 (wine/red family)
    '#5B0000', '#6B0000', '#800000', '#8B1A1A', '#9B2020',
    // Group 2 (gray family)
    '#1A2929', '#203838', '#2F4F4F', '#3D6262', '#4F7777',
    // Group 3 (lavender family)
    '#9932CC', '#A845D9', '#BA55D3', '#C969DD', '#D880E6',
    // Group 4 (dark slate blue family)
    '#2e2763', '#3b3277', '#483D8B', '#5a4ca0', '#6c5bb5',
  ],
};

/**
 * Volcanic Dunes Theme
 * Volcanic reds and lava oranges meet dusty bronze and alien mauves
 */
export const VOLCANIC_DUNES: Theme = {
  name: 'Volcanic Dunes',
  description: 'Volcanic reds and lava oranges meet dusty bronze and alien mauves',
  tier1: ['#5C4033', '#8B0000', '#FF6600', '#9370DB', '#A0522D'],
  tier2: [
    // Group 0 (bronze/earth family)
    '#3D2914', '#4A3319', '#5C4033', '#6B4423', '#7E5A40',
    // Group 1 (molten red family)
    '#660000', '#8B0000', '#AA0000', '#BB0000', '#CC0000',
    // Group 2 (lava orange family)
    '#CC3300', '#DD4400', '#FF4500', '#FF6600', '#FF7700',
    // Group 3 (alien lilac/purple family)
    '#7B68EE', '#8470FF', '#9370DB', '#A080FF', '#B090FF',
    // Group 4 (sienna/clay family)
    '#8a421e', '#964a24', '#A0522D', '#b06138', '#c07043',
  ],
};

/**
 * All themes indexed by their normalized name (lowercase, kebab-case)
 */
export const THEMES: Record<string, Theme> = {
  'earth-tone': EARTH_TONE,
  'pastel': PASTEL,
  'futuristic': FUTURISTIC,
  'classic-construction': CLASSIC_CONSTRUCTION,
  'molten-core': MOLTEN_CORE,
  'neon-noir': NEON_NOIR,
  'dust-planet': DUST_PLANET,
  'crystal-cavern': CRYSTAL_CAVERN,
  'paper-studio': PAPER_STUDIO,
  'paper-bright': PAPER_BRIGHT,
  'velvet-lounge': VELVET_LOUNGE,
  'volcanic-dunes': VOLCANIC_DUNES,
};

/**
 * Get a theme by name (handles various formats)
 */
export function getTheme(name?: string | null): Theme {
  if (!name) return EARTH_TONE;

  // Normalize the name to lowercase kebab-case
  const normalized = name.toLowerCase().replace(/\s+/g, '-');

  // Direct lookup
  if (THEMES[normalized]) {
    return THEMES[normalized];
  }

  // Try matching by theme.name property
  const themeByName = Object.values(THEMES).find(
    (t) => t.name.toLowerCase() === name.toLowerCase()
  );
  if (themeByName) {
    return themeByName;
  }

  // Default fallback
  return EARTH_TONE;
}

/**
 * Normalize a theme name to the format used as keys in THEMES
 */
export function normalizeThemeName(name: string): string {
  return name.toLowerCase().replace(/\s+/g, '-');
}
