/**
 * Dynamic Color Management System
 * 
 * This module provides a comprehensive color system that ensures all colors
 * throughout the application update when the theme changes. It replaces
 * hardcoded colors with theme-aware color functions.
 */

import { getActiveColorTheme, ColorTheme } from './color-themes';

/**
 * Get theme-aware colors for UI elements
 */
export function getUIColors(theme?: ColorTheme) {
  const activeTheme = theme || getActiveColorTheme();
  
  return {
    // Primary navigation and accent colors
    primary: activeTheme.tier1.structural,
    secondary: activeTheme.tier1.systems,
    accent: activeTheme.tier1.finishings,
    
    // Status colors that adapt to theme
    success: lightenColor(activeTheme.tier1.structural, 0.2),
    warning: lightenColor(activeTheme.tier1.finishings, 0.1),
    error: darkenColor(activeTheme.tier1.sheathing, 0.1),
    info: lightenColor(activeTheme.tier1.systems, 0.1),
    
    // Material and labor chart colors
    materialColor: activeTheme.tier1.finishings,
    laborColor: activeTheme.tier1.systems,
    
    // Project-specific colors
    projectColors: [
      activeTheme.tier1.structural,
      activeTheme.tier1.systems,
      activeTheme.tier1.sheathing,
      activeTheme.tier1.finishings,
      activeTheme.tier2.foundation || activeTheme.tier1.structural,
      activeTheme.tier2.framing || activeTheme.tier1.structural,
      activeTheme.tier2.electrical || activeTheme.tier1.systems,
      activeTheme.tier2.plumbing || activeTheme.tier1.systems,
    ]
  };
}

/**
 * Get project-specific color with theme awareness
 */
export function getProjectColor(projectId: number, theme?: ColorTheme): {
  borderColor: string;
  bgColor: string;
  iconBg: string;
} {
  const colors = getUIColors(theme);
  const colorIndex = (projectId - 1) % colors.projectColors.length;
  const baseColor = colors.projectColors[colorIndex];
  
  return {
    borderColor: baseColor,
    bgColor: lightenColor(baseColor, 0.9),
    iconBg: lightenColor(baseColor, 0.8)
  };
}

/**
 * Get module-specific colors that adapt to theme
 */
export function getModuleColors(module: string, theme?: ColorTheme): {
  primaryColor: string;
  backgroundColor: string;
  textColor: string;
  borderColor: string;
  hoverColor: string;
} {
  const activeTheme = theme || getActiveColorTheme();
  
  // Module-specific color mappings that use theme colors
  const moduleColorMap: Record<string, keyof typeof activeTheme.tier1> = {
    'dashboard': 'structural',
    'project': 'structural',
    'tasks': 'systems',
    'task': 'systems',
    'materials': 'finishings',
    'material': 'finishings',
    'contacts': 'sheathing',
    'contact': 'sheathing',
    'labor': 'systems',
    'expense': 'finishings',
    'admin': 'structural'
  };
  
  const colorKey = moduleColorMap[module.toLowerCase()] || 'structural';
  const primaryColor = activeTheme.tier1[colorKey];
  
  return {
    primaryColor,
    backgroundColor: lightenColor(primaryColor, 0.95),
    textColor: darkenColor(primaryColor, 0.3),
    borderColor: lightenColor(primaryColor, 0.7),
    hoverColor: lightenColor(primaryColor, 0.85)
  };
}

/**
 * Get status colors that adapt to theme
 */
export function getStatusColors(status: string, theme?: ColorTheme): {
  backgroundColor: string;
  textColor: string;
  borderColor: string;
} {
  const activeTheme = theme || getActiveColorTheme();
  
  // Map statuses to theme color keys
  const statusColorMap: Record<string, keyof typeof activeTheme.tier1> = {
    'completed': 'structural',
    'active': 'systems',
    'in_progress': 'systems',
    'delayed': 'sheathing',
    'on_hold': 'finishings',
    'not_started': 'structural'
  };
  
  const colorKey = statusColorMap[status.toLowerCase()] || 'structural';
  const baseColor = activeTheme.tier1[colorKey];
  
  return {
    backgroundColor: lightenColor(baseColor, 0.9),
    textColor: darkenColor(baseColor, 0.2),
    borderColor: lightenColor(baseColor, 0.6)
  };
}

/**
 * Get chart colors that adapt to theme
 */
