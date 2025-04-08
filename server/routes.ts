import type { Express, Request, Response } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertProjectSchema, insertTaskSchema, insertContactSchema, insertExpenseSchema, insertMaterialSchema, projects, tasks } from "@shared/schema";
import { z } from "zod";
import { fromZodError } from "zod-validation-error";
import { handleLogin, handleLogout } from "./auth";
import { db } from "./db";
import { eq } from "drizzle-orm";
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

  // Task routes
  app.get("/api/tasks", async (_req: Request, res: Response) => {
    try {
      const tasks = await storage.getTasks();
      res.json(tasks);
    } catch (error) {
      res.status(500).json({ message: "Failed to fetch tasks" });
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
            if (!materialIds.includes(material.id)) {
              materialIds.push(material.id);
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

                // Create the material object with all fields
                const material = {
                  projectId,
                  name: materialName,
                  type: type,
                  category: category,
                  quantity: quantity,
                  supplier: row['Supplier'] || row['Supplier (optional)'] || '', // Support both Supplier and Supplier (optional) fields
                  status: row['Status'] || 'ordered',
                  isQuote: row['Is Quote'] === 'true' || row['Is Quote'] === 'yes' || false,
                  quoteDate: row['Quote Date'] || null,
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

  // Endpoint to reset task templates
  app.post("/api/reset-task-templates", async (req: Request, res: Response) => {
    try {
      console.log("Reset task templates request received", req.body);
      
      // Get the project ID from query or body (optional)
      const projectId = req.query.projectId || req.body.projectId;
      
      // If projectId is provided, reset templates for just that project
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
        
        console.log(`Resetting task templates for project ${id}`);
        
        // Delete all template-based tasks for this project
        const existingTasks = await storage.getTasksByProject(id);
        const templateTasks = existingTasks.filter(task => task.templateId);
        
        console.log(`Found ${templateTasks.length} template tasks to delete`);
        
        let deletedCount = 0;
        for (const task of templateTasks) {
          await storage.deleteTask(task.id);
          deletedCount++;
        }
        
        console.log(`Deleted ${deletedCount} template tasks`);
        
        // Create fresh tasks from templates
        const { getAllTaskTemplates } = await import("../shared/taskTemplates");
        const templates = getAllTaskTemplates();
        
        console.log(`Found ${templates.length} task templates to create`);
        
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        const processedTemplateIds = new Set(); // Track templates we've already processed
        
        for (const template of templates) {
          // Skip if we've already processed this template
          if (processedTemplateIds.has(template.id)) {
            console.log(`Skipping duplicate template ${template.id}`);
            continue;
          }
          
          // Mark this template as processed
          processedTemplateIds.add(template.id);
          
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
        
        return res.json({
          message: "Task templates reset for project",
          projectId: id,
          tasksDeleted: deletedCount,
          tasksCreated: createdTasks.length
        });
      }
      
      // If no projectId, reset templates for all projects
      console.log("Resetting task templates for all projects");
      
      // Get all projects
      const projects = await storage.getProjects();
      console.log(`Found ${projects.length} projects to process`);
      
      const results = [];
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      console.log(`Found ${allTemplates.length} task templates`);
      
      // Reset tasks for each project
      for (const project of projects) {
        console.log(`Processing project ${project.id}: ${project.name}`);
        
        // Delete all template-based tasks for this project
        const existingTasks = await storage.getTasksByProject(project.id);
        const templateTasks = existingTasks.filter(task => task.templateId);
        
        console.log(`Found ${templateTasks.length} template tasks to delete for project ${project.id}`);
        
        let deletedCount = 0;
        for (const task of templateTasks) {
          await storage.deleteTask(task.id);
          deletedCount++;
        }
        
        console.log(`Deleted ${deletedCount} template tasks for project ${project.id}`);
        
        // Create fresh tasks from templates
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        const processedTemplateIds = new Set(); // Track templates we've already processed
        
        for (const template of allTemplates) {
          // Skip if we've already processed this template
          if (processedTemplateIds.has(template.id)) {
            console.log(`Skipping duplicate template ${template.id} for project ${project.id}`);
            continue;
          }
          
          // Mark this template as processed
          processedTemplateIds.add(template.id);
          
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
        
        results.push({
          projectId: project.id,
          projectName: project.name,
          tasksDeleted: deletedCount,
          tasksCreated: createdTasks.length
        });
      }
      
      res.json({
        message: "Task templates reset for all projects",
        results
      });
    } catch (error) {
      console.error("Error resetting task templates:", error);
      res.status(500).json({ 
        message: "Failed to reset task templates",
        error: error instanceof Error ? error.message : String(error)
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
