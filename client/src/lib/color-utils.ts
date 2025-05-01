// Consolidated color utility functions for the application
// This file combines functionality from previous utils.ts and task-utils.ts files

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

// Earth tone color palette to match project colors and Tailwind classes
const EARTH_TONES = {
  // Hex values for direct CSS use
  STEEL: '#556b2f',       // strong olive green
  BLUE_STEEL: '#445566',  // deep steel blue
  BRICK: '#9b2c2c',       // strong red brick
  SAND: '#8b4513',        // strong saddle brown
  BROWN: '#5c4033',       // rich brown
  
  // Tailwind class mappings
  TAILWIND: {
    STRUCTURAL: 'olive-700',     // Olive green (steel)
    SYSTEMS: 'slate-700',        // Blue steel 
    SHEATHING: 'red-700',        // Brick red
    FINISHINGS: 'amber-800',     // Saddle brown (sand)
    DEFAULT: 'stone-700'         // Default brown
  }
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
    'completed': 'border-green-500',
    'on_hold': 'border-slate-500',
    'delayed': 'border-red-500',
    'active': `border-[${COLORS.TEAL}]`,
    'in_progress': 'border-yellow-400', // Brighter poppy yellow
    'not_started': 'border-slate-400',  // Softer grey
  };
  
  return statusColors[status.toLowerCase()] || `border-[${COLORS.TEAL}]`;
}

/**
 * Returns background and text color classes for a status badge
 * @param status The status string
 * @returns Tailwind background and text color classes
 */
export function getStatusBgColor(status: string | null | undefined): string {
  if (!status) return 'bg-slate-100 text-slate-800';
  
  const statusColors: Record<string, string> = {
    // Project statuses
    'active': `bg-[${COLORS.TEAL}] bg-opacity-20 text-[${COLORS.TEAL}]`,
    'on_hold': `bg-[${COLORS.TAUPE}] bg-opacity-20 text-[${COLORS.TAUPE}]`,
    'completed': `bg-[${COLORS.BROWN}] bg-opacity-20 text-[${COLORS.BROWN}]`,
    'delayed': `bg-[${COLORS.SLATE}] bg-opacity-20 text-[${COLORS.SLATE}]`,
    
    // Task statuses
    'not_started': `bg-[${COLORS.TAUPE}] bg-opacity-20 text-[${COLORS.TAUPE}]`,
    'in_progress': `bg-[${COLORS.BLUE}] bg-opacity-20 text-[${COLORS.BLUE_TEXT}]`,
    
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
 * Returns color values for construction tier1 categories using earth tone palette
 * @param tier1Category The tier1 category (structural, systems, sheathing, finishings)
 * @param format The format of the color value to return (bg, border, text, or hex - defaults to hex)
 * @returns CSS color value in the requested format
 */
export function getTier1CategoryColor(tier1Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex'): string {
  if (!tier1Category) return getDefaultCategoryColor(format);
  
  const category = tier1Category.toLowerCase();
  
  // Determine which tailwind/hex color to use based on category
  let tailwindColor: string;
  let hexColor: string;
  
  switch (category) {
    case 'structural':
      tailwindColor = 'green-600'; // Olive green replacement for structural/steel
      hexColor = EARTH_TONES.STEEL;
      break;
    case 'systems': 
      tailwindColor = 'slate-600'; // Uses slate-600 class for systems/blue-steel
      hexColor = EARTH_TONES.BLUE_STEEL;
      break;
    case 'sheathing':
      tailwindColor = 'red-600'; // Uses red-600 class for sheathing/brick
      hexColor = EARTH_TONES.BRICK;
      break;
    case 'finishings':
      tailwindColor = 'amber-600'; // Uses amber-600 class for finishings/sand
      hexColor = EARTH_TONES.SAND;
      break;
    default:
      return getDefaultCategoryColor(format);
  }
  
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
  if (format === 'hex') {
    return EARTH_TONES.BROWN;
  } else if (format === 'bg') {
    return 'bg-stone-700';
  } else if (format === 'text') {
    return 'text-stone-700';
  } else {
    return 'border-stone-700';
  }
}