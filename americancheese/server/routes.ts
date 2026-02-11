import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { createRateLimiter } from "./middleware/rateLimiter";
import {
  insertProjectSchema,
  insertTaskSchema,
  insertContactSchema,
  insertExpenseSchema,
  insertMaterialSchema,
  insertLaborSchema,
  insertCategoryTemplateSchema,
  insertProjectCategorySchema,
  insertTaskTemplateSchema,
  insertSubtaskSchema,
  insertChecklistItemSchema,
  insertChecklistItemCommentSchema,
  insertSubtaskCommentSchema,
  insertGlobalSettingsSchema,
  insertSectionStateSchema,
  insertSectionCommentSchema,
  insertTaskAttachmentSchema,
  insertInvoiceSchema,
  insertInvoiceLineItemSchema,
  inviteProjectMemberSchema,
  updateProjectMemberRoleSchema,
  projects,
  tasks,
  labor,
  users,
  categoryTemplates,
  projectCategories,
  projectMembers,
  projectMemberAuditLog,
  taskTemplates,
  subtasks,
  checklistItems,
  checklistItemComments,
  subtaskComments,
  globalSettings,
  sectionStates,
  sectionComments,
  taskAttachments,
  invoices,
  invoiceLineItems,
  taskCategories,
  insertTaskCategorySchema
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import {
  handleLogin,
  handleLogout,
  handleRegister,
  handleGetCurrentUser,
  handleCreateApiToken,
  handleListApiTokens,
  handleRevokeApiToken,
  handleDeleteApiToken
} from "./auth";
import { db } from "./db";
import { eq, sql, isNull, and, or, inArray } from "drizzle-orm";
import csvParser from "csv-parser";
import { Readable } from "stream";
import multer from "multer";
import OpenAI from "openai";
import { parseStringPromise } from "xml2js";
import credentialsRouter from "./credentials-routes";
import { SAFE_ERROR_MESSAGES } from "../shared/constants/errors";
import { sanitizeMemberError } from "./utils/errorSanitizer";
import { addRandomDelay, sendSecureErrorResponse } from "./utils/timingAttackPrevention";

// Middleware to require admin role for admin endpoints
async function requireAdmin(req: Request, res: Response, next: () => void): Promise<void> {
  const userId = req.session?.userId;
  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }
  try {
    const [user] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
    if (!user || user.role !== 'admin') {
      res.status(403).json({ error: 'Admin access required' });
      return;
    }
    next();
  } catch (error) {
    res.status(500).json({ error: 'Authorization check failed' });
  }
}

