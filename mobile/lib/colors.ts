/**
 * Color Utilities for Mobile App
 *
 * Ported from web app's unified-color-system.ts
 * Provides consistent color functions across the mobile app.
 */

// Default fallback colors
export const FALLBACK_COLORS = {
  primary: '#6366f1',      // Indigo
  tier1Default: '#556b2f', // Olive green
  tier2Default: '#64748b', // Slate
  statusDefault: '#6b7280', // Gray
  blue: '#3b82f6',
} as const;

// Default colors for status and categories
export const DEFAULT_COLORS = {
  tier1: {
    structural: '#556b2f',
    systems: '#445566',
    sheathing: '#9b2c2c',
    finishings: '#8b4513',
    permitting: '#5C4033',
    default: '#556b2f',
  },
  status: {
    completed: '#10b981',
    active: '#3b82f6',
    in_progress: '#f59e0b',
    on_hold: '#6b7280',
    not_started: '#64748b',
    delayed: '#ef4444',
    default: '#6b7280',
  },
} as const;

// Project colors - 8 colors that cycle based on project ID
const PROJECT_COLORS = [
  '#556b2f', // olive
  '#8b4513', // saddle brown
  '#475569', // slate
  '#b45309', // amber
  '#6366f1', // indigo
  '#7c3aed', // violet
  '#0891b2', // cyan
  '#ea580c', // orange
];

/**
 * Convert hex color to RGB object
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  if (!hex || typeof hex !== 'string') {
    return { r: 0, g: 0, b: 0 };
  }
  const cleanHex = hex.replace('#', '');
  const num = parseInt(cleanHex, 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255,
  };
}

/**
 * Convert hex color to RGBA string
 */
export function hexToRgba(hex: string, alpha: number = 1): string {
  if (!hex || typeof hex !== 'string') {
    return `rgba(0, 0, 0, ${alpha})`;
  }
  const { r, g, b } = hexToRgb(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/**
 * Lighten a hex color by a given amount (0-1)
 * 0 = no change, 1 = white
 */
export function lightenColor(hex: string, amount: number): string {
  if (!hex || typeof hex !== 'string') {
    return FALLBACK_COLORS.primary;
  }
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
  const b = Math.min(255, Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Darken a hex color by a given amount (0-1)
 * 0 = no change, 1 = black
 */
export function darkenColor(hex: string, amount: number): string {
  if (!hex || typeof hex !== 'string') {
    return FALLBACK_COLORS.primary;
  }
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0x0000FF) * (1 - amount)));
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Get project-specific color based on project ID
 * Uses a rotating palette of 8 colors
 */
export function getProjectColor(projectId: number): string {
  const colorIndex = ((projectId || 1) - 1) % PROJECT_COLORS.length;
  return PROJECT_COLORS[colorIndex];
}

/**
 * Get project colors with variations for different UI elements
 */
export function getProjectColors(projectId: number): {
  primary: string;
  light: string;
  lighter: string;
  border: string;
} {
  const primary = getProjectColor(projectId);
  return {
    primary,
    light: lightenColor(primary, 0.8),
    lighter: lightenColor(primary, 0.9),
    border: lightenColor(primary, 0.6),
  };
}

/**
 * Get status color
 */
export function getStatusColor(status?: string | null): string {
  if (!status) return DEFAULT_COLORS.status.default;

  const normalizedStatus = status.toLowerCase().replace(/[_\s-]/g, '');

  if (normalizedStatus.includes('complet')) return DEFAULT_COLORS.status.completed;
  if (normalizedStatus.includes('activ')) return DEFAULT_COLORS.status.active;
  if (normalizedStatus.includes('progress')) return DEFAULT_COLORS.status.in_progress;
  if (normalizedStatus.includes('hold')) return DEFAULT_COLORS.status.on_hold;
  if (normalizedStatus.includes('delay')) return DEFAULT_COLORS.status.delayed;
  if (normalizedStatus.includes('started') || normalizedStatus.includes('planned')) {
    return DEFAULT_COLORS.status.not_started;
  }

  return DEFAULT_COLORS.status.default;
}

/**
 * Get status styles for badges (background, text, border colors)
 */
export function getStatusStyles(status?: string | null): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const color = getStatusColor(status);
  return {
    backgroundColor: lightenColor(color, 0.85),
    textColor: darkenColor(color, 0.2),
    borderColor: lightenColor(color, 0.5),
  };
}

/**
 * Get tier1 category color (basic version without admin categories)
 */
export function getTier1Color(category?: string | null): string {
  if (!category) return DEFAULT_COLORS.tier1.default;

  const normalizedCategory = category.toLowerCase().trim();

  const categoryColorMap: Record<string, string> = {
    'structural': DEFAULT_COLORS.tier1.structural,
    'systems': DEFAULT_COLORS.tier1.systems,
    'sheathing': DEFAULT_COLORS.tier1.sheathing,
    'finishings': DEFAULT_COLORS.tier1.finishings,
    'permitting': DEFAULT_COLORS.tier1.permitting,
    // Software development preset
    'software engineering': '#2563eb',
    'product management': '#7c3aed',
    'design / ux': '#ec4899',
    'marketing / go-to-market (gtm)': '#ea580c',
    // Additional
    'push': '#3b82f6',
    'pull': '#22c55e',
    'legs': '#f59e0b',
    'cardio': '#a855f7',
  };

  return categoryColorMap[normalizedCategory] || FALLBACK_COLORS.primary;
}

/**
 * Get progress color based on percentage
 */
export function getProgressColor(progress: number): string {
  if (progress >= 100) return '#10b981'; // Green
  if (progress >= 75) return FALLBACK_COLORS.primary;
  if (progress >= 50) return '#f59e0b';  // Amber
  if (progress >= 25) return '#ef4444';  // Red
  return DEFAULT_COLORS.status.not_started;
}

export default {
  hexToRgb,
  hexToRgba,
  lightenColor,
  darkenColor,
  getProjectColor,
  getProjectColors,
  getStatusColor,
  getStatusStyles,
  getTier1Color,
  getProgressColor,
  FALLBACK_COLORS,
  DEFAULT_COLORS,
};
