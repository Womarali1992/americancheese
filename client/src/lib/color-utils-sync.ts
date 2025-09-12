/**
 * Synchronous Color Utilities for React Components
 * Provides immediate color values without async calls
 */

import { getProjectTheme } from '@/lib/project-themes';

// Default status colors
const STATUS_COLORS = {
  completed: '#10b981',
  active: '#3b82f6', 
  in_progress: '#f59e0b',
  on_hold: '#6b7280',
  not_started: '#64748b',
  delayed: '#ef4444'
} as const;

// Default category colors  
const CATEGORY_COLORS = {
  structural: '#556b2f',
  systems: '#445566', 
  sheathing: '#9b2c2c',
  finishings: '#8b4513',
  'software engineering': '#2563eb',
  'product management': '#7c3aed',
  'design / ux': '#ec4899',
  'marketing / go-to-market (gtm)': '#ea580c'
} as const;

/**
 * Get status border color synchronously
 */
export function getStatusBorderColor(status?: string | null): string {
  if (!status) return 'border-gray-300';
  
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
  
  if (normalizedStatus.includes('complet')) return 'border-green-500';
  if (normalizedStatus.includes('activ')) return 'border-blue-500';
  if (normalizedStatus.includes('progress')) return 'border-amber-500';
  if (normalizedStatus.includes('hold')) return 'border-gray-500';
  if (normalizedStatus.includes('delay')) return 'border-red-500';
  
  return 'border-slate-500';
}

/**
 * Get status background color synchronously
 */
export function getStatusBgColor(status?: string | null): string {
  if (!status) return 'bg-gray-100';
  
  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');
  
  if (normalizedStatus.includes('complet')) return 'bg-green-100';
  if (normalizedStatus.includes('activ')) return 'bg-blue-100';
  if (normalizedStatus.includes('progress')) return 'bg-amber-100';
  if (normalizedStatus.includes('hold')) return 'bg-gray-100';
  if (normalizedStatus.includes('delay')) return 'bg-red-100';
  
  return 'bg-slate-100';
}

/**
 * Get progress color synchronously
 */
export function getProgressColor(progress: number): string {
  if (progress >= 100) return STATUS_COLORS.completed;
  if (progress >= 75) return '#3b82f6'; // blue
  if (progress >= 50) return STATUS_COLORS.in_progress;
  if (progress >= 25) return '#f97316'; // orange
  return STATUS_COLORS.not_started;
}

/**
 * Get tier1 category color synchronously - supports project-specific themes
 */
