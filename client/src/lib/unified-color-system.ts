/**
 * Unified Color System
 * 
 * This is the single source of truth for all color operations in the application.
 * It provides a consistent color hierarchy with proper fallbacks:
 * 
 * Priority Order:
 * 1. Project-specific admin panel colors (when projectId matches)
 * 2. Global admin panel colors (projectId = null)
 * 3. Theme colors (from user's selected theme)
 * 4. Default fallback colors
 */

import { getThemeTier1Color, getThemeTier2Color, COLOR_THEMES, ColorTheme } from './color-themes';
import { PROJECT_THEMES, getProjectTheme } from './project-themes';



// Default fallback colors (final safety net)
const DEFAULT_COLORS = {
  tier1: {
    structural: '#556b2f',
    systems: '#445566',
    sheathing: '#9b2c2c',
    finishings: '#8b4513',
    permitting: '#5C4033',
    default: '#6366f1'
  },
  tier2: {
    foundation: '#556b2f',
    framing: '#6b8e23',
    roofing: '#8b4513',
    electrical: '#445566',
    plumbing: '#4682b4',
    hvac: '#708090',
    flooring: '#8b4513',
    paint: '#9370db',
    fixtures: '#6a5acd',
    landscaping: '#228b22',
    default: '#64748b'
  },
  status: {
    completed: '#10b981',
    active: '#3b82f6',
    in_progress: '#f59e0b',
    on_hold: '#6b7280',
    not_started: '#64748b',
    delayed: '#ef4444',
    default: '#6b7280'
  }
} as const;

// Types for category data from admin panel
export interface CategoryData {
  id?: number;
  name: string;
  type: 'tier1' | 'tier2';
  color?: string | null;
  projectId?: number | null;
  parentId?: number | null;
}

// Simple project data interface for theme purposes
export interface ProjectThemeData {
  id: number;
  colorTheme?: string | null;
  useGlobalTheme?: boolean;
}

/**
 * Get project-specific theme colors
 */
function getProjectThemeColor(
  categoryName: string,
  categoryType: 'tier1' | 'tier2',
  projects: ProjectThemeData[],
  currentProjectId?: number | null
): string | null {
  // Debug ANY project 6 task
  if (currentProjectId === 6) {
    console.log('🔧 ANY Project 6 task:', {
      categoryName,
      currentProjectId,
      projectsLength: projects.length,
      projects: projects.map(p => ({ id: p.id, useGlobalTheme: p.useGlobalTheme, colorTheme: p.colorTheme }))
    });
  }
  
  if (!currentProjectId || !projects.length) {
    if (categoryName.toLowerCase() === 'design / ux' && currentProjectId === 6) {
      console.log('🔧 Early return for project 6');
    }
    return null;
  }

  const project = projects.find(p => p.id === currentProjectId);
  
  if (categoryName.toLowerCase() === 'design / ux' && currentProjectId === 6) {
    console.log('🔧 Found project 6:', project);
  }

  if (!project || project.useGlobalTheme !== false || !project.colorTheme) {
    if (categoryName.toLowerCase() === 'design / ux' && currentProjectId === 6) {
      console.log('🔧 Project 6 theme validation failed:', {
        hasProject: !!project,
        useGlobalTheme: project?.useGlobalTheme,
        colorTheme: project?.colorTheme
      });
    }
    return null;
  }

  const theme = getProjectTheme(project.colorTheme);
  if (!theme) {
    if (categoryName.toLowerCase() === 'design / ux' && currentProjectId === 6) {
      console.log('🔧 Theme not found for project 6:', project.colorTheme);
    }
    return null;
  }
  
  if (categoryName.toLowerCase() === 'design / ux' && currentProjectId === 6) {
    console.log('🔧 SUCCESS! Project 6 using theme:', project.colorTheme);
  }

  // Map category names to project theme colors
  if (categoryType === 'tier1') {
    const normalizedCategory = categoryName.toLowerCase().trim();
    const colorMap: Record<string, string> = {
      'software engineering': theme.primary,
      'product management': theme.secondary,
      'design / ux': theme.accent,
      'marketing / go to market (gtm)': theme.muted,
      'marketing / go-to-market (gtm)': theme.muted,
      'devops / infrastructure': theme.border
    };
    return colorMap[normalizedCategory] || theme.primary;
  } else {
    // For tier2, use subcategory colors if available
    if (theme.subcategories && theme.subcategories.length > 0) {
      const hash = categoryName.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);
      const index = Math.abs(hash) % theme.subcategories.length;
      return theme.subcategories[index];
    }
    return theme.secondary;
  }
}

