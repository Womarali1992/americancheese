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
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const result = insertTaskSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      const task = await storage.updateTask(id, result.data);
      if (!task) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.json(task);
    } catch (error) {
      res.status(500).json({ message: "Failed to update task" });
    }
  });

  app.delete("/api/tasks/:id", async (req: Request, res: Response) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid task ID" });
      }

      const success = await storage.deleteTask(id);
      if (!success) {
        return res.status(404).json({ message: "Task not found" });
      }

      res.status(204).end();
    } catch (error) {
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
        return res.status(400).json({ message: "Invalid expense ID" });
      }

      const success = await storage.deleteExpense(id);
      if (!success) {
        return res.status(404).json({ message: "Expense not found" });
      }

      res.status(204).end();
    } catch (error) {
      res.status(500).json({ message: "Failed to delete expense" });
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
      res.status(500).json({ message: "Failed to fetch materials" });
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
      res.status(500).json({ message: "Failed to fetch materials for project" });
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
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid material ID" });
      }

      const result = insertMaterialSchema.partial().safeParse(req.body);
      if (!result.success) {
        const validationError = fromZodError(result.error);
        return res.status(400).json({ message: validationError.message });
      }

      // Get the current material to compare taskIds
      const currentMaterial = await storage.getMaterial(id);
      if (!currentMaterial) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Update the material
      const material = await storage.updateMaterial(id, result.data);
      if (!material) {
        return res.status(404).json({ message: "Material not found" });
      }

      // Update task materialIds if taskIds have changed in the material
      if (req.body.taskIds && Array.isArray(req.body.taskIds)) {
        // Tasks that had this material before but no longer do
        const removedFromTasks = currentMaterial.taskIds?.filter(
          taskId => !req.body.taskIds.includes(taskId)
        ) || [];

        // Tasks that now have this material but didn't before
        const addedToTasks = req.body.taskIds.filter(
          taskId => !currentMaterial.taskIds?.includes(taskId)
        );

        // Remove material from tasks that no longer use it
        for (const taskId of removedFromTasks) {
          const task = await storage.getTask(taskId);
          if (task && task.materialIds) {
            const updatedMaterialIds = task.materialIds.filter(mId => mId !== id);
            await storage.updateTask(taskId, { materialIds: updatedMaterialIds });
          }
        }

        // Add material to tasks that now use it
        for (const taskId of addedToTasks) {
          const task = await storage.getTask(taskId);
          if (task) {
            const updatedMaterialIds = [...(task.materialIds || []), id];
            await storage.updateTask(taskId, { materialIds: updatedMaterialIds });
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
          const task = await storage.getTask(taskId);
          if (task && task.materialIds) {
            const updatedMaterialIds = task.materialIds.filter(mId => mId !== id);
            await storage.updateTask(taskId, { materialIds: updatedMaterialIds });
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
                
                // Create the material object as a quote
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
                  taskIds: [],
                  contactIds: [],
                  unit: unit,
                  cost: cost,
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
                
                // Create the material object
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
                  taskIds: [],
                  contactIds: [],
                  unit: unit,
                  cost: cost,
                  // Add the new tier structure fields with broader name matching
                  tier: row['Project Tier'] || row['Project teir'] || row['project tier'] || row['ProjectTier'] || row['Tier'] || row['tier'] || null,
                  tier2Category: row['Subcategory'] || row['SubCategory'] || row['Sub Category'] || row['sub catagory'] || row['Tier 2 Category'] || row['Tier2Category'] || row['tier2category'] || null,
                  section: row['Section'] || null,
                  subsection: row['Subsection'] || null,
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
      
      // Import task templates and create tasks from them
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const templates = getAllTaskTemplates();
      
      const projectStartDate = new Date(project.startDate);
      const createdTasks = [];
      
      for (const template of templates) {
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
      // Get all projects
      const projects = await storage.getProjects();
      const results = [];
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      
      // Create tasks for each project from templates
      for (const project of projects) {
        // Get existing tasks for this project
        const existingTasks = await storage.getTasksByProject(project.id);
        
        // Find templates that haven't been used yet for this project
        const existingTemplateIds = existingTasks
          .filter(task => task.templateId)
          .map(task => task.templateId);
          
        const templatesToCreate = allTemplates.filter(
          template => !existingTemplateIds.includes(template.id)
        );
        
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
        
        // Delete all template-based tasks for this project
        const existingTasks = await storage.getTasksByProject(id);
        const templateTasks = existingTasks.filter(task => task.templateId);
        
        let deletedCount = 0;
        for (const task of templateTasks) {
          await storage.deleteTask(task.id);
          deletedCount++;
        }
        
        // Create fresh tasks from templates
        const { getAllTaskTemplates } = await import("../shared/taskTemplates");
        const templates = getAllTaskTemplates();
        
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        
        for (const template of templates) {
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
        
        return res.json({
          message: "Task templates reset for project",
          projectId: id,
          tasksDeleted: deletedCount,
          tasksCreated: createdTasks.length
        });
      }
      
      // If no projectId, reset templates for all projects
      // Get all projects
      const projects = await storage.getProjects();
      const results = [];
      
      // Import task templates
      const { getAllTaskTemplates } = await import("../shared/taskTemplates");
      const allTemplates = getAllTaskTemplates();
      
      // Reset tasks for each project
      for (const project of projects) {
        // Delete all template-based tasks for this project
        const existingTasks = await storage.getTasksByProject(project.id);
        const templateTasks = existingTasks.filter(task => task.templateId);
        
        let deletedCount = 0;
        for (const task of templateTasks) {
          await storage.deleteTask(task.id);
          deletedCount++;
        }
        
        // Create fresh tasks from templates
        const projectStartDate = new Date(project.startDate);
        const createdTasks = [];
        
        for (const template of allTemplates) {
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
