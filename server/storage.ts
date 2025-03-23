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
import { eq, and } from "drizzle-orm";
import { db } from "./db";

export interface IStorage {
  // Project CRUD operations
  getProjects(): Promise<Project[]>;
  getProject(id: number): Promise<Project | undefined>;
  createProject(project: InsertProject): Promise<Project>;
  updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined>;
  deleteProject(id: number): Promise<boolean>;

  // Task CRUD operations
  getTasks(): Promise<Task[]>;
  getTask(id: number): Promise<Task | undefined>;
  getTasksByProject(projectId: number): Promise<Task[]>;
  createTask(task: InsertTask): Promise<Task>;
  updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined>;
  deleteTask(id: number): Promise<boolean>;

  // Contact CRUD operations
  getContacts(): Promise<Contact[]>;
  getContact(id: number): Promise<Contact | undefined>;
  createContact(contact: InsertContact): Promise<Contact>;
  updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined>;
  deleteContact(id: number): Promise<boolean>;

  // Expense CRUD operations
  getExpenses(): Promise<Expense[]>;
  getExpense(id: number): Promise<Expense | undefined>;
  getExpensesByProject(projectId: number): Promise<Expense[]>;
  createExpense(expense: InsertExpense): Promise<Expense>;
  updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined>;
  deleteExpense(id: number): Promise<boolean>;

  // Material CRUD operations
  getMaterials(): Promise<Material[]>;
  getMaterial(id: number): Promise<Material | undefined>;
  getMaterialsByProject(projectId: number): Promise<Material[]>;
  createMaterial(material: InsertMaterial): Promise<Material>;
  updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined>;
  deleteMaterial(id: number): Promise<boolean>;
  
  // Task Attachment CRUD operations
  getTaskAttachments(taskId: number): Promise<TaskAttachment[]>;
  getTaskAttachment(id: number): Promise<TaskAttachment | undefined>;
  createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment>;
  updateTaskAttachment(id: number, attachment: Partial<InsertTaskAttachment>): Promise<TaskAttachment | undefined>;
  deleteTaskAttachment(id: number): Promise<boolean>;
}

export class MemStorage implements IStorage {
  private projects: Map<number, Project>;
  private tasks: Map<number, Task>;
  private contacts: Map<number, Contact>;
  private expenses: Map<number, Expense>;
  private materials: Map<number, Material>;
  private taskAttachments: Map<number, TaskAttachment>;

  private projectId: number;
  private taskId: number;
  private contactId: number;
  private expenseId: number;
  private materialId: number;
  private taskAttachmentId: number;

  constructor() {
    this.projects = new Map();
    this.tasks = new Map();
    this.contacts = new Map();
    this.expenses = new Map();
    this.materials = new Map();
    this.taskAttachments = new Map();

    this.projectId = 1;
    this.taskId = 1;
    this.contactId = 1;
    this.expenseId = 1;
    this.materialId = 1;
    this.taskAttachmentId = 1;

    // Initialize with sample data
    this.initSampleData();
  }

