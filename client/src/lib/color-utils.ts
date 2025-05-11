// Consolidated color utility functions for the application
// This file combines functionality from previous utils.ts and task-utils.ts files
import { getActiveColorTheme, getThemeTier1Color, getThemeTier2Color } from './color-themes';

// Color constants for consistent application theming
const COLORS = {
  BROWN: '#7E6551',
  TAUPE: '#533747',
  SLATE: '#8896AB',
  TEAL: '#466362',
  BLUE: '#C5D5E4',
  BLUE_TEXT: '#8896AB',
  ORANGE: '#f97316',
  PURPLE: '#503e49',
};

/**
 * Returns the border color class for a given status
 * @param status The status string
 * @returns A Tailwind border color class
 */
export function getStatusBorderColor(status: string | null | undefined): string {
  if (!status) return `border-[${COLORS.TEAL}]`;
  
  const statusColors: Record<string, string> = {
    // Project/task statuses
    'completed': 'border-emerald-500',
    'on_hold': 'border-slate-400',
    'delayed': 'border-orange-500',
    'active': `border-[${COLORS.TEAL}]`,
    'in_progress': 'border-blue-500', // Updated to blue 
    'not_started': 'border-slate-300',  // Lighter grey
  };
  
  return statusColors[status.toLowerCase()] || `border-[${COLORS.TEAL}]`;
}

/**
 * Returns background and text color classes for a status badge
 * @param status The status string
 * @returns Tailwind background and text color classes
 */
export function getStatusBgColor(status: string | null | undefined): string {
  if (!status) return 'bg-slate-50 text-slate-700';
  
  const statusColors: Record<string, string> = {
    // Project statuses
    'active': 'bg-blue-50 text-blue-700',
    'on_hold': 'bg-slate-50 text-slate-700',
    'completed': 'bg-emerald-50 text-emerald-700',
    'delayed': 'bg-orange-50 text-orange-700',
    
    // Task statuses
    'not_started': 'bg-slate-50 text-slate-700',
    'in_progress': 'bg-blue-50 text-blue-700',
    
    // Contact types
    'contractor': `bg-[${COLORS.TEAL}] bg-opacity-20 text-[${COLORS.TEAL}]`,
    'supplier': `bg-[${COLORS.BLUE}] bg-opacity-20 text-[${COLORS.BLUE_TEXT}]`,
    'consultant': `bg-[${COLORS.BROWN}] bg-opacity-20 text-[${COLORS.BROWN}]`,
    
    // Material statuses
    'ordered': `bg-[${COLORS.TAUPE}] bg-opacity-20 text-[${COLORS.TAUPE}]`,
    'delivered': `bg-[${COLORS.BLUE}] bg-opacity-20 text-[${COLORS.BLUE_TEXT}]`,
    'used': `bg-[${COLORS.BROWN}] bg-opacity-20 text-[${COLORS.BROWN}]`,
  };
  
  return statusColors[status.toLowerCase()] || 'bg-slate-100 text-slate-800';
}

/**
 * Alias for getStatusBgColor to maintain backward compatibility
 * @deprecated Use getStatusBgColor instead
 */
export function getStatusColor(status: string): string {
  return getStatusBgColor(status);
}

/**
 * Returns progress bar color classes for a given status
 * @param status The status string
 * @returns Tailwind classes for progress bars
 */