/**
 * For All Projects view, get the best color from available admin categories
 */
function getBestAdminColor(
  categoryName: string,
  categoryType: 'tier1' | 'tier2',
  adminCategories: CategoryData[]
): string | null {
  const normalizedName = categoryName.toLowerCase().trim();
  
  // Get all matching categories across projects
  const matchingCategories = adminCategories.filter(cat =>
    cat.name && 
    typeof cat.name === 'string' &&
    cat.name.toLowerCase() === normalizedName &&
    cat.type === categoryType &&
    cat.color
  );
  
  if (matchingCategories.length === 0) return null;
  
  // Return the first available color (no preference for light vs dark)
  return matchingCategories[0].color!;
}

/**
 * Get tier1 category color with proper fallback hierarchy
 */
export function getTier1Color(
  categoryName: string,
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = []
): string {
  if (!categoryName) return DEFAULT_COLORS.tier1.default;

  const normalizedName = categoryName.toLowerCase().trim();
  

  // Priority 1: Project-specific admin colors (when we have a specific project)
  if (currentProjectId !== null && currentProjectId !== undefined) {
    const projectCategory = adminCategories.find(cat =>
      cat.name && 
      typeof cat.name === 'string' &&
      cat.name.toLowerCase() === normalizedName &&
      cat.type === 'tier1' &&
      cat.projectId === currentProjectId &&
      cat.color
    );
    
    if (projectCategory?.color) {
      return projectCategory.color;
    }
  }

  // Priority 2: Global admin colors (projectId = null)
  const globalCategory = adminCategories.find(cat =>
    cat.name && 
    typeof cat.name === 'string' &&
    cat.name.toLowerCase() === normalizedName &&
    cat.type === 'tier1' &&
    cat.projectId === null &&
    cat.color
  );
  if (globalCategory?.color) {
    return globalCategory.color;
  }

  // Priority 2.7: Project-specific theme colors (check this before admin fallbacks)
  const projectThemeColor = getProjectThemeColor(categoryName, 'tier1', projects, currentProjectId);
  if (projectThemeColor) {
    return projectThemeColor;
  }

  // Priority 2.5: For All Projects view, try to find a good color from any project (only if no project theme)
  if (currentProjectId === null) {
    const bestColor = getBestAdminColor(categoryName, 'tier1', adminCategories);
    if (bestColor) {
      return bestColor;
    }
  }

  // Priority 3: Global theme colors
  const themeColor = getThemeTier1Color(categoryName);
  if (themeColor && themeColor !== '#6b7280') {
    return themeColor;
  }

  // Priority 4: Default colors
  const defaultKey = normalizedName as keyof typeof DEFAULT_COLORS.tier1;
  return DEFAULT_COLORS.tier1[defaultKey] || DEFAULT_COLORS.tier1.default;
}

/**
 * Get tier2 category color with proper fallback hierarchy
 */