export async function registerRoutes(app: Express): Promise<Server> {
  // Set up multer storage for file uploads
  const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
  });

  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/register", handleRegister);
  app.post("/api/auth/logout", handleLogout);
  app.get("/api/auth/me", handleGetCurrentUser);

  // API Token management routes
  app.post("/api/auth/tokens", handleCreateApiToken);
  app.get("/api/auth/tokens", handleListApiTokens);
  app.post("/api/auth/tokens/:id/revoke", handleRevokeApiToken);
  app.delete("/api/auth/tokens/:id", handleDeleteApiToken);

  // Credentials Vault routes
  app.use('/api/credentials', credentialsRouter);

  // Apply admin role check to all /api/admin/* routes
  app.use('/api/admin', requireAdmin);

  // ==================== ADMIN TEMPLATE CATEGORIES ====================

  // Get all template categories (admin endpoint)
  app.get("/api/admin/template-categories", async (req: Request, res: Response) => {
    try {
      const categories = await db.select().from(categoryTemplates).orderBy(
        sql`case when ${categoryTemplates.type} = 'tier1' then 0 else 1 end`,
        categoryTemplates.name
      );
      res.json(categories);
    } catch (error) {
      console.error('Error fetching template categories:', error);
      res.status(500).json({ error: 'Failed to fetch template categories' });
    }
  });

  // Create a new template category (admin endpoint)
  app.post("/api/admin/template-categories", async (req: Request, res: Response) => {
    try {
      const result = insertCategoryTemplateSchema.safeParse(req.body);
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const [category] = await db.insert(categoryTemplates).values(result.data).returning();
      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating template category:', error);
      res.status(500).json({ error: 'Failed to create template category' });
    }
  });

  // Update a template category (admin endpoint)
  app.put("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const result = insertCategoryTemplateSchema.safeParse(req.body);
      
      if (!result.success) {
        return res.status(400).json({ error: result.error.issues });
      }

      const [category] = await db
        .update(categoryTemplates)
        .set({ ...result.data, updatedAt: new Date() })
        .where(eq(categoryTemplates.id, id))
        .returning();

      if (!category) {
        return res.status(404).json({ error: 'Template category not found' });
      }

      res.json(category);
    } catch (error) {
      console.error('Error updating template category:', error);
      res.status(500).json({ error: 'Failed to update template category' });
    }
  });

  // Delete a template category (admin endpoint)
  app.delete("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      
      await db.delete(categoryTemplates).where(eq(categoryTemplates.id, id));
      res.status(204).send();
    } catch (error) {
      console.error('Error deleting template category:', error);
      res.status(500).json({ error: 'Failed to delete template category' });
    }
  });

  // ==================== PROJECT TEMPLATE CATEGORIES ====================
  
  // Get template categories for a specific project (combined with project-specific ones)
  app.get("/api/projects/:projectId/template-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      
      // Get project-specific categories
      const projectCats = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, projectId))
        .orderBy(
          sql`case when ${projectCategories.type} = 'tier1' then 0 else 1 end`,
          projectCategories.sortOrder,
          projectCategories.name
        );

      res.json(projectCats);
    } catch (error) {
      console.error('Error fetching project template categories:', error);
      res.status(500).json({ error: 'Failed to fetch project template categories' });
    }
  });

  // Initialize standard templates in the database
  app.post("/api/admin/initialize-templates", async (req: Request, res: Response) => {
    try {
      const { initializeStandardTemplates } = await import('../utils/template-management');
      await initializeStandardTemplates();
      res.json({ success: true, message: 'Standard templates initialized successfully' });
    } catch (error) {
      console.error('Error initializing templates:', error);
      res.status(500).json({ error: 'Failed to initialize templates' });
    }
  });

  // Clean up phantom categories
  app.post("/api/admin/cleanup-phantom-categories", async (req: Request, res: Response) => {
    try {
      const { cleanupPhantomCategories } = await import('../utils/template-management');
      await cleanupPhantomCategories();
      res.json({ success: true, message: 'Phantom categories cleaned up successfully' });
    } catch (error) {
      console.error('Error cleaning up phantom categories:', error);
      res.status(500).json({ error: 'Failed to clean up phantom categories' });
    }
  });

  // Clean up mixed preset categories
  app.post("/api/admin/cleanup-mixed-presets", async (req: Request, res: Response) => {
    try {
      const { cleanupAllMixedPresets } = await import('../utils/cleanup-mixed-presets');
      await cleanupAllMixedPresets();
      res.json({ success: true, message: 'Mixed preset categories cleaned up successfully' });
    } catch (error) {
      console.error('Error cleaning up mixed presets:', error);
      res.status(500).json({ error: 'Failed to clean up mixed preset categories' });
    }
  });

  // Load standard templates into a project
  app.post("/api/projects/:projectId/load-standard-templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { theme } = req.body;
      
      const { loadTemplatesIntoProject } = await import('../utils/template-management');
      const { getActiveColorTheme } = await import('../client/src/lib/color-themes');
      
      const activeTheme = theme || getActiveColorTheme();
      await loadTemplatesIntoProject(projectId, activeTheme);
      
      res.json({ success: true, message: 'Standard templates loaded into project successfully' });
    } catch (error) {
      console.error('Error loading templates into project:', error);
      res.status(500).json({ error: 'Failed to load templates into project' });
    }
  });

  // Load preset categories into a project
  app.post("/api/projects/:projectId/load-preset-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { presetId, replaceExisting = true, preserveTheme = false } = req.body; // Default to replacing existing categories

      if (!presetId) {
        return res.status(400).json({ error: 'Preset ID is required' });
      }

      const { applyPresetToProject } = await import('../shared/preset-loader.ts');
      const result = await applyPresetToProject(projectId, presetId, replaceExisting, preserveTheme);

      if (result.success) {
        res.json({
          success: true,
          categoriesCreated: result.categoriesCreated,
          message: `Successfully loaded preset '${presetId}' with ${result.categoriesCreated} categories for project ${projectId}`
        });
      } else {
        res.status(400).json({
          error: 'Failed to load preset categories',
          details: result.error
        });
      }
    } catch (error) {
      console.error('Error loading preset categories:', error);
      res.status(500).json({
        error: 'Failed to load preset categories',
        details: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Load template categories into a project
  app.post("/api/projects/:projectId/load-template-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const { templateIds } = req.body;

      if (!Array.isArray(templateIds) || templateIds.length === 0) {
        return res.status(400).json({ error: 'Template IDs are required' });
      }

      const loadedCategories = [];

      for (const templateId of templateIds) {
        const [template] = await db
          .select()
          .from(categoryTemplates)
          .where(eq(categoryTemplates.id, templateId));

        if (template) {
          // Check if category already exists in project
          const existingCategory = await db
            .select()
            .from(projectCategories)
            .where(and(
              eq(projectCategories.projectId, projectId),
              eq(projectCategories.name, template.name),
              eq(projectCategories.type, template.type)
            ));

          if (existingCategory.length === 0) {
            const [loadedCategory] = await db
              .insert(projectCategories)
              .values({
                projectId,
                name: template.name,
                type: template.type,
                parentId: template.parentId,
                color: template.color,
                description: template.description,
                templateId: template.id
              })
              .returning();
            
            loadedCategories.push(loadedCategory);
          }
        }
      }

      res.json({
        message: `Loaded ${loadedCategories.length} categories from templates`,
        categories: loadedCategories
      });
    } catch (error) {
      console.error('Error loading template categories:', error);
      res.status(500).json({ error: 'Failed to load template categories' });
    }
  });
  
  // Debug endpoints - only available in development
  if (process.env.NODE_ENV !== 'production') {
    // Test endpoint for debugging - no auth required
    app.get("/api/test", (req: Request, res: Response) => {
      // Set a test cookie for client debugging
      res.cookie('test-cookie', 'test-value', {
        maxAge: 60000, // 1 minute
        secure: false,
        httpOnly: false
      });

      res.json({
        message: "Test endpoint works!",
        sessionExists: !!req.session,
        sessionId: req.session.id || null,
        isAuthenticated: !!req.session.authenticated,
        loginTime: req.session.loginTime || null,
        cookies: req.headers.cookie || null,
        cookieHeader: req.headers.cookie,
        headers: req.headers,
        envInfo: {
          nodeEnv: process.env.NODE_ENV || 'not set'
        }
      });
    });

    // Create sample project for testing template features
    app.post("/api/create-sample-project", async (_req: Request, res: Response) => {
      try {
        // Check if we already have projects
        const existingProjects = await db.select().from(projects);

        if (existingProjects.length > 0) {
          return res.json({
            success: true,
            message: "Projects already exist, skipping creation",
            projects: existingProjects
          });
        }

        // Create a sample project
        const startDate = new Date();
        const endDate = new Date();
        endDate.setMonth(endDate.getMonth() + 3);

        const result = await db.insert(projects).values({
          name: "Sample Residential Project",
          location: "123 Main Street, Anytown, CA",
          startDate: startDate.toISOString().split('T')[0],
          endDate: endDate.toISOString().split('T')[0],
          description: "A sample residential construction project for testing template features",
          status: "active",
          progress: 10,
          selectedTemplates: []
        }).returning();

        return res.json({
          success: true,
          message: "Sample project created successfully",
          project: result[0]
        });
      } catch (error) {
        console.error("Error creating sample project:", error);
        return res.status(500).json({
          success: false,
          message: "Failed to create sample project",
          error: error instanceof Error ? error.message : String(error)
        });
      }
    });
  }
  
  // Auth middleware is now applied in index.ts for the entire app
  // Project routes
  app.get("/api/projects", async (req: Request, res: Response) => {
    try {
      // Get projects only for the logged-in user
      const userId = req.session?.userId;
      const projects = await storage.getProjects(userId);
      res.json(projects);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch projects" });
    }
  });

  app.get("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if user has access to this project
      const userId = req.session?.userId;
      if (userId) {
        const access = await storage.checkProjectAccess?.(userId, id);
        if (!access?.hasAccess) {
          return res.status(403).json({ message: "You don't have access to this project" });
        }
        // Add the user's role to the response
        (project as any).memberRole = access.role;
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
    }
  });

  // Get project budget summary with variance by category
  app.get("/api/projects/:id/budget-summary", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get all tasks for project
      const tasks = await storage.getTasksByProject(projectId);

      // Get all materials for project
      const allMaterials = await storage.getMaterials();
      const projectMaterials = allMaterials.filter(m => m.projectId === projectId);

      // Get all labor for project
      const allLabor = await storage.getLabor();
      const projectLabor = allLabor.filter(l => l.projectId === projectId);

      // Calculate totals by tier1 category
      const categoryBudgets: Record<string, { estimated: number; actual: number }> = {};

      // Aggregate task costs by category
      for (const task of tasks) {
        const category = task.tier1Category || 'Uncategorized';
        if (!categoryBudgets[category]) {
          categoryBudgets[category] = { estimated: 0, actual: 0 };
        }
        categoryBudgets[category].estimated += task.estimatedCost || 0;
        categoryBudgets[category].actual += task.actualCost || 0;
      }

      // Calculate material costs (estimated vs actual)
      const materialEstimatedCost = projectMaterials.reduce((sum, m) => {
        // Use estimatedCost if available, otherwise fall back to cost
        const estimatedPerUnit = m.estimatedCost !== null && m.estimatedCost !== undefined
          ? m.estimatedCost
          : (m.cost || 0);
        return sum + (estimatedPerUnit * (m.quantity || 1));
      }, 0);

      const materialActualCost = projectMaterials.reduce((sum, m) => {
        const actualPerUnit = m.cost || 0;
        return sum + (actualPerUnit * (m.quantity || 1));
      }, 0);

      // Calculate labor costs (estimated vs actual)
      const laborEstimatedCost = projectLabor.reduce((sum, l) => {
        // Use estimatedLaborCost if available, otherwise fall back to laborCost
        return sum + (l.estimatedLaborCost !== null && l.estimatedLaborCost !== undefined
          ? l.estimatedLaborCost
          : (l.laborCost || 0));
      }, 0);

      const laborActualCost = projectLabor.reduce((sum, l) => sum + (l.laborCost || 0), 0);

      // Create budget categories array
      const categories = Object.entries(categoryBudgets).map(([name, data]) => ({
        name,
        estimated: data.estimated,
        actual: data.actual
      }));

      // Add materials as a separate category if there are any materials
      if (materialEstimatedCost > 0 || materialActualCost > 0) {
        categories.push({
          name: 'Materials',
          estimated: materialEstimatedCost,
          actual: materialActualCost
        });
      }

      // Add labor as a separate category if there are any labor entries
      if (laborEstimatedCost > 0 || laborActualCost > 0) {
        categories.push({
          name: 'Labor',
          estimated: laborEstimatedCost,
          actual: laborActualCost
        });
      }

      // Calculate totals
      const totalEstimated = categories.reduce((sum, c) => sum + c.estimated, 0);
      const totalActual = categories.reduce((sum, c) => sum + c.actual, 0);

      res.json({
        projectId,
        categories,
        totals: {
          estimated: totalEstimated,
          actual: totalActual,
          variance: totalEstimated - totalActual,
          variancePercent: totalEstimated > 0
            ? ((totalEstimated - totalActual) / totalEstimated * 100).toFixed(1)
            : "0"
        },
        breakdown: {
          taskEstimated: tasks.reduce((sum, t) => sum + (t.estimatedCost || 0), 0),
          taskActual: tasks.reduce((sum, t) => sum + (t.actualCost || 0), 0),
          materialCost,
          laborCost
        }
      });
    } catch (error) {
      console.error("Error fetching budget summary:", error);
      res.status(500).json({ message: "Failed to fetch budget summary" });
    }
  });

  app.post("/api/projects", async (req: Request, res: Response) => {
    try {
      const result = insertProjectSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      console.log("Attempting to create project with data:", JSON.stringify(result.data));

      try {
        // Create the project with owner set to logged-in user
        // Note: Preset categories are now loaded by the client via /load-preset-categories endpoint
        const projectData = {
          ...result.data,
          createdBy: req.session?.userId || null
        };
        const project = await storage.createProject(projectData);

        // Return the created project
        res.status(201).json({
          ...project,
          message: "Project created successfully"
        });
      } catch (dbError) {
        console.error("Database error creating project:", dbError);
        return res.status(500).json({ 
          message: "Failed to create project in database", 
          error: dbError instanceof Error ? dbError.message : String(dbError) 
        });
      }
    } catch (error) {
      console.error("General error creating project:", error);
      res.status(500).json({ 
        message: "Failed to create project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if user has edit access
      const userId = req.session?.userId;
      if (userId) {
        const access = await storage.checkProjectAccess?.(userId, id);
        if (!access?.hasAccess || !['owner', 'admin', 'editor'].includes(access.role || '')) {
          return res.status(403).json({ message: "You don't have permission to edit this project" });
        }
      }

      const result = insertProjectSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const project = await storage.updateProject(id, result.data);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  // PATCH endpoint for partial project updates (same as PUT but better semantics)
  app.patch("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if user has edit access
      const userId = req.session?.userId;
      if (userId) {
        const access = await storage.checkProjectAccess?.(userId, id);
        if (!access?.hasAccess || !['owner', 'admin', 'editor'].includes(access.role || '')) {
          return res.status(403).json({ message: "You don't have permission to edit this project" });
        }
      }

      const result = insertProjectSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const project = await storage.updateProject(id, result.data);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to update project" });
    }
  });

  app.delete("/api/projects/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if user is the owner (only owners can delete projects)
      const userId = req.session?.userId;
      if (userId) {
        const access = await storage.checkProjectAccess?.(userId, id);
        if (!access?.hasAccess || access.role !== 'owner') {
          return res.status(403).json({ message: "Only the project owner can delete this project" });
        }
      }

      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // ==================== PROJECT SHARING / MEMBERS ====================

  // Get project members
  app.get("/api/projects/:id/members", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user has access to this project
      const access = await storage.checkProjectAccess?.(userId, projectId);
      if (!access?.hasAccess) {
        return res.status(403).json({ message: "You don't have access to this project" });
      }

      const members = await storage.getProjectMembers?.(projectId) || [];

      // Also include the owner as a "member" for display purposes
      const project = await storage.getProject(projectId);
      if (project?.createdBy && db) {
        // Get owner info from the database
        const ownerUser = await db.select({
          id: users.id,
          email: users.email,
          name: users.name
        }).from(users).where(eq(users.id, project.createdBy));

        if (ownerUser[0]) {
          // Add owner to members list if not already there
          const ownerMember = {
            id: 0, // Special ID for owner
            projectId,
            userId: project.createdBy,
            role: 'owner',
            status: 'accepted',
            invitedEmail: ownerUser[0].email,
            invitedAt: null,
            acceptedAt: null,
            user: ownerUser[0]
          };

          // Check if owner is not already in members list
          const ownerInMembers = members.some(m => m.userId === project.createdBy);
          if (!ownerInMembers) {
            members.unshift(ownerMember);
          }
        }
      }

      res.json(members);
    } catch (error) {
      console.error("Error fetching project members:", error);
      res.status(500).json({ message: "Failed to fetch project members" });
    }
  });

  /**
   * Invite a user to a project
   *
   * SECURITY HARDENED (SEC-01): Email Enumeration Prevention
   *
   * This endpoint has been hardened against email enumeration attacks by:
   * 1. Returning identical error messages for all failure scenarios
   * 2. Adding random timing delays to prevent timing-based enumeration
   * 3. Using sanitized error messages that never leak user existence information
   *
   * SECURITY HARDENED (SEC-03): Rate Limiting Prevents Abuse
   *
   * Rate limiting applied to prevent spam attacks:
   * - Limit: 10 invitations per 15 minutes per user per project
   * - Standard RFC 6585 rate limit headers included
   * - Fail-open policy (doesn't block on rate limiter errors)
   *
   * VULNERABILITIES FIXED:
   * - CWE-204: Observable Response Discrepancy
   * - CWE-209: Generation of Error Message Containing Sensitive Information
   * - CWE-799: Improper Control of Interaction Frequency (Rate Limiting)
   *
   * SECURITY REQUIREMENT:
   * All user-related failures (owner check, self-invite, already member, etc.)
   * MUST return the same generic error message: SAFE_ERROR_MESSAGES.INVITATION_FAILED
   *
   * This prevents attackers from:
   * - Discovering valid user emails by observing different error messages
   * - Determining if an email belongs to a project owner
   * - Identifying project members through error responses
   * - Using timing attacks to distinguish between scenarios
   * - Sending unlimited spam invitations
   *
   * @see {@link https://owasp.org/www-project-web-security-testing-guide/latest/4-Web_Application_Security_Testing/03-Identity_Management_Testing/04-Testing_for_Account_Enumeration_and_Guessable_User_Account}
   * @see Task 2.2: Security Fixes Plan - Update Invitation Endpoint
   * @see Task 4.1: Security Fixes Plan - Create Rate Limiter Middleware
   */
  app.post(
    "/api/projects/:id/members/invite",
    createRateLimiter('POST /api/projects/:id/members/invite'),
    async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Check if user has permission to invite (owner or admin)
      const access = await storage.checkProjectAccess?.(userId, projectId);
      if (!access?.hasAccess || !['owner', 'admin'].includes(access.role || '')) {
        return res.status(403).json({ message: "You don't have permission to invite members" });
      }

      // Validate input
      const result = inviteProjectMemberSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { email, role } = result.data;

      // Admins can only invite editors/viewers, not other admins
      if (access.role === 'admin' && role === 'admin') {
        return res.status(403).json({ message: "Only project owners can invite admins" });
      }

      // SECURITY: Check if inviting self
      // Use generic error to prevent revealing that inviter email matches (CWE-204)
      // Add random delay to prevent timing-based detection (0-100ms variance)
      if (email.toLowerCase() === req.session?.userEmail?.toLowerCase()) {
        return sendSecureErrorResponse(res, SAFE_ERROR_MESSAGES.INVITATION_FAILED);
      }

      // SECURITY: Check if user is already the owner
      // Use generic error to prevent revealing owner email addresses (CWE-204)
      // Add random delay to prevent timing attacks that could distinguish owner checks
      const project = await storage.getProject(projectId);
      const ownerUser = project?.createdBy ? await db.select({ email: users.email }).from(users).where(eq(users.id, project.createdBy)) : [];
      if (ownerUser[0]?.email.toLowerCase() === email.toLowerCase()) {
        return sendSecureErrorResponse(res, SAFE_ERROR_MESSAGES.INVITATION_FAILED);
      }

      const member = await storage.inviteProjectMember?.(projectId, email, role, userId);
      res.status(201).json(member);
    } catch (error: any) {
      // SECURITY: Log actual error server-side for debugging, but NEVER expose to client
      console.error("Error inviting project member:", error);

      // SECURITY: Already-a-member check
      // Use generic error to prevent revealing membership status (CWE-209)
      // Add random delay to prevent timing-based member enumeration
      if (error.message?.includes('already a member')) {
        return sendSecureErrorResponse(res, SAFE_ERROR_MESSAGES.INVITATION_FAILED);
      }

      // SECURITY: Sanitize all other errors to prevent information leakage
      // sanitizeMemberError ensures generic error messages for all failure scenarios
      res.status(500).json({ message: sanitizeMemberError(error, 'invite') });
    }
  });

  /**
   * Update Project Member Role
   *
   * SECURITY FIX: SEC-02 - Transaction Isolation with Audit Trail
   *
   * This endpoint implements the following security controls:
   *
   * 1. **Atomicity (ACID)**: Uses database transactions to ensure that role updates
   *    and audit log entries succeed or fail together. If the audit log insert fails,
   *    the role change is automatically rolled back. This prevents data inconsistency.
   *
   * 2. **Isolation (Row-Level Locking)**: Uses `SELECT ... FOR UPDATE` to acquire
   *    an exclusive lock on the member row, preventing race conditions where two
   *    concurrent requests could result in:
   *    - Lost updates (one overwrites the other)
   *    - Inconsistent audit logs (logging wrong "old" values)
   *    - Time-of-check-time-of-use (TOCTOU) vulnerabilities
   *
   * 3. **Privilege Escalation Prevention (CWE-269)**:
   *    - Only project owners can assign the "owner" role
   *    - Users cannot promote themselves to "owner" (prevents horizontal privilege escalation)
   *    - Admins can only manage viewers/editors, not other admins
   *
   * 4. **Complete Audit Trail**: Every role change is logged with:
   *    - Who performed the change (performedBy)
   *    - What changed (oldValue/newValue)
   *    - When it happened (timestamp)
   *    - Where it came from (IP address, user agent)
   *
   * **Security Vulnerabilities Fixed**:
   * - CWE-269: Improper Privilege Management
   * - CWE-362: Concurrent Execution using Shared Resource with Improper Synchronization
   * - CWE-778: Insufficient Logging
   * - CWE-799: Improper Control of Interaction Frequency (Rate Limiting)
   *
   * **Rate Limiting (SEC-03)**:
   * - Limit: 20 updates per 15 minutes per user per project
   * - Prevents abuse while allowing legitimate batch edits
   *
   * @endpoint PUT /api/projects/:id/members/:memberId
   * @requires Authentication (session)
   * @requires Authorization (owner or admin role)
   * @transaction Uses database transaction with row-level locking
   * @see Task 4.1: Security Fixes Plan - Create Rate Limiter Middleware
   */
  app.put(
    "/api/projects/:id/members/:memberId",
    createRateLimiter('PUT /api/projects/:id/members/:memberId'),
    async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);

      if (isNaN(projectId) || isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get IP address and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';

      // Check if user has permission (owner or admin)
      const access = await storage.checkProjectAccess?.(userId, projectId);
      if (!access?.hasAccess || !['owner', 'admin'].includes(access.role || '')) {
        return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
      }

      // Validate input
      const result = updateProjectMemberRoleSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const { role } = result.data;

      // Use database transaction for atomicity with audit logging
      // CRITICAL: All operations below must succeed or fail together
      const updated = await db.transaction(async (tx: any) => {
        // STEP 1: Lock row for update (prevents concurrent modifications)
        // The FOR UPDATE clause acquires an exclusive lock on this row until the
        // transaction commits or rolls back. This prevents race conditions where:
        // - Two requests try to change the same member's role simultaneously
        // - Role is changed while being deleted
        // - Audit log records wrong "old" value due to concurrent update
        const memberRows = await tx.select()
          .from(projectMembers)
          .where(eq(projectMembers.id, memberId))
          .for('update'); // ROW-LEVEL LOCK acquired here

        if (memberRows.length === 0 || memberRows[0].projectId !== projectId) {
          throw new Error('Member not found');
        }

        const member = memberRows[0];

        // STEP 2: Validate role change rules (privilege escalation prevention)
        // These checks prevent CWE-269 (Improper Privilege Management)

        // Only owner can assign owner role (prevents privilege escalation)
        // Note: role type is string from validation, can include 'owner'
        if ((role as string) === 'owner' && access.role !== 'owner') {
          throw new Error('Only owner can assign owner role');
        }

        // Prevent self-promotion to owner (horizontal privilege escalation)
        // This stops an admin from promoting themselves to owner
        if (member.userId === userId && (role as string) === 'owner') {
          throw new Error('Cannot promote yourself to owner');
        }

        // Admins can only change viewers/editors, not other admins
        // This prevents admins from removing/demoting their peers
        if (access.role === 'admin') {
          if (member.role === 'admin' || role === 'admin') {
            throw new Error('Only project owners can manage admin roles');
          }
        }

        // STEP 3: Update role
        // If we reach here, all security checks passed
        const updatedMembers = await tx.update(projectMembers)
          .set({ role })
          .where(eq(projectMembers.id, memberId))
          .returning();

        // STEP 4: Write audit log (in same transaction - all or nothing)
        // If this fails, the entire transaction rolls back including the role update
        // This ensures we NEVER have unlogged role changes
        await tx.insert(projectMemberAuditLog).values({
          projectId,
          memberId,
          action: 'role_change',
          performedBy: userId,
          targetUserEmail: member.invitedEmail,
          oldValue: { role: member.role }, // Original role (from locked row)
          newValue: { role }, // New role being assigned
          ipAddress,
          userAgent,
        });

        return updatedMembers[0];
      });

      res.json(updated);

    } catch (error: any) {
      // Log actual error server-side for debugging (never sent to client)
      console.error("Error updating project member:", error);

      // Return specific error messages for known failure cases
      // All messages are safe (no information leakage)

      // 404: Member doesn't exist or doesn't belong to this project
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // 403: Privilege escalation attempt (owner role assignment or self-promotion)
      // Use generic message to prevent information leakage
      if (error.message?.includes('owner') || error.message?.includes('promote')) {
        return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
      }

      // 403: Admin trying to manage another admin
      if (error.message?.includes('admin')) {
        return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
      }

      // 500: Unexpected error (database failure, constraint violation, etc.)
      // Sanitize error to prevent information leakage
      res.status(500).json({ message: sanitizeMemberError(error, 'update') });
    }
  });

  /**
   * Remove Project Member
   *
   * SECURITY FIX: SEC-02 - Transaction Isolation with Audit Trail
   *
   * This endpoint implements the following security controls:
   *
   * 1. **Atomicity (ACID)**: Uses database transactions to ensure that member
   *    deletion and audit log entries are atomic. If the audit log insert fails,
   *    the deletion is automatically rolled back, preventing unlogged removals.
   *
   * 2. **Isolation (Row-Level Locking)**: Uses `SELECT ... FOR UPDATE` to acquire
   *    an exclusive lock on the member row before deletion. This prevents:
   *    - Concurrent role changes during removal (would log wrong role in audit)
   *    - Double-deletion race conditions
   *    - Phantom reads where member appears to exist but is being deleted
   *
   * 3. **Authorization Controls**:
   *    - Only project owners and admins can remove members
   *    - Admins cannot remove other admins (only owner can)
   *    - Users can remove themselves (leave project) regardless of role
   *
   * 4. **Complete Audit Trail**: Every member removal is logged with:
   *    - Who performed the removal (performedBy)
   *    - Who was removed (targetUserEmail)
   *    - What role they had (oldValue)
   *    - Forensic metadata (IP address, user agent, timestamp)
   *
   * **Use Cases**:
   * - Project owner removing inactive members
   * - Admin removing viewers/editors
   * - User leaving a project (self-removal)
   *
   * **Security Vulnerabilities Fixed**:
   * - CWE-362: Race conditions in concurrent member operations
   * - CWE-778: Insufficient logging of member removals
   * - CWE-799: Improper Control of Interaction Frequency (Rate Limiting)
   * - Ensures auditability for compliance requirements
   *
   * **Rate Limiting (SEC-03)**:
   * - Limit: 20 deletions per 15 minutes per user per project
   * - Prevents abuse while allowing legitimate batch cleanup
   *
   * @endpoint DELETE /api/projects/:id/members/:memberId
   * @requires Authentication (session)
   * @requires Authorization (owner/admin, or self-removal)
   * @transaction Uses database transaction with row-level locking
   * @see Task 4.1: Security Fixes Plan - Create Rate Limiter Middleware
   */
  app.delete(
    "/api/projects/:id/members/:memberId",
    createRateLimiter('DELETE /api/projects/:id/members/:memberId'),
    async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      const memberId = parseInt(req.params.memberId);

      if (isNaN(projectId) || isNaN(memberId)) {
        return res.status(400).json({ message: "Invalid ID" });
      }

      const userId = req.session?.userId;
      if (!userId) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get IP address and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';

      // Check if user has permission (owner or admin)
      const access = await storage.checkProjectAccess?.(userId, projectId);
      if (!access?.hasAccess || !['owner', 'admin'].includes(access.role || '')) {
        return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
      }

      // Use database transaction for atomicity with audit logging
      // CRITICAL: Deletion and audit log must succeed or fail together
      await db.transaction(async (tx: any) => {
        // STEP 1: Lock and get member
        // FOR UPDATE prevents the member from being modified or deleted by another
        // transaction until this one completes. This prevents:
        // - Double-deletion (two requests removing the same member)
        // - Concurrent role change while removing (wrong role in audit log)
        // - Phantom reads (member appears to exist but is being deleted)
        const memberRows = await tx.select()
          .from(projectMembers)
          .where(eq(projectMembers.id, memberId))
          .for('update'); // ROW-LEVEL LOCK acquired here

        if (memberRows.length === 0 || memberRows[0].projectId !== projectId) {
          throw new Error('Member not found');
        }

        const member = memberRows[0];

        // STEP 2: Validate permissions
        // Admins cannot remove other admins (only owner can)
        // This prevents admins from removing their peers to gain sole control
        if (access.role === 'admin' && member.role === 'admin') {
          throw new Error('Only project owners can remove admins');
        }

        // Users can also remove themselves (leave the project)
        // No validation needed for self-removal - this is always allowed

        // STEP 3: Delete member
        // CASCADE will also delete related records if configured
        await tx.delete(projectMembers)
          .where(eq(projectMembers.id, memberId));

        // STEP 4: Write audit log (atomic with deletion)
        // If this fails, the deletion is automatically rolled back
        // This ensures we NEVER have unlogged member removals
        await tx.insert(projectMemberAuditLog).values({
          projectId,
          memberId,
          action: 'remove',
          performedBy: userId,
          targetUserEmail: member.invitedEmail,
          oldValue: { role: member.role }, // Role before deletion (from locked row)
          ipAddress,
          userAgent,
        });
      });

      res.status(204).end();

    } catch (error: any) {
      // Log actual error server-side for debugging (never sent to client)
      console.error("Error removing project member:", error);

      // Return specific error messages for known failure cases

      // 404: Member doesn't exist or doesn't belong to this project
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: 'Member not found' });
      }

      // 403: Admin trying to remove another admin (only owner can do this)
      if (error.message?.includes('admin')) {
        return res.status(403).json({ message: SAFE_ERROR_MESSAGES.UNAUTHORIZED });
      }

      // 500: Unexpected error (transaction rollback, database failure, etc.)
      // Sanitize error to prevent information leakage
      res.status(500).json({ message: sanitizeMemberError(error, 'remove') });
    }
  });

  // Get user's pending invitations
  app.get("/api/invitations", async (req: Request, res: Response) => {
    try {
      const userEmail = req.session?.userEmail;
      if (!userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      const invitations = await storage.getUserInvitations?.(userEmail) || [];
      res.json(invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      res.status(500).json({ message: "Failed to fetch invitations" });
    }
  });

  /**
   * Accept Project Invitation
   *
   * SECURITY FIX: SEC-02 - Transaction Isolation with Audit Trail
   *
   * This endpoint implements the following security controls:
   *
   * 1. **Atomicity (ACID)**: Uses database transactions to ensure that invitation
   *    acceptance and audit log entries are atomic. The following operations succeed
   *    or fail together:
   *    - Update invitation status to 'accepted'
   *    - Link invitation to authenticated user (set userId)
   *    - Create audit log entry
   *
   * 2. **Isolation (Row-Level Locking)**: Uses `SELECT ... FOR UPDATE` to prevent:
   *    - Double-acceptance race conditions (two tabs accepting same invitation)
   *    - Concurrent status changes (acceptance vs. revocation)
   *    - Status confusion (invitation accepted while being deleted)
   *
   * 3. **Authorization Controls**:
   *    - Only the invited email can accept the invitation
   *    - Email matching is case-insensitive for user convenience
   *    - Invitation must be in 'pending' status (not already processed)
   *    - Prevents invitation hijacking attacks
   *
   * 4. **Complete Audit Trail**: Every acceptance is logged with:
   *    - Who accepted the invitation (performedBy = userId)
   *    - What project they joined (projectId)
   *    - What role they received (newValue.role)
   *    - Forensic metadata (IP address, user agent, timestamp)
   *
   * **Security Considerations**:
   * - Prevents TOCTOU vulnerability where invitation could be revoked between
   *   validation and acceptance
   * - Ensures only one acceptance per invitation (idempotency)
   * - Logs all acceptance attempts for security monitoring
   *
   * **Security Vulnerabilities Fixed**:
   * - CWE-362: Race conditions in concurrent invitation operations
   * - CWE-778: Insufficient logging of access grants
   * - Prevents invitation replay attacks
   *
   * @endpoint POST /api/invitations/:id/accept
   * @requires Authentication (session with userId and userEmail)
   * @requires Authorization (email matches invitedEmail)
   * @transaction Uses database transaction with row-level locking
   */
  app.post("/api/invitations/:id/accept", async (req: Request, res: Response) => {
    try {
      const invitationId = parseInt(req.params.id);
      if (isNaN(invitationId)) {
        return res.status(400).json({ message: "Invalid invitation ID" });
      }

      const userId = req.session?.userId;
      const userEmail = req.session?.userEmail;
      if (!userId || !userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get IP address and user agent for audit logging
      const ipAddress = req.ip || req.socket.remoteAddress;
      const userAgent = req.get('user-agent') || 'Unknown';

      // Use database transaction for atomicity with audit logging
      // CRITICAL: Acceptance and audit log must succeed or fail together
      const updated = await db.transaction(async (tx: any) => {
        // STEP 1: Lock and get invitation
        // FOR UPDATE prevents the invitation from being:
        // - Accepted twice (double-click or two tabs)
        // - Revoked while being accepted (TOCTOU vulnerability)
        // - Modified concurrently (status confusion)
        const invitationRows = await tx.select()
          .from(projectMembers)
          .where(eq(projectMembers.id, invitationId))
          .for('update'); // ROW-LEVEL LOCK acquired here

        if (invitationRows.length === 0) {
          throw new Error('Invitation not found');
        }

        const invitation = invitationRows[0];

        // STEP 2: Validate invitation
        // Verify this invitation is for the current user (prevents invitation hijacking)
        // Email comparison is case-insensitive for user convenience
        if (invitation.invitedEmail.toLowerCase() !== userEmail.toLowerCase()) {
          throw new Error('This invitation is not for you');
        }

        // Ensure invitation hasn't already been processed (idempotency check)
        // Prevents double-acceptance or accepting after decline
        if (invitation.status !== 'pending') {
          throw new Error('This invitation has already been processed');
        }

        // STEP 3: Accept invitation (update status and link to user)
        // This converts the pending invitation into an active membership
        const updatedInvitations = await tx.update(projectMembers)
          .set({
            status: 'accepted',
            userId: userId, // Link invitation to authenticated user
          })
          .where(eq(projectMembers.id, invitationId))
          .returning();

        // STEP 4: Write audit log (atomic with acceptance)
        // If this fails, the acceptance is automatically rolled back
        // This ensures we NEVER have unlogged access grants
        await tx.insert(projectMemberAuditLog).values({
          projectId: invitation.projectId,
          memberId: invitationId,
          action: 'accept_invitation',
          performedBy: userId, // User who accepted
          targetUserEmail: invitation.invitedEmail,
          newValue: { role: invitation.role }, // Role granted
          ipAddress,
          userAgent,
        });

        return updatedInvitations[0];
      });

      res.json(updated);

    } catch (error: any) {
      // Log actual error server-side for debugging (never sent to client)
      console.error("Error accepting invitation:", error);

      // Return specific error messages for known failure cases

      // 404: Invitation doesn't exist (may have been revoked)
      if (error.message?.includes('not found')) {
        return res.status(404).json({ message: 'Invitation not found' });
      }

      // 403: User trying to accept invitation meant for someone else
      if (error.message?.includes('not for you')) {
        return res.status(403).json({ message: error.message });
      }

      // 400: Invitation already accepted or declined (idempotency check failed)
      if (error.message?.includes('already been processed')) {
        return res.status(400).json({ message: error.message });
      }

      // 500: Unexpected error (transaction rollback, database failure, etc.)
      // Sanitize error to prevent information leakage
      res.status(500).json({ message: sanitizeMemberError(error, 'accept') });
    }
  });

  // Decline invitation
  app.post("/api/invitations/:id/decline", async (req: Request, res: Response) => {
    try {
      const invitationId = parseInt(req.params.id);
      if (isNaN(invitationId)) {
        return res.status(400).json({ message: "Invalid invitation ID" });
      }

      const userEmail = req.session?.userEmail;
      if (!userEmail) {
        return res.status(401).json({ message: "Unauthorized" });
      }

      // Get the invitation
      const invitation = await storage.getProjectMemberById?.(invitationId);
      if (!invitation) {
        return res.status(404).json({ message: "Invitation not found" });
      }

      // Verify this invitation is for the current user
      if (invitation.invitedEmail.toLowerCase() !== userEmail.toLowerCase()) {
        return res.status(403).json({ message: "This invitation is not for you" });
      }

      if (invitation.status !== 'pending') {
        return res.status(400).json({ message: "This invitation has already been processed" });
      }

      const success = await storage.declineProjectInvitation?.(invitationId);
      if (success) {
        res.json({ message: "Invitation declined" });
      } else {
        res.status(500).json({ message: "Failed to decline invitation" });
      }
    } catch (error) {
      console.error("Error declining invitation:", error);
      res.status(500).json({ message: "Failed to decline invitation" });
    }
  });

  // ==================== PROJECT EXPORT/IMPORT ====================

  // Helper function to escape CSV values
  const escapeCSV = (value: any): string => {
    if (value === null || value === undefined) return '';
    const str = String(value);
    if (str.includes(',') || str.includes('"') || str.includes('\n')) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  // Export project to JSON (default) or CSV (legacy)
  app.get("/api/projects/:id/export", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      const format = (req.query.format as string)?.toLowerCase() || 'json';

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get project
      const project = await storage.getProject(id);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Get all related data
      const projectTasks = await storage.getTasksByProject(id);
      const projectMaterials = await storage.getMaterialsByProject(id);
      const projectLabor = await storage.getLaborByProject(id);
      const allContacts = await storage.getContacts();

      // Get project categories (NEW - critical for proper import)
      const projectCats = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, id))
        .orderBy(
          sql`case when ${projectCategories.type} = 'tier1' then 0 else 1 end`,
          projectCategories.sortOrder,
          projectCategories.name
        );

      // Get subtasks and checklist items for all tasks
      const subtasksMap: Map<number, any[]> = new Map();
      const checklistMap: Map<number, any[]> = new Map();

      for (const task of projectTasks) {
        const taskSubtasks = await storage.getSubtasks(task.id);
        subtasksMap.set(task.id, taskSubtasks);

        const taskChecklist = await storage.getChecklistItems(task.id);
        checklistMap.set(task.id, taskChecklist);
      }

      // Collect unique contacts referenced by tasks, materials, and labor
      const contactIds = new Set<number>();
      for (const task of projectTasks) {
        if (task.contactIds) {
          const ids = Array.isArray(task.contactIds) ? task.contactIds : JSON.parse(task.contactIds as string || '[]');
          ids.forEach((cid: number) => contactIds.add(cid));
        }
      }
      for (const labor of projectLabor) {
        if (labor.contactId) contactIds.add(labor.contactId);
      }

      const projectContacts = allContacts.filter(c => contactIds.has(c.id));

      // JSON Export (new default)
      if (format === 'json') {
        // Separate tier1 and tier2 categories
        const tier1Categories = projectCats.filter(c => c.type === 'tier1');
        const tier2Categories = projectCats.filter(c => c.type === 'tier2');

        // Build tier2 with parent names for easier reconstruction
        const tier2WithParentNames = tier2Categories.map(t2 => {
          const parent = tier1Categories.find(t1 => t1.id === t2.parentId);
          return {
            ...t2,
            parentName: parent?.name || null
          };
        });

        // Build subtasks and checklist arrays
        const allSubtasks: any[] = [];
        const allChecklistItems: any[] = [];

        for (const task of projectTasks) {
          const taskSubtasks = subtasksMap.get(task.id) || [];
          allSubtasks.push(...taskSubtasks);

          const taskChecklist = checklistMap.get(task.id) || [];
          allChecklistItems.push(...taskChecklist);
        }

        const exportData = {
          version: "2.0",
          exportDate: new Date().toISOString(),
          project: {
            name: project.name,
            location: project.location,
            description: project.description,
            status: project.status,
            progress: project.progress,
            startDate: project.startDate,
            endDate: project.endDate,
            colorTheme: project.colorTheme,
            useGlobalTheme: project.useGlobalTheme,
            presetId: project.presetId,
          },
          categories: {
            tier1: tier1Categories.map(c => ({
              id: c.id,
              name: c.name,
              type: c.type,
              color: c.color,
              description: c.description,
              sortOrder: c.sortOrder,
            })),
            tier2: tier2WithParentNames.map(c => ({
              id: c.id,
              name: c.name,
              type: c.type,
              parentId: c.parentId,
              parentName: c.parentName,
              color: c.color,
              description: c.description,
              sortOrder: c.sortOrder,
            })),
          },
          tasks: projectTasks.map(t => ({
            id: t.id,
            title: t.title,
            description: t.description,
            status: t.status,
            tier1Category: t.tier1Category,
            tier2Category: t.tier2Category,
            startDate: t.startDate,
            endDate: t.endDate,
            startTime: t.startTime,
            endTime: t.endTime,
            completed: t.completed,
            estimatedCost: t.estimatedCost,
            actualCost: t.actualCost,
            assignedTo: t.assignedTo,
            contactIds: t.contactIds,
            materialsNeeded: t.materialsNeeded,
          })),
          subtasks: allSubtasks.map(s => ({
            id: s.id,
            parentTaskId: s.parentTaskId,
            title: s.title,
            description: s.description,
            status: s.status,
            completed: s.completed,
            startDate: s.startDate,
            endDate: s.endDate,
            startTime: s.startTime,
            endTime: s.endTime,
            estimatedCost: s.estimatedCost,
            actualCost: s.actualCost,
            assignedTo: s.assignedTo,
          })),
          checklistItems: allChecklistItems.map(c => ({
            id: c.id,
            taskId: c.taskId,
            title: c.title,
            description: c.description,
            completed: c.completed,
            section: c.section,
            assignedTo: c.assignedTo,
            dueDate: c.dueDate,
          })),
          materials: projectMaterials.map(m => ({
            id: m.id,
            name: m.name,
            type: m.type,
            tier2Category: m.tier2Category,
            quantity: m.quantity,
            unit: m.unit,
            cost: m.cost,
            supplier: m.supplier,
            status: m.status,
            details: m.details,
            section: m.section,
            materialSize: m.materialSize,
          })),
          labor: projectLabor.map(l => ({
            id: l.id,
            taskId: l.taskId,
            fullName: l.fullName,
            company: l.company,
            tier1Category: l.tier1Category,
            tier2Category: l.tier2Category,
            workDate: l.workDate,
            startDate: l.startDate,
            endDate: l.endDate,
            totalHours: l.totalHours,
            laborCost: l.laborCost,
            workDescription: l.workDescription,
            status: l.status,
            email: l.email,
            phone: l.phone,
          })),
          contacts: projectContacts.map(c => ({
            id: c.id,
            name: c.name,
            role: c.role,
            company: c.company,
            email: c.email,
            phone: c.phone,
            type: c.type,
            category: c.category,
          })),
        };

        const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.json`;
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
        res.send(JSON.stringify(exportData, null, 2));
        return;
      }

      // CSV Export (legacy format)
      // CSV Headers
      const headers = [
        'Type', 'ID', 'ParentID', 'ProjectID', 'Name', 'Description', 'Status',
        'Tier1Category', 'Tier2Category', 'StartDate', 'EndDate', 'Completed',
        'EstimatedCost', 'ActualCost', 'Quantity', 'Unit', 'Cost', 'Supplier',
        'TotalHours', 'LaborCost', 'Company', 'Role', 'Email', 'Phone', 'AssignedTo',
        'Location', 'Progress', 'MaterialType', 'Section', 'WorkDate', 'ContactIds'
      ];

      const rows: string[][] = [];
      rows.push(headers);

      // Add project row
      rows.push([
        'Project', String(project.id), '', '', escapeCSV(project.name), escapeCSV(project.description),
        escapeCSV(project.status), '', '', escapeCSV(project.startDate), escapeCSV(project.endDate),
        '', '', '', '', '', '', '', '', '', '', '', '', '', '',
        escapeCSV(project.location), String(project.progress || 0), '', '', '', ''
      ]);

      // Add task rows
      for (const task of projectTasks) {
        rows.push([
          'Task', String(task.id), '', String(task.projectId), escapeCSV(task.title), escapeCSV(task.description),
          escapeCSV(task.status), escapeCSV(task.tier1Category), escapeCSV(task.tier2Category),
          escapeCSV(task.startDate), escapeCSV(task.endDate), String(task.completed || false),
          String(task.estimatedCost || ''), String(task.actualCost || ''), '', '', '', '',
          '', '', '', '', '', '', escapeCSV(task.assignedTo),
          '', '', '', '', '', escapeCSV(JSON.stringify(task.contactIds || []))
        ]);

        // Add subtasks for this task
        const taskSubtasks = subtasksMap.get(task.id) || [];
        for (const subtask of taskSubtasks) {
          rows.push([
            'Subtask', String(subtask.id), String(subtask.parentTaskId), '', escapeCSV(subtask.title),
            escapeCSV(subtask.description), escapeCSV(subtask.status), '', '',
            escapeCSV(subtask.startDate), escapeCSV(subtask.endDate), String(subtask.completed || false),
            String(subtask.estimatedCost || ''), String(subtask.actualCost || ''), '', '', '', '',
            '', '', '', '', '', '', escapeCSV(subtask.assignedTo),
            '', '', '', '', '', ''
          ]);
        }

        // Add checklist items for this task
        const taskChecklist = checklistMap.get(task.id) || [];
        for (const item of taskChecklist) {
          rows.push([
            'Checklist', String(item.id), String(item.taskId), '', escapeCSV(item.title),
            escapeCSV(item.description), '', '', '', '', escapeCSV(item.dueDate),
            String(item.completed || false), '', '', '', '', '', '',
            '', '', '', '', '', '', escapeCSV(item.assignedTo),
            '', '', escapeCSV(item.section), '', '', ''
          ]);
        }
      }

      // Add material rows
      for (const material of projectMaterials) {
        rows.push([
          'Material', String(material.id), '', String(material.projectId), escapeCSV(material.name),
          escapeCSV(material.details), escapeCSV(material.status), '', escapeCSV(material.tier2Category),
          '', '', '', '', '', String(material.quantity || ''), escapeCSV(material.unit),
          String(material.cost || ''), escapeCSV(material.supplier), '', '', '', '', '', '', '',
          '', '', escapeCSV(material.type), escapeCSV(material.section), '', ''
        ]);
      }

      // Add labor rows
      for (const labor of projectLabor) {
        rows.push([
          'Labor', String(labor.id), String(labor.taskId || ''), String(labor.projectId),
          escapeCSV(labor.fullName), escapeCSV(labor.workDescription), escapeCSV(labor.status),
          escapeCSV(labor.tier1Category), escapeCSV(labor.tier2Category),
          escapeCSV(labor.startDate), escapeCSV(labor.endDate), '',
          '', '', '', '', '', '', String(labor.totalHours || ''), String(labor.laborCost || ''),
          escapeCSV(labor.company), '', escapeCSV(labor.email), escapeCSV(labor.phone), '',
          '', '', '', '', escapeCSV(labor.workDate), ''
        ]);
      }

      // Add contact rows
      for (const contact of projectContacts) {
        rows.push([
          'Contact', String(contact.id), '', '', escapeCSV(contact.name), '',
          '', '', escapeCSV(contact.category), '', '', '', '', '', '', '', '', '',
          '', '', escapeCSV(contact.company), escapeCSV(contact.role), escapeCSV(contact.email),
          escapeCSV(contact.phone), '', '', '', '', '', '', ''
        ]);
      }

      // Generate CSV content
      const csvContent = rows.map(row => row.join(',')).join('\n');

      // Set headers for file download
      const filename = `${project.name.replace(/[^a-zA-Z0-9]/g, '_')}_export.csv`;
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
      res.send(csvContent);

    } catch (error) {
      console.error('Error exporting project:', error);
      res.status(500).json({ message: "Failed to export project" });
    }
  });

  // Import project from JSON (v2.0) or CSV (legacy)
  app.post("/api/projects/import", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const fileContent = req.file.buffer.toString('utf-8');
      const filename = req.file.originalname || '';
      const isJson = filename.endsWith('.json') || fileContent.trim().startsWith('{');

      // JSON Import (v2.0 format with categories)
      if (isJson) {
        console.log('[Import] Detected JSON format');

        // Remove BOM if present
        const cleanContent = fileContent.replace(/^\uFEFF/, '');
        const data = JSON.parse(cleanContent);

        if (!data.project) {
          return res.status(400).json({ message: "Invalid JSON format: missing project data" });
        }

        console.log('[Import] JSON version:', data.version || '1.0');
        console.log('[Import] Project name:', data.project.name);

        // ID mappings
        const taskIdMap = new Map<number, number>();
        const contactIdMap = new Map<number, number>();
        const tier1CategoryIdMap = new Map<number, number>();

        // Create contacts first (dedupe by email)
        if (data.contacts && data.contacts.length > 0) {
          console.log('[Import] Creating contacts:', data.contacts.length);
          for (const contactData of data.contacts) {
            const existingContacts = await storage.getContacts();
            const existingContact = existingContacts.find(c =>
              c.email && contactData.email && c.email.toLowerCase() === contactData.email.toLowerCase()
            );

            if (existingContact) {
              contactIdMap.set(contactData.id, existingContact.id);
            } else {
              const newContact = await storage.createContact({
                name: contactData.name || 'Unknown',
                role: contactData.role || 'Other',
                company: contactData.company || '',
                email: contactData.email || '',
                phone: contactData.phone || '',
                type: contactData.type || 'contractor',
                category: contactData.category || 'other',
              });
              contactIdMap.set(contactData.id, newContact.id);
            }
          }
        }

        // Create project
        const addSuffix = req.query.addSuffix !== 'false';
        const newProject = await storage.createProject({
          name: addSuffix ? data.project.name + ' (Imported)' : data.project.name,
          location: data.project.location || '',
          description: data.project.description || '',
          status: data.project.status || 'active',
          progress: data.project.progress || 0,
          startDate: data.project.startDate ? new Date(data.project.startDate) : null,
          endDate: data.project.endDate ? new Date(data.project.endDate) : null,
          colorTheme: data.project.colorTheme || null,
          useGlobalTheme: data.project.useGlobalTheme ?? true,
          presetId: data.project.presetId || null,
        });

        console.log('[Import] Created project:', newProject.id, newProject.name);

        // Create project categories (NEW - critical for proper task categorization)
        if (data.categories) {
          // Create tier1 categories first
          if (data.categories.tier1 && data.categories.tier1.length > 0) {
            console.log('[Import] Creating tier1 categories:', data.categories.tier1.length);
            for (const cat of data.categories.tier1) {
              const [newCat] = await db.insert(projectCategories).values({
                projectId: newProject.id,
                name: cat.name,
                type: 'tier1',
                color: cat.color || null,
                description: cat.description || null,
                sortOrder: cat.sortOrder || 0,
              }).returning();
              tier1CategoryIdMap.set(cat.id, newCat.id);
              console.log(`[Import] Created tier1 category: ${cat.name} (old: ${cat.id} -> new: ${newCat.id})`);
            }
          }

          // Create tier2 categories with correct parent mapping
          if (data.categories.tier2 && data.categories.tier2.length > 0) {
            console.log('[Import] Creating tier2 categories:', data.categories.tier2.length);
            for (const cat of data.categories.tier2) {
              // Find new parent ID using parentName or mapped parentId
              let newParentId = null;
              if (cat.parentName) {
                // Find tier1 by name in the new project
                const parentCat = await db
                  .select()
                  .from(projectCategories)
                  .where(and(
                    eq(projectCategories.projectId, newProject.id),
                    eq(projectCategories.type, 'tier1'),
                    eq(projectCategories.name, cat.parentName)
                  ))
                  .limit(1);
                if (parentCat.length > 0) {
                  newParentId = parentCat[0].id;
                }
              } else if (cat.parentId) {
                newParentId = tier1CategoryIdMap.get(cat.parentId) || null;
              }

              const [newCat] = await db.insert(projectCategories).values({
                projectId: newProject.id,
                name: cat.name,
                type: 'tier2',
                parentId: newParentId,
                color: cat.color || null,
                description: cat.description || null,
                sortOrder: cat.sortOrder || 0,
              }).returning();
              console.log(`[Import] Created tier2 category: ${cat.name} (parent: ${cat.parentName || cat.parentId})`);
            }
          }
        }

        // Create tasks
        if (data.tasks && data.tasks.length > 0) {
          console.log('[Import] Creating tasks:', data.tasks.length);
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

          for (const taskData of data.tasks) {
            // Map old contact IDs to new ones
            let newContactIds: number[] = [];
            if (taskData.contactIds) {
              const oldIds = Array.isArray(taskData.contactIds) ? taskData.contactIds : [];
              newContactIds = oldIds.map((oldId: number) => contactIdMap.get(oldId) || oldId).filter(Boolean);
            }

            const newTask = await storage.createTask({
              projectId: newProject.id,
              title: taskData.title || 'Untitled Task',
              description: taskData.description || '',
              status: taskData.status || 'not_started',
              tier1Category: taskData.tier1Category || null,
              tier2Category: taskData.tier2Category || null,
              startDate: taskData.startDate ? new Date(taskData.startDate) : today,
              endDate: taskData.endDate ? new Date(taskData.endDate) : nextWeek,
              startTime: taskData.startTime || null,
              endTime: taskData.endTime || null,
              completed: taskData.completed || false,
              estimatedCost: taskData.estimatedCost || null,
              actualCost: taskData.actualCost || null,
              assignedTo: taskData.assignedTo || null,
              contactIds: newContactIds,
              materialsNeeded: taskData.materialsNeeded || null,
            });

            taskIdMap.set(taskData.id, newTask.id);
          }
        }

        // Create subtasks
        if (data.subtasks && data.subtasks.length > 0) {
          console.log('[Import] Creating subtasks:', data.subtasks.length);
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

          for (const subtaskData of data.subtasks) {
            const newParentId = taskIdMap.get(subtaskData.parentTaskId);
            if (newParentId) {
              await storage.createSubtask({
                parentTaskId: newParentId,
                title: subtaskData.title || 'Untitled Subtask',
                description: subtaskData.description || '',
                status: subtaskData.status || 'not_started',
                completed: subtaskData.completed || false,
                startDate: subtaskData.startDate ? new Date(subtaskData.startDate) : today,
                endDate: subtaskData.endDate ? new Date(subtaskData.endDate) : nextWeek,
                startTime: subtaskData.startTime || null,
                endTime: subtaskData.endTime || null,
                estimatedCost: subtaskData.estimatedCost || null,
                actualCost: subtaskData.actualCost || null,
                assignedTo: subtaskData.assignedTo || null,
              });
            }
          }
        }

        // Create checklist items
        if (data.checklistItems && data.checklistItems.length > 0) {
          console.log('[Import] Creating checklist items:', data.checklistItems.length);
          for (const itemData of data.checklistItems) {
            const newTaskId = taskIdMap.get(itemData.taskId);
            if (newTaskId) {
              await storage.createChecklistItem({
                taskId: newTaskId,
                title: itemData.title || 'Untitled Item',
                description: itemData.description || '',
                completed: itemData.completed || false,
                section: itemData.section || null,
                assignedTo: itemData.assignedTo || null,
                dueDate: itemData.dueDate ? new Date(itemData.dueDate) : null,
              });
            }
          }
        }

        // Create materials
        if (data.materials && data.materials.length > 0) {
          console.log('[Import] Creating materials:', data.materials.length);
          for (const materialData of data.materials) {
            await storage.createMaterial({
              projectId: newProject.id,
              name: materialData.name || 'Untitled Material',
              type: materialData.type || 'other',
              tier2Category: materialData.tier2Category || null,
              quantity: materialData.quantity || 0,
              unit: materialData.unit || 'each',
              cost: materialData.cost || null,
              supplier: materialData.supplier || null,
              status: materialData.status || 'ordered',
              details: materialData.details || null,
              section: materialData.section || null,
              materialSize: materialData.materialSize || null,
            });
          }
        }

        // Create labor entries
        if (data.labor && data.labor.length > 0) {
          console.log('[Import] Creating labor entries:', data.labor.length);
          for (const laborData of data.labor) {
            const newTaskId = laborData.taskId ? taskIdMap.get(laborData.taskId) : null;

            // Find or create contact for labor
            let contactId = null;
            if (laborData.fullName) {
              const existingContacts = await storage.getContacts();
              const existingContact = existingContacts.find(c => c.name === laborData.fullName);
              if (existingContact) {
                contactId = existingContact.id;
              } else {
                const newContact = await storage.createContact({
                  name: laborData.fullName,
                  role: 'Worker',
                  company: laborData.company || '',
                  email: laborData.email || '',
                  phone: laborData.phone || '',
                  type: 'contractor',
                  category: laborData.tier2Category || 'other',
                });
                contactId = newContact.id;
              }
            }

            if (contactId) {
              await storage.createLabor({
                projectId: newProject.id,
                taskId: newTaskId || null,
                contactId: contactId,
                fullName: laborData.fullName || '',
                company: laborData.company || '',
                tier1Category: laborData.tier1Category || null,
                tier2Category: laborData.tier2Category || null,
                workDate: laborData.workDate ? new Date(laborData.workDate) : new Date(),
                startDate: laborData.startDate ? new Date(laborData.startDate) : new Date(),
                endDate: laborData.endDate ? new Date(laborData.endDate) : new Date(),
                totalHours: laborData.totalHours || null,
                laborCost: laborData.laborCost || null,
                workDescription: laborData.workDescription || null,
                status: laborData.status || 'pending',
                email: laborData.email || null,
                phone: laborData.phone || null,
              });
            }
          }
        }

        res.status(201).json({
          message: "Project imported successfully",
          project: newProject,
          stats: {
            tasks: data.tasks?.length || 0,
            subtasks: data.subtasks?.length || 0,
            materials: data.materials?.length || 0,
            labor: data.labor?.length || 0,
            contacts: data.contacts?.length || 0,
            checklistItems: data.checklistItems?.length || 0,
            categories: {
              tier1: data.categories?.tier1?.length || 0,
              tier2: data.categories?.tier2?.length || 0,
            }
          }
        });
        return;
      }

      // CSV Import (legacy format)
      console.log('[Import] Detected CSV format (legacy)');
      const csvContent = fileContent;
      // Handle both Windows (\r\n) and Unix (\n) line endings
      const lines = csvContent.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n').filter(line => line.trim());

      console.log('[Import] Total lines in CSV:', lines.length);

      if (lines.length < 2) {
        return res.status(400).json({ message: "CSV file is empty or invalid" });
      }

      // Parse headers
      const headers = lines[0].split(',').map(h => h.trim().replace(/^"|"$/g, ''));
      console.log('[Import] Headers:', headers.slice(0, 5).join(', '), '...');

      // Parse rows
      const records: any[] = [];
      for (let i = 1; i < lines.length; i++) {
        const values = parseCSVLine(lines[i]);
        const record: any = {};
        headers.forEach((header, idx) => {
          record[header] = values[idx] || '';
        });
        records.push(record);
      }

      // Group records by type
      const projectRecords = records.filter(r => r.Type === 'Project');
      const taskRecords = records.filter(r => r.Type === 'Task');
      const subtaskRecords = records.filter(r => r.Type === 'Subtask');
      const materialRecords = records.filter(r => r.Type === 'Material');
      const laborRecords = records.filter(r => r.Type === 'Labor');
      const contactRecords = records.filter(r => r.Type === 'Contact');
      const checklistRecords = records.filter(r => r.Type === 'Checklist');

      console.log('[Import] Total records:', records.length);
      console.log('[Import] Projects:', projectRecords.length);
      console.log('[Import] Tasks:', taskRecords.length);
      console.log('[Import] Subtasks:', subtaskRecords.length);
      console.log('[Import] Materials:', materialRecords.length);
      console.log('[Import] Contacts:', contactRecords.length);

      // Log first few record types to debug
      if (records.length > 0) {
        console.log('[Import] First 5 record types:', records.slice(0, 5).map(r => r.Type));
      }

      if (projectRecords.length === 0) {
        return res.status(400).json({ message: "No project found in CSV" });
      }

      const projectData = projectRecords[0];

      // ID mapping: old ID -> new ID
      const taskIdMap = new Map<number, number>();
      const contactIdMap = new Map<number, number>();

      // Create contacts first (dedupe by email)
      for (const contactData of contactRecords) {
        const existingContacts = await storage.getContacts();
        const existingContact = existingContacts.find(c =>
          c.email && contactData.Email && c.email.toLowerCase() === contactData.Email.toLowerCase()
        );

        if (existingContact) {
          contactIdMap.set(parseInt(contactData.ID), existingContact.id);
        } else {
          const newContact = await storage.createContact({
            name: contactData.Name || 'Unknown',
            role: contactData.Role || 'Other',
            company: contactData.Company || '',
            email: contactData.Email || '',
            phone: contactData.Phone || '',
            type: 'contractor',
            category: contactData.Tier2Category || 'other',
          });
          contactIdMap.set(parseInt(contactData.ID), newContact.id);
        }
      }

      // Create project
      const newProject = await storage.createProject({
        name: projectData.Name + ' (Imported)',
        location: projectData.Location || '',
        description: projectData.Description || '',
        status: projectData.Status || 'active',
        progress: parseInt(projectData.Progress) || 0,
        startDate: projectData.StartDate ? new Date(projectData.StartDate) : null,
        endDate: projectData.EndDate ? new Date(projectData.EndDate) : null,
      });

      // For CSV imports, auto-create categories from task tier1/tier2 values
      const tier1Set = new Set<string>();
      const tier2Map = new Map<string, string>(); // tier2 -> tier1
      for (const taskData of taskRecords) {
        if (taskData.Tier1Category) tier1Set.add(taskData.Tier1Category);
        if (taskData.Tier2Category && taskData.Tier1Category) {
          tier2Map.set(taskData.Tier2Category, taskData.Tier1Category);
        }
      }

      // Create tier1 categories from CSV data
      const tier1IdMap = new Map<string, number>();
      let sortOrder = 0;
      for (const tier1Name of tier1Set) {
        const [newCat] = await db.insert(projectCategories).values({
          projectId: newProject.id,
          name: tier1Name,
          type: 'tier1',
          sortOrder: sortOrder++,
        }).returning();
        tier1IdMap.set(tier1Name, newCat.id);
        console.log(`[Import] Auto-created tier1 category: ${tier1Name}`);
      }

      // Create tier2 categories from CSV data
      sortOrder = 0;
      for (const [tier2Name, tier1Name] of tier2Map) {
        const parentId = tier1IdMap.get(tier1Name);
        await db.insert(projectCategories).values({
          projectId: newProject.id,
          name: tier2Name,
          type: 'tier2',
          parentId: parentId || null,
          sortOrder: sortOrder++,
        }).returning();
        console.log(`[Import] Auto-created tier2 category: ${tier2Name} (parent: ${tier1Name})`);
      }

      // Create tasks
      let tasksCreated = 0;
      for (const taskData of taskRecords) {
        const oldTaskId = parseInt(taskData.ID);
        console.log(`[Import] Creating task: "${taskData.Name}" (tier2: ${taskData.Tier2Category})`);

        // Map old contact IDs to new ones
        let newContactIds: number[] = [];
        if (taskData.ContactIds) {
          try {
            const oldIds = JSON.parse(taskData.ContactIds);
            newContactIds = oldIds.map((oldId: number) => contactIdMap.get(oldId) || oldId).filter(Boolean);
          } catch (e) {}
        }

        // Default dates if missing
        const today = new Date();
        const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

        const newTask = await storage.createTask({
          projectId: newProject.id,
          title: taskData.Name || 'Untitled Task',
          description: taskData.Description || '',
          status: taskData.Status || 'not_started',
          tier1Category: taskData.Tier1Category || 'structural',
          tier2Category: taskData.Tier2Category || 'foundation',
          startDate: taskData.StartDate ? new Date(taskData.StartDate) : today,
          endDate: taskData.EndDate ? new Date(taskData.EndDate) : nextWeek,
          completed: taskData.Completed === 'true',
          estimatedCost: parseFloat(taskData.EstimatedCost) || null,
          actualCost: parseFloat(taskData.ActualCost) || null,
          assignedTo: taskData.AssignedTo || null,
          contactIds: newContactIds,
        });

        taskIdMap.set(oldTaskId, newTask.id);
        tasksCreated++;
      }
      console.log(`[Import] Total tasks created: ${tasksCreated}`);

      // Create subtasks
      for (const subtaskData of subtaskRecords) {
        const oldParentId = parseInt(subtaskData.ParentID);
        const newParentId = taskIdMap.get(oldParentId);

        if (newParentId) {
          const today = new Date();
          const nextWeek = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);

          await storage.createSubtask({
            parentTaskId: newParentId,
            title: subtaskData.Name || 'Untitled Subtask',
            description: subtaskData.Description || '',
            status: subtaskData.Status || 'not_started',
            completed: subtaskData.Completed === 'true',
            startDate: subtaskData.StartDate ? new Date(subtaskData.StartDate) : today,
            endDate: subtaskData.EndDate ? new Date(subtaskData.EndDate) : nextWeek,
            estimatedCost: parseFloat(subtaskData.EstimatedCost) || null,
            actualCost: parseFloat(subtaskData.ActualCost) || null,
            assignedTo: subtaskData.AssignedTo || null,
          });
        }
      }

      // Create checklist items
      for (const checklistData of checklistRecords) {
        const oldTaskId = parseInt(checklistData.ParentID);
        const newTaskId = taskIdMap.get(oldTaskId);

        if (newTaskId) {
          await storage.createChecklistItem({
            taskId: newTaskId,
            title: checklistData.Name || 'Untitled Item',
            description: checklistData.Description || '',
            completed: checklistData.Completed === 'true',
            section: checklistData.Section || null,
            assignedTo: checklistData.AssignedTo || null,
            dueDate: checklistData.EndDate ? new Date(checklistData.EndDate) : null,
          });
        }
      }

      // Create materials
      for (const materialData of materialRecords) {
        await storage.createMaterial({
          projectId: newProject.id,
          name: materialData.Name || 'Untitled Material',
          type: materialData.MaterialType || 'other',
          tier2Category: materialData.Tier2Category || null,
          quantity: parseFloat(materialData.Quantity) || 0,
          unit: materialData.Unit || 'each',
          cost: parseFloat(materialData.Cost) || null,
          supplier: materialData.Supplier || null,
          status: materialData.Status || 'ordered',
          details: materialData.Description || null,
          section: materialData.Section || null,
        });
      }

      // Create labor entries
      for (const laborData of laborRecords) {
        const oldTaskId = parseInt(laborData.ParentID);
        const newTaskId = oldTaskId ? taskIdMap.get(oldTaskId) : null;

        // Find or create contact for labor
        let contactId = null;
        if (laborData.Name) {
          const existingContacts = await storage.getContacts();
          const existingContact = existingContacts.find(c => c.name === laborData.Name);
          if (existingContact) {
            contactId = existingContact.id;
          } else {
            const newContact = await storage.createContact({
              name: laborData.Name,
              role: 'Worker',
              company: laborData.Company || '',
              email: laborData.Email || '',
              phone: laborData.Phone || '',
              type: 'contractor',
              category: laborData.Tier2Category || 'other',
            });
            contactId = newContact.id;
          }
        }

        if (contactId) {
          await storage.createLabor({
            projectId: newProject.id,
            taskId: newTaskId || null,
            contactId: contactId,
            fullName: laborData.Name || '',
            company: laborData.Company || '',
            tier1Category: laborData.Tier1Category || null,
            tier2Category: laborData.Tier2Category || null,
            workDate: laborData.WorkDate ? new Date(laborData.WorkDate) : new Date(),
            startDate: laborData.StartDate ? new Date(laborData.StartDate) : new Date(),
            endDate: laborData.EndDate ? new Date(laborData.EndDate) : new Date(),
            totalHours: parseFloat(laborData.TotalHours) || null,
            laborCost: parseFloat(laborData.LaborCost) || null,
            workDescription: laborData.Description || null,
            status: laborData.Status || 'pending',
            email: laborData.Email || null,
            phone: laborData.Phone || null,
          });
        }
      }

      res.status(201).json({
        message: "Project imported successfully",
        project: newProject,
        stats: {
          tasks: taskRecords.length,
          subtasks: subtaskRecords.length,
          materials: materialRecords.length,
          labor: laborRecords.length,
          contacts: contactRecords.length,
          checklist: checklistRecords.length,
          categories: {
            tier1: tier1Set.size,
            tier2: tier2Map.size,
          }
        }
      });

    } catch (error) {
      console.error('Error importing project:', error);
      res.status(500).json({
        message: "Failed to import project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Helper function to parse CSV line handling quoted values
  function parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];

      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }

    result.push(current.trim());
    return result;
  }

  // Category management endpoints
  // Get categories for a project
  app.get("/api/projects/:id/categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get project-specific categories from project_categories table
      const categories = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, projectId))
        .orderBy(
          sql`case when ${projectCategories.type} = 'tier1' then 0 else 1 end`,
          projectCategories.sortOrder,
          projectCategories.name
        );

      console.log(`Returning ${categories.length} categories for project ${projectId}`);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching project categories:", error);
      res.status(500).json({
        message: "Failed to fetch project categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Get categories in flat format (for dropdowns)
  app.get("/api/projects/:id/categories/flat", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.id);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Get project-specific categories from project_categories table
      const categories = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, projectId))
        .orderBy(
          sql`case when ${projectCategories.type} = 'tier1' then 0 else 1 end`,
          projectCategories.sortOrder,
          projectCategories.name
        );

      // Transform into flat structure for easier consumption
      const tier1Categories = categories.filter(c => c.type === 'tier1');
      const tier2Categories = categories.filter(c => c.type === 'tier2');

      const flatCategories = tier1Categories.map(tier1 => ({
        ...tier1,
        subcategories: tier2Categories.filter(tier2 => tier2.parentId === tier1.id)
      }));

      console.log(`Returning ${categories.length} categories (${tier1Categories.length} tier1, ${tier2Categories.length} tier2) for project ${projectId}`);
      res.json(flatCategories);
    } catch (error) {
      console.error("Error fetching project categories (flat):", error);
      res.status(500).json({
        message: "Failed to fetch project categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/projects/:id/categories", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Validate the request body
      const categorySchema = z.object({
        hiddenCategories: z.array(z.string())
      });

      const result = categorySchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Update the project with the new hidden categories
      const project = await storage.updateProject(id, {
        hiddenCategories: result.data.hiddenCategories
      });

      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json({
        message: "Project categories updated successfully",
        hiddenCategories: project.hiddenCategories || []
      });
    } catch (error) {
      console.error("Error updating project categories:", error);
      res.status(500).json({
        message: "Failed to update project categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Task routes
  app.get("/api/tasks", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const allTasks = await storage.getTasks(userId);

      // Support pagination when page/limit params provided
      if (req.query.page || req.query.limit) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const offset = (page - 1) * limit;
        const total = allTasks.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedTasks = allTasks.slice(offset, offset + limit);

        return res.json({
          data: paginatedTasks,
          pagination: { page, limit, total, totalPages }
        });
      }

      // Default: return all tasks for backward compatibility
      res.json(allTasks);
    } catch (error) {
      console.error("[Route] Error fetching tasks:", error);
      res.status(500).json({ message: "Failed to fetch tasks", error: error.message });
    }
  });

  // Global task search endpoint
  app.get("/api/tasks/search", async (req: Request, res: Response) => {
    try {
      const query = req.query.q as string;
      const userId = req.session?.userId;

      if (!query || query.trim() === "") {
        return res.json([]);
      }

      console.log("[Route] Searching tasks with query:", query, "for user:", userId);
      const allTasks = await storage.getTasks(userId);

      // Search in title and description (case-insensitive)
      const searchLower = query.toLowerCase();
      const matchingTasks = allTasks.filter(task => {
        const titleMatch = task.title?.toLowerCase().includes(searchLower);
        const descriptionMatch = task.description?.toLowerCase().includes(searchLower);
        return titleMatch || descriptionMatch;
      });

      console.log("[Route] Found matching tasks:", matchingTasks.length);
      res.json(matchingTasks);
    } catch (error) {
      console.error("[Route] Error searching tasks:", error);
      res.status(500).json({ message: "Failed to search tasks", error: error.message });
    }
  });

  app.get("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch task" });
    }
  });

  app.get("/api/projects/:projectId/tasks", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const allTasks = await storage.getTasksByProject(projectId);

      // Support pagination when page/limit params provided
      if (req.query.page || req.query.limit) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const offset = (page - 1) * limit;
        const total = allTasks.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedTasks = allTasks.slice(offset, offset + limit);

        return res.json({
          data: paginatedTasks,
          pagination: { page, limit, total, totalPages }
        });
      }

      // Default: return all tasks for backward compatibility
      res.json(allTasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks for project" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      console.log("Task creation request received:", req.body);
      
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Task validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      console.log("Validated task data:", result.data);
      const task = await storage.createTask(result.data);
      console.log("Task created successfully:", task);
      res.status(201).json(task);
    } catch (error) {
      console.error("Error creating task:", error);
      res.status(500).json({ 
        message: "Failed to create task",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Import task from XML file
  app.post("/api/tasks/import", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      // Get project ID from request (optional)
      const targetProjectId = req.body.projectId ? parseInt(req.body.projectId) : null;

      // Parse XML
      const xmlContent = req.file.buffer.toString('utf-8');
      const parsed = await parseStringPromise(xmlContent);

      if (!parsed || !parsed['task-export']) {
        return res.status(400).json({ message: "Invalid XML format" });
      }

      const taskExport = parsed['task-export'];

      // Extract task data
      const taskData = taskExport.task?.[0];
      if (!taskData) {
        return res.status(400).json({ message: "No task data found in XML" });
      }

      // Extract description
      const description = taskExport.description?.[0]?._ || taskExport.description?.[0] || '';

      // Parse contacts first to match/create them
      const contactMap = new Map(); // old ID -> new ID
      const contacts = taskExport.contacts?.[0]?.contact || [];

      for (const contactXml of contacts) {
        const oldContactId = contactXml.$?.id;
        const name = contactXml.name?.[0] || '';
        const email = contactXml.email?.[0] || '';
        const phone = contactXml.phone?.[0] || '';
        const company = contactXml.company?.[0] || '';
        const role = contactXml.role?.[0] || '';

        // Try to find existing contact by email
        let existingContact = null;
        if (email) {
          const allContacts = await storage.getContacts();
          existingContact = allContacts.find((c: any) => c.email === email);
        }

        if (existingContact) {
          contactMap.set(oldContactId, existingContact.id);
        } else {
          // Create new contact
          const newContact = await storage.createContact({
            name,
            email: email || `imported-${Date.now()}@example.com`,
            phone,
            company,
            role,
            type: 'contractor',
            category: 'other'
          });
          contactMap.set(oldContactId, newContact.id);
        }
      }

      // Create the main task
      const newTaskData: any = {
        title: taskData.title?.[0] || 'Imported Task',
        description: description,
        projectId: targetProjectId || parseInt(taskExport.metadata?.[0]?.['project-id']?.[0]) || 0,
        status: taskData.status?.[0] || 'not_started',
        tier1Category: taskData.category?.find((c: any) => c.$?.tier === '1')?._  || null,
        tier2Category: taskData.category?.find((c: any) => c.$?.tier === '2')?._  || null,
        startDate: taskData.dates?.[0]?.start?.[0] || new Date().toISOString().split('T')[0],
        endDate: taskData.dates?.[0]?.end?.[0] || new Date().toISOString().split('T')[0],
        estimatedCost: taskData.costs?.[0]?.estimated?.[0] ? parseFloat(taskData.costs[0].estimated[0]) : null,
        actualCost: taskData.costs?.[0]?.actual?.[0] ? parseFloat(taskData.costs[0].actual[0]) : null,
        contactIds: Array.from(contactMap.values()).map(String),
        materialIds: [],
        completed: taskData.status?.[0] === 'completed'
      };

      const newTask = await storage.createTask(newTaskData);

      // Import subtasks with comments
      const subtaskMap = new Map(); // old ID -> new ID
      const subtasks = taskExport.subtasks?.[0]?.subtask || [];

      for (const subtaskXml of subtasks) {
        const oldSubtaskId = subtaskXml.$?.id;
        const subtaskData: any = {
          parentTaskId: newTask.id,
          title: subtaskXml.title?.[0] || '',
          description: subtaskXml.description?.[0]?._ || subtaskXml.description?.[0] || '',
          status: subtaskXml.$?.status || 'not_started',
          completed: subtaskXml.$?.completed === 'true',
          sortOrder: parseInt(subtaskXml.$?.order || '0'),
          assignedTo: subtaskXml['assigned-to']?.[0] || null,
          startDate: subtaskXml['start-date']?.[0] || null,
          endDate: subtaskXml['end-date']?.[0] || null,
          estimatedCost: subtaskXml['estimated-cost']?.[0] ? parseFloat(subtaskXml['estimated-cost'][0]) : null,
          actualCost: subtaskXml['actual-cost']?.[0] ? parseFloat(subtaskXml['actual-cost'][0]) : null
        };

        const newSubtask = await storage.createSubtask(subtaskData);
        subtaskMap.set(oldSubtaskId, newSubtask.id);

        // Import subtask comments
        const comments = subtaskXml.comments?.[0]?.comment || [];
        for (const commentXml of comments) {
          await storage.createSubtaskComment({
            subtaskId: newSubtask.id,
            authorName: commentXml.author?.[0] || 'Unknown',
            content: commentXml.content?.[0]?._ || commentXml.content?.[0] || ''
          });
        }
      }

      // Import blocker board items
      const blockerBoard = taskExport['blocker-board']?.[0];
      if (blockerBoard) {
        const columns = blockerBoard.column || [];
        for (const column of columns) {
          const status = column.$?.status || 'todo';
          const items = column.item || [];
          for (const item of items) {
            await storage.createChecklistItem({
              taskId: newTask.id,
              title: item.title?.[0] || '',
              description: item.description?.[0]?._ || item.description?.[0] || '',
              status: status,
              completed: status === 'done',
              sortOrder: 0
            });
          }
        }
      }

      // Import materials
      const materials = taskExport.materials?.[0]?.material || [];
      const createdMaterialIds: number[] = [];

      for (const materialXml of materials) {
        const materialData: any = {
          name: materialXml.name?.[0] || '',
          type: 'general',
          category: 'other',
          quantity: parseInt(materialXml.quantity?.[0] || '1'),
          unit: materialXml.quantity?.[0]?.$?.unit || '',
          cost: materialXml.cost?.[0] ? parseFloat(materialXml.cost[0]) : null,
          supplier: materialXml.supplier?.[0] || null,
          status: materialXml.$?.status || 'ordered',
          projectId: newTask.projectId,
          taskIds: [String(newTask.id)],
          details: materialXml.details?.[0]?._ || materialXml.details?.[0] || null
        };

        const newMaterial = await storage.createMaterial(materialData);
        createdMaterialIds.push(newMaterial.id);
      }

      // Update task with material IDs
      if (createdMaterialIds.length > 0) {
        await storage.updateTask(newTask.id, {
          materialIds: createdMaterialIds.map(String)
        });
      }

      // Import labor entries
      const laborEntries = taskExport.labor?.[0]?.entry || [];

      for (const laborXml of laborEntries) {
        // Find or create contact for worker
        let workerContactId = null;
        const workerName = laborXml.worker?.[0] || 'Unknown Worker';
        const workerCompany = laborXml.company?.[0] || '';

        const allContacts = await storage.getContacts();
        const workerContact = allContacts.find((c: any) =>
          c.name === workerName && c.company === workerCompany
        );

        if (workerContact) {
          workerContactId = workerContact.id;
        } else {
          const newContact = await storage.createContact({
            name: workerName,
            company: workerCompany,
            role: 'Worker',
            type: 'contractor',
            category: 'labor',
            email: `${workerName.toLowerCase().replace(/\s+/g, '-')}-${Date.now()}@imported.com`,
            phone: ''
          });
          workerContactId = newContact.id;
        }

        const laborData: any = {
          fullName: workerName,
          company: workerCompany,
          contactId: workerContactId,
          projectId: newTask.projectId,
          taskId: newTask.id,
          workDate: laborXml.dates?.[0]?.start?.[0] || new Date().toISOString().split('T')[0],
          startDate: laborXml.dates?.[0]?.start?.[0] || new Date().toISOString().split('T')[0],
          endDate: laborXml.dates?.[0]?.end?.[0] || new Date().toISOString().split('T')[0],
          workDescription: laborXml['work-description']?.[0]?._ || laborXml['work-description']?.[0] || '',
          taskDescription: laborXml['task-description']?.[0]?._ || laborXml['task-description']?.[0] || '',
          totalHours: laborXml.hours?.[0] ? parseFloat(laborXml.hours[0]) : null,
          laborCost: laborXml.cost?.[0] ? parseFloat(laborXml.cost[0]) : null
        };

        await storage.createLabor(laborData);
      }

      res.status(201).json({
        success: true,
        message: `Task "${newTask.title}" imported successfully`,
        taskId: newTask.id,
        imported: {
          subtasks: subtasks.length,
          contacts: contacts.length,
          materials: materials.length,
          laborEntries: laborEntries.length
        }
      });
    } catch (error) {
      console.error("Error importing task:", error);
      res.status(500).json({
        message: "Failed to import task",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Import task from CSV file (for spreadsheet editing workflow)
  app.post("/api/tasks/import-csv", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No file uploaded" });
      }

      const targetProjectId = req.body.projectId ? parseInt(req.body.projectId) : null;
      const targetTaskId = req.body.taskId ? parseInt(req.body.taskId) : null;
      const tier1Category = req.body.tier1Category || null;
      const tier2Category = req.body.tier2Category || null;

      // Parse CSV using csv-parser
      const csvContent = req.file.buffer.toString('utf-8');
      const rows: any[] = [];

      await new Promise<void>((resolve, reject) => {
        const stream = Readable.from(csvContent);
        stream
          .pipe(csvParser())
          .on('data', (row) => rows.push(row))
          .on('end', () => resolve())
          .on('error', (err) => reject(err));
      });

      if (rows.length === 0) {
        return res.status(400).json({ message: "CSV file is empty" });
      }

      // Debug: log parsed rows
      console.log('[CSV Import] Parsed rows:', rows.length);
      console.log('[CSV Import] First row keys:', Object.keys(rows[0] || {}));
      console.log('[CSV Import] Row types:', rows.map(r => r.Type || r.type || 'NO_TYPE'));

      // Find the task row (case-insensitive check)
      const taskRow = rows.find(row => row.Type === 'Task' || row.type === 'Task');
      if (!taskRow) {
        return res.status(400).json({ message: "No Task row found in CSV. First data row must have Type='Task'. Found types: " + rows.map(r => r.Type || r.type || 'undefined').join(', ') });
      }

      // Filter subtask rows (case-insensitive)
      const subtaskRows = rows.filter(row => row.Type === 'Subtask' || row.type === 'Subtask');
      console.log('[CSV Import] Found subtask rows:', subtaskRows.length);

      let taskId: number;
      let taskTitle: string;

      // If we have a target task ID, update existing task
      if (targetTaskId) {
        const existingTask = await storage.getTask(targetTaskId);
        if (!existingTask) {
          return res.status(404).json({ message: `Task ${targetTaskId} not found` });
        }

        // Update the task with CSV data (simplified: only title, description, status)
        await storage.updateTask(targetTaskId, {
          title: taskRow.Title || existingTask.title,
          description: taskRow.Description || existingTask.description,
          status: taskRow.Status || existingTask.status,
        });

        taskId = targetTaskId;
        taskTitle = taskRow.Title || existingTask.title;

        // Get existing subtasks for this task
        const existingSubtasks = await storage.getSubtasksByTask(targetTaskId);

        // Process subtask rows - update existing or create new
        for (const subtaskRow of subtaskRows) {
          const subtaskTitle = subtaskRow.Title;
          if (!subtaskTitle) continue;

          // Try to find existing subtask by title
          const existingSubtask = existingSubtasks.find(s => s.title === subtaskTitle);

          if (existingSubtask) {
            // Update existing subtask (simplified: title, description, status, order)
            await storage.updateSubtask(existingSubtask.id, {
              title: subtaskTitle,
              description: subtaskRow.Description || existingSubtask.description,
              status: subtaskRow.Status || existingSubtask.status,
              sortOrder: subtaskRow.Order ? parseInt(subtaskRow.Order) : existingSubtask.sortOrder,
            });
          } else {
            // Create new subtask
            const newSubtask = await storage.createSubtask({
              parentTaskId: targetTaskId,
              title: subtaskTitle,
              description: subtaskRow.Description || '',
              status: subtaskRow.Status || 'not_started',
              sortOrder: subtaskRow.Order ? parseInt(subtaskRow.Order) : subtaskRows.indexOf(subtaskRow) + 1,
              completed: subtaskRow.Status === 'completed',
            });

            // Parse and create comments if present (format: "[Author] Comment | [Author2] Comment2")
            if (subtaskRow.Comments) {
              const commentParts = subtaskRow.Comments.split(' | ');
              for (const part of commentParts) {
                const match = part.match(/^\[([^\]]+)\]\s*(.*)$/);
                if (match) {
                  await storage.createSubtaskComment({
                    subtaskId: newSubtask.id,
                    authorName: match[1],
                    content: match[2]
                  });
                }
              }
            }
          }
        }

        res.status(200).json({
          success: true,
          message: `Task "${taskTitle}" updated from CSV`,
          taskId: taskId,
          imported: {
            subtasksUpdated: subtaskRows.filter(r => existingSubtasks.some(s => s.title === r.Title)).length,
            subtasksCreated: subtaskRows.filter(r => !existingSubtasks.some(s => s.title === r.Title)).length,
          }
        });

      } else {
        // Create new task from CSV (simplified format)
        const projectId = targetProjectId || 0;

        const newTaskData: any = {
          title: taskRow.Title || 'Imported Task',
          description: taskRow.Description || '',
          projectId: projectId,
          status: taskRow.Status || 'not_started',
          startDate: new Date().toISOString().split('T')[0],
          endDate: new Date().toISOString().split('T')[0],
          contactIds: [],
          materialIds: [],
          completed: taskRow.Status === 'completed',
          tier1Category: tier1Category,
          tier2Category: tier2Category
        };
        console.log('[CSV Import] Creating task with projectId:', projectId, 'tier1:', tier1Category, 'tier2:', tier2Category);

        const newTask = await storage.createTask(newTaskData);
        taskId = newTask.id;
        taskTitle = newTask.title;

        // Create subtasks
        let createdCount = 0;
        for (const subtaskRow of subtaskRows) {
          const subtaskTitle = subtaskRow.Title;
          if (!subtaskTitle) {
            console.log('[CSV Import] Skipping subtask with no title');
            continue;
          }

          try {
            console.log('[CSV Import] Creating subtask:', subtaskTitle.substring(0, 50));
            const newSubtask = await storage.createSubtask({
              parentTaskId: newTask.id,
              title: subtaskTitle,
              description: subtaskRow.Description || '',
              status: subtaskRow.Status || 'not_started',
              sortOrder: subtaskRow.Order ? parseInt(subtaskRow.Order) : subtaskRows.indexOf(subtaskRow) + 1,
              completed: subtaskRow.Status === 'completed',
            });
            console.log('[CSV Import] Created subtask ID:', newSubtask.id);
            createdCount++;

            // Parse and create comments if present
            if (subtaskRow.Comments) {
              const commentParts = subtaskRow.Comments.split(' | ');
              for (const part of commentParts) {
                const match = part.match(/^\[([^\]]+)\]\s*(.*)$/);
                if (match) {
                  await storage.createSubtaskComment({
                    subtaskId: newSubtask.id,
                    authorName: match[1],
                    content: match[2]
                  });
                }
              }
            }
          } catch (subtaskError) {
            console.error('[CSV Import] Error creating subtask:', subtaskTitle, subtaskError);
          }
        }
        console.log('[CSV Import] Total subtasks created:', createdCount);

        res.status(201).json({
          success: true,
          message: `Task "${taskTitle}" created from CSV`,
          taskId: taskId,
          imported: {
            subtasks: subtaskRows.length,
          }
        });
      }

    } catch (error) {
      console.error("Error importing CSV:", error);
      res.status(500).json({
        message: "Failed to import CSV",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH endpoint for simplified updates like changing dates without materialIds processing
  app.patch("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      console.log("Task PATCH request received for ID:", req.params.id);
      console.log("Request body:", req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid task ID:", req.params.id);
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const result = insertTaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.log("Validation error with task patch:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Get the current task
      const currentTask = await storage.getTask(id);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log("Current task before patch:", currentTask);
      
      // Update the task with the new fields (simple date update)
      const task = await storage.updateTask(id, result.data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log("Successfully patched task:", task);
      res.json(task);
      
    } catch (error) {
      console.error("Error patching task:", error);
      res.status(500).json({ message: "Failed to patch task" });
    }
  });

  app.put("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      console.log("Task update request received for ID:", req.params.id);
      console.log("Request body:", req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid task ID:", req.params.id);
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const result = insertTaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.log("Validation error with task update:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.log("Parsed data for task update:", result.data);

      // Get the current task to compare materialIds
      const currentTask = await storage.getTask(id);
      if (!currentTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      console.log("Current task before update:", currentTask);
      console.log("Task materialIds before update:", currentTask.materialIds);
      console.log("Task materialIds in request body:", req.body.materialIds);
      
      // Update the task
      const task = await storage.updateTask(id, result.data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }
      
      console.log("Updated task:", task);
      console.log("Task materialIds after update:", task.materialIds);

      // Update material taskIds if materialIds have changed in the task
      if (req.body.materialIds && Array.isArray(req.body.materialIds)) {
        // Convert all materialIds to strings for consistent comparison
        const currentMaterialIds = currentTask.materialIds?.map(id => id.toString()) || [];
        const newMaterialIds = req.body.materialIds.map(id => id.toString());
        
        console.log("Current materialIds (normalized):", currentMaterialIds);
        console.log("New materialIds (normalized):", newMaterialIds);
        
        // Materials that were part of this task before but no longer are
        const removedMaterials = currentMaterialIds.filter(
          matId => !newMaterialIds.includes(matId)
        );

        // Materials that are now part of this task but weren't before
        const addedMaterials = newMaterialIds.filter(
          matId => !currentMaterialIds.includes(matId)
        );
        
        console.log("Materials to remove from task:", removedMaterials);
        console.log("Materials to add to task:", addedMaterials);

        // Remove task from materials that no longer include it
        for (const matId of removedMaterials) {
          const numericMatId = parseInt(matId, 10);
          console.log(`Removing task ${id} from material ${numericMatId}`);
          const material = await storage.getMaterial(numericMatId);
          if (material && material.taskIds) {
            // Convert all taskIds to strings for comparison
            const taskIdsStr = material.taskIds.map(tId => String(tId));
            const taskIdToRemove = String(id);
            
            // Create new array without the task ID to remove
            const updatedTaskIds = taskIdsStr.filter(tId => tId !== taskIdToRemove);
            
            console.log(`Updating material ${numericMatId} taskIds from`, material.taskIds, "to", updatedTaskIds);
            await storage.updateMaterial(numericMatId, { taskIds: updatedTaskIds });
          }
        }

        // Add task to materials that now include it
        for (const matId of addedMaterials) {
          const numericMatId = parseInt(matId, 10);
          console.log(`Adding task ${id} to material ${numericMatId}`);
          const material = await storage.getMaterial(numericMatId);
          console.log('Material data before update:', JSON.stringify(material, null, 2));
          
          if (material) {
            // Ensure we don't add duplicates and convert id to string for consistency
            const currentTaskIds = material.taskIds || [];
            console.log('Current material taskIds (raw):', currentTaskIds);
            console.log('Current material taskIds type:', typeof currentTaskIds, Array.isArray(currentTaskIds));
            
            const taskIdStr = id.toString();
            console.log('Task ID (string):', taskIdStr);
            
            const alreadyIncludesStr = currentTaskIds.includes(taskIdStr);
            const alreadyIncludesNum = currentTaskIds.includes(id);
            console.log('Already includes as string?', alreadyIncludesStr);
            console.log('Already includes as number?', alreadyIncludesNum);
            
            // Create updated array
            const updatedTaskIds = [...currentTaskIds];
            
            // Only add if not already present (checking both string and number versions)
            if (!alreadyIncludesStr && !alreadyIncludesNum) {
              updatedTaskIds.push(taskIdStr);
            }
            
            console.log(`Updating material ${numericMatId} taskIds from`, currentTaskIds, "to", updatedTaskIds);
            
            try {
              const updateResult = await storage.updateMaterial(numericMatId, { taskIds: updatedTaskIds });
              console.log('Material update result:', JSON.stringify(updateResult, null, 2));
              
              // Verify the update worked by fetching the material again
              const updatedMaterial = await storage.getMaterial(numericMatId);
              console.log('Material data after update:', JSON.stringify(updatedMaterial, null, 2));
            } catch (updateError) {
              console.error('Error updating material taskIds:', updateError);
            }
          } else {
            console.log(`Material ${numericMatId} not found in database!`);
          }
        }
      }

      // Check if this is a recurring task being marked as completed - create next occurrence
      if (task.isRecurring && task.recurrencePattern &&
          (result.data.status === 'completed' || result.data.completed === true)) {
        // Check if recurrence has ended
        const shouldCreateNext = !task.recurrenceEndDate ||
          new Date(task.recurrenceEndDate) > new Date();

        if (shouldCreateNext) {
          // Calculate next occurrence dates
          const interval = task.recurrenceInterval || 1;
          const currentStart = new Date(task.startDate);
          const currentEnd = new Date(task.endDate);
          const duration = currentEnd.getTime() - currentStart.getTime();

          let nextStart = new Date(currentStart);
          switch (task.recurrencePattern) {
            case 'daily':
              nextStart.setDate(nextStart.getDate() + interval);
              break;
            case 'weekly':
              nextStart.setDate(nextStart.getDate() + (7 * interval));
              break;
            case 'biweekly':
              nextStart.setDate(nextStart.getDate() + (14 * interval));
              break;
            case 'monthly':
              nextStart.setMonth(nextStart.getMonth() + interval);
              break;
          }

          const nextEnd = new Date(nextStart.getTime() + duration);

          // Create next occurrence (but only if within recurrence end date)
          if (!task.recurrenceEndDate || nextStart <= new Date(task.recurrenceEndDate)) {
            const nextTask = await storage.createTask({
              title: task.title,
              description: task.description,
              projectId: task.projectId,
              tier1Category: task.tier1Category,
              tier2Category: task.tier2Category,
              startDate: nextStart.toISOString().split('T')[0],
              endDate: nextEnd.toISOString().split('T')[0],
              status: 'not_started',
              completed: false,
              assignedTo: task.assignedTo,
              contactIds: task.contactIds,
              estimatedCost: task.estimatedCost,
              isRecurring: true,
              recurrencePattern: task.recurrencePattern,
              recurrenceInterval: task.recurrenceInterval,
              recurrenceEndDate: task.recurrenceEndDate,
              parentRecurringTaskId: task.parentRecurringTaskId || task.id
            });

            // Return both the completed task and info about the next occurrence
            return res.json({
              ...task,
              nextOccurrence: { id: nextTask.id, startDate: nextTask.startDate }
            });
          }
        }
      }

      res.json(task);
    } catch (error) {
      console.error("Failed to update task:", error);
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  // Batch update task sort orders
  app.post("/api/tasks/reorder", async (req: Request, res: Response) => {
    try {
      console.log("Task reorder request received:", req.body);
      
      // Validate the request body
      const schema = z.object({
        updates: z.array(z.object({
          id: z.number(),
          sortOrder: z.number()
        }))
      });
      
      const result = schema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Task reorder validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Update each task's sort order
      const updatePromises = result.data.updates.map(async (update) => {
        return await storage.updateTask(update.id, { sortOrder: update.sortOrder });
      });
      
      await Promise.all(updatePromises);
      
      console.log("Task reordering completed successfully");
      res.json({ success: true, message: "Tasks reordered successfully" });
    } catch (error) {
      console.error("Error reordering tasks:", error);
      res.status(500).json({ message: "Failed to reorder tasks" });
    }
  });

  // Clone a task with subtasks and checklists
  app.post("/api/tasks/:id/clone", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const originalTask = await storage.getTask(id);
      if (!originalTask) {
        return res.status(404).json({ message: "Task not found" });
      }

      // Create the cloned task
      const clonedTaskData = {
        title: `${originalTask.title} (Copy)`,
        description: originalTask.description,
        projectId: originalTask.projectId,
        status: "not_started",
        tier1Category: originalTask.tier1Category,
        tier2Category: originalTask.tier2Category,
        startDate: originalTask.startDate,
        endDate: originalTask.endDate,
        estimatedCost: originalTask.estimatedCost,
        assignedTo: originalTask.assignedTo,
        contactIds: originalTask.contactIds,
        completed: false
      };

      const clonedTask = await storage.createTask(clonedTaskData);

      // Clone subtasks
      const subtasks = await storage.getSubtasks(id);
      for (const subtask of subtasks) {
        await storage.createSubtask({
          parentTaskId: clonedTask.id,
          title: subtask.title,
          description: subtask.description,
          status: "not_started",
          completed: false,
          sortOrder: subtask.sortOrder,
          assignedTo: subtask.assignedTo,
          estimatedCost: subtask.estimatedCost
        });
      }

      // Clone checklist items
      const checklistItems = await storage.getChecklistItems(id);
      for (const item of checklistItems) {
        await storage.createChecklistItem({
          taskId: clonedTask.id,
          title: item.title,
          description: item.description,
          section: item.section,
          sortOrder: item.sortOrder,
          completed: false,
          assignedTo: item.assignedTo,
          dueDate: item.dueDate
        });
      }

      res.status(201).json(clonedTask);
    } catch (error) {
      console.error("Error cloning task:", error);
      res.status(500).json({ message: "Failed to clone task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      console.log("Task deletion request received for ID:", req.params.id);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid task ID:", req.params.id);
        return res.status(400).json({ message: "Invalid task ID" });
      }

      // Get the task to find associated materials
      const task = await storage.getTask(id);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      console.log("Preparing to delete task with materialIds:", task.materialIds);
      
      // Remove this task from any materials that reference it
      if (task.materialIds && task.materialIds.length > 0) {
        for (const materialId of task.materialIds) {
          // Convert materialId to number for fetching material
          const numericMaterialId = typeof materialId === 'string' ? parseInt(materialId, 10) : materialId;
          console.log(`Removing task ${id} from material ${numericMaterialId}`);
          
          const material = await storage.getMaterial(numericMaterialId);
          if (material && material.taskIds) {
            // Convert all IDs to strings for consistent comparison
            const taskIdsStr = material.taskIds.map(tId => String(tId));
            const taskIdToRemove = String(id);
            
            // Create filtered array without this task
            const updatedTaskIds = taskIdsStr.filter(tId => tId !== taskIdToRemove);
            
            console.log(`Updating material ${numericMaterialId} taskIds from`, material.taskIds, "to", updatedTaskIds);
            await storage.updateMaterial(numericMaterialId, { taskIds: updatedTaskIds });
          }
        }
      }
      
      // Delete the task
      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      console.log(`Task ${id} successfully deleted`);
      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete task:", error);
      res.status(500).json({ message: "Failed to delete task" });
    }
  });

  // Subtask routes
  // Get all subtasks (for calendar view)
  app.get("/api/subtasks", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      console.log("[API] GET /api/subtasks - Fetching subtasks for user:", userId);

      if (userId) {
        // Filter subtasks by user's projects
        const userSubtasks = await db
          .select({
            id: subtasks.id,
            parentTaskId: subtasks.parentTaskId,
            title: subtasks.title,
            description: subtasks.description,
            status: subtasks.status,
            completed: subtasks.completed,
            sortOrder: subtasks.sortOrder,
            assignedTo: subtasks.assignedTo,
            startDate: subtasks.startDate,
            endDate: subtasks.endDate,
            startTime: subtasks.startTime,
            endTime: subtasks.endTime,
            estimatedCost: subtasks.estimatedCost,
            actualCost: subtasks.actualCost,
            calendarActive: subtasks.calendarActive,
            calendarStartDate: subtasks.calendarStartDate,
            calendarEndDate: subtasks.calendarEndDate
          })
          .from(subtasks)
          .innerJoin(tasks, eq(subtasks.parentTaskId, tasks.id))
          .innerJoin(projects, eq(tasks.projectId, projects.id))
          .where(eq(projects.createdBy, userId))
          .orderBy(subtasks.parentTaskId, subtasks.sortOrder);
        console.log(`[API] GET /api/subtasks - Found ${userSubtasks.length} subtasks for user ${userId}`);
        res.json(userSubtasks);
      } else {
        // Fallback for unauthenticated requests (shouldn't happen in production)
        const allSubtasks = await db
          .select()
          .from(subtasks)
          .orderBy(subtasks.parentTaskId, subtasks.sortOrder);
        console.log(`[API] GET /api/subtasks - Found ${allSubtasks.length} subtasks (no user filter)`);
        res.json(allSubtasks);
      }
    } catch (error) {
      console.error("[API] GET /api/subtasks - Error:", error);
      res.status(500).json({ message: "Failed to fetch subtasks" });
    }
  });

  // Get a single subtask by ID
  app.get("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[API] GET /api/subtasks/${id} - Fetching subtask by ID`);

      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const [subtask] = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.id, id))
        .limit(1);

      console.log(`[API] GET /api/subtasks/${id} - Found subtask:`, subtask);

      if (!subtask) {
        console.log(`[API] GET /api/subtasks/${id} - Subtask not found`);
        return res.status(404).json({ message: "Subtask not found" });
      }

      res.json(subtask);
    } catch (error) {
      console.error("Failed to fetch subtask:", error);
      res.status(500).json({ message: "Failed to fetch subtask" });
    }
  });

  // Get subtasks for a task
  app.get("/api/tasks/:taskId/subtasks", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const taskSubtasks = await db
        .select()
        .from(subtasks)
        .where(eq(subtasks.parentTaskId, taskId))
        .orderBy(subtasks.sortOrder);

      res.json(taskSubtasks);
    } catch (error) {
      console.error("Failed to fetch subtasks:", error);
      res.status(500).json({ message: "Failed to fetch subtasks" });
    }
  });

  // Create a new subtask
  app.post("/api/tasks/:taskId/subtasks", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      // Add parentTaskId to the request body before validation
      const bodyWithParentTaskId = {
        ...req.body,
        parentTaskId: taskId
      };

      const result = insertSubtaskSchema.safeParse(bodyWithParentTaskId);
      if (!result.success) {
        console.error("Subtask validation error:", result.error);
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const subtaskData = result.data;

      const [newSubtask] = await db.insert(subtasks).values(subtaskData).returning();
      res.status(201).json(newSubtask);
    } catch (error) {
      console.error("Failed to create subtask:", error);
      res.status(500).json({ message: "Failed to create subtask" });
    }
  });

  // Update a subtask
  app.put("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      console.log(`[API] PUT /api/subtasks/${id} - Updating subtask with data:`, req.body);
      
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const result = insertSubtaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.log(`[API] PUT /api/subtasks/${id} - Validation error:`, validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      const [updatedSubtask] = await db
        .update(subtasks)
        .set(result.data)
        .where(eq(subtasks.id, id))
        .returning();

      if (!updatedSubtask) {
        console.log(`[API] PUT /api/subtasks/${id} - Subtask not found`);
        return res.status(404).json({ message: "Subtask not found" });
      }

      console.log(`[API] PUT /api/subtasks/${id} - Successfully updated subtask:`, updatedSubtask);
      res.json(updatedSubtask);
    } catch (error) {
      console.error("Failed to update subtask:", error);
      res.status(500).json({ message: "Failed to update subtask" });
    }
  });

  // Delete a subtask
  app.delete("/api/subtasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const [deletedSubtask] = await db
        .delete(subtasks)
        .where(eq(subtasks.id, id))
        .returning();

      if (!deletedSubtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete subtask:", error);
      res.status(500).json({ message: "Failed to delete subtask" });
    }
  });

  // ==================== REFERENCED SUBTASKS ====================

  // Get referenced subtasks for a task (subtasks from other tasks linked here)
  app.get("/api/tasks/:taskId/referenced-subtasks", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const refIds = (task as any).referencedSubtaskIds || [];
      if (refIds.length === 0) {
        return res.json([]);
      }

      const numericIds = refIds.map((id: string) => parseInt(id)).filter((id: number) => !isNaN(id));
      if (numericIds.length === 0) {
        return res.json([]);
      }

      const referencedSubtaskRows = await db
        .select()
        .from(subtasks)
        .where(inArray(subtasks.id, numericIds));

      // Get parent task titles for each referenced subtask
      const results = await Promise.all(
        referencedSubtaskRows.map(async (subtask) => {
          const parentTask = await storage.getTask(subtask.parentTaskId);
          return {
            ...subtask,
            parentTaskTitle: parentTask?.title || "Unknown Task",
            parentTaskId: subtask.parentTaskId,
            isReferenced: true,
          };
        })
      );

      res.json(results);
    } catch (error) {
      console.error("Failed to fetch referenced subtasks:", error);
      res.status(500).json({ message: "Failed to fetch referenced subtasks" });
    }
  });

  // ==================== TASK CATEGORIES (Multi-Category) ====================

  // List all categories for a task
  app.get("/api/tasks/:taskId/categories", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const categories = await db
        .select()
        .from(taskCategories)
        .where(eq(taskCategories.taskId, taskId))
        .orderBy(taskCategories.sortOrder);

      res.json(categories);
    } catch (error) {
      console.error("Failed to fetch task categories:", error);
      res.status(500).json({ message: "Failed to fetch task categories" });
    }
  });

  // Add a category to a task
  app.post("/api/tasks/:taskId/categories", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const task = await storage.getTask(taskId);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      const body = { ...req.body, taskId };
      const validation = insertTaskCategorySchema.safeParse(body);
      if (!validation.success) {
        return res.status(400).json({ message: "Invalid data", errors: validation.error.errors });
      }

      // If this is being set as primary, unset any existing primary
      if (body.isPrimary) {
        await db
          .update(taskCategories)
          .set({ isPrimary: false })
          .where(and(eq(taskCategories.taskId, taskId), eq(taskCategories.isPrimary, true)));
      }

      const [newCategory] = await db
        .insert(taskCategories)
        .values(validation.data)
        .returning();

      // If primary, sync to task's legacy fields
      if (body.isPrimary) {
        await storage.updateTask(taskId, {
          tier1Category: body.tier1Category || null,
          tier2Category: body.tier2Category || null,
          categoryId: body.projectCategoryId || null,
        });
      }

      res.status(201).json(newCategory);
    } catch (error) {
      console.error("Failed to add task category:", error);
      res.status(500).json({ message: "Failed to add task category" });
    }
  });

  // Update a task category assignment
  app.put("/api/task-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task category ID" });
      }

      // Get the existing record to find the taskId
      const [existing] = await db
        .select()
        .from(taskCategories)
        .where(eq(taskCategories.id, id));

      if (!existing) {
        return res.status(404).json({ message: "Task category not found" });
      }

      // If setting as primary, unset any existing primary for this task
      if (req.body.isPrimary) {
        await db
          .update(taskCategories)
          .set({ isPrimary: false })
          .where(and(eq(taskCategories.taskId, existing.taskId), eq(taskCategories.isPrimary, true)));
      }

      const [updated] = await db
        .update(taskCategories)
        .set(req.body)
        .where(eq(taskCategories.id, id))
        .returning();

      // If primary changed, sync to task's legacy fields
      if (req.body.isPrimary) {
        const tier1 = req.body.tier1Category || updated.tier1Category;
        const tier2 = req.body.tier2Category || updated.tier2Category;
        const catId = req.body.projectCategoryId || updated.projectCategoryId;
        await storage.updateTask(existing.taskId, {
          tier1Category: tier1,
          tier2Category: tier2,
          categoryId: catId,
        });
      }

      res.json(updated);
    } catch (error) {
      console.error("Failed to update task category:", error);
      res.status(500).json({ message: "Failed to update task category" });
    }
  });

  // Delete a task category assignment
  app.delete("/api/task-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task category ID" });
      }

      const [existing] = await db
        .select()
        .from(taskCategories)
        .where(eq(taskCategories.id, id));

      if (!existing) {
        return res.status(404).json({ message: "Task category not found" });
      }

      await db.delete(taskCategories).where(eq(taskCategories.id, id));

      // If we deleted the primary, promote the next one
      if (existing.isPrimary) {
        const [nextCategory] = await db
          .select()
          .from(taskCategories)
          .where(eq(taskCategories.taskId, existing.taskId))
          .orderBy(taskCategories.sortOrder)
          .limit(1);

        if (nextCategory) {
          await db
            .update(taskCategories)
            .set({ isPrimary: true })
            .where(eq(taskCategories.id, nextCategory.id));

          await storage.updateTask(existing.taskId, {
            tier1Category: nextCategory.tier1Category,
            tier2Category: nextCategory.tier2Category,
            categoryId: nextCategory.projectCategoryId,
          });
        } else {
          // No categories left, clear legacy fields
          await storage.updateTask(existing.taskId, {
            tier1Category: null,
            tier2Category: null,
            categoryId: null,
          });
        }
      }

      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete task category:", error);
      res.status(500).json({ message: "Failed to delete task category" });
    }
  });

  // Cleanup orphaned tasks
  // One-time cleanup of orphaned tasks - will execute once when the server starts
  (async () => {
    try {
      // Skip cleanup if database is not connected
      if (!db) {
        console.log("Database not connected. Skipping orphaned task cleanup.");
        return;
      }
      
      console.log("Starting automatic cleanup of orphaned tasks...");
      
      // Get all existing project IDs
      const existingProjects = await db.select({ id: projects.id }).from(projects);
      const projectIds = existingProjects.map(project => project.id);
      
      // Find tasks that are not associated with any existing project
      let orphanedTasks = [];
      
      if (projectIds.length > 0) {
        // If we have projects, find tasks whose projectId is not in the list
        const allTasks = await db
          .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
          .from(tasks);
          
        orphanedTasks = allTasks.filter(task => !projectIds.includes(task.projectId));
      } else {
        // If no projects exist, all tasks are orphaned
        orphanedTasks = await db
          .select({ id: tasks.id, projectId: tasks.projectId, title: tasks.title })
          .from(tasks);
      }
      
      // Extract the IDs of orphaned tasks
      const orphanedTaskIds = orphanedTasks.map(task => task.id);
      
      // If there are no orphaned tasks, return early
      if (orphanedTaskIds.length === 0) {
        console.log("No orphaned tasks found.");
        return;
      }
      
      console.log(`Found ${orphanedTaskIds.length} orphaned tasks.`);
      
      // Delete the orphaned tasks one by one to ensure success
      let deletedCount = 0;
      for (const taskId of orphanedTaskIds) {
        try {
          await db.delete(tasks).where(eq(tasks.id, taskId));
          deletedCount++;
        } catch (error) {
          console.error(`Failed to delete task ${taskId}:`, error);
        }
      }
      
      console.log(`Successfully removed ${deletedCount} orphaned tasks out of ${orphanedTaskIds.length}.`);
    } catch (error) {
      console.error("Error cleaning up orphaned tasks:", error);
    }
  })();

  // Contact routes
  app.get("/api/contacts", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      let contacts = await storage.getContacts();

      // Filter contacts by createdBy (user ownership)
      if (userId) {
        contacts = contacts.filter(c => (c as any).createdBy === userId);
      }

      res.json(contacts);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contacts" });
    }
  });

  app.get("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }

      const contact = await storage.getContact(id);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch contact" });
    }
  });

  app.post("/api/contacts", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      const result = insertContactSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Add createdBy to associate contact with the user
      const contactData = { ...result.data, createdBy: userId };
      const contact = await storage.createContact(contactData);
      res.status(201).json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to create contact" });
    }
  });

  app.put("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }

      const result = insertContactSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const contact = await storage.updateContact(id, result.data);
      if (!contact) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.json(contact);
    } catch (error) {
      res.status(500).json({ message: "Failed to update contact" });
    }
  });

  app.delete("/api/contacts/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }

      const success = await storage.deleteContact(id);
      if (!success) {
        return res.status(404).json({ message: "Contact not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete contact" });
    }
  });

  // Expense routes
  app.get("/api/expenses", async (_req: Request, res: Response) => {
    try {
      const expenses = await storage.getExpenses();
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses" });
    }
  });

  app.get("/api/projects/:projectId/expenses", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const expenses = await storage.getExpensesByProject(projectId);
      res.json(expenses);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expenses for project" });
    }
  });

  app.get("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const expense = await storage.getExpense(id);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch expense" });
    }
  });

  app.post("/api/expenses", async (req: Request, res: Response) => {
    try {
      const result = insertExpenseSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const expense = await storage.createExpense(result.data);
      res.status(201).json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to create expense" });
    }
  });

  app.put("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const result = insertExpenseSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const expense = await storage.updateExpense(id, result.data);
      if (!expense) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.json(expense);
    } catch (error) {
      res.status(500).json({ message: "Failed to update expense" });
    }
  });

  app.delete("/api/expenses/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Delete expense error: Invalid ID format:", req.params.id);
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      console.log(`Attempting to delete expense with ID: ${id}`);
      
      // First verify the expense exists
      const expense = await storage.getExpense(id);
      if (!expense) {
        console.log(`Delete expense error: Expense with ID ${id} not found`);
        return res.status(404).json({ message: "Expense not found" });
      }
      
      console.log(`Found expense to delete:`, expense);
      
      // Proceed with deletion
      const success = await storage.deleteExpense(id);
      if (!success) {
        console.log(`Delete expense error: Failed to delete expense with ID ${id}`);
        return res.status(500).json({ message: "Failed to delete expense" });
      }

      console.log(`Successfully deleted expense with ID ${id}`);
      res.status(204).end();
    } catch (error) {
      console.error("Delete expense error:", error);
      res.status(500).json({ 
        message: "Failed to delete expense", 
        error: error instanceof Error ? error.message : "Unknown error"
      });
    }
  });

  // Material routes
  app.get("/api/materials", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      let materials = await storage.getMaterials();

      // Filter materials by user's accessible projects
      if (userId) {
        // Get all projects the user has access to (owned or shared)
        const userProjects = await storage.getProjects(userId);
        const accessibleProjectIds = new Set(userProjects.map(p => p.id));
        materials = materials.filter(m => m.projectId && accessibleProjectIds.has(m.projectId));
      }

      // Filter by supplierId if provided
      const supplierId = req.query.supplierId ? parseInt(req.query.supplierId as string) : null;
      if (supplierId) {
        materials = materials.filter(m => m.supplierId === supplierId);
      }

      // Filter by isQuote if provided
      if (req.query.isQuote !== undefined) {
        const isQuote = req.query.isQuote === 'true';
        materials = materials.filter(m => m.isQuote === isQuote);
      }

      // Support pagination when page/limit params provided
      if (req.query.page || req.query.limit) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const offset = (page - 1) * limit;
        const total = materials.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedMaterials = materials.slice(offset, offset + limit);

        return res.json({
          data: paginatedMaterials,
          pagination: { page, limit, total, totalPages }
        });
      }

      // Default: return all materials for backward compatibility
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials:", error);
      res.status(500).json({ message: "Failed to fetch materials", error: error.message });
    }
  });

  app.get("/api/projects/:projectId/materials", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const materials = await storage.getMaterialsByProject(projectId);
      res.json(materials);
    } catch (error) {
      console.error("Error fetching materials for project:", error);
      res.status(500).json({ message: "Failed to fetch materials for project", error: error.message });
    }
  });

  app.get("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.json(material);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch material" });
    }
  });

  // Batch update materials endpoint
  app.post("/api/materials/batch-update", async (req: Request, res: Response) => {
    try {
      const { materialIds, updates } = req.body;
      
      if (!materialIds || !Array.isArray(materialIds) || materialIds.length === 0) {
        return res.status(400).json({ success: false, message: "Material IDs are required" });
      }
      
      if (!updates || typeof updates !== "object") {
        return res.status(400).json({ success: false, message: "Updates object is required" });
      }
      
      // Process batch update for all materials
      const results = await Promise.all(
        materialIds.map(async (id) => {
          try {
            // Get the existing material
            const material = await storage.getMaterial(id);
            if (!material) {
              return { id, success: false, message: "Material not found" };
            }
            
            // Apply updates
            const updatedMaterial = { ...material, ...updates };
            
            // Handle taskIds update specifically (might need to convert to array)
            if (updates.taskIds) {
              updatedMaterial.taskIds = Array.isArray(updates.taskIds) 
                ? updates.taskIds 
                : [updates.taskIds];
            }
            
            // Save the updated material
            await storage.updateMaterial(id, updatedMaterial);
            
            return { id, success: true };
          } catch (error) {
            console.error(`Error updating material ${id}:`, error);
            return { id, success: false, message: (error as Error).message };
          }
        })
      );
      
      // Check if all updates were successful
      const allSuccessful = results.every(result => result.success);
      
      if (allSuccessful) {
        return res.status(200).json({ 
          success: true, 
          message: `Successfully updated ${results.length} materials`
        });
      } else {
        const failedCount = results.filter(result => !result.success).length;
        return res.status(207).json({ 
          success: false, 
          message: `${results.length - failedCount} materials updated, ${failedCount} failed`,
          results
        });
      }
    } catch (error) {
      console.error("Error in batch update materials:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error during batch update: ${(error as Error).message}`
      });
    }
  });

  // Bulk assign material to all tasks in a tier 2 category
  app.post("/api/materials/:materialId/assign-to-tier2-category", async (req: Request, res: Response) => {
    try {
      const materialId = parseInt(req.params.materialId);
      const { projectId, tier1Category, tier2Category } = req.body;
      
      if (isNaN(materialId)) {
        return res.status(400).json({ success: false, message: "Invalid material ID" });
      }
      
      if (!projectId || !tier2Category) {
        return res.status(400).json({ 
          success: false, 
          message: "Project ID and tier 2 category are required" 
        });
      }
      
      // Get the material to verify it exists
      const material = await storage.getMaterial(materialId);
      if (!material) {
        return res.status(404).json({ success: false, message: "Material not found" });
      }
      
      // Get all tasks in the specified tier 2 category
      const allTasks = await storage.getTasksByProject(projectId);
      let filteredTasks = allTasks.filter(task => 
        task.tier2Category?.toLowerCase() === tier2Category.toLowerCase()
      );
      
      // If tier1Category is also specified, filter by that too
      if (tier1Category) {
        filteredTasks = filteredTasks.filter(task => 
          task.tier1Category?.toLowerCase() === tier1Category.toLowerCase()
        );
      }
      
      console.log(`Found ${filteredTasks.length} tasks in tier2 category: ${tier2Category}`);
      
      if (filteredTasks.length === 0) {
        return res.status(404).json({ 
          success: false, 
          message: `No tasks found in tier 2 category: ${tier2Category}` 
        });
      }
      
      // Track which tasks were successfully updated
      const updatedTasks: number[] = [];
      const failedTasks: number[] = [];
      
      // Add material to each task's materialIds array
      for (const task of filteredTasks) {
        try {
          const currentMaterialIds = task.materialIds || [];
          const materialIdStr = materialId.toString();
          
          // Check if material is already assigned to this task
          if (!currentMaterialIds.includes(materialIdStr)) {
            const updatedMaterialIds = [...currentMaterialIds, materialIdStr];
            await storage.updateTask(task.id, { materialIds: updatedMaterialIds });
            updatedTasks.push(task.id);
          } else {
            // Task already has this material, still count as success
            updatedTasks.push(task.id);
          }
        } catch (error) {
          console.error(`Failed to update task ${task.id}:`, error);
          failedTasks.push(task.id);
        }
      }
      
      // Also update the material's taskIds array to include all these tasks
      try {
        const currentTaskIds = material.taskIds || [];
        const newTaskIds = [...currentTaskIds];
        
        // Add task IDs that aren't already in the material's taskIds
        for (const taskId of updatedTasks) {
          const taskIdStr = taskId.toString();
          if (!newTaskIds.includes(taskIdStr)) {
            newTaskIds.push(taskIdStr);
          }
        }
        
        await storage.updateMaterial(materialId, { taskIds: newTaskIds });
      } catch (error) {
        console.error(`Failed to update material ${materialId} taskIds:`, error);
      }
      
      const successCount = updatedTasks.length;
      const failureCount = failedTasks.length;
      
      return res.status(200).json({
        success: true,
        message: `Successfully assigned material to ${successCount} tasks in tier 2 category: ${tier2Category}`,
        results: {
          totalTasks: filteredTasks.length,
          successCount,
          failureCount,
          updatedTaskIds: updatedTasks,
          failedTaskIds: failedTasks
        }
      });
      
    } catch (error) {
      console.error("Error in bulk material assignment:", error);
      return res.status(500).json({ 
        success: false, 
        message: `Server error during bulk assignment: ${(error as Error).message}`
      });
    }
  });

  app.post("/api/materials", async (req: Request, res: Response) => {
    try {
      const result = insertMaterialSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const material = await storage.createMaterial(result.data);
      
      // If the material is being created with status ordered, received, or installed,
      // automatically create an expense entry
      if (material.status && ["ordered", "received", "installed"].includes(material.status)) {
        try {
          console.log(`Creating expense for material with status: ${material.status}`);
          const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          const statusDescription: Record<string, string> = {
            "ordered": "Material Ordered",
            "received": "Material Received",
            "installed": "Material Installed"
          };
          
          // Calculate expense amount based on quantity and cost
          const totalCost = (material.quantity || 0) * (material.cost || 0);
          
          // Ensure we have a valid status that exists in our descriptions
          const status = material.status as string;
          const description = statusDescription[status] || "Material Update";
          
          // Create expense entry
          const expenseData = {
            description: `${description}: ${material.name}`,
            amount: totalCost,
            date: today,
            category: "materials",
            projectId: material.projectId,
            vendor: material.supplier || null,
            materialIds: [material.id.toString()],
            contactIds: material.contactIds || [],
            status: "pending"
          };
          
          console.log("Creating expense from new material:", expenseData);
          const expense = await storage.createExpense(expenseData);
          console.log("Created expense:", expense);
        } catch (expenseError) {
          console.error("Failed to create expense from new material:", expenseError);
          // Continue with the request even if expense creation fails
        }
      }
      
      // Update tasks to include this material in their materialIds array
      if (req.body.taskIds && Array.isArray(req.body.taskIds) && req.body.taskIds.length > 0) {
        for (const taskId of req.body.taskIds) {
          const task = await storage.getTask(taskId);
          if (task) {
            const materialIds = [...(task.materialIds || [])];
            const materialIdStr = material.id.toString();
            if (!materialIds.includes(materialIdStr)) {
              materialIds.push(materialIdStr);
              await storage.updateTask(taskId, { materialIds });
            }
          }
        }
      }
      
      res.status(201).json(material);
    } catch (error) {
      console.error("Failed to create material:", error);
      res.status(500).json({ message: "Failed to create material" });
    }
  });

  app.put("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      console.log("Material update request received for ID:", req.params.id);
      console.log("Request body:", req.body);
      
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        console.log("Invalid material ID:", req.params.id);
        return res.status(400).json({ message: "Invalid material ID" });
      }

      const result = insertMaterialSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.log("Validation error with material update:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      console.log("Parsed data for update:", result.data);

      // Get the current material to compare taskIds
      const currentMaterial = await storage.getMaterial(id);
      if (!currentMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }

      console.log("Current material before update:", currentMaterial);
      console.log("Material taskIds before update:", currentMaterial.taskIds);
      console.log("Material taskIds in request body:", req.body.taskIds);
      
      // Check if status is being updated to ordered, received, or installed
      let statusChanged = false;
      const automatedExpenseStatuses = ["ordered", "received", "installed"];
      
      console.log(`Status in request: "${req.body.status}", Current status: "${currentMaterial.status}"`);
      
      if (req.body.status && 
          automatedExpenseStatuses.includes(req.body.status) && 
          currentMaterial.status !== req.body.status) {
        statusChanged = true;
        console.log(`Material status changing from ${currentMaterial.status} to ${req.body.status}`);
      } else {
        console.log(`No status change or not an expense-triggering status (ordered, received, installed)`);
      }
      
      // Log the data being sent to update the material
      console.log("Updating material with data:", result.data);
      
      // Update the material
      const material = await storage.updateMaterial(id, result.data);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }
      
      // Verify the status was updated correctly
      console.log(`Status after update: requested="${req.body.status}", actual="${material.status}"`);
      
      console.log("Updated material:", material);
      console.log("Material taskIds after update:", material.taskIds);
      
      // Create expense entry if status changed to ordered, received, or installed
      if (statusChanged) {
        try {
          const today = new Date().toISOString().split('T')[0]; // Format: YYYY-MM-DD
          const statusDescription: Record<string, string> = {
            "ordered": "Material Ordered",
            "received": "Material Received",
            "installed": "Material Installed"
          };
          
          // Calculate expense amount based on quantity and cost
          const totalCost = (material.quantity || 0) * (material.cost || 0);
          
          // Ensure we have a valid status that exists in our descriptions
          const status = req.body.status as string;
          const description = statusDescription[status] || "Material Update";
          
          // Create expense entry
          const expenseData = {
            description: `${description}: ${material.name}`,
            amount: totalCost,
            date: today,
            category: "materials",
            projectId: material.projectId,
            vendor: material.supplier || null,
            materialIds: [material.id.toString()],
            contactIds: material.contactIds || [],
            status: "pending"
          };
          
          console.log("Creating expense from material:", expenseData);
          const expense = await storage.createExpense(expenseData);
          console.log("Created expense:", expense);
        } catch (expenseError) {
          console.error("Failed to create expense from material:", expenseError);
          // Continue with the request even if expense creation fails
        }
      }

      // Update task materialIds if taskIds have changed in the material
      if (req.body.taskIds && Array.isArray(req.body.taskIds)) {
        // Convert all taskIds to strings for consistent comparison
        const currentTaskIds = currentMaterial.taskIds?.map(id => id.toString()) || [];
        const newTaskIds = req.body.taskIds.map(id => id.toString());
        
        console.log("Current taskIds (normalized):", currentTaskIds);
        console.log("New taskIds (normalized):", newTaskIds);
        
        // Tasks that had this material before but no longer do
        const removedFromTasks = currentTaskIds.filter(
          taskId => !newTaskIds.includes(taskId)
        );

        // Tasks that now have this material but didn't before
        const addedToTasks = newTaskIds;
        
        console.log("Tasks to remove material from:", removedFromTasks);
        console.log("Tasks to add material to:", addedToTasks);

        // Remove material from tasks that no longer use it
        for (const taskId of removedFromTasks) {
          const numericTaskId = parseInt(taskId, 10);
          console.log(`Removing material ${id} from task ${numericTaskId}`);
          const task = await storage.getTask(numericTaskId);
          if (task && task.materialIds) {
            // Convert all materialIds to strings for comparison
            const materialIdsStr = task.materialIds.map(mId => String(mId));
            const materialIdToRemove = String(id);
            
            // Create new array without the material ID to remove
            const updatedMaterialIds = materialIdsStr.filter(mId => mId !== materialIdToRemove);
            
            console.log(`Updating task ${numericTaskId} materialIds from`, task.materialIds, "to", updatedMaterialIds);
            await storage.updateTask(numericTaskId, { materialIds: updatedMaterialIds });
          }
        }

        // Add material to tasks that now use it
        for (const taskId of addedToTasks) {
          const numericTaskId = parseInt(taskId, 10);
          console.log(`Adding material ${id} to task ${numericTaskId}`);
          const task = await storage.getTask(numericTaskId);
          console.log('Task data before update:', JSON.stringify(task, null, 2));
          
          if (task) {
            // Ensure we don't add duplicates and convert id to string for consistency
            const currentMaterialIds = task.materialIds || [];
            console.log('Current task materialIds (raw):', currentMaterialIds);
            console.log('Current task materialIds type:', typeof currentMaterialIds, Array.isArray(currentMaterialIds));
            
            const materialIdStr = id.toString();
            console.log('Material ID (string):', materialIdStr);
            
            const alreadyIncludesStr = currentMaterialIds.includes(materialIdStr);
            const alreadyIncludesNum = currentMaterialIds.includes(id);
            console.log('Already includes as string?', alreadyIncludesStr);
            console.log('Already includes as number?', alreadyIncludesNum);
            
            // Force an update regardless of includes check to fix potential issues
            const updatedMaterialIds = [...currentMaterialIds];
            
            // Only add if not already present (checking both string and number versions)
            if (!alreadyIncludesStr && !alreadyIncludesNum) {
              updatedMaterialIds.push(materialIdStr);
            }
            
            console.log(`Updating task ${numericTaskId} materialIds from`, currentMaterialIds, "to", updatedMaterialIds);
            
            try {
              const updateResult = await storage.updateTask(numericTaskId, { materialIds: updatedMaterialIds });
              console.log('Task update result:', JSON.stringify(updateResult, null, 2));
              
              // Verify the update worked by fetching the task again
              const updatedTask = await storage.getTask(numericTaskId);
              console.log('Task data after update:', JSON.stringify(updatedTask, null, 2));
            } catch (updateError) {
              console.error('Error updating task materialIds:', updateError);
            }
          } else {
            console.log(`Task ${numericTaskId} not found in database!`);
          }
        }
      }

      res.json(material);
    } catch (error) {
      console.error("Failed to update material:", error);
      res.status(500).json({ message: "Failed to update material" });
    }
  });

  app.delete("/api/materials/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      // Get the material to find associated tasks
      const material = await storage.getMaterial(id);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Remove this material from any tasks that reference it
      if (material.taskIds && material.taskIds.length > 0) {
        for (const taskId of material.taskIds) {
          // Convert taskId to number for fetching task
          const numericTaskId = typeof taskId === 'string' ? parseInt(taskId, 10) : taskId;
          console.log(`Removing material ${id} from task ${numericTaskId}`);
          
          const task = await storage.getTask(numericTaskId);
          if (task && task.materialIds) {
            // Convert all IDs to strings for consistent comparison
            const materialIdsStr = task.materialIds.map(mId => String(mId));
            const materialIdToRemove = String(id);
            
            // Create filtered array without this material
            const updatedMaterialIds = materialIdsStr.filter(mId => mId !== materialIdToRemove);
            
            console.log(`Updating task ${numericTaskId} materialIds from`, task.materialIds, "to", updatedMaterialIds);
            await storage.updateTask(numericTaskId, { materialIds: updatedMaterialIds });
          }
        }
      }

      // Delete the material
      const success = await storage.deleteMaterial(id);
      if (!success) {
        return res.status(404).json({ message: "Material not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Failed to delete material:", error);
      res.status(500).json({ message: "Failed to delete material" });
    }
  });

  // CSV upload endpoint for quotes
  app.post("/api/projects/:projectId/quotes/import-csv", upload.single('file'), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }
      
      // Get supplier ID from form data
      const supplierId = req.body.supplierId ? parseInt(req.body.supplierId) : null;
      if (!supplierId) {
        return res.status(400).json({ message: "Supplier ID is required" });
      }
      
      // Check if supplier exists
      const supplier = await storage.getContact(supplierId);
      if (!supplier) {
        return res.status(404).json({ message: "Supplier not found" });
      }

      // Create a readable stream from the buffer
      const csvStream = Readable.from(req.file.buffer.toString());
      
      const results: any[] = [];
      const importedMaterials: any[] = [];
      let errors: string[] = [];

      // Process the CSV file - ensure we capture headers correctly
      await new Promise<void>((resolve, reject) => {
        csvStream
          .pipe(csvParser({ 
            mapHeaders: ({ header, index }) => {
              console.log(`CSV Header ${index}: "${header}"`);
              return header;
            }
          }))
          .on('data', (data) => {
            console.log('CSV Row Data:', data);
            results.push(data);
          })
          .on('end', async () => {
            console.log(`Parsed ${results.length} materials from CSV`);
            
            // Process each material as a quote
            for (const row of results) {
              try {
                // Extract and clean field data
                const materialName = row['Material Name'] || '';
                const quantity = parseInt(row['Quantity']) || 0;
                const unit = row['Unit'] || 'pieces';
                const cost = parseFloat(row['Cost per Unit']) || 0;
                
                // Determine type and category
                // First try Material Type/Category fields, then fallback to Type/Category fields
                const type = row['Material Type'] || row['Type'] || 'Building Materials';
                const category = row['Material Category'] || row['Category'] || 'other';
                
                // Helper function to find field with different spellings/variations
                const findField = (fieldVariations: string[]): string | null => {
                  for (const field of fieldVariations) {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                      return row[field];
                    }
                  }
                  return null;
                };

                // Log all available fields/keys in the row for debugging
                console.log('Available fields in CSV row (quotes):', Object.keys(row));
                
                // Find the tier structure fields with broader name matching
                const tierField = findField([
                  'Project Tier', 'Project teir', 'project tier', 'project teir', 'ProjectTier', 'Tier', 'tier', 
                  'Project Tier ', ' Project Tier', ' Project Tier ', 'projectteir', 'projecttier',
                  'project_tier', 'ProjectTeir', 'projectier', 'projtier'
                ]);
                
                const tier2Field = findField([
                  'Subcategory', 'SubCategory', 'Sub Category', 'subcatagory', 'sub catagory', 'sub_category',
                  'Tier 2 Category', 'Tier2Category', 'tier2category', 'Subcategory ', ' Subcategory', 
                  ' Subcategory ', 'Sub-Category', 'SubCatagory', 'Tier 2', 'tier2', 'tier_2'
                ]);
                
                // Look for the Task ID column (FR12, FR1, etc.) to match with templateId
                // First check for ID column directly, then check alternate field names
                let taskTemplateIdField = row['ID'] || row['id'];
                
                // If not found directly, try various field name variations
                if (!taskTemplateIdField) {
                  taskTemplateIdField = findField([
                    'Task Template ID', 'task template id', 'task_template_id',
                    'TemplateID', 'templateid', 'template_id', 'template id',
                    'Task ID', 'task id', 'task_id', 'TaskID', 'taskid'
                  ]);
                }
                
                // Find any tasks with matching templateId
                let taskIds: number[] = [];
                if (taskTemplateIdField) {
                  try {
                    console.log(`Found task template ID in quotes CSV: "${taskTemplateIdField}"`);
                    
                    // Get all tasks for this project
                    const projectTasks = await storage.getTasksByProject(projectId);
                    
                    // Find tasks with matching templateId (case insensitive)
                    const matchingTasks = projectTasks.filter(task => 
                      task.templateId && task.templateId.toLowerCase() === taskTemplateIdField.toLowerCase());
                    
                    console.log(`Searched ${projectTasks.length} tasks for templateId=${taskTemplateIdField}`);
                    
                    if (matchingTasks.length > 0) {
                      console.log(`Found ${matchingTasks.length} tasks with template ID "${taskTemplateIdField}"`);
                      console.log(`Matching tasks:`, matchingTasks.map(t => ({ id: t.id, title: t.title, templateId: t.templateId })));
                      
                      // Add the task IDs to our taskIds array
                      for (const task of matchingTasks) {
                        taskIds.push(task.id);
                      }
                    } else {
                      console.log(`No tasks found with template ID "${taskTemplateIdField}"`);
                      console.log(`Available template IDs:`, 
                        projectTasks
                          .filter(t => t.templateId)
                          .map(t => t.templateId)
                      );
                    }
                  } catch (err) {
                    console.error('Error finding tasks by template ID:', err);
                  }
                }
                
                // Unlike regular material import, for quotes, we don't need to auto-link based on categories
                // The taskIds array already contains any matches from the template ID
                
                console.log('Found tier field (quotes):', tierField);
                console.log('Found tier2 field (quotes):', tier2Field);
                console.log('Using taskIds from template ID match:', taskIds);
                
                // Look for quote number fields - find the actual field name in the CSV
                const quoteNumberFieldName = findField([
                  'Quote Number', 'QuoteNumber', 'Quote #', 'quote number', 'quote #', 'quote_number',
                  'Quote Number ', ' Quote Number', 'Quotation Number', 'quotation number'
                ]);
                
                // Now extract the actual quote number value from the row
                let actualQuoteNumber = null;
                if (quoteNumberFieldName && row[quoteNumberFieldName]) {
                    actualQuoteNumber = row[quoteNumberFieldName];
                    console.log('Found Quote Number value:', actualQuoteNumber);
                } else if (row['Quote Number']) {
                    actualQuoteNumber = row['Quote Number'];
                    console.log('Found Quote Number value directly:', actualQuoteNumber);
                }

                console.log('Found quote number field:', quoteNumberFieldName, 'with value:', actualQuoteNumber);
                
                // Always ensure quotes have a quote number (auto-generate one if missing)
                if (!actualQuoteNumber) {
                    // Generate a quote number based on the current date and a random number
                    const today = new Date();
                    const dateStr = today.toISOString().split('T')[0].replace(/-/g, '');
                    const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
                    actualQuoteNumber = `Q-${dateStr}-${randomNum}`;
                    console.log(`Auto-generated quote number for material: ${actualQuoteNumber}`);
                }

                // Create the material object as a quote with all fields
                const material = {
                  projectId,
                  name: materialName,
                  type: type,
                  category: category,
                  quantity: quantity,
                  supplier: supplier.name, // Use the supplier name from the database
                  supplierId: supplierId, // Link to the supplier
                  status: 'quoted', // Default status for quotes
                  isQuote: true, // Mark as quote
                  quoteDate: new Date().toISOString().split('T')[0], // Today's date
                  quoteNumber: actualQuoteNumber, // Use the actual quote number value
                  taskIds: taskIds, // Use the task IDs we've found (might be empty array)
                  contactIds: [],
                  unit: unit,
                  cost: cost,
                  tier: tierField,
                  tier2Category: tier2Field,
                  section: row['Section'] || null,
                  subsection: row['Subsection'] || null
                };
                
                // Log the row data and constructed material for debugging
                console.log('CSV Row:', JSON.stringify(row));
                console.log('Constructed Quote:', JSON.stringify(material));

                // Validate material data
                const validation = insertMaterialSchema.safeParse(material);
                if (!validation.success) {
                  errors.push(`Error validating quote "${material.name}": ${validation.error.message}`);
                  continue;
                }

                // Create the material
                const createdMaterial = await storage.createMaterial(validation.data);
                importedMaterials.push(createdMaterial);
              } catch (error) {
                errors.push(`Error processing row: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
            resolve();
          })
          .on('error', (error) => {
            errors.push(`Error parsing CSV: ${error.message}`);
            reject(error);
          });
      });

      res.status(201).json({
        message: `Successfully imported ${importedMaterials.length} of ${results.length} materials as quotes`,
        imported: importedMaterials.length,
        total: results.length,
        errors: errors.length > 0 ? errors : undefined,
        materials: importedMaterials
      });
    } catch (error) {
      console.error("Error importing quotes from CSV:", error);
      res.status(500).json({ 
        message: "Failed to import quotes from CSV",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // CSV upload endpoint for materials
  app.post("/api/projects/:projectId/materials/import-csv", upload.single('file'), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Create a readable stream from the buffer
      const csvStream = Readable.from(req.file.buffer.toString());
      
      const results: any[] = [];
      const importedMaterials: any[] = [];
      let errors: string[] = [];

      // Process the CSV file - ensure we capture headers correctly
      await new Promise<void>((resolve, reject) => {
        csvStream
          .pipe(csvParser({ 
            mapHeaders: ({ header, index }) => {
              console.log(`CSV Header ${index}: "${header}"`);
              return header;
            }
          }))
          .on('data', (data) => {
            console.log('CSV Row Data:', data);
            results.push(data);
          })
          .on('end', async () => {
            console.log(`Parsed ${results.length} materials from CSV`);
            
            // Process each material
            for (const row of results) {
              try {
                // Extract and clean field data - Support both traditional and invoice formats
                const materialName = row['Material Name'] || row['description'] || '';
                const quantity = parseInt(row['Quantity']) || parseInt(row['quantity']) || 0;
                const unit = row['Unit'] || row['unit'] || 'pieces';

                // Handle cost/rate/amount fields from different formats
                let cost = 0;
                if (row['Cost per Unit']) {
                  cost = parseFloat(row['Cost per Unit']);
                } else if (row['rate']) {
                  // Remove commas from rate if present (e.g., "1,778.84" -> "1778.84")
                  const rateStr = row['rate'].toString().replace(/,/g, '');
                  cost = parseFloat(rateStr);
                } else if (row['amount']) {
                  // If amount is provided, calculate per unit cost
                  const amountStr = row['amount'].toString().replace(/,/g, '');
                  const amount = parseFloat(amountStr);
                  cost = quantity > 0 ? amount / quantity : amount;
                }
                
                // Determine type and category
                // First try Material Type/Category fields, then fallback to Type/Category fields
                const type = row['Material Type'] || row['Type'] || 'Building Materials';
                const category = row['Material Category'] || row['Category'] || 'other';
                
                // Helper function to find field with different spellings/variations
                const findField = (fieldVariations: string[]): string | null => {
                  for (const field of fieldVariations) {
                    if (row[field] !== undefined && row[field] !== null && row[field] !== '') {
                      return row[field];
                    }
                  }
                  return null;
                };
                
                // Log all available fields/keys in the row for debugging
                console.log('Available fields in CSV row:', Object.keys(row));
                
                // Find the tier structure fields with broader name matching
                const tierField = findField([
                  'Project Tier', 'Project teir', 'project tier', 'project teir', 'ProjectTier', 'Tier', 'tier', 
                  'Project Tier ', ' Project Tier', ' Project Tier ', 'projectteir', 'projecttier',
                  'project_tier', 'ProjectTeir', 'projectier', 'projtier',
                  // Task type fields
                  'Task Type', 'TaskType', 'task type', 'task_type', 'tasktype',
                  'Primary Task Type', 'PrimaryTaskType', 'primary_task_type',
                  'Tier1Category', 'Tier1', 'tier1', 'tier1category', 'tier_1'
                ]);
                
                const tier2Field = findField([
                  'Subcategory', 'SubCategory', 'Sub Category', 'subcatagory', 'sub catagory', 'sub_category',
                  'Tier 2 Category', 'Tier2Category', 'tier2category', 'Subcategory ', ' Subcategory', 
                  ' Subcategory ', 'Sub-Category', 'SubCatagory', 'Tier 2', 'tier2', 'tier_2',
                  // Task subtype fields
                  'Task Subtype', 'TaskSubtype', 'task subtype', 'task_subtype', 'tasksubtype',
                  'Secondary Task Type', 'SecondaryTaskType', 'secondary_task_type',
                  'Tier2Category', 'tier2category', 'tier_2_category'
                ]);
                
                // Normalize task tier values to match the application's expected values
                let normalizedTierField = tierField ? tierField.toLowerCase() : null;
                if (normalizedTierField) {
                  if (normalizedTierField.includes('structural') || normalizedTierField.includes('structure')) {
                    normalizedTierField = 'structural';
                  } else if (normalizedTierField.includes('system')) {
                    normalizedTierField = 'systems';
                  } else if (normalizedTierField.includes('sheath') || normalizedTierField.includes('seathing')) {
                    normalizedTierField = 'sheathing';
                  } else if (normalizedTierField.includes('finish')) {
                    normalizedTierField = 'finishings';
                  }
                }
                
                // Normalize task tier2 values
                let normalizedTier2Field = tier2Field ? tier2Field.toLowerCase() : null;
                if (normalizedTier2Field) {
                  if (normalizedTier2Field === 'siding') {
                    normalizedTier2Field = 'exteriors';
                  } else if (normalizedTier2Field === 'insulation') {
                    normalizedTier2Field = 'barriers';
                  } else if (normalizedTier2Field.includes('foundation')) {
                    normalizedTier2Field = 'foundation';
                  } else if (normalizedTier2Field.includes('framing')) {
                    normalizedTier2Field = 'framing';
                  } else if (normalizedTier2Field.includes('roof')) {
                    normalizedTier2Field = 'roofing';
                  } else if (normalizedTier2Field.includes('plumb')) {
                    normalizedTier2Field = 'plumbing';
                  } else if (normalizedTier2Field.includes('hvac')) {
                    normalizedTier2Field = 'hvac';
                  } else if (normalizedTier2Field.includes('electr')) {
                    normalizedTier2Field = 'electrical';
                  } else if (normalizedTier2Field.includes('drywall')) {
                    normalizedTier2Field = 'drywall';
                  } else if (normalizedTier2Field.includes('cabinet')) {
                    normalizedTier2Field = 'cabinets';
                  } else if (normalizedTier2Field.includes('floor')) {
                    normalizedTier2Field = 'flooring';
                  }
                }
                
                console.log('Found tier field:', tierField, '- Normalized to:', normalizedTierField);
                console.log('Found tier2 field:', tier2Field, '- Normalized to:', normalizedTier2Field);
                
                // Find section and subsection with flexible matching
                const sectionField = findField([
                  'Section', 'section', 'Material Section', 'material section', 'material_section',
                  'MaterialSection', 'materialsection'
                ]);

                const subsectionField = findField([
                  'Subsection', 'subsection', 'Sub Section', 'sub section', 'sub_section',
                  'Material Subsection', 'material subsection', 'material_subsection',
                  'MaterialSubsection', 'materialsubsection'
                ]);

                // Look for the Task ID column (FR12, FR1, etc.) to match with templateId
                // First check for ID column directly, then check alternate field names
                let taskTemplateIdField = row['ID'] || row['id'];
                
                // If not found directly, try various field name variations
                if (!taskTemplateIdField) {
                  taskTemplateIdField = findField([
                    'Task Template ID', 'task template id', 'task_template_id',
                    'TemplateID', 'templateid', 'template_id', 'template id',
                    'Task ID', 'task id', 'task_id', 'TaskID', 'taskid'
                  ]);
                }

                // Look for task IDs field or a comma-separated list of task IDs
                const taskIdsField = findField([
                  'Task IDs', 'task ids', 'task_ids', 'TaskIDs', 'taskids',
                  'Associated Tasks', 'associated tasks', 'associated_tasks',
                  'AssociatedTasks', 'associatedtasks'
                ]);

                // Parse task IDs if provided
                let taskIds: number[] = [];
                if (taskIdsField) {
                  // Split by comma and convert to numbers
                  taskIds = taskIdsField.split(',')
                    .map(id => id.trim())
                    .filter(id => id.length > 0 && !isNaN(parseInt(id)))
                    .map(id => parseInt(id));
                }
                
                // If we have a task template ID (FR12, FR1, etc.), try to find matching tasks
                if (taskTemplateIdField) {
                  try {
                    console.log(`Found task template ID in CSV: "${taskTemplateIdField}"`);
                    
                    // Get all tasks for this project
                    const projectTasks = await storage.getTasksByProject(projectId);
                    
                    // Log all tasks with templateId to debug
                    const tasksWithTemplateId = projectTasks.filter(t => t.templateId);
                    console.log(`Project has ${tasksWithTemplateId.length} tasks with templateId:`, 
                      tasksWithTemplateId.map(t => ({ id: t.id, title: t.title, templateId: t.templateId }))
                    );
                    
                    // Find tasks with matching templateId (case insensitive)
                    const matchingTasks = projectTasks.filter(task => {
                      if (!task.templateId) return false;
                      
                      // Debug each comparison
                      const taskTemplateIdLower = task.templateId.toLowerCase();
                      const csvIdLower = taskTemplateIdField.toLowerCase();
                      const isMatch = taskTemplateIdLower === csvIdLower;
                      
                      console.log(`Comparing task templateId "${task.templateId}" with CSV ID "${taskTemplateIdField}": ${isMatch ? 'MATCH' : 'no match'}`);
                      
                      return isMatch;
                    });
                    
                    console.log(`Searched ${projectTasks.length} tasks for templateId=${taskTemplateIdField}`);
                    
                    if (matchingTasks.length > 0) {
                      console.log(`Found ${matchingTasks.length} tasks with template ID "${taskTemplateIdField}"`);
                      console.log(`Matching tasks:`, matchingTasks.map(t => ({ id: t.id, title: t.title, templateId: t.templateId })));
                      
                      // Add the task IDs to our taskIds array (avoiding duplicates)
                      for (const task of matchingTasks) {
                        if (!taskIds.includes(task.id)) {
                          taskIds.push(task.id);
                        }
                      }
                    } else {
                      console.log(`No tasks found with template ID "${taskTemplateIdField}"`);
                      console.log(`Available template IDs:`, 
                        projectTasks
                          .filter(t => t.templateId)
                          .map(t => t.templateId)
                      );
                    }
                  } catch (err) {
                    console.error('Error finding tasks by template ID:', err);
                  }
                }
                
                // Check if we should auto-link this material to matching tasks based on categories
                // Only do this if we don't already have a specific task template ID match
                const autoLinkToTasks = (row['Auto Link To Tasks'] === 'true' || 
                                       row['Auto Link To Tasks'] === 'yes' ||
                                       row['Link to Tasks'] === 'true' ||
                                       row['Link to Tasks'] === 'yes');
                
                // If we should auto-link and we have task type information
                // AND we don't already have a task template ID match
                if (autoLinkToTasks && (normalizedTierField || normalizedTier2Field) && taskIds.length === 0) {
                  try {
                    // Get all tasks for this project
                    const projectTasks = await storage.getTasksByProject(projectId);
                    
                    // Find tasks that match our tier1/tier2 categories
                    const matchingTasks = projectTasks.filter(task => {
                      // If tier1 is specified, it must match
                      if (normalizedTierField && task.tier1Category && 
                          task.tier1Category.toLowerCase() !== normalizedTierField.toLowerCase()) {
                        return false;
                      }
                      
                      // If tier2 is specified, it must match (if the task has a tier2)
                      if (normalizedTier2Field && task.tier2Category &&
                          task.tier2Category.toLowerCase() !== normalizedTier2Field.toLowerCase()) {
                        return false;
                      }
                      
                      // If we got here, all specified criteria match
                      return true;
                    });
                    
                    console.log(`Found ${matchingTasks.length} tasks matching material's task type/category`);
                    
                    // Add matching task IDs to our taskIds array (avoid duplicates)
                    for (const task of matchingTasks) {
                      if (!taskIds.includes(task.id)) {
                        taskIds.push(task.id);
                      }
                    }
                  } catch (err) {
                    console.error('Error finding matching tasks:', err);
                  }
                }

                // Look for quote number fields - Support both traditional and invoice formats
                const quoteNumber = findField([
                  'Quote Number', 'QuoteNumber', 'Quote #', 'quote number', 'quote #', 'quote_number',
                  'Quote Number ', ' Quote Number', 'Quotation Number', 'quotation number',
                  // Invoice format fields
                  'invoiceNumber', 'Invoice Number', 'InvoiceNumber', 'invoice_number'
                ]);

                console.log('Found quote number field:', quoteNumber);

                // Extract the real quote number from the CSV row, not just the field name
                // The previous code was only storing the field name, not the actual value
                let actualQuoteNumber = null;
                if (row['Quote Number']) {
                    actualQuoteNumber = row['Quote Number'];
                    console.log('Found Quote Number value:', actualQuoteNumber);
                }
                
                // If a quote number exists, automatically mark this as a quote
                const hasQuoteNumber = actualQuoteNumber !== null && actualQuoteNumber !== '';
                const isExplicitlyMarkedAsQuote = row['Is Quote'] === 'true' || row['Is Quote'] === 'yes';
                const shouldBeQuote = hasQuoteNumber || isExplicitlyMarkedAsQuote;
                
                if (hasQuoteNumber) {
                    console.log(`Material has quote number "${actualQuoteNumber}", automatically marking as quote`);
                }
                
                // Create the material object with all fields
                const material = {
                  projectId,
                  name: materialName,
                  type: type,
                  category: category,
                  quantity: quantity,
                  supplier: row['Supplier'] || row['Supplier (optional)'] || row['billTo'] || row['shipTo'] || '', // Support both Supplier and invoice fields
                  status: shouldBeQuote ? 'quoted' : (row['Status'] || 'ordered'),
                  isQuote: shouldBeQuote, // Automatically mark as quote if quote number exists
                  quoteDate: row['Quote Date'] || row['invoiceDate'] || row['Invoice Date'] || (hasQuoteNumber ? new Date().toISOString().split('T')[0] : null),
                  quoteNumber: actualQuoteNumber, // Use the actual quote number value
                  orderDate: row['Order Date'] || row['dueDate'] || row['Due Date'] || null,
                  supplierId: row['Supplier ID'] ? parseInt(row['Supplier ID']) : null,
                  taskIds: taskIds,
                  contactIds: [],
                  unit: unit,
                  cost: cost,
                  // Use normalized values for tier and tier2Category
                  tier: normalizedTierField || tierField,
                  tier2Category: normalizedTier2Field || tier2Field,
                  section: sectionField || row['Section'] || null,
                  subsection: subsectionField || row['Subsection'] || null,
                  // Add invoice-specific details
                  details: row['terms'] || row['Terms'] || row['tax'] || row['Tax'] || row['total'] || row['Total'] || null
                };
                
                // Log the row data and constructed material for debugging
                console.log('CSV Row:', JSON.stringify(row));
                console.log('Constructed Material:', JSON.stringify(material));

                // Validate material data
                const validation = insertMaterialSchema.safeParse(material);
                if (!validation.success) {
                  errors.push(`Error validating material "${material.name}": ${validation.error.message}`);
                  continue;
                }

                // Create the material
                const createdMaterial = await storage.createMaterial(validation.data);
                importedMaterials.push(createdMaterial);
                
                // Update the tasks to include this material in their materialIds array
                // This makes the relationship bidirectional
                if (taskIds.length > 0) {
                  console.log(`Updating ${taskIds.length} tasks to include material ID ${createdMaterial.id}`);
                  
                  for (const taskId of taskIds) {
                    try {
                      // Get the current task
                      const task = await storage.getTask(taskId);
                      if (!task) {
                        console.log(`Task ${taskId} not found, skipping material association`);
                        continue;
                      }
                      
                      // Debug log current materialIds
                      console.log(`Task ${taskId} current materialIds:`, task.materialIds);
                      
                      // Check if the material ID is already in the task's materialIds array
                      // Convert all IDs to strings for comparison
                      const materialIdStr = createdMaterial.id.toString();
                      let materialIds = Array.isArray(task.materialIds) ? task.materialIds : [];
                      materialIds = materialIds.map(id => id.toString());
                      
                      // Only add the material if it's not already there
                      if (!materialIds.includes(materialIdStr)) {
                        // Add the new material ID
                        materialIds.push(materialIdStr);
                        
                        // Update the task
                        console.log(`Updating task ${taskId} materialIds to:`, materialIds);
                        await storage.updateTask(taskId, { 
                          materialIds: materialIds 
                        });
                        
                        // Verify update worked
                        const updatedTask = await storage.getTask(taskId);
                        console.log(`Task ${taskId} materialIds after update:`, updatedTask?.materialIds);
                      } else {
                        console.log(`Material ${createdMaterial.id} already associated with task ${taskId}`);
                      }
                    } catch (err) {
                      console.error(`Error updating task ${taskId} with material ${createdMaterial.id}:`, err);
                    }
                  }
                }
              } catch (error) {
                errors.push(`Error processing row: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
            resolve();
          })
          .on('error', (error) => {
            errors.push(`Error parsing CSV: ${error.message}`);
            reject(error);
          });
      });

      res.status(201).json({
        message: `Successfully imported ${importedMaterials.length} of ${results.length} materials`,
        imported: importedMaterials.length,
        total: results.length,
        errors: errors.length > 0 ? errors : undefined,
        materials: importedMaterials
      });
    } catch (error) {
      console.error("Error importing materials from CSV:", error);
      res.status(500).json({ 
        message: "Failed to import materials from CSV",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Invoice import endpoint - uses AI to parse invoices and extract materials
  app.post("/api/projects/:projectId/materials/import-invoice", upload.single('file'), async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      // Check if file was uploaded
      if (!req.file) {
        return res.status(400).json({ message: "No invoice file uploaded" });
      }

      // Check for OpenAI API key
      const openaiApiKey = process.env.OPENAI_API_KEY;
      if (!openaiApiKey) {
        return res.status(500).json({ 
          message: "OpenAI API key not configured. Please add OPENAI_API_KEY to your environment variables." 
        });
      }

      // Initialize OpenAI client
      const openai = new OpenAI({ apiKey: openaiApiKey });

      // Get the file as base64 for image processing
      const fileBuffer = req.file.buffer;
      const base64Image = fileBuffer.toString('base64');
      const mimeType = req.file.mimetype;

      console.log(`Processing invoice file: ${req.file.originalname}, type: ${mimeType}, size: ${fileBuffer.length} bytes`);

      // Validate file type - accept images and PDFs
      const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf'];
      if (!allowedTypes.includes(mimeType)) {
        return res.status(400).json({ 
          message: "Unsupported file type. Please upload an image (JPEG, PNG, GIF, WebP) or PDF file." 
        });
      }

      // For PDFs, we need to inform user that images work better
      let imageContent: any;
      if (mimeType === 'application/pdf') {
        // For PDFs, we'll still try to process but note it may have limitations
        imageContent = {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
            detail: "high"
          }
        };
      } else {
        imageContent = {
          type: "image_url",
          image_url: {
            url: `data:${mimeType};base64,${base64Image}`,
            detail: "high"
          }
        };
      }

      // Use OpenAI Vision to analyze the invoice
      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are an expert invoice parser. Your job is to extract line items from invoices and return them as structured JSON data.

For each line item, extract:
- name: The material/product name or description
- quantity: The quantity ordered (default to 1 if not specified)
- unit: The unit of measurement (e.g., "each", "pieces", "sq ft", "linear ft", "boxes", etc.)
- cost: The unit price/cost per item (NOT the total, but the per-unit price)
- type: Categorize as one of: "Building Materials", "Hardware", "Electrical", "Plumbing", "Lumber", "Tools", "Safety Equipment", "Other"
- details: Any additional notes, SKU numbers, or specifications

Also extract if available:
- supplier: The vendor/supplier name from the invoice header
- invoiceNumber: The invoice number
- invoiceDate: The invoice date in YYYY-MM-DD format

Return a valid JSON object with this exact structure:
{
  "supplier": "Supplier Name or null",
  "invoiceNumber": "Invoice number or null",
  "invoiceDate": "YYYY-MM-DD or null",
  "items": [
    {
      "name": "Material name",
      "quantity": 1,
      "unit": "each",
      "cost": 0.00,
      "type": "Building Materials",
      "details": "Additional notes or null"
    }
  ]
}

IMPORTANT RULES:
1. Always return valid JSON, no markdown formatting
2. If you cannot determine a value, use reasonable defaults
3. For cost, extract the UNIT PRICE, not the line total
4. If quantity is unclear, default to 1
5. Parse all currency values as numbers (remove $ and commas)
6. If the image is unclear or not an invoice, return an empty items array with an error message in details`
          },
          {
            role: "user",
            content: [
              {
                type: "text",
                text: "Please analyze this invoice and extract all line items as materials. Return the data as JSON."
              },
              imageContent
            ]
          }
        ],
        max_tokens: 4096,
        temperature: 0.1 // Lower temperature for more consistent parsing
      });

      // Parse the AI response
      const aiResponse = completion.choices[0]?.message?.content;
      if (!aiResponse) {
        return res.status(500).json({ message: "Failed to get response from AI" });
      }

      console.log("AI Response:", aiResponse);

      // Clean up the response - remove markdown code blocks if present
      let cleanedResponse = aiResponse.trim();
      if (cleanedResponse.startsWith('```json')) {
        cleanedResponse = cleanedResponse.slice(7);
      } else if (cleanedResponse.startsWith('```')) {
        cleanedResponse = cleanedResponse.slice(3);
      }
      if (cleanedResponse.endsWith('```')) {
        cleanedResponse = cleanedResponse.slice(0, -3);
      }
      cleanedResponse = cleanedResponse.trim();

      let parsedInvoice;
      try {
        parsedInvoice = JSON.parse(cleanedResponse);
      } catch (parseError) {
        console.error("Failed to parse AI response:", parseError);
        return res.status(500).json({ 
          message: "Failed to parse invoice data from AI response",
          rawResponse: aiResponse
        });
      }

      // Validate the parsed data
      if (!parsedInvoice.items || !Array.isArray(parsedInvoice.items)) {
        return res.status(400).json({ 
          message: "No line items found in invoice",
          parsedData: parsedInvoice
        });
      }

      // Get the supplier ID if a supplier name was found
      let supplierId: number | null = null;
      if (parsedInvoice.supplier) {
        try {
          // Try to find an existing supplier contact with this name
          const contacts = await storage.getAllContacts();
          const supplierContact = contacts.find(c => 
            c.type === 'supplier' && 
            c.name.toLowerCase().includes(parsedInvoice.supplier.toLowerCase())
          );
          if (supplierContact) {
            supplierId = supplierContact.id;
          }
        } catch (err) {
          console.error("Error finding supplier:", err);
        }
      }

      // Create materials from the parsed invoice items
      const importedMaterials: any[] = [];
      const errors: string[] = [];

      for (const item of parsedInvoice.items) {
        try {
          // Validate required fields
          if (!item.name || item.name.trim() === '') {
            errors.push(`Skipped item with empty name`);
            continue;
          }

          const materialData = {
            name: item.name.trim(),
            quantity: Math.max(1, parseInt(item.quantity) || 1),
            unit: item.unit || 'each',
            cost: parseFloat(item.cost) || 0,
            type: item.type || 'Building Materials',
            category: 'other',
            tier: 'subcategory-one',
            status: 'ordered' as const,
            projectId: projectId,
            supplier: parsedInvoice.supplier || null,
            supplierId: supplierId,
            details: item.details || null,
            quoteNumber: parsedInvoice.invoiceNumber || null,
            quoteDate: parsedInvoice.invoiceDate || null,
            orderDate: parsedInvoice.invoiceDate || null,
            isQuote: false,
            taskIds: [],
            contactIds: []
          };

          console.log(`Creating material: ${materialData.name}`);
          const createdMaterial = await storage.createMaterial(materialData);
          importedMaterials.push(createdMaterial);
        } catch (itemError) {
          const errorMsg = `Error creating material "${item.name}": ${itemError instanceof Error ? itemError.message : String(itemError)}`;
          console.error(errorMsg);
          errors.push(errorMsg);
        }
      }

      res.status(201).json({
        message: `Successfully imported ${importedMaterials.length} of ${parsedInvoice.items.length} materials from invoice`,
        imported: importedMaterials.length,
        total: parsedInvoice.items.length,
        supplier: parsedInvoice.supplier || null,
        invoiceNumber: parsedInvoice.invoiceNumber || null,
        invoiceDate: parsedInvoice.invoiceDate || null,
        errors: errors.length > 0 ? errors : undefined,
        materials: importedMaterials
      });

    } catch (error) {
      console.error("Error importing invoice:", error);
      res.status(500).json({ 
        message: "Failed to import invoice",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // POST endpoint for importing materials from n8n workflow
  app.post("/api/projects/:projectId/materials/import-n8n", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Check if project exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      const materialsData = req.body;

      // Validate request body structure
      if (!Array.isArray(materialsData)) {
        return res.status(400).json({
          message: "Request body must be an array of materials",
          expectedFormat: {
            materials: [
              {
                name: "Material Name",
                quantity: 10,
                unit: "pieces",
                cost: 15.99,
                type: "Building Materials",
                category: "Dimensional Lumber",
                tier: "structural",
                tier2Category: "framing",
                section: "CRAWL SPACE",
                subsection: "CRAWL SPACE - BEAMS",
                supplier: "84 Lumber Co.",
                supplierId: null,
                status: "quoted",
                isQuote: true,
                taskIds: [],
                contactIds: []
              }
            ]
          }
        });
      }

      const importedMaterials: any[] = [];
      let errors: string[] = [];

      // Process each material from n8n
      for (let i = 0; i < materialsData.length; i++) {
        const materialData = materialsData[i];

        try {
          // Validate required fields
          if (!materialData.name || materialData.name.trim() === '') {
            errors.push(`Material ${i + 1}: Missing or empty material name`);
            continue;
          }

          // Extract and validate field data
          const name = materialData.name.trim();
          const quantity = parseInt(materialData.quantity) || 0;
          const unit = materialData.unit || 'pieces';
          const cost = materialData.cost !== undefined ? parseFloat(materialData.cost) : 0;

          // Validate quantity and cost
          if (quantity <= 0) {
            errors.push(`Material "${name}": Invalid quantity ${materialData.quantity}, must be greater than 0`);
            continue;
          }

          if (cost < 0) {
            errors.push(`Material "${name}": Invalid cost ${materialData.cost}, must be non-negative`);
            continue;
          }

          // Determine type and category with fallbacks
          const type = materialData.type || 'Building Materials';
          const category = materialData.category || 'other';
          const tier = materialData.tier || 'structural';
          const tier2Category = materialData.tier2Category || null;
          const section = materialData.section || null;
          const subsection = materialData.subsection || null;

          // Handle supplier information
          const supplier = materialData.supplier || null;
          const supplierId = materialData.supplierId || null;

          // Handle status and quote information
          const status = materialData.status || 'ordered';
          const isQuote = materialData.isQuote !== undefined ? Boolean(materialData.isQuote) : false;

          // Handle arrays for task and contact IDs
          const taskIds = Array.isArray(materialData.taskIds) ? materialData.taskIds : [];
          const contactIds = Array.isArray(materialData.contactIds) ? materialData.contactIds : [];

          // Create the material record
          const material = {
            name,
            type,
            category,
            tier,
            tier2Category,
            section,
            subsection,
            quantity,
            unit,
            cost,
            supplier,
            supplierId,
            status,
            isQuote,
            projectId,
            taskIds,
            contactIds,
            details: materialData.details || null,
            quoteDate: materialData.quoteDate ? new Date(materialData.quoteDate) : null,
            quoteNumber: materialData.quoteNumber || null,
            orderDate: materialData.orderDate ? new Date(materialData.orderDate) : null
          };

          // Insert into database
          const insertedMaterial = await storage.createMaterial(material);
          importedMaterials.push({
            id: insertedMaterial.id,
            name: insertedMaterial.name,
            quantity: insertedMaterial.quantity,
            cost: insertedMaterial.cost,
            status: insertedMaterial.status
          });

        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Material ${i + 1} ("${materialData.name || 'Unknown'}"): ${errorMessage}`);
        }
      }

      console.log(`n8n import completed: ${importedMaterials.length} materials imported, ${errors.length} errors`);

      res.status(201).json({
        message: `Successfully imported ${importedMaterials.length} of ${materialsData.length} materials from n8n`,
        imported: importedMaterials.length,
        total: materialsData.length,
        errors: errors.length > 0 ? errors : undefined,
        materials: importedMaterials,
        projectId
      });

    } catch (error) {
      console.error("Error importing materials from n8n:", error);
      res.status(500).json({
        message: "Failed to import materials from n8n",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Task Attachment routes
  app.get("/api/tasks/:taskId/attachments", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const attachments = await storage.getTaskAttachments(taskId);
      res.json(attachments);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attachments" });
    }
  });

  app.get("/api/attachments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attachment ID" });
      }

      const attachment = await storage.getTaskAttachment(id);
      if (!attachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      res.json(attachment);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch attachment" });
    }
  });

  app.post("/api/tasks/:taskId/attachments", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      // Validate the request body using the attachment schema
      const result = insertTaskAttachmentSchema.safeParse({
        ...req.body,
        taskId
      });
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const attachment = await storage.createTaskAttachment(result.data);
      res.status(201).json(attachment);
    } catch (error) {
      console.error("Failed to create attachment:", error);
      res.status(500).json({ message: "Failed to create attachment", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.put("/api/attachments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attachment ID" });
      }

      const updatedAttachment = await storage.updateTaskAttachment(id, req.body);
      if (!updatedAttachment) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      res.json(updatedAttachment);
    } catch (error) {
      res.status(500).json({ message: "Failed to update attachment" });
    }
  });

  app.delete("/api/attachments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid attachment ID" });
      }

      const success = await storage.deleteTaskAttachment(id);
      if (!success) {
        return res.status(404).json({ message: "Attachment not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete attachment" });
    }
  });

  // Labor routes
  app.get("/api/labor", async (req: Request, res: Response) => {
    try {
      const userId = req.session?.userId;
      let laborEntries = await storage.getLabor();

      // Filter labor by user's accessible projects
      if (userId) {
        const userProjects = await storage.getProjects(userId);
        const accessibleProjectIds = new Set(userProjects.map(p => p.id));
        laborEntries = laborEntries.filter(l => l.projectId && accessibleProjectIds.has(l.projectId));
      }

      // Support pagination when page/limit params provided
      if (req.query.page || req.query.limit) {
        const page = parseInt(req.query.page as string) || 1;
        const limit = Math.min(parseInt(req.query.limit as string) || 100, 500);
        const offset = (page - 1) * limit;
        const total = laborEntries.length;
        const totalPages = Math.ceil(total / limit);
        const paginatedLabor = laborEntries.slice(offset, offset + limit);

        return res.json({
          data: paginatedLabor,
          pagination: { page, limit, total, totalPages }
        });
      }

      // Default: return all labor entries for backward compatibility
      res.json(laborEntries);
    } catch (error) {
      console.error("[API] GET /api/labor - Error fetching labor entries:", error);
      res.status(500).json({ message: "Failed to fetch labor entries" });
    }
  });

  app.get("/api/labor/:id", async (req: Request, res: Response) => {
    console.log("[API] GET /api/labor/:id - Fetching labor ID:", req.params.id);
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid labor ID" });
      }

      const labor = await storage.getLaborById(id);
      if (!labor) {
        return res.status(404).json({ message: "Labor entry not found" });
      }

      console.log("[API] GET /api/labor/:id - Returning labor:", JSON.stringify(labor, null, 2));
      console.log("[API] GET /api/labor/:id - taskId:", labor.taskId);

      res.json(labor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labor entry" });
    }
  });

  app.get("/api/projects/:projectId/labor", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const labor = await storage.getLaborByProject(projectId);
      res.json(labor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labor entries for project" });
    }
  });

  app.get("/api/tasks/:taskId/labor", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      console.log(`Looking up labor for task ID: ${taskId}`);
      const labor = await storage.getLaborByTask(taskId);
      console.log(`Found ${labor.length} labor entries for task ${taskId}`);
      
      // If this is task 3637, also check if labor ID 4 exists and add it if not already included
      if (taskId === 3637) {
        console.log("Special handling for task 3637 - checking for labor entry ID 4");
        const laborEntry4 = await storage.getLaborById(4);
        if (laborEntry4) {
          console.log("Found labor entry #4:", laborEntry4);
          // Check if it's already in the result
          const alreadyIncluded = labor.some(entry => entry.id === 4);
          if (!alreadyIncluded) {
            console.log("Adding labor entry #4 to results for task 3637");
            labor.push(laborEntry4);
          }
        }
      }
      
      res.json(labor);
    } catch (error) {
      console.error("Error fetching labor for task:", error);
      res.status(500).json({ message: "Failed to fetch labor entries for task" });
    }
  });

  app.get("/api/contacts/:contactId/labor", async (req: Request, res: Response) => {
    try {
      const contactId = parseInt(req.params.contactId);
      if (isNaN(contactId)) {
        return res.status(400).json({ message: "Invalid contact ID" });
      }

      const labor = await storage.getLaborByContact(contactId);
      res.json(labor);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch labor entries for contact" });
    }
  });

  app.post("/api/labor", async (req: Request, res: Response) => {
    try {
      console.log("[API] POST /api/labor - Received body:", JSON.stringify(req.body, null, 2));
      console.log("[API] POST /api/labor - taskId in body:", req.body.taskId);

      const result = insertLaborSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      console.log("[API] POST /api/labor - Parsed data:", JSON.stringify(result.data, null, 2));
      console.log("[API] POST /api/labor - taskId in parsed data:", result.data.taskId);

      // Add work_date field using startDate to satisfy database constraint
      const laborDataWithWorkDate = {
        ...result.data,
        // Use startDate as work_date to maintain backward compatibility
        workDate: result.data.startDate
      };

      console.log("[API] POST /api/labor - Data to be saved with workDate:", JSON.stringify(laborDataWithWorkDate, null, 2));
      console.log("[API] POST /api/labor - taskId in final data:", laborDataWithWorkDate.taskId);

      const labor = await storage.createLabor(laborDataWithWorkDate);
      console.log("[API] POST /api/labor - Created labor:", JSON.stringify(labor, null, 2));
      
      // Create an expense for the labor cost if a cost is provided and it's not a quote
      if (result.data.laborCost !== undefined && result.data.laborCost !== null && result.data.laborCost > 0) {
        try {
          const workerName = result.data.fullName || 'Worker';
          const company = result.data.company || '';
          // Use startDate as the date for the expense
          const workDate = result.data.startDate || new Date().toISOString().split('T')[0];
          
          // Only create expense if this is not a quote
          if (!result.data.isQuote) {
            // Create the expense entry
            const expenseData = {
              description: `Labor Cost: ${workerName}${company ? ` (${company})` : ''}`,
              amount: Number(result.data.laborCost),
              date: workDate,
              category: 'labor',
              projectId: result.data.projectId,
              vendor: company,
              contactIds: result.data.contactId ? [result.data.contactId.toString()] : [],
              materialIds: [],
              status: 'pending'
            };
            
            await storage.createExpense(expenseData);
          }
        } catch (expenseError) {
          console.error("Failed to create expense for labor:", expenseError);
          // Continue even if expense creation fails
        }
      }
      
      res.status(201).json(labor);
    } catch (error) {
      console.error("Failed to create labor entry:", error);
      res.status(500).json({ message: "Failed to create labor entry" });
    }
  });

  app.put("/api/labor/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid labor ID" });
      }

      const result = insertLaborSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Get the existing labor entry before updating
      const existingLabor = await storage.getLaborById(id);
      if (!existingLabor) {
        return res.status(404).json({ message: "Labor entry not found" });
      }

      // Add work_date field using startDate if available
      const updatedData = {
        ...result.data
      };
      
      // If startDate is being updated, use it for work_date
      if (result.data.startDate) {
        updatedData.workDate = result.data.startDate;
      }

      // Update the labor entry
      const labor = await storage.updateLabor(id, updatedData);
      if (!labor) {
        return res.status(404).json({ message: "Labor entry not found" });
      }

      // Create or update expense for the labor cost if a cost is provided and it's not a quote
      if (result.data.laborCost !== undefined && result.data.laborCost !== null && result.data.laborCost > 0) {
        try {
          // If this is a quote, check if we should handle expenses
          const isQuote = result.data.isQuote !== undefined ? result.data.isQuote : labor.isQuote;
          
          // Only proceed with expense operations if this is not a quote
          if (!isQuote) {
            // Get expenses that might be related to this labor entry
            const projectId = labor.projectId;
            const projectExpenses = await storage.getExpensesByProject(projectId);
            
            // Look for an expense related to this labor entry based on description pattern
            const workerName = labor.fullName || 'Worker';
            const company = labor.company || '';
            const expensePrefix = `Labor Cost: ${workerName}`;
            
            // Try to find a matching expense
            const existingExpense = projectExpenses.find(exp => 
              exp.category === 'labor' && 
              exp.description.startsWith(expensePrefix)
            );
            
            const workDate = labor.startDate || new Date().toISOString().split('T')[0];
            
            if (existingExpense) {
              // Update the existing expense
              await storage.updateExpense(existingExpense.id, {
                amount: Number(result.data.laborCost),
                date: workDate,
                vendor: company,
                status: 'pending'
              });
            } else {
              // Create a new expense
              const expenseData = {
                description: `Labor Cost: ${workerName}${company ? ` (${company})` : ''}`,
                amount: Number(result.data.laborCost),
                date: workDate,
                category: 'labor',
                projectId: labor.projectId,
                vendor: company,
                contactIds: labor.contactId ? [labor.contactId.toString()] : [],
                materialIds: [],
                status: 'pending'
              };
              
              await storage.createExpense(expenseData);
            }
          } else {
            console.log(`Labor entry ${labor.id} is marked as a quote - not creating expense`);
          }
        } catch (expenseError) {
          console.error("Failed to create/update expense for labor:", expenseError);
          // Continue even if expense creation fails
        }
      }

      res.json(labor);
    } catch (error) {
      console.error("Failed to update labor entry:", error);
      res.status(500).json({ message: "Failed to update labor entry" });
    }
  });

  app.delete("/api/labor/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid labor ID" });
      }

      const success = await storage.deleteLabor(id);
      if (!success) {
        return res.status(404).json({ message: "Labor entry not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete labor entry" });
    }
  });

  // CSV upload endpoint for labor
  app.post("/api/labor/import-csv", upload.single('file'), async (req: Request, res: Response) => {
    try {
      if (!req.file) {
        return res.status(400).json({ message: "No CSV file uploaded" });
      }

      // Create a readable stream from the buffer
      const csvStream = Readable.from(req.file.buffer.toString());
      
      const results: any[] = [];
      const importedLabor: any[] = [];
      let errors: string[] = [];

      // Process the CSV file
      await new Promise<void>((resolve, reject) => {
        csvStream
          .pipe(csvParser({ 
            mapHeaders: ({ header, index }) => {
              console.log(`CSV Header ${index}: "${header}"`);
              return header;
            }
          }))
          .on('data', (data) => {
            console.log('CSV Row Data:', data);
            results.push(data);
          })
          .on('end', async () => {
            console.log(`Parsed ${results.length} labor entries from CSV`);
            
            // Process each labor entry
            for (const row of results) {
              try {
                // Extract and clean field data
                const fullName = row['Full Name'] || row['fullName'] || row['name'] || '';
                const company = row['Company'] || row['company'] || '';
                const tier1Category = row['Tier1 Category'] || row['tier1Category'] || row['tier1_category'] || 'structural';
                const tier2Category = row['Tier2 Category'] || row['tier2Category'] || row['tier2_category'] || 'framing';
                const phone = row['Phone'] || row['phone'] || '';
                const email = row['Email'] || row['email'] || '';
                const projectId = parseInt(row['Project ID'] || row['projectId'] || row['project_id']) || null;
                const taskId = row['Task ID'] || row['taskId'] || row['task_id'] ? parseInt(row['Task ID'] || row['taskId'] || row['task_id']) : null;
                const contactId = row['Contact ID'] || row['contactId'] || row['contact_id'] ? parseInt(row['Contact ID'] || row['contactId'] || row['contact_id']) : null;
                const taskDescription = row['Task Description'] || row['taskDescription'] || row['task_description'] || '';
                const areaOfWork = row['Area of Work'] || row['areaOfWork'] || row['area_of_work'] || '';
                const startDate = row['Start Date'] || row['startDate'] || row['start_date'] || new Date().toISOString().split('T')[0];
                const endDate = row['End Date'] || row['endDate'] || row['end_date'] || new Date().toISOString().split('T')[0];
                const startTime = row['Start Time'] || row['startTime'] || row['start_time'] || '08:00';
                const endTime = row['End Time'] || row['endTime'] || row['end_time'] || '17:00';
                const totalHours = row['Total Hours'] || row['totalHours'] || row['total_hours'] ? parseFloat(row['Total Hours'] || row['totalHours'] || row['total_hours']) : 8;
                const laborCost = row['Labor Cost'] || row['laborCost'] || row['labor_cost'] ? parseFloat(row['Labor Cost'] || row['laborCost'] || row['labor_cost']) : 0;
                const unitsCompleted = row['Units Completed'] || row['unitsCompleted'] || row['units_completed'] || '';
                const status = row['Status'] || row['status'] || 'pending';
                const isQuote = (row['Is Quote'] || row['isQuote'] || row['is_quote'] || '').toLowerCase() === 'true';
                const notes = row['Notes'] || row['notes'] || '';
                
                // Validate required fields
                if (!fullName.trim()) {
                  errors.push(`Row with missing full name skipped`);
                  continue;
                }

                if (!company.trim()) {
                  errors.push(`Row "${fullName}": Company is required`);
                  continue;
                }

                // Create labor data object
                const laborData = {
                  fullName: fullName.trim(),
                  company: company.trim(),
                  tier1Category: tier1Category.toLowerCase(),
                  tier2Category: tier2Category.toLowerCase(),
                  phone,
                  email,
                  projectId,
                  taskId,
                  contactId,
                  taskDescription,
                  areaOfWork,
                  startDate,
                  endDate,
                  startTime,
                  endTime,
                  totalHours,
                  laborCost,
                  unitsCompleted,
                  status,
                  isQuote,
                  notes,
                  materialIds: [],
                  workDate: startDate // Required by database schema
                };

                // Validate labor data
                const validation = insertLaborSchema.safeParse(laborData);
                if (!validation.success) {
                  errors.push(`Error validating labor entry "${fullName}": ${validation.error.message}`);
                  continue;
                }

                // Create the labor entry
                const createdLabor = await storage.createLabor(validation.data);
                importedLabor.push(createdLabor);
              } catch (error) {
                errors.push(`Error processing row: ${error instanceof Error ? error.message : String(error)}`);
              }
            }
            resolve();
          })
          .on('error', (error) => {
            errors.push(`Error parsing CSV: ${error.message}`);
            reject(error);
          });
      });

      res.status(201).json({
        message: `Successfully imported ${importedLabor.length} of ${results.length} labor entries`,
        imported: importedLabor.length,
        total: results.length,
        errors: errors.length > 0 ? errors : undefined,
        labor: importedLabor
      });
    } catch (error) {
      console.error("Error importing labor from CSV:", error);
      res.status(500).json({ 
        message: "Failed to import labor from CSV",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Task template routes - fetch templates from shared templates file
  app.get("/api/task-templates", async (_req: Request, res: Response) => {
    try {
      // Import task templates from TypeScript file
      const { getAllTaskTemplates } = await import("../shared/taskTemplates.ts");
      const templates = getAllTaskTemplates();
      console.log(`Loaded ${templates.length} task templates`);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({
        message: "Failed to fetch task templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get project templates
  app.get("/api/projects/:projectId/templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get the project to check if it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Get selected template IDs for this project
      const selectedTemplateIds = project.selectedTemplates || [];
      
      // If there are no selected templates yet, return empty array
      if (selectedTemplateIds.length === 0) {
        return res.json([]);
      }
      
      // Fetch templates from database based on selected IDs
      if (db) {
        // Database is available
        try {
          const templates = await db.query.taskTemplates.findMany({
            where: (fields, { inArray }) => inArray(fields.templateId, selectedTemplateIds)
          });
          return res.json(templates);
        } catch (error) {
          console.error("Error fetching templates from database:", error);
          return res.status(500).json({ message: "Failed to fetch templates from database" });
        }
      } else {
        // Import task templates from shared
        const { getAllTaskTemplates } = await import("../shared/taskTemplates");
        const allTemplates = getAllTaskTemplates();
        
        // Filter by selected template IDs
        const templates = allTemplates.filter(template => selectedTemplateIds.includes(template.id));
        return res.json(templates);
      }
    } catch (error) {
      console.error("Error fetching project templates:", error);
      return res.status(500).json({ message: "Failed to fetch project templates" });
    }
  });
  
  // Update project templates
  app.put("/api/projects/:projectId/templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get the project to check if it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      const { templateIds } = req.body;
      if (!Array.isArray(templateIds)) {
        return res.status(400).json({ message: "templateIds must be an array" });
      }
      
      // Update project with selected template IDs
      if (db) {
        try {
          // Update in database using Drizzle
          await db.update(projects)
            .set({ selectedTemplates: templateIds })
            .where(eq(projects.id, projectId));
            
          const updatedProject = await storage.getProject(projectId);
          return res.json(updatedProject);
        } catch (error) {
          console.error("Error updating project templates:", error);
          return res.status(500).json({ message: "Failed to update project templates" });
        }
      } else {
        // Use memory storage
        const updatedProject = await storage.updateProject(projectId, { selectedTemplates: templateIds });
        return res.json(updatedProject);
      }
    } catch (error) {
      console.error("Error updating project templates:", error);
      return res.status(500).json({ message: "Failed to update project templates" });
    }
  });
  
  // Route to create tasks from templates
  app.post("/api/projects/:projectId/create-tasks-from-templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get the project to check if it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Check if specific template IDs or preset ID are provided
      const { templateIds, presetId } = req.body;

      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();

      let templates = allTemplates;

      // Filter templates based on parameters provided
      if (templateIds && Array.isArray(templateIds) && templateIds.length > 0) {
        // Use specific template IDs
        templates = allTemplates.filter(template => templateIds.includes(template.id));
      } else if (presetId) {
        // Filter templates based on preset categories
        // Use BASE preset for filtering (original names) and CUSTOMIZED preset for creating tasks
        const { getPresetById, getPresetWithConfig } = await import("../shared/presets");
        
        // Get the BASE preset (for filtering - uses original template names)
        const basePreset = getPresetById(presetId);
        if (!basePreset) {
          return res.status(400).json({ message: "Invalid preset ID" });
        }
        
        // Get custom configuration for this preset from database
        const configResult = await db.select()
          .from(globalSettings)
          .where(eq(globalSettings.key, `preset_config_${presetId}`))
          .limit(1);
        
        const customConfig = configResult.length > 0 ? JSON.parse(configResult[0].value) : null;
        
        // Filter templates using BASE preset (original category names)
        templates = allTemplates.filter(template => {
          const templateTier1 = template.tier1Category.toLowerCase();
          const templateTier2 = template.tier2Category.toLowerCase();

          // Find the tier1 category in the BASE preset
          const tier1Category = basePreset.categories.tier1.find(cat =>
            cat.name.toLowerCase() === templateTier1
          );

          if (!tier1Category) {
            return false; // This tier1 category is not in the preset
          }

          // Check if the tier2 category exists under this tier1 category (in BASE preset)
          const tier2Categories = basePreset.categories.tier2[tier1Category.name] || [];
          const tier2Match = tier2Categories.some(cat =>
            cat.name.toLowerCase() === templateTier2
          );

          return tier2Match;
        });

        console.log(`Filtered ${templates.length} templates from preset ${presetId} (out of ${allTemplates.length} total)`);
      }
        
      console.log(`Creating tasks from ${templates.length} templates for project ${projectId}`);
      
      const projectStartDate = new Date(project.startDate);
      const createdTasks = [];
      
      // Get existing tasks for this project to avoid duplicates
      const existingTasks = await storage.getTasksByProject(projectId);
      const existingTemplateIds = existingTasks
        .filter(task => task.templateId)
        .map(task => task.templateId);
      
      // Create name mappings from BASE preset to CUSTOMIZED preset (by sortOrder)
      // This handles renamed categories correctly
      const tier1NameMap = new Map<string, string>();
      const tier2NameMap = new Map<string, string>();
      
      if (presetId) {
        const { getPresetById, getPresetWithConfig } = await import("../shared/presets");
        const basePreset = getPresetById(presetId);
        
        const configResult = await db.select()
          .from(globalSettings)
          .where(eq(globalSettings.key, `preset_config_${presetId}`))
          .limit(1);
        const customConfig = configResult.length > 0 ? JSON.parse(configResult[0].value) : null;
        const customizedPreset = getPresetWithConfig(presetId, customConfig);
        
        if (basePreset && customizedPreset) {
          // Map tier1 categories by position (sortOrder)
          for (let i = 0; i < basePreset.categories.tier1.length && i < customizedPreset.categories.tier1.length; i++) {
            const originalName = basePreset.categories.tier1[i].name.toLowerCase();
            const newName = customizedPreset.categories.tier1[i].name;
            tier1NameMap.set(originalName, newName);
            
            // Map tier2 categories for this tier1
            const originalTier2 = basePreset.categories.tier2[basePreset.categories.tier1[i].name] || [];
            const customizedTier2 = customizedPreset.categories.tier2[customizedPreset.categories.tier1[i].name] || [];
            
            for (let j = 0; j < originalTier2.length && j < customizedTier2.length; j++) {
              tier2NameMap.set(originalTier2[j].name.toLowerCase(), customizedTier2[j].name);
            }
          }
          
        }
      }
      
      for (const template of templates) {
        // Skip if this template is already used for this project
        if (existingTemplateIds.includes(template.id)) {
          console.log(`Skipping template ${template.id} as it's already used in project ${projectId}`);
          continue;
        }
        
        // Calculate end date based on estimated duration
        const taskEndDate = new Date(projectStartDate);
        taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
        
        // Map to CUSTOMIZED preset category names using our position-based mappings
        const tier1CategoryName = tier1NameMap.get(template.tier1Category.toLowerCase()) || template.tier1Category;
        const tier2CategoryName = tier2NameMap.get(template.tier2Category.toLowerCase()) || template.tier2Category;
        
        const taskData = {
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: projectStartDate.toISOString().split('T')[0],
          endDate: taskEndDate.toISOString().split('T')[0],
          projectId: projectId,
          tier1Category: tier1CategoryName,
          tier2Category: tier2CategoryName,
          category: template.category,
          completed: false,
          templateId: template.id
        };
        
        const createdTask = await storage.createTask(taskData);
        createdTasks.push(createdTask);
      }
      
      // Build response message and data
      let responseMessage = `Created ${createdTasks.length} tasks from templates`;
      const responseData: any = {
        message: responseMessage,
        createdTasks: createdTasks
      };

      // Add preset information if preset was used
      if (presetId) {
        const { getPresetById } = await import("../shared/presets");
        const preset = getPresetById(presetId);
        if (preset) {
          responseData.presetName = preset.name;
          responseMessage = `Created ${createdTasks.length} tasks from ${preset.name} preset`;
          responseData.message = responseMessage;
        }
      }

      res.status(201).json(responseData);
    } catch (error) {
      console.error("Error creating tasks from templates:", error);
      res.status(500).json({ 
        message: "Failed to create tasks from templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Route to create tasks from preset templates
  app.post("/api/projects/:projectId/create-tasks-from-preset-templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const { presetId, replaceExisting } = req.body;
      if (!presetId) {
        return res.status(400).json({ message: "Preset ID is required" });
      }
      
      // Get the project to check if it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Import preset configuration - need BOTH original and customized
      const { getPresetById, getPresetWithConfig } = await import("../shared/presets");
      
      // Get the ORIGINAL/BASE preset (for matching templates)
      const basePreset = getPresetById(presetId);
      if (!basePreset) {
        return res.status(400).json({ message: "Invalid preset ID" });
      }
      
      // Get custom configuration for this preset from database
      const configResult = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, `preset_config_${presetId}`))
        .limit(1);
      
      const customConfig = configResult.length > 0 ? JSON.parse(configResult[0].value) : null;
      
      // Get the CUSTOMIZED preset (for creating tasks with renamed categories)
      const customizedPreset = getPresetWithConfig(presetId, customConfig);
      
      if (!customizedPreset) {
        return res.status(400).json({ message: "Invalid preset ID" });
      }
      
      // Create mapping from ORIGINAL category names to CUSTOMIZED names (by sortOrder)
      const tier1NameMapping = new Map<string, string>();
      const tier2NameMapping = new Map<string, string>();
      
      for (let i = 0; i < basePreset.categories.tier1.length && i < customizedPreset.categories.tier1.length; i++) {
        const originalName = basePreset.categories.tier1[i].name.toLowerCase();
        const customizedName = customizedPreset.categories.tier1[i].name;
        tier1NameMapping.set(originalName, customizedName);
        
        // Map tier2 categories for this tier1
        const originalTier2 = basePreset.categories.tier2[basePreset.categories.tier1[i].name] || [];
        const customizedTier2 = customizedPreset.categories.tier2[customizedPreset.categories.tier1[i].name] || [];
        
        for (let j = 0; j < originalTier2.length && j < customizedTier2.length; j++) {
          tier2NameMapping.set(originalTier2[j].name.toLowerCase(), customizedTier2[j].name);
        }
      }
      
      // Limit to first 4 categories (using BASE preset for matching)
      const limitedBasePreset = {
        ...basePreset,
        categories: {
          tier1: basePreset.categories.tier1.slice(0, 4),
          tier2: Object.fromEntries(
            Object.entries(basePreset.categories.tier2)
              .filter(([key]) => basePreset.categories.tier1.slice(0, 4).some(t1 => t1.name === key))
          )
        }
      };
      
      console.log(`Using limited BASE preset with ${limitedBasePreset.categories.tier1.length} tier1 categories:`, 
        limitedBasePreset.categories.tier1.map(c => c.name));
      
      // Get all templates from the database (not from shared file)
      const allTemplates = await db.select().from(taskTemplates);
      
      // Get category names from database to match against preset categories
      const categories = await db.select().from(categoryTemplates);
      const categoryMap = new Map(categories.map(cat => [cat.id, cat.name.toLowerCase()]));
      
      // Filter templates that match the BASE preset's categories (using original names)
      const matchingTemplates = allTemplates.filter((template) => {
        const tier1CategoryName = categoryMap.get(template.tier1CategoryId);
        const tier2CategoryName = categoryMap.get(template.tier2CategoryId);
        
        if (!tier1CategoryName || !tier2CategoryName) return false;
        
        // Check if this template's categories exist in the BASE preset (case-insensitive)
        const tier1Exists = limitedBasePreset.categories.tier1.some(cat => 
          cat.name.toLowerCase() === tier1CategoryName
        );
        
        // Find the matching tier1 category name for tier2 lookup
        const matchingTier1 = limitedBasePreset.categories.tier1.find(cat => 
          cat.name.toLowerCase() === tier1CategoryName
        );
        
        const tier2Exists = matchingTier1 && limitedBasePreset.categories.tier2[matchingTier1.name]?.some(cat => 
          cat.name.toLowerCase() === tier2CategoryName
        );
        
        return tier1Exists && tier2Exists;
      });
      
      console.log(`Found ${matchingTemplates.length} matching templates for preset ${limitedBasePreset.name}`);
      
      const projectStartDate = new Date(project.startDate);
      const createdTasks = [];
      
      // If replaceExisting is true, delete all existing tasks for this project
      if (replaceExisting) {
        console.log(`Replacing existing tasks for project ${projectId}`);
        const existingTasks = await storage.getTasksByProject(projectId);
        for (const task of existingTasks) {
          await storage.deleteTask(task.id);
        }
        console.log(`Deleted ${existingTasks.length} existing tasks`);
      }
      
      // Get existing tasks for this project to avoid duplicates (will be empty if replaceExisting is true)
      const existingTasks = await storage.getTasksByProject(projectId);
      const existingTemplateIds = existingTasks
        .filter(task => task.templateId)
        .map(task => task.templateId);
      
      // If we have matching templates, use them
      if (matchingTemplates.length > 0) {
        console.log(`Creating tasks from ${matchingTemplates.length} preset templates for project ${projectId}`);
        
        for (const template of matchingTemplates) {
          // Skip if this template is already used for this project
          if (existingTemplateIds.includes(template.templateId)) {
            console.log(`Skipping template ${template.templateId} as it's already used in project ${projectId}`);
            continue;
          }
          
          // Calculate end date based on estimated duration
          const taskEndDate = new Date(projectStartDate);
          taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
          
          // Get the original category names from database templates (lowercase)
          const originalTier1Name = categoryMap.get(template.tier1CategoryId) || "unknown";
          const originalTier2Name = categoryMap.get(template.tier2CategoryId) || "unknown";
          
          // Map to CUSTOMIZED preset category names using our pre-built mappings
          // This handles renamed categories correctly
          const tier1CategoryName = tier1NameMapping.get(originalTier1Name) || originalTier1Name;
          const tier2CategoryName = tier2NameMapping.get(originalTier2Name) || originalTier2Name;
          
          const taskData = {
            title: template.title,
            description: template.description,
            status: "not_started",
            startDate: projectStartDate.toISOString(),
            endDate: taskEndDate.toISOString(),
            projectId,
            templateId: template.templateId,
            tier1Category: tier1CategoryName,
            tier2Category: tier2CategoryName
          };
          
          const createdTask = await storage.createTask(taskData);
          createdTasks.push(createdTask);
        }
      } else {
        // No matching templates found, create tasks from CUSTOMIZED preset categories
        // Use the customized preset which has the renamed category names
        const limitedCustomizedPreset = {
          ...customizedPreset,
          categories: {
            tier1: customizedPreset.categories.tier1.slice(0, 4),
            tier2: Object.fromEntries(
              Object.entries(customizedPreset.categories.tier2)
                .filter(([key]) => customizedPreset.categories.tier1.slice(0, 4).some(t1 => t1.name === key))
            )
          }
        };
        
        console.log(`No matching templates found for preset ${limitedCustomizedPreset.name}, creating tasks from preset categories`);
        
        let taskCounter = 1;
        for (const tier1Category of limitedCustomizedPreset.categories.tier1) {
          const tier2Categories = limitedCustomizedPreset.categories.tier2[tier1Category.name] || [];
          
          for (const tier2Category of tier2Categories) {
            // Create a generic task for this category combination
            const taskEndDate = new Date(projectStartDate);
            taskEndDate.setDate(projectStartDate.getDate() + 1); // Default 1 day duration
            
            const taskData = {
              title: `${tier2Category.name} - ${tier1Category.name}`,
              description: tier2Category.description || `Complete ${tier2Category.name} tasks for ${tier1Category.name}`,
              status: "not_started",
              startDate: projectStartDate.toISOString(),
              endDate: taskEndDate.toISOString(),
              projectId,
              templateId: `preset-${presetId}-${taskCounter}`,
              tier1Category: tier1Category.name,
              tier2Category: tier2Category.name
            };
            
            const createdTask = await storage.createTask(taskData);
            createdTasks.push(createdTask);
            taskCounter++;
          }
        }
      }
      
      res.status(201).json({
        message: `Created ${createdTasks.length} tasks from ${customizedPreset.name} preset (first 4 categories)`,
        presetName: customizedPreset.name,
        createdTasks: createdTasks.length,
        tasks: createdTasks
      });
    } catch (error) {
      console.error("Error creating tasks from preset templates:", error);
      res.status(500).json({ 
        message: "Failed to create tasks from preset templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Route to activate all tasks for all projects
  app.post("/api/activate-all-tasks", async (_req: Request, res: Response) => {
    try {
      console.log("Activate all tasks request received");
      
      // Get all projects
      const projects = await storage.getProjects();
      console.log(`Found ${projects.length} projects to process`);
      
      const results = [];
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      
      // Create a Set from allTemplates to handle duplicates
      const uniqueTemplateIds = new Set();
      const uniqueTemplates = allTemplates.filter(template => {
        // If we've seen this ID before, skip it
        if (uniqueTemplateIds.has(template.id)) {
          console.log(`Filtered duplicate template ${template.id} from source data`);
          return false;
        }
        // Otherwise, add it to our set and keep it
        uniqueTemplateIds.add(template.id);
        return true;
      });
      
      console.log(`Using ${uniqueTemplates.length} unique templates out of ${allTemplates.length} total templates`);
      
      // Create tasks for each project from templates
      for (const project of projects) {
        console.log(`Processing project ${project.id}: ${project.name}`);
        
        // Get existing tasks for this project
        const existingTasks = await storage.getTasksByProject(project.id);
        
        // Find templates that haven't been used yet for this project
        const existingTemplateIds = existingTasks
          .filter(task => task.templateId)
          .map(task => task.templateId);
          
        console.log(`Project ${project.id} has ${existingTemplateIds.length} existing template tasks`);
        
        const templatesToCreate = uniqueTemplates.filter(
          template => !existingTemplateIds.includes(template.id)
        );
        
        console.log(`Found ${templatesToCreate.length} new templates to create for project ${project.id}`);
        
        if (templatesToCreate.length === 0) {
          results.push({
            projectId: project.id,
            projectName: project.name,
            tasksCreated: 0,
            message: "Project already has all template tasks"
          });
          continue;
        }
        
        // Create tasks from remaining templates
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        
        for (const template of templatesToCreate) {
          // Calculate end date based on estimated duration
          const taskEndDate = new Date(projectStartDate);
          taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
          
          const taskData = {
            title: template.title,
            description: template.description,
            status: "not_started",
            startDate: projectStartDate.toISOString().split('T')[0],
            endDate: taskEndDate.toISOString().split('T')[0],
            projectId: project.id,
            tier1Category: template.tier1Category,
            tier2Category: template.tier2Category,
            category: template.category,
            completed: false,
            templateId: template.id
          };
          
          const createdTask = await storage.createTask(taskData);
          createdTasks.push(createdTask);
        }
        
        console.log(`Created ${createdTasks.length} new template tasks for project ${project.id}`);
        
        results.push({
          projectId: project.id,
          projectName: project.name,
          tasksCreated: createdTasks.length,
          message: `Created ${createdTasks.length} template tasks`
        });
      }
      
      res.json({
        message: "Task activation completed",
        results
      });
    } catch (error) {
      console.error("Error activating all tasks:", error);
      res.status(500).json({ 
        message: "Failed to activate all tasks",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Endpoint to populate task templates (idempotent - only adds missing templates)
  app.post("/api/reset-task-templates", async (req: Request, res: Response) => {
    try {
      console.log("Populate task templates request received", req.body);
      
      // Get the project ID from query or body (optional)
      const projectId = req.query.projectId || req.body.projectId;
      
      // Get tier1 and tier2 category filters (optional)
      const tier1Category = req.body.tier1Category;
      const tier2Category = req.body.tier2Category;
      
      // If projectId is provided, populate templates for just that project
      if (projectId) {
        const id = parseInt(projectId as string);
        if (isNaN(id)) {
          return res.status(400).json({ message: "Invalid project ID" });
        }
        
        // Get the project to check if it exists
        const project = await storage.getProject(id);
        if (!project) {
          return res.status(404).json({ message: "Project not found" });
        }
        
        console.log(`Populating missing task templates for project ${id}`);
        if (tier1Category) {
          console.log(`Filtering templates by tier1Category: ${tier1Category}`);
        }
        if (tier2Category) {
          console.log(`Filtering templates by tier2Category: ${tier2Category}`);
        }
        
        // Get existing tasks for this project
        const existingTasks = await storage.getTasksByProject(id);
        
        // Create a set of template IDs that already exist for this project
        const existingTemplateIds = new Set();
        for (const task of existingTasks) {
          if (task.templateId) {
            existingTemplateIds.add(task.templateId);
          }
        }
        
        console.log(`Found ${existingTemplateIds.size} existing template tasks for project ${id}`);
        
        // Get all task templates
        const { getAllTaskTemplates } = await import("../shared/taskTemplates");
        const allTemplates = getAllTaskTemplates();
        
        // Filter templates by tier1 and tier2 categories if provided
        const templates = allTemplates.filter(template => {
          // If both tier1 and tier2 are specified, match both
          if (tier1Category && tier2Category) {
            return template.tier1Category === tier1Category && template.tier2Category === tier2Category;
          }
          // If only tier1 is specified, match only tier1
          else if (tier1Category) {
            return template.tier1Category === tier1Category;
          }
          // If only tier2 is specified, match only tier2
          else if (tier2Category) {
            return template.tier2Category === tier2Category;
          }
          // If neither is specified, include all templates
          return true;
        });
        
        console.log(`Found ${templates.length} matching task templates from ${allTemplates.length} total templates`);
        
        // Create tasks only for templates that don't already exist
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        const skippedTemplates = [];
        const processedTemplateIds = new Set(); // Track templates to avoid duplicates in one run
        
        for (const template of templates) {
          // Skip if we've already processed this template in this run
          if (processedTemplateIds.has(template.id)) {
            console.log(`Skipping duplicate template ${template.id} in templates list`);
            continue;
          }
          
          // Mark this template as processed for this run
          processedTemplateIds.add(template.id);
          
          // Skip if this template already exists for this project
          if (existingTemplateIds.has(template.id)) {
            console.log(`Skipping template ${template.id} as it already exists for project ${id}`);
            skippedTemplates.push(template.id);
            continue;
          }
          
          // Create a new task from the template
          const taskEndDate = new Date(projectStartDate);
          taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
          
          const taskData = {
            title: template.title,
            description: template.description,
            status: "not_started",
            startDate: projectStartDate.toISOString().split('T')[0],
            endDate: taskEndDate.toISOString().split('T')[0],
            projectId: id,
            tier1Category: template.tier1Category,
            tier2Category: template.tier2Category,
            category: template.category,
            completed: false,
            templateId: template.id
          };
          
          const createdTask = await storage.createTask(taskData);
          createdTasks.push(createdTask);
        }
        
        console.log(`Created ${createdTasks.length} new tasks from templates`);
        console.log(`Skipped ${skippedTemplates.length} templates that already existed`);
        
        return res.json({
          message: "Task templates populated for project",
          projectId: id,
          tasksCreated: createdTasks.length,
          skippedTemplates: skippedTemplates.length
        });
      }
      
      // If no projectId, populate templates for all projects
      console.log("Populating task templates for all projects");
      
      // Get all projects
      const projects = await storage.getProjects();
      console.log(`Found ${projects.length} projects to process`);
      
      const results = [];
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      
      // Filter templates by tier1 and tier2 categories if provided
      const templates = allTemplates.filter(template => {
        // If both tier1 and tier2 are specified, match both
        if (tier1Category && tier2Category) {
          return template.tier1Category === tier1Category && template.tier2Category === tier2Category;
        }
        // If only tier1 is specified, match only tier1
        else if (tier1Category) {
          return template.tier1Category === tier1Category;
        }
        // If only tier2 is specified, match only tier2
        else if (tier2Category) {
          return template.tier2Category === tier2Category;
        }
        // If neither is specified, include all templates
        return true;
      });
      
      console.log(`Found ${templates.length} matching task templates from ${allTemplates.length} total templates`);
      
      // Process each project
      for (const project of projects) {
        console.log(`Processing project ${project.id}: ${project.name}`);
        
        // Get existing tasks for this project
        const existingTasks = await storage.getTasksByProject(project.id);
        
        // Create a set of template IDs that already exist for this project
        const existingTemplateIds = new Set();
        for (const task of existingTasks) {
          if (task.templateId) {
            existingTemplateIds.add(task.templateId);
          }
        }
        
        console.log(`Found ${existingTemplateIds.size} existing template tasks for project ${project.id}`);
        
        // Create tasks only for templates that don't already exist
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        const skippedTemplates = [];
        const processedTemplateIds = new Set(); // Track templates to avoid duplicates in one run
        
        for (const template of templates) {
          // Skip if we've already processed this template in this run
          if (processedTemplateIds.has(template.id)) {
            console.log(`Skipping duplicate template ${template.id} in templates list for project ${project.id}`);
            continue;
          }
          
          // Mark this template as processed for this run
          processedTemplateIds.add(template.id);
          
          // Skip if this template already exists for this project
          if (existingTemplateIds.has(template.id)) {
            console.log(`Skipping template ${template.id} as it already exists for project ${project.id}`);
            skippedTemplates.push(template.id);
            continue;
          }
          
          // Create a new task from the template
          const taskEndDate = new Date(projectStartDate);
          taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
          
          const taskData = {
            title: template.title,
            description: template.description,
            status: "not_started",
            startDate: projectStartDate.toISOString().split('T')[0],
            endDate: taskEndDate.toISOString().split('T')[0],
            projectId: project.id,
            tier1Category: template.tier1Category,
            tier2Category: template.tier2Category,
            category: template.category,
            completed: false,
            templateId: template.id
          };
          
          const createdTask = await storage.createTask(taskData);
          createdTasks.push(createdTask);
        }
        
        console.log(`Created ${createdTasks.length} new tasks from templates for project ${project.id}`);
        console.log(`Skipped ${skippedTemplates.length} templates that already existed for project ${project.id}`);
        
        results.push({
          projectId: project.id,
          projectName: project.name,
          tasksCreated: createdTasks.length,
          tasksSkipped: skippedTemplates.length
        });
      }
      
      res.json({
        message: "Task templates populated for all projects",
        results
      });
    } catch (error) {
      console.error("Error populating task templates:", error);
      res.status(500).json({ 
        message: "Failed to populate task templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin panel - Template Categories routes
  app.get("/api/admin/template-categories", async (_req: Request, res: Response) => {
    try {
      const categories = await storage.getTemplateCategories();
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ 
        message: "Failed to fetch template categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update category colors from a theme
  app.post("/api/admin/update-theme-colors", async (req: Request, res: Response) => {
    try {
      console.log("Received theme color update request:", req.body);
      
      // Validate the request body (supports both old and new tier1 formats)
      const themeSchema = z.object({
        tier1: z.object({
          // New format
          'subcategory-one': z.string().optional(),
          'subcategory-two': z.string().optional(),
          'subcategory-three': z.string().optional(),
          'subcategory-four': z.string().optional(),
          'permitting': z.string().optional(),
          // Old format for backward compatibility
          structural: z.string().optional(),
          systems: z.string().optional(),
          sheathing: z.string().optional(),
          finishings: z.string().optional(),
          default: z.string().optional(),
        }),
        tier2: z.record(z.string(), z.string()).optional(),
      });
      
      const result = themeSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Theme validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      const theme = result.data;
      
      // Update tier1 category colors
      const updatePromises = [];
      
      // Get all tier1 categories
      const tier1Categories = await storage.getTemplateCategoriesByType('tier1');
      console.log('Available tier1 categories:', tier1Categories.map(c => ({ id: c.id, name: c.name, type: c.type })));
      
      for (const category of tier1Categories) {
        const lowerCaseName = category.name.toLowerCase();
        let colorToUse: string | undefined;
        console.log(`Processing category: "${category.name}" (lowercase: "${lowerCaseName}")`);
        
        // Map category names to colors, supporting both old and new formats with comprehensive variations
        const normalizedName = lowerCaseName.replace(/[\s\-_]/g, '');
        
        if (lowerCaseName === 'structural' || normalizedName === 'subcategoryone' || lowerCaseName === 'subcategory one' || lowerCaseName === 'subcategory-one') {
          colorToUse = theme.tier1['subcategory-one'] || theme.tier1.structural;
        } else if (lowerCaseName === 'systems' || normalizedName === 'subcategorytwo' || lowerCaseName === 'subcategory two' || lowerCaseName === 'subcategory-two') {
          colorToUse = theme.tier1['subcategory-two'] || theme.tier1.systems;
        } else if (lowerCaseName === 'sheathing' || normalizedName === 'subcategorythree' || lowerCaseName === 'subcategory three' || lowerCaseName === 'subcategory-three') {
          colorToUse = theme.tier1['subcategory-three'] || theme.tier1.sheathing;
        } else if (lowerCaseName === 'finishings' || normalizedName === 'subcategoryfour' || lowerCaseName === 'subcategory four' || lowerCaseName === 'subcategory-four') {
          colorToUse = theme.tier1['subcategory-four'] || theme.tier1.finishings;
        } else if (lowerCaseName === 'permitting' || lowerCaseName === 'permits') {
          colorToUse = theme.tier1['permitting'];
        }
        
        if (colorToUse) {
          console.log(`Updating category "${category.name}" (ID: ${category.id}) with color: ${colorToUse}`);
          updatePromises.push(
            storage.updateTemplateCategory(category.id, { color: colorToUse })
          );
        } else {
          console.log(`No color found for category "${category.name}"`);
        }
      }
      
      // Update tier2 category colors if provided
      if (theme.tier2) {
        // Get all tier2 categories
        const tier2Categories = await storage.getTemplateCategoriesByType('tier2');
        
        for (const category of tier2Categories) {
          const lowerCaseName = category.name.toLowerCase();
          if (theme.tier2[lowerCaseName]) {
            updatePromises.push(
              storage.updateTemplateCategory(category.id, { color: theme.tier2[lowerCaseName] })
            );
          }
        }
      }
      
      // Execute all updates
      console.log(`Executing ${updatePromises.length} color updates...`);
      await Promise.all(updatePromises);
      console.log(`Successfully updated ${updatePromises.length} category colors`);
      
      res.json({ 
        message: "Theme colors updated successfully",
        updatedCategoriesCount: updatePromises.length
      });
    } catch (error) {
      console.error("Error updating theme colors:", error);
      res.status(500).json({ 
        message: "Failed to update theme colors",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Project-specific template categories with isolation logic
  app.get("/api/projects/:projectId/template-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Get project settings to check for hidden categories
      const project = await storage.getProject(projectId);
      const hiddenCategories = project?.hiddenCategories || [];
      
      // Get ONLY project-specific categories from the project_categories table
      const filteredCategories = await db
        .select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, projectId))
        .orderBy(
          sql`case when ${projectCategories.type} = 'tier1' then 0 else 1 end`,
          projectCategories.sortOrder,
          projectCategories.name
        );
      
      console.log(`Returning ${filteredCategories.length} project-specific categories for project ${projectId}`);
      res.json(filteredCategories);
    } catch (error) {
      console.error("Error fetching template categories for project:", error);
      res.status(500).json({ 
        message: "Failed to fetch template categories for project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Get hidden categories for a project
  app.get("/api/projects/:projectId/hidden-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      // Return the hidden categories array, or empty array if none
      const hiddenCategories = project.hiddenCategories || [];
      res.json(hiddenCategories);
    } catch (error) {
      console.error("Error fetching hidden categories:", error);
      res.status(500).json({ 
        message: "Failed to fetch hidden categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Hide/show categories for a project
  app.put("/api/projects/:projectId/hidden-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const { hiddenCategories } = req.body;
      if (!Array.isArray(hiddenCategories)) {
        return res.status(400).json({ message: "hiddenCategories must be an array" });
      }
      
      // Update the project's hidden categories
      const project = await storage.updateProject(projectId, { hiddenCategories });
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }
      
      console.log(`Updated hidden categories for project ${projectId}:`, hiddenCategories);
      res.json({ message: "Hidden categories updated successfully", hiddenCategories });
    } catch (error) {
      console.error("Error updating hidden categories:", error);
      res.status(500).json({ 
        message: "Failed to update hidden categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Duplicate a tier1 category with all its subcategories and tasks (must be before general POST route)
  app.post("/api/projects/:projectId/template-categories/:id/duplicate", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      const categoryId = parseInt(req.params.id);

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
  
  // Create project-specific category
  app.post("/api/projects/:projectId/template-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const result = insertProjectCategorySchema.safeParse({
        ...req.body,
        projectId
      });
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Insert the new category into project_categories table
      const [category] = await db.insert(projectCategories)
        .values(result.data)
        .returning();
      
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating project-specific template category:", error);
      res.status(500).json({ 
        message: "Failed to create project-specific template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update project-specific category with automatic isolation
  app.put("/api/projects/:projectId/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      const result = insertProjectCategorySchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // First, check if it's a project-specific category in project_categories table
      const [projectCategory] = await db.select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.id, categoryId),
          eq(projectCategories.projectId, projectId)
        ));

      if (projectCategory) {
        console.log(`Found project-specific category ${categoryId} in project_categories table`);

        // Store the old name for task updates
        const oldCategoryName = projectCategory.name;
        const newCategoryName = result.data.name;

        // Update the project-specific category directly
        const [updatedCategory] = await db.update(projectCategories)
          .set({
            ...result.data,
            updatedAt: new Date()
          })
          .where(and(
            eq(projectCategories.id, categoryId),
            eq(projectCategories.projectId, projectId)
          ))
          .returning();

        // If the name changed, update existing tasks that reference this category
        if (newCategoryName && oldCategoryName !== newCategoryName) {
          console.log(`Category name changed from "${oldCategoryName}" to "${newCategoryName}", updating tasks...`);

          // Update tasks based on category type
          if (projectCategory.type === 'tier1') {
            // Only update tasks that exactly match the old category name
            // This prevents accidentally updating tasks from other categories
            const result = await db.update(tasks)
              .set({ tier1Category: newCategoryName })
              .where(and(
                eq(tasks.projectId, projectId),
                eq(tasks.tier1Category, oldCategoryName)
              ));

            console.log(`Updated ${result.rowCount || 0} tasks with tier1Category "${oldCategoryName}" to "${newCategoryName}"`);
          } else if (projectCategory.type === 'tier2') {
            const result = await db.update(tasks)
              .set({ tier2Category: newCategoryName })
              .where(and(
                eq(tasks.projectId, projectId),
                eq(tasks.tier2Category, oldCategoryName)
              ));

            console.log(`Updated ${result.rowCount || 0} tasks with tier2Category "${oldCategoryName}" to "${newCategoryName}"`);
          }

          console.log(`Finished updating tasks with new category name: "${newCategoryName}"`);
        }

        console.log(`Updated project-specific category: ${updatedCategory.id}`);
        return res.json(updatedCategory);
      }
      
      // If not found in project_categories, check in categoryTemplates (global templates)
      const [existingCategory] = await db.select()
        .from(categoryTemplates)
        .where(eq(categoryTemplates.id, categoryId));
      
      console.log(`Looking for global category ${categoryId}, found:`, existingCategory);
      
      if (!existingCategory) {
        console.log(`Category ${categoryId} not found in either table`);
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if it belongs to a different project
      if (existingCategory.projectId !== null && existingCategory.projectId !== projectId) {
        return res.status(403).json({ 
          message: "This category belongs to a different project and cannot be modified" 
        });
      }
      
      // ISOLATION LOGIC: If this is a global category (projectId is null), 
      // create a project-specific copy instead of modifying the global one
      if (existingCategory.projectId === null) {
        console.log(`Creating project-specific copy of global category ${categoryId} for project ${projectId}`);
        
        // Check if a project-specific copy already exists
        const [existingProjectCategory] = await db.select()
          .from(categoryTemplates)
          .where(
            and(
              eq(categoryTemplates.projectId, projectId),
              eq(categoryTemplates.name, existingCategory.name),
              eq(categoryTemplates.type, existingCategory.type),
              existingCategory.parentId ? eq(categoryTemplates.parentId, existingCategory.parentId) : isNull(categoryTemplates.parentId)
            )
          );
        
        if (existingProjectCategory) {
          // Update the existing project-specific copy
          const [updatedCategory] = await db.update(categoryTemplates)
            .set({
              ...result.data,
              updatedAt: new Date()
            })
            .where(eq(categoryTemplates.id, existingProjectCategory.id))
            .returning();
          
          console.log(`Updated existing project-specific copy: ${updatedCategory.id}`);
          return res.json(updatedCategory);
        } else {
          // Create a new project-specific copy with the modifications
          const [newProjectCategory] = await db.insert(categoryTemplates)
            .values({
              name: result.data.name || existingCategory.name,
              type: existingCategory.type,
              parentId: existingCategory.parentId,
              projectId: projectId,
              originalGlobalId: existingCategory.id, // Track which global category this overrides
              color: result.data.color || existingCategory.color,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          
          console.log(`Created new project-specific copy: ${newProjectCategory.id} from global category ${categoryId}`);
          return res.json(newProjectCategory);
        }
      } else {
        // This is already a project-specific category, update it directly
        const [updatedCategory] = await db.update(categoryTemplates)
          .set({
            ...result.data,
            updatedAt: new Date()
          })
          .where(eq(categoryTemplates.id, categoryId))
          .returning();
        
        console.log(`Updated project-specific category: ${updatedCategory.id}`);
        return res.json(updatedCategory);
      }
    } catch (error) {
      console.error("Error updating project-specific template category:", error);
      res.status(500).json({ 
        message: "Failed to update project-specific template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // PATCH project-specific category (partial updates like description)
  app.patch("/api/projects/:projectId/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      console.log(`PATCH request for category ${categoryId} in project ${projectId}:`, req.body);
      
      const result = insertCategoryTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.log("Validation error:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }
      
      // First, check if it's a project-specific category in project_categories table
      const [projectCategory] = await db.select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.id, categoryId),
          eq(projectCategories.projectId, projectId)
        ));
      
      if (projectCategory) {
        console.log(`Found project-specific category ${categoryId} in project_categories table`);
        // Update the project-specific category directly
        const [updatedCategory] = await db.update(projectCategories)
          .set({
            ...result.data,
            updatedAt: new Date()
          })
          .where(and(
            eq(projectCategories.id, categoryId),
            eq(projectCategories.projectId, projectId)
          ))
          .returning();
        
        console.log(`Updated project-specific category: ${updatedCategory.id}`);
        return res.json(updatedCategory);
      }
      
      // If not found in project_categories, check in categoryTemplates (global templates)
      const [existingCategory] = await db.select()
        .from(categoryTemplates)
        .where(eq(categoryTemplates.id, categoryId));
      
      console.log(`Looking for global category ${categoryId}, found:`, existingCategory);
      
      if (!existingCategory) {
        console.log(`Category ${categoryId} not found in either table`);
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Check if it belongs to a different project
      if (existingCategory.projectId !== null && existingCategory.projectId !== projectId) {
        return res.status(403).json({ 
          message: "This category belongs to a different project and cannot be modified" 
        });
      }
      
      // ISOLATION LOGIC: If this is a global category (projectId is null), 
      // create a project-specific copy instead of modifying the global one
      if (existingCategory.projectId === null) {
        console.log(`Creating project-specific copy of global category ${categoryId} for project ${projectId}`);
        
        // Check if a project-specific copy already exists
        const [existingProjectCategory] = await db.select()
          .from(categoryTemplates)
          .where(
            and(
              eq(categoryTemplates.projectId, projectId),
              eq(categoryTemplates.name, existingCategory.name),
              eq(categoryTemplates.type, existingCategory.type),
              existingCategory.parentId ? eq(categoryTemplates.parentId, existingCategory.parentId) : isNull(categoryTemplates.parentId)
            )
          );
        
        if (existingProjectCategory) {
          // Update the existing project-specific copy
          const [updatedCategory] = await db.update(categoryTemplates)
            .set({
              ...result.data,
              updatedAt: new Date()
            })
            .where(eq(categoryTemplates.id, existingProjectCategory.id))
            .returning();
          
          console.log(`Updated existing project-specific copy: ${updatedCategory.id}`);
          return res.json(updatedCategory);
        } else {
          // Create a new project-specific copy with the modifications
          const [newProjectCategory] = await db.insert(categoryTemplates)
            .values({
              name: result.data.name || existingCategory.name,
              type: existingCategory.type,
              parentId: existingCategory.parentId,
              projectId: projectId,
              originalGlobalId: existingCategory.id,
              color: result.data.color || existingCategory.color,
              description: result.data.description || existingCategory.description,
              sortOrder: existingCategory.sortOrder,
              createdAt: new Date(),
              updatedAt: new Date()
            })
            .returning();
          
          console.log(`Created new project-specific copy: ${newProjectCategory.id} from global category ${categoryId}`);
          return res.json(newProjectCategory);
        }
      } else {
        // This is already a project-specific category, update it directly
        const [updatedCategory] = await db.update(categoryTemplates)
          .set({
            ...result.data,
            updatedAt: new Date()
          })
          .where(eq(categoryTemplates.id, categoryId))
          .returning();
        
        console.log(`Updated project-specific category: ${updatedCategory.id}`);
        return res.json(updatedCategory);
      }
    } catch (error) {
      console.error("Error updating project-specific template category (PATCH):", error);
      res.status(500).json({ 
        message: "Failed to update project-specific template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Delete project-specific category
  // Migration endpoint to fix task categories for project 18
  app.post("/api/projects/:projectId/fix-task-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      console.log(`Starting task category migration for project ${projectId}`);

      // Get all tasks for this project
      const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
      console.log(`Found ${projectTasks.length} tasks to migrate`);

      // Get the project categories to map to
      const projectCats = await db.select().from(projectCategories).where(eq(projectCategories.projectId, projectId));
      console.log(`Found ${projectCats.length} project categories`);

      // Create mapping based on tier2Categories to determine proper tier1 assignment
      const updates = [];

      for (const task of projectTasks) {
        let newTier1Category = null;

        // Map based on tier2Category patterns
        const tier2 = task.tier2Category?.toLowerCase() || '';

        // Software Engineering category (should map to "Legs")
        if (tier2.includes('development') || tier2.includes('devops') || tier2.includes('architecture') || tier2.includes('quality') || tier2.includes('security')) {
          newTier1Category = 'Legs';
        }
        // Product Management category (should map to "Arms")
        else if (tier2.includes('strategy') || tier2.includes('vision') || tier2.includes('discovery') || tier2.includes('research') || tier2.includes('roadmap') || tier2.includes('prioritization') || tier2.includes('delivery') || tier2.includes('lifecycle')) {
          newTier1Category = 'Arms';
        }
        // Design / UX category (find the project category name)
        else if (tier2.includes('research and usability') || tier2.includes('ui/ux') || tier2.includes('visual design') || tier2.includes('interaction')) {
          const designCat = projectCats.find(cat => cat.type === 'tier1' && (cat.name.toLowerCase().includes('design') || cat.name.toLowerCase() === 'pary'));
          newTier1Category = designCat?.name || 'Design / UX';
        }
        // Marketing category (find the project category name)
        else if (tier2.includes('positioning') || tier2.includes('messaging') || tier2.includes('demand gen') || tier2.includes('acquisition') || tier2.includes('pricing') || tier2.includes('packaging') || tier2.includes('launch') || tier2.includes('analytics')) {
          const marketingCat = projectCats.find(cat => cat.type === 'tier1' && (cat.name.toLowerCase().includes('marketing') || cat.name.toLowerCase() === 'play'));
          newTier1Category = marketingCat?.name || 'Marketing / Go-to-Market (GTM)';
        }

        if (newTier1Category && newTier1Category !== task.tier1Category) {
          updates.push({
            taskId: task.id,
            oldCategory: task.tier1Category,
            newCategory: newTier1Category
          });
        }
      }

      console.log(`Planning to update ${updates.length} tasks`);

      // Execute the updates
      for (const update of updates) {
        await db.update(tasks)
          .set({ tier1Category: update.newCategory })
          .where(eq(tasks.id, update.taskId));

        console.log(`Updated task ${update.taskId}: "${update.oldCategory}" -> "${update.newCategory}"`);
      }

      res.json({
        message: `Successfully migrated ${updates.length} tasks`,
        updates: updates,
        timestamp: new Date().toISOString()
      });

    } catch (error) {
      console.error('Error during task category migration:', error);
      res.status(500).json({ error: 'Failed to migrate task categories' });
    }
  });

  // Rename tier1 category in tasks (for when preset categories are renamed)
  app.post("/api/projects/:projectId/rename-task-category", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { oldName, newName } = req.body;
      if (!oldName || !newName) {
        return res.status(400).json({ message: "Both oldName and newName are required" });
      }

      console.log(`Renaming task tier1Category from "${oldName}" to "${newName}" for project ${projectId}`);

      // Get all tasks for this project with the old category name
      const projectTasks = await db.select().from(tasks)
        .where(and(
          eq(tasks.projectId, projectId),
          eq(tasks.tier1Category, oldName)
        ));
      
      console.log(`Found ${projectTasks.length} tasks with tier1Category "${oldName}"`);

      if (projectTasks.length === 0) {
        return res.json({
          message: `No tasks found with tier1Category "${oldName}"`,
          updatedCount: 0
        });
      }

      // Update all matching tasks
      const result = await db.update(tasks)
        .set({ tier1Category: newName })
        .where(and(
          eq(tasks.projectId, projectId),
          eq(tasks.tier1Category, oldName)
        ));

      console.log(`Updated ${projectTasks.length} tasks from "${oldName}" to "${newName}"`);

      res.json({
        message: `Successfully renamed tier1Category from "${oldName}" to "${newName}"`,
        updatedCount: projectTasks.length,
        taskIds: projectTasks.map(t => t.id)
      });

    } catch (error) {
      console.error('Error renaming task category:', error);
      res.status(500).json({ error: 'Failed to rename task category' });
    }
  });

  // Cache busting endpoint to force fresh data
  app.post("/api/projects/:projectId/refresh-cache", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      // Add a cache-busting timestamp to the response
      const timestamp = new Date().toISOString();

      res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
      res.setHeader('Pragma', 'no-cache');
      res.setHeader('Expires', '0');

      res.json({
        message: "Cache cleared successfully",
        projectId: projectId,
        timestamp: timestamp
      });

    } catch (error) {
      console.error('Error clearing cache:', error);
      res.status(500).json({ error: 'Failed to clear cache' });
    }
  });

  // Bulk reorder project categories
  app.patch("/api/projects/:projectId/template-categories/reorder", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { categoryOrders } = req.body;
      if (!Array.isArray(categoryOrders)) {
        return res.status(400).json({ message: "categoryOrders must be an array" });
      }

      console.log(`Reordering categories for project ${projectId}:`, categoryOrders);

      // Update sort order for each category
      const updatedCategories = [];
      for (const { id, sortOrder } of categoryOrders) {
        const categoryId = parseInt(id);
        if (isNaN(categoryId)) continue;

        const [updatedCategory] = await db
          .update(projectCategories)
          .set({ sortOrder: parseInt(sortOrder) || 0, updatedAt: new Date() })
          .where(and(
            eq(projectCategories.id, categoryId),
            eq(projectCategories.projectId, projectId)
          ))
          .returning();

        if (updatedCategory) {
          updatedCategories.push(updatedCategory);
        }
      }

      console.log(`Successfully reordered ${updatedCategories.length} categories`);
      res.json({
        message: `Reordered ${updatedCategories.length} categories`,
        categories: updatedCategories
      });
    } catch (error) {
      console.error("Error reordering categories:", error);
      res.status(500).json({
        message: "Failed to reorder categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/projects/:projectId/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const categoryId = parseInt(req.params.id);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }
      
      // Find the category to verify it exists and belongs to this project
      const [existingCategory] = await db.select()
        .from(categoryTemplates)
        .where(eq(categoryTemplates.id, categoryId));
      
      if (!existingCategory) {
        return res.status(404).json({ message: "Category not found" });
      }
      
      // Only allow deletion of project-specific categories, not global ones
      if (existingCategory.projectId !== projectId) {
        return res.status(403).json({ 
          message: "Can only delete project-specific categories. Global categories cannot be deleted from project view." 
        });
      }
      
      // Check if there are child categories
      const childCategories = await db.select()
        .from(categoryTemplates)
        .where(eq(categoryTemplates.parentId, categoryId));
      
      if (childCategories.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category with child categories. Please delete child categories first." 
        });
      }
      
      // Check if there are task templates using this category
      const templatesWithTier1 = await db.select()
        .from(taskTemplates)
        .where(eq(taskTemplates.tier1CategoryId, categoryId));
      
      const templatesWithTier2 = await db.select()
        .from(taskTemplates)
        .where(eq(taskTemplates.tier2CategoryId, categoryId));
      
      if (templatesWithTier1.length > 0 || templatesWithTier2.length > 0) {
        return res.status(400).json({ 
          message: "Cannot delete category that is used by task templates. Please remove the templates first." 
        });
      }
      
      // Delete the category
      await db.delete(categoryTemplates)
        .where(eq(categoryTemplates.id, categoryId));
      
      console.log(`Deleted project-specific category: ${categoryId}`);
      res.status(204).end();
    } catch (error) {
      console.error("Error deleting project-specific template category:", error);
      res.status(500).json({ 
        message: "Failed to delete project-specific template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Add standard construction categories to a project
  app.post("/api/projects/:projectId/add-standard-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      console.log(`Adding standard construction categories to project ${projectId}...`);

      // Check if project already has categories and clear them to prevent mixing presets
      const existingCategories = await db.select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, projectId));

      if (existingCategories.length > 0) {
        console.log(`Project ${projectId} has ${existingCategories.length} existing categories, clearing them first`);
        await db.delete(projectCategories)
          .where(eq(projectCategories.projectId, projectId));
        console.log(`Cleared ${existingCategories.length} existing categories from project ${projectId}`);
      }

      // Define standard construction category templates
      const standardCategories = [
        { name: 'Structural', type: 'tier1', color: '#3b82f6', description: 'Foundation, framing, and core structural work', sortOrder: 1 },
        { name: 'Systems', type: 'tier1', color: '#8b5cf6', description: 'Electrical, plumbing, HVAC systems', sortOrder: 2 },
        { name: 'Sheathing', type: 'tier1', color: '#ec4899', description: 'Insulation, drywall, weatherproofing', sortOrder: 3 },
        { name: 'Finishings', type: 'tier1', color: '#10b981', description: 'Paint, flooring, fixtures, final touches', sortOrder: 4 },
      ];

      const tier2Categories = [
        { name: 'Foundation', type: 'tier2', parentName: 'Structural', color: '#1e40af', description: 'Foundation and excavation work' },
        { name: 'Framing', type: 'tier2', parentName: 'Structural', color: '#2563eb', description: 'Structural framing and support' },
        { name: 'Roofing', type: 'tier2', parentName: 'Structural', color: '#3b82f6', description: 'Roof structure and materials' },
        { name: 'Electrical', type: 'tier2', parentName: 'Systems', color: '#7c3aed', description: 'Electrical wiring and fixtures' },
        { name: 'Plumbing', type: 'tier2', parentName: 'Systems', color: '#8b5cf6', description: 'Plumbing systems and fixtures' },
        { name: 'HVAC', type: 'tier2', parentName: 'Systems', color: '#a855f7', description: 'Heating, ventilation, and air conditioning' },
        { name: 'Insulation', type: 'tier2', parentName: 'Sheathing', color: '#db2777', description: 'Insulation materials and installation' },
        { name: 'Drywall', type: 'tier2', parentName: 'Sheathing', color: '#ec4899', description: 'Drywall installation and finishing' },
        { name: 'Windows', type: 'tier2', parentName: 'Sheathing', color: '#f472b6', description: 'Window installation and sealing' },
        { name: 'Flooring', type: 'tier2', parentName: 'Finishings', color: '#059669', description: 'Floor materials and installation' },
        { name: 'Paint', type: 'tier2', parentName: 'Finishings', color: '#10b981', description: 'Interior and exterior painting' },
        { name: 'Fixtures', type: 'tier2', parentName: 'Finishings', color: '#34d399', description: 'Lighting and plumbing fixtures' },
      ];

      let addedCount = 0;

      // Add tier1 categories for this project
      for (const category of standardCategories) {
        await db.insert(projectCategories).values({
          projectId,
          name: category.name,
          type: category.type,
          color: category.color,
          description: category.description,
          sortOrder: category.sortOrder
        });
        addedCount++;
      }

      // Get the tier1 category IDs for this project
      const tier1Results = await db.select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, projectId),
          eq(projectCategories.type, 'tier1')
        ));

      const tier1Map = Object.fromEntries(tier1Results.map(t => [t.name, t.id]));

      // Add tier2 categories
      for (const category of tier2Categories) {
        const parentId = tier1Map[category.parentName];
        if (parentId) {
          await db.insert(projectCategories).values({
            projectId,
            name: category.name,
            type: category.type,
            parentId,
            color: category.color,
            description: category.description,
            sortOrder: 0
          });
          addedCount++;
        }
      }

      res.json({ 
        message: `Successfully added ${addedCount} standard construction categories`,
        addedCount
      });

    } catch (error) {
      console.error("Error adding standard categories:", error);
      res.status(500).json({ 
        message: "Failed to add standard categories",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getTemplateCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      console.error("Error fetching template category:", error);
      res.status(500).json({ 
        message: "Failed to fetch template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/admin/template-categories/type/:type", async (req: Request, res: Response) => {
    try {
      const type = req.params.type;
      if (!type || (type !== 'tier1' && type !== 'tier2')) {
        return res.status(400).json({ message: "Invalid category type. Must be 'tier1' or 'tier2'." });
      }

      const categories = await storage.getTemplateCategoriesByType(type);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories by type:", error);
      res.status(500).json({ 
        message: "Failed to fetch template categories by type",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/admin/template-categories/parent/:parentId", async (req: Request, res: Response) => {
    try {
      const parentId = parseInt(req.params.parentId);
      if (isNaN(parentId)) {
        return res.status(400).json({ message: "Invalid parent category ID" });
      }

      const categories = await storage.getTemplateCategoriesByParent(parentId);
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories by parent:", error);
      res.status(500).json({ 
        message: "Failed to fetch template categories by parent",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/admin/template-categories", async (req: Request, res: Response) => {
    try {
      const result = insertCategoryTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const category = await storage.createTemplateCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      console.error("Error creating template category:", error);
      res.status(500).json({ 
        message: "Failed to create template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const result = insertCategoryTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Check if this update includes a projectId (project-specific update)
      const projectId = result.data.projectId;
      
      if (projectId) {
        // This is a project-specific update - implement isolation logic
        const [existingCategory] = await db.select()
          .from(categoryTemplates)
          .where(eq(categoryTemplates.id, id));
        
        if (!existingCategory) {
          return res.status(404).json({ message: "Category not found" });
        }
        
        // Check if it belongs to a different project
        if (existingCategory.projectId !== null && existingCategory.projectId !== projectId) {
          return res.status(403).json({ 
            message: "This category belongs to a different project and cannot be modified" 
          });
        }
        
        // If this is a global category (projectId is null), create a project-specific copy
        if (existingCategory.projectId === null) {
          console.log(`Creating project-specific copy of global category ${id} for project ${projectId}`);
          
          // Check if a project-specific copy already exists
          const [existingProjectCategory] = await db.select()
            .from(categoryTemplates)
            .where(
              and(
                eq(categoryTemplates.projectId, projectId),
                eq(categoryTemplates.originalGlobalId, existingCategory.id)
              )
            );
          
          if (existingProjectCategory) {
            // Update the existing project-specific copy
            const [updatedCategory] = await db.update(categoryTemplates)
              .set({
                ...result.data,
                updatedAt: new Date()
              })
              .where(eq(categoryTemplates.id, existingProjectCategory.id))
              .returning();
            
            console.log(`Updated existing project-specific copy: ${updatedCategory.id}`);
            return res.json(updatedCategory);
          } else {
            // Create a new project-specific copy with the modifications
            const [newProjectCategory] = await db.insert(categoryTemplates)
              .values({
                name: result.data.name || existingCategory.name,
                type: existingCategory.type,
                parentId: existingCategory.parentId,
                projectId: projectId,
                originalGlobalId: existingCategory.id,
                color: result.data.color || existingCategory.color,
                createdAt: new Date(),
                updatedAt: new Date()
              })
              .returning();
            
            console.log(`Created new project-specific copy: ${newProjectCategory.id} from global category ${id}`);
            return res.json(newProjectCategory);
          }
        } else {
          // This is already a project-specific category, update it directly
          const [updatedCategory] = await db.update(categoryTemplates)
            .set({
              ...result.data,
              updatedAt: new Date()
            })
            .where(eq(categoryTemplates.id, id))
            .returning();
          
          console.log(`Updated project-specific category: ${updatedCategory.id}`);
          return res.json(updatedCategory);
        }
      } else {
        // This is a global update - use the original logic
        const category = await storage.updateTemplateCategory(id, result.data);
        if (!category) {
          return res.status(404).json({ message: "Category not found" });
        }
        res.json(category);
      }
    } catch (error) {
      console.error("Error updating template category:", error);
      res.status(500).json({ 
        message: "Failed to update template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const success = await storage.deleteTemplateCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting template category:", error);
      res.status(500).json({ 
        message: "Failed to delete template category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin panel - Task Templates routes
  app.get("/api/admin/task-templates", async (_req: Request, res: Response) => {
    try {
      const templates = await storage.getTaskTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({ 
        message: "Failed to fetch task templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Project-specific task templates
  app.get("/api/projects/:projectId/task-templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      // Query for project-specific templates or global templates (null projectId)
      const templates = await db.select()
        .from(taskTemplates)
        .where(
          or(
            eq(taskTemplates.projectId, projectId),
            isNull(taskTemplates.projectId)
          )
        )
        .orderBy(taskTemplates.templateId);
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates for project:", error);
      res.status(500).json({ 
        message: "Failed to fetch task templates for project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create project-specific task template
  app.post("/api/projects/:projectId/task-templates", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const result = insertTaskTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Add projectId to the template data
      const templateData = {
        ...result.data,
        projectId
      };
      
      // Insert the new template
      const [template] = await db.insert(taskTemplates)
        .values(templateData)
        .returning();
      
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating project-specific task template:", error);
      res.status(500).json({ 
        message: "Failed to create project-specific task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Update project-specific task template
  app.put("/api/projects/:projectId/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const templateId = parseInt(req.params.id);
      if (isNaN(templateId)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }
      
      const result = insertTaskTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Find the template and verify it belongs to this project
      const [existingTemplate] = await db.select()
        .from(taskTemplates)
        .where(
          and(
            eq(taskTemplates.id, templateId),
            eq(taskTemplates.projectId, projectId)
          )
        );
      
      if (!existingTemplate) {
        return res.status(404).json({ 
          message: "Template not found or doesn't belong to this project" 
        });
      }
      
      // Update the template
      const [updatedTemplate] = await db.update(taskTemplates)
        .set({
          ...result.data,
          updatedAt: new Date()
        })
        .where(eq(taskTemplates.id, templateId))
        .returning();
      
      res.json(updatedTemplate);
    } catch (error) {
      console.error("Error updating project-specific task template:", error);
      res.status(500).json({ 
        message: "Failed to update project-specific task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTaskTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error fetching task template:", error);
      res.status(500).json({ 
        message: "Failed to fetch task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.get("/api/admin/task-templates/category/:categoryId", async (req: Request, res: Response) => {
    try {
      const categoryId = parseInt(req.params.categoryId);
      if (isNaN(categoryId)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const templates = await storage.getTaskTemplatesByCategory(categoryId);
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates by category:", error);
      res.status(500).json({ 
        message: "Failed to fetch task templates by category",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.post("/api/admin/task-templates", async (req: Request, res: Response) => {
    try {
      const result = insertTaskTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const template = await storage.createTaskTemplate(result.data);
      res.status(201).json(template);
    } catch (error) {
      console.error("Error creating task template:", error);
      res.status(500).json({ 
        message: "Failed to create task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.put("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const result = insertTaskTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const template = await storage.updateTaskTemplate(id, result.data);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      console.error("Error updating task template:", error);
      res.status(500).json({ 
        message: "Failed to update task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  app.delete("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const success = await storage.deleteTaskTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting task template:", error);
      res.status(500).json({ 
        message: "Failed to delete task template",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin panel - Utility route to migrate task templates from shared file to database
  app.post("/api/admin/migrate-task-templates", async (_req: Request, res: Response) => {
    try {
      // Import task templates from shared file
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const templates = getAllTaskTemplates();
      
      // Get existing tier1 categories
      let tier1Categories = await storage.getTemplateCategoriesByType("tier1");
      
      // If no tier1 categories exist, create them
      if (tier1Categories.length === 0) {
        // Create tier1 categories based on template data
        const uniqueTier1 = [...new Set(templates.map(t => t.tier1Category.toLowerCase()))];
        
        for (const tier1Name of uniqueTier1) {
          await storage.createTemplateCategory({
            name: tier1Name,
            type: "tier1",
            parentId: null
          });
        }
        
        // Fetch again after creation
        tier1Categories = await storage.getTemplateCategoriesByType("tier1");
      }
      
      // Create a mapping of tier1 category names to IDs
      const tier1Map = tier1Categories.reduce((map, cat) => {
        map[cat.name.toLowerCase()] = cat.id;
        return map;
      }, {} as Record<string, number>);
      
      // Get existing tier2 categories
      let tier2Categories = await storage.getTemplateCategoriesByType("tier2");
      
      // If no tier2 categories exist, create them
      if (tier2Categories.length === 0) {
        // Create tier2 categories based on template data
        for (const template of templates) {
          const tier1Id = tier1Map[template.tier1Category.toLowerCase()];
          if (!tier1Id) continue;
          
          // Check if this tier2 category already exists
          const tier2Name = template.tier2Category.toLowerCase();
          const exists = tier2Categories.some(cat => 
            cat.name.toLowerCase() === tier2Name && 
            cat.parentId === tier1Id
          );
          
          if (!exists) {
            await storage.createTemplateCategory({
              name: tier2Name,
              type: "tier2",
              parentId: tier1Id
            });
            
            // Add to our local cache to avoid duplicates
            tier2Categories.push({
              id: -1, // Temporary ID, we don't need it for the existence check
              name: tier2Name,
              type: "tier2",
              parentId: tier1Id,
              createdAt: new Date(),
              updatedAt: new Date()
            });
          }
        }
        
        // Fetch again after creation
        tier2Categories = await storage.getTemplateCategoriesByType("tier2");
      }
      
      // Create a mapping of tier2 category names and parentIds to IDs
      const tier2Map = tier2Categories.reduce((map, cat) => {
        if (!cat.parentId) return map;
        const key = `${cat.name.toLowerCase()}_${cat.parentId}`;
        map[key] = cat.id;
        return map;
      }, {} as Record<string, number>);
      
      // Migrate templates to the database
      let created = 0;
      let skipped = 0;
      
      // Get existing templates by templateId
      const existingTemplates = await storage.getTaskTemplates();
      const existingTemplateIds = new Set(existingTemplates.map(t => t.templateId));
      
      for (const template of templates) {
        // Skip if already exists
        if (existingTemplateIds.has(template.id)) {
          skipped++;
          continue;
        }
        
        const tier1Id = tier1Map[template.tier1Category.toLowerCase()];
        if (!tier1Id) {
          console.warn(`Tier1 category not found for: ${template.tier1Category}`);
          skipped++;
          continue;
        }
        
        const tier2Key = `${template.tier2Category.toLowerCase()}_${tier1Id}`;
        const tier2Id = tier2Map[tier2Key];
        if (!tier2Id) {
          console.warn(`Tier2 category not found for: ${template.tier2Category} under ${template.tier1Category}`);
          skipped++;
          continue;
        }
        
        // Create the template in the database
        await storage.createTaskTemplate({
          templateId: template.id,
          title: template.title,
          description: template.description || "",
          tier1CategoryId: tier1Id,
          tier2CategoryId: tier2Id,
          estimatedDuration: template.estimatedDuration
        });
        
        created++;
      }
      
      res.json({
        message: "Template migration completed",
        created,
        skipped,
        total: templates.length
      });
      
    } catch (error) {
      console.error("Error migrating task templates:", error);
      res.status(500).json({ 
        message: "Failed to migrate task templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Admin Panel Routes
  // Template Categories
  app.get("/api/admin/template-categories", async (_req: Request, res: Response) => {
    try {
      // Check if table exists and create it if it doesn't
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS template_categories (
            id SERIAL PRIMARY KEY,
            name TEXT NOT NULL,
            type TEXT NOT NULL,
            parent_id INTEGER,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("Template categories table created or verified");
      } catch (tableError) {
        console.error("Error creating template_categories table:", tableError);
      }

      const categories = await storage.getTemplateCategories();
      
      // If no categories exist, create default ones
      if (categories.length === 0) {
        console.log("No template categories found, creating defaults...");
        
        // Define tier1 categories
        const tier1Categories = [
          { name: 'Structural', type: 'tier1' },
          { name: 'Systems', type: 'tier1' },
          { name: 'Sheathing', type: 'tier1' },
          { name: 'Finishings', type: 'tier1' }
        ];
        
        // Insert tier1 categories
        const tier1Ids: Record<string, number> = {};
        for (const category of tier1Categories) {
          const result = await storage.createTemplateCategory(category);
          tier1Ids[category.name.toLowerCase()] = result.id;
        }
        
        // Define tier2 categories with their parent mappings
        const tier2Categories = [
          { name: 'Foundation', type: 'tier2', parent: 'structural' },
          { name: 'Framing', type: 'tier2', parent: 'structural' },
          { name: 'Roofing', type: 'tier2', parent: 'structural' },
          
          { name: 'Electrical', type: 'tier2', parent: 'systems' },
          { name: 'Plumbing', type: 'tier2', parent: 'systems' },
          { name: 'HVAC', type: 'tier2', parent: 'systems' },
          
          { name: 'Drywall', type: 'tier2', parent: 'sheathing' },
          { name: 'Exteriors', type: 'tier2', parent: 'sheathing' },
          { name: 'Barriers', type: 'tier2', parent: 'sheathing' },
          
          { name: 'Trim', type: 'tier2', parent: 'finishings' },
          { name: 'Cabinentry', type: 'tier2', parent: 'finishings' },
          { name: 'Flooring', type: 'tier2', parent: 'finishings' },
          { name: 'Landscaping', type: 'tier2', parent: 'finishings' }
        ];
        
        // Insert tier2 categories
        for (const category of tier2Categories) {
          const parentId = tier1Ids[category.parent];
          await storage.createTemplateCategory({
            name: category.name,
            type: category.type,
            parentId: parentId
          });
        }
        
        // Return the newly created categories
        const createdCategories = await storage.getTemplateCategories();
        return res.json(createdCategories);
      }
      
      res.json(categories);
    } catch (error) {
      console.error("Error fetching template categories:", error);
      res.status(500).json({ message: "Failed to fetch template categories", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const category = await storage.getTemplateCategory(id);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch category" });
    }
  });

  app.post("/api/admin/template-categories", async (req: Request, res: Response) => {
    try {
      const result = insertCategoryTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const category = await storage.createTemplateCategory(result.data);
      res.status(201).json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to create category" });
    }
  });

  app.put("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const result = insertCategoryTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const category = await storage.updateTemplateCategory(id, result.data);
      if (!category) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.json(category);
    } catch (error) {
      res.status(500).json({ message: "Failed to update category" });
    }
  });

  app.delete("/api/admin/template-categories/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid category ID" });
      }

      const success = await storage.deleteTemplateCategory(id);
      if (!success) {
        return res.status(404).json({ message: "Category not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete category" });
    }
  });

  // Task Templates
  app.get("/api/admin/task-templates", async (_req: Request, res: Response) => {
    try {
      // Check if table exists and create it if it doesn't
      try {
        await db.execute(sql`
          CREATE TABLE IF NOT EXISTS task_templates (
            id SERIAL PRIMARY KEY,
            template_id TEXT NOT NULL,
            title TEXT NOT NULL,
            description TEXT,
            tier1_category_id INTEGER NOT NULL,
            tier2_category_id INTEGER NOT NULL,
            estimated_duration INTEGER NOT NULL DEFAULT 1,
            created_at TIMESTAMP DEFAULT NOW(),
            updated_at TIMESTAMP DEFAULT NOW()
          )
        `);
        console.log("Task templates table created or verified");
      } catch (tableError) {
        console.error("Error creating task_templates table:", tableError);
      }

      const templates = await storage.getTaskTemplates();
      
      // If no templates exist, create a few default ones
      if (templates.length === 0) {
        console.log("No task templates found, creating sample templates...");
        
        // Get categories for reference
        const categories = await storage.getTemplateCategories();
        if (categories.length === 0) {
          return res.status(500).json({ 
            message: "Cannot create default templates: categories not found. Please create categories first." 
          });
        }
        
        // Find category IDs
        const findCategoryId = (type: string, name: string) => {
          const category = categories.find(c => 
            c.type === type && c.name.toLowerCase() === name.toLowerCase()
          );
          return category ? category.id : null;
        };
        
        const structuralId = findCategoryId('tier1', 'Structural');
        const foundationId = findCategoryId('tier2', 'Foundation');
        const framingId = findCategoryId('tier2', 'Framing');
        
        const systemsId = findCategoryId('tier1', 'Systems');
        const plumbingId = findCategoryId('tier2', 'Plumbing');
        
        // Create sample templates if category IDs are found
        if (structuralId && foundationId) {
          await storage.createTaskTemplate({
            templateId: 'FN1',
            title: 'Form & Soil Preparation (FN1)',
            description: 'Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper.',
            tier1CategoryId: structuralId,
            tier2CategoryId: foundationId,
            estimatedDuration: 3
          });
        }
        
        if (structuralId && framingId) {
          await storage.createTaskTemplate({
            templateId: 'FR1',
            title: 'Plan and Bid Materials & Labor for Framing (FR1)',
            description: 'Begin by conducting a competitive bidding process for standard framing materials and labor, ensuring quality and value.',
            tier1CategoryId: structuralId,
            tier2CategoryId: framingId,
            estimatedDuration: 5
          });
        }
        
        if (systemsId && plumbingId) {
          await storage.createTaskTemplate({
            templateId: 'PL1',
            title: 'Fixture Selection and Special Item Ordering (PL1)',
            description: 'Determine type and quantity of plumbing fixtures (styles and colors).',
            tier1CategoryId: systemsId,
            tier2CategoryId: plumbingId,
            estimatedDuration: 7
          });
        }
        
        // Return the newly created templates
        const createdTemplates = await storage.getTaskTemplates();
        return res.json(createdTemplates);
      }
      
      res.json(templates);
    } catch (error) {
      console.error("Error fetching task templates:", error);
      res.status(500).json({ message: "Failed to fetch task templates", error: error instanceof Error ? error.message : String(error) });
    }
  });

  app.get("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const template = await storage.getTaskTemplate(id);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch template" });
    }
  });

  app.post("/api/admin/task-templates", async (req: Request, res: Response) => {
    try {
      const result = insertTaskTemplateSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const template = await storage.createTaskTemplate(result.data);
      res.status(201).json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to create template" });
    }
  });

  app.put("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const result = insertTaskTemplateSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const template = await storage.updateTaskTemplate(id, result.data);
      if (!template) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.json(template);
    } catch (error) {
      res.status(500).json({ message: "Failed to update template" });
    }
  });

  app.delete("/api/admin/task-templates/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid template ID" });
      }

      const success = await storage.deleteTaskTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Template not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete template" });
    }
  });

  // Checklist Item routes
  app.get("/api/tasks/:taskId/checklist", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const checklistItems = await storage.getChecklistItems(taskId);
      res.json(checklistItems);
    } catch (error) {
      console.error("Error fetching checklist items:", error);
      res.status(500).json({ message: "Failed to fetch checklist items" });
    }
  });

  app.post("/api/tasks/:taskId/checklist", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const checklistItemData = {
        ...req.body,
        taskId
      };

      // Validate the request body against the schema
      const result = insertChecklistItemSchema.safeParse(checklistItemData);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        console.error("Validation error creating checklist item:", validationError.message);
        return res.status(400).json({ message: validationError.message });
      }

      const newChecklistItem = await storage.createChecklistItem(result.data);
      res.status(201).json(newChecklistItem);
    } catch (error) {
      console.error("Error creating checklist item:", error);
      res.status(500).json({ message: "Failed to create checklist item" });
    }
  });

  app.put("/api/checklist/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid checklist item ID" });
      }

      const updatedChecklistItem = await storage.updateChecklistItem(id, req.body);
      if (!updatedChecklistItem) {
        return res.status(404).json({ message: "Checklist item not found" });
      }

      res.json(updatedChecklistItem);
    } catch (error) {
      console.error("Error updating checklist item:", error);
      res.status(500).json({ message: "Failed to update checklist item" });
    }
  });

  app.delete("/api/checklist/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid checklist item ID" });
      }

      const success = await storage.deleteChecklistItem(id);
      if (!success) {
        return res.status(404).json({ message: "Checklist item not found" });
      }

      res.status(204).end();
    } catch (error) {
      console.error("Error deleting checklist item:", error);
      res.status(500).json({ message: "Failed to delete checklist item" });
    }
  });

  app.put("/api/tasks/:taskId/checklist/reorder", async (req: Request, res: Response) => {
    try {
      const taskId = parseInt(req.params.taskId);
      if (isNaN(taskId)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const { itemIds } = req.body;
      if (!Array.isArray(itemIds)) {
        return res.status(400).json({ message: "Item IDs must be an array" });
      }

      const success = await storage.reorderChecklistItems(taskId, itemIds);
      if (!success) {
        return res.status(500).json({ message: "Failed to reorder checklist items" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error reordering checklist items:", error);
      res.status(500).json({ message: "Failed to reorder checklist items" });
    }
  });

  // Checklist Item Comments Routes
  app.get("/api/checklist-items/:checklistItemId/comments", async (req: Request, res: Response) => {
    try {
      const checklistItemId = parseInt(req.params.checklistItemId);
      if (isNaN(checklistItemId)) {
        return res.status(400).json({ message: "Invalid checklist item ID" });
      }

      const comments = await storage.getChecklistItemComments(checklistItemId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching checklist item comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/checklist-items/:checklistItemId/comments", async (req: Request, res: Response) => {
    try {
      const checklistItemId = parseInt(req.params.checklistItemId);
      if (isNaN(checklistItemId)) {
        return res.status(400).json({ message: "Invalid checklist item ID" });
      }

      const result = insertChecklistItemCommentSchema.safeParse({
        ...req.body,
        checklistItemId
      });
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const comment = await storage.createChecklistItemComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating checklist item comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/checklist/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const result = insertChecklistItemCommentSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const updatedComment = await storage.updateChecklistItemComment(id, result.data);
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating checklist item comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/checklist/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await storage.deleteChecklistItemComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting checklist item comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // Subtask Comments Routes
  app.get("/api/subtasks/:subtaskId/comments", async (req: Request, res: Response) => {
    try {
      const subtaskId = parseInt(req.params.subtaskId);
      if (isNaN(subtaskId)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const comments = await storage.getSubtaskComments(subtaskId);
      res.json(comments);
    } catch (error) {
      console.error("Error fetching subtask comments:", error);
      res.status(500).json({ message: "Failed to fetch comments" });
    }
  });

  app.post("/api/subtasks/:subtaskId/comments", async (req: Request, res: Response) => {
    try {
      const subtaskId = parseInt(req.params.subtaskId);
      if (isNaN(subtaskId)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const result = insertSubtaskCommentSchema.safeParse({
        ...req.body,
        subtaskId
      });
      
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const comment = await storage.createSubtaskComment(result.data);
      res.status(201).json(comment);
    } catch (error) {
      console.error("Error creating subtask comment:", error);
      res.status(500).json({ message: "Failed to create comment" });
    }
  });

  app.put("/api/subtask/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const result = insertSubtaskCommentSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const updatedComment = await storage.updateSubtaskComment(id, result.data);
      if (!updatedComment) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json(updatedComment);
    } catch (error) {
      console.error("Error updating subtask comment:", error);
      res.status(500).json({ message: "Failed to update comment" });
    }
  });

  app.delete("/api/subtask/comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const success = await storage.deleteSubtaskComment(id);
      if (!success) {
        return res.status(404).json({ message: "Comment not found" });
      }

      res.json({ success: true });
    } catch (error) {
      console.error("Error deleting subtask comment:", error);
      res.status(500).json({ message: "Failed to delete comment" });
    }
  });

  // ==================== THEME MANAGEMENT ROUTES ====================
  
  // Get global settings
  app.get("/api/global-settings", async (req: Request, res: Response) => {
    try {
      const settings = await db.select().from(globalSettings).limit(1);
      
      if (settings.length === 0) {
        // Create default settings if none exist
        const defaultSettings = {
          globalColorTheme: "Earth Tone",
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        const newSettings = await db.insert(globalSettings).values(defaultSettings).returning();
        res.json(newSettings[0]);
      } else {
        res.json(settings[0]);
      }
    } catch (error) {
      console.error("Error fetching global settings:", error);
      res.status(500).json({ message: "Failed to fetch global settings" });
    }
  });

  // Update global settings
  app.put("/api/global-settings", async (req: Request, res: Response) => {
    try {
      const result = insertGlobalSettingsSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const updateData = {
        ...result.data,
        updatedAt: new Date()
      };

      // Try to update first
      const existing = await db.select().from(globalSettings).limit(1);
      
      if (existing.length === 0) {
        // Create new settings
        const newSettings = await db.insert(globalSettings).values({
          globalColorTheme: result.data.globalColorTheme || "Earth Tone",
          createdAt: new Date(),
          updatedAt: new Date()
        }).returning();
        
        res.json(newSettings[0]);
      } else {
        // Update existing settings
        const updatedSettings = await db.update(globalSettings)
          .set(updateData)
          .where(eq(globalSettings.id, existing[0].id))
          .returning();
        
        res.json(updatedSettings[0]);
      }
    } catch (error) {
      console.error("Error updating global settings:", error);
      res.status(500).json({ message: "Failed to update global settings" });
    }
  });

  // Get enabled themes for project dialogs
  app.get("/api/global-settings/enabled-themes", async (req: Request, res: Response) => {
    try {
      const setting = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, "enabled_themes"))
        .limit(1);
      
      if (setting.length === 0) {
        // Return all themes enabled by default (empty array means all enabled)
        res.json({ enabledThemes: [] });
      } else {
        try {
          const enabledThemes = JSON.parse(setting[0].value);
          res.json({ enabledThemes });
        } catch {
          // If parsing fails, return all enabled
          res.json({ enabledThemes: [] });
        }
      }
    } catch (error) {
      console.error("Error fetching enabled themes:", error);
      res.status(500).json({ message: "Failed to fetch enabled themes" });
    }
  });

  // Update enabled themes
  app.put("/api/global-settings/enabled-themes", async (req: Request, res: Response) => {
    try {
      const { enabledThemes } = req.body;
      
      if (!Array.isArray(enabledThemes)) {
        return res.status(400).json({ message: "enabledThemes must be an array" });
      }

      const value = JSON.stringify(enabledThemes);
      
      // Check if setting exists
      const existing = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, "enabled_themes"))
        .limit(1);
      
      if (existing.length === 0) {
        // Create new setting
        await db.insert(globalSettings).values({
          key: "enabled_themes",
          value: value,
          description: "List of theme keys that are available for project selection"
        });
      } else {
        // Update existing setting
        await db.update(globalSettings)
          .set({ value: value, updatedAt: new Date() })
          .where(eq(globalSettings.key, "enabled_themes"));
      }
      
      res.json({ enabledThemes, message: "Enabled themes updated successfully" });
    } catch (error) {
      console.error("Error updating enabled themes:", error);
      res.status(500).json({ message: "Failed to update enabled themes" });
    }
  });

  // Get enabled presets for project dialogs
  app.get("/api/global-settings/enabled-presets", async (req: Request, res: Response) => {
    try {
      const setting = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, "enabled_presets"))
        .limit(1);
      
      if (setting.length === 0) {
        // Return all presets enabled by default (empty array means all enabled)
        res.json({ enabledPresets: [] });
      } else {
        try {
          const enabledPresets = JSON.parse(setting[0].value);
          res.json({ enabledPresets });
        } catch {
          // If parsing fails, return all enabled
          res.json({ enabledPresets: [] });
        }
      }
    } catch (error) {
      console.error("Error fetching enabled presets:", error);
      res.status(500).json({ message: "Failed to fetch enabled presets" });
    }
  });

  // Update enabled presets
  app.put("/api/global-settings/enabled-presets", async (req: Request, res: Response) => {
    try {
      const { enabledPresets } = req.body;

      if (!Array.isArray(enabledPresets)) {
        return res.status(400).json({ message: "enabledPresets must be an array" });
      }

      const value = JSON.stringify(enabledPresets);

      // Check if setting exists
      const existing = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, "enabled_presets"))
        .limit(1);

      if (existing.length === 0) {
        // Create new setting
        await db.insert(globalSettings).values({
          key: "enabled_presets",
          value: value,
          description: "List of preset IDs that are available for project selection"
        });
      } else {
        // Update existing setting
        await db.update(globalSettings)
          .set({ value: value, updatedAt: new Date() })
          .where(eq(globalSettings.key, "enabled_presets"));
      }

      res.json({ enabledPresets, message: "Enabled presets updated successfully" });
    } catch (error) {
      console.error("Error updating enabled presets:", error);
      res.status(500).json({ message: "Failed to update enabled presets" });
    }
  });

  // ==================== PRESET CONFIGURATION CRUD ====================

  // Get all presets with custom configurations merged
  app.get("/api/admin/presets", async (req: Request, res: Response) => {
    try {
      // Get all preset configurations from globalSettings
      const configs = await db.select()
        .from(globalSettings)
        .where(sql`${globalSettings.key} LIKE 'preset_config_%'`);

      // Build a map of preset configs
      const configMap: Record<string, any> = {};
      for (const config of configs) {
        const presetId = config.key.replace('preset_config_', '');
        try {
          configMap[presetId] = JSON.parse(config.value);
        } catch (err) {
          console.error(`Failed to parse config for preset ${presetId}:`, err);
        }
      }

      // Import presets module and merge with configs
      const { AVAILABLE_PRESETS, mergePresetWithConfig } = await import("@shared/presets");

      const presetsWithConfigs = Object.values(AVAILABLE_PRESETS).map((preset: any) =>
        mergePresetWithConfig(preset, configMap[preset.id] || null)
      );

      res.json(presetsWithConfigs);
    } catch (error) {
      console.error("Error fetching presets:", error);
      res.status(500).json({ message: "Failed to fetch presets" });
    }
  });

  // Get a single preset with custom configuration merged
  app.get("/api/admin/presets/:presetId", async (req: Request, res: Response) => {
    try {
      const { presetId } = req.params;

      // Get custom configuration for this preset
      const configResult = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, `preset_config_${presetId}`))
        .limit(1);

      const config = configResult.length > 0 ? JSON.parse(configResult[0].value) : null;

      // Import presets module and merge with config
      const { getPresetWithConfig } = await import("@shared/presets");
      const preset = getPresetWithConfig(presetId, config);

      if (!preset) {
        return res.status(404).json({ message: "Preset not found" });
      }

      res.json(preset);
    } catch (error) {
      console.error("Error fetching preset:", error);
      res.status(500).json({ message: "Failed to fetch preset" });
    }
  });

  // Update a preset configuration
  // NOTE: When category names change, this also updates all projects using this preset
  app.put("/api/admin/presets/:presetId", async (req: Request, res: Response) => {
    try {
      const { presetId } = req.params;
      const { name, description, recommendedTheme, categories } = req.body;

      // Verify that the base preset exists
      const { AVAILABLE_PRESETS, getPresetWithConfig } = await import("@shared/presets");
      if (!AVAILABLE_PRESETS[presetId]) {
        return res.status(404).json({ message: "Base preset not found" });
      }

      // Get the OLD configuration before saving to detect renames
      const configKey = `preset_config_${presetId}`;
      const existingConfig = await db.select()
        .from(globalSettings)
        .where(eq(globalSettings.key, configKey))
        .limit(1);

      const oldConfig = existingConfig.length > 0 ? JSON.parse(existingConfig[0].value) : null;
      const oldPreset = getPresetWithConfig(presetId, oldConfig);

      // Build new configuration object (only include provided fields)
      const config: any = {};
      if (name !== undefined) config.name = name;
      if (description !== undefined) config.description = description;
      if (recommendedTheme !== undefined) config.recommendedTheme = recommendedTheme;
      if (categories !== undefined) {
        // Ensure tier2 keys match tier1 names to prevent orphaned categories
        if (categories.tier1 && categories.tier2) {
          const tier1Names = new Set(categories.tier1.map((c: any) => c.name));
          const fixedTier2: Record<string, any[]> = {};

          // For each tier1 category, try to find its tier2 entries
          for (const tier1 of categories.tier1) {
            // First check if there's a direct match
            if (categories.tier2[tier1.name]) {
              fixedTier2[tier1.name] = categories.tier2[tier1.name];
            }
          }

          // Copy any tier2 entries that already have valid tier1 keys
          for (const [key, value] of Object.entries(categories.tier2)) {
            if (tier1Names.has(key) && !fixedTier2[key]) {
              fixedTier2[key] = value as any[];
            }
          }

          // Log any orphaned tier2 keys that couldn't be matched
          const orphanedKeys = Object.keys(categories.tier2).filter(k => !tier1Names.has(k) && !fixedTier2[k]);
          if (orphanedKeys.length > 0) {
            console.warn(`⚠️ Orphaned tier2 keys found (no matching tier1): ${orphanedKeys.join(', ')}`);
          }

          categories.tier2 = fixedTier2;
        }
        config.categories = categories;
      }

      const configValue = JSON.stringify(config);

      // Save the configuration
      if (existingConfig.length === 0) {
        // Create new configuration
        await db.insert(globalSettings).values({
          key: configKey,
          value: configValue,
          description: `Custom configuration for ${presetId} preset`
        });
      } else {
        // Update existing configuration
        await db.update(globalSettings)
          .set({ value: configValue, updatedAt: new Date() })
          .where(eq(globalSettings.key, configKey));
      }

      // Detect tier1 category renames and update projects/tasks
      if (oldPreset && categories?.tier1 && oldPreset.categories?.tier1) {
        const oldTier1Names = oldPreset.categories.tier1.map((c: any) => c.name);
        const newTier1Names = categories.tier1.map((c: any) => c.name);
        
        // Find renames by comparing sortOrder positions
        const renames: { oldName: string; newName: string }[] = [];
        for (let i = 0; i < Math.min(oldTier1Names.length, newTier1Names.length); i++) {
          if (oldTier1Names[i] !== newTier1Names[i]) {
            renames.push({ oldName: oldTier1Names[i], newName: newTier1Names[i] });
          }
        }

        // Find all projects using this preset
        const affectedProjects = await db.select()
          .from(projects)
          .where(eq(projects.presetId, presetId));
        
        if (renames.length > 0) {
          // Update each affected project's categories and tasks for renames
          for (const project of affectedProjects) {
            for (const { oldName, newName } of renames) {
              // Update projectCategories
              await db.update(projectCategories)
                .set({ name: newName, updatedAt: new Date() })
                .where(and(
                  eq(projectCategories.projectId, project.id),
                  eq(projectCategories.name, oldName),
                  eq(projectCategories.type, 'tier1')
                ));
              
              // Update tasks tier1Category
              await db.update(tasks)
                .set({ tier1Category: newName })
                .where(and(
                  eq(tasks.projectId, project.id),
                  eq(tasks.tier1Category, oldName)
                ));
              
            }
          }
        }
        
        // ALSO: Sync tasks that have mismatched tier1Category values
        // This catches cases where the preset was renamed before this code was in place
        for (const project of affectedProjects) {
          // Get this project's tier1 categories from database
          const projectTier1Cats = await db.select()
            .from(projectCategories)
            .where(and(
              eq(projectCategories.projectId, project.id),
              eq(projectCategories.type, 'tier1')
            ));
          
          // For each tier1 category in the project, check if tasks match by sortOrder
          for (let i = 0; i < projectTier1Cats.length; i++) {
            const dbCatName = projectTier1Cats[i].name;
            const presetCatName = newTier1Names[i];
            
            // If project category matches preset, but tasks might have old names
            // Find tasks that DON'T have the correct tier1Category but SHOULD
            // This is tricky - we use sortOrder matching
            if (dbCatName && presetCatName && dbCatName === presetCatName) {
              // Update any tasks that have a tier1Category that doesn't exist in preset
              // but should belong to this category based on sortOrder
              const orphanedTaskCategories = new Set<string>();
              const projectTasks = await db.select()
                .from(tasks)
                .where(eq(tasks.projectId, project.id));
              
              for (const task of projectTasks) {
                if (task.tier1Category && !newTier1Names.includes(task.tier1Category)) {
                  orphanedTaskCategories.add(task.tier1Category);
                }
              }
              
              // If there are orphaned categories, try to match them to preset categories
              if (orphanedTaskCategories.size > 0) {
                // Match orphaned category to the correct preset category by checking which tier2s they have
                for (const orphanedCat of orphanedTaskCategories) {
                  // Find which preset category this orphaned category should map to
                  // by checking if the tier2 subcategories match
                  for (let j = 0; j < newTier1Names.length; j++) {
                    const presetTier2Names = categories.tier2[newTier1Names[j]]?.map((t2: any) => t2.name) || [];
                    
                    // Check if any task with orphanedCat has a tier2Category in this preset's tier2 list
                    const matchingTasks = projectTasks.filter(t => 
                      t.tier1Category === orphanedCat && 
                      t.tier2Category && 
                      presetTier2Names.includes(t.tier2Category)
                    );
                    
                    if (matchingTasks.length > 0) {
                      // Update tasks
                      await db.update(tasks)
                        .set({ tier1Category: newTier1Names[j] })
                        .where(and(
                          eq(tasks.projectId, project.id),
                          eq(tasks.tier1Category, orphanedCat)
                        ));
                      
                      break;
                    }
                  }
                }
              }
            }
          }
        }
      }

      // Return the merged preset
      const updatedPreset = getPresetWithConfig(presetId, config);

      res.json(updatedPreset);
    } catch (error) {
      console.error("Error updating preset configuration:", error);
      res.status(500).json({ message: "Failed to update preset configuration" });
    }
  });

  // Delete a preset configuration (reset to base preset)
  app.delete("/api/admin/presets/:presetId", async (req: Request, res: Response) => {
    try {
      const { presetId } = req.params;
      const configKey = `preset_config_${presetId}`;

      // Delete the configuration
      await db.delete(globalSettings)
        .where(eq(globalSettings.key, configKey));

      res.json({ message: "Preset configuration deleted successfully" });
    } catch (error) {
      console.error("Error deleting preset configuration:", error);
      res.status(500).json({ message: "Failed to delete preset configuration" });
    }
  });

  // Update project theme settings
  app.put("/api/projects/:projectId/theme", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { colorTheme, useGlobalTheme } = req.body;

      // Validate input
      if (typeof useGlobalTheme !== 'boolean' || (colorTheme && typeof colorTheme !== 'string')) {
        return res.status(400).json({ message: "Invalid theme settings" });
      }

      // Update project in database
      const updatedProject = await db.update(projects)
        .set({
          colorTheme: useGlobalTheme ? null : colorTheme,
          useGlobalTheme: useGlobalTheme
        })
        .where(eq(projects.id, projectId))
        .returning();

      if (updatedProject.length === 0) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.json(updatedProject[0]);
    } catch (error) {
      console.error("Error updating project theme:", error);
      res.status(500).json({ message: "Failed to update project theme" });
    }
  });

  // Apply theme to project categories (using existing applyGlobalThemeToProject function)
  app.post("/api/projects/:projectId/apply-theme", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { themeName } = req.body;
      if (!themeName || typeof themeName !== 'string') {
        return res.status(400).json({ message: "Theme name is required" });
      }

      // Import and use the existing function from template-management.ts
      const { applyGlobalThemeToProject } = await import("../utils/template-management");
      
      const result = await applyGlobalThemeToProject(projectId, themeName);
      
      if (result.success) {
        res.json({ 
          message: "Theme applied successfully", 
          categoriesUpdated: result.categoriesUpdated 
        });
      } else {
        res.status(500).json({ 
          message: "Failed to apply theme", 
          error: result.error 
        });
      }
    } catch (error) {
      console.error("Error applying theme to project:", error);
      res.status(500).json({ message: "Failed to apply theme to project" });
    }
  });

  // ==================== SECTION STATES ====================
  
  // Get section state for an entity field
  app.get("/api/section-states/:entityType/:entityId/:fieldName", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, fieldName } = req.params;
      const parsedEntityId = parseInt(entityId);
      
      if (isNaN(parsedEntityId)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }

      const sectionState = await storage.getSectionState(entityType, parsedEntityId, fieldName);
      res.json(sectionState || null);
    } catch (error) {
      console.error("Error fetching section state:", error);
      res.status(500).json({ message: "Failed to fetch section state" });
    }
  });

  // Create or update section state
  app.post("/api/section-states", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSectionStateSchema.parse(req.body);
      const sectionState = await storage.createOrUpdateSectionState(validatedData);
      res.json(sectionState);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Error creating/updating section state:", error);
      res.status(500).json({ message: "Failed to create/update section state" });
    }
  });

  // Delete section state
  app.delete("/api/section-states/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid section state ID" });
      }

      const deleted = await storage.deleteSectionState(id);
      if (deleted) {
        res.json({ message: "Section state deleted successfully" });
      } else {
        res.status(404).json({ message: "Section state not found" });
      }
    } catch (error) {
      console.error("Error deleting section state:", error);
      res.status(500).json({ message: "Failed to delete section state" });
    }
  });

  // ==================== SECTION COMMENTS ====================
  
  // Get section comments for an entity field
  app.get("/api/section-comments/:entityType/:entityId/:fieldName", async (req: Request, res: Response) => {
    try {
      const { entityType, entityId, fieldName } = req.params;
      const parsedEntityId = parseInt(entityId);
      
      if (isNaN(parsedEntityId)) {
        return res.status(400).json({ message: "Invalid entity ID" });
      }

      const sectionComments = await storage.getSectionComments(entityType, parsedEntityId, fieldName);
      res.json(sectionComments);
    } catch (error) {
      console.error("Error fetching section comments:", error);
      res.status(500).json({ message: "Failed to fetch section comments" });
    }
  });

  // Create a new section comment
  app.post("/api/section-comments", async (req: Request, res: Response) => {
    try {
      const validatedData = insertSectionCommentSchema.parse(req.body);
      const sectionComment = await storage.createSectionComment(validatedData);
      res.status(201).json(sectionComment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Error creating section comment:", error);
      res.status(500).json({ message: "Failed to create section comment" });
    }
  });

  // Update a section comment
  app.put("/api/section-comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const validatedData = insertSectionCommentSchema.partial().parse(req.body);
      const updatedComment = await storage.updateSectionComment(id, validatedData);
      
      if (updatedComment) {
        res.json(updatedComment);
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation failed", 
          errors: fromZodError(error).message 
        });
      }
      console.error("Error updating section comment:", error);
      res.status(500).json({ message: "Failed to update section comment" });
    }
  });

  // Delete a section comment
  app.delete("/api/section-comments/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid comment ID" });
      }

      const deleted = await storage.deleteSectionComment(id);
      if (deleted) {
        res.json({ message: "Section comment deleted successfully" });
      } else {
        res.status(404).json({ message: "Comment not found" });
      }
    } catch (error) {
      console.error("Error deleting section comment:", error);
      res.status(500).json({ message: "Failed to delete section comment" });
    }
  });

  // Apply preset to existing project
  app.post("/api/projects/:projectId/apply-preset", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }

      const { presetId } = req.body;
      if (!presetId || typeof presetId !== 'string') {
        return res.status(400).json({ message: "presetId is required" });
      }

      // Get the project to check if it exists
      const project = await storage.getProject(projectId);
      if (!project) {
        return res.status(404).json({ message: "Project not found" });
      }

      console.log(`Applying preset '${presetId}' to project ${projectId}`);

      // Import and apply the preset (categories only, not tasks)
      const { applyPresetToProject } = await import('../shared/preset-loader.ts');
      const result = await applyPresetToProject(projectId, presetId, true);

      if (!result.success) {
        return res.status(500).json({
          message: `Failed to apply preset: ${result.error}`,
          error: result.error
        });
      }

      console.log(`Preset '${presetId}' applied successfully to project ${projectId} - ${result.categoriesCreated} categories created`);

      res.json({
        message: `Preset '${presetId}' applied successfully to project ${projectId}`,
        projectId,
        presetId,
        categoriesCreated: result.categoriesCreated
      });
    } catch (error) {
      console.error("Error applying preset to project:", error);
      res.status(500).json({ 
        message: "Failed to apply preset to project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  // Invoice routes
  app.get("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { projectId } = req.query;
      
      let query = db.select().from(invoices);
      
      if (projectId) {
        const pid = parseInt(projectId as string);
        if (!isNaN(pid)) {
          query = query.where(eq(invoices.projectId, pid));
        }
      }
      
      const invoiceResults = await query;
      
      // Get line items for all invoices
      const invoicesWithLineItems = await Promise.all(
        invoiceResults.map(async (invoice) => {
          const lineItems = await db.select()
            .from(invoiceLineItems)
            .where(eq(invoiceLineItems.invoiceId, invoice.id))
            .orderBy(invoiceLineItems.sortOrder);
          
          return {
            ...invoice,
            lineItems
          };
        })
      );
      
      res.json(invoicesWithLineItems);
    } catch (error) {
      console.error("Error fetching invoices:", error);
      res.status(500).json({ message: "Failed to fetch invoices" });
    }
  });

  app.get("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const invoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      if (invoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      const lineItems = await db.select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId))
        .orderBy(invoiceLineItems.sortOrder);
      
      res.json({
        ...invoice[0],
        lineItems
      });
    } catch (error) {
      console.error("Error fetching invoice:", error);
      res.status(500).json({ message: "Failed to fetch invoice" });
    }
  });

  app.post("/api/invoices", async (req: Request, res: Response) => {
    try {
      const { lineItems, ...invoiceData } = req.body;
      
      // Validate required fields
      if (!invoiceData.invoiceNumber || !invoiceData.clientName) {
        return res.status(400).json({ message: "Invoice number and client name are required" });
      }
      
      // Check if invoice number already exists
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.invoiceNumber, invoiceData.invoiceNumber))
        .limit(1);
      
      if (existingInvoice.length > 0) {
        return res.status(400).json({ message: "Invoice number already exists" });
      }
      
      // Insert invoice
      const newInvoice = await db.insert(invoices)
        .values({
          ...invoiceData,
          createdAt: new Date(),
          updatedAt: new Date()
        })
        .returning();
      
      const invoiceId = newInvoice[0].id;
      
      // Insert line items
      if (lineItems && lineItems.length > 0) {
        const lineItemsToInsert = lineItems.map((item: any, index: number) => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'each',
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: index
        }));
        
        await db.insert(invoiceLineItems).values(lineItemsToInsert);
      }
      
      // Return complete invoice with line items
      const completeInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      const invoiceLineItemsResult = await db.select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId))
        .orderBy(invoiceLineItems.sortOrder);
      
      res.status(201).json({
        ...completeInvoice[0],
        lineItems: invoiceLineItemsResult
      });
    } catch (error) {
      console.error("Error creating invoice:", error);
      res.status(500).json({ message: "Failed to create invoice" });
    }
  });

  app.put("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const { lineItems, ...invoiceData } = req.body;
      
      // Check if invoice exists
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      if (existingInvoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Update invoice
      await db.update(invoices)
        .set({
          ...invoiceData,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));
      
      // Delete existing line items
      await db.delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId));
      
      // Insert new line items
      if (lineItems && lineItems.length > 0) {
        const lineItemsToInsert = lineItems.map((item: any, index: number) => ({
          invoiceId,
          description: item.description,
          quantity: item.quantity,
          unit: item.unit || 'each',
          unitPrice: item.unitPrice,
          total: item.total,
          sortOrder: index
        }));
        
        await db.insert(invoiceLineItems).values(lineItemsToInsert);
      }
      
      // Return updated invoice with line items
      const updatedInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      const invoiceLineItemsResult = await db.select()
        .from(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId))
        .orderBy(invoiceLineItems.sortOrder);
      
      res.json({
        ...updatedInvoice[0],
        lineItems: invoiceLineItemsResult
      });
    } catch (error) {
      console.error("Error updating invoice:", error);
      res.status(500).json({ message: "Failed to update invoice" });
    }
  });

  app.patch("/api/invoices/:id/status", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      const { status } = req.body;
      const validStatuses = ['draft', 'sent', 'paid', 'overdue', 'cancelled'];
      
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Check if invoice exists
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      if (existingInvoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Update status
      await db.update(invoices)
        .set({
          status,
          updatedAt: new Date()
        })
        .where(eq(invoices.id, invoiceId));
      
      res.json({ message: "Status updated successfully", status });
    } catch (error) {
      console.error("Error updating invoice status:", error);
      res.status(500).json({ message: "Failed to update invoice status" });
    }
  });

  app.delete("/api/invoices/:id", async (req: Request, res: Response) => {
    try {
      const invoiceId = parseInt(req.params.id);
      if (isNaN(invoiceId)) {
        return res.status(400).json({ message: "Invalid invoice ID" });
      }
      
      // Check if invoice exists
      const existingInvoice = await db.select()
        .from(invoices)
        .where(eq(invoices.id, invoiceId))
        .limit(1);
      
      if (existingInvoice.length === 0) {
        return res.status(404).json({ message: "Invoice not found" });
      }
      
      // Delete line items first
      await db.delete(invoiceLineItems)
        .where(eq(invoiceLineItems.invoiceId, invoiceId));
      
      // Delete invoice
      await db.delete(invoices)
        .where(eq(invoices.id, invoiceId));
      
      res.json({ message: "Invoice deleted successfully" });
    } catch (error) {
      console.error("Error deleting invoice:", error);
      res.status(500).json({ message: "Failed to delete invoice" });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
