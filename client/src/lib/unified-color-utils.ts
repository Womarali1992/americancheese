/**
 * Unified Color Utilities - Replaces all hardcoded colors with admin panel colors
 * 
 * This system ensures all UI elements get their colors from the admin panel,
 * making the admin panel the single source of truth for all application colors.
 */

import { getCategoryColor, getTier1Color, getTier2Color, getStatusColors, getModuleColors } from './admin-color-system';

/**
 * Get dynamic status colors based on admin panel settings
 */
export async function getStatusBorderColor(status: string | null | undefined, projectId?: number): Promise<string> {
  if (!status) return 'border-gray-300';
  
  const statusColors = await getStatusColors(projectId);
  const normalizedStatus = status.toLowerCase();
  
  // Map status to admin colors
  const colorMap: Record<string, string> = {
    'completed': statusColors.completed,
    'on_hold': statusColors.on_hold,
    'delayed': statusColors.delayed,
    'active': statusColors.active,
    'in_progress': statusColors.in_progress,
    'not_started': statusColors.not_started,
    'pending': statusColors.pending
  };
  
  const color = colorMap[normalizedStatus] || statusColors.pending;
  return `border-[${color}]`;
}

/**
 * Get dynamic status background colors based on admin panel settings
 */
export async function getStatusBgColor(status: string | null | undefined, projectId?: number): Promise<string> {
  if (!status) return 'bg-gray-50 text-gray-700';
  
  const statusColors = await getStatusColors(projectId);
  const normalizedStatus = status.toLowerCase();
  
  const colorMap: Record<string, string> = {
    'completed': statusColors.completed,
    'on_hold': statusColors.on_hold,
    'delayed': statusColors.delayed,
    'active': statusColors.active,
    'in_progress': statusColors.in_progress,
    'not_started': statusColors.not_started,
    'pending': statusColors.pending,
    'contractor': statusColors.active,
    'supplier': statusColors.in_progress,
    'consultant': statusColors.delayed,
    'ordered': statusColors.pending,
    'delivered': statusColors.in_progress,
    'used': statusColors.completed
  };
  
  const color = colorMap[normalizedStatus] || statusColors.pending;
  const bgColor = lightenColor(color, 0.9);
  const textColor = darkenColor(color, 0.2);
  
  return `bg-[${bgColor}] text-[${textColor}]`;
}

/**
 * Get dynamic progress bar colors based on admin panel settings
 */
export async function getProgressColor(status: string | number | null | undefined, projectId?: number): Promise<string> {
  const statusColors = await getStatusColors(projectId);
  
  // For numeric progress values
  if (typeof status === 'number') {
    if (status >= 80) return `bg-[${statusColors.completed}] h-2 rounded-full`;
    if (status >= 40) return `bg-[${statusColors.in_progress}] h-2 rounded-full`;
    return `bg-[${statusColors.not_started}] h-2 rounded-full`;
  }
  
  if (!status) return `bg-[${statusColors.not_started}] h-2 rounded-full`;
  
  const normalizedStatus = status.toString().toLowerCase();
  const colorMap: Record<string, string> = {
    'completed': statusColors.completed,
    'in_progress': statusColors.in_progress,
    'in progress': statusColors.in_progress,
    'not_started': statusColors.not_started,
    'not started': statusColors.not_started,
    'pending': statusColors.pending,
    'delayed': statusColors.delayed,
    'on_hold': statusColors.on_hold,
    'on hold': statusColors.on_hold,
  };
  
  const color = colorMap[normalizedStatus] || statusColors.not_started;
  return `bg-[${color}] h-2 rounded-full`;
}

/**
 * Get dynamic module colors based on admin panel settings
 */
export async function getColorByModule(module: string, projectId?: number): Promise<string> {
  const moduleColors = await getModuleColors(projectId);
  const normalizedModule = module.toLowerCase();
  
  const colorMap: Record<string, string> = {
    'project': moduleColors.project,
    'task': moduleColors.task,
    'expense': moduleColors.expense,
    'dashboard': moduleColors.dashboard,
    'contact': moduleColors.contact,
    'resource': moduleColors.material,
    'material': moduleColors.material,
    'labor': moduleColors.labor,
    'admin': moduleColors.admin
  };
  
  const color = colorMap[normalizedModule] || moduleColors.dashboard;
  const bgColor = lightenColor(color, 0.9);
  const textColor = darkenColor(color, 0.2);
  
  return `text-[${textColor}] bg-[${bgColor}]`;
}

