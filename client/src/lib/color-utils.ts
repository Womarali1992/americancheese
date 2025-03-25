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
  PURPLE: '#a855f7',
};

/**
 * Returns the border color class for a given status
 * @param status The status string
 * @returns A Tailwind border color class
 */
export function getStatusBorderColor(status: string): string {
  const statusColors: Record<string, string> = {
    // Project/task statuses
    'completed': `border-[${COLORS.BROWN}]`,
    'on_hold': `border-[${COLORS.TAUPE}]`,
    'delayed': `border-[${COLORS.SLATE}]`,
    'active': `border-[${COLORS.TEAL}]`,
    'in_progress': `border-[${COLORS.BLUE}]`,
    'not_started': `border-[${COLORS.TAUPE}]`,
  };
  
  return statusColors[status.toLowerCase()] || `border-[${COLORS.TEAL}]`;
}

/**
 * Returns background and text color classes for a status badge
 * @param status The status string
 * @returns Tailwind background and text color classes
 */
export function getStatusBgColor(status: string): string {
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
export function getProgressColor(status: string): string {
  const statusColors: Record<string, string> = {
    'completed': `bg-[${COLORS.BROWN}] h-2 rounded-full`,
    'in_progress': `bg-[${COLORS.BLUE}] h-2 rounded-full`,
    'in progress': `bg-[${COLORS.BLUE}] h-2 rounded-full`,
    'not_started': `bg-[${COLORS.TAUPE}] h-2 rounded-full`,
    'not started': `bg-[${COLORS.TAUPE}] h-2 rounded-full`,
    'pending': `bg-[${COLORS.TAUPE}] h-2 rounded-full`,
    'delayed': `bg-[${COLORS.SLATE}] h-2 rounded-full`,
    'on_hold': `bg-[${COLORS.SLATE}] h-2 rounded-full`,
    'on hold': `bg-[${COLORS.SLATE}] h-2 rounded-full`,
  };
  
  return statusColors[status.toLowerCase()] || `bg-[${COLORS.TEAL}] h-2 rounded-full`;
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
    'labor': `text-[${COLORS.PURPLE}] bg-purple-100`,
  };
  
  return colors[module.toLowerCase()] || 'text-slate-500 bg-slate-50';
}

/**
 * Returns colors for task categories
 * @param category The task category
 * @returns Tailwind background and border color classes
 */
export function getCategoryColor(category: string): string {
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
export function formatStatusText(status: string): string {
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
export function formatTaskStatus(status: string): string {
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
export function formatCategoryName(category: string): string {
  if (category.toLowerCase() === 'windows_doors') {
    return 'Windows/Doors';
  }
  
  return formatStatusText(category);
}