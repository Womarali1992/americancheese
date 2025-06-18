/**
 * Admin Panel Color System - Single Source of Truth for All Colors
 * 
 * This system ensures all colors throughout the application are managed
 * exclusively through the admin panel, eliminating hardcoded colors.
 */

import { queryClient } from './queryClient';

// Types for the color system
export interface CategoryColor {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  color: string;
  parentId?: number;
  projectId?: number;
}

export interface ColorTheme {
  structural: string;
  systems: string;
  sheathing: string;
  finishings: string;
  [key: string]: string;
}

// Cache for category colors to avoid frequent API calls
let colorCache: CategoryColor[] = [];
let cacheTimestamp = 0;

/**
 * Clear the color cache to force fresh data from the database
 */
export function clearColorCache(): void {
  colorCache = [];
  cacheTimestamp = 0;
  console.log('Admin color cache cleared - will fetch fresh data on next request');
}
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

/**
 * Fetch category colors from the admin panel API
 */
async function fetchCategoryColors(projectId?: number): Promise<CategoryColor[]> {
  const now = Date.now();
  
  // Return cached data if still valid
  if (colorCache.length > 0 && (now - cacheTimestamp) < CACHE_DURATION) {
    return colorCache;
  }
  
  try {
    const url = projectId 
      ? `/api/projects/${projectId}/template-categories`
      : '/api/admin/template-categories';
    
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Failed to fetch category colors: ${response.statusText}`);
    }
    
    const categories = await response.json();
    
    // Transform the response to our expected format
    colorCache = categories.map((cat: any) => ({
      id: cat.id,
      name: cat.name,
      type: cat.type,
      color: cat.color || getDefaultColorForCategory(cat.name, cat.type),
      parentId: cat.parentId,
      projectId: cat.projectId
    }));
    
    cacheTimestamp = now;
    return colorCache;
  } catch (error) {
    console.error('Failed to fetch category colors:', error);
    return getDefaultColorScheme();
  }
}

/**
 * Get default color for a category if none is set
 */
function getDefaultColorForCategory(name: string, type: 'tier1' | 'tier2'): string {
  const normalizedName = name.toLowerCase();
  
  if (type === 'tier1') {
    switch (normalizedName) {
      case 'structural': return '#556b2f';
      case 'systems': return '#445566';
      case 'sheathing': return '#9b2c2c';
      case 'finishings': return '#8b4513';
      default: return '#6b7280';
    }
  }
  
  // Tier2 defaults
  const tier2Defaults: Record<string, string> = {
    foundation: '#10b981',
    framing: '#84cc16',
    roofing: '#dc2626',
    lumber: '#16a34a',
    shingles: '#22c55e',
    electrical: '#f59e0b',
    plumbing: '#3b82f6',
    hvac: '#6b7280',
    barriers: '#dc2626',
    drywall: '#64748b',
    exteriors: '#ef4444',
    siding: '#a855f7',
    insulation: '#22c55e',
    windows: '#06b6d4',
    doors: '#0ea5e9',
    cabinets: '#d97706',
    fixtures: '#ea580c',
    flooring: '#f97316',
    paint: '#6366f1',
    permits: '#6b7280',
    other: '#64748b'
  };
  
  return tier2Defaults[normalizedName] || '#6b7280';
}

/**
 * Get default color scheme fallback
 */
function getDefaultColorScheme(): CategoryColor[] {
  return [
    { id: 1, name: 'structural', type: 'tier1', color: '#556b2f' },
    { id: 2, name: 'systems', type: 'tier1', color: '#445566' },
    { id: 3, name: 'sheathing', type: 'tier1', color: '#9b2c2c' },
    { id: 4, name: 'finishings', type: 'tier1', color: '#8b4513' },
  ];
}

/**
 * Get color for a specific category
 */
export async function getCategoryColor(categoryName: string, projectId?: number): Promise<string> {
  const categories = await fetchCategoryColors(projectId);
  const normalizedName = categoryName.toLowerCase();
  
  const category = categories.find(cat => 
    cat.name.toLowerCase() === normalizedName
  );
  
  return category?.color || getDefaultColorForCategory(categoryName, 'tier2');
}

/**
 * Get tier1 category color
 */
export async function getTier1Color(categoryName: string, projectId?: number): Promise<string> {
  const categories = await fetchCategoryColors(projectId);
  const normalizedName = categoryName.toLowerCase();
  
  const category = categories.find(cat => 
    cat.type === 'tier1' && cat.name.toLowerCase() === normalizedName
  );
  
  return category?.color || getDefaultColorForCategory(categoryName, 'tier1');
}

/**
 * Get tier2 category color
 */
export async function getTier2Color(categoryName: string, projectId?: number): Promise<string> {
  const categories = await fetchCategoryColors(projectId);
  const normalizedName = categoryName.toLowerCase();
  
  const category = categories.find(cat => 
    cat.type === 'tier2' && cat.name.toLowerCase() === normalizedName
  );
  
  return category?.color || getDefaultColorForCategory(categoryName, 'tier2');
}

/**
 * Get all tier1 colors as a theme object
 */
export async function getTier1ColorTheme(projectId?: number): Promise<ColorTheme> {
  const categories = await fetchCategoryColors(projectId);
  
  const tier1Categories = categories.filter(cat => cat.type === 'tier1');
  const theme: ColorTheme = {
    structural: '#556b2f',
    systems: '#445566',
    sheathing: '#9b2c2c',
    finishings: '#8b4513'
  };
  
  tier1Categories.forEach(cat => {
    theme[cat.name.toLowerCase()] = cat.color;
  });
  
  return theme;
}

/**
 * Apply admin panel colors to CSS custom properties
 */
export async function applyAdminColorsToCSS(projectId?: number): Promise<void> {
  const categories = await fetchCategoryColors(projectId);
  
  // Apply tier1 colors
  categories
    .filter(cat => cat.type === 'tier1')
    .forEach(cat => {
      const name = cat.name.toLowerCase();
      document.documentElement.style.setProperty(`--tier1-${name}`, cat.color);
      document.documentElement.style.setProperty(`--tier1-${name}-rgb`, hexToRgb(cat.color));
    });
  
  // Apply tier2 colors
  categories
    .filter(cat => cat.type === 'tier2')
    .forEach(cat => {
      const name = cat.name.toLowerCase();
      document.documentElement.style.setProperty(`--tier2-${name}`, cat.color);
      document.documentElement.style.setProperty(`--tier2-${name}-rgb`, hexToRgb(cat.color));
    });
  
  // Apply general UI colors based on tier1 colors
  const tier1Colors = categories.filter(cat => cat.type === 'tier1');
  if (tier1Colors.length > 0) {
    const structural = tier1Colors.find(c => c.name.toLowerCase() === 'structural')?.color || '#556b2f';
    const systems = tier1Colors.find(c => c.name.toLowerCase() === 'systems')?.color || '#445566';
    const sheathing = tier1Colors.find(c => c.name.toLowerCase() === 'sheathing')?.color || '#9b2c2c';
    const finishings = tier1Colors.find(c => c.name.toLowerCase() === 'finishings')?.color || '#8b4513';
    
    document.documentElement.style.setProperty('--color-primary', structural);
    document.documentElement.style.setProperty('--color-secondary', systems);
    document.documentElement.style.setProperty('--color-accent', finishings);
    document.documentElement.style.setProperty('--color-warning', sheathing);
  }
  
  console.log('Applied admin panel colors to CSS variables');
}

/**
 * Convert hex color to RGB string for CSS custom properties
 */
function hexToRgb(hex: string): string {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return '0, 0, 0';
  
  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  
  return `${r}, ${g}, ${b}`;
}

/**
 * Get status colors that adapt to the admin theme
 */
export async function getStatusColors(projectId?: number) {
  const theme = await getTier1ColorTheme(projectId);
  
  return {
    completed: theme.structural,
    in_progress: theme.systems,
    not_started: lightenColor(theme.finishings, 0.3),
    delayed: theme.sheathing,
    on_hold: lightenColor(theme.systems, 0.5),
    active: theme.structural,
    pending: theme.finishings
  };
}

/**
 * Get module colors that adapt to the admin theme
 */
export async function getModuleColors(projectId?: number) {
  const theme = await getTier1ColorTheme(projectId);
  
  return {
    project: theme.structural,
    task: theme.systems,
    material: theme.finishings,
    contact: theme.sheathing,
    expense: theme.finishings,
    labor: theme.systems,
    dashboard: theme.structural,
    admin: theme.sheathing
  };
}

/**
 * Lighten a color by a percentage
 */
function lightenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) + amt;
  const G = (num >> 8 & 0x00FF) + amt;
  const B = (num & 0x0000FF) + amt;
  
  return '#' + (0x1000000 + (R < 255 ? R < 1 ? 0 : R : 255) * 0x10000 +
    (G < 255 ? G < 1 ? 0 : G : 255) * 0x100 +
    (B < 255 ? B < 1 ? 0 : B : 255))
    .toString(16).slice(1);
}

/**
 * Darken a color by a percentage
 */
function darkenColor(color: string, percent: number): string {
  const num = parseInt(color.replace('#', ''), 16);
  const amt = Math.round(2.55 * percent * 100);
  const R = (num >> 16) - amt;
  const G = (num >> 8 & 0x00FF) - amt;
  const B = (num & 0x0000FF) - amt;
  
  return '#' + (0x1000000 + (R > 255 ? 255 : R < 0 ? 0 : R) * 0x10000 +
    (G > 255 ? 255 : G < 0 ? 0 : G) * 0x100 +
    (B > 255 ? 255 : B < 0 ? 0 : B))
    .toString(16).slice(1);
}



/**
 * Initialize the admin color system
 */
export async function initializeAdminColorSystem(projectId?: number): Promise<void> {
  await applyAdminColorsToCSS(projectId);
  
  // Listen for admin panel updates
  window.addEventListener('adminColorsUpdated', () => {
    clearColorCache();
    applyAdminColorsToCSS(projectId);
  });
}