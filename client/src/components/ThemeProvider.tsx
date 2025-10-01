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
    // Apply tier1 category colors - both old and new structures
    // New generic structure
    document.documentElement.style.setProperty('--tier1-subcategory1', theme.tier1.subcategory1);
    document.documentElement.style.setProperty('--tier1-subcategory2', theme.tier1.subcategory2);
    document.documentElement.style.setProperty('--tier1-subcategory3', theme.tier1.subcategory3);
    document.documentElement.style.setProperty('--tier1-subcategory4', theme.tier1.subcategory4);
    document.documentElement.style.setProperty('--tier1-subcategory5', theme.tier1.subcategory5);
    
    // Apply tier1 RGB values for alpha transparency support
    const hexToRgb = (hex: string) => {
      // Handle undefined/null values
      if (!hex || typeof hex !== 'string') {
        return '0, 0, 0'; // fallback to black
      }
      
      // Remove # if present
      hex = hex.replace('#', '');
      
      // Handle short hex codes (e.g., "fff")
      if (hex.length === 3) {
        hex = hex[0] + hex[0] + hex[1] + hex[1] + hex[2] + hex[2];
      }
      
      // Ensure we have a valid 6-character hex
      if (hex.length !== 6) {
        return '0, 0, 0'; // fallback to black
      }
      
      // Parse the hex values
      const r = parseInt(hex.substring(0, 2), 16) || 0;
      const g = parseInt(hex.substring(2, 4), 16) || 0;
      const b = parseInt(hex.substring(4, 6), 16) || 0;
      
      return `${r}, ${g}, ${b}`;
    };
    
    // New structure RGB values
    document.documentElement.style.setProperty('--tier1-subcategory1-rgb', hexToRgb(theme.tier1.subcategory1));
    document.documentElement.style.setProperty('--tier1-subcategory2-rgb', hexToRgb(theme.tier1.subcategory2));
    document.documentElement.style.setProperty('--tier1-subcategory3-rgb', hexToRgb(theme.tier1.subcategory3));
    document.documentElement.style.setProperty('--tier1-subcategory4-rgb', hexToRgb(theme.tier1.subcategory4));
    document.documentElement.style.setProperty('--tier1-subcategory5-rgb', hexToRgb(theme.tier1.subcategory5));
    
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
      subcategory1: theme.tier1.subcategory1,
      subcategory2: theme.tier1.subcategory2,
      subcategory3: theme.tier1.subcategory3,
      subcategory4: theme.tier1.subcategory4,
      subcategory5: theme.tier1.subcategory5
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

    // Automatically refresh the page after theme changes to ensure all components reflect the new theme
    console.log('Theme applied successfully, refreshing page to ensure complete theme update...');
    setTimeout(() => {
      window.location.reload();
    }, 500); // Small delay to allow all theme changes to complete
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