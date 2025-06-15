/**
 * Theme Initialization System
 * 
 * This module handles automatic theme loading and application when the app starts,
 * ensuring all colors (including manually selected ones) use the current theme.
 */

import { getActiveColorTheme, COLOR_THEMES } from './color-themes';
import { applyThemeColorsToCSS } from './dynamic-colors';

/**
 * Initialize theme system on app startup
 */
export function initializeTheme(): void {
  try {
    // Load theme from localStorage or use default
    const savedThemeKey = localStorage.getItem('colorTheme');
    let activeTheme = getActiveColorTheme();
    
    if (savedThemeKey && COLOR_THEMES[savedThemeKey]) {
      activeTheme = COLOR_THEMES[savedThemeKey];
    }
    
    // Apply theme colors to CSS variables immediately
    applyThemeColorsToCSS(activeTheme);
    
    // Store theme globally for component access
    (window as any).currentTheme = activeTheme;
    
    // Set up theme change listener for components
    setupThemeChangeListener();
    
    console.log('Theme system initialized with:', activeTheme.name);
  } catch (error) {
    console.error('Error initializing theme system:', error);
  }
}

/**
 * Set up event listener for theme changes
 */
function setupThemeChangeListener(): void {
  window.addEventListener('themeChanged', (event: Event) => {
    const customEvent = event as CustomEvent;
    const { theme } = customEvent.detail;
    
    // Apply new theme colors
    applyThemeColorsToCSS(theme);
    
    // Update global theme reference
    (window as any).currentTheme = theme;
    
    // Force re-render of any components that might be using inline styles
    triggerComponentRefresh();
    
    console.log('Theme changed to:', theme.name);
  });
}

/**
 * Trigger refresh of components that might need to update
 */
function triggerComponentRefresh(): void {
  // Dispatch a custom event that components can listen to
  const refreshEvent = new CustomEvent('forceComponentRefresh');
  window.dispatchEvent(refreshEvent);
  
  // Add and remove a class to trigger CSS transitions
  document.body.classList.add('theme-updating');
  setTimeout(() => {
    document.body.classList.remove('theme-updating');
  }, 100);
}

/**
 * Get current theme for components to use
 */
export function getCurrentTheme() {
  return (window as any).currentTheme || getActiveColorTheme();
}

/**
 * Update theme and trigger all necessary updates
 */
export function updateTheme(theme: any): void {
  // Save to localStorage
  const themeKey = theme.name.toLowerCase().replace(/\s+/g, '-');
  localStorage.setItem('colorTheme', themeKey);
  
  // Apply CSS changes
  applyThemeColorsToCSS(theme);
  
  // Update global reference
  (window as any).currentTheme = theme;
  
  // Trigger theme change event
  const themeChangeEvent = new CustomEvent('themeChanged', { 
    detail: { theme }
  });
  window.dispatchEvent(themeChangeEvent);
}

/**
 * Apply theme on DOM ready
 */
if (typeof window !== 'undefined') {
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initializeTheme);
  } else {
    initializeTheme();
  }
}