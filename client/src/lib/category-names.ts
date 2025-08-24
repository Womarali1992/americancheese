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
  // Tier 1 Categories
  { id: "structural", label: "Structural", description: "Foundation, framing, and structural elements", type: "tier1" },
  { id: "systems", label: "Systems", description: "Plumbing, electrical, HVAC", type: "tier1" },
  { id: "sheathing", label: "Sheathing", description: "Siding, insulation, drywall", type: "tier1" },
  { id: "finishings", label: "Finishings", description: "Cabinetry, trim, flooring, painting", type: "tier1" },
  
  // Tier 2 Categories - Structural
  { id: "foundation", label: "Foundation", description: "Foundation work and concrete", type: "tier2" },
  { id: "framing", label: "Framing", description: "Structural framing and lumber", type: "tier2" },
  { id: "roofing", label: "Roofing", description: "Roof installation and materials", type: "tier2" },
  
  // Tier 2 Categories - Systems
  { id: "electrical", label: "Electrical", description: "Electrical wiring and fixtures", type: "tier2" },
  { id: "plumbing", label: "Plumbing", description: "Plumbing and water systems", type: "tier2" },
  { id: "hvac", label: "HVAC", description: "Heating, ventilation, and air conditioning", type: "tier2" },
  
  // Tier 2 Categories - Sheathing
  { id: "barriers", label: "Barriers", description: "Weather barriers and house wrap", type: "tier2" },
  { id: "drywall", label: "Drywall", description: "Drywall installation and finishing", type: "tier2" },
  { id: "exteriors", label: "Exteriors", description: "Exterior siding and materials", type: "tier2" },
  { id: "insulation", label: "Insulation", description: "Insulation materials and installation", type: "tier2" },
  { id: "siding", label: "Siding", description: "Exterior siding installation", type: "tier2" },
  
  // Tier 2 Categories - Finishings
  { id: "cabinetry", label: "Cabinetry", description: "Cabinet installation and trim", type: "tier2" },
  { id: "flooring", label: "Flooring", description: "Floor installation and materials", type: "tier2" },
  { id: "painting", label: "Painting", description: "Interior and exterior painting", type: "tier2" },
  { id: "trim", label: "Trim", description: "Interior trim and molding", type: "tier2" }
];

/**
 * Get custom category names for a specific project
 * Falls back to global custom names, then defaults
 */
/**
 * Convert template categories to CategoryOption format
 */
function convertTemplateCategoriesToOptions(templateCategories: TemplateCategory[]): CategoryOption[] {
  return templateCategories.map((cat) => ({
    id: cat.name.toLowerCase().replace(/\s+/g, '_'), // Convert name to ID format
    label: cat.name,
    description: cat.description || getDefaultDescription(cat.name.toLowerCase()),
    type: cat.type,
    parentId: cat.parentId,
    color: cat.color
  }));
}

/**
 * Merge template categories with fallback categories to ensure all categories are available
 */
function mergeWithFallbacks(templateCategories: CategoryOption[]): CategoryOption[] {
  const mergedCategories = [...templateCategories];
  
  // Add any missing fallback categories
  FALLBACK_CATEGORY_OPTIONS.forEach(fallbackCategory => {
    const exists = mergedCategories.some(cat => cat.id === fallbackCategory.id);
    if (!exists) {
      mergedCategories.push(fallbackCategory);
    }
  });
  
  return mergedCategories;
}

/**
 * Get categories from templates for a specific project
 * Falls back to global templates, then fallback categories
 */
export async function getCategoryNames(projectId?: number): Promise<CategoryOption[]> {
  try {
    let templateCategories: TemplateCategory[] = [];

    // First try project-specific template categories
    if (projectId) {
      try {
        const response = await fetch(`/api/projects/${projectId}/template-categories`);
        if (response.ok) {
          templateCategories = await response.json();
        }
      } catch (error) {
        console.warn('Failed to fetch project template categories:', error);
      }
    }

    // If no project categories found, fall back to global templates
    if (templateCategories.length === 0) {
      try {
        const response = await fetch('/api/admin/template-categories');
        if (response.ok) {
          templateCategories = await response.json();
        }
      } catch (error) {
        console.warn('Failed to fetch global template categories:', error);
      }
    }

    // Convert template categories to CategoryOption format
    const categoryOptions = convertTemplateCategoriesToOptions(templateCategories);
    
    // Merge with fallbacks to ensure all expected categories exist
    return mergeWithFallbacks(categoryOptions);
  } catch (error) {
    console.error("Failed to load category names:", error);
    return FALLBACK_CATEGORY_OPTIONS;
  }
}

/**
 * Get categories synchronously for components that need immediate access
 * This should be used with React Query for proper data fetching
 */
export function getCategoryNamesSync(): CategoryOption[] {
  return FALLBACK_CATEGORY_OPTIONS;
}

/**
 * React hook to get categories with automatic caching and updates
 */
export function useCategories(projectId?: number) {
  return useQuery({
    queryKey: projectId ? [`/api/projects/${projectId}/template-categories`] : ['/api/admin/template-categories'],
    queryFn: async () => {
      const endpoint = projectId 
        ? `/api/projects/${projectId}/template-categories`
        : '/api/admin/template-categories';
      
      const response = await fetch(endpoint);
      if (!response.ok) {
        throw new Error('Failed to fetch template categories');
      }
      
      const templateCategories: TemplateCategory[] = await response.json();
      const categoryOptions = convertTemplateCategoriesToOptions(templateCategories);
      return mergeWithFallbacks(categoryOptions);
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    initialData: FALLBACK_CATEGORY_OPTIONS
  });
}

/**
 * Get tier1 categories only
 */
export function useTier1Categories(projectId?: number) {
  const { data: allCategories, ...rest } = useCategories(projectId);
  
  const tier1Categories = allCategories?.filter(cat => cat.type === 'tier1') || [];
  
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
  
  const tier2Categories = allCategories?.filter(cat => {
    if (cat.type !== 'tier2') return false;
    if (!tier1CategoryName) return true;
    
    // Find the parent tier1 category
    const tier1Category = allCategories.find(c => 
      c.type === 'tier1' && 
      c.label.toLowerCase() === tier1CategoryName.toLowerCase()
    );
    
    return tier1Category && cat.parentId === tier1Category.parentId;
  }) || [];
  
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
    
    if (category) {
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
    map[category.id] = category.label;
  });
  
  return map;
}

/**
 * Get all category names as a simple ID -> Label mapping (sync using fallbacks)
 */
export function getCategoryLabelsMapSync(): Record<string, string> {
  const map: Record<string, string> = {};
  
  FALLBACK_CATEGORY_OPTIONS.forEach(category => {
    map[category.id] = category.label;
  });
  
  return map;
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
    cat.label.toLowerCase() === categoryName.toLowerCase()
  );
  return defaultCategory?.description || 'Construction category';
}