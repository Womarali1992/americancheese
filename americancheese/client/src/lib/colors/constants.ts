/**
 * Color System Constants
 * Single source of truth for tier1 category name mappings
 */

/**
 * Maps tier1 category names to their index (0-4)
 * This determines which tier1 color slot a category gets,
 * and consequently which group of tier2 colors its children use.
 *
 * Index mapping:
 * 0 -> First tier1 color, tier2[0..4]
 * 1 -> Second tier1 color, tier2[5..9]
 * 2 -> Third tier1 color, tier2[10..14]
 * 3 -> Fourth tier1 color, tier2[15..19]
 * 4 -> Fifth tier1 color, tier2[20..24]
 */
export const TIER1_NAME_MAP: Record<string, number> = {
  // Home Builder preset
  'permitting': 0,
  'structural': 1,
  'systems': 2,
  'sheathing': 2,  // Same as systems
  'finishings': 3,

  // Workout preset
  'push': 0,
  'pull': 1,
  'legs': 2,
  'cardio': 3,
  'core': 4,

  // Wellness/Yoga preset (each category gets unique index)
  'qi gong': 0,
  'yoga': 1,
  'breathwork': 2,
  'meditation': 3,
  'tai chi': 4,
  'breathing': 2,  // Same as breathwork (similar concept)
  'stretching': 1, // Same as yoga (similar concept)

  // Software/Product preset
  'software engineering': 0,
  'product management': 1,
  'design / ux': 2,
  'marketing / go-to-market (gtm)': 3,
  'marketing / go to market (gtm)': 3,  // Alternative format
  'devops / infrastructure': 4,

  // Digital Marketing preset
  'foundation': 0,
  'creation': 1,
  'distribution': 2,
  'optimization': 3,

  // Generic subcategory names (from admin panel)
  'subcategory1': 0,
  'subcategory2': 1,
  'subcategory3': 2,
  'subcategory4': 3,
  'subcategory5': 4,
};

/**
 * Default colors used when theme lookup fails
 */
export const DEFAULT_COLORS = {
  tier1: '#6366f1', // Indigo
  tier2: '#8b5cf6', // Violet
  status: {
    completed: '#22c55e',
    active: '#3b82f6',
    in_progress: '#f59e0b',
    pending: '#94a3b8',
    default: '#94a3b8',
  },
};

/**
 * Default theme name
 */
export const DEFAULT_THEME = 'earth-tone';

/**
 * localStorage key for storing global theme preference
 */
export const THEME_STORAGE_KEY = 'colorTheme';
