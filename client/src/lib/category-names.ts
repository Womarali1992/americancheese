// Centralized category name management
// This module provides functions to get custom category names from localStorage

interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  // Tier 1 Categories
  { id: "structural", label: "Structural", description: "Foundation, framing, and structural elements" },
  { id: "systems", label: "Systems", description: "Plumbing, electrical, HVAC" },
  { id: "sheathing", label: "Sheathing", description: "Siding, insulation, drywall" },
  { id: "finishings", label: "Finishings", description: "Cabinetry, trim, flooring, painting" },
  
  // Tier 2 Categories - Structural
  { id: "foundation", label: "Foundation", description: "Foundation work and concrete" },
  { id: "framing", label: "Framing", description: "Structural framing and lumber" },
  { id: "roofing", label: "Roofing", description: "Roof installation and materials" },
  
  // Tier 2 Categories - Systems
  { id: "electrical", label: "Electrical", description: "Electrical wiring and fixtures" },
  { id: "plumbing", label: "Plumbing", description: "Plumbing and water systems" },
  { id: "hvac", label: "HVAC", description: "Heating, ventilation, and air conditioning" },
  
  // Tier 2 Categories - Sheathing
  { id: "barriers", label: "Barriers", description: "Weather barriers and house wrap" },
  { id: "drywall", label: "Drywall", description: "Drywall installation and finishing" },
  { id: "exteriors", label: "Exteriors", description: "Exterior siding and materials" },
  { id: "insulation", label: "Insulation", description: "Insulation materials and installation" },
  { id: "siding", label: "Siding", description: "Exterior siding installation" },
  
  // Tier 2 Categories - Finishings
  { id: "cabinetry", label: "Cabinetry", description: "Cabinet installation and trim" },
  { id: "flooring", label: "Flooring", description: "Floor installation and materials" },
  { id: "painting", label: "Painting", description: "Interior and exterior painting" },
  { id: "trim", label: "Trim", description: "Interior trim and molding" }
];

/**
 * Get custom category names for a specific project
 * Falls back to global custom names, then defaults
 */
/**
 * Merge saved categories with default categories to ensure all categories are available
 */
function mergeWithDefaults(savedCategories: CategoryOption[]): CategoryOption[] {
  const mergedCategories = [...DEFAULT_CATEGORY_OPTIONS];
  
  // Replace any categories that have custom names
  savedCategories.forEach(savedCategory => {
    const index = mergedCategories.findIndex(cat => cat.id === savedCategory.id);
    if (index >= 0) {
      mergedCategories[index] = savedCategory;
    }
  });
  
  return mergedCategories;
}

export function getCategoryNames(projectId?: number): CategoryOption[] {
  try {
    // First try project-specific names
    if (projectId) {
      const projectSpecificCategories = localStorage.getItem(`categoryNames_${projectId}`);
      if (projectSpecificCategories) {
        const parsed = JSON.parse(projectSpecificCategories);
        return mergeWithDefaults(parsed);
      }
    }

    // Fall back to global category names
    const globalCategories = localStorage.getItem('globalCategoryNames');
    if (globalCategories) {
      const parsed = JSON.parse(globalCategories);
      return mergeWithDefaults(parsed);
    }

    // Finally fall back to defaults
    return DEFAULT_CATEGORY_OPTIONS;
  } catch (error) {
    console.error("Failed to load category names:", error);
    return DEFAULT_CATEGORY_OPTIONS;
  }
}

/**
 * Get category names from admin template categories (database)
 * This replaces the localStorage-based approach with database-driven categories
 */
export async function getAdminCategoryNames(): Promise<CategoryOption[]> {
  try {
    const response = await fetch('/api/admin/template-categories');
    if (!response.ok) {
      throw new Error('Failed to fetch admin template categories');
    }
    
    const adminCategories = await response.json();
    
    // Convert admin template categories to CategoryOption format
    const categoryOptions: CategoryOption[] = adminCategories.map((cat: any) => ({
      id: cat.name.toLowerCase(), // Use lowercase name as ID for compatibility
      label: cat.name,
      description: cat.description || getDefaultDescription(cat.name.toLowerCase())
    }));
    
    // Merge with defaults to ensure all expected categories exist
    return mergeWithDefaults(categoryOptions);
  } catch (error) {
    console.error("Failed to load admin category names:", error);
    return DEFAULT_CATEGORY_OPTIONS;
  }
}

function getDefaultDescription(categoryId: string): string {
  const defaultCategory = DEFAULT_CATEGORY_OPTIONS.find(cat => cat.id === categoryId);
  return defaultCategory?.description || 'Construction category';
}

/**
 * Get the display name for a specific category
 */
export function getCategoryDisplayName(categoryId: string, projectId?: number): string {
  const categories = getCategoryNames(projectId);
  const category = categories.find(c => c.id.toLowerCase() === categoryId.toLowerCase());
  
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
 * Get all category names as a simple ID -> Label mapping
 */
export function getCategoryLabelsMap(projectId?: number): Record<string, string> {
  const categories = getCategoryNames(projectId);
  const map: Record<string, string> = {};
  
  categories.forEach(category => {
    map[category.id] = category.label;
  });
  
  return map;
}

/**
 * React hook for components to get category names and refresh when they change
 */
export function useCategoryNames(projectId?: number) {
  const { useState, useEffect } = require('react');
  const [categories, setCategories] = useState<CategoryOption[]>(DEFAULT_CATEGORY_OPTIONS);

  useEffect(() => {
    const loadCategories = () => {
      setCategories(getCategoryNames(projectId));
    };

    loadCategories();

    // Listen for storage changes to auto-refresh when categories are updated
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'globalCategoryNames' || (projectId && e.key === `categoryNames_${projectId}`)) {
        loadCategories();
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, [projectId]);

  return categories;
}