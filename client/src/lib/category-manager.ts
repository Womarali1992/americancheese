/**
 * Unified Category Management System
 * 
 * This module provides a centralized API for managing the new generic category system.
 * It handles both global and project-specific categories, template sets, and migration
 * from the old tier1/tier2 system.
 */

import { apiRequest } from '@/lib/queryClient';
import type { 
  Category, 
  InsertCategory, 
  CategoryTemplateSet, 
  CategoryTemplateItem,
  InsertCategoryTemplateSet,
  InsertCategoryTemplateItem 
} from '@shared/schema';

// Default category template sets
export const DEFAULT_TEMPLATE_SETS = {
  generic: {
    name: 'Generic Project',
    description: 'Simple category structure for any type of project',
    categories: [
      { name: 'Planning', slug: 'planning', color: '#6366f1', level: 1, sortOrder: 1 },
      { name: 'Development', slug: 'development', color: '#10b981', level: 1, sortOrder: 2 },
      { name: 'Testing', slug: 'testing', color: '#f59e0b', level: 1, sortOrder: 3 },
      { name: 'Deployment', slug: 'deployment', color: '#ef4444', level: 1, sortOrder: 4 },
      { name: 'Maintenance', slug: 'maintenance', color: '#8b5cf6', level: 1, sortOrder: 5 },
      // Planning subcategories
      { name: 'Research', slug: 'research', parentSlug: 'planning', color: '#7c3aed', level: 2, sortOrder: 1 },
      { name: 'Strategy', slug: 'strategy', parentSlug: 'planning', color: '#5b21b6', level: 2, sortOrder: 2 },
      { name: 'Requirements', slug: 'requirements', parentSlug: 'planning', color: '#4c1d95', level: 2, sortOrder: 3 },
      // Development subcategories
      { name: 'Setup', slug: 'setup', parentSlug: 'development', color: '#047857', level: 2, sortOrder: 1 },
      { name: 'Implementation', slug: 'implementation', parentSlug: 'development', color: '#065f46', level: 2, sortOrder: 2 },
      { name: 'Integration', slug: 'integration', parentSlug: 'development', color: '#064e3b', level: 2, sortOrder: 3 },
      // Testing subcategories
      { name: 'Unit Testing', slug: 'unit-testing', parentSlug: 'testing', color: '#d97706', level: 2, sortOrder: 1 },
      { name: 'System Testing', slug: 'system-testing', parentSlug: 'testing', color: '#b45309', level: 2, sortOrder: 2 },
      { name: 'User Testing', slug: 'user-testing', parentSlug: 'testing', color: '#92400e', level: 2, sortOrder: 3 },
      // Deployment subcategories
      { name: 'Staging', slug: 'staging', parentSlug: 'deployment', color: '#dc2626', level: 2, sortOrder: 1 },
      { name: 'Production', slug: 'production', parentSlug: 'deployment', color: '#b91c1c', level: 2, sortOrder: 2 },
      { name: 'Monitoring', slug: 'monitoring', parentSlug: 'deployment', color: '#991b1b', level: 2, sortOrder: 3 },
    ]
  },
  construction: {
    name: 'Construction Project',
    description: 'Traditional construction project categories',
    categories: [
      { name: 'Foundation', slug: 'foundation', color: '#8b4513', level: 1, sortOrder: 1 },
      { name: 'Framing', slug: 'framing', color: '#d2691e', level: 1, sortOrder: 2 },
      { name: 'Systems', slug: 'systems', color: '#4682b4', level: 1, sortOrder: 3 },
      { name: 'Finishing', slug: 'finishing', color: '#32cd32', level: 1, sortOrder: 4 },
      // Foundation subcategories
      { name: 'Excavation', slug: 'excavation', parentSlug: 'foundation', color: '#654321', level: 2, sortOrder: 1 },
      { name: 'Concrete', slug: 'concrete', parentSlug: 'foundation', color: '#708090', level: 2, sortOrder: 2 },
      { name: 'Waterproofing', slug: 'waterproofing', parentSlug: 'foundation', color: '#2f4f4f', level: 2, sortOrder: 3 },
      // Framing subcategories
      { name: 'Lumber', slug: 'lumber', parentSlug: 'framing', color: '#daa520', level: 2, sortOrder: 1 },
      { name: 'Roof Structure', slug: 'roof-structure', parentSlug: 'framing', color: '#cd853f', level: 2, sortOrder: 2 },
      { name: 'Sheathing', slug: 'sheathing', parentSlug: 'framing', color: '#d2b48c', level: 2, sortOrder: 3 },
      // Systems subcategories
      { name: 'Electrical', slug: 'electrical', parentSlug: 'systems', color: '#ffd700', level: 2, sortOrder: 1 },
      { name: 'Plumbing', slug: 'plumbing', parentSlug: 'systems', color: '#00bfff', level: 2, sortOrder: 2 },
      { name: 'HVAC', slug: 'hvac', parentSlug: 'systems', color: '#ff6347', level: 2, sortOrder: 3 },
      // Finishing subcategories
      { name: 'Drywall', slug: 'drywall', parentSlug: 'finishing', color: '#f5f5dc', level: 2, sortOrder: 1 },
      { name: 'Flooring', slug: 'flooring', parentSlug: 'finishing', color: '#8fbc8f', level: 2, sortOrder: 2 },
      { name: 'Paint', slug: 'paint', parentSlug: 'finishing', color: '#98fb98', level: 2, sortOrder: 3 },
      { name: 'Fixtures', slug: 'fixtures', parentSlug: 'finishing', color: '#90ee90', level: 2, sortOrder: 4 },
    ]
  },
  software: {
    name: 'Software Development',
    description: 'Software development lifecycle categories',
    categories: [
      { name: 'Requirements', slug: 'requirements', color: '#6366f1', level: 1, sortOrder: 1 },
      { name: 'Design', slug: 'design', color: '#10b981', level: 1, sortOrder: 2 },
      { name: 'Implementation', slug: 'implementation', color: '#f59e0b', level: 1, sortOrder: 3 },
      { name: 'Testing', slug: 'testing', color: '#ef4444', level: 1, sortOrder: 4 },
      { name: 'Deployment', slug: 'deployment', color: '#8b5cf6', level: 1, sortOrder: 5 },
      // Requirements subcategories
      { name: 'Business Analysis', slug: 'business-analysis', parentSlug: 'requirements', color: '#7c3aed', level: 2, sortOrder: 1 },
      { name: 'User Stories', slug: 'user-stories', parentSlug: 'requirements', color: '#5b21b6', level: 2, sortOrder: 2 },
      { name: 'Technical Specs', slug: 'technical-specs', parentSlug: 'requirements', color: '#4c1d95', level: 2, sortOrder: 3 },
      // Design subcategories  
      { name: 'UI/UX Design', slug: 'ui-ux-design', parentSlug: 'design', color: '#047857', level: 2, sortOrder: 1 },
      { name: 'System Architecture', slug: 'system-architecture', parentSlug: 'design', color: '#065f46', level: 2, sortOrder: 2 },
      { name: 'Database Design', slug: 'database-design', parentSlug: 'design', color: '#064e3b', level: 2, sortOrder: 3 },
      // Implementation subcategories
      { name: 'Frontend', slug: 'frontend', parentSlug: 'implementation', color: '#ff6b6b', level: 2, sortOrder: 1 },
      { name: 'Backend', slug: 'backend', parentSlug: 'implementation', color: '#4ecdc4', level: 2, sortOrder: 2 },
      { name: 'Database', slug: 'database', parentSlug: 'implementation', color: '#ffe66d', level: 2, sortOrder: 3 },
      { name: 'API Integration', slug: 'api-integration', parentSlug: 'implementation', color: '#95a5a6', level: 2, sortOrder: 4 },
      // Testing subcategories
      { name: 'Unit Tests', slug: 'unit-tests', parentSlug: 'testing', color: '#ff6b9d', level: 2, sortOrder: 1 },
      { name: 'Integration Tests', slug: 'integration-tests', parentSlug: 'testing', color: '#c44569', level: 2, sortOrder: 2 },
      { name: 'E2E Tests', slug: 'e2e-tests', parentSlug: 'testing', color: '#ad1457', level: 2, sortOrder: 3 },
      { name: 'Performance Tests', slug: 'performance-tests', parentSlug: 'testing', color: '#880e4f', level: 2, sortOrder: 4 },
      // Deployment subcategories
      { name: 'Staging Deploy', slug: 'staging-deploy', parentSlug: 'deployment', color: '#6a1b9a', level: 2, sortOrder: 1 },
      { name: 'Production Deploy', slug: 'production-deploy', parentSlug: 'deployment', color: '#4a148c', level: 2, sortOrder: 2 },
      { name: 'DevOps', slug: 'devops', parentSlug: 'deployment', color: '#38006b', level: 2, sortOrder: 3 },
    ]
  }
};

