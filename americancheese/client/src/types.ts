/**
 * Common type definitions for the construction management application
 * These types are kept in sync with the database schema in shared/schema.ts
 */

export interface Project {
  id: number;
  name: string;
  description: string | null;
  location: string;
  startDate: string;
  endDate: string;
  status: string;
  progress: number;
  hiddenCategories: string[] | null; // Categories that should be hidden from view
  selectedTemplates: string[] | null; // Selected template IDs
  colorTheme: string | null; // Project-specific color theme
  useGlobalTheme: boolean | null; // Whether to use global theme
  presetId: string | null; // Category preset used for this project
}

export interface Task {
  id: number;
  title: string;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo: string | null;
  projectId: number;
  completed: boolean | null;
  category: string | null;
  categoryId: number | null; // Reference to projectCategories table
  tier1Category: string | null;
  tier2Category: string | null;
  // Category colors from database
  tier1Color?: string | null;
  tier2Color?: string | null;
  contactIds: string[] | null;
  materialIds: string[] | null;
  materialsNeeded: string | null;
  templateId: string | null; // Reference to template if created from template
  estimatedCost: number | null; // Estimated cost for the task
  actualCost: number | null; // Actual cost after task completion
  parentTaskId: number | null; // Reference to parent task for subtasks
  sortOrder: number | null; // Order within parent task
  calendarActive: boolean | null; // Show on calendar
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  company: string | null;
  phone: string | null;
  email: string | null;
  type: string;
  category: string;
  initials: string | null;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  quantity: number;
  supplier: string | null;
  supplierId: number | null;
  status: string;
  projectId: number;
  taskIds: string[] | null;
  contactIds: string[] | null;
  category: string | null;
  categoryId: number | null; // Reference to projectCategories table
  // Hierarchical categorization fields
  tier: string | null;
  tier1Category: string | null;  // Alias for tier
  tier2Category: string | null;
  // Category colors from database
  tier1Color?: string | null;
  tier2Color?: string | null;
  section: string | null;
  subsection: string | null;
  unit: string | null;
  cost: number | null;
  isQuote: boolean;
  quoteDate: string | null;
  quoteNumber: string | null;
  orderDate: string | null;
  details: string | null;
  materialSize: string | null;
}

export interface Labor {
  id: number;
  fullName: string;
  categoryId: number | null;
  tier1Category: string | null;
  tier2Category: string | null;
  company: string;
  phone: string | null;
  email: string | null;
  projectId: number;
  taskId: number | null;
  contactId: number;
  workDate: string;
  taskDescription: string | null;
  workDescription: string | null;
  areaOfWork: string | null;
  startDate: string;
  endDate: string;
  startTime: string | null;
  endTime: string | null;
  totalHours: number | null;
  laborCost: number | null;
  unitsCompleted: string | null;
  isQuote: boolean | null;
  materialIds: string[] | null;
  status: string;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  projectId: number;
  vendor: string | null;
  status: string;
  contactIds: string[] | null;
  materialIds: string[] | null;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  uploadedAt: Date;
  notes: string | null;
  type: string;
}

/**
 * Represents a category for task templates (tier1 or tier2)
 */
export interface TemplateCategory {
  id: number;
  name: string;
  type: string; // 'tier1' or 'tier2'
  parentId: number | null;
  color: string | null; // Custom color for this category
  description: string | null;
  sortOrder: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}

/**
 * Represents a project-specific category
 */
export interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: string; // 'tier1' or 'tier2'
  parentId: number | null;
  color: string | null;
  description: string | null;
  templateId: number | null;
  sortOrder: number | null;
  createdAt: Date | null;
  updatedAt: Date | null;
}