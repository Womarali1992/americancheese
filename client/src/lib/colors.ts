/**
 * Simplified Color System
 * Single source of truth for all colors in the application
 */

export interface ColorTheme {
  structural: string;
  systems: string;
  sheathing: string;
  finishings: string;
  [key: string]: string;
}

// Default color theme
export const DEFAULT_THEME: ColorTheme = {
  structural: '#556b2f',
  systems: '#445566',
  sheathing: '#9b2c2c',
  finishings: '#8b4513'
};

// Status color mappings
const STATUS_COLORS = {
  completed: '#10b981', // green
  active: '#3b82f6',    // blue
  in_progress: '#f59e0b', // amber
  on_hold: '#6b7280',   // gray
  not_started: '#64748b', // slate
  delayed: '#ef4444'    // red
} as const;

// Module color mappings
const MODULE_COLORS = {
  project: '#556b2f',
  task: '#445566',
  material: '#8b4513',
  contact: '#9b2c2c',
  expense: '#8b4513',
  labor: '#445566',
  dashboard: '#556b2f',
  admin: '#9b2c2c'
} as const;

/**
 * Get status color
 */
export function getStatusColor(status?: string | null): string {
  if (!status) return STATUS_COLORS.not_started;
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
  
  // Direct mapping
  if (normalizedStatus in STATUS_COLORS) {
    return STATUS_COLORS[normalizedStatus as keyof typeof STATUS_COLORS];
  }
  
  // Pattern matching
  if (normalizedStatus.includes('complet')) return STATUS_COLORS.completed;
  if (normalizedStatus.includes('activ')) return STATUS_COLORS.active;
  if (normalizedStatus.includes('progress')) return STATUS_COLORS.in_progress;
  if (normalizedStatus.includes('hold')) return STATUS_COLORS.on_hold;
  if (normalizedStatus.includes('delay')) return STATUS_COLORS.delayed;
  
  return STATUS_COLORS.not_started;
}

/**
 * Get module color
 */
export function getModuleColor(module: string): string {
  const normalizedModule = module.toLowerCase();
  return MODULE_COLORS[normalizedModule as keyof typeof MODULE_COLORS] || MODULE_COLORS.project;
}

/**
 * Get category color (fetches from admin system or uses default)
 */
export async function getCategoryColor(categoryName: string, projectId?: number): Promise<string> {
  try {
    const url = projectId 
      ? `/api/projects/${projectId}/template-categories`
      : '/api/admin/template-categories';
    
    const response = await fetch(url);
    if (!response.ok) throw new Error('Failed to fetch');
    
    const categories = await response.json();
    const category = categories.find((cat: any) => 
      cat.name.toLowerCase() === categoryName.toLowerCase()
    );
    
    return category?.color || getDefaultCategoryColor(categoryName);
  } catch {
    return getDefaultCategoryColor(categoryName);
  }
}

/**
 * Get default category color based on name
 */
function getDefaultCategoryColor(categoryName: string): string {
  const name = categoryName.toLowerCase();
  
  // Tier1 defaults
  if (name === 'structural') return DEFAULT_THEME.structural;
  if (name === 'systems') return DEFAULT_THEME.systems;
  if (name === 'sheathing') return DEFAULT_THEME.sheathing;
  if (name === 'finishings') return DEFAULT_THEME.finishings;
  
  // Software development categories
  if (name === 'software engineering') return '#2563eb';
  if (name === 'product management') return '#7c3aed';
  if (name === 'design / ux') return '#ec4899';
  if (name === 'marketing / go-to-market (gtm)') return '#ea580c';
  
  // Tier2 defaults
  const tier2Colors: Record<string, string> = {
    foundation: '#10b981',
    framing: '#84cc16',
    roofing: '#dc2626',
    lumber: '#16a34a',
    electrical: '#f59e0b',
    plumbing: '#3b82f6',
    hvac: '#6b7280',
    drywall: '#64748b',
    windows: '#06b6d4',
    doors: '#0ea5e9',
    cabinets: '#d97706',
    flooring: '#f97316',
    paint: '#6366f1'
  };
  
  return tier2Colors[name] || '#6b7280';
}

/**
 * Lighten a color by a percentage
 */
export function lightenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * amount * 100);
  
  const R = Math.min(255, (num >> 16) + amt);
  const G = Math.min(255, ((num >> 8) & 0x00ff) + amt);
  const B = Math.min(255, (num & 0x0000ff) + amt);
  
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Darken a color by a percentage
 */
export function darkenColor(color: string, amount: number): string {
  const hex = color.replace('#', '');
  const num = parseInt(hex, 16);
  const amt = Math.round(2.55 * amount * 100);
  
  const R = Math.max(0, (num >> 16) - amt);
  const G = Math.max(0, ((num >> 8) & 0x00ff) - amt);
  const B = Math.max(0, (num & 0x0000ff) - amt);
  
  return `#${((1 << 24) + (R << 16) + (G << 8) + B).toString(16).slice(1)}`;
}

/**
 * Get status styles for badges/pills
 */
export function getStatusStyles(status?: string | null) {
  const color = getStatusColor(status);
  const lightColor = lightenColor(color, 0.85);
  
  return {
    backgroundColor: lightColor,
    color: darkenColor(color, 0.2),
    borderColor: lightenColor(color, 0.3)
  };
}

/**
 * Format status text for display
 */
export function formatStatus(status?: string | null): string {
  if (!status) return 'Unknown';
  return status
    .replace(/[_-]/g, ' ')
    .toLowerCase()
    .replace(/\b\w/g, l => l.toUpperCase());
}