/**
 * Category Manager Class
 * Central API for category operations
 */
export class CategoryManager {
  
  /**
   * Get all categories for a project (or global if projectId is null)
   */
  static async getCategories(projectId?: number): Promise<Category[]> {
    const params = projectId ? `?projectId=${projectId}` : '?global=true';
    return apiRequest(`/api/categories${params}`, 'GET');
  }

  /**
   * Get category hierarchy as a tree structure
   */
  static async getCategoryTree(projectId?: number): Promise<CategoryTree[]> {
    const categories = await this.getCategories(projectId);
    return this.buildCategoryTree(categories);
  }

  /**
   * Create a new category
   */
  static async createCategory(category: InsertCategory): Promise<Category> {
    // Auto-generate slug from name if not provided
    if (!category.slug) {
      category.slug = this.generateSlug(category.name);
    }
    
    return apiRequest('/api/categories', 'POST', category);
  }

  /**
   * Update an existing category
   */
  static async updateCategory(id: number, updates: Partial<InsertCategory>): Promise<Category> {
    return apiRequest(`/api/categories/${id}`, 'PUT', updates);
  }

  /**
   * Delete a category
   */
  static async deleteCategory(id: number): Promise<void> {
    return apiRequest(`/api/categories/${id}`, 'DELETE');
  }

