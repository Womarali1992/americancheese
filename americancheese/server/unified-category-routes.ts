/**
 * Unified Category Routes
 *
 * Single API endpoint for all category operations, using projectCategories as the only source of truth.
 * This replaces the fragmented category API routes with a simplified, unified approach.
 */

import { Router } from 'express';
import { eq, and, inArray } from 'drizzle-orm';
import { db } from './db.ts';
import { projectCategories, insertProjectCategorySchema, tasks } from '../shared/schema.ts';
import {
  applyPresetToProject,
  getProjectCategoryHierarchy,
  getAvailablePresets,
  initializeProjectWithPreset
} from '../shared/preset-loader.ts';

const router = Router();

// ==================== PROJECT CATEGORIES (Single source of truth) ====================

/**
 * GET /api/projects/:projectId/categories
 * Get all categories for a project in hierarchical structure
 */
router.get('/api/projects/:projectId/categories', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const hierarchy = await getProjectCategoryHierarchy(projectId);
    res.json(hierarchy);
  } catch (error) {
    console.error('Error fetching project categories:', error);
    res.status(500).json({ error: 'Failed to fetch project categories' });
  }
});

/**
 * GET /api/projects/:projectId/categories/flat
 * Get all categories for a project as a flat list (for dropdowns, etc.)
 */
router.get('/api/projects/:projectId/categories/flat', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const categories = await db.select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));

    res.json(categories);
  } catch (error) {
    console.error('Error fetching project categories:', error);
    res.status(500).json({ error: 'Failed to fetch project categories' });
  }
});

/**
 * POST /api/projects/:projectId/categories
 * Create a custom category for a project
 */
router.post('/api/projects/:projectId/categories', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const result = insertProjectCategorySchema.safeParse({
      ...req.body,
      projectId,
      isFromTemplate: false, // Custom category
      templateSource: null
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid category data',
        details: result.error.issues
      });
    }

    const [category] = await db
      .insert(projectCategories)
      .values(result.data)
      .returning();

    res.status(201).json(category);
  } catch (error) {
    console.error('Error creating project category:', error);
    res.status(500).json({ error: 'Failed to create project category' });
  }
});

/**
 * PUT /api/projects/:projectId/categories/:categoryId
 * Update a project category
 * NOTE: If the category name changes, this also updates all tasks using the old name
 */
router.put('/api/projects/:projectId/categories/:categoryId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

    // Get the current category to check if name is changing
    const [existingCategory] = await db
      .select()
      .from(projectCategories)
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId)
      ));

    if (!existingCategory) {
      return res.status(404).json({ error: 'Category not found' });
    }

    const oldName = existingCategory.name;
    const oldType = existingCategory.type;

    const result = insertProjectCategorySchema.safeParse({
      ...req.body,
      projectId
    });

    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid category data',
        details: result.error.issues
      });
    }

    const newName = result.data.name;

    const [category] = await db
      .update(projectCategories)
      .set({
        ...result.data,
        updatedAt: new Date()
      })
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId)
      ))
      .returning();

    // If the category name changed, update all tasks using the old name
    if (oldName !== newName) {
      console.log(`Category renamed from "${oldName}" to "${newName}" for project ${projectId}`);
      
      if (oldType === 'tier1') {
        // Update tier1Category in tasks
        const updateResult = await db
          .update(tasks)
          .set({ tier1Category: newName })
          .where(and(
            eq(tasks.projectId, projectId),
            eq(tasks.tier1Category, oldName)
          ));
        console.log(`Updated tasks tier1Category from "${oldName}" to "${newName}"`);
      } else if (oldType === 'tier2') {
        // Update tier2Category in tasks
        const updateResult = await db
          .update(tasks)
          .set({ tier2Category: newName })
          .where(and(
            eq(tasks.projectId, projectId),
            eq(tasks.tier2Category, oldName)
          ));
        console.log(`Updated tasks tier2Category from "${oldName}" to "${newName}"`);
      }
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating project category:', error);
    res.status(500).json({ error: 'Failed to update project category' });
  }
});

/**
 * DELETE /api/projects/:projectId/categories/:categoryId
 * Delete a project category
 */
