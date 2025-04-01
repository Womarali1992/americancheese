import { pgTable, text, serial, integer, boolean, date, timestamp, doublePrecision } from "drizzle-orm/pg-core";
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
});

export const insertProjectSchema = createInsertSchema(projects).omit({
  id: true,
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
});

export const insertTaskSchema = createInsertSchema(tasks).omit({
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
  type: text("type").notNull(),
  category: text("category").notNull().default("other"), // wood, electrical, plumbing, etc.
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
  quoteDate: date("quote_date"), // Date when the quote was received
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