export function getChartColors(theme?: ColorTheme): {
  materialColor: string;
  laborColor: string;
  expenseColor: string;
  progressColor: string;
  backgroundColors: string[];
  borderColors: string[];
} {
  const activeTheme = theme || getActiveColorTheme();
  
  return {
    materialColor: activeTheme.tier1.finishings,
    laborColor: activeTheme.tier1.systems,
    expenseColor: activeTheme.tier1.sheathing,
    progressColor: activeTheme.tier1.structural,
    backgroundColors: [
      lightenColor(activeTheme.tier1.structural, 0.8),
      lightenColor(activeTheme.tier1.systems, 0.8),
      lightenColor(activeTheme.tier1.sheathing, 0.8),
      lightenColor(activeTheme.tier1.finishings, 0.8),
    ],
    borderColors: [
      activeTheme.tier1.structural,
      activeTheme.tier1.systems,
      activeTheme.tier1.sheathing,
      activeTheme.tier1.finishings,
    ]
  };
}

/**
 * Utility function to lighten a hex color
 */
export function lightenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.min(255, Math.round((num >> 16) + (255 - (num >> 16)) * amount));
  const g = Math.min(255, Math.round(((num >> 8) & 0x00FF) + (255 - ((num >> 8) & 0x00FF)) * amount));
  const b = Math.min(255, Math.round((num & 0x0000FF) + (255 - (num & 0x0000FF)) * amount));
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Utility function to darken a hex color
 */
export function darkenColor(hex: string, amount: number): string {
  const num = parseInt(hex.replace('#', ''), 16);
  const r = Math.max(0, Math.round((num >> 16) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0x00FF) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0x0000FF) * (1 - amount)));
  
  return `#${((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1)}`;
}

/**
 * Convert hex color to RGB values
 */
export function hexToRgb(hex: string): { r: number; g: number; b: number } {
  const num = parseInt(hex.replace('#', ''), 16);
  return {
    r: (num >> 16) & 255,
    g: (num >> 8) & 255,
    b: num & 255
  };
}

/**
 * Convert hex color to RGB string
 */
export function hexToRgbString(hex: string): string {
  const { r, g, b } = hexToRgb(hex);
  return `${r}, ${g}, ${b}`;
}

/**
 * Apply theme colors to CSS custom properties
 */
export function applyThemeColorsToCSS(theme?: ColorTheme): void {
  const activeTheme = theme || getActiveColorTheme();
  const colors = getUIColors(activeTheme);
  
  // Apply theme colors as CSS custom properties
  document.documentElement.style.setProperty('--color-primary', colors.primary);
  document.documentElement.style.setProperty('--color-secondary', colors.secondary);
  document.documentElement.style.setProperty('--color-accent', colors.accent);
  document.documentElement.style.setProperty('--color-success', colors.success);
  document.documentElement.style.setProperty('--color-warning', colors.warning);
  document.documentElement.style.setProperty('--color-error', colors.error);
  document.documentElement.style.setProperty('--color-info', colors.info);
  document.documentElement.style.setProperty('--color-material', colors.materialColor);
  document.documentElement.style.setProperty('--color-labor', colors.laborColor);
  
  // Apply tier1 colors
  document.documentElement.style.setProperty('--tier1-structural', activeTheme.tier1.structural);
  document.documentElement.style.setProperty('--tier1-systems', activeTheme.tier1.systems);
  document.documentElement.style.setProperty('--tier1-sheathing', activeTheme.tier1.sheathing);
  document.documentElement.style.setProperty('--tier1-finishings', activeTheme.tier1.finishings);
  
  // Apply RGB values for transparency support
  document.documentElement.style.setProperty('--tier1-structural-rgb', hexToRgbString(activeTheme.tier1.structural));
  document.documentElement.style.setProperty('--tier1-systems-rgb', hexToRgbString(activeTheme.tier1.systems));
  document.documentElement.style.setProperty('--tier1-sheathing-rgb', hexToRgbString(activeTheme.tier1.sheathing));
  document.documentElement.style.setProperty('--tier1-finishings-rgb', hexToRgbString(activeTheme.tier1.finishings));
  
  // Apply tier2 colors
  Object.entries(activeTheme.tier2).forEach(([key, value]) => {
    document.documentElement.style.setProperty(`--tier2-${key}`, value);
    document.documentElement.style.setProperty(`--tier2-${key}-rgb`, hexToRgbString(value));
  });
  
  console.log('Applied comprehensive theme colors to CSS custom properties');
}

/**
 * Get CSS custom property value
 */
export function getCSSCustomProperty(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}