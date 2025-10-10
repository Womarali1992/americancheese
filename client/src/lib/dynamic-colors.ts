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
  
  // Safety check to ensure theme object is valid
  if (!activeTheme || !activeTheme.tier1) {
    console.error('getUIColors: Invalid theme object:', activeTheme);
    // Return a default color scheme as fallback
    return {
      primary: '#556b2f',
      secondary: '#445566',
      accent: '#9b2c2c',
      success: '#4ade80',
      warning: '#fbbf24',
      error: '#f87171',
      info: '#60a5fa',
      materialColor: '#9b2c2c',
      laborColor: '#445566',
      projectColors: ['#556b2f', '#445566', '#9b2c2c', '#8b4513']
    };
  }
  
  return {
    // Primary navigation and accent colors
    primary: activeTheme.tier1.subcategory1,
    secondary: activeTheme.tier1.subcategory2,
    accent: activeTheme.tier1.subcategory3,
    
    // Status colors that adapt to theme
    success: lightenColor(activeTheme.tier1.subcategory1, 0.2),
    warning: lightenColor(activeTheme.tier1.subcategory3, 0.1),
    error: darkenColor(activeTheme.tier1.subcategory4, 0.1),
    info: lightenColor(activeTheme.tier1.subcategory2, 0.1),
    
    // Material and labor chart colors
    materialColor: activeTheme.tier1.subcategory3,
    laborColor: activeTheme.tier1.subcategory2,
    
    // Project-specific colors
    projectColors: [
      activeTheme.tier1.subcategory1,
      activeTheme.tier1.subcategory2,
      activeTheme.tier1.subcategory4,
      activeTheme.tier1.subcategory3,
      activeTheme.tier2.foundation || activeTheme.tier1.subcategory1,
      activeTheme.tier2.framing || activeTheme.tier1.subcategory1,
      activeTheme.tier2.electrical || activeTheme.tier1.subcategory2,
      activeTheme.tier2.plumbing || activeTheme.tier1.subcategory2,
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
    'dashboard': 'subcategory1',
    'project': 'subcategory1',
    'tasks': 'subcategory2',
    'task': 'subcategory2',
    'materials': 'subcategory3',
    'material': 'subcategory3',
    'contacts': 'subcategory4',
    'contact': 'subcategory4',
    'labor': 'subcategory2',
    'expense': 'subcategory3',
    'admin': 'subcategory1'
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
  
  const colorKey = statusColorMap[(status || '').toLowerCase()] || 'structural';
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
    materialColor: activeTheme.tier1.subcategory3,
    laborColor: activeTheme.tier1.subcategory2,
    expenseColor: activeTheme.tier1.subcategory4,
    progressColor: activeTheme.tier1.subcategory1,
    backgroundColors: [
      lightenColor(activeTheme.tier1.subcategory1, 0.8),
      lightenColor(activeTheme.tier1.subcategory2, 0.8),
      lightenColor(activeTheme.tier1.subcategory4, 0.8),
      lightenColor(activeTheme.tier1.subcategory3, 0.8),
    ],
    borderColors: [
      activeTheme.tier1.subcategory1,
      activeTheme.tier1.subcategory2,
      activeTheme.tier1.subcategory4,
      activeTheme.tier1.subcategory3,
    ]
  };
}

/**
 * Utility function to lighten a hex color
 */