export function getTier1CategoryColor(category?: string | null, format: string = 'hex', projectId?: number | null): string {
  if (!category) return CATEGORY_COLORS.structural;
  
  const normalizedCategory = category.toLowerCase();
  
  // Special handling for HTXapt.com (project ID 8) with Futuristic theme
  if (projectId === 8) {
    console.log(`🔥 HTXapt.com project detected - category: ${normalizedCategory}`);
    
    // Map HTXapt.com categories to Futuristic theme colors
    const futuristicThemeMap: Record<string, string> = {
      'software engineering': '#00ffff',      // electric cyan - Futuristic primary
      'product management': '#ff6b9d',       // neon pink - Futuristic secondary  
      'design / ux': '#00ff41',              // electric green - Futuristic accent
      'marketing / go-to-market (gtm)': '#9370db', // purple - Futuristic muted
      'marketing / go to market (gtm)': '#9370db', // purple - Futuristic muted
      'devops / infrastructure': '#1e90ff'   // electric blue - Futuristic border
    };
    
    if (futuristicThemeMap[normalizedCategory]) {
      console.log(`🚀 Using Futuristic theme color for ${normalizedCategory}:`, futuristicThemeMap[normalizedCategory]);
      return futuristicThemeMap[normalizedCategory];
    }
  }
  
  // If we have a project ID, try to get project-specific theme colors
  if (projectId && typeof window !== 'undefined') {
    try {
      // Get all projects from cache/storage to find the project's theme
      const projectsData = (window as any).__projectsCache;
      if (projectsData) {
        const project = projectsData.find((p: any) => p.id === projectId);
        if (project && project.colorTheme && !project.useGlobalTheme) {
          console.log(`🎨 Found project ${projectId} with theme: ${project.colorTheme}`);
          
          // Get the project theme using the imported function
          const theme = getProjectTheme(project.colorTheme, projectId);
          
          if (theme) {
            // Map categories to theme colors
            const categoryMap: Record<string, string> = {
              'software engineering': theme.primary,
              'product management': theme.secondary,
              'design / ux': theme.accent,
              'marketing / go-to-market (gtm)': theme.muted,
              'marketing / go to market (gtm)': theme.muted,
              'devops / infrastructure': theme.border
            };
            
            if (categoryMap[normalizedCategory]) {
              console.log(`🎨 Using project theme color for ${normalizedCategory}:`, categoryMap[normalizedCategory]);
              return categoryMap[normalizedCategory];
            }
          }
        }
      }
    } catch (error) {
      console.warn('Error getting project theme color:', error);
    }
  }
  
  // Fallback to hardcoded colors
  console.log(`🔧 Using fallback color for ${normalizedCategory}:`, CATEGORY_COLORS[normalizedCategory as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.structural);
  return CATEGORY_COLORS[normalizedCategory as keyof typeof CATEGORY_COLORS] || CATEGORY_COLORS.structural;
}

/**
 * Format task status for display
 */
export function formatTaskStatus(status?: string | null): string {
  if (!status) return 'Not Started';
  
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format category name for display
 */
export function formatCategoryName(category?: string | null): string {
  if (!category) return '';
  
  return category
    .split(/[_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Get category color synchronously (alias for getTier1CategoryColor for compatibility)
 */
export function getCategoryColor(category?: string | null): string {
  return getTier1CategoryColor(category);
}

/**
 * Get tier2 category color synchronously
 */
export function getTier2CategoryColor(category?: string | null): string {
  if (!category) return CATEGORY_COLORS.structural;

  const normalizedCategory = category.toLowerCase();

  // Software development tier2 colors
  if (normalizedCategory.includes('devops')) return '#60a5fa'; // light blue
  if (normalizedCategory.includes('architecture')) return '#60a5fa';
  if (normalizedCategory.includes('application')) return '#60a5fa';
  if (normalizedCategory.includes('quality')) return '#60a5fa';
  if (normalizedCategory.includes('strategy')) return '#a78bfa'; // light purple
  if (normalizedCategory.includes('discovery')) return '#a78bfa';
  if (normalizedCategory.includes('roadmap')) return '#a78bfa';
  if (normalizedCategory.includes('delivery')) return '#a78bfa';
  if (normalizedCategory.includes('research') && normalizedCategory.includes('usability')) return '#f472b6'; // light pink
  if (normalizedCategory.includes('ui/ux')) return '#f472b6';
  if (normalizedCategory.includes('visual')) return '#f472b6';
  if (normalizedCategory.includes('interaction')) return '#f472b6';
  if (normalizedCategory.includes('positioning')) return '#fb923c'; // light orange
  if (normalizedCategory.includes('demand')) return '#fb923c';
  if (normalizedCategory.includes('pricing')) return '#fb923c';
  if (normalizedCategory.includes('launch')) return '#fb923c';

  // Default tier2 colors
  const tier2Colors: Record<string, string> = {
    foundation: '#10b981',
    framing: '#84cc16',
    roofing: '#dc2626',
    lumber: '#16a34a',
    electrical: '#f59e0b',
    plumbing: '#3b82f6',
    hvac: '#6b7280',
    drywall: '#64748b'
  };

  return tier2Colors[normalizedCategory] || '#6b7280';
}

/**
 * Get theme-aware tier1 category color that respects CSS variables
 */
export function getThemeTier1CategoryColor(category?: string | null): string {
  if (typeof document === 'undefined') {
    return getTier1CategoryColor(category);
  }

  if (!category) return CATEGORY_COLORS.structural;

  const normalizedCategory = category.toLowerCase();

  // Map category names to CSS variable names
  const categoryToCssVar: Record<string, string> = {
    'structural': '--tier1-structural',
    'systems': '--tier1-systems',
    'sheathing': '--tier1-sheathing',
    'finishings': '--tier1-finishings',
    'subcategory1': '--tier1-subcategory1',
    'subcategory2': '--tier1-subcategory2',
    'subcategory3': '--tier1-subcategory3',
    'subcategory4': '--tier1-subcategory4',
    'subcategory5': '--tier1-subcategory5'
  };

  // Try to get the color from CSS variables first
  const cssVarName = categoryToCssVar[normalizedCategory];
  if (cssVarName) {
    const docStyle = getComputedStyle(document.documentElement);
    const cssColor = docStyle.getPropertyValue(cssVarName).trim();
    if (cssColor && cssColor !== '') {
      return cssColor;
    }
  }

  // Fallback to hardcoded colors if CSS variable not found
  return getTier1CategoryColor(category);
}

/**
 * Get theme-aware tier2 category color that respects CSS variables
 */
export function getThemeTier2CategoryColor(category?: string | null): string {
  if (typeof document === 'undefined') {
    return getTier2CategoryColor(category);
  }

  if (!category) return CATEGORY_COLORS.structural;

  const normalizedCategory = category.toLowerCase();

  // Map tier2 category names to their expected colors from active theme
  // For tier2 categories, we need to map them to the appropriate parent tier1 color
  // and then shade them appropriately
  const tier2ToTier1Mapping: Record<string, string> = {
    'foundation': 'structural',
    'framing': 'structural',
    'roofing': 'structural',
    'lumber': 'structural',
    'shingles': 'structural',
    'electrical': 'systems',
    'plumbing': 'systems',
    'hvac': 'systems',
    'barriers': 'sheathing',
    'drywall': 'sheathing',
    'exteriors': 'sheathing',
    'siding': 'sheathing',
    'insulation': 'sheathing',
    'windows': 'finishings',
    'doors': 'finishings',
    'cabinets': 'finishings',
    'fixtures': 'finishings',
    'flooring': 'finishings',
    'paint': 'finishings',
    'permits': 'other',
    'other': 'other'
  };

  const parentCategory = tier2ToTier1Mapping[normalizedCategory];
  if (parentCategory) {
    const parentColor = getThemeTier1CategoryColor(parentCategory);

    // Apply shading based on tier2 position
    const shadeIndex = Object.keys(tier2ToTier1Mapping).indexOf(normalizedCategory) % 4;
    return shadeColor(parentColor, shadeIndex);
  }

  // Fallback to hardcoded colors
  return getTier2CategoryColor(category);
}

/**
 * Shade a color by index (0-3, where 0 is lightest, 3 is darkest)
 */
function shadeColor(hex: string, shadeIndex: number): string {
  // Convert hex to RGB
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return hex;

  let r = parseInt(result[1], 16);
  let g = parseInt(result[2], 16);
  let b = parseInt(result[3], 16);

  // Apply shading
  const shadeFactors = [0.8, 0.6, 0.4, 0.2]; // lighter to darker
  const factor = shadeFactors[shadeIndex] || 0.6;

  r = Math.max(0, Math.min(255, Math.floor(r * factor)));
  g = Math.max(0, Math.min(255, Math.floor(g * factor)));
  b = Math.max(0, Math.min(255, Math.floor(b * factor)));

  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}