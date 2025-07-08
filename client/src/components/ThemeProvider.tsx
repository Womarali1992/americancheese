import React, { createContext, useContext, useEffect, useState } from 'react';
import { COLOR_THEMES, ColorTheme, EARTH_TONE_THEME } from '@/lib/color-themes';

// Create a context for the theme
interface ThemeContextType {
  currentTheme: ColorTheme;
  setTheme: (theme: ColorTheme | string) => void;
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: EARTH_TONE_THEME,
  setTheme: () => {}
});

// Custom hook to use the theme context
export const useTheme = () => useContext(ThemeContext);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(EARTH_TONE_THEME);

  // Function to apply theme colors to CSS variables
  const applyThemeToDOM = (theme: ColorTheme) => {
    // Apply tier1 category colors
    document.documentElement.style.setProperty('--tier1-structural', theme.tier1.structural);
    document.documentElement.style.setProperty('--tier1-systems', theme.tier1.systems);
    document.documentElement.style.setProperty('--tier1-sheathing', theme.tier1.sheathing);
    document.documentElement.style.setProperty('--tier1-finishings', theme.tier1.finishings);
    
    // Apply tier1 RGB values for alpha transparency support
    const hexToRgb = (hex: string) => {
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Parse the hex values
      const r = parseInt(hex.substring(0, 2), 16);
      const g = parseInt(hex.substring(2, 4), 16);
      const b = parseInt(hex.substring(4, 6), 16);
      
      return `${r}, ${g}, ${b}`;
    };
    
    document.documentElement.style.setProperty('--tier1-structural-rgb', hexToRgb(theme.tier1.structural));
    document.documentElement.style.setProperty('--tier1-systems-rgb', hexToRgb(theme.tier1.systems));
    document.documentElement.style.setProperty('--tier1-sheathing-rgb', hexToRgb(theme.tier1.sheathing));
    document.documentElement.style.setProperty('--tier1-finishings-rgb', hexToRgb(theme.tier1.finishings));
    
    // Apply tier2 category colors - Add tier2 colors to variables
    for (const [key, value] of Object.entries(theme.tier2)) {
      document.documentElement.style.setProperty(`--tier2-${key}`, value);
      document.documentElement.style.setProperty(`--tier2-${key}-rgb`, hexToRgb(value));
    }
    
    // Apply colors for common custom categories that may not be in predefined themes
    const customCategoryColors = {
      'tools': '#20B2AA', // Sea green - consistent with what user observed
      'prompting': '#9370DB', // Medium purple
      'api': '#FF6347', // Tomato
      'database': '#4682B4', // Steel blue
      'testing': '#32CD32', // Lime green
      'documentation': '#DAA520', // Golden rod
      'security': '#DC143C', // Crimson
    };
    
    // Set CSS variables for custom categories
    for (const [category, color] of Object.entries(customCategoryColors)) {
      document.documentElement.style.setProperty(`--tier2-${category}`, color);
      document.documentElement.style.setProperty(`--tier2-${category}-rgb`, hexToRgb(color));
    }
    
    console.log('ThemeProvider: Applied theme colors to CSS variables', {
      structural: theme.tier1.structural,
      systems: theme.tier1.systems,
      sheathing: theme.tier1.sheathing,
      finishings: theme.tier1.finishings
    });
  };

  // Function to set the active theme
  const setTheme = (theme: ColorTheme | string) => {
    if (typeof theme === 'string') {
      // Try to find theme by name or key
      const themeKey = theme.toLowerCase().replace(/\s+/g, '-');
      if (COLOR_THEMES[themeKey]) {
        setCurrentTheme(COLOR_THEMES[themeKey]);
        localStorage.setItem('colorTheme', themeKey);
      } else {
        console.error(`Theme "${theme}" not found, using default theme`);
        setCurrentTheme(EARTH_TONE_THEME);
        localStorage.setItem('colorTheme', 'earth-tone');
      }
    } else {
      // Direct theme object provided
      setCurrentTheme(theme);
      // Save to localStorage by finding matching theme name
      for (const [key, value] of Object.entries(COLOR_THEMES)) {
        if (value.name === theme.name) {
          localStorage.setItem('colorTheme', key);
          break;
        }
      }
    }
  };

  // Initialize theme from localStorage on mount
  useEffect(() => {
    const savedTheme = localStorage.getItem('colorTheme');
    if (savedTheme) {
      if (COLOR_THEMES[savedTheme]) {
        setCurrentTheme(COLOR_THEMES[savedTheme]);
      } else {
        // Try to normalize the theme name
        const normalizedTheme = savedTheme.toLowerCase().replace(/\s+/g, '-');
        if (COLOR_THEMES[normalizedTheme]) {
          setCurrentTheme(COLOR_THEMES[normalizedTheme]);
        }
      }
    }
  }, []);

  // Apply theme changes to DOM
  useEffect(() => {
    applyThemeToDOM(currentTheme);
    
    // Update the global window.currentTheme for backward compatibility
    (window as any).currentTheme = currentTheme;
  }, [currentTheme]);

  // Listen for theme-changed events from legacy code
  useEffect(() => {
    const handleThemeChangeEvent = (e: CustomEvent) => {
      if (e.detail && e.detail.theme) {
        console.log('ThemeProvider: Detected theme change event', e.detail);
        setCurrentTheme(e.detail.theme);
      }
    };

    window.addEventListener('theme-changed', handleThemeChangeEvent as EventListener);
    return () => {
      window.removeEventListener('theme-changed', handleThemeChangeEvent as EventListener);
    };
  }, []);

  return (
    <ThemeContext.Provider value={{ currentTheme, setTheme }}>
      {children}
    </ThemeContext.Provider>
  );
}