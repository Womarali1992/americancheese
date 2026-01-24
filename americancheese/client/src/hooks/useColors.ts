/**
 * useColors Hook
 * Single hook for accessing color functionality in React components
 *
 * Features:
 * - Immediately returns colors using global theme (no loading state required for first render)
 * - Automatically updates when project theme is loaded from database
 * - Handles project-specific themes with proper priority
 *
 * Usage:
 * ```typescript
 * // Without project context (uses global theme)
 * const { getTier1Color, getTier2Color } = useColors();
 *
 * // With project context (uses project's custom theme if set)
 * const { getTier1Color, getTier2Color, isLoading, hasProjectTheme } = useColors(projectId);
 * ```
 */

import { useState, useEffect, useMemo, useCallback } from 'react';
import { useQuery } from '@tanstack/react-query';
import type { Theme, UseColorsReturn } from '@/lib/colors/types';
import {
  getTier1Color as resolveTier1Color,
  getTier2Color as resolveTier2Color,
  getTaskColors as resolveTaskColors,
  getGlobalTheme,
} from '@/lib/colors/resolver';
import { getTheme, EARTH_TONE } from '@/lib/colors/themes';

interface Project {
  id: number;
  colorTheme?: string | null;
  useGlobalTheme?: boolean;
}

/**
 * Hook for accessing colors with automatic theme resolution
 *
 * @param projectId - Optional project ID to load project-specific theme
 * @returns Color utilities and current theme state
 */
export function useColors(projectId?: number | null): UseColorsReturn {
  // Start with global theme immediately (no waiting)
  const [activeTheme, setActiveTheme] = useState<Theme>(() => getGlobalTheme());

  // Fetch project data if projectId is provided
  const { data: project, isLoading } = useQuery<Project>({
    queryKey: [`/api/projects/${projectId}`],
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  // Update theme when project data arrives
  useEffect(() => {
    if (project?.colorTheme && !project?.useGlobalTheme) {
      // Project has a custom theme
      const projectTheme = getTheme(project.colorTheme);
      setActiveTheme(projectTheme);
    } else if (project && project.useGlobalTheme) {
      // Project explicitly uses global theme
      setActiveTheme(getGlobalTheme());
    }
    // If no project or still loading, keep using initial theme (global)
  }, [project?.colorTheme, project?.useGlobalTheme]);

  // Memoized color functions that use current activeTheme
  const getTier1Color = useCallback(
    (categoryName: string, index?: number) => {
      return resolveTier1Color(categoryName, {
        projectTheme: project?.colorTheme,
        index,
      });
    },
    [project?.colorTheme]
  );

  const getTier2Color = useCallback(
    (categoryName: string, tier1Parent?: string | null, index?: number) => {
      return resolveTier2Color(categoryName, {
        projectTheme: project?.colorTheme,
        tier1Parent,
        index,
      });
    },
    [project?.colorTheme]
  );

  const getTaskColors = useCallback(
    (tier1?: string | null, tier2?: string | null) => {
      return resolveTaskColors(tier1, tier2, {
        projectTheme: project?.colorTheme,
      });
    },
    [project?.colorTheme]
  );

  return {
    getTier1Color,
    getTier2Color,
    getTaskColors,
    activeTheme,
    isLoading,
    hasProjectTheme: !!project?.colorTheme && !project?.useGlobalTheme,
  };
}

/**
 * Simple hook for getting colors without project context
 * Uses only the global theme from localStorage
 */
export function useGlobalColors() {
  const theme = useMemo(() => getGlobalTheme(), []);

  const getTier1Color = useCallback(
    (categoryName: string, index?: number) => {
      return resolveTier1Color(categoryName, { index });
    },
    []
  );

  const getTier2Color = useCallback(
    (categoryName: string, tier1Parent?: string | null, index?: number) => {
      return resolveTier2Color(categoryName, { tier1Parent, index });
    },
    []
  );

  return {
    getTier1Color,
    getTier2Color,
    activeTheme: theme,
  };
}

export default useColors;
