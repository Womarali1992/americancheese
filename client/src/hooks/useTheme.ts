/**
 * Simplified Theme Hook
 * 
 * Provides a clean, simple interface for theme functionality throughout the app.
 * Replaces the complex useUnifiedColors and multiple theme hooks.
 */

import { useState, useEffect, useCallback } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import {
  THEMES,
  ColorTheme,
  getGlobalTheme,
  setGlobalTheme,
  getProjectTheme,
  setProjectTheme,
  getTier1Color,
  getTier2Color,
  getCategoryColor,
  getGenericColor,
  onThemeChange,
  colorUtils
} from '@/lib/theme-system';
import { apiRequest } from '@/lib/queryClient';

interface ProjectData {
  id: number;
  colorTheme?: string | null;
  useGlobalTheme?: boolean;
}

/**
 * Main theme hook - handles both global and project-specific themes
 */
export function useTheme(projectId?: number) {
  const [currentTheme, setCurrentTheme] = useState<ColorTheme>(() => 
    getProjectTheme(projectId)
  );
  
  const queryClient = useQueryClient();

  // Get project data if projectId is provided
  const { data: project } = useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}`] : undefined,
    enabled: !!projectId,
  }) as { data?: ProjectData };

  // Update theme when project data changes
  useEffect(() => {
    if (project) {
      if (project.colorTheme && !project.useGlobalTheme) {
        setProjectTheme(project.id, project.colorTheme);
      } else {
        // Clear any existing project theme override when using global theme
        setProjectTheme(project.id, null);
      }
    }
    // Pass project data directly to avoid race conditions
    setCurrentTheme(getProjectTheme(projectId, project));
  }, [project, projectId]);

  // Listen for theme changes
  useEffect(() => {
    const unsubscribe = onThemeChange(() => {
      const newTheme = getProjectTheme(projectId, project);
      setCurrentTheme(newTheme);
    });
    return unsubscribe;
  }, [projectId, project]);

  // Update global theme
  const updateGlobalTheme = useCallback((themeKey: string) => {
    setGlobalTheme(themeKey);
  }, []);

  // Update project theme mutation
  const updateProjectTheme = useMutation({
    mutationFn: async ({ projectId, themeKey, useGlobalTheme }: {
      projectId: number;
      themeKey: string | null;
      useGlobalTheme: boolean;
    }) => {
      const response = await apiRequest(`/api/projects/${projectId}/theme`, 'PUT', {
        colorTheme: themeKey,
        useGlobalTheme
      });
      return await response.json();
    },
    onSuccess: (result, { projectId }) => {
      // Invalidate the project query to trigger the useEffect that will handle theme updates
      queryClient.invalidateQueries({ queryKey: [`/api/projects/${projectId}`] });
    }
  });

  // Color functions with current project context
  const getColor = {
    tier1: (category: string) => getTier1Color(category, projectId),
    tier2: (category: string) => getTier2Color(category, projectId),
    category: (category: string) => getCategoryColor(category, projectId),
    generic: (category: string | number) => getGenericColor(category, projectId),
  };

  return {
    // Current theme info
    currentTheme,
    isProjectSpecific: projectId ? !!project?.colorTheme && !project?.useGlobalTheme : false,
    
    // Available themes
    availableThemes: THEMES,
    
    // Theme update functions
    updateGlobalTheme,
    updateProjectTheme: updateProjectTheme.mutateAsync,
    isUpdating: updateProjectTheme.isPending,
    
    // Color functions
    getColor,
    colorUtils,
    
    // Raw color functions for advanced usage
    getTier1Color: (category: string, pid?: number) => getTier1Color(category, pid ?? projectId),
    getTier2Color: (category: string, pid?: number) => getTier2Color(category, pid ?? projectId),
    getCategoryColor: (category: string, pid?: number) => getCategoryColor(category, pid ?? projectId),
    getGenericColor: (category: string | number, pid?: number) => getGenericColor(category, pid ?? projectId),
  };
}

/**
 * Global theme hook (no project context)
 */
export function useGlobalTheme() {
  return useTheme();
}

/**
 * Project-specific theme hook
 */
export function useProjectTheme(projectId: number) {
  return useTheme(projectId);
}

/**
 * Simple hook for getting colors without full theme context
 */
export function useColors(projectId?: number) {
  const { getColor, getTier1Color, getTier2Color, getCategoryColor } = useTheme(projectId);
  
  return {
    getColor,
    getTier1Color,
    getTier2Color, 
    getCategoryColor,
    utils: colorUtils
  };
}

export default useTheme;