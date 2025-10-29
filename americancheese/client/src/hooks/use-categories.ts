import { useQuery } from '@tanstack/react-query';
import { CategoryManager, type CategoryTree } from '@/lib/category-manager';
import type { Category } from '@shared/schema';

/**
 * Hook for accessing categories in the new generic system
 */
export function useCategories(projectId?: number) {
  return useQuery({
    queryKey: ['categories', projectId],
    queryFn: () => CategoryManager.getCategories(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for accessing category tree structure
 */
export function useCategoryTree(projectId?: number) {
  return useQuery({
    queryKey: ['category-tree', projectId],
    queryFn: () => CategoryManager.getCategoryTree(projectId),
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}

/**
 * Hook for accessing template sets
 */
export function useTemplateSets() {
  return useQuery({
    queryKey: ['template-sets'],
    queryFn: () => CategoryManager.getTemplateSets(),
    staleTime: 10 * 60 * 1000, // 10 minutes
  });
}

/**
 * Hook for backward compatibility - maps legacy tier1/tier2 to new categories
 */
export function useLegacyCategoryMapping(projectId?: number) {
  const { data: categories = [] } = useCategories(projectId);
  
  return {
    getCategoryBySlug: (slug: string) => 
      categories.find(cat => cat.slug === slug),
    
    getCategoryById: (id: number) => 
      categories.find(cat => cat.id === id),
      
    // Legacy mapping functions
    mapTier1ToCategory: (tier1Name: string) => {
      const mapping: Record<string, string> = {
        'structural': 'subcategory1',
        'systems': 'subcategory2', 
        'sheathing': 'subcategory3',
        'finishings': 'subcategory4'
      };
      const slug = mapping[tier1Name.toLowerCase()] || tier1Name.toLowerCase();
      return categories.find(cat => cat.slug === slug);
    },
    
    mapTier2ToCategory: (tier2Name: string) => {
      const mapping: Record<string, string> = {
        'foundation': 'foundation',
        'framing': 'framing',
        'electrical': 'electrical',
        'plumbing': 'plumbing',
        'hvac': 'hvac',
        'drywall': 'drywall',
        'windows': 'windows',
        'doors': 'doors',
        'flooring': 'flooring',
        'paint': 'paint'
      };
      const slug = mapping[tier2Name.toLowerCase()] || tier2Name.toLowerCase();
      return categories.find(cat => cat.slug === slug);
    }
  };
}

/**
 * Hook for getting category from legacy task data
 */
export function useCategoryFromLegacyTask(task: { tier1Category?: string; tier2Category?: string; categoryId?: number }, projectId?: number) {
  const { data: categories = [] } = useCategories(projectId);
  const { mapTier1ToCategory, mapTier2ToCategory, getCategoryById } = useLegacyCategoryMapping(projectId);
  
  // If task already has new categoryId, use that
  if (task.categoryId) {
    return getCategoryById(task.categoryId);
  }
  
  // Otherwise, try to map from legacy tier1/tier2
  if (task.tier2Category) {
    return mapTier2ToCategory(task.tier2Category);
  }
  
  if (task.tier1Category) {
    return mapTier1ToCategory(task.tier1Category);
  }
  
  return null;
}