/**
 * Get dynamic category colors based on admin panel settings
 */
export async function getCategoryColorClasses(category: string | null | undefined, projectId?: number): Promise<string> {
  if (!category) return 'bg-gray-100 border-gray-200 text-gray-700';
  
  const color = await getCategoryColor(category, projectId);
  const bgColor = lightenColor(color, 0.9);
  const borderColor = lightenColor(color, 0.7);
  const textColor = darkenColor(color, 0.2);
  
  return `bg-[${bgColor}] border-[${borderColor}] text-[${textColor}]`;
}

/**
 * Get tier1 category colors with CSS custom properties
 */
export async function getTier1CategoryColorClasses(tier1Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex', projectId?: number): Promise<string> {
  if (!tier1Category) return format === 'hex' ? '#6b7280' : `${format}-gray-500`;
  
  const color = await getTier1Color(tier1Category, projectId);
  
  if (format === 'hex') {
    return color;
  }
  
  return `${format}-[${color}]`;
}

/**
 * Get tier2 category colors with CSS custom properties
 */
export async function getTier2CategoryColorClasses(tier2Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex', projectId?: number): Promise<string> {
  if (!tier2Category) return format === 'hex' ? '#6b7280' : `${format}-gray-500`;
  
  const color = await getTier2Color(tier2Category, projectId);
  
  if (format === 'hex') {
    return color;
  }
  
  return `${format}-[${color}]`;
}

/**
 * Get theme-based task card colors using admin panel colors
 */
export async function getThemeTaskCardColors(tier1Category?: string, tier2Category?: string, projectId?: number): Promise<{
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}> {
  let color: string;
  
  if (tier2Category) {
    color = await getTier2Color(tier2Category, projectId);
  } else if (tier1Category) {
    color = await getTier1Color(tier1Category, projectId);
  } else {
    color = '#6b7280'; // Default gray
  }
  
  return {
    backgroundColor: lightenColor(color, 0.95),
    borderColor: color,
    textColor: darkenColor(color, 0.2)
  };
}

/**
 * Get category color values for direct styling
 */
export async function getCategoryColorValues(category: string | null | undefined, projectId?: number): Promise<{ baseColor: string, textColor: string }> {
  if (!category) return { baseColor: '#6b7280', textColor: '#374151' };
  
  const color = await getCategoryColor(category, projectId);
  return {
    baseColor: lightenColor(color, 0.9),
    textColor: darkenColor(color, 0.2)
  };
}

/**
 * Utility function to lighten a color
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
 * Utility function to darken a color
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
 * Format status text for display
 */
export function formatStatusText(status: string | null | undefined): string {
  if (!status) return "Unknown";
  
  return status
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Format task status with specialized mapping
 */
export function formatTaskStatus(status: string | null | undefined): string {
  if (!status) return "Not Started";
  
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

  return formatStatusText(status);
}

/**
 * Format category name for display
 */
export function formatCategoryName(category: string | null | undefined, projectId?: number): string {
  if (!category) return "Uncategorized";
  
  // Try to get custom category name from localStorage
  try {
    const categoryKey = category.toLowerCase();
    
    // First try project-specific names
    if (projectId) {
      const projectSpecificCategories = localStorage.getItem(`categoryNames_${projectId}`);
      if (projectSpecificCategories) {
        const parsed = JSON.parse(projectSpecificCategories);
        const customCategory = parsed.find((c: any) => c.id.toLowerCase() === categoryKey);
        if (customCategory) {
          return customCategory.label;
        }
      }
    }

    // Fall back to global category names
    const globalCategories = localStorage.getItem('globalCategoryNames');
    if (globalCategories) {
      const parsed = JSON.parse(globalCategories);
      const customCategory = parsed.find((c: any) => c.id.toLowerCase() === categoryKey);
      if (customCategory) {
        return customCategory.label;
      }
    }
  } catch (error) {
    console.error("Failed to load custom category names:", error);
  }

  // Fall back to original formatting
  if (category.toLowerCase() === 'windows_doors') {
    return 'Windows/Doors';
  }
  
  return formatStatusText(category);
}