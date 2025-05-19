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
    'contractor': 'bg-blue-50 text-blue-700',
    'supplier': 'bg-indigo-50 text-indigo-700',
    'consultant': 'bg-amber-50 text-amber-700',
    
    // Material statuses
    'ordered': 'bg-amber-50 text-amber-700',
    'delivered': 'bg-blue-50 text-blue-700',
    'used': 'bg-emerald-50 text-emerald-700',
  };
  
  return statusColors[status.toLowerCase()] || 'bg-slate-50 text-slate-700';
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
    if (status >= 80) return 'bg-emerald-500 h-2 rounded-full';
    if (status >= 40) return 'bg-blue-500 h-2 rounded-full'; 
    return 'bg-slate-300 h-2 rounded-full';
  }
  
  // For null/undefined values
  if (!status) return 'bg-slate-300 h-2 rounded-full';
  
  const statusColors: Record<string, string> = {
    'completed': 'bg-emerald-500 h-2 rounded-full',
    'in_progress': 'bg-blue-500 h-2 rounded-full',
    'in progress': 'bg-blue-500 h-2 rounded-full',
    'not_started': 'bg-slate-300 h-2 rounded-full',
    'not started': 'bg-slate-300 h-2 rounded-full',
    'pending': 'bg-slate-300 h-2 rounded-full',
    'delayed': 'bg-orange-500 h-2 rounded-full',
    'on_hold': 'bg-slate-400 h-2 rounded-full',
    'on hold': 'bg-slate-400 h-2 rounded-full',
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
    'project': 'text-emerald-700 bg-emerald-50',
    'task': 'text-blue-700 bg-blue-50',
    'expense': 'text-amber-700 bg-amber-50',
    'dashboard': 'text-indigo-700 bg-indigo-50',
    'contact': 'text-violet-700 bg-violet-50',
    'resource': 'text-slate-700 bg-slate-50',
    'material': 'text-orange-700 bg-orange-50',
    'labor': 'text-pink-700 bg-pink-50',
  };
  
  return colors[module.toLowerCase()] || 'text-slate-700 bg-slate-50';
}

/**
 * Returns colors for task categories
 * @param category The task category
 * @returns Tailwind background and border color classes
 */
export function getCategoryColor(category: string | null | undefined): string {
  if (!category) return 'bg-slate-100 border-slate-200 text-slate-700';
  
  const categoryColors: Record<string, string> = {
    'foundation': 'bg-stone-50 border-stone-200 text-stone-700',
    'framing': 'bg-amber-50 border-amber-200 text-amber-700',
    'roof': 'bg-red-50 border-red-200 text-red-700',
    'windows_doors': 'bg-blue-50 border-blue-200 text-blue-700',
    'electrical': 'bg-yellow-50 border-yellow-200 text-yellow-700',
    'plumbing': 'bg-sky-50 border-sky-200 text-sky-700',
    'hvac': 'bg-slate-50 border-slate-200 text-slate-700',
    'insulation': 'bg-green-50 border-green-200 text-green-700',
    'drywall': 'bg-zinc-50 border-zinc-200 text-zinc-700',
    'flooring': 'bg-orange-50 border-orange-200 text-orange-700',
    'painting': 'bg-indigo-50 border-indigo-200 text-indigo-700',
    'landscaping': 'bg-emerald-50 border-emerald-200 text-emerald-700',
  };
  
  return categoryColors[category.toLowerCase()] || 'bg-slate-100 border-slate-200 text-slate-700';
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
  if (!category) return { baseColor: '#6366f1', textColor: '#4338ca' }; // Default indigo color
  
  const normalizedCategory = category.toLowerCase();
  
  // Check if this is one of our main construction categories
  if (normalizedCategory.includes('structural')) {
    return { baseColor: '#f8fafc', textColor: '#475569' }; // Slate color family
  } else if (normalizedCategory.includes('system')) {
    return { baseColor: '#eff6ff', textColor: '#2563eb' }; // Blue color family
  } else if (normalizedCategory.includes('sheath')) {
    return { baseColor: '#fffbeb', textColor: '#d97706' }; // Amber color family
  } else if (normalizedCategory.includes('finish')) {
    return { baseColor: '#ecfdf5', textColor: '#059669' }; // Emerald color family
  }
  
  // If not a main category, map based on color name
  if (normalizedCategory.includes('red')) {
    return { baseColor: '#fef2f2', textColor: '#dc2626' }; // red color family
  } else if (normalizedCategory.includes('green')) {
    return { baseColor: '#f0fdf4', textColor: '#16a34a' }; // green color family
  } else if (normalizedCategory.includes('blue')) {
    return { baseColor: '#eff6ff', textColor: '#2563eb' }; // blue color family
  } else if (normalizedCategory.includes('yellow')) {
    return { baseColor: '#fefce8', textColor: '#ca8a04' }; // yellow color family
  } else if (normalizedCategory.includes('purple')) {
    return { baseColor: '#faf5ff', textColor: '#9333ea' }; // purple color family
  } else if (normalizedCategory.includes('orange')) {
    return { baseColor: '#fff7ed', textColor: '#ea580c' }; // orange color family
  } else if (normalizedCategory.includes('teal')) {
    return { baseColor: '#f0fdfa', textColor: '#0d9488' }; // teal color family
  } else if (normalizedCategory.includes('gray') || normalizedCategory.includes('grey')) {
    return { baseColor: '#f8fafc', textColor: '#475569' }; // slate color family
  }
  
  // Default to indigo if no match
  return { baseColor: '#eef2ff', textColor: '#4f46e5' }; // indigo color family
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
    return `bg-slate-100`;
  } else if (format === 'text') {
    return `text-slate-700`;
  } else {
    return `border-slate-200`;
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
    
    // Custom theme colors (from logs)
    '#4B0082': 'purple-900',  // Indigo (deep purple)
    '#800000': 'red-900',     // Maroon
    '#2F4F4F': 'slate-700',   // Dark slate gray
    '#BA55D3': 'purple-500',  // Medium orchid
    
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
      return 'purple-800'; // Changed from green-600 to purple-800
    case 'systems':
      return 'red-900';    // Updated to match custom theme
    case 'sheathing':
      return 'slate-700';  // Updated to match custom theme
    case 'finishings':
      return 'purple-500'; // Updated to match custom theme
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