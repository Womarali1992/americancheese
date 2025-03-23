import { eq, and } from "drizzle-orm";
import { db } from "./db";
import { 
  projects, 
  tasks, 
  contacts, 
  expenses, 
  materials,
  taskAttachments,
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
  type InsertTaskAttachment
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
    
    // After creating a project, create predefined tasks from templates
    try {
      const taskTemplatesModule = require('../shared/taskTemplates');
      const allTemplates = taskTemplatesModule.getAllTaskTemplates();
      
      // Create a batch of tasks from all templates for this project
      const taskBatch = allTemplates.map(template => {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + template.estimatedDuration);
        
        return {
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          projectId: createdProject.id,
          tier1Category: template.tier1Category,
          tier2Category: template.tier2Category,
          category: template.category,
          completed: false,
          assignedTo: null,
          contactIds: null,
          materialIds: null,
          materialsNeeded: null,
          templateId: template.id
        };
      });
      
      if (taskBatch.length > 0) {
        await db.insert(tasks).values(taskBatch);
        console.log(`Created ${taskBatch.length} template tasks for project ${createdProject.id}`);
      }
    } catch (error) {
      console.error("Error creating tasks from templates:", error);
    }
    
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
    const result = await db.select().from(tasks).where(eq(tasks.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return await db.select().from(tasks).where(eq(tasks.projectId, projectId));
  }

  async createTask(task: InsertTask): Promise<Task> {
    // Convert Date objects to strings if necessary
    const taskData = {
      ...task,
      startDate: task.startDate instanceof Date ? 
        task.startDate.toISOString().split('T')[0] : 
        task.startDate,
      endDate: task.endDate instanceof Date ? 
        task.endDate.toISOString().split('T')[0] : 
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
      startDate: task.startDate instanceof Date ? 
        task.startDate.toISOString().split('T')[0] : 
        task.startDate,
      endDate: task.endDate instanceof Date ? 
        task.endDate.toISOString().split('T')[0] : 
        task.endDate
    };

    const result = await db.update(tasks)
      .set(taskData)
      .where(eq(tasks.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
  }

  async deleteTask(id: number): Promise<boolean> {
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
      date: expense.date instanceof Date ? 
        expense.date.toISOString().split('T')[0] : 
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
      date: expense.date instanceof Date ? 
        expense.date.toISOString().split('T')[0] : 
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
    return await db.select().from(materials);
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    const result = await db.select().from(materials).where(eq(materials.id, id));
    return result.length > 0 ? result[0] : undefined;
  }

  async getMaterialsByProject(projectId: number): Promise<Material[]> {
    return await db.select().from(materials).where(eq(materials.projectId, projectId));
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
      contactIds: material.contactIds || []
    };

    const result = await db.insert(materials).values(materialData).returning();
    return result[0];
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const result = await db.update(materials)
      .set(material)
      .where(eq(materials.id, id))
      .returning();
    
    return result.length > 0 ? result[0] : undefined;
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

    const result = await db.insert(taskAttachments).values(attachmentData).returning();
    return result[0];
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
}