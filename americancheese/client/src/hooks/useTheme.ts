/**
 * @deprecated This hook is deprecated. Use useUnifiedColors() from '@/hooks/useUnifiedColors' instead.
 * 
 * Migration guide:
 * - Replace useTheme() with useUnifiedColors(projectId)
 * - Use getTier1Color, getTier2Color, getStatusColor from the returned object
 */

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
    tier1: (category: string) => {
      // Use the theme system's getTier1Color which properly handles all mappings
      // IMPORTANT: Pass currentTheme to ensure we use the correct theme
      return getTier1Color(category, projectId, currentTheme);
    },
    tier2: (category: string, parentCategory?: string) => {
      // If no parent category provided, use the simple tier2 color lookup
      if (!parentCategory) {
        return getTier2Color(category, projectId, undefined, currentTheme);
      }

      // Otherwise, use parent-specific color mapping
      const normalizedParent = parentCategory.toLowerCase().replace(/[_\s-]/g, '');

      // Map parent categories to their tier2 color key arrays
      let tier2ColorKeys: string[] = [];

      if (normalizedParent === 'push' || normalizedParent === 'subcategory1' || normalizedParent === 'subcategoryone' || normalizedParent === 'structural' || normalizedParent === 'productmanagement') {
        tier2ColorKeys = ['tier2_1', 'tier2_2', 'tier2_3', 'tier2_4', 'tier2_5'];
      } else if (normalizedParent === 'pull' || normalizedParent === 'subcategory2' || normalizedParent === 'subcategorytwo' || normalizedParent === 'systems' || normalizedParent === 'softwareengineering') {
        tier2ColorKeys = ['tier2_6', 'tier2_7', 'tier2_8'];
      } else if (normalizedParent === 'legs' || normalizedParent === 'subcategory3' || normalizedParent === 'subcategorythree' || normalizedParent === 'sheathing' || normalizedParent === 'dataanalytics') {
        tier2ColorKeys = ['tier2_9', 'tier2_10', 'tier2_11', 'tier2_12', 'tier2_13'];
      } else if (normalizedParent === 'cardio' || normalizedParent === 'subcategory4' || normalizedParent === 'subcategoryfour' || normalizedParent === 'finishings' || normalizedParent === 'businessoperations') {
        tier2ColorKeys = ['tier2_14', 'tier2_15', 'tier2_16', 'tier2_17', 'tier2_18', 'tier2_19', 'tier2_20'];
      } else {
        tier2ColorKeys = ['tier2_1', 'tier2_2', 'tier2_3', 'tier2_4', 'tier2_5'];
      }

      // Use hash of category name to pick one color from the appropriate group
      const hash = category.split('').reduce((acc, char) => {
        return char.charCodeAt(0) + ((acc << 5) - acc);
      }, 0);

      const colorIndex = Math.abs(hash) % tier2ColorKeys.length;
      const tier2Key = tier2ColorKeys[colorIndex];

      // Get color directly from currentTheme
      const color = currentTheme.tier2?.[tier2Key as keyof typeof currentTheme.tier2];

      if (!color) {
        console.warn(`⚠️ No color found for ${tier2Key} in currentTheme.tier2`);
        return currentTheme.secondary;
      }

      return color;
    },
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
    getTier1Color: (category: string, pid?: number) => getTier1Color(category, pid ?? projectId, currentTheme),
    getTier2Color: (category: string, pid?: number, parentCategory?: string) => getTier2Color(category, pid ?? projectId, parentCategory, currentTheme),
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