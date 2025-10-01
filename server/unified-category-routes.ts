/**
 * Unified Category Routes
 *
 * Single API endpoint for all category operations, using projectCategories as the only source of truth.
 * This replaces the fragmented category API routes with a simplified, unified approach.
 */

import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from './db.ts';
import { projectCategories, insertProjectCategorySchema } from '../shared/schema.ts';
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
 */
router.put('/api/projects/:projectId/categories/:categoryId', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categoryId = parseInt(req.params.categoryId);

    if (isNaN(projectId) || isNaN(categoryId)) {
      return res.status(400).json({ error: 'Invalid project ID or category ID' });
    }

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

    if (!category) {
      return res.status(404).json({ error: 'Category not found' });
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