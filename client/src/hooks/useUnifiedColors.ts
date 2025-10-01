/**
 * Unified Color Hook
 * 
 * This hook provides a consistent interface for getting colors throughout the app.
 * It automatically handles admin panel data fetching and provides color functions
 * that respect the proper hierarchy.
 */

import { useMemo } from 'react';
import { useQuery } from "@tanstack/react-query";
import { useTier2CategoriesByTier1Name } from './useTemplateCategories';
import { 
  getTier1Color, 
  getTier2Color, 
  getStatusColor, 
  getCategoryColor,
  getTaskColors,
  formatCategoryName,
  formatTaskStatus,
  type CategoryData,
  type ProjectThemeData 
} from '@/lib/unified-color-system';
import { COLOR_THEMES } from '@/lib/color-themes';

/**
 * Main hook for unified color system
 */
export function useUnifiedColors(projectId?: number | null) {
  
  // Get admin panel category data
  const { 
    tier1Categories: dbTier1Categories = [], 
    tier2Categories: dbTier2Categories = [],
    isLoading,
    error 
  } = useTier2CategoriesByTier1Name(projectId);

  // Get project theme data for project-specific themes
  const { data: projects = [] } = useQuery<ProjectThemeData[]>({
    queryKey: ["/api/projects"],
    select: (data: any[]) => {
      return data.map(p => ({
        id: p.id,
        colorTheme: p.colorTheme,
        useGlobalTheme: p.useGlobalTheme
      }));
    }
  });

  // Combine all admin categories
  const adminCategories = useMemo(() => {
    return [...dbTier1Categories, ...dbTier2Categories] as CategoryData[];
  }, [dbTier1Categories, dbTier2Categories]);

  // Create color functions with admin data baked in
  const colorFunctions = useMemo(() => {
    return {
      // Tier-specific functions
      getTier1Color: (categoryName: string) => 
        getTier1Color(categoryName, adminCategories, projectId, projects),
      
      getTier2Color: (categoryName: string) => 
        getTier2Color(categoryName, adminCategories, projectId, projects),
      
      // Generic category function
      getCategoryColor: (categoryName: string, categoryType: 'tier1' | 'tier2') =>
        getCategoryColor(categoryName, categoryType, adminCategories, projectId, projects),
      
      // Task color helper
      getTaskColors: (tier1Category?: string, tier2Category?: string) =>
        getTaskColors(tier1Category, tier2Category, adminCategories, projectId, projects),
      
      // Status colors (no admin data needed)
      getStatusColor,
      
      // Formatting functions
      formatCategoryName,
      formatTaskStatus,
      
      // Raw admin data access
      adminCategories,
      tier1Categories: dbTier1Categories,
      tier2Categories: dbTier2Categories
    };
  }, [adminCategories, dbTier1Categories, dbTier2Categories, projectId, projects]);

  return {
    ...colorFunctions,
    projects,
    isLoading,
    error
  };
}

/**
 * Hook for "All Projects" view (aggregates from all projects)
 */
export function useAllProjectsColors() {
  return useUnifiedColors(null);
}

/**
 * Hook for specific project view
 */
export function useProjectColors(projectId: number) {
  return useUnifiedColors(projectId);
}

/**
 * Hook for task card colors - convenience hook for the most common use case
 */
export function useTaskCardColors(
  tier1Category?: string, 
  tier2Category?: string, 
  projectId?: number | null
) {
  
  const { getTaskColors, isLoading, error } = useUnifiedColors(projectId);
  const colors = useMemo(() => 
    getTaskColors(tier1Category, tier2Category), 
    [getTaskColors, tier1Category, tier2Category]
  );
  
  return {
    ...colors,
    isLoading,
    error
  };
}

export default useUnifiedColors;