export function getTier2Color(
  categoryName: string,
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = []
): string {
  if (!categoryName) return DEFAULT_COLORS.tier2.default;

  const normalizedName = categoryName.toLowerCase().trim();

  // Priority 1: Project-specific admin colors (when we have a specific project)
  if (currentProjectId !== null && currentProjectId !== undefined) {
    const projectCategory = adminCategories.find(cat =>
      cat.name && 
      typeof cat.name === 'string' &&
      cat.name.toLowerCase() === normalizedName &&
      cat.type === 'tier2' &&
      cat.projectId === currentProjectId &&
      cat.color
    );
    if (projectCategory?.color) {
      return projectCategory.color;
    }
  }

  // Priority 2: Global admin colors (projectId = null)
  const globalCategory = adminCategories.find(cat =>
    cat.name && 
    typeof cat.name === 'string' &&
    cat.name.toLowerCase() === normalizedName &&
    cat.type === 'tier2' &&
    cat.projectId === null &&
    cat.color
  );
  if (globalCategory?.color) {
    return globalCategory.color;
  }

  // Priority 2.5: For All Projects view, try to find a good color from any project
  if (currentProjectId === null) {
    const bestColor = getBestAdminColor(categoryName, 'tier2', adminCategories);
    if (bestColor) return bestColor;
  }

  // Priority 2.7: Project-specific theme colors
  const projectThemeColor = getProjectThemeColor(categoryName, 'tier2', projects, currentProjectId);
  if (projectThemeColor) return projectThemeColor;

  // Priority 3: Global theme colors
  const themeColor = getThemeTier2Color(categoryName);
  if (themeColor && themeColor !== '#6b7280') return themeColor;

  // Priority 4: Default colors
  const defaultKey = normalizedName as keyof typeof DEFAULT_COLORS.tier2;
  return DEFAULT_COLORS.tier2[defaultKey] || DEFAULT_COLORS.tier2.default;
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
  if (normalizedStatus.includes('started')) return DEFAULT_COLORS.status.not_started;

  return DEFAULT_COLORS.status.default;
}

/**
 * Convert hex color to Tailwind CSS classes
 */
export function hexToTailwindBorder(hex: string): string {
  // For dynamic colors, use CSS custom properties
  return `border-[${hex}]`;
}

export function hexToTailwindBg(hex: string): string {
  // For dynamic colors, use CSS custom properties
  return `bg-[${hex}]`;
}

export function hexToTailwindText(hex: string): string {
  // For dynamic colors, use CSS custom properties
  return `text-[${hex}]`;
}

/**
 * Convert hex color to RGB with opacity
 */
export function hexToRgbWithOpacity(hex: string, opacity: number = 0.25): string {
  // Remove # if present
  const cleanHex = hex.replace('#', '');
  
  // Convert to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);
  
  return `rgb(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get category color with automatic type detection
 */
export function getCategoryColor(
  categoryName: string,
  categoryType: 'tier1' | 'tier2',
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = []
): string {
  return categoryType === 'tier1'
    ? getTier1Color(categoryName, adminCategories, currentProjectId, projects)
    : getTier2Color(categoryName, adminCategories, currentProjectId, projects);
}

/**
 * Helper for components that need both tier1 and tier2 colors
 */
export function getTaskColors(
  tier1Category?: string,
  tier2Category?: string,
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = []
) {
  
  const tier1Color = tier1Category ? getTier1Color(tier1Category, adminCategories, currentProjectId, projects) : null;
  const tier2Color = tier2Category ? getTier2Color(tier2Category, adminCategories, currentProjectId, projects) : null;

  // Prefer tier2 color if available, fallback to tier1
  const primaryColor = tier2Color || tier1Color || DEFAULT_COLORS.tier1.default;

  return {
    tier1Color,
    tier2Color,
    primaryColor,
    borderColor: hexToTailwindBorder(primaryColor),
    bgColor: hexToTailwindBg(primaryColor),
    textColor: hexToTailwindText(primaryColor)
  };
}

/**
 * Format category name for display
 */
export function formatCategoryName(categoryName?: string | null): string {
  if (!categoryName) return '';
  
  return categoryName
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Format task status for display
 */
export function formatTaskStatus(status?: string | null): string {
  if (!status) return 'Not Started';
  
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

export default {
  getTier1Color,
  getTier2Color,
  getStatusColor,
  getCategoryColor,
  getTaskColors,
  formatCategoryName,
  formatTaskStatus,
  hexToTailwindBorder,
  hexToTailwindBg,
  hexToTailwindText
};