import { eq, and, isNull } from "drizzle-orm";
import { db } from "./db";
import { 
  projects, 
  tasks, 
  contacts, 
  expenses, 
  materials,
  taskAttachments,
  labor,
  templateCategories,
  taskTemplates,
  type Project, 
  type InsertProject, 
  type Task, 
  type InsertTask, 
  type Contact, 
  type InsertContact,
  type Expense,
  type InsertExpense,
  type Material,
  type InsertMaterial,
  type TaskAttachment,
  type InsertTaskAttachment,
  type Labor,
  type InsertLabor,
  type TemplateCategory,
  type InsertTemplateCategory,
  type TaskTemplate,
  type InsertTaskTemplate
} from "@shared/schema";
import { IStorage } from "./storage";

/**
 * PostgreSQL implementation of the storage interface
 */
export class PostgresStorage implements IStorage {
  // Project CRUD operations
  async getProjects(): Promise<Project[]> {
    return await db.select().from(projects);
  }

  async getProject(id: number): Promise<Project | undefined> {
    const result = await db.select().from(projects).where(eq(projects.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createProject(project: InsertProject): Promise<Project> {
    // Convert Date objects to strings in ISO format (YYYY-MM-DD)
    let startDate = project.startDate;
    let endDate = project.endDate;
    
    // If Date objects were passed from the client
    if (typeof startDate === 'object') {
      startDate = new Date(startDate).toISOString().split('T')[0];
    } 
    // If string in ISO format with time was passed (YYYY-MM-DDT00:00:00.000Z)
    else if (typeof startDate === 'string' && startDate.includes('T')) {
      startDate = startDate.split('T')[0];
    }
    
    if (typeof endDate === 'object') {
      endDate = new Date(endDate).toISOString().split('T')[0];
    }
    else if (typeof endDate === 'string' && endDate.includes('T')) {
      endDate = endDate.split('T')[0];
    }
    
    // Use the processed dates in the project data
    const projectData = {
      ...project,
      startDate,
      endDate
    };
    
    console.log("Inserting project with data:", JSON.stringify(projectData));
    const result = await db.insert(projects).values(projectData).returning();
    const createdProject = result[0];
    
    // NOTE: Task creation from templates is now handled in routes.ts
    // We removed the duplicate task creation code from here to avoid creating tasks twice
    
    return createdProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    // Convert Date objects to strings if necessary
    const projectData = {
      ...project,
      startDate: project.startDate && typeof project.startDate === 'object' ? 
        new Date(project.startDate).toISOString().split('T')[0] : 
        project.startDate,
      endDate: project.endDate && typeof project.endDate === 'object' ? 
        new Date(project.endDate).toISOString().split('T')[0] : 
        project.endDate
    };

    const result = await db.update(projects)
      .set(projectData)
      .where(eq(projects.id, id))
      .returning();

    return result.length > 0 ? result[0] : undefined;
  }

  async deleteProject(id: number): Promise<boolean> {
    // Get all tasks for this project first, so we can delete their attachments
    const projectTasks = await db.select({ id: tasks.id })
      .from(tasks)
      .where(eq(tasks.projectId, id));
    
    // Delete all task attachments for all project tasks
    if (projectTasks.length > 0) {
      const taskIds = projectTasks.map(task => task.id);
      
      for (const taskId of taskIds) {
        await db.delete(taskAttachments)
          .where(eq(taskAttachments.taskId, taskId));
      }
    }
    
    // Delete all tasks associated with this project
    await db.delete(tasks)
      .where(eq(tasks.projectId, id));
    
    // Delete all associated expenses
    await db.delete(expenses)
      .where(eq(expenses.projectId, id));
    
    // Delete all associated materials
    await db.delete(materials)
      .where(eq(materials.projectId, id));
    
    // Delete all associated labor entries
    await db.delete(labor)
      .where(eq(labor.projectId, id));
    
    // Finally delete the project
    const result = await db.delete(projects)
      .where(eq(projects.id, id))
      .returning({ id: projects.id });
    
    return result.length > 0;
  }

  // Task CRUD operations
  async getTasks(): Promise<Task[]> {
    return await db.select().from(tasks);
  }

  async getTask(id: number): Promise<Task | undefined> {
    console.log(`[DB] Fetching task with id ${id}`);
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    
    if (result.length > 0) {
      const task = result[0];
      console.log(`[DB] Found task: ${task.title}, materialIds:`, task.materialIds);
      
      // Ensure materialIds is always an array for consistency
      if (task.materialIds === null) {
        task.materialIds = [];
      }
      
      // Add category color information if tier1Category or tier2Category exists
      const enhancedTask = await this.enrichTaskWithCategoryColors(task);
      
      return enhancedTask;
    }
    
    console.log(`[DB] No task found with id ${id}`);
    return undefined;
  }
  
  // Helper method to add category color information to tasks
  private async enrichTaskWithCategoryColors(task: Task): Promise<Task> {
    const enhancedTask = { ...task };
    
    // Look up tier1Category color if exists
    if (task.tier1Category) {
      try {
        const tier1Categories = await db.select()
          .from(templateCategories)
          .where(
            and(
              eq(templateCategories.type, 'tier1'),
              eq(templateCategories.name, task.tier1Category)
            )
          );
        
        if (tier1Categories.length > 0) {
          // Add the color to the task object
          enhancedTask.tier1Color = tier1Categories[0].color;
        }
      } catch (error) {
        console.error(`Error looking up tier1 category color for "${task.tier1Category}":`, error);
      }
    }
    
    // Look up tier2Category color if exists
    if (task.tier2Category) {
      try {
        const tier2Categories = await db.select()
          .from(templateCategories)
          .where(
            and(
              eq(templateCategories.type, 'tier2'),
              eq(templateCategories.name, task.tier2Category)
            )
          );
        
        if (tier2Categories.length > 0) {
          // Add the color to the task object
          enhancedTask.tier2Color = tier2Categories[0].color;
        }
      } catch (error) {
        console.error(`Error looking up tier2 category color for "${task.tier2Category}":`, error);
      }
    }
    
    return enhancedTask;
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    console.log(`[DB] Fetching tasks for project ${projectId}`);
    const result = await db.select().from(tasks).where(eq(tasks.projectId, projectId));
    
    // Ensure materialIds is always an array for consistency
    const processedResult = result.map(task => {
      // Make a defensive copy of the task
      const processedTask = { ...task };
      
      // Initialize empty array if materialIds is null
      if (processedTask.materialIds === null) {
        processedTask.materialIds = [];
      }
      
      return processedTask;
    });
    
    console.log(`[DB] Found ${processedResult.length} tasks for project ${projectId}`);
    return processedResult;
  }

  async createTask(task: InsertTask): Promise<Task> {
    // Convert Date objects to strings if necessary
    const taskData = {
      ...task,
      startDate: task.startDate && typeof task.startDate === 'object' ? 
        new Date(task.startDate as any).toISOString().split('T')[0] : 
        task.startDate,
      endDate: task.endDate && typeof task.endDate === 'object' ? 
        new Date(task.endDate as any).toISOString().split('T')[0] : 
        task.endDate,
      // Ensure arrays are properly handled
      contactIds: task.contactIds || [],
      materialIds: task.materialIds || []
    };

    const result = await db.insert(tasks).values(taskData).returning();
    return result[0];
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    // Convert Date objects to strings if necessary
    const taskData = {
      ...task,
      startDate: task.startDate && typeof task.startDate === 'object' ? 
        new Date(task.startDate as any).toISOString().split('T')[0] : 
        task.startDate,
      endDate: task.endDate && typeof task.endDate === 'object' ? 
        new Date(task.endDate as any).toISOString().split('T')[0] : 
        task.endDate
    };

    const result = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
    // First delete any attachments associated with this task
    await db.delete(taskAttachments)
      .where(eq(taskAttachments.taskId, id));
    
    // Now delete the task
    const result = await db.delete(tasks)
      .where(eq(tasks.id, id))
      .returning({ id: tasks.id });
    
    return result.length > 0;
  }

  // Contact CRUD operations
  async getContacts(): Promise<Contact[]> {
    return await db.select().from(contacts);
  }

  async getContact(id: number): Promise<Contact | undefined> {
    const result = await db.select().from(contacts).where(eq(contacts.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    // Fill in any nullable fields with null to avoid undefined issues
    const contactData = {
      ...contact,
      category: contact.category || 'other',
      company: contact.company || null,
      phone: contact.phone || null,
      email: contact.email || null,
      initials: contact.initials || null
    };

    const result = await db.insert(contacts).values(contactData).returning();
    return result[0];
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const result = await db.update(contacts)
      .set(contact)
      .where(eq(contacts.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteContact(id: number): Promise<boolean> {
    const result = await db.delete(contacts)
      .where(eq(contacts.id, id))
      .returning({ id: contacts.id });
    
    return result.length > 0;
  }

  // Expense CRUD operations
  async getExpenses(): Promise<Expense[]> {
    return await db.select().from(expenses);
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    const result = await db.select().from(expenses).where(eq(expenses.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return await db.select().from(expenses).where(eq(expenses.projectId, projectId));
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    // Convert Date objects to strings if necessary
    const expenseData = {
      ...expense,
      date: expense.date && typeof expense.date === 'object' ? 
        new Date(expense.date as any).toISOString().split('T')[0] : 
        expense.date,
      status: expense.status || 'pending',
      vendor: expense.vendor || null,
      materialIds: expense.materialIds || [],
      contactIds: expense.contactIds || []
    };

    const result = await db.insert(expenses).values(expenseData).returning();
    return result[0];
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    // Convert Date objects to strings if necessary
    const expenseData = {
      ...expense,
      date: expense.date && typeof expense.date === 'object' ? 
        new Date(expense.date as any).toISOString().split('T')[0] : 
        expense.date
    };

    const result = await db.update(expenses)
      .set(expenseData)
      .where(eq(expenses.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteExpense(id: number): Promise<boolean> {
    const result = await db.delete(expenses)
      .where(eq(expenses.id, id))
      .returning({ id: expenses.id });
    
    return result.length > 0;
  }

  // Material CRUD operations
  async getMaterials(): Promise<Material[]> {
    console.log(`[DB] Fetching all materials`);
    const result = await db.select().from(materials);
    
    // Ensure taskIds is always an array for consistency
    const processedResult = result.map(material => {
      // Make a defensive copy of the material
      const processedMaterial = { ...material };
      
      // Initialize empty array if taskIds is null
      if (processedMaterial.taskIds === null) {
        processedMaterial.taskIds = [];
      }
      
      return processedMaterial;
    });
    
    console.log(`[DB] Found ${processedResult.length} materials`);
    return processedResult;
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    console.log(`[DB] Fetching material with id ${id}`);
    const result = await db.select().from(materials).where(eq(materials.id, id));
    
    if (result.length > 0) {
      const material = result[0];
      console.log(`[DB] Found material: ${material.name}, taskIds:`, material.taskIds);
      
      // Ensure taskIds is always an array for consistency
      if (material.taskIds === null) {
        material.taskIds = [];
      }
      
      return material;
    }
    
    console.log(`[DB] No material found with id ${id}`);
    return undefined;
  }

  async getMaterialsByProject(projectId: number): Promise<Material[]> {
    console.log(`[DB] Fetching materials for project ${projectId}`);
    const result = await db.select().from(materials).where(eq(materials.projectId, projectId));
    
    // Ensure taskIds is always an array for consistency
    const processedResult = result.map(material => {
      // Make a defensive copy of the material
      const processedMaterial = { ...material };
      
      // Initialize empty array if taskIds is null
      if (processedMaterial.taskIds === null) {
        processedMaterial.taskIds = [];
      }
      
      return processedMaterial;
    });
    
    console.log(`[DB] Found ${processedResult.length} materials for project ${projectId}`);
    return processedResult;
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const materialData = {
      ...material,
      category: material.category || 'other',
      status: material.status || 'ordered',
      supplier: material.supplier || null,
      unit: material.unit || null,
      cost: material.cost || null,
      taskIds: material.taskIds || [],
      contactIds: material.contactIds || [],
      quoteDate: material.quoteDate === "" ? null : 
                (material.quoteDate && typeof material.quoteDate === 'object') ? 
                new Date(material.quoteDate as any).toISOString().split('T')[0] : 
                material.quoteDate,
      orderDate: material.orderDate === "" ? null : 
                (material.orderDate && typeof material.orderDate === 'object') ? 
                new Date(material.orderDate as any).toISOString().split('T')[0] : 
                material.orderDate
    };

    const result = await db.insert(materials).values(materialData).returning();
    return result[0];
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    console.log("DB Storage: updating material with ID:", id);
    console.log("DB Storage: update data:", material);
    
    try {
      // Process date fields to ensure they're in correct format or null
      const materialData = {
        ...material,
        quoteDate: material.quoteDate === "" ? null : 
                  (material.quoteDate && typeof material.quoteDate === 'object') ? 
                  new Date(material.quoteDate as any).toISOString().split('T')[0] : 
                  material.quoteDate,
        orderDate: material.orderDate === "" ? null : 
                  (material.orderDate && typeof material.orderDate === 'object') ? 
                  new Date(material.orderDate as any).toISOString().split('T')[0] : 
                  material.orderDate
      };
      
      const result = await db.update(materials)
        .set(materialData)
        .where(eq(materials.id, id))
        .returning();
      
      console.log("DB Storage: update result:", result);
      return result.length > 0 ? result[0] : undefined;
    } catch (error) {
      console.error("DB Storage: Error updating material:", error);
      throw error;
    }
  }

  async deleteMaterial(id: number): Promise<boolean> {
    const result = await db.delete(materials)
      .where(eq(materials.id, id))
      .returning({ id: materials.id });
    
    return result.length > 0;
  }

  // Task Attachment CRUD operations
  async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
    return await db.select().from(taskAttachments).where(eq(taskAttachments.taskId, taskId));
  }

  async getTaskAttachment(id: number): Promise<TaskAttachment | undefined> {
    const result = await db.select().from(taskAttachments).where(eq(taskAttachments.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const attachmentData = {
      ...attachment,
      type: attachment.type || 'file',
      notes: attachment.notes || null,
      uploadedAt: new Date().toISOString()
    };

    // Use a type assertion to work around TypeScript errors
    const resultData = await db.insert(taskAttachments).values(attachmentData as any).returning();
    return resultData[0];
  }

  async updateTaskAttachment(id: number, attachment: Partial<InsertTaskAttachment>): Promise<TaskAttachment | undefined> {
    const result = await db.update(taskAttachments)
      .set(attachment)
      .where(eq(taskAttachments.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTaskAttachment(id: number): Promise<boolean> {
    const result = await db.delete(taskAttachments)
      .where(eq(taskAttachments.id, id))
      .returning({ id: taskAttachments.id });
    
    return result.length > 0;
  }

  // Labor CRUD operations
  async getLabor(): Promise<Labor[]> {
    try {
      console.log(`[DB] Fetching all labor records`);
      const results = await db.select().from(labor);
      console.log(`[DB] Found ${results.length} labor records`);
      return results;
    } catch (error) {
      console.error("[DB] Error fetching labor records:", error);
      throw error;
    }
  }

  async getLaborById(id: number): Promise<Labor | undefined> {
    try {
      console.log(`[DB] Looking up labor entry with ID: ${id}`);
      const result = await db.select().from(labor).where(eq(labor.id, id));
      
      if (result.length > 0) {
        console.log(`[DB] Found labor entry with ID ${id}:`, result[0]);
        return result[0];
      } else {
        console.log(`[DB] No labor entry found with ID ${id}`);
        return undefined;
      }
    } catch (error) {
      console.error(`[DB] Error looking up labor entry with ID ${id}:`, error);
      throw error;
    }
  }

  async getLaborByProject(projectId: number): Promise<Labor[]> {
    try {
      console.log(`[DB] Looking up labor entries for project ID: ${projectId}`);
      const results = await db.select().from(labor).where(eq(labor.projectId, projectId));
      console.log(`[DB] Found ${results.length} labor entries for project ID ${projectId}`);
      return results;
    } catch (error) {
      console.error(`[DB] Error looking up labor entries for project ID ${projectId}:`, error);
      throw error;
    }
  }

  async getLaborByContact(contactId: number): Promise<Labor[]> {
    try {
      console.log(`[DB] Looking up labor entries for contact ID: ${contactId}`);
      const results = await db.select().from(labor).where(eq(labor.contactId, contactId));
      console.log(`[DB] Found ${results.length} labor entries for contact ID ${contactId}`);
      return results;
    } catch (error) {
      console.error(`[DB] Error looking up labor entries for contact ID ${contactId}:`, error);
      throw error;
    }
  }

  async getLaborByTask(taskId: number): Promise<Labor[]> {
    try {
      console.log(`[DB] Querying labor entries for task ID: ${taskId}`);
      const results = await db.select().from(labor).where(eq(labor.taskId, taskId));
      console.log(`[DB] Found ${results.length} labor entries for task ID ${taskId}`);
      
      if (results.length > 0) {
        console.log(`[DB] Labor entries for task ${taskId}:`, results);
      }
      
      return results;
    } catch (error) {
      console.error(`[DB] Error looking up labor entries for task ID ${taskId}:`, error);
      throw error;
    }
  }

  async createLabor(laborData: InsertLabor): Promise<Labor> {
    // Process date fields to ensure they're in correct format
    const startDate = laborData.startDate && typeof laborData.startDate === 'object' ? 
      new Date(laborData.startDate as any).toISOString().split('T')[0] : 
      laborData.startDate;
    
    // Convert materialIds array to string array to match database TEXT[] column type
    const materialIds = laborData.materialIds ? 
      laborData.materialIds.map(id => id.toString()) : 
      [];
    
    console.log("[DB] Creating labor record with materialIds:", materialIds);
    
    const data = {
      ...laborData,
      // Always set workDate to startDate to ensure database constraint is satisfied
      workDate: startDate,
      startDate: startDate,
      endDate: laborData.endDate && typeof laborData.endDate === 'object' ? 
        new Date(laborData.endDate as any).toISOString().split('T')[0] : 
        laborData.endDate,
      // Ensure nullable fields are properly handled
      taskId: laborData.taskId || null,
      contactId: laborData.contactId || null,
      phone: laborData.phone || null,
      email: laborData.email || null,
      taskDescription: laborData.taskDescription || null,
      areaOfWork: laborData.areaOfWork || null,
      startTime: laborData.startTime || null,
      endTime: laborData.endTime || null,
      totalHours: laborData.totalHours || null,
      unitsCompleted: laborData.unitsCompleted || null,
      // Convert material IDs to strings and ensure it's never null
      materialIds: materialIds,
      // Ensure status is never null or undefined
      status: laborData.status || 'pending',
      // Set is_quote value, renamed to isQuote in the schema
      is_quote: laborData.isQuote || false
    };

    const result = await db.insert(labor).values(data).returning();
    return result[0];
  }

  async updateLabor(id: number, laborData: Partial<InsertLabor>): Promise<Labor | undefined> {
    // Process date fields to ensure they're in correct format
    
    // Convert materialIds array to string array to match database TEXT[] column type
    const materialIds = laborData.materialIds ? 
      laborData.materialIds.map(id => id.toString()) : 
      undefined;
      
    console.log("[DB] Updating labor record with materialIds:", materialIds);
    
    const data = {
      ...laborData,
      // Fix date formatting
      workDate: laborData.workDate && typeof laborData.workDate === 'object' ? 
        new Date(laborData.workDate as any).toISOString().split('T')[0] : 
        laborData.workDate,
      startDate: laborData.startDate && typeof laborData.startDate === 'object' ? 
        new Date(laborData.startDate as any).toISOString().split('T')[0] : 
        laborData.startDate,
      endDate: laborData.endDate && typeof laborData.endDate === 'object' ? 
        new Date(laborData.endDate as any).toISOString().split('T')[0] : 
        laborData.endDate,
      // Convert material IDs to strings and ensure it's never null
      materialIds: materialIds,
      // Handle is_quote field if provided
      ...(laborData.isQuote !== undefined ? { is_quote: laborData.isQuote } : {})
    };

    // Log the update data for debugging
    console.log("Updating labor with data:", JSON.stringify(data, null, 2));

    const result = await db.update(labor)
      .set(data)
      .where(eq(labor.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteLabor(id: number): Promise<boolean> {
    const result = await db.delete(labor)
      .where(eq(labor.id, id))
      .returning({ id: labor.id });
    
    return result.length > 0;
  }

  // Template Category CRUD operations
  async getTemplateCategories(): Promise<TemplateCategory[]> {
    return await db.select().from(templateCategories);
  }

  async getTemplateCategory(id: number): Promise<TemplateCategory | undefined> {
    const result = await db.select().from(templateCategories).where(eq(templateCategories.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTemplateCategoriesByType(type: string): Promise<TemplateCategory[]> {
    return await db.select().from(templateCategories).where(eq(templateCategories.type, type));
  }

  async getTemplateCategoriesByParent(parentId: number): Promise<TemplateCategory[]> {
    return await db.select().from(templateCategories).where(eq(templateCategories.parentId, parentId));
  }

  async createTemplateCategory(category: InsertTemplateCategory): Promise<TemplateCategory> {
    const result = await db.insert(templateCategories).values({
      ...category,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTemplateCategory(id: number, category: Partial<InsertTemplateCategory>): Promise<TemplateCategory | undefined> {
    const result = await db.update(templateCategories)
      .set({
        ...category,
        updatedAt: new Date()
      })
      .where(eq(templateCategories.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTemplateCategory(id: number): Promise<boolean> {
    // First check if there are child categories
    const children = await db.select().from(templateCategories).where(eq(templateCategories.parentId, id));
    if (children.length > 0) {
      // Delete child categories first
      for (const child of children) {
        await this.deleteTemplateCategory(child.id);
      }
    }

    // Check for templates using this category - need two separate queries
    const templatesWithTier1 = await db.select().from(taskTemplates)
      .where(eq(taskTemplates.tier1CategoryId, id));
    
    const templatesWithTier2 = await db.select().from(taskTemplates)
      .where(eq(taskTemplates.tier2CategoryId, id));
    
    // Combine the results
    const templatesUsingCategory = [...templatesWithTier1, ...templatesWithTier2];

    // Delete those templates first
    for (const template of templatesUsingCategory) {
      await this.deleteTaskTemplate(template.id);
    }

    // Now delete the category
    const result = await db.delete(templateCategories)
      .where(eq(templateCategories.id, id))
      .returning({ id: templateCategories.id });
    
    return result.length > 0;
  }

  // Task Template CRUD operations
  async getTaskTemplates(): Promise<TaskTemplate[]> {
    return await db.select().from(taskTemplates);
  }

  async getTaskTemplate(id: number): Promise<TaskTemplate | undefined> {
    const result = await db.select().from(taskTemplates).where(eq(taskTemplates.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTaskTemplatesByCategory(categoryId: number): Promise<TaskTemplate[]> {
    // Since complex OR conditions are tricky, use two separate queries
    const templatesWithTier1 = await db.select().from(taskTemplates)
      .where(eq(taskTemplates.tier1CategoryId, categoryId));
    
    const templatesWithTier2 = await db.select().from(taskTemplates)
      .where(eq(taskTemplates.tier2CategoryId, categoryId));
    
    // Combine the results (deduplication might be needed if a template uses the same categoryId for both tiers)
    const combinedResults = [...templatesWithTier1, ...templatesWithTier2];
    
    // Deduplicate by id
    const uniqueTemplates = Array.from(
      new Map(combinedResults.map(template => [template.id, template])).values()
    );
    
    return uniqueTemplates;
  }

  async createTaskTemplate(template: InsertTaskTemplate): Promise<TaskTemplate> {
    const result = await db.insert(taskTemplates).values({
      ...template,
      createdAt: new Date(),
      updatedAt: new Date()
    }).returning();
    return result[0];
  }

  async updateTaskTemplate(id: number, template: Partial<InsertTaskTemplate>): Promise<TaskTemplate | undefined> {
    const result = await db.update(taskTemplates)
      .set({
        ...template,
        updatedAt: new Date()
      })
      .where(eq(taskTemplates.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTaskTemplate(id: number): Promise<boolean> {
    const result = await db.delete(taskTemplates)
      .where(eq(taskTemplates.id, id))
      .returning({ id: taskTemplates.id });
    
    return result.length > 0;
  }
}