  private initSampleData() {
    // Sample projects
    const projects = [
      {
        name: "Riverside Apartments",
        location: "123 Main St, Riverside",
        startDate: new Date("2023-06-15"),
        endDate: new Date("2023-12-30"),
        description: "Multi-family residential complex",
        status: "active",
        progress: 45
      },
      {
        name: "Downtown Office Building",
        location: "555 Commerce Way, Downtown",
        startDate: new Date("2023-03-10"),
        endDate: new Date("2024-01-15"),
        description: "Commercial office space",
        status: "on_hold",
        progress: 28
      },
      {
        name: "Sunset Hills Residential",
        location: "789 Sunset Blvd, Hills",
        startDate: new Date("2023-04-22"),
        endDate: new Date("2023-10-15"),
        description: "Single-family residences",
        status: "active",
        progress: 75
      },
      {
        name: "Greendale Community Center",
        location: "101 Community Dr, Greendale",
        startDate: new Date("2023-01-05"),
        endDate: new Date("2023-05-20"),
        description: "Public community center",
        status: "completed",
        progress: 100
      }
    ];

    projects.forEach(project => this.createProject(project));

    // Sample tasks
    const tasks = [
      {
        title: "Foundation inspection for Riverside Apartments",
        description: "Complete foundation inspection with city officials",
        projectId: 1,
        tier1Category: "Structural",
        tier2Category: "Foundation",
        category: "Foundation",
        startDate: new Date("2023-06-15"),
        endDate: new Date("2023-06-20"),
        status: "in_progress",
        assignedTo: "John Miller",
        completed: false,
        contactIds: ["1", "4"],
        materialIds: ["1", "3"]
      },
      {
        title: "Order windows for Downtown Office Building",
        description: "Order all glass panels and window frames",
        projectId: 2,
        tier1Category: "Sheathing",
        tier2Category: "Windows",
        category: "Windows & Doors",
        startDate: new Date("2023-06-25"),
        endDate: new Date("2023-06-27"),
        status: "not_started",
        assignedTo: "Sarah Davis",
        completed: false,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Finalize permits for Sunset Hills",
        description: "Submit final permits to city planning department",
        projectId: 3,
        tier1Category: "Structural",
        tier2Category: "Permits",
        category: "Permits & Approvals",
        startDate: new Date("2023-06-10"),
        endDate: new Date("2023-06-15"),
        status: "completed",
        assignedTo: "Michael Chen",
        completed: true,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Schedule electrical inspection for Riverside",
        description: "Coordinate with city inspector for electrical systems",
        projectId: 1,
        tier1Category: "Systems",
        tier2Category: "Electric",
        category: "Electrical",
        startDate: new Date("2023-06-25"),
        endDate: new Date("2023-06-28"),
        status: "in_progress",
        assignedTo: "Rob Johnson",
        completed: false,
        contactIds: ["1", "2"],
        materialIds: ["2"]
      },
      {
        title: "Install plumbing fixtures in Sunset Hills",
        description: "Install all bathroom and kitchen fixtures",
        projectId: 3,
        tier1Category: "Systems",
        tier2Category: "Plumbing",
        category: "Plumbing",
        startDate: new Date("2023-06-18"),
        endDate: new Date("2023-06-25"),
        status: "in_progress",
        assignedTo: "Jane Smith",
        completed: false,
        contactIds: ["2", "5"],
        materialIds: ["3"],
        materialsNeeded: "Plumbing fixtures, pipes, fittings"
      },
      {
        title: "Pour concrete for Downtown Office Building",
        description: "Complete concrete pouring for foundation",
        projectId: 2,
        tier1Category: "Structural",
        tier2Category: "Foundation",
        category: "Foundation",
        startDate: new Date("2023-06-05"),
        endDate: new Date("2023-06-10"),
        status: "completed",
        assignedTo: "Mike Brown",
        completed: true,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Order roofing materials for Riverside",
        description: "Source and order all roofing materials",
        projectId: 1,
        tier1Category: "Structural",
        tier2Category: "Roofing",
        category: "Roof",
        startDate: new Date("2023-07-01"),
        endDate: new Date("2023-07-05"),
        status: "not_started",
        assignedTo: "Robert Chen",
        completed: false,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Setup scaffolding at Downtown Office",
        description: "Install scaffolding for exterior work",
        projectId: 2,
        tier1Category: "Sheathing",
        tier2Category: "Exteriors",
        category: "Exterior",
        startDate: new Date("2023-06-15"),
        endDate: new Date("2023-06-18"),
        status: "in_progress",
        assignedTo: "John Miller",
        completed: false,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Install kitchen cabinets in Riverside Apartments",
        description: "Install and adjust all kitchen cabinets",
        projectId: 1,
        tier1Category: "Finishings",
        tier2Category: "Cabinets",
        category: "Cabinets",
        startDate: new Date("2023-07-10"),
        endDate: new Date("2023-07-15"),
        status: "not_started",
        assignedTo: "Eric Wilson",
        completed: false,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Install HVAC system in Downtown Office Building",
        description: "Complete HVAC system installation and testing",
        projectId: 2,
        tier1Category: "Systems",
        tier2Category: "HVAC",
        category: "HVAC",
        startDate: new Date("2023-06-20"),
        endDate: new Date("2023-06-28"),
        status: "in_progress",
        assignedTo: "Mike Johnson",
        completed: false,
        contactIds: ["5"],
        materialIds: []
      },
      {
        title: "Install flooring in Sunset Hills",
        description: "Install hardwood flooring throughout the building",
        projectId: 3,
        tier1Category: "Finishings",
        tier2Category: "Flooring",
        category: "Flooring",
        startDate: new Date("2023-07-05"),
        endDate: new Date("2023-07-12"),
        status: "not_started",
        assignedTo: "David Garcia",
        completed: false,
        contactIds: [],
        materialIds: []
      },
      {
        title: "Install drywall in Riverside Apartments",
        description: "Complete drywall installation in all units",
        projectId: 1,
        tier1Category: "Sheathing",
        tier2Category: "Drywall",
        category: "Drywall",
        startDate: new Date("2023-06-22"),
        endDate: new Date("2023-06-30"),
        status: "not_started",
        assignedTo: "Carlos Rodriguez",
        completed: false,
        contactIds: [],
        materialIds: []
      }
    ];

    tasks.forEach(task => this.createTask(task));

    // Sample contacts
    const contacts = [
      {
        name: "John Doe",
        role: "Electrical Contractor",
        company: "Electric Pros Inc.",
        phone: "(555) 123-4567",
        email: "john.doe@example.com",
        type: "contractor",
        category: "electrical",
        initials: "JD"
      },
      {
        name: "Jane Smith",
        role: "Plumbing Specialist",
        company: "Plumbing Excellence LLC",
        phone: "(555) 987-6543",
        email: "jane.smith@example.com",
        type: "contractor",
        category: "plumbing",
        initials: "JS"
      },
      {
        name: "Robert Chen",
        role: "Building Materials",
        company: "BuildMart Supplies",
        phone: "(555) 456-7890",
        email: "robert.chen@example.com",
        type: "supplier",
        category: "general",
        initials: "RC"
      },
      {
        name: "Sarah Davis",
        role: "Architect",
        company: "Davis Architecture",
        phone: "(555) 234-5678",
        email: "sarah.davis@example.com",
        type: "consultant",
        category: "design",
        initials: "SD"
      },
      {
        name: "Mike Johnson",
        role: "HVAC Specialist",
        company: "ClimateControl Systems",
        phone: "(555) 345-6789",
        email: "mike.johnson@example.com",
        type: "contractor",
        category: "hvac",
        initials: "MJ"
      }
    ];

    contacts.forEach(contact => this.createContact(contact));

    // Sample expenses
    const expenses = [
      {
        description: "Concrete Materials",
        amount: 12450,
        date: new Date("2023-06-15"),
        category: "materials",
        projectId: 1,
        vendor: "ABC Supplies Co.",
        materialIds: [1], // Link to concrete material
        contactIds: [3], // Link to Robert Chen (supplier)
        status: "paid"
      },
      {
        description: "Electrical Contractor",
        amount: 8750,
        date: new Date("2023-06-12"),
        category: "labor",
        projectId: 2,
        vendor: "ElectroPro Services",
        materialIds: [],
        contactIds: [1], // Link to John Doe (electrical contractor)
        status: "approved"
      },
      {
        description: "Glass Panels",
        amount: 24800,
        date: new Date("2023-06-10"),
        category: "materials",
        projectId: 2,
        vendor: "GlassMasters Inc.",
        materialIds: [],
        contactIds: [],
        status: "pending"
      },
      {
        description: "Plumbing Fixtures",
        amount: 5280,
        date: new Date("2023-06-08"),
        category: "materials",
        projectId: 3,
        vendor: "Plumbing Plus"
      },
      {
        description: "HVAC Installation",
        amount: 18900,
        date: new Date("2023-06-05"),
        category: "labor",
        projectId: 1,
        vendor: "ClimateControl Systems"
      }
    ];

    expenses.forEach(expense => this.createExpense(expense));

    // Sample materials
    const materials = [
      {
        name: "Concrete",
        type: "Building Materials",
        category: "concrete",
        quantity: 150,
        supplier: "ABC Supplies Co.",
        status: "delivered",
        projectId: 1,
        unit: "cubic yards",
        cost: 120
      },
      {
        name: "Glass Panels",
        type: "Windows",
        category: "glass",
        quantity: 75,
        supplier: "GlassMasters Inc.",
        status: "ordered",
        projectId: 2,
        unit: "panels",
        cost: 250
      },
      {
        name: "Copper Pipes",
        type: "Plumbing",
        category: "plumbing",
        quantity: 200,
        supplier: "Plumbing Plus",
        status: "used",
        projectId: 3,
        unit: "feet",
        cost: 8.5
      },
      {
        name: "Electrical Wiring",
        type: "Electrical",
        category: "electrical",
        quantity: 500,
        supplier: "Electric Pros Inc.",
        status: "delivered",
        projectId: 1,
        unit: "feet",
        cost: 2.25
      },
      {
        name: "Lumber",
        type: "Building Materials",
        category: "wood",
        quantity: 350,
        supplier: "BuildMart Supplies",
        status: "delivered",
        projectId: 2,
        unit: "board feet",
        cost: 5.75
      }
    ];

    materials.forEach(material => this.createMaterial(material));
  }