  /**
   * Apply a template set to a project
   */
  static async applyTemplateSet(projectId: number, templateSetId: number): Promise<Category[]> {
    return apiRequest(`/api/categories/projects/${projectId}/apply-template`, 'POST', { templateSetId });
  }

  /**
   * Create a custom template set from existing categories
   */
  static async createTemplateFromProject(projectId: number, name: string, description?: string): Promise<CategoryTemplateSet> {
    return apiRequest('/api/category-templates/from-project', 'POST', {
      projectId,
      name,
      description
    });
  }

  /**
   * Get all available template sets
   */
  static async getTemplateSets(): Promise<CategoryTemplateSet[]> {
    return apiRequest('/api/categories/template-sets', 'GET');
  }

  /**
   * Initialize default template sets
   */
  static async initializeDefaultTemplates(): Promise<void> {
    for (const [key, template] of Object.entries(DEFAULT_TEMPLATE_SETS)) {
      await this.createTemplateSet(template);
    }
  }

  /**
   * Create a new template set
   */
  static async createTemplateSet(template: {
    name: string;
    description: string;
    categories: Array<{
      name: string;
      slug: string;
      color: string;
      level: number;
      sortOrder: number;
      parentSlug?: string;
      description?: string;
      icon?: string;
    }>;
  }): Promise<CategoryTemplateSet> {
    return apiRequest('/api/categories/template-sets', 'POST', template);
  }

  /**
   * Migrate legacy tier1/tier2 categories to new system
   */
  static async migrateLegacyCategories(projectId?: number): Promise<Category[]> {
    const params = projectId ? `?projectId=${projectId}` : '';
    return apiRequest(`/api/categories/migrate-legacy${params}`, 'POST');
  }

  /**
   * Find category by slug
   */
  static async findBySlug(slug: string, projectId?: number): Promise<Category | null> {
    const categories = await this.getCategories(projectId);
    return categories.find(cat => cat.slug === slug) || null;
  }

  /**
   * Get root categories (level 1)
   */
  static async getRootCategories(projectId?: number): Promise<Category[]> {
    const categories = await this.getCategories(projectId);
    return categories.filter(cat => cat.level === 1);
  }

  /**
   * Get child categories for a parent
   */
  static async getChildCategories(parentId: number, projectId?: number): Promise<Category[]> {
    const categories = await this.getCategories(projectId);
    return categories.filter(cat => cat.parentId === parentId);
  }

