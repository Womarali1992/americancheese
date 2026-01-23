import { pgTable, text, serial, integer, boolean, date, timestamp, doublePrecision, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: date("start_date"),
  endDate: date("end_date"),
  description: text("description"),
  status: text("status").notNull().default("active"),
  progress: integer("progress").notNull().default(0),
  // Category visibility preferences for task management
  hiddenCategories: text("hidden_categories").array(), // Store hidden tier1 categories (e.g., ["systems", "sheathing"])
  // Template selection for this project
  selectedTemplates: text("selected_templates").array(), // Store selected template IDs (e.g., ["FN1", "FR3", "PL2"])
  // Color theme preference for this project
  colorTheme: text("color_theme"), // Store selected color theme key (e.g., "earth-tone", "futuristic")
  useGlobalTheme: boolean("use_global_theme").default(true), // Whether to use global theme instead of project-specific theme
  // Category preset used for this project
  presetId: text("preset_id").default("home-builder"), // Default to Home Builder preset
  // Structured context for AI/LLM consumption
  structuredContext: text("structured_context"), // JSON stringified ContextData for AI context
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Global Settings Schema
export const globalSettings = pgTable("global_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Setting key (e.g., "default_color_theme", "subcategory1_name", "subcategory2_name")
  value: text("value").notNull(), // Setting value (e.g., "earth-tone", "Planning", "Development")
  description: text("description"), // Optional description of the setting
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Generic Category System - Replaces hard-coded categories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // User-defined name (e.g., "Planning", "Development", "Testing")
  slug: text("slug").notNull().unique(), // URL-safe identifier (e.g., "planning", "development")
  description: text("description"), // Optional description
  color: text("color"), // Color for this category (hex code)
  icon: text("icon"), // Optional icon identifier
  parentId: integer("parent_id"), // For nested categories (null for root categories)
  level: integer("level").notNull().default(1), // 1 for root, 2 for children, etc.
  sortOrder: integer("sort_order").default(0), // Order within same level
  isActive: boolean("is_active").default(true), // Whether this category is currently in use
  isSystem: boolean("is_system").default(false), // Whether this is a system-generated category
  projectId: integer("project_id"), // null for global categories, project-specific otherwise
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Category Templates - Pre-defined category sets that can be applied to projects
export const categoryTemplatesSets = pgTable("category_template_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(), // e.g., "Construction", "Software Development", "Event Planning"
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Individual categories within template sets
export const categoryTemplateItems = pgTable("category_template_items", {
  id: serial("id").primaryKey(),
  templateSetId: integer("template_set_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  parentSlug: text("parent_slug"), // Reference to parent category slug within same template set
  level: integer("level").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

export const insertGlobalSettingsSchema = createInsertSchema(globalSettings).omit({
  id: true,
  updatedAt: true,
});

export const insertCategoriesSchema = createInsertSchema(categories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategoryTemplateSetsSchema = createInsertSchema(categoryTemplatesSets).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertCategoryTemplateItemsSchema = createInsertSchema(categoryTemplateItems).omit({
  id: true,
  createdAt: true,
});

// Task Schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  // UNIFIED: categoryId references projectCategories (new)
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - kept for backward compatibility during migration
  tier1Category: text("tier1_category"), // Legacy: Subcategory One, Subcategory Two, Subcategory Three, Subcategory Four
  tier2Category: text("tier2_category"), // Legacy: Foundation, Framing, Electrical, Plumbing, etc.
  category: text("category").default("other"), // Legacy field
  materialsNeeded: text("materials_needed"), // List of materials needed for the task
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  status: text("status").notNull().default("not_started"),
  assignedTo: text("assigned_to"),
  completed: boolean("completed").default(false),
  contactIds: text("contact_ids").array(), // Array of contact IDs attached to this task
  materialIds: text("material_ids").array(), // Array of material IDs attached to this task
  templateId: text("template_id"), // Reference to the template ID if this task was created from a template
  estimatedCost: doublePrecision("estimated_cost"), // Estimated cost for the task
  actualCost: doublePrecision("actual_cost"), // Actual cost of the task after completion
  // Subtask support
  parentTaskId: integer("parent_task_id"), // Reference to parent task for subtasks
  sortOrder: integer("sort_order").default(0), // Order of subtasks within a parent task
});

// Subtasks Schema - dedicated table for better organization
export const subtasks = pgTable("subtasks", {
  id: serial("id").primaryKey(),
  parentTaskId: integer("parent_task_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  sortOrder: integer("sort_order").default(0),
  assignedTo: text("assigned_to"),
  startDate: date("start_date"),
  endDate: date("end_date"),
  status: text("status").notNull().default("not_started"),
  estimatedCost: doublePrecision("estimated_cost"),
  actualCost: doublePrecision("actual_cost"),
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
});

// Contact Schema
export const contacts = pgTable("contacts", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  role: text("role").notNull(),
  company: text("company"),
  phone: text("phone"),
  email: text("email"),
  type: text("type").notNull(), // contractor, supplier, consultant, etc.
  category: text("category").notNull().default("other"), // electrical, plumbing, concrete, etc.
  initials: text("initials"),
});

export const insertContactSchema = createInsertSchema(contacts).omit({
  id: true,
});

// Expense Schema
export const expenses = pgTable("expenses", {
  id: serial("id").primaryKey(),
  description: text("description").notNull(),
  amount: doublePrecision("amount").notNull(),
  date: date("date").notNull(),
  category: text("category").notNull(),
  projectId: integer("project_id").notNull(),
  vendor: text("vendor"),
  materialIds: text("material_ids").array(), // Array of material IDs associated with this expense
  contactIds: text("contact_ids").array(), // Array of contact IDs associated with this expense
  status: text("status").notNull().default("pending"), // pending, approved, paid
});

export const insertExpenseSchema = createInsertSchema(expenses).omit({
  id: true,
});

// Material Schema
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  materialSize: text("material_size"), // New field for material size (e.g., 2x4, 4x8, etc.)
  type: text("type").notNull(),
  // UNIFIED: categoryId references projectCategories (new)
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - kept for backward compatibility
  category: text("category").default("other"), // Legacy: wood, electrical, plumbing, etc.
  tier: text("tier").default("subcategory-one"), // Legacy: subcategory-one, subcategory-two, subcategory-three, subcategory-four
  tier2Category: text("tier2category"), // Legacy: Foundation, Framing, Electrical, Plumbing, etc.
  section: text("section"), // e.g., Subfloor
  subsection: text("subsection"), // e.g., Subfloor Walls
  quantity: integer("quantity").notNull(),
  supplier: text("supplier"), // Supplier name (legacy field)
  supplierId: integer("supplier_id"), // Reference to a contact with type="supplier"
  status: text("status").notNull().default("ordered"), // ordered, quoted, delivered, used
  isQuote: boolean("is_quote").default(false), // Indicates if this is a quote or an actual order
  projectId: integer("project_id").notNull(),
  taskIds: text("task_ids").array(), // Array of task IDs this material is associated with
  contactIds: text("contact_ids").array(), // Array of contact (contractor) IDs associated with this material
  unit: text("unit"), // unit of measurement (e.g., pieces, sq ft, etc.)
  cost: doublePrecision("cost"), // cost per unit
  details: text("details"), // Additional details or notes about the material
  quoteDate: date("quote_date"), // Date when the quote was received
  quoteNumber: text("quote_number"), // Quote number for grouping materials from the same quote
  orderDate: date("order_date"), // Date when the order was placed
});

export const insertMaterialSchema = createInsertSchema(materials).omit({
  id: true,
});

// Task Attachment Schema
export const taskAttachments = pgTable("task_attachments", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  fileName: text("file_name").notNull(),
  fileType: text("file_type").notNull(), // mime type
  fileSize: integer("file_size").notNull(),
  fileContent: text("file_content").notNull(), // Base64 encoded file content
  uploadedAt: timestamp("uploaded_at").notNull().defaultNow(),
  notes: text("notes"), // Optional notes about the attachment
  type: text("type").notNull().default("document"), // document, image, note, etc.
});

export const insertTaskAttachmentSchema = createInsertSchema(taskAttachments).omit({
  id: true,
  uploadedAt: true
});

// Labor Schema
export const labor = pgTable("labor", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  // UNIFIED: categoryId references projectCategories (new)
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - kept for backward compatibility during migration
  tier1Category: text("tier1_category"), // Legacy: Subcategory One, Subcategory Two, Subcategory Three, Subcategory Four
  tier2Category: text("tier2_category"), // Legacy: Foundation, Framing, Electrical, Plumbing, etc.
  company: text("company").notNull(),
  phone: text("phone"),
  email: text("email"),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),  // The associated task
  subtaskId: integer("subtask_id"), // Reference to a specific subtask
  contactId: integer("contact_id").notNull(), // Reference to a contact
  workDate: date("work_date").notNull(), // Legacy date field required by database
  // Work Details
  taskDescription: text("task_description"),
  workDescription: text("work_description"), // Description of work performed
  areaOfWork: text("area_of_work"),
  // Time Tracking - Using time period as the main date source
  startDate: date("start_date").notNull(), // Primary date field for work start
  endDate: date("end_date").notNull(),     // Primary date field for work end
  startTime: text("start_time"), // Stored as string in format "HH:MM"
  endTime: text("end_time"),     // Stored as string in format "HH:MM"
  totalHours: doublePrecision("total_hours"), // Calculated field
  laborCost: doublePrecision("labor_cost"), // Total cost for this labor entry
  // Productivity Tracking
  unitsCompleted: text("units_completed"), // e.g. "150 linear ft"
  // Quote flag
  isQuote: boolean("is_quote").default(false), // Indicates if this is a quote and should not count towards budget
  // Materials Used (linked to materials table)
  materialIds: text("material_ids").array(), // Array of material IDs used by this labor
  status: text("status").notNull().default("pending"), // pending, in_progress, completed, billed
});

