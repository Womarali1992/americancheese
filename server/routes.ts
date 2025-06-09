import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { 
  insertProjectSchema, 
  insertTaskSchema, 
  insertContactSchema, 
  insertExpenseSchema, 
  insertMaterialSchema, 
  insertLaborSchema, 
  insertTemplateCategorySchema,
  insertTaskTemplateSchema,
  insertSubtaskSchema,
  insertChecklistItemSchema,
  insertChecklistItemCommentSchema,
  projects, 
  tasks, 
  labor,
  templateCategories,
  taskTemplates,
  subtasks,
  checklistItems,
  checklistItemComments
} from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { handleLogin, handleLogout } from "./auth";
import { db } from "./db";
import { eq, sql, isNull, and, or } from "drizzle-orm";
import csvParser from "csv-parser";
import { Readable } from "stream";
import multer from "multer";

export async function registerRoutes(app: Express): Promise<Server> {
  // Authentication routes
  app.post("/api/auth/login", handleLogin);
  app.post("/api/auth/logout", handleLogout);
  
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
  
  // Auth middleware is now applied in index.ts for the entire app
  // Project routes
  app.get("/api/projects", async (_req: Request, res: Response) => {
    try {
      const projects = await storage.getProjects();
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

      res.json(project);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch project" });
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
        // Create the project
        const project = await storage.createProject(result.data);
        
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

      const success = await storage.deleteProject(id);
      if (!success) {
        return res.status(404).json({ message: "Project not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete project" });
    }
  });

  // Category management endpoint
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
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
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

      const tasks = await storage.getTasksByProject(projectId);
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks for project" });
    }
  });

  app.post("/api/tasks", async (req: Request, res: Response) => {
    try {
      const result = insertTaskSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const task = await storage.createTask(result.data);
      res.status(201).json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to create task" });
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

      res.json(task);
    } catch (error) {
      console.error("Failed to update task:", error);
      res.status(500).json({ message: "Failed to update task" });
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
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid subtask ID" });
      }

      const result = insertSubtaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const [updatedSubtask] = await db
        .update(subtasks)
        .set(result.data)
        .where(eq(subtasks.id, id))
        .returning();

      if (!updatedSubtask) {
        return res.status(404).json({ message: "Subtask not found" });
      }

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
  
  // Cleanup orphaned tasks
  // One-time cleanup of orphaned tasks - will execute once when the server starts
  (async () => {
    try {
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
  app.get("/api/contacts", async (_req: Request, res: Response) => {
    try {
      const contacts = await storage.getContacts();
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
      const result = insertContactSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const contact = await storage.createContact(result.data);
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
      let materials = await storage.getMaterials();
      
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

  // Set up multer storage for file uploads
  const upload = multer({ 
    storage: multer.memoryStorage(),
    limits: {
      fileSize: 5 * 1024 * 1024, // limit file size to 5MB
    },
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

                // Look for quote number fields
                const quoteNumber = findField([
                  'Quote Number', 'QuoteNumber', 'Quote #', 'quote number', 'quote #', 'quote_number',
                  'Quote Number ', ' Quote Number', 'Quotation Number', 'quotation number'
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
                  supplier: row['Supplier'] || row['Supplier (optional)'] || '', // Support both Supplier and Supplier (optional) fields
                  status: shouldBeQuote ? 'quoted' : (row['Status'] || 'ordered'),
                  isQuote: shouldBeQuote, // Automatically mark as quote if quote number exists
                  quoteDate: row['Quote Date'] || (hasQuoteNumber ? new Date().toISOString().split('T')[0] : null),
                  quoteNumber: actualQuoteNumber, // Use the actual quote number value
                  orderDate: row['Order Date'] || null,
                  supplierId: row['Supplier ID'] ? parseInt(row['Supplier ID']) : null,
                  taskIds: taskIds,
                  contactIds: [],
                  unit: unit,
                  cost: cost,
                  // Use normalized values for tier and tier2Category
                  tier: normalizedTierField || tierField,
                  tier2Category: normalizedTier2Field || tier2Field,
                  section: sectionField || row['Section'] || null,
                  subsection: subsectionField || row['Subsection'] || null
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

      const newAttachment = {
        ...req.body,
        taskId
      };

      const attachment = await storage.createTaskAttachment(newAttachment);
      res.status(201).json(attachment);
    } catch (error) {
      res.status(500).json({ message: "Failed to create attachment" });
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
  app.get("/api/labor", async (_req: Request, res: Response) => {
    try {
      console.log("[API] GET /api/labor - Fetching all labor entries");
      const laborEntries = await storage.getLabor();
      console.log(`[API] GET /api/labor - Successfully retrieved ${laborEntries.length} labor entries`);
      res.json(laborEntries);
    } catch (error) {
      console.error("[API] GET /api/labor - Error fetching labor entries:", error);
      res.status(500).json({ message: "Failed to fetch labor entries" });
    }
  });

  app.get("/api/labor/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid labor ID" });
      }

      const labor = await storage.getLaborById(id);
      if (!labor) {
        return res.status(404).json({ message: "Labor entry not found" });
      }

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
      const result = insertLaborSchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Add work_date field using startDate to satisfy database constraint
      const laborDataWithWorkDate = {
        ...result.data,
        // Use startDate as work_date to maintain backward compatibility
        workDate: result.data.startDate
      };

      const labor = await storage.createLabor(laborDataWithWorkDate);
      
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
      // Import task templates dynamically
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const templates = getAllTaskTemplates();
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
      
      // Check if specific template IDs are provided
      const { templateIds } = req.body;
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      
      // Filter templates if templateIds is provided
      const templates = templateIds && Array.isArray(templateIds) && templateIds.length > 0
        ? allTemplates.filter(template => templateIds.includes(template.id))
        : allTemplates;
        
      console.log(`Creating tasks from ${templates.length} templates for project ${projectId}`);
      
      const projectStartDate = new Date(project.startDate);
      const createdTasks = [];
      
      // Get existing tasks for this project to avoid duplicates
      const existingTasks = await storage.getTasksByProject(projectId);
      const existingTemplateIds = existingTasks
        .filter(task => task.templateId)
        .map(task => task.templateId);
      
      for (const template of templates) {
        // Skip if this template is already used for this project
        if (existingTemplateIds.includes(template.id)) {
          console.log(`Skipping template ${template.id} as it's already used in project ${projectId}`);
          continue;
        }
        
        // Calculate end date based on estimated duration
        const taskEndDate = new Date(projectStartDate);
        taskEndDate.setDate(projectStartDate.getDate() + template.estimatedDuration);
        
        const taskData = {
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: projectStartDate.toISOString().split('T')[0],
          endDate: taskEndDate.toISOString().split('T')[0],
          projectId: projectId,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          category: template.category,
          completed: false,
          templateId: template.id
        };
        
        const createdTask = await storage.createTask(taskData);
        createdTasks.push(createdTask);
      }
      
      res.status(201).json({
        message: `Created ${createdTasks.length} tasks from templates`,
        tasks: createdTasks
      });
    } catch (error) {
      console.error("Error creating tasks from templates:", error);
      res.status(500).json({ 
        message: "Failed to create tasks from templates",
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
      
      // Validate the request body
      const themeSchema = z.object({
        tier1: z.object({
          structural: z.string(),
          systems: z.string(),
          sheathing: z.string(),
          finishings: z.string(),
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
      
      for (const category of tier1Categories) {
        const lowerCaseName = category.name.toLowerCase();
        if (lowerCaseName === 'structural' && theme.tier1.structural) {
          updatePromises.push(
            storage.updateTemplateCategory(category.id, { color: theme.tier1.structural })
          );
        } else if (lowerCaseName === 'systems' && theme.tier1.systems) {
          updatePromises.push(
            storage.updateTemplateCategory(category.id, { color: theme.tier1.systems })
          );
        } else if (lowerCaseName === 'sheathing' && theme.tier1.sheathing) {
          updatePromises.push(
            storage.updateTemplateCategory(category.id, { color: theme.tier1.sheathing })
          );
        } else if (lowerCaseName === 'finishings' && theme.tier1.finishings) {
          updatePromises.push(
            storage.updateTemplateCategory(category.id, { color: theme.tier1.finishings })
          );
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
      await Promise.all(updatePromises);
      
      console.log("Theme colors updated successfully");
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
      
      // Get all categories (both global and project-specific)
      const allCategories = await db.select()
        .from(templateCategories)
        .where(
          or(
            eq(templateCategories.projectId, projectId),
            isNull(templateCategories.projectId)
          )
        )
        .orderBy(templateCategories.type, templateCategories.name);
      
      // Apply isolation logic: prefer project-specific versions over their original global categories
      const isolatedCategories = [];
      const globalCategories = allCategories.filter(cat => cat.projectId === null);
      const projectCategories = allCategories.filter(cat => cat.projectId === projectId);
      
      // Create a set of global category IDs that are overridden by project-specific copies
      const overriddenGlobalIds = new Set();
      for (const projectCat of projectCategories) {
        isolatedCategories.push(projectCat);
        if (projectCat.originalGlobalId) {
          overriddenGlobalIds.add(projectCat.originalGlobalId);
          console.log(`Project-specific category "${projectCat.name}" (ID: ${projectCat.id}) overrides global category ID: ${projectCat.originalGlobalId}`);
        } else {
          console.log(`Project-specific category "${projectCat.name}" (ID: ${projectCat.id}) - no original global category tracked`);
        }
      }
      
      // Add global categories that are NOT overridden by project-specific ones
      for (const globalCat of globalCategories) {
        if (!overriddenGlobalIds.has(globalCat.id)) {
          isolatedCategories.push(globalCat);
        } else {
          console.log(`Skipping global category "${globalCat.name}" (ID: ${globalCat.id}) - overridden by project-specific version for project ${projectId}`);
        }
      }
      
      console.log(`Returning ${isolatedCategories.length} isolated categories for project ${projectId}`);
      res.json(isolatedCategories);
    } catch (error) {
      console.error("Error fetching template categories for project:", error);
      res.status(500).json({ 
        message: "Failed to fetch template categories for project",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });
  
  // Create project-specific category
  app.post("/api/projects/:projectId/template-categories", async (req: Request, res: Response) => {
    try {
      const projectId = parseInt(req.params.projectId);
      if (isNaN(projectId)) {
        return res.status(400).json({ message: "Invalid project ID" });
      }
      
      const result = insertTemplateCategorySchema.safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Add projectId to the category data
      const categoryData = {
        ...result.data,
        projectId
      };
      
      // Insert the new category
      const [category] = await db.insert(templateCategories)
        .values(categoryData)
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
      
      const result = insertTemplateCategorySchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }
      
      // Find the category - it could be a global category with null projectId or a project-specific category
      const [existingCategory] = await db.select()
        .from(templateCategories)
        .where(eq(templateCategories.id, categoryId));
      
      if (!existingCategory) {
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
          .from(templateCategories)
          .where(
            and(
              eq(templateCategories.projectId, projectId),
              eq(templateCategories.name, existingCategory.name),
              eq(templateCategories.type, existingCategory.type),
              existingCategory.parentId ? eq(templateCategories.parentId, existingCategory.parentId) : isNull(templateCategories.parentId)
            )
          );
        
        if (existingProjectCategory) {
          // Update the existing project-specific copy
          const [updatedCategory] = await db.update(templateCategories)
            .set({
              ...result.data,
              updatedAt: new Date()
            })
            .where(eq(templateCategories.id, existingProjectCategory.id))
            .returning();
          
          console.log(`Updated existing project-specific copy: ${updatedCategory.id}`);
          return res.json(updatedCategory);
        } else {
          // Create a new project-specific copy with the modifications
          const [newProjectCategory] = await db.insert(templateCategories)
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
        const [updatedCategory] = await db.update(templateCategories)
          .set({
            ...result.data,
            updatedAt: new Date()
          })
          .where(eq(templateCategories.id, categoryId))
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
      const result = insertTemplateCategorySchema.safeParse(req.body);
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

      const result = insertTemplateCategorySchema.partial().safeParse(req.body);
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
      const result = insertTemplateCategorySchema.safeParse(req.body);
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

      const result = insertTemplateCategorySchema.partial().safeParse(req.body);
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

      const newChecklistItem = await storage.createChecklistItem(checklistItemData);
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

  const httpServer = createServer(app);
  return httpServer;
}