  /**
   * Build category tree from flat array
   */
  private static buildCategoryTree(categories: Category[]): CategoryTree[] {
    const rootCategories = categories.filter(cat => !cat.parentId);
    
    const buildChildren = (parentId: number): CategoryTree[] => {
      return categories
        .filter(cat => cat.parentId === parentId)
        .sort((a, b) => a.sortOrder - b.sortOrder)
        .map(cat => ({
          ...cat,
          children: buildChildren(cat.id)
        }));
    };

    return rootCategories
      .sort((a, b) => a.sortOrder - b.sortOrder)
      .map(cat => ({
        ...cat,
        children: buildChildren(cat.id)
      }));
  }

  /**
   * Generate URL-safe slug from name
   */
  private static generateSlug(name: string): string {
    return name
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
      .replace(/\s+/g, '-') // Replace spaces with hyphens
      .replace(/-+/g, '-') // Remove duplicate hyphens
      .replace(/^-|-$/g, ''); // Remove leading/trailing hyphens
  }

  /**
   * Auto-assign color to category based on level and position
   */
  static generateCategoryColor(level: number, sortOrder: number): string {
    const colorPalettes = {
      1: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
      2: ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#84cc16', '#f97316', '#06b6d4'],
      3: ['#f97316', '#84cc16', '#8b5cf6', '#06b6d4', '#f59e0b', '#ef4444', '#10b981', '#6366f1']
    };

    const palette = colorPalettes[level as keyof typeof colorPalettes] || colorPalettes[1];
    return palette[sortOrder % palette.length] || palette[0];
  }

  /**
   * Validate category hierarchy (prevent cycles, enforce level limits, etc.)
   */
  static validateCategoryHierarchy(category: InsertCategory, existingCategories: Category[]): string[] {
    const errors: string[] = [];

    // Check for name conflicts at same level
    const siblings = existingCategories.filter(cat => 
      cat.parentId === category.parentId && 
      cat.projectId === category.projectId
    );

    if (siblings.some(cat => cat.name === category.name)) {
      errors.push('Category name must be unique within the same level');
    }

    if (siblings.some(cat => cat.slug === category.slug)) {
      errors.push('Category slug must be unique within the same level');
    }

    // Check level limits (max 5 levels)
    if (category.level && category.level > 5) {
      errors.push('Maximum category depth is 5 levels');
    }

    // Prevent circular references
    if (category.parentId) {
      const parent = existingCategories.find(cat => cat.id === category.parentId);
      if (parent && parent.level && category.level && category.level <= parent.level) {
        errors.push('Child category must have higher level than parent');
      }
    }

    return errors;
  }
}

/**
 * Category tree structure for hierarchical display
 */
export interface CategoryTree extends Category {
  children: CategoryTree[];
}

/**
 * Legacy compatibility functions
 */
export class LegacyCategoryAdapter {
  
  /**
   * Map old tier1 category names to new slugs
   */
  static mapTier1ToSlug(tier1Category: string): string {
    const mapping: Record<string, string> = {
      'structural': 'foundation',
      'systems': 'systems', 
      'sheathing': 'framing',
      'finishings': 'finishing'
    };
    
    return mapping[tier1Category.toLowerCase()] || tier1Category.toLowerCase();
  }

  /**
   * Map old tier2 category names to new slugs
   */
  static mapTier2ToSlug(tier2Category: string): string {
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
    
    return mapping[tier2Category.toLowerCase()] || tier2Category.toLowerCase();
  }

  /**
   * Get category ID from legacy tier1/tier2 values
   */
  static async getCategoryIdFromLegacy(
    tier1Category?: string, 
    tier2Category?: string, 
    projectId?: number
  ): Promise<number | null> {
    if (!tier1Category) return null;

    const categories = await CategoryManager.getCategories(projectId);
    
    if (tier2Category) {
      // Find by tier2 first
      const tier2Slug = this.mapTier2ToSlug(tier2Category);
      const category = categories.find(cat => cat.slug === tier2Slug);
      if (category) return category.id;
    }

    // Fall back to tier1
    const tier1Slug = this.mapTier1ToSlug(tier1Category);
    const category = categories.find(cat => cat.slug === tier1Slug);
    return category?.id || null;
  }
}

export default CategoryManager;