export const insertLaborSchema = createInsertSchema(labor).omit({
  id: true,
});

// Category Templates (Global templates that can be loaded into projects)
export const categoryTemplates = pgTable("category_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tier1" or "tier2"
  parentId: integer("parent_id"), // For tier2 categories, references the tier1 category
  color: text("color"), // Optional color for the category (hex code or color name)
  description: text("description"), // Optional description of the category
  sortOrder: integer("sort_order").default(0), // For ordering categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Project Categories (Actual categories used in specific projects)
export const projectCategories = pgTable("project_categories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tier1" or "tier2"
  parentId: integer("parent_id"), // For tier2 categories, references the tier1 category within the same project
  color: text("color"), // Optional color for the category (hex code or color name)
  description: text("description"), // Optional description of the category
  templateId: integer("template_id"), // Optional reference to the template this was loaded from
  sortOrder: integer("sort_order").default(0), // For ordering categories
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertCategoryTemplateSchema = createInsertSchema(categoryTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertProjectCategorySchema = createInsertSchema(projectCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task Templates (Global templates that can be loaded into projects)
export const taskTemplates = pgTable("task_templates", {
  id: serial("id").primaryKey(),
  templateId: text("template_id").notNull(), // e.g., "FN1", "PL2", etc.
  title: text("title").notNull(),
  description: text("description"),
  tier1CategoryId: integer("tier1_category_id").notNull(), // References categoryTemplates
  tier2CategoryId: integer("tier2_category_id").notNull(), // References categoryTemplates
  estimatedDuration: integer("estimated_duration").notNull().default(1),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertTaskTemplateSchema = createInsertSchema(taskTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Invoice Schema
export const invoices = pgTable("invoices", {
  id: serial("id").primaryKey(),
  invoiceNumber: text("invoice_number").notNull().unique(),
  invoiceDate: date("invoice_date").notNull(),
  dueDate: date("due_date").notNull(),
  status: text("status").notNull().default("draft"), // draft, sent, paid, overdue, cancelled
  
  // Company Information
  companyName: text("company_name").notNull(),
  companyAddress: text("company_address").notNull(),
  companyPhone: text("company_phone"),
  companyEmail: text("company_email"),
  
  // Client Information
  clientName: text("client_name").notNull(),
  clientAddress: text("client_address"),
  clientEmail: text("client_email"),
  clientPhone: text("client_phone"),
  
  // Project Information
  projectId: integer("project_id"),
  projectName: text("project_name"),
  workPeriod: text("work_period"),
  
  // Financial Details
  subtotal: doublePrecision("subtotal").notNull().default(0),
  taxRate: doublePrecision("tax_rate").default(0),
  taxAmount: doublePrecision("tax_amount").default(0),
  discountAmount: doublePrecision("discount_amount").default(0),
  discountDescription: text("discount_description"),
  total: doublePrecision("total").notNull().default(0),
  
  // Payment Information
  paymentTerms: text("payment_terms").notNull().default("Net 30 days"),
  paymentMethod: text("payment_method"),
  notes: text("notes"),
  
  // Metadata
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Invoice Line Items Schema
export const invoiceLineItems = pgTable("invoice_line_items", {
  id: serial("id").primaryKey(),
  invoiceId: integer("invoice_id").notNull(),
  description: text("description").notNull(),
  quantity: doublePrecision("quantity").notNull().default(1),
  unit: text("unit").notNull().default("each"),
  unitPrice: doublePrecision("unit_price").notNull().default(0),
  total: doublePrecision("total").notNull().default(0),
  sortOrder: integer("sort_order").default(0),
});

export const insertInvoiceSchema = createInsertSchema(invoices).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertInvoiceLineItemSchema = createInsertSchema(invoiceLineItems).omit({
  id: true,
});

// Type exports
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Expense = typeof expenses.$inferSelect;
export type InsertExpense = z.infer<typeof insertExpenseSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type TaskAttachment = typeof taskAttachments.$inferSelect;
export type InsertTaskAttachment = z.infer<typeof insertTaskAttachmentSchema>;

export type Labor = typeof labor.$inferSelect;
export type InsertLabor = z.infer<typeof insertLaborSchema>;

export type CategoryTemplate = typeof categoryTemplates.$inferSelect;
export type InsertCategoryTemplate = z.infer<typeof insertCategoryTemplateSchema>;

// Alternative type name for backward compatibility
export type TemplateCategory = typeof categoryTemplates.$inferSelect;
export type InsertTemplateCategory = z.infer<typeof insertCategoryTemplateSchema>;

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type InsertProjectCategory = z.infer<typeof insertProjectCategorySchema>;

export type TaskTemplate = typeof taskTemplates.$inferSelect;
export type InsertTaskTemplate = z.infer<typeof insertTaskTemplateSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = z.infer<typeof insertInvoiceSchema>;

export type InvoiceLineItem = typeof invoiceLineItems.$inferSelect;
export type InsertInvoiceLineItem = z.infer<typeof insertInvoiceLineItemSchema>;

// New generic category system types
export type Category = typeof categories.$inferSelect;
export type InsertCategory = z.infer<typeof insertCategoriesSchema>;

export type CategoryTemplateSet = typeof categoryTemplatesSets.$inferSelect;
export type InsertCategoryTemplateSet = z.infer<typeof insertCategoryTemplateSetsSchema>;

export type CategoryTemplateItem = typeof categoryTemplateItems.$inferSelect;
export type InsertCategoryTemplateItem = z.infer<typeof insertCategoryTemplateItemsSchema>;

// Checklist Items Schema
export const checklistItems = pgTable("checklist_items", {
  id: serial("id").primaryKey(),
  taskId: integer("task_id").notNull(),
  title: text("title").notNull(),
  description: text("description"),
  completed: boolean("completed").default(false),
  sortOrder: integer("sort_order").default(0),
  section: text("section"), // Optional grouping section (e.g., "Planning", "Execution", "Completion")
  assignedTo: text("assigned_to"),
  dueDate: date("due_date"),
  contactIds: text("contact_ids").array(), // Array of contact IDs tagged to this blocker item
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChecklistItemSchema = createInsertSchema(checklistItems).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChecklistItem = typeof checklistItems.$inferSelect;
export type InsertChecklistItem = z.infer<typeof insertChecklistItemSchema>;

// Checklist Item Comments Schema
export const checklistItemComments = pgTable("checklist_item_comments", {
  id: serial("id").primaryKey(),
  checklistItemId: integer("checklist_item_id").notNull(),
  parentId: integer("parent_id"), // For reply threading
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertChecklistItemCommentSchema = createInsertSchema(checklistItemComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type ChecklistItemComment = typeof checklistItemComments.$inferSelect;
export type InsertChecklistItemComment = z.infer<typeof insertChecklistItemCommentSchema>;

// Subtask Comments Schema
export const subtaskComments = pgTable("subtask_comments", {
  id: serial("id").primaryKey(),
  subtaskId: integer("subtask_id").notNull(),
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  sectionId: integer("section_id"), // Optional: for section-specific comments
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSubtaskCommentSchema = createInsertSchema(subtaskComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SubtaskComment = typeof subtaskComments.$inferSelect;
export type InsertSubtaskComment = z.infer<typeof insertSubtaskCommentSchema>;

// Section States Schema - for storing combined sections and other section states
export const sectionStates = pgTable("section_states", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "task", "subtask", "project", etc.
  entityId: integer("entity_id").notNull(), // ID of the task, subtask, etc.
  fieldName: text("field_name").notNull(), // "description", "notes", etc.
  combinedSections: text("combined_sections").array(), // Array of section indices that are combined
  cautionSections: text("caution_sections").array(), // Array of section indices marked as caution
  flaggedSections: text("flagged_sections").array(), // Array of section indices marked as flagged
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSectionStateSchema = createInsertSchema(sectionStates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SectionState = typeof sectionStates.$inferSelect;
export type InsertSectionState = z.infer<typeof insertSectionStateSchema>;

// Section Comments Schema - for inline comments on specific sections
export const sectionComments = pgTable("section_comments", {
  id: serial("id").primaryKey(),
  entityType: text("entity_type").notNull(), // "task", "subtask", "project", etc.
  entityId: integer("entity_id").notNull(), // ID of the task, subtask, etc.
  fieldName: text("field_name").notNull(), // "description", "notes", etc.
  sectionIndex: integer("section_index").notNull(), // Index of the section being commented on
  content: text("content").notNull(),
  authorName: text("author_name").notNull(),
  authorContactId: integer("author_contact_id"), // Optional: link to contact if author is a contact
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertSectionCommentSchema = createInsertSchema(sectionComments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type SectionComment = typeof sectionComments.$inferSelect;
export type InsertSectionComment = z.infer<typeof insertSectionCommentSchema>;

export type GlobalSettings = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = z.infer<typeof insertGlobalSettingsSchema>;

// AI Context Templates Schema - for reusable AI/LLM context configurations
export const aiContextTemplates = pgTable("ai_context_templates", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  contextData: text("context_data").notNull(), // JSON stringified ContextData
  isGlobal: boolean("is_global").default(false), // Available to all projects
  projectId: integer("project_id"), // null for global templates
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertAiContextTemplateSchema = createInsertSchema(aiContextTemplates).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export type AiContextTemplate = typeof aiContextTemplates.$inferSelect;
export type InsertAiContextTemplate = z.infer<typeof insertAiContextTemplateSchema>;
