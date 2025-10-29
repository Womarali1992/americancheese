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

import { getThemeTier1Color, getThemeTier2Color, ColorTheme } from './color-themes';
import { THEMES as COLOR_THEMES } from './theme-system';
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
 * Get project-specific theme colors using index-based assignment
 * This provides stable, predictable colors based on category position
 */
function getProjectThemeColor(
  categoryName: string,
  categoryType: 'tier1' | 'tier2',
  projects: ProjectThemeData[],
  currentProjectId?: number | null,
  parentCategoryName?: string | null,
  adminCategories: CategoryData[] = []
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

  // Use project theme if colorTheme is set (regardless of useGlobalTheme flag)
  if (!project || !project.colorTheme) {
    console.log(`🎨 No theme for project ${currentProjectId}, category "${categoryName}":`, {
      hasProject: !!project,
      useGlobalTheme: project?.useGlobalTheme,
      colorTheme: project?.colorTheme
    });
    return null;
  }

  const theme = getProjectTheme(project.colorTheme);
  if (!theme) {
    return null;
  }

  // INDEX-BASED COLOR ASSIGNMENT - Stable and predictable
  if (categoryType === 'tier1') {
    // Get all tier1 categories for this project, sorted by sortOrder
    const projectTier1Categories = adminCategories
      .filter(cat => cat.projectId === currentProjectId && cat.type === 'tier1')
      .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

    // Find the index of this category
    const categoryIndex = projectTier1Categories.findIndex(
      cat => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    // Map index to theme color - stable and predictable
    // 1st category (index 0) → primary
    // 2nd category (index 1) → secondary
    // 3rd category (index 2) → accent
    // 4th category (index 3) → muted
    // 5th+ category → border or cycle back
    const themeColors = [theme.primary, theme.secondary, theme.accent, theme.muted, theme.border];
    const resolvedColor = categoryIndex >= 0 && categoryIndex < themeColors.length
      ? themeColors[categoryIndex]
      : theme.primary; // fallback

    console.log(`🎨 Tier1 "${categoryName}" (project ${currentProjectId}, index ${categoryIndex}) → "${project.colorTheme}":`, {
      categoryIndex,
      color: resolvedColor,
      totalCategories: projectTier1Categories.length,
      theme: project.colorTheme
    });
    return resolvedColor;
  } else {
    // INDEX-BASED TIER2 COLOR ASSIGNMENT
    // Find parent tier1 category to determine which color group to use
    if (theme.subcategories && theme.subcategories.length >= 20) {
      let tier1Index = 0; // default to first tier1

      if (parentCategoryName) {
        // Find the parent tier1's index
        const projectTier1Categories = adminCategories
          .filter(cat => cat.projectId === currentProjectId && cat.type === 'tier1')
          .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

        const parentIndex = projectTier1Categories.findIndex(
          cat => cat.name.toLowerCase().trim() === parentCategoryName.toLowerCase().trim()
        );

        if (parentIndex >= 0) {
          tier1Index = parentIndex;
        }
      }

      // Limit to valid range (0-3 for 4 tier1 categories with subcategories)
      tier1Index = Math.min(tier1Index, 3);

      // Each tier1 has 5 subcategory colors (indices 0-4, 5-9, 10-14, 15-19)
      const groupStartIndex = tier1Index * 5;

      // Get all tier2 categories under this parent, sorted by their order
      const parentTier1 = adminCategories.find(
        cat => cat.projectId === currentProjectId &&
               cat.type === 'tier1' &&
               parentCategoryName &&
               cat.name.toLowerCase().trim() === parentCategoryName.toLowerCase().trim()
      );

      const tier2Categories = adminCategories
        .filter(cat => cat.projectId === currentProjectId && cat.type === 'tier2' && cat.parentId === parentTier1?.id)
        .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

      const tier2Index = tier2Categories.findIndex(
        cat => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
      );

      // Pick subcategory color based on tier2 index within its parent group
      const colorIndex = tier2Index >= 0 && tier2Index < 5
        ? groupStartIndex + tier2Index
        : groupStartIndex; // fallback to first color in group

      const finalIndex = colorIndex;

      return theme.subcategories[finalIndex];
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
 * Get tier1 category color - SIMPLIFIED
 * RULE: Project theme ALWAYS wins. No exceptions.
 * 1. If project has a theme → use that theme's colors (ALWAYS)
 * 2. Otherwise → use global theme colors
 */
export function getTier1Color(
  categoryName: string,
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = []
): string {
  if (!categoryName) return DEFAULT_COLORS.tier1.default;

  // RULE 1: If project has a theme, ALWAYS use it (ignore admin categories)
  if (currentProjectId && projects.length > 0) {
    const project = projects.find(p => p.id === currentProjectId);
    if (project?.colorTheme) {
      // Find the theme - normalize the name
      const themeName = project.colorTheme.toLowerCase().replace(/\s+/g, '-');
      let theme = COLOR_THEMES[themeName];

      // If not found with normalized key, try exact match
      if (!theme) {
        theme = COLOR_THEMES[project.colorTheme];
      }

      // If still not found, try to find by name
      if (!theme) {
        const themeEntry = Object.entries(COLOR_THEMES).find(([key, t]) =>
          t.name.toLowerCase() === project.colorTheme.toLowerCase()
        );
        if (themeEntry) {
          theme = themeEntry[1];
        }
      }

      if (theme) {
        // First try name-based matching
        const color = getThemeTier1Color(categoryName, theme);

        // If we got the default color, it means no name match was found
        // Use index-based assignment for custom categories
        if (color === theme.tier1.default) {
          // IMPORTANT: Filter categories to ONLY this project's categories
          const projectTier1Categories = adminCategories
            .filter(cat => cat.projectId === currentProjectId && cat.type === 'tier1')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

          // Find the index of this category
          const categoryIndex = projectTier1Categories.findIndex(
            cat => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
          );

          // Map index to theme color - stable and predictable
          const themeColors = [theme.tier1.subcategory1, theme.tier1.subcategory2, theme.tier1.subcategory3, theme.tier1.subcategory4, theme.tier1.subcategory5];

          if (categoryIndex >= 0 && categoryIndex < themeColors.length) {
            const indexColor = themeColors[categoryIndex];
            return indexColor;
          }
        }

        return color;
      }
    }
  }

  // RULE 2: Otherwise use global theme colors (but DON'T pass a theme, let it use getActiveColorTheme)
  const themeColor = getThemeTier1Color(categoryName);
  return themeColor;
}

/**
 * Helper to generate variations of a base color for tier2 categories
 */
function generateColorVariations(baseColor: string, count: number = 5): string[] {
  // Parse hex color
  const hex = baseColor.replace('#', '');
  const r = parseInt(hex.substr(0, 2), 16);
  const g = parseInt(hex.substr(2, 2), 16);
  const b = parseInt(hex.substr(4, 2), 16);

  const variations: string[] = [];

  for (let i = 0; i < count; i++) {
    // Create variations by adjusting brightness
    const factor = 0.7 + (i * 0.15); // Range from 0.7 to 1.3
    const newR = Math.min(255, Math.max(0, Math.round(r * factor)));
    const newG = Math.min(255, Math.max(0, Math.round(g * factor)));
    const newB = Math.min(255, Math.max(0, Math.round(b * factor)));

    const newHex = '#' +
      newR.toString(16).padStart(2, '0') +
      newG.toString(16).padStart(2, '0') +
      newB.toString(16).padStart(2, '0');

    variations.push(newHex);
  }

  return variations;
}

/**
 * Get tier2 category color - SIMPLIFIED
 * RULE: Project theme ALWAYS wins. No exceptions.
 * 1. If project has a theme → use that theme's colors (ALWAYS)
 * 2. Otherwise → use global theme colors
 */
export function getTier2Color(
  categoryName: string,
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = [],
  parentCategoryName?: string | null
): string {
  if (!categoryName) return DEFAULT_COLORS.tier2.default;

  // AUTO-LOOKUP parent if not provided
  if (!parentCategoryName && adminCategories.length > 0 && currentProjectId) {
    // Find the tier2 category in adminCategories
    const tier2Cat = adminCategories.find(
      cat => cat.projectId === currentProjectId &&
             cat.type === 'tier2' &&
             cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
    );

    // If found, look up its parent tier1 category
    if (tier2Cat && tier2Cat.parentId) {
      const parentCat = adminCategories.find(
        cat => cat.id === tier2Cat.parentId && cat.type === 'tier1'
      );
      if (parentCat) {
        parentCategoryName = parentCat.name;
      }
    }
  }

  // RULE 1: If project has a theme, ALWAYS use it (ignore admin categories)
  if (currentProjectId && projects.length > 0) {
    const project = projects.find(p => p.id === currentProjectId);
    if (project?.colorTheme) {
      // Find the theme - normalize the name
      const themeName = project.colorTheme.toLowerCase().replace(/\s+/g, '-');
      let theme = COLOR_THEMES[themeName];

      // If not found with normalized key, try exact match
      if (!theme) {
        theme = COLOR_THEMES[project.colorTheme];
      }

      // If still not found, try to find by name
      if (!theme) {
        const themeEntry = Object.entries(COLOR_THEMES).find(([key, t]) =>
          t.name.toLowerCase() === project.colorTheme.toLowerCase()
        );
        if (themeEntry) {
          theme = themeEntry[1];
        }
      }

      if (theme) {
        // INDEX-BASED TIER2 COLOR ASSIGNMENT
        // Find parent tier1 category to determine which color group to use
        if (parentCategoryName) {
          // IMPORTANT: Filter categories to ONLY this project's categories
          const projectTier1Categories = adminCategories
            .filter(cat => cat.projectId === currentProjectId && cat.type === 'tier1')
            .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

          // Find the parent tier1's index
          const parentIndex = projectTier1Categories.findIndex(
            cat => cat.name.toLowerCase().trim() === parentCategoryName.toLowerCase().trim()
          );

          if (parentIndex >= 0) {
            // Each tier1 category has 5 tier2 colors assigned:
            // Tier1 index 0 → tier2_1 to tier2_5 (5 colors)
            // Tier1 index 1 → tier2_6 to tier2_10 (5 colors)
            // Tier1 index 2 → tier2_11 to tier2_15 (5 colors)
            // Tier1 index 3 → tier2_16 to tier2_20 (5 colors)
            const groupSize = 5; // Each tier1 has 5 tier2 colors

            // Calculate starting index based on parent tier1 index
            const groupStartIndex = 1 + (parentIndex * groupSize); // tier2_1, tier2_6, tier2_11, tier2_16

            // Find the parent tier1 category object (ONLY from this project)
            const parentTier1 = adminCategories.find(
              cat => cat.projectId === currentProjectId &&
                     cat.type === 'tier1' &&
                     cat.name.toLowerCase().trim() === parentCategoryName.toLowerCase().trim()
            );

            // IMPORTANT: Get tier2 categories ONLY for this parent and this project
            const tier2Categories = adminCategories
              .filter(cat => cat.projectId === currentProjectId &&
                           cat.type === 'tier2' &&
                           cat.parentId === parentTier1?.id)
              .sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0));

            // Find this tier2 category's index within its parent
            const tier2Index = tier2Categories.findIndex(
              cat => cat.name.toLowerCase().trim() === categoryName.toLowerCase().trim()
            );

            if (tier2Index >= 0) {
              // Use modulo to cycle through colors if there are more categories than colors
              const colorOffset = tier2Index % groupSize;
              const colorIndex = groupStartIndex + colorOffset;
              const tierKey = `tier2_${colorIndex}` as keyof typeof theme.tier2;

              if (tierKey in theme.tier2) {
                const color = theme.tier2[tierKey];
                return color;
              }
            }
          }
        }

        // Fallback to name-based matching if index lookup fails
        const color = getThemeTier2Color(categoryName, theme, parentCategoryName || undefined);

        // If fallback returns a dark color (like #1a1a1a), use a safer default
        if (color === '#1a1a1a' || !color) {
          return theme.tier2.tier2_1 || DEFAULT_COLORS.tier2.default;
        }

        return color;
      }
    }
  }

  // RULE 2: Otherwise use global theme colors (but DON'T pass a theme, let it use getActiveColorTheme)
  const themeColor = getThemeTier2Color(categoryName, undefined, parentCategoryName || undefined);
  return themeColor;
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
  // Handle undefined or null
  if (!hex) {
    return `rgba(100, 116, 139, ${opacity})`; // Default gray
  }

  // Remove # if present
  const cleanHex = hex.replace('#', '');

  // Convert to RGB
  const r = parseInt(cleanHex.substr(0, 2), 16);
  const g = parseInt(cleanHex.substr(2, 2), 16);
  const b = parseInt(cleanHex.substr(4, 2), 16);

  return `rgba(${r}, ${g}, ${b}, ${opacity})`;
}

/**
 * Get category color with automatic type detection
 */
export function getCategoryColor(
  categoryName: string,
  categoryType: 'tier1' | 'tier2',
  adminCategories: CategoryData[] = [],
  currentProjectId?: number | null,
  projects: ProjectThemeData[] = [],
  parentCategoryName?: string | null
): string {
  return categoryType === 'tier1'
    ? getTier1Color(categoryName, adminCategories, currentProjectId, projects)
    : getTier2Color(categoryName, adminCategories, currentProjectId, projects, parentCategoryName);
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
  const tier2Color = tier2Category ? getTier2Color(tier2Category, adminCategories, currentProjectId, projects, tier1Category) : null;

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