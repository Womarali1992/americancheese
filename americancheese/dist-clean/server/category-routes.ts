import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from './db.js';
import { 
  categoryTemplates, 
  projectCategories, 
  insertCategoryTemplateSchema, 
  insertProjectCategorySchema,
  CategoryTemplate,
  ProjectCategory
} from '@shared/schema';

const router = Router();

// ==================== CATEGORY TEMPLATES (Global templates) ====================

// Get all category templates
router.get('/api/category-templates', async (req, res) => {
  try {
    const templates = await db.select().from(categoryTemplates);
    res.json(templates);
  } catch (error) {
    console.error('Error fetching category templates:', error);
    res.status(500).json({ error: 'Failed to fetch category templates' });
  }
});

// Create a new category template
router.post('/api/category-templates', async (req, res) => {
  try {
    const result = insertCategoryTemplateSchema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const [template] = await db.insert(categoryTemplates).values(result.data).returning();
    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating category template:', error);
    res.status(500).json({ error: 'Failed to create category template' });
  }
});

// Update a category template
router.put('/api/category-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const result = insertCategoryTemplateSchema.safeParse(req.body);
    
    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const [template] = await db
      .update(categoryTemplates)
      .set({ ...result.data, updatedAt: new Date() })
      .where(eq(categoryTemplates.id, id))
      .returning();

    if (!template) {
      return res.status(404).json({ error: 'Category template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error updating category template:', error);
    res.status(500).json({ error: 'Failed to update category template' });
  }
});

// Delete a category template
router.delete('/api/category-templates/:id', async (req, res) => {
  try {
    const id = parseInt(req.params.id);
    
    await db.delete(categoryTemplates).where(eq(categoryTemplates.id, id));
    res.status(204).send();
  } catch (error) {
    console.error('Error deleting category template:', error);
    res.status(500).json({ error: 'Failed to delete category template' });
  }
});

// ==================== PROJECT CATEGORIES (Project-specific categories) ====================

// Get categories for a specific project
router.get('/api/projects/:projectId/categories', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const categories = await db
      .select()
      .from(projectCategories)
      .where(eq(projectCategories.projectId, projectId));
    
    res.json(categories);
  } catch (error) {
    console.error('Error fetching project categories:', error);
    res.status(500).json({ error: 'Failed to fetch project categories' });
  }
});

// Load categories from templates into a project
router.post('/api/projects/:projectId/categories/load-templates', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const { templateIds } = req.body;

    if (!Array.isArray(templateIds) || templateIds.length === 0) {
      return res.status(400).json({ error: 'Template IDs are required' });
    }

    // Get the selected templates
    const templates = await db
      .select()
      .from(categoryTemplates)
      .where(eq(categoryTemplates.id, templateIds[0])); // Fix: Use proper SQL IN clause

    const loadedCategories = [];
    
    for (const templateId of templateIds) {
      const template = await db
        .select()
        .from(categoryTemplates)
        .where(eq(categoryTemplates.id, templateId));
      
      if (template.length > 0) {
        const [loadedCategory] = await db
          .insert(projectCategories)
          .values({
            projectId,
            name: template[0].name,
            type: template[0].type,
            parentId: template[0].parentId,
            color: template[0].color,
            templateId: template[0].id
          })
          .returning();
        
        loadedCategories.push(loadedCategory);
      }
    }

    res.json({
      message: `Loaded ${loadedCategories.length} categories from templates`,
      categories: loadedCategories
    });
  } catch (error) {
    console.error('Error loading categories from templates:', error);
    res.status(500).json({ error: 'Failed to load categories from templates' });
  }
});

// Create a custom category for a project
router.post('/api/projects/:projectId/categories', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const result = insertProjectCategorySchema.safeParse({
      ...req.body,
      projectId
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
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

// Update a project category
router.put('/api/projects/:projectId/categories/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const id = parseInt(req.params.id);
    
    const result = insertProjectCategorySchema.safeParse({
      ...req.body,
      projectId
    });

    if (!result.success) {
      return res.status(400).json({ error: result.error.issues });
    }

    const [category] = await db
      .update(projectCategories)
      .set({ ...result.data, updatedAt: new Date() })
      .where(and(
        eq(projectCategories.id, id),
        eq(projectCategories.projectId, projectId)
      ))
      .returning();

    if (!category) {
      return res.status(404).json({ error: 'Project category not found' });
    }

    res.json(category);
  } catch (error) {
    console.error('Error updating project category:', error);
    res.status(500).json({ error: 'Failed to update project category' });
  }
});

// Delete a project category
router.delete('/api/projects/:projectId/categories/:id', async (req, res) => {
  try {
    const projectId = parseInt(req.params.projectId);
    const id = parseInt(req.params.id);

    const result = await db
      .delete(projectCategories)
      .where(and(
        eq(projectCategories.id, id),
        eq(projectCategories.projectId, projectId)
      ))
      .returning();

    if (result.length === 0) {
      return res.status(404).json({ error: 'Project category not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting project category:', error);
    res.status(500).json({ error: 'Failed to delete project category' });
  }
});

export default router;