// Consolidated color utility functions for the application
// This file now uses the admin panel as the single source of truth for all colors
import { 
  getStatusBorderColor as getAdminStatusBorderColor,
  getStatusBgColor as getAdminStatusBgColor,
  getProgressColor as getAdminProgressColor,
  getColorByModule as getAdminColorByModule,
  getCategoryColorClasses as getAdminCategoryColorClasses,
  getTier1CategoryColorClasses,
  getTier2CategoryColorClasses,
  getThemeTaskCardColors as getAdminThemeTaskCardColors,
  getCategoryColorValues as getAdminCategoryColorValues,
  formatStatusText as formatStatusTextUtil,
  formatTaskStatus as formatTaskStatusUtil,
  formatCategoryName as formatCategoryNameUtil
} from './unified-color-utils';

/**
 * Returns the border color class for a given status - now uses admin panel colors
 * @param status The status string
 * @returns A Tailwind border color class
 */
export async function getStatusBorderColor(status: string | null | undefined, projectId?: number): Promise<string> {
  return await getAdminStatusBorderColor(status, projectId);
}

/**
 * Returns background and text color classes for a status badge - now uses admin panel colors
 * @param status The status string
 * @returns Tailwind background and text color classes
 */
export async function getStatusBgColor(status: string | null | undefined, projectId?: number): Promise<string> {
  return await getAdminStatusBgColor(status, projectId);
}

/**
 * Alias for getStatusBgColor to maintain backward compatibility
 * @deprecated Use getStatusBgColor instead
 */
export async function getStatusColor(status: string, projectId?: number): Promise<string> {
  return await getStatusBgColor(status, projectId);
}

/**
 * Returns progress bar color classes for a given status - now uses admin panel colors
 * @param status The status string
 * @returns Tailwind classes for progress bars
 */
export async function getProgressColor(status: string | number | null | undefined, projectId?: number): Promise<string> {
  return await getAdminProgressColor(status, projectId);
}

/**
 * Returns module-specific colors for navigation and UI elements - now uses admin panel colors
 * @param module The module name
 * @returns Tailwind text and background color classes
 */
export async function getColorByModule(module: string, projectId?: number): Promise<string> {
  return await getAdminColorByModule(module, projectId);
}

/**
 * Returns colors for task categories using admin panel colors
 * @param category The task category
 * @returns Tailwind background and border color classes
 */
export async function getCategoryColor(category: string | null | undefined, projectId?: number): Promise<string> {
  return await getAdminCategoryColorClasses(category, projectId);
}

/**
 * Formats a status string for display (e.g., "in_progress" to "In Progress")
 * @param status The status string
 * @returns Formatted status text
 */
export function formatStatusText(status: string | null | undefined): string {
  return formatStatusTextUtil(status);
}

/**
 * Formats a task status with specialized mapping (e.g., "not_started" to "Not Started")
 * @param status The task status
 * @returns Formatted task status text
 */
export function formatTaskStatus(status: string | null | undefined): string {
  return formatTaskStatusUtil(status);
}

/**
 * Returns the color values for a category as an object with baseColor and textColor properties
 * This function extracts colors from admin panel settings to direct CSS color values
 * @param category The category string
 * @returns Object with baseColor and textColor properties
 */
export async function getCategoryColorValues(category: string | null | undefined, projectId?: number): Promise<{ baseColor: string, textColor: string }> {
  return await getAdminCategoryColorValues(category, projectId);
}

/**
 * Formats a category name for display (e.g., "windows_doors" to "Windows/Doors")
 * @param category The category string
 * @returns Formatted category name
 */
export function formatCategoryName(category: string | null | undefined, projectId?: number): string {
  return formatCategoryNameUtil(category, projectId);
}

/**
 * Returns color values for construction tier1 categories using admin panel colors
 * @param tier1Category The tier1 category (structural, systems, sheathing, finishings)
 * @param format The format of the color value to return (bg, border, text, or hex - defaults to hex)
 * @returns CSS color value in the requested format
 */
export async function getTier1CategoryColor(tier1Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex', projectId?: number): Promise<string> {
  return await getTier1CategoryColorClasses(tier1Category, format, projectId);
}

/**
 * Returns color values for construction tier2 categories using admin panel colors
 * @param tier2Category The tier2 category (foundation, framing, electrical, etc.)
 * @param format The format of the color value to return (bg, border, text, or hex - defaults to hex)
 * @returns CSS color value in the requested format
 */
export async function getTier2CategoryColor(tier2Category: string | null | undefined, format: 'bg' | 'border' | 'text' | 'hex' = 'hex', projectId?: number): Promise<string> {
  return await getTier2CategoryColorClasses(tier2Category, format, projectId);
}

/**
 * Returns theme-based colors for task cards using admin panel colors
 * This function uses the admin panel color system
 * @param tier1Category The tier1 category (structural, systems, sheathing, finishings)
 * @param tier2Category The tier2 category (foundation, framing, electrical, etc.)
 * @returns Object with background and border colors using admin panel colors
 */
export async function getThemeTaskCardColors(tier1Category?: string, tier2Category?: string, projectId?: number): Promise<{
  backgroundColor: string;
  borderColor: string;
  textColor: string;
}> {
  return await getAdminThemeTaskCardColors(tier1Category, tier2Category, projectId);
}

/**
 * Get dynamic color for navigation/UI elements based on module type
 * @param module The module name ('project', 'task', 'contact', etc.)
 * @param projectId Optional project ID for project-specific colors
 * @returns Object with styling colors for consistent UI elements
 */
export async function getDynamicModuleColor(module: string, projectId?: number): Promise<{
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
}> {
  const color = await getAdminColorByModule(module, projectId);
  
  // Extract the background color from the returned class string
  const bgMatch = color.match(/bg-\[([^\]]+)\]/);
  const textMatch = color.match(/text-\[([^\]]+)\]/);
  
  const primaryColor = bgMatch ? bgMatch[1] : '#6b7280';
  const textColor = textMatch ? textMatch[1] : '#374151';
  
  return {
    primaryColor,
    backgroundColor: lightenColor(primaryColor, 0.9),
    textColor,
    borderColor: lightenColor(primaryColor, 0.7),
    hoverColor: lightenColor(primaryColor, 0.8)
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