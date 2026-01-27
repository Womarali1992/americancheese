/**
 * Simplified Theme Provider
 *
 * A clean, simple theme provider that handles both global AND project-specific themes.
 * Automatically detects project from URL and applies the correct theme.
 * No page reloads, no complex event systems - just React state and context.
 */

import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
import { useLocation } from 'wouter';
import { useQuery } from '@tanstack/react-query';
import {
  THEMES,
  ColorTheme,
  getGlobalTheme,
  setGlobalTheme,
  onThemeChange
} from '@/lib/theme-system';
import { getProjectTheme, applyProjectTheme } from '@/lib/project-themes';

interface ThemeContextType {
  globalTheme: ColorTheme;
  activeThemeName: string;
  currentProjectId: number | null;
  setTheme: (themeKey: string) => void;
  applyProjectThemeById: (projectId: number) => void;
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
  const [activeThemeName, setActiveThemeName] = useState<string>('Earth Tone');
  const [location] = useLocation();

  // Extract projectId from URL patterns like /projects/123 or /projects/123/tasks
  const currentProjectId = useMemo(() => {
    const match = location.match(/\/projects\/(\d+)/);
    return match ? parseInt(match[1]) : null;
  }, [location]);

  // Fetch project data when we're on a project page
  const { data: currentProject } = useQuery({
    queryKey: ['/api/projects', currentProjectId],
    queryFn: async () => {
      if (!currentProjectId) return null;
      const response = await fetch(`/api/projects/${currentProjectId}`);
      if (!response.ok) return null;
      return response.json();
    },
    enabled: !!currentProjectId,
    staleTime: 30000, // Cache for 30 seconds to avoid refetching
  });

  // Initialize theme state on mount
  useEffect(() => {
    setGlobalThemeState(getGlobalTheme());
  }, []);

  // Listen for theme changes from other sources
  useEffect(() => {
    const unsubscribe = onThemeChange(() => {
      setGlobalThemeState(getGlobalTheme());
    });
    return unsubscribe;
  }, []);

  // Auto-apply project theme when navigating to a project page
  useEffect(() => {
    if (currentProjectId && currentProject?.colorTheme) {
      // Apply project-specific theme
      const theme = getProjectTheme(currentProject.colorTheme, currentProjectId);
      applyProjectTheme(theme, currentProjectId);
      setActiveThemeName(currentProject.colorTheme);
    } else if (!currentProjectId) {
      // Not on a project page - apply global theme
      const defaultTheme = getProjectTheme('Earth Tone');
      applyProjectTheme(defaultTheme);
      setActiveThemeName('Earth Tone');
    }
  }, [currentProjectId, currentProject?.colorTheme]);

  const setTheme = useCallback((themeKey: string) => {
    setGlobalTheme(themeKey);
    setActiveThemeName(themeKey);
  }, []);

  // Utility function for pages that need to apply a project theme manually
  // (e.g., when filtering by project on dashboard/tasks pages)
  const applyProjectThemeById = useCallback((projectId: number) => {
    // This will be called by pages when they filter by project
    // The actual theme application happens via the filter's useEffect
  }, []);

  return (
    <ThemeContext.Provider value={{
      globalTheme,
      activeThemeName,
      currentProjectId,
      setTheme,
      applyProjectThemeById,
      availableThemes: THEMES
    }}>
      {children}
    </ThemeContext.Provider>
  );
}

export default SimpleThemeProvider;