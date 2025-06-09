// Centralized category name management
// This module provides functions to get custom category names from localStorage

interface CategoryOption {
  id: string;
  label: string;
  description: string;
}

const DEFAULT_CATEGORY_OPTIONS: CategoryOption[] = [
  { id: "structural", label: "Structural", description: "Foundation, framing, and structural elements" },
  { id: "systems", label: "Systems", description: "Plumbing, electrical, HVAC" },
  { id: "sheathing", label: "Sheathing", description: "Siding, insulation, drywall" },
  { id: "finishings", label: "Finishings", description: "Cabinetry, trim, flooring, painting" }
];

/**
 * Get custom category names for a specific project
 * Falls back to global custom names, then defaults
 */
export function getCategoryNames(projectId?: number): CategoryOption[] {
  try {
    // First try project-specific names
    if (projectId) {
      const projectSpecificCategories = localStorage.getItem(`categoryNames_${projectId}`);
      if (projectSpecificCategories) {
        return JSON.parse(projectSpecificCategories);
      }
    }

    // Fall back to global category names
    const globalCategories = localStorage.getItem('globalCategoryNames');
    if (globalCategories) {
      return JSON.parse(globalCategories);
    }

    // Finally fall back to defaults
    return DEFAULT_CATEGORY_OPTIONS;
  } catch (error) {
    console.error("Failed to load category names:", error);
    return DEFAULT_CATEGORY_OPTIONS;
  }
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