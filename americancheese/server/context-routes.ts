/**
 * Context Control Center API Routes
 *
 * Endpoints for managing AI context templates and project context data.
 */

import { Router, Request, Response } from 'express';
import { db } from './db';
import { aiContextTemplates, projects, tasks, insertAiContextTemplateSchema } from '../shared/schema';
import { eq, and, or, isNull } from 'drizzle-orm';
import { generateContextXml, generateFullContextXml } from '../shared/context-xml-generator';
import { ContextData } from '../shared/context-types';

const router = Router();

// ==========================================
// Context Templates CRUD
// ==========================================

/**
 * GET /api/context-templates
 * List all context templates (global + optionally project-specific)
 */
router.get('/context-templates', async (req: Request, res: Response) => {
  try {
    const projectId = req.query.projectId ? parseInt(req.query.projectId as string) : null;

    let templates;
    if (projectId) {
      // Get global templates + templates for this specific project
      templates = await db
        .select()
        .from(aiContextTemplates)
        .where(
          or(
            eq(aiContextTemplates.isGlobal, true),
            eq(aiContextTemplates.projectId, projectId)
          )
        )
        .orderBy(aiContextTemplates.name);
    } else {
      // Get only global templates
      templates = await db
        .select()
        .from(aiContextTemplates)
        .where(eq(aiContextTemplates.isGlobal, true))
        .orderBy(aiContextTemplates.name);
    }

    res.json(templates);
  } catch (error) {
    console.error('Error fetching context templates:', error);
    res.status(500).json({ error: 'Failed to fetch context templates' });
  }
});

/**
 * GET /api/context-templates/:id
 * Get a single context template
 */
router.get('/context-templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const [template] = await db
      .select()
      .from(aiContextTemplates)
      .where(eq(aiContextTemplates.id, id));

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error fetching context template:', error);
    res.status(500).json({ error: 'Failed to fetch context template' });
  }
});

/**
 * POST /api/context-templates
 * Create a new context template
 */
router.post('/context-templates', async (req: Request, res: Response) => {
  try {
    const validation = insertAiContextTemplateSchema.safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const [template] = await db
      .insert(aiContextTemplates)
      .values(validation.data)
      .returning();

    res.status(201).json(template);
  } catch (error) {
    console.error('Error creating context template:', error);
    res.status(500).json({ error: 'Failed to create context template' });
  }
});

/**
 * PUT /api/context-templates/:id
 * Update a context template
 */
router.put('/context-templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const validation = insertAiContextTemplateSchema.partial().safeParse(req.body);
    if (!validation.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: validation.error.errors,
      });
    }

    const [template] = await db
      .update(aiContextTemplates)
      .set({
        ...validation.data,
        updatedAt: new Date(),
      })
      .where(eq(aiContextTemplates.id, id))
      .returning();

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json(template);
  } catch (error) {
    console.error('Error updating context template:', error);
    res.status(500).json({ error: 'Failed to update context template' });
  }
});

/**
 * DELETE /api/context-templates/:id
 * Delete a context template
 */
router.delete('/context-templates/:id', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid template ID' });
    }

    const [deleted] = await db
      .delete(aiContextTemplates)
      .where(eq(aiContextTemplates.id, id))
      .returning();

    if (!deleted) {
      return res.status(404).json({ error: 'Template not found' });
    }

    res.json({ success: true, deleted });
  } catch (error) {
    console.error('Error deleting context template:', error);
    res.status(500).json({ error: 'Failed to delete context template' });
  }
});

// ==========================================
// Project Context Management
// ==========================================

/**
 * GET /api/projects/:id/context
 * Get the structured context for a project
 */
router.get('/projects/:id/context', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        structuredContext: projects.structuredContext,
      })
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    // Parse the context if it exists
    let context = null;
    if (project.structuredContext) {
      try {
        context = JSON.parse(project.structuredContext);
      } catch {
        context = null;
      }
    }

    res.json({
      projectId: project.id,
      projectName: project.name,
      context,
      raw: project.structuredContext,
    });
  } catch (error) {
    console.error('Error fetching project context:', error);
    res.status(500).json({ error: 'Failed to fetch project context' });
  }
});

