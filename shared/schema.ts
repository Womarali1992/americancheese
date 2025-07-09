import { pgTable, text, serial, integer, boolean, date, timestamp, doublePrecision, time } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Project Schema
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  location: text("location").notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
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
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// Global Settings Schema
export const globalSettings = pgTable("global_settings", {
  id: serial("id").primaryKey(),
  key: text("key").notNull().unique(), // Setting key (e.g., "default_color_theme")
  value: text("value").notNull(), // Setting value (e.g., "earth-tone")
  description: text("description"), // Optional description of the setting
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const insertGlobalSettingsSchema = createInsertSchema(globalSettings).omit({
  id: true,
  updatedAt: true,
});

// Task Schema
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  // Three-tier category system
  tier1Category: text("tier1_category").notNull().default("Structural"), // Structural, Systems, Sheathing, Finishings
  tier2Category: text("tier2_category").notNull().default("Foundation"), // Foundation, Framing, Electrical, Plumbing, etc.
  category: text("category").notNull().default("other"), // Legacy field, keeping for backward compatibility
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
  category: text("category").notNull().default("other"), // wood, electrical, plumbing, etc.
  // Four-tier category system matching tasks
  tier: text("tier").notNull().default("structural"), // structural, systems, sheathing, finishings
  tier2Category: text("tier2category"), // Foundation, Framing, Electrical, Plumbing, etc.
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
  // Trade type/role uses the same tier structure as materials and tasks
  tier1Category: text("tier1_category").notNull(), // Structural, Systems, Sheathing, Finishings
  tier2Category: text("tier2_category").notNull(), // Foundation, Framing, Electrical, Plumbing, etc.
  company: text("company").notNull(),
  phone: text("phone"),
  email: text("email"),
  projectId: integer("project_id").notNull(),
  taskId: integer("task_id"),  // The associated task
  contactId: integer("contact_id").notNull(), // Reference to a contact
  workDate: date("work_date").notNull(), // Legacy date field required by database
  // Work Details
  taskDescription: text("task_description"),
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

export type GlobalSettings = typeof globalSettings.$inferSelect;
export type InsertGlobalSettings = z.infer<typeof insertGlobalSettingsSchema>;
