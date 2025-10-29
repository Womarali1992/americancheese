/**
 * Theme Compatibility Layer
 *
 * This file provides backward compatibility for existing components
 * that use the old theme system while they're being migrated.
 */

import {
  getThemeTier1Color,
  getThemeTier2Color,
  COLOR_THEMES,
  getActiveColorTheme
} from '@/lib/color-themes';

// Legacy function signatures for backward compatibility
export const getStatusBorderColor = (status: string) => {
  const statusColors: Record<string, string> = {
    'completed': '#10b981',
    'active': '#3b82f6', 
    'in_progress': '#f59e0b',
    'on_hold': '#6b7280',
    'not_started': '#64748b',
    'delayed': '#ef4444',
  };
  return statusColors[status.toLowerCase()] || statusColors['not_started'];
};

// Color utility functions
const hexToRgba = (hex: string, alpha: number = 1): string => {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  if (!result) return `rgba(0, 0, 0, ${alpha})`;

  const r = parseInt(result[1], 16);
  const g = parseInt(result[2], 16);
  const b = parseInt(result[3], 16);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
};

export const getStatusBgColor = (status: string) => {
  const color = getStatusBorderColor(status);
  return hexToRgba(color, 0.1);
};

export const getProgressColor = (progress: number) => {
  if (progress >= 100) return '#10b981'; // Green
  if (progress >= 75) return '#3b82f6';  // Blue
  if (progress >= 50) return '#f59e0b';  // Amber
  if (progress >= 25) return '#ef4444';  // Red
  return '#6b7280'; // Gray
};

export const getTier1CategoryColor = getThemeTier1Color;
export const getTier2CategoryColor = getThemeTier2Color;

export const getThemeTier1CategoryColor = getThemeTier1Color;
export const getThemeTier2CategoryColor = getThemeTier2Color;

export const formatTaskStatus = (status?: string | null): string => {
  if (!status) return 'Not Started';
  return status
    .replace(/_/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

export const formatCategoryName = (categoryName?: string | null, projectId?: number, type?: "tier1" | "tier2", categoryMapping?: any): string => {
  if (!categoryName) return '';
  
  // If we have a category mapping function, use it to get the current name
  if (categoryMapping && type) {
    const mappedName = type === "tier1" 
      ? categoryMapping.mapTier1CategoryName(categoryName)
      : categoryMapping.mapTier2CategoryName(categoryName);
    
    if (mappedName !== categoryName) {
      // Use the mapped name and format it
      return mappedName
        .split(/[-_\s]+/)
        .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
        .join(' ');
    }
  }
  
  // Default formatting for stored category names
  return categoryName
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
};

// Main category color function - tries tier1, tier2, then defaults
export const getCategoryColor = (category: string, projectId?: number) => {
  // Try tier1 first
  const tier1Color = getThemeTier1Color(category);
  if (tier1Color !== getActiveColorTheme().tier1.default) {
    return tier1Color;
  }

  // Try tier2
  const tier2Color = getThemeTier2Color(category);
  if (tier2Color !== getActiveColorTheme().tier2.other) {
    return tier2Color;
  }

  // Default fallback
  return '#6366f1';
};

// For components using unified color system
export const getCategoryColorUnified = (categoryOrName: any, projectId?: number) => {
  if (typeof categoryOrName === 'string') {
    return getCategoryColor(categoryOrName, projectId);
  } else if (categoryOrName && typeof categoryOrName === 'object') {
    // If it's an object with name property
    return getCategoryColor(categoryOrName.name || 'other', projectId);
  }
  return '#6366f1'; // Default
};

// Placeholder functions for backwards compatibility
export const getColorByModule = () => '#6b7280';
export const getCategoryColorValues = () => Promise.resolve({ baseColor: '#6b7280', bgColor: '#f8fafc' });
export const getTier1CategoryColorClasses = getThemeTier1Color;
export const getTier2CategoryColorClasses = getThemeTier2Color;
export const getCategoryColorClasses = getCategoryColor;

// Legacy theme functions
export const getStatusColor = getStatusBgColor;
export const formatStatusText = formatTaskStatus;

export const getThemeTaskCardColors = (tier1?: string, tier2?: string, category?: any, projectId?: number) => {
  let baseColor = '#6366f1';

  if (category) {
    baseColor = getCategoryColor(category.name || 'other', projectId);
  } else if (tier2) {
    baseColor = getThemeTier2Color(tier2);
  } else if (tier1) {
    baseColor = getThemeTier1Color(tier1);
  }

  return {
    bg: '#f8fafc',
    border: baseColor,
    text: '#64748b',
    accent: baseColor
  };
};

// Enhanced category color functions for the new system
export const getGenericCategoryColor = getCategoryColor;
export const getTaskCategoryColor = getCategoryColor;
export const getCategoryBadgeClasses = (category: string, projectId?: number) => {
  const color = getCategoryColor(category, projectId);
  return {
    backgroundColor: hexToRgba(color, 0.1),
    borderColor: color,
    color: color
  };
};