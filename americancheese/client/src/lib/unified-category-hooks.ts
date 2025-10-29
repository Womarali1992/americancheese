/**
 * Unified Category Hooks
 *
 * React hooks for the simplified category system using projectCategories as single source of truth
 */

import { useQuery } from '@tanstack/react-query';

// Types matching the unified API
interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  color?: string | null;
  description?: string | null;
  sortOrder: number;
  isFromTemplate: boolean;
  templateSource?: string | null;
  createdAt: string;
  updatedAt: string;
}

interface CategoryHierarchy extends ProjectCategory {
  children: ProjectCategory[];
}

interface CategoryOption {
  id: number;
  name: string;
  label: string; // For backward compatibility
  description?: string | null;
  type: 'tier1' | 'tier2';
  parentId?: number | null;
  color?: string | null;
}

/**
 * Convert ProjectCategory to CategoryOption for backward compatibility
 */
function convertToOption(category: ProjectCategory): CategoryOption {
  return {
    id: category.id,
    name: category.name,
    label: category.name, // For backward compatibility
    description: category.description,
    type: category.type,
    parentId: category.parentId,
    color: category.color
  };
}

/**
 * Get flat list of all categories for a project
 */
export function useProjectCategories(projectId?: number) {
  return useQuery({
    queryKey: [`/api/projects/${projectId}/categories/flat`],
    queryFn: async () => {
      if (!projectId) return [];

      const response = await fetch(`/api/projects/${projectId}/categories/flat`);
      if (!response.ok) {
        throw new Error('Failed to fetch project categories');
      }

      const categories: ProjectCategory[] = await response.json();
      return categories.map(convertToOption);
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Removed initialData to ensure proper loading state
  });
}

/**
 * Get hierarchical categories for a project
 */
export function useProjectCategoryHierarchy(projectId?: number) {
  return useQuery({
    queryKey: [`/api/projects/${projectId}/categories`],
    queryFn: async () => {
      if (!projectId) return [];

      const response = await fetch(`/api/projects/${projectId}/categories`);
      if (!response.ok) {
        throw new Error('Failed to fetch project category hierarchy');
      }

      return response.json() as Promise<CategoryHierarchy[]>;
    },
    enabled: !!projectId,
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    // Removed initialData to ensure proper loading state
  });
}

/**
 * Get tier1 categories only - UPDATED for unified system
 */
export function useTier1Categories(projectId?: number) {
  const { data: allCategories, ...rest } = useProjectCategories(projectId);

  const tier1Categories = (allCategories || []).filter(cat => cat.type === 'tier1');

  return {
    data: tier1Categories,
    ...rest
  };
}

/**
 * Get tier2 categories for a specific tier1 category - UPDATED for unified system
 */
export function useTier2Categories(projectId?: number, tier1CategoryName?: string) {
  const { data: allCategories, ...rest } = useProjectCategories(projectId);

  let tier2Categories = (allCategories || []).filter(cat => cat.type === 'tier2');

  // If tier1CategoryName is specified, filter by parent
  if (tier1CategoryName) {
    const tier1Category = (allCategories || []).find(cat =>
      cat.type === 'tier1' &&
      cat.name.toLowerCase() === tier1CategoryName.toLowerCase()
    );

    if (tier1Category) {
      tier2Categories = tier2Categories.filter(cat => cat.parentId === tier1Category.id);
    } else {
      tier2Categories = []; // No matching tier1 found
    }
  }

  return {
    data: tier2Categories,
    ...rest
  };
}

/**
 * Hook to get available presets
 */
export function usePresets() {
  return useQuery({
    queryKey: ['/api/categories/presets'],
    queryFn: async () => {
      const response = await fetch('/api/categories/presets');
      if (!response.ok) {
        throw new Error('Failed to fetch presets');
      }
      return response.json();
    },
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 30 * 60 * 1000, // 30 minutes
  });
}

/**
 * Get category by ID
 */
export function useCategoryById(projectId: number, categoryId: number) {
  const { data: categories } = useProjectCategories(projectId);
  return categories?.find(cat => cat.id === categoryId) || null;
}

/**
 * Get category by name (for legacy compatibility)
 */
export function useCategoryByName(projectId: number, categoryName: string) {
  const { data: categories } = useProjectCategories(projectId);
  return categories?.find(cat => cat.name.toLowerCase() === categoryName.toLowerCase()) || null;
}

// Backward compatibility exports
export { useProjectCategories as useCategories };
export { useProjectCategories as useCategoryNames };