export function lightenColor(hex: string, amount: number): string {
  if (!hex || typeof hex !== 'string') {
    console.warn('lightenColor: Invalid hex color provided:', hex);
    return '#000000'; // Default fallback
  }
  
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
  if (!hex || typeof hex !== 'string') {
    console.warn('darkenColor: Invalid hex color provided:', hex);
    return '#000000'; // Default fallback
  }
  
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
  if (!hex || typeof hex !== 'string') {
    console.warn('hexToRgb: Invalid hex color provided:', hex);
    return { r: 0, g: 0, b: 0 }; // Default fallback
  }
  
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
 * Get tier2 color based on tier1 parent category and tier2 category name
 */
export function getTier2ColorFromParent(tier1Category: string, tier2Category: string, theme?: ColorTheme): string {
  const activeTheme = theme || getActiveColorTheme();
  const normalizedParent = tier1Category.toLowerCase();

  // Map tier1 categories to their tier2 color index ranges
  let startIndex = 1;
  let rangeSize = 5;

  if (normalizedParent === 'software engineering' || normalizedParent === 'structural' || normalizedParent === 'push' || normalizedParent === 'subcategory1') {
    startIndex = 1;
    rangeSize = 5;
  } else if (normalizedParent === 'product management' || normalizedParent === 'systems' || normalizedParent === 'pull' || normalizedParent === 'subcategory2') {
    startIndex = 6;
    rangeSize = 5;
  } else if (normalizedParent === 'design / ux' || normalizedParent === 'sheathing' || normalizedParent === 'legs' || normalizedParent === 'subcategory3') {
    startIndex = 11;
    rangeSize = 5;
  } else if (normalizedParent === 'marketing / go-to-market (gtm)' || normalizedParent === 'marketing / go to market (gtm)' || normalizedParent === 'finishings' || normalizedParent === 'cardio' || normalizedParent === 'subcategory4') {
    startIndex = 16;
    rangeSize = 5;
  }

  // Use hash of tier2 category name to pick a color from the range
  const hash = tier2Category.split('').reduce((acc, char) => {
    return char.charCodeAt(0) + ((acc << 5) - acc);
  }, 0);

  const colorIndex = startIndex + (Math.abs(hash) % rangeSize);
  const tierKey = `tier2_${colorIndex}` as keyof typeof activeTheme.tier2;

  if (tierKey in activeTheme.tier2) {
    const color = activeTheme.tier2[tierKey];
    console.log(`getTier2ColorFromParent: ${tier1Category} → ${tier2Category} → ${tierKey} (index ${colorIndex}) = ${color}`);
    return color;
  }

  console.warn(`getTier2ColorFromParent: ${tier1Category} → ${tier2Category} → NO MATCH, using fallback`);
  return activeTheme.tier2.other || activeTheme.tier1.default;
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
  document.documentElement.style.setProperty('--tier1-structural', activeTheme.tier1.subcategory1);
  document.documentElement.style.setProperty('--tier1-systems', activeTheme.tier1.subcategory2);
  document.documentElement.style.setProperty('--tier1-sheathing', activeTheme.tier1.subcategory4);
  document.documentElement.style.setProperty('--tier1-finishings', activeTheme.tier1.subcategory3);
  
  // Apply RGB values for transparency support
  document.documentElement.style.setProperty('--tier1-structural-rgb', hexToRgbString(activeTheme.tier1.subcategory1));
  document.documentElement.style.setProperty('--tier1-systems-rgb', hexToRgbString(activeTheme.tier1.subcategory2));
  document.documentElement.style.setProperty('--tier1-sheathing-rgb', hexToRgbString(activeTheme.tier1.subcategory4));
  document.documentElement.style.setProperty('--tier1-finishings-rgb', hexToRgbString(activeTheme.tier1.subcategory3));
  
  // Apply tier2 indexed colors (tier2_1 through tier2_20) directly
  for (let i = 1; i <= 20; i++) {
    const tierKey = `tier2_${i}` as keyof typeof activeTheme.tier2;
    if (tierKey in activeTheme.tier2) {
      const color = activeTheme.tier2[tierKey];
      document.documentElement.style.setProperty(`--${tierKey}`, color);
      document.documentElement.style.setProperty(`--${tierKey}-rgb`, hexToRgbString(color));
    }
  }

  // Create CSS variables for known tier2 categories using parent-based color mapping
  const knownTier2Categories = [
    // Software Engineering tier2 (tier2_1 to tier2_5)
    { tier1: 'Software Engineering', tier2: 'DevOps & Infrastructure' },
    { tier1: 'Software Engineering', tier2: 'Architecture & Platform' },
    { tier1: 'Software Engineering', tier2: 'Application Development' },
    { tier1: 'Software Engineering', tier2: 'Quality & Security' },

    // Product Management tier2 (tier2_6 to tier2_8)
    { tier1: 'Product Management', tier2: 'Strategy & Vision' },
    { tier1: 'Product Management', tier2: 'Discovery & Research' },
    { tier1: 'Product Management', tier2: 'Roadmap & Prioritization' },
    { tier1: 'Product Management', tier2: 'Delivery & Lifecycle' },

    // Design / UX tier2 (tier2_9 to tier2_13)
    { tier1: 'Design / UX', tier2: 'Research and Usability' },
    { tier1: 'Design / UX', tier2: 'UI/UX Design' },
    { tier1: 'Design / UX', tier2: 'Visual Design' },
    { tier1: 'Design / UX', tier2: 'Interaction Design' },

    // Marketing / GTM tier2 (tier2_14 to tier2_20)
    { tier1: 'Marketing / Go-to-Market (GTM)', tier2: 'Positioning & Messaging' },
    { tier1: 'Marketing / Go-to-Market (GTM)', tier2: 'Demand Gen & Acquisition' },
    { tier1: 'Marketing / Go-to-Market (GTM)', tier2: 'Pricing & Packaging' },
    { tier1: 'Marketing / Go-to-Market (GTM)', tier2: 'Launch & Analytics' },
  ];

  knownTier2Categories.forEach(({ tier1, tier2 }) => {
    const color = getTier2ColorFromParent(tier1, tier2, activeTheme);
    const normalizedTier2 = tier2.toLowerCase();
    document.documentElement.style.setProperty(`--tier2-${normalizedTier2}`, color);
    document.documentElement.style.setProperty(`--tier2-${normalizedTier2}-rgb`, hexToRgbString(color));
    console.log(`CSS var --tier2-${normalizedTier2} = ${color} (parent: ${tier1})`);
  });

  console.log('Applied comprehensive theme colors to CSS custom properties');
}

/**
 * Get CSS custom property value
 */
export function getCSSCustomProperty(property: string): string {
  return getComputedStyle(document.documentElement).getPropertyValue(property).trim();
}