export function getProgressColor(status: string | number | null | undefined): string {
  // For numeric progress values (0-100)
  if (typeof status === 'number') {
    if (status >= 80) return 'bg-green-500 h-2 rounded-full';
    if (status >= 40) return 'bg-yellow-400 h-2 rounded-full'; // Brighter poppy yellow
    return 'bg-slate-400 h-2 rounded-full'; // Softer grey
  }
  
  // For null/undefined values
  if (!status) return 'bg-slate-300 h-2 rounded-full';
  
  const statusColors: Record<string, string> = {
    'completed': 'bg-green-500 h-2 rounded-full',
    'in_progress': 'bg-yellow-400 h-2 rounded-full',  // Brighter poppy yellow
    'in progress': 'bg-yellow-400 h-2 rounded-full',  // Brighter poppy yellow
    'not_started': 'bg-slate-400 h-2 rounded-full',   // Softer grey
    'not started': 'bg-slate-400 h-2 rounded-full',   // Softer grey
    'pending': 'bg-slate-400 h-2 rounded-full',
    'delayed': 'bg-red-500 h-2 rounded-full',
    'on_hold': 'bg-slate-500 h-2 rounded-full',
    'on hold': 'bg-slate-500 h-2 rounded-full',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-slate-300 h-2 rounded-full';
}

/**
 * Returns module-specific colors for navigation and UI elements
 * @param module The module name
 * @returns Tailwind text and background color classes
 */
export function getColorByModule(module: string): string {
  const colors: Record<string, string> = {
    'project': `text-[${COLORS.BROWN}] bg-[${COLORS.BROWN}] bg-opacity-10`,
    'task': `text-[${COLORS.TEAL}] bg-[${COLORS.TEAL}] bg-opacity-10`,
    'expense': `text-[${COLORS.TEAL}] bg-[${COLORS.TEAL}] bg-opacity-10`,
    'dashboard': `text-[${COLORS.SLATE}] bg-[${COLORS.SLATE}] bg-opacity-10`,
    'contact': `text-[${COLORS.BLUE}] bg-[${COLORS.BLUE}] bg-opacity-10`,
    'resource': `text-[${COLORS.TAUPE}] bg-[${COLORS.TAUPE}] bg-opacity-10`,
    'material': `text-[${COLORS.ORANGE}] bg-orange-100`,
    'labor': `text-[${COLORS.PURPLE}] bg-[${COLORS.PURPLE}] bg-opacity-10`,
  };
  
  return colors[module.toLowerCase()] || 'text-slate-500 bg-slate-50';
}

/**
 * Returns colors for task categories
 * @param category The task category
 * @returns Tailwind background and border color classes
 */
export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return 'bg-gray-400 border-gray-500 text-gray-800';
  
  const categoryColors: Record<string, string> = {
    'foundation': 'bg-stone-700 border-stone-800 text-white',
    'framing': 'bg-amber-700 border-amber-800 text-white',
    'roof': 'bg-red-700 border-red-800 text-white',
    'windows_doors': 'bg-blue-700 border-blue-800 text-white',
    'electrical': 'bg-yellow-500 border-yellow-600 text-yellow-950',
    'plumbing': 'bg-blue-500 border-blue-600 text-white',
    'hvac': 'bg-gray-600 border-gray-700 text-white',
    'insulation': 'bg-green-500 border-green-600 text-white',
    'drywall': 'bg-gray-200 border-gray-400 text-gray-800',
    'flooring': 'bg-amber-500 border-amber-600 text-white',
    'painting': 'bg-indigo-500 border-indigo-600 text-white',
    'landscaping': 'bg-emerald-600 border-emerald-700 text-white',
  };
  
  return categoryColors[category.toLowerCase()] || 'bg-gray-400 border-gray-500 text-gray-800';
}

/**
 * Formats a status string for display (e.g., "in_progress" to "In Progress")
 * @param status The status string
 * @returns Formatted status text
 */
