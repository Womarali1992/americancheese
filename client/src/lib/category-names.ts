// Centralized category name management using templates
// This module provides functions to get category names from database templates

import { useQuery } from '@tanstack/react-query';

interface CategoryOption {
  id: string;
  label: string;
  description: string;
  type?: 'tier1' | 'tier2';
  parentId?: number | null;
  color?: string | null;
}

interface TemplateCategory {
  id: number;
  name: string;
  type: 'tier1' | 'tier2';
  parentId: number | null;
  color: string | null;
  description: string | null;
  sortOrder: number;
}

// Fallback categories for when templates aren't available
const FALLBACK_CATEGORY_OPTIONS: CategoryOption[] = [
  // Tier 1 Categories - Using generic naming for consistency
  { id: "subcategory1", label: "Subcategory 1", description: "Primary construction phase", type: "tier1" },
  { id: "subcategory2", label: "Subcategory 2", description: "Secondary construction phase", type: "tier1" },
  { id: "subcategory3", label: "Subcategory 3", description: "Tertiary construction phase", type: "tier1" },
  { id: "subcategory4", label: "Subcategory 4", description: "Final construction phase", type: "tier1" },
  { id: "subcategory5", label: "Subcategory 5", description: "Additional construction phase", type: "tier1" },
  
  // Tier 2 Categories - Using generic naming for consistency
  { id: "tier2_1", label: "Tier 2 - 1", description: "First subcategory", type: "tier2" },
  { id: "tier2_2", label: "Tier 2 - 2", description: "Second subcategory", type: "tier2" },
  { id: "tier2_3", label: "Tier 2 - 3", description: "Third subcategory", type: "tier2" },
  { id: "tier2_4", label: "Tier 2 - 4", description: "Fourth subcategory", type: "tier2" },
  { id: "tier2_5", label: "Tier 2 - 5", description: "Fifth subcategory", type: "tier2" },
  { id: "tier2_6", label: "Tier 2 - 6", description: "Sixth subcategory", type: "tier2" },
  { id: "tier2_7", label: "Tier 2 - 7", description: "Seventh subcategory", type: "tier2" },
  { id: "tier2_8", label: "Tier 2 - 8", description: "Eighth subcategory", type: "tier2" },
  { id: "tier2_9", label: "Tier 2 - 9", description: "Ninth subcategory", type: "tier2" },
  { id: "tier2_10", label: "Tier 2 - 10", description: "Tenth subcategory", type: "tier2" },
  { id: "tier2_11", label: "Tier 2 - 11", description: "Eleventh subcategory", type: "tier2" },
  { id: "tier2_12", label: "Tier 2 - 12", description: "Twelfth subcategory", type: "tier2" },
  { id: "tier2_13", label: "Tier 2 - 13", description: "Thirteenth subcategory", type: "tier2" },
  { id: "tier2_14", label: "Tier 2 - 14", description: "Fourteenth subcategory", type: "tier2" },
  { id: "tier2_15", label: "Tier 2 - 15", description: "Fifteenth subcategory", type: "tier2" },
  { id: "tier2_16", label: "Tier 2 - 16", description: "Sixteenth subcategory", type: "tier2" },
  { id: "tier2_17", label: "Tier 2 - 17", description: "Seventeenth subcategory", type: "tier2" },
  { id: "tier2_18", label: "Tier 2 - 18", description: "Eighteenth subcategory", type: "tier2" },
  { id: "tier2_19", label: "Tier 2 - 19", description: "Nineteenth subcategory", type: "tier2" },
  { id: "tier2_20", label: "Tier 2 - 20", description: "Twentieth subcategory", type: "tier2" }
];

/**
 * Get custom category names for a specific project
 * Falls back to global custom names, then defaults
 */
/**
 * Convert template categories to CategoryOption format
 */
function convertTemplateCategoriesToOptions(templateCategories: TemplateCategory[]): CategoryOption[] {
  return templateCategories
    .filter(cat => cat.name && cat.name.trim()) // Filter out categories without names
    .map((cat) => ({
      id: cat.name.toLowerCase().replace(/\s+/g, '_'), // Convert name to ID format
      label: cat.name,
      description: cat.description || getDefaultDescription(cat.name.toLowerCase()),
      type: cat.type,
      parentId: cat.parentId,
      color: cat.color
    }));
}

/**
 * Filter out generic fallback categories and return only real project categories
 */
function filterRealCategories(templateCategories: CategoryOption[]): CategoryOption[] {
  // Only return categories that are not generic fallbacks
  return templateCategories.filter(cat =>
    !FALLBACK_CATEGORY_OPTIONS.some(fallback =>
      fallback.id === cat.id || fallback.label === cat.label
    )
  );
}

/**
 * Get categories from templates for a specific project
 * Falls back to global templates, then fallback categories
 */
export async function getCategoryNames(projectId?: number): Promise<CategoryOption[]> {
  try {
    let templateCategories: TemplateCategory[] = [];

    // First try project-specific categories
    if (projectId) {
      try {
        const response = await fetch(`/api/projects/${projectId}/categories/flat`);
        if (response.ok) {
          templateCategories = await response.json();
        }
      } catch (error) {
        console.warn('Failed to fetch project categories:', error);
      }
    }

    // If no project categories found, fall back to global templates
    if (templateCategories.length === 0) {
      try {
        const response = await fetch('/api/category-templates');
        if (response.ok) {
          templateCategories = await response.json();
        }
      } catch (error) {
        console.warn('Failed to fetch global category templates:', error);
      }
    }

    // Convert template categories to CategoryOption format
    const categoryOptions = convertTemplateCategoriesToOptions(templateCategories);
    
    // Filter out generic categories and return only real project categories
    return filterRealCategories(categoryOptions);
  } catch (error) {
    console.error("Failed to load category names:", error);
    return [];
  }
}