router.delete('/api/projects/:projectId/categories/:categoryId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

    const result = await db
      .delete(projectCategories)
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project category:', error);
    res.status(500).json({ error: 'Failed to delete project category' });
  }
});

/**
 * PATCH /api/projects/:projectId/categories/reorder
 * Reorder categories by updating their sortOrder
 */
router.patch('/api/projects/:projectId/categories/reorder', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { categoryOrders } = req.body;
    if (!Array.isArray(categoryOrders)) {
      return res.status(400).json({ error: 'categoryOrders must be an array' });
    }

    // Update sort order for each category
    const updatedCategories = [];
    for (const { id, sortOrder } of categoryOrders) {
      const categoryId = parseInt(id);
      if (isNaN(categoryId)) continue;

      const [updatedCategory] = await db
        .update(projectCategories)
        .set({
          sortOrder: parseInt(sortOrder) || 0,
          updatedAt: new Date()
        })
        .where(and(
          eq(projectCategories.id, categoryId),
          eq(projectCategories.projectId, projectId)
        ))
        .returning();

      if (updatedCategory) {
        updatedCategories.push(updatedCategory);
      }
    }

    res.json({
      success: true,
      updated: updatedCategories.length
    });
  } catch (error) {
    console.error('Error reordering categories:', error);
    res.status(500).json({ error: 'Failed to reorder categories' });
  }
});

/**
 * POST /api/projects/:projectId/categories/:categoryId/duplicate
 * Duplicate a tier1 category with all its subcategories and tasks
 */
router.post('/api/projects/:projectId/categories/:categoryId/duplicate', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

    const { newName } = req.body;
    if (!newName || typeof newName !== 'string' || !newName.trim()) {
      return res.status(400).json({ error: 'New category name is required' });
    }

    // Get the original tier1 category
    const [originalCategory] = await db
      .select()
      .from(projectCategories)
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId),
        eq(projectCategories.type, 'tier1')
      ));

    if (!originalCategory) {
      return res.status(404).json({ error: 'Tier1 category not found' });
    }

    // Create the new tier1 category
    const [newTier1Category] = await db
      .insert(projectCategories)
      .values({
        projectId,
        name: newName.trim(),
        description: originalCategory.description,
        type: 'tier1',
        parentId: null,
        color: originalCategory.color,
        sortOrder: originalCategory.sortOrder,
        isFromTemplate: false,
        templateSource: null
      })
      .returning();

    // Get all tier2 subcategories of the original category
    const originalSubcategories = await db
      .select()
      .from(projectCategories)
      .where(and(
        eq(projectCategories.parentId, categoryId),
        eq(projectCategories.projectId, projectId),
        eq(projectCategories.type, 'tier2')
      ));

    // Map to store old category ID -> new category ID
    const categoryIdMap = new Map<number, number>();
    categoryIdMap.set(categoryId, newTier1Category.id);

    // Duplicate all tier2 subcategories
    const newSubcategories = [];
    for (const subcategory of originalSubcategories) {
      const [newSubcategory] = await db
        .insert(projectCategories)
        .values({
          projectId,
          name: subcategory.name,
          description: subcategory.description,
          type: 'tier2',
          parentId: newTier1Category.id,
          color: subcategory.color,
          sortOrder: subcategory.sortOrder,
          isFromTemplate: false,
          templateSource: null
        })
        .returning();

      newSubcategories.push(newSubcategory);
      categoryIdMap.set(subcategory.id, newSubcategory.id);
    }

    // Get all tasks associated with the original categories
    const originalCategoryIds = [categoryId, ...originalSubcategories.map(sc => sc.id)];
    const originalTasks = await db
      .select()
      .from(tasks)
      .where(and(
        eq(tasks.projectId, projectId),
        inArray(tasks.categoryId, originalCategoryIds)
      ));

    // Duplicate all tasks with new category IDs
    const duplicatedTasks = [];
    for (const task of originalTasks) {
      const newCategoryId = categoryIdMap.get(task.categoryId!);
      if (!newCategoryId) continue;

      const [newTask] = await db
        .insert(tasks)
        .values({
          title: task.title,
          description: task.description,
          projectId: task.projectId,
          categoryId: newCategoryId,
          tier1Category: task.tier1Category,
          tier2Category: task.tier2Category,
          category: task.category,
          materialsNeeded: task.materialsNeeded,
          startDate: task.startDate,
          endDate: task.endDate,
          status: task.status,
          assignedTo: task.assignedTo,
          completed: task.completed,
          contactIds: task.contactIds,
          materialIds: task.materialIds,
          templateId: task.templateId,
          estimatedCost: task.estimatedCost,
          actualCost: task.actualCost,
          parentTaskId: task.parentTaskId,
          sortOrder: task.sortOrder
        })
        .returning();

      duplicatedTasks.push(newTask);
    }

    res.json({
      success: true,
      newCategory: newTier1Category,
      subcategoriesCreated: newSubcategories.length,
      tasksCreated: duplicatedTasks.length,
      message: `Successfully duplicated category "${originalCategory.name}" as "${newName}" with ${newSubcategories.length} subcategories and ${duplicatedTasks.length} tasks`
    });
  } catch (error) {
    console.error('Error duplicating category:', error);
    res.status(500).json({ error: 'Failed to duplicate category' });
  }
});