export function formatStatusText(status: string | null | undefined): string {
  if (!status) return "Unknown";
  
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Formats a task status with specialized mapping (e.g., "not_started" to "Not Started")
 * @param status The task status
 * @returns Formatted task status text
 */
export function formatTaskStatus(status: string | null | undefined): string {
  if (!status) return "Not Started";
  
  // Special case mapping to match the provided example
  const statusMap: Record<string, string> = {
    "completed": "Completed",
    "in_progress": "In Progress",
    "not_started": "Not Started",
    "pending": "Pending",
    "delayed": "Delayed",
    "on_hold": "On Hold"
  };

  const normalizedStatus = status.toLowerCase().replace(/[_\s]/g, '');

  for (const [key, value] of Object.entries(statusMap)) {
    if (key.replace(/[_\s]/g, '') === normalizedStatus) {
      return value;
    }
  }

  // Fallback to standard formatting if no match
  return formatStatusText(status);
}

/**
 * Returns the color values for a category as an object with baseColor and textColor properties
 * This function extracts colors from tailwind classes to direct CSS color values
 * @param category The category string
 * @returns Object with baseColor and textColor properties
 */
export function getCategoryColorValues(category: string | null | undefined): { baseColor: string, textColor: string } {
  if (!category) return { baseColor: '#6366f1', textColor: 'white' }; // Default indigo color
  
  const normalizedCategory = category.toLowerCase();
  
  // Check if this is one of our main construction categories
  if (normalizedCategory.includes('structural')) {
    return { baseColor: '#556b2f', textColor: 'white' }; // Olive green
  } else if (normalizedCategory.includes('system')) {
    return { baseColor: '#445566', textColor: 'white' }; // Steel blue
  } else if (normalizedCategory.includes('sheath')) {
    return { baseColor: '#9b2c2c', textColor: 'white' }; // Brick red
  } else if (normalizedCategory.includes('finish')) {
    return { baseColor: '#8b4513', textColor: 'white' }; // Saddle brown
  }
  
  // If not a main category, map based on color name
  if (normalizedCategory.includes('red')) {
    return { baseColor: '#ef4444', textColor: 'white' }; // red-500
  } else if (normalizedCategory.includes('green')) {
    return { baseColor: '#22c55e', textColor: 'white' }; // green-500
  } else if (normalizedCategory.includes('blue')) {
    return { baseColor: '#3b82f6', textColor: 'white' }; // blue-500
  } else if (normalizedCategory.includes('yellow')) {
    return { baseColor: '#eab308', textColor: 'white' }; // yellow-500
  } else if (normalizedCategory.includes('purple')) {
    return { baseColor: '#a855f7', textColor: 'white' }; // purple-500
  } else if (normalizedCategory.includes('orange')) {
    return { baseColor: '#f97316', textColor: 'white' }; // orange-500
  } else if (normalizedCategory.includes('teal')) {
    return { baseColor: '#14b8a6', textColor: 'white' }; // teal-500
  } else if (normalizedCategory.includes('gray')) {
    return { baseColor: '#6b7280', textColor: 'white' }; // gray-500
  }
  
  // Default to indigo if no match
  return { baseColor: '#6366f1', textColor: 'white' }; // indigo-500
}

/**
 * Formats a category name for display (e.g., "windows_doors" to "Windows/Doors")
 * @param category The category string
 * @returns Formatted category name
 */
export function formatCategoryName(category: string | null | undefined): string {
  if (!category) return "Uncategorized";
  
  if (category.toLowerCase() === 'windows_doors') {
    return 'Windows/Doors';
  }
  
  return formatStatusText(category);
}

/**
 * Returns color values for construction tier1 categories using the active theme
 * @param tier1Category The tier1 category (structural, systems, sheathing, finishings)
 * @param format The format of the color value to return (bg, border, text, or hex - defaults to hex)
 * @returns CSS color value in the requested format
 */
export function getTier1CategoryColor(tier1Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex'): string {
  if (!tier1Category) return getDefaultCategoryColor(format);
  
  const category = tier1Category.toLowerCase();
  // Get the hex color from our theme system
  const hexColor = getThemeTier1Color(category);
  
  // Convert hex to tailwind class approximation
  const tailwindColor = getClosestTailwindColor(hexColor, category);
  
  // Return the appropriate format
  if (format === 'hex') {
    return hexColor;
  } else if (format === 'bg') {
    return `bg-${tailwindColor}`;
  } else if (format === 'text') {
    return `text-${tailwindColor}`;
  } else {
    return `border-${tailwindColor}`;
  }
}

/**
 * Returns color values for construction tier2 categories using the active theme
 * @param tier2Category The tier2 category (foundation, framing, electrical, etc.)
 * @param format The format of the color value to return (bg, border, text, or hex - defaults to hex)
 * @returns CSS color value in the requested format
 */
export function getTier2CategoryColor(tier2Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex'): string {
  if (!tier2Category) return getDefaultCategoryColor(format);
  
  const category = tier2Category.toLowerCase();
  
  // Get the hex color from our theme system
  const hexColor = getThemeTier2Color(category);
  
  // Convert hex to tailwind class approximation
  const tailwindColor = getClosestTailwindColor(hexColor, category);
  
  // Return the appropriate format
  if (format === 'hex') {
    return hexColor;
  } else if (format === 'bg') {
    return `bg-${tailwindColor}`;
  } else if (format === 'text') {
    return `text-${tailwindColor}`;
  } else {
    return `border-${tailwindColor}`;
  }
}

/**
 * Helper function to get default category color
 */
function getDefaultCategoryColor(format: 'bg' | 'border' | 'text' | 'hex'): string {
  // Get the default color from active theme
  const activeTheme = getActiveColorTheme();
  const hexColor = activeTheme.tier1.default;
  
  if (format === 'hex') {
    return hexColor;
  } else if (format === 'bg') {
    return `bg-stone-700`;
  } else if (format === 'text') {
    return `text-stone-700`;
  } else {
    return `border-stone-700`;
  }
}

/**
 * Maps hex colors to approximate Tailwind CSS color classes
 * This is needed because we can't directly use custom hex values for background/text/border
 * without adding them to the Tailwind config
 */
function getClosestTailwindColor(hexColor: string, category: string): string {
  // Map of common hex colors to Tailwind color classes
  // This is a simplification - a real implementation would find the closest color match
  const hexToTailwind: Record<string, string> = {
    // Earth tone theme (tier1)
    '#556b2f': 'green-600',   // structural
    '#445566': 'slate-600',   // systems
    '#9b2c2c': 'red-600',     // sheathing
    '#8b4513': 'amber-600',   // finishings
    '#5c4033': 'stone-700',   // default
    
    // Pastel theme (tier1)
    '#93c5fd': 'blue-300',    
    '#a5b4fc': 'indigo-300',  
    '#fda4af': 'rose-300',    
    '#fcd34d': 'yellow-300',  
    '#d8b4fe': 'purple-300',  
    
    // Futuristic theme (tier1)
    '#3b82f6': 'blue-500',    
    '#8b5cf6': 'violet-500',  
    '#ec4899': 'pink-500',    
    '#10b981': 'emerald-500', 
    '#6366f1': 'indigo-500',  
    
    // Classic Construction (tier1)
    '#fbbf24': 'amber-400',   
    '#1e3a8a': 'blue-900',    
    // Removing duplicates - '#ef4444' and '#f97316' appear later
    '#0f172a': 'slate-900',   
    
    // Vibrant theme (tier1)
    '#16a34a': 'green-600',   
    '#2563eb': 'blue-600',    
    '#dc2626': 'red-600',     
    '#d97706': 'amber-600',   
    '#7c3aed': 'violet-600',  
    
    // Common tier2 colors
    '#047857': 'emerald-600',
    '#65a30d': 'lime-600',
    '#15803d': 'green-700',
    '#166534': 'green-800',
    '#0891b2': 'cyan-600',
    '#0284c7': 'sky-600',
    '#e11d48': 'rose-600',
    '#db2777': 'pink-600',
    '#ef4444': 'red-500',     // Used in vibrant theme
    '#f43f5e': 'rose-500',
    '#b91c1c': 'red-700',
    '#f59e0b': 'amber-500',
    '#ca8a04': 'yellow-600',
    '#ea580c': 'orange-600',
    '#b45309': 'amber-700',
    '#a16207': 'yellow-700',
    '#f97316': 'orange-500',  // Used in vibrant theme
    '#4b5563': 'gray-600',
  };
  
  // Return the mapped tailwind class or a default based on category
  if (hexToTailwind[hexColor]) {
    return hexToTailwind[hexColor];
  }
  
  // Provide fallbacks based on category
  switch (category) {
    case 'structural':
      return 'green-600';
    case 'systems':
      return 'slate-600';
    case 'sheathing':
      return 'red-600';
    case 'finishings':
      return 'amber-600';
    case 'foundation':
      return 'emerald-600';
    case 'framing':
      return 'lime-600';
    case 'electrical':
      return 'blue-600';
    case 'windows':
      return 'amber-500';
    case 'cabinets':
      return 'orange-600';
    default:
      return 'gray-600';
  }
}