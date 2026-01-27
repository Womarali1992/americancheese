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
  // Color theme preference for this project
  colorTheme: text("color_theme"), // Store selected color theme key (e.g., "earth-tone", "futuristic")
  useGlobalTheme: boolean("use_global_theme").default(true), // Whether to use global theme instead of project-specific theme
  // Category preset used for this project
  presetId: text("preset_id").default("home-builder"), // Default to Home Builder preset
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
});

// UNIFIED CATEGORY SYSTEM: ProjectCategories as Single Source of Truth
// This replaces all other category tables (categories, categoryTemplates, categoryTemplatesSets, etc.)
export const projectCategories = pgTable("project_categories", {
  id: serial("id").primaryKey(),
  projectId: integer("project_id").notNull(),
  name: text("name").notNull(),
  type: text("type").notNull(), // "tier1" or "tier2"
  parentId: integer("parent_id"), // For tier2 categories, references the tier1 category within the same project
  color: text("color"), // Optional color for the category (hex code or color name)
  description: text("description"), // Optional description of the category
  sortOrder: integer("sort_order").default(0), // For ordering categories
  // Template tracking
  isFromTemplate: boolean("is_from_template").default(false), // Whether this was created from a template
  templateSource: text("template_source"), // Which preset this came from (e.g., "home-builder")
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

export const insertProjectCategorySchema = createInsertSchema(projectCategories).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

// Task Schema - Updated to use projectCategories
export const tasks = pgTable("tasks", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  projectId: integer("project_id").notNull(),
  // SIMPLIFIED: Single categoryId field references projectCategories
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - DEPRECATED but kept for migration compatibility
  tier1Category: text("tier1_category"), // DEPRECATED: Will be removed after migration
  tier2Category: text("tier2_category"), // DEPRECATED: Will be removed after migration
  category: text("category").default("other"), // DEPRECATED: Will be removed after migration
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

export const insertTaskSchema = createInsertSchema(tasks).omit({
  id: true,
});

// Materials Schema - Updated to use projectCategories
export const materials = pgTable("materials", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  materialSize: text("material_size"), // New field for material size (e.g., 2x4, 4x8, etc.)
  type: text("type").notNull(),
  // SIMPLIFIED: Single categoryId field references projectCategories
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - DEPRECATED but kept for migration compatibility
  category: text("category").default("other"), // DEPRECATED: Will be removed after migration
  tier: text("tier").default("subcategory-one"), // DEPRECATED: Will be removed after migration
  tier2Category: text("tier2category"), // DEPRECATED: Will be removed after migration
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

// Labor Schema - Updated to use projectCategories
export const labor = pgTable("labor", {
  id: serial("id").primaryKey(),
  fullName: text("full_name").notNull(),
  // SIMPLIFIED: Single categoryId field references projectCategories
  categoryId: integer("category_id"), // Reference to projectCategories table
  // Legacy fields - DEPRECATED but kept for migration compatibility
  tier1Category: text("tier1_category"), // DEPRECATED: Will be removed after migration
  tier2Category: text("tier2_category"), // DEPRECATED: Will be removed after migration
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

// Contact Schema (unchanged)
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

// Rest of the schemas remain the same...
// (Subtasks, Expenses, Task Attachments, Invoices, etc. - unchanged for brevity)

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

export const insertSubtaskSchema = createInsertSchema(subtasks).omit({
  id: true,
});

// ========================================
// DEPRECATED TABLES - TO BE REMOVED AFTER MIGRATION
// ========================================

// DEPRECATED: Generic Category System - TO BE REMOVED
// This will be replaced entirely by projectCategories
export const categories = pgTable("categories", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  slug: text("slug").notNull().unique(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  parentId: integer("parent_id"),
  level: integer("level").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  isActive: boolean("is_active").default(true),
  isSystem: boolean("is_system").default(false),
  projectId: integer("project_id"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// DEPRECATED: Category Templates - TO BE REMOVED
// Template functionality will be moved to preset system
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

// DEPRECATED: Category Template Sets - TO BE REMOVED
export const categoryTemplatesSets = pgTable("category_template_sets", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  isDefault: boolean("is_default").default(false),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// DEPRECATED: Category Template Items - TO BE REMOVED
export const categoryTemplateItems = pgTable("category_template_items", {
  id: serial("id").primaryKey(),
  templateSetId: integer("template_set_id").notNull(),
  name: text("name").notNull(),
  slug: text("slug").notNull(),
  description: text("description"),
  color: text("color"),
  icon: text("icon"),
  parentSlug: text("parent_slug"),
  level: integer("level").notNull().default(1),
  sortOrder: integer("sort_order").default(0),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// Type exports for the simplified system
export type Project = typeof projects.$inferSelect;
export type InsertProject = z.infer<typeof insertProjectSchema>;

export type ProjectCategory = typeof projectCategories.$inferSelect;
export type InsertProjectCategory = z.infer<typeof insertProjectCategorySchema>;

export type Task = typeof tasks.$inferSelect;
export type InsertTask = z.infer<typeof insertTaskSchema>;

export type Material = typeof materials.$inferSelect;
export type InsertMaterial = z.infer<typeof insertMaterialSchema>;

export type Labor = typeof labor.$inferSelect;
export type InsertLabor = z.infer<typeof insertLaborSchema>;

export type Contact = typeof contacts.$inferSelect;
export type InsertContact = z.infer<typeof insertContactSchema>;

export type Subtask = typeof subtasks.$inferSelect;
export type InsertSubtask = z.infer<typeof insertSubtaskSchema>;

// MIGRATION SUMMARY:
// 1. projectCategories becomes the single source of truth for all categories
// 2. tasks.categoryId, materials.categoryId, labor.categoryId all reference projectCategories
// 3. Legacy tier1Category/tier2Category fields are marked DEPRECATED
// 4. All other category tables (categories, categoryTemplates, etc.) are marked DEPRECATED
// 5. Template functionality moves to preset system in presets.ts
// 6. Color management stays with projectCategories.color field