/**
 * PUT /api/projects/:id/context
 * Update the structured context for a project
 */
router.put('/projects/:id/context', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'Context data is required' });
    }

    // Stringify if object
    const contextString = typeof context === 'string'
      ? context
      : JSON.stringify(context);

    const [project] = await db
      .update(projects)
      .set({ structuredContext: contextString })
      .where(eq(projects.id, id))
      .returning();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      projectId: project.id,
      context: JSON.parse(contextString),
    });
  } catch (error) {
    console.error('Error updating project context:', error);
    res.status(500).json({ error: 'Failed to update project context' });
  }
});

/**
 * GET /api/projects/:id/context/export
 * Export project context as XML
 */
router.get('/projects/:id/context/export', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const full = req.query.full === 'true';

    const [project] = await db
      .select({
        id: projects.id,
        name: projects.name,
        structuredContext: projects.structuredContext,
      })
      .from(projects)
      .where(eq(projects.id, id));

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    if (!project.structuredContext) {
      return res.status(404).json({ error: 'Project has no context data' });
    }

    const context: ContextData = JSON.parse(project.structuredContext);
    const entityId = `project-${project.id}`;

    const xml = full
      ? generateFullContextXml(context, entityId)
      : generateContextXml(context, entityId);

    // Check if client wants XML file download
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="context-${project.name.replace(/\s+/g, '-')}.xml"`
      );
      return res.send(xml);
    }

    res.json({
      projectId: project.id,
      projectName: project.name,
      xml,
    });
  } catch (error) {
    console.error('Error exporting project context:', error);
    res.status(500).json({ error: 'Failed to export project context' });
  }
});

/**
 * POST /api/projects/:id/context/apply-template
 * Apply a template to a project's context
 */
router.post('/projects/:id/context/apply-template', async (req: Request, res: Response) => {
  try {
    const projectId = parseInt(req.params.id);
    if (isNaN(projectId)) {
      return res.status(400).json({ error: 'Invalid project ID' });
    }

    const { templateId, merge } = req.body;
    if (!templateId) {
      return res.status(400).json({ error: 'Template ID is required' });
    }

    // Get the template
    const [template] = await db
      .select()
      .from(aiContextTemplates)
      .where(eq(aiContextTemplates.id, parseInt(templateId)));

    if (!template) {
      return res.status(404).json({ error: 'Template not found' });
    }

    // Parse template context
    let templateContext: ContextData;
    try {
      templateContext = JSON.parse(template.contextData);
    } catch {
      return res.status(500).json({ error: 'Invalid template data' });
    }

    // Get current project context if merging
    let finalContext = templateContext;
    if (merge) {
      const [project] = await db
        .select({ structuredContext: projects.structuredContext })
        .from(projects)
        .where(eq(projects.id, projectId));

      if (project?.structuredContext) {
        try {
          const currentContext: ContextData = JSON.parse(project.structuredContext);
          // Merge: keep current content where it exists, fill in from template otherwise
          finalContext = {
            ...templateContext,
            entityId: `project-${projectId}`,
            entityType: 'project',
            sections: templateContext.sections.map(templateSection => {
              const currentSection = currentContext.sections.find(
                s => s.type === templateSection.type
              );
              if (currentSection && currentSection.content) {
                // Keep current content if it exists
                return { ...templateSection, content: currentSection.content };
              }
              return templateSection;
            }),
            metadata: {
              ...templateContext.metadata,
              templateId: template.id,
              templateName: template.name,
              updatedAt: new Date().toISOString(),
            },
          };
        } catch {
          // If current context is invalid, just use template
        }
      }
    }

    // Update project with template context
    finalContext.entityId = `project-${projectId}`;
    finalContext.entityType = 'project';
    finalContext.metadata = {
      ...finalContext.metadata,
      templateId: template.id,
      templateName: template.name,
      updatedAt: new Date().toISOString(),
    };

    const [project] = await db
      .update(projects)
      .set({ structuredContext: JSON.stringify(finalContext) })
      .where(eq(projects.id, projectId))
      .returning();

    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    res.json({
      success: true,
      projectId: project.id,
      templateApplied: template.name,
      context: finalContext,
    });
  } catch (error) {
    console.error('Error applying template:', error);
    res.status(500).json({ error: 'Failed to apply template' });
  }
});

// ==========================================
// Task Context Management
// ==========================================

/**
 * GET /api/tasks/:id/context
 * Get the structured context for a task
 */
router.get('/tasks/:id/context', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        structuredContext: tasks.structuredContext,
      })
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    // Parse the context if it exists
    let context = null;
    if (task.structuredContext) {
      try {
        context = JSON.parse(task.structuredContext);
      } catch {
        context = null;
      }
    }

    res.json({
      taskId: task.id,
      taskTitle: task.title,
      context,
      raw: task.structuredContext,
    });
  } catch (error) {
    console.error('Error fetching task context:', error);
    res.status(500).json({ error: 'Failed to fetch task context' });
  }
});

/**
 * PUT /api/tasks/:id/context
 * Update the structured context for a task
 */
router.put('/tasks/:id/context', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const { context } = req.body;
    if (!context) {
      return res.status(400).json({ error: 'Context data is required' });
    }

    // Stringify if object
    const contextString = typeof context === 'string'
      ? context
      : JSON.stringify(context);

    const [task] = await db
      .update(tasks)
      .set({ structuredContext: contextString })
      .where(eq(tasks.id, id))
      .returning();

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    res.json({
      success: true,
      taskId: task.id,
      context: JSON.parse(contextString),
    });
  } catch (error) {
    console.error('Error updating task context:', error);
    res.status(500).json({ error: 'Failed to update task context' });
  }
});

/**
 * GET /api/tasks/:id/context/export
 * Export task context as XML
 */
router.get('/tasks/:id/context/export', async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid task ID' });
    }

    const full = req.query.full === 'true';

    const [task] = await db
      .select({
        id: tasks.id,
        title: tasks.title,
        structuredContext: tasks.structuredContext,
      })
      .from(tasks)
      .where(eq(tasks.id, id));

    if (!task) {
      return res.status(404).json({ error: 'Task not found' });
    }

    if (!task.structuredContext) {
      return res.status(404).json({ error: 'Task has no context data' });
    }

    const context: ContextData = JSON.parse(task.structuredContext);
    const entityId = `task-${task.id}`;

    const xml = full
      ? generateFullContextXml(context, entityId)
      : generateContextXml(context, entityId);

    // Check if client wants XML file download
    if (req.query.download === 'true') {
      res.setHeader('Content-Type', 'application/xml');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename="context-task-${task.id}.xml"`
      );
      return res.send(xml);
    }

    res.json({
      taskId: task.id,
      taskTitle: task.title,
      xml,
    });
  } catch (error) {
    console.error('Error exporting task context:', error);
    res.status(500).json({ error: 'Failed to export task context' });
  }
});

// ==========================================
// Generic Context Export
// ==========================================

/**
 * POST /api/context/export-xml
 * Export arbitrary context data as XML
 */
router.post('/context/export-xml', async (req: Request, res: Response) => {
  try {
    const { context, entityId, full } = req.body;

    if (!context) {
      return res.status(400).json({ error: 'Context data is required' });
    }

    const contextData: ContextData = typeof context === 'string'
      ? JSON.parse(context)
      : context;

    const xml = full
      ? generateFullContextXml(contextData, entityId)
      : generateContextXml(contextData, entityId);

    res.json({ xml });
  } catch (error) {
    console.error('Error exporting context:', error);
    res.status(500).json({ error: 'Failed to export context' });
  }
});

export default router;
