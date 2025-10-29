/**
 * Simplified Theme Provider
 * 
 * A clean, simple theme provider that replaces the complex ThemeProvider.
 * No page reloads, no complex event systems - just React state and context.
 */

import React, { createContext, useContext, useEffect, useState } from 'react';
import { 
  THEMES, 
  ColorTheme, 
  getGlobalTheme, 
  setGlobalTheme,
  onThemeChange
} from '@/lib/theme-system';

interface ThemeContextType {
  globalTheme: ColorTheme;
  setTheme: (themeKey: string) => void;
  availableThemes: typeof THEMES;
}

const ThemeContext = createContext<ThemeContextType | null>(null);

export function useThemeContext() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useThemeContext must be used within a SimpleThemeProvider');
  }
  return context;
}

interface SimpleThemeProviderProps {
  children: React.ReactNode;
}

export function SimpleThemeProvider({ children }: SimpleThemeProviderProps) {
  const [globalTheme, setGlobalThemeState] = useState<ColorTheme>(getGlobalTheme);

  // Initialize theme state on mount (theme-system.ts auto-initializes)
  useEffect(() => {
    setGlobalThemeState(getGlobalTheme());
  }, []);

  // Listen for theme changes
  useEffect(() => {
    const unsubscribe = onThemeChange(() => {
      setGlobalThemeState(getGlobalTheme());
    });
    return unsubscribe;
  }, []);

  const setTheme = (themeKey: string) => {
    setGlobalTheme(themeKey);
  };

  return (
    <ThemeContext.Provider value={{
      globalTheme,
      setTheme,
      availableThemes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default SimpleThemeProvider;