/**
 * Get categories synchronously for components that need immediate access
 * This should be used with React Query for proper data fetching
 */
export function getCategoryNamesSync(): CategoryOption[] {
  return [];
}

/**
 * React hook to get categories with automatic caching and updates
 */
export function useCategories(projectId?: number) {
  return useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/categories/flat`] : ['/api/category-templates'],
    queryFn: async () => {
      const endpoint = projectId
        ? `/api/projects/${projectId}/categories/flat`
        : '/api/category-templates';

      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }

      const templateCategories: TemplateCategory[] = await response.json();

      // Log any categories with missing names for debugging
      const invalidCategories = templateCategories.filter(cat => !cat.name || !cat.name.trim());
      if (invalidCategories.length > 0) {
        console.warn('Found categories with missing names:', invalidCategories);
      }

      const categoryOptions = convertTemplateCategoriesToOptions(templateCategories);
      return filterRealCategories(categoryOptions);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialData: []
  });
}

/**
 * Get tier1 categories only
 */
export function useTier1Categories(projectId?: number) {
  const { data: allCategories, ...rest } = useCategories(projectId);
  
  // Ensure allCategories is an array and filter out invalid categories
  const validCategories = allCategories?.filter(cat => 
    cat && 
    cat.type && 
    cat.label && 
    cat.label.trim()
  ) || [];
  
  const tier1Categories = validCategories.filter(cat => cat.type === 'tier1');
  
  return {
    data: tier1Categories,
    ...rest
  };
}

/**
 * Get tier2 categories for a specific tier1 category
 */
export function useTier2Categories(projectId?: number, tier1CategoryName?: string) {
  const { data: allCategories, ...rest } = useCategories(projectId);
  
  // Ensure allCategories is an array and filter out invalid categories
  const validCategories = allCategories?.filter(cat => 
    cat && 
    cat.type && 
    cat.label && 
    cat.label.trim()
  ) || [];
  
  const tier2Categories = validCategories.filter(cat => {
    if (cat.type !== 'tier2') return false;
    if (!tier1CategoryName) return true;

    // Find the parent tier1 category
    const tier1Category = validCategories.find(c =>
      c.type === 'tier1' &&
      c.label &&
      c.label.toLowerCase() === tier1CategoryName.toLowerCase()
    );

    return tier1Category && cat.parentId === tier1Category.id;
  });
  
  return {
    data: tier2Categories,
    ...rest
  };
}


/**
 * Get the display name for a specific category (async version)
 */
export async function getCategoryDisplayName(categoryId: string, projectId?: number): Promise<string> {
  try {
    const categories = await getCategoryNames(projectId);
    const category = categories.find(c => c.id.toLowerCase() === categoryId.toLowerCase());
    
    if (category && category.label) {
      return category.label;
    }
  } catch (error) {
    console.warn('Failed to get category display name:', error);
  }

  // Fallback to formatting the category ID
  return formatCategoryId(categoryId);
}

/**
 * Get the display name for a specific category (sync version using fallbacks)
 */
export function getCategoryDisplayNameSync(categoryId: string): string {
  const category = FALLBACK_CATEGORY_OPTIONS.find(c => c.id.toLowerCase() === categoryId.toLowerCase());
  
  if (category) {
    return category.label;
  }

  // Fallback to formatting the category ID
  return formatCategoryId(categoryId);
}

/**
 * Format a category ID into a readable name (fallback)
 */
function formatCategoryId(categoryId: string): string {
  if (!categoryId) return "Uncategorized";
  
  // Handle special cases
  if (categoryId.toLowerCase() === 'windows_doors') {
    return 'Windows/Doors';
  }
  
  // Convert underscore-separated words to title case
  return categoryId
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Get all category names as a simple ID -> Label mapping (async)
 */
export async function getCategoryLabelsMap(projectId?: number): Promise<Record<string, string>> {
  const categories = await getCategoryNames(projectId);
  const map: Record<string, string> = {};
  
  categories.forEach(category => {
    if (category.label) {
      map[category.id] = category.label;
    }
  });
  
  return map;
}

/**
 * Get all category names as a simple ID -> Label mapping (sync using empty map)
 */
export function getCategoryLabelsMapSync(): Record<string, string> {
  return {};
}

/**
 * React hook for components to get category names and refresh when they change
 * @deprecated Use useCategories hook instead
 */
export function useCategoryNames(projectId?: number) {
  return useCategories(projectId);
}

/**
 * Get default description for a category name
 */
function getDefaultDescription(categoryName: string): string {
  const defaultCategory = FALLBACK_CATEGORY_OPTIONS.find((cat: CategoryOption) => 
    cat.id.toLowerCase() === categoryName.toLowerCase() ||
    (cat.label && cat.label.toLowerCase() === categoryName.toLowerCase())
  );
  return defaultCategory?.description || 'Construction category';
}