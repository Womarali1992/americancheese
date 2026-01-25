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
    // Group 0 (tier1[0] - green/olive family) - subtle variations around base
    '#4d6328', '#536a2d', '#556b2f', '#5a7032', '#5f7535',
    // Group 1 (tier1[1] - brown/earth family) - subtle variations around base
    '#814010', '#874312', '#8b4513', '#8f4815', '#944b17',
    // Group 2 (tier1[2] - blue/slate family) - subtle variations around base
    '#3f4d60', '#435164', '#475569', '#4b596d', '#4f5d72',
    // Group 3 (tier1[3] - orange/terracotta family) - subtle variations around base
    '#a64e08', '#ad5109', '#b45309', '#ba560a', '#c1590b',
    // Group 4 (tier1[4] - dark brown/cocoa family) - subtle variations around base
    '#52372b', '#573c2f', '#5c4033', '#614537', '#664a3b',
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
    // Group 0 (blue family) - subtle variations around base
    '#8ac0fc', '#8fc3fd', '#93c5fd', '#98c8fd', '#9dcbfe',
    // Group 1 (indigo/purple family) - subtle variations around base
    '#9caefb', '#a0b1fc', '#a5b4fc', '#aab7fc', '#afbafd',
    // Group 2 (rose/pink family) - subtle variations around base
    '#fc9aa6', '#fc9fab', '#fda4af', '#fda9b4', '#feaeb9',
    // Group 3 (yellow/amber family) - subtle variations around base
    '#fcd044', '#fcd149', '#fcd34d', '#fcd552', '#fcd757',
    // Group 4 (purple/violet family) - subtle variations around base
    '#d5affd', '#d6b2fe', '#d8b4fe', '#dab7fe', '#dcb9fe',
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
    // Group 0 (blue family) - subtle variations around base
    '#3278f2', '#3680f4', '#3b82f6', '#4088f7', '#458ef8',
    // Group 1 (violet/purple family) - subtle variations around base
    '#8252f3', '#8657f5', '#8b5cf6', '#9061f7', '#9566f8',
    // Group 2 (pink/rose family) - subtle variations around base
    '#e93f92', '#ea4495', '#ec4899', '#ee4d9c', '#f052a0',
    // Group 3 (orange/mango family) - subtle variations around base
    '#ff8f00', '#ff9400', '#ff9800', '#ff9c00', '#ffa100',
    // Group 4 (indigo family) - subtle variations around base
    '#5a5dee', '#5f61ef', '#6366f1', '#686bf2', '#6d70f3',
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
    // Group 0 (orange/amber family - structural) - subtle variations around base
    '#cf6e05', '#d47206', '#d97706', '#de7b07', '#e37f08',
    // Group 1 (blue family - systems) - subtle variations around base
    '#035f95', '#03649b', '#0369a1', '#046ea7', '#0473ad',
    // Group 2 (red family - sheathing/barriers) - subtle variations around base
    '#d42222', '#d82424', '#dc2626', '#e02828', '#e42a2a',
    // Group 3 (green family - finishings) - subtle variations around base
    '#149944', '#15a047', '#16a34a', '#17a64d', '#18a950',
    // Group 4 (yellow family) - subtle variations around base
    '#e5ad07', '#e8b008', '#eab308', '#edb609', '#f0b90a',
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
    // Group 0 (dark/black family) - subtle variations around base
    '#2b0000', '#2f0000', '#330000', '#370000', '#3b0000',
    // Group 1 (red family) - subtle variations around base
    '#820000', '#870000', '#8B0000', '#900000', '#940000',
    // Group 2 (orange family) - subtle variations around base
    '#fa4000', '#fc4300', '#FF4500', '#ff4800', '#ff4b00',
    // Group 3 (amber/yellow family) - subtle variations around base
    '#ffa000', '#ffa300', '#FFA500', '#ffa800', '#ffab00',
    // Group 4 (burnt orange family) - subtle variations around base
    '#b55000', '#ba5400', '#BF5700', '#c45b00', '#c95f00',
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
    // Group 0 (black/dark family) - subtle variations around base
    '#151515', '#181818', '#1a1a1a', '#1d1d1d', '#202020',
    // Group 1 (cyan family) - subtle variations around base
    '#00f5f5', '#00fafa', '#00ffff', '#05ffff', '#0affff',
    // Group 2 (magenta/pink family) - subtle variations around base
    '#f500f5', '#fa00fa', '#ff00ff', '#ff05ff', '#ff0aff',
    // Group 3 (yellow family) - subtle variations around base
    '#f5f500', '#fafa00', '#ffff00', '#ffff05', '#ffff0a',
    // Group 4 (hot pink family) - subtle variations around base
    '#e94092', '#ea4495', '#ec4899', '#ee4c9c', '#f0509f',
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
    // Group 0 (bronze family) - subtle variations around base
    '#553b2e', '#593d31', '#5C4033', '#604336', '#644639',
    // Group 1 (clay family) - subtle variations around base
    '#9b4d28', '#9e502b', '#A0522D', '#a35530', '#a65833',
    // Group 2 (rust family) - subtle variations around base
    '#824010', '#874312', '#8B4513', '#904815', '#944b17',
    // Group 3 (lilac/purple family) - subtle variations around base
    '#8c68d7', '#906cd9', '#9370DB', '#9774dd', '#9a78df',
    // Group 4 (dark bronze family) - subtle variations around base
    '#633f1f', '#674121', '#6B4423', '#6f4725', '#734a27',
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
    // Group 0 (sapphire/blue family) - subtle variations around base
    '#0d4bb0', '#0e4fb5', '#0F52BA', '#1056bf', '#1159c4',
    // Group 1 (emerald/green family) - subtle variations around base
    '#4ac372', '#4dc675', '#50C878', '#53cb7b', '#56cd7e',
    // Group 2 (gold/yellow family) - subtle variations around base
    '#f5cf00', '#f8d300', '#FFD700', '#ffdb00', '#ffdf00',
    // Group 3 (crystal/lavender family) - subtle variations around base
    '#e0e0f5', '#e3e3f8', '#E6E6FA', '#e9e9fc', '#ececff',
    // Group 4 (royal blue family) - subtle variations around base
    '#3c61d9', '#3e65dd', '#4169E1', '#446de5', '#4771e9',
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
    // Group 0 (gray family) - subtle variations around base
    '#D5D5D5', '#D9D9D9', '#DCDCDC', '#E0E0E0', '#E4E4E4',
    // Group 1 (taupe family) - subtle variations around base
    '#A9A389', '#ACA68D', '#B0A990', '#B3AC94', '#B7AF98',
    // Group 2 (graphite family) - subtle variations around base
    '#A2A2A2', '#A6A6A6', '#A9A9A9', '#ADADAD', '#B1B1B1',
    // Group 3 (cream family) - subtle variations around base
    '#F0F0D5', '#F3F3D9', '#F5F5DC', '#F8F8E0', '#FBFBE4',
    // Group 4 (silver family) - subtle variations around base
    '#B9B9B9', '#BDBDBD', '#C0C0C0', '#C4C4C4', '#C8C8C8',
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
    // Group 0 (custard/blonde family) - subtle variations around base
    '#e3ce9c', '#e6d19f', '#E8D4A2', '#ebd7a5', '#eedaa8',
    // Group 1 (cardboard/taupe family) - subtle variations around base
    '#826e50', '#877153', '#8B7355', '#907658', '#94795b',
    // Group 2 (slate/gray family) - subtle variations around base
    '#626d7a', '#676f7d', '#6B7280', '#707583', '#757886',
    // Group 3 (kraft/tan family) - subtle variations around base
    '#cf9f6e', '#d2a271', '#D4A574', '#d7a877', '#daab7a',
    // Group 4 (cool gray/blue-gray family) - subtle variations around base
    '#8d9cb0', '#919fb4', '#94A3B8', '#98a7bc', '#9caac0',
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
    // Group 0 (plum/purple family) - subtle variations around base
    '#44007a', '#48007e', '#4B0082', '#4f0086', '#52008a',
    // Group 1 (wine/red family) - subtle variations around base
    '#770000', '#7c0000', '#800000', '#850000', '#8a0000',
    // Group 2 (gray family) - subtle variations around base
    '#294747', '#2c4b4b', '#2F4F4F', '#325353', '#355757',
    // Group 3 (lavender family) - subtle variations around base
    '#b44fcc', '#b752cf', '#BA55D3', '#bd58d6', '#c05bda',
    // Group 4 (dark slate blue family) - subtle variations around base
    '#423783', '#453a87', '#483D8B', '#4b408f', '#4e4393',
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
    // Group 0 (bronze/earth family) - subtle variations around base
    '#553b2e', '#593d31', '#5C4033', '#604336', '#644639',
    // Group 1 (molten red family) - subtle variations around base
    '#820000', '#870000', '#8B0000', '#900000', '#940000',
    // Group 2 (lava orange family) - subtle variations around base
    '#f55f00', '#fa6300', '#FF6600', '#ff6a00', '#ff6e00',
    // Group 3 (alien lilac/purple family) - subtle variations around base
    '#8c68d7', '#906cd9', '#9370DB', '#9774dd', '#9a78df',
    // Group 4 (sienna/clay family) - subtle variations around base
    '#9b4d28', '#9e502b', '#A0522D', '#a35530', '#a65833',
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