  // Project CRUD operations
  async getProjects(): Promise<Project[]> {
    return Array.from(this.projects.values());
  }

  async getProject(id: number): Promise<Project | undefined> {
    return this.projects.get(id);
  }

  async createProject(project: InsertProject): Promise<Project> {
    const id = this.projectId++;
    const newProject = { ...project, id };
    this.projects.set(id, newProject);
    
    // After creating a project, create predefined tasks from templates
    try {
      const taskTemplatesModule = require('../shared/taskTemplates');
      const allTemplates = taskTemplatesModule.getAllTaskTemplates();
      
      // Create tasks from all templates for this project
      for (const template of allTemplates) {
        const today = new Date();
        const endDate = new Date();
        endDate.setDate(today.getDate() + template.estimatedDuration);
        
        const taskId = this.taskId++;
        const newTask: Task = {
          id: taskId,
          title: template.title,
          description: template.description,
          status: "not_started",
          startDate: today.toISOString().split('T')[0], // Format as YYYY-MM-DD
          endDate: endDate.toISOString().split('T')[0], // Format as YYYY-MM-DD
          projectId: id,
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
        this.tasks.set(taskId, newTask);
      }
    } catch (error) {
      console.error("Error creating tasks from templates:", error);
    }
    
    return newProject;
  }

  async updateProject(id: number, project: Partial<InsertProject>): Promise<Project | undefined> {
    const existingProject = this.projects.get(id);
    if (!existingProject) return undefined;

    const updatedProject = { ...existingProject, ...project };
    this.projects.set(id, updatedProject);
    return updatedProject;
  }

  async deleteProject(id: number): Promise<boolean> {
    return this.projects.delete(id);
  }

  // Task CRUD operations
  async getTasks(): Promise<Task[]> {
    return Array.from(this.tasks.values());
  }

  async getTask(id: number): Promise<Task | undefined> {
    return this.tasks.get(id);
  }

  async getTasksByProject(projectId: number): Promise<Task[]> {
    return Array.from(this.tasks.values()).filter(task => task.projectId === projectId);
  }

  async createTask(task: InsertTask): Promise<Task> {
    const id = this.taskId++;
    const newTask = { ...task, id };
    this.tasks.set(id, newTask);
    return newTask;
  }

  async updateTask(id: number, task: Partial<InsertTask>): Promise<Task | undefined> {
    const existingTask = this.tasks.get(id);
    if (!existingTask) return undefined;

    const updatedTask = { ...existingTask, ...task };
    this.tasks.set(id, updatedTask);
    return updatedTask;
  }

  async deleteTask(id: number): Promise<boolean> {
    return this.tasks.delete(id);
  }

  // Contact CRUD operations
  async getContacts(): Promise<Contact[]> {
    return Array.from(this.contacts.values());
  }

  async getContact(id: number): Promise<Contact | undefined> {
    return this.contacts.get(id);
  }

  async createContact(contact: InsertContact): Promise<Contact> {
    const id = this.contactId++;
    const newContact = { ...contact, id };
    this.contacts.set(id, newContact);
    return newContact;
  }

  async updateContact(id: number, contact: Partial<InsertContact>): Promise<Contact | undefined> {
    const existingContact = this.contacts.get(id);
    if (!existingContact) return undefined;

    const updatedContact = { ...existingContact, ...contact };
    this.contacts.set(id, updatedContact);
    return updatedContact;
  }

  async deleteContact(id: number): Promise<boolean> {
    return this.contacts.delete(id);
  }

  // Expense CRUD operations
  async getExpenses(): Promise<Expense[]> {
    return Array.from(this.expenses.values());
  }

  async getExpense(id: number): Promise<Expense | undefined> {
    return this.expenses.get(id);
  }

  async getExpensesByProject(projectId: number): Promise<Expense[]> {
    return Array.from(this.expenses.values()).filter(expense => expense.projectId === projectId);
  }

  async createExpense(expense: InsertExpense): Promise<Expense> {
    const id = this.expenseId++;
    const newExpense = { ...expense, id };
    this.expenses.set(id, newExpense);
    return newExpense;
  }

  async updateExpense(id: number, expense: Partial<InsertExpense>): Promise<Expense | undefined> {
    const existingExpense = this.expenses.get(id);
    if (!existingExpense) return undefined;

    const updatedExpense = { ...existingExpense, ...expense };
    this.expenses.set(id, updatedExpense);
    return updatedExpense;
  }

  async deleteExpense(id: number): Promise<boolean> {
    return this.expenses.delete(id);
  }

  // Material CRUD operations
  async getMaterials(): Promise<Material[]> {
    return Array.from(this.materials.values());
  }

  async getMaterial(id: number): Promise<Material | undefined> {
    return this.materials.get(id);
  }

  async getMaterialsByProject(projectId: number): Promise<Material[]> {
    return Array.from(this.materials.values()).filter(material => material.projectId === projectId);
  }

  async createMaterial(material: InsertMaterial): Promise<Material> {
    const id = this.materialId++;
    const newMaterial = { ...material, id };
    this.materials.set(id, newMaterial);
    return newMaterial;
  }

  async updateMaterial(id: number, material: Partial<InsertMaterial>): Promise<Material | undefined> {
    const existingMaterial = this.materials.get(id);
    if (!existingMaterial) return undefined;

    const updatedMaterial = { ...existingMaterial, ...material };
    this.materials.set(id, updatedMaterial);
    return updatedMaterial;
  }

  async deleteMaterial(id: number): Promise<boolean> {
    return this.materials.delete(id);
  }

  // Task Attachment CRUD operations
  async getTaskAttachments(taskId: number): Promise<TaskAttachment[]> {
    return Array.from(this.taskAttachments.values()).filter(attachment => attachment.taskId === taskId);
  }

  async getTaskAttachment(id: number): Promise<TaskAttachment | undefined> {
    return this.taskAttachments.get(id);
  }

  async createTaskAttachment(attachment: InsertTaskAttachment): Promise<TaskAttachment> {
    const id = this.taskAttachmentId++;
    const uploadedAt = new Date().toISOString();
    const newAttachment = { ...attachment, id, uploadedAt };
    this.taskAttachments.set(id, newAttachment);
    return newAttachment;
  }

  async updateTaskAttachment(id: number, attachment: Partial<InsertTaskAttachment>): Promise<TaskAttachment | undefined> {
    const existingAttachment = this.taskAttachments.get(id);
    if (!existingAttachment) return undefined;

    const updatedAttachment = { ...existingAttachment, ...attachment };
    this.taskAttachments.set(id, updatedAttachment);
    return updatedAttachment;
  }

  async deleteTaskAttachment(id: number): Promise<boolean> {
    return this.taskAttachments.delete(id);
  }
}

// Import PostgreSQL storage implementation
import { PostgresStorage } from "./db-storage";

// Create and export PostgreSQL storage instance
export const storage = new PostgresStorage();