// ==================== CATEGORY CONTEXT ====================

/**
 * GET /api/projects/:projectId/categories/:categoryId/context
 * Get the AI context for a category
 */
router.get('/api/projects/:projectId/categories/:categoryId/context', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

    const [category] = await db.select()
      .from(projectCategories)
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId)
      ));

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    let context = null;
    if (category.structuredContext) {
      try {
        context = JSON.parse(category.structuredContext);
      } catch {
        context = null;
      }
    }

    res.json({
      categoryId: category.id,
      categoryName: category.name,
      context,
      raw: category.structuredContext
    });
  } catch (error) {
    console.error('Error fetching category context:', error);
    res.status(500).json({ error: 'Failed to fetch category context' });
  }
});

/**
 * PUT /api/projects/:projectId/categories/:categoryId/context
 * Update the AI context for a category
 */
router.put('/api/projects/:projectId/categories/:categoryId/context', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'Context data is required' });
    }

    const contextString = typeof context === 'string'
      ? context
      : JSON.stringify(context);

    const [category] = await db
      .update(projectCategories)
      .set({
        structuredContext: contextString,
        updatedAt: new Date()
      })
      .where(and(
        eq(projectCategories.id, categoryId),
        eq(projectCategories.projectId, projectId)
      ))
      .returning();

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
    }

    res.json({
      success: true,
      categoryId: category.id,
      context: JSON.parse(contextString)
    });
  } catch (error) {
    console.error('Error updating category context:', error);
    res.status(500).json({ error: 'Failed to update category context' });
  }
});

// ==================== PRESET OPERATIONS ====================

/**
 * GET /api/categories/presets
 * Get all available presets
 */
router.get('/api/categories/presets', async (req, res) => {
  try {
    const presets = getAvailablePresets();
    res.json(presets);
  } catch (error) {
    console.error('Error fetching presets:', error);
    res.status(500).json({ error: 'Failed to fetch presets' });
  }
});

/**
 * POST /api/projects/:projectId/categories/apply-preset
 * Apply a preset to a project (creates categories from preset)
 */
router.post('/api/projects/:projectId/categories/apply-preset', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { presetId, replaceExisting = true } = req.body; // Default to replacing existing categories
    if (!presetId || typeof presetId !== 'string') {
      return res.status(400).json({ error: 'Preset ID is required' });
    }

    const result = await applyPresetToProject(projectId, presetId, replaceExisting);

    if (!result.success) {
      return res.status(400).json({ error: result.error });
    }

    res.json({
      success: true,
      message: `Applied preset successfully`,
      categoriesCreated: result.categoriesCreated
    });
  } catch (error) {
    console.error('Error applying preset:', error);
    res.status(500).json({ error: 'Failed to apply preset' });
  }
});

/**
 * POST /api/projects/:projectId/categories/initialize
 * Initialize a project with default categories (called during project creation)
 */
router.post('/api/projects/:projectId/categories/initialize', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { presetId = 'home-builder' } = req.body;

    await initializeProjectWithPreset(projectId, presetId);

    res.json({
      success: true,
      message: `Project initialized with preset '${presetId}'`
    });
  } catch (error) {
    console.error('Error initializing project categories:', error);
    res.status(500).json({ error: 'Failed to initialize project categories' });
  }
});

export default router;