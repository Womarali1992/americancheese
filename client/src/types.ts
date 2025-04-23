/**
 * Common type definitions for the construction management application
 */

export interface Project {
  id: number;
  name: string;
  description?: string | null;
  location?: string;
  startDate: string;
  endDate: string;
  status: string;
  progress?: number;
  hiddenCategories?: string[]; // Categories that should be hidden from view
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  status: string;
  startDate: string;
  endDate: string;
  assignedTo?: string | null;
  projectId: number;
  completed?: boolean | null;
  category?: string;
  tier1Category?: string;
  tier2Category?: string;
  contactIds?: string[] | number[] | null;
  materialIds?: string[] | number[] | null;
  materialsNeeded?: string | null;
  templateId?: string; // Special field for template tasks
  estimatedCost?: number | null; // Estimated cost for the task
  actualCost?: number | null; // Actual cost after task completion
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  type: string;
  initials?: string | null;
}

export interface Material {
  id: number;
  name: string;
  type: string;
  quantity: number;
  supplier?: string | null;
  supplierId?: number | null;
  status: string;
  projectId: number;
  taskIds?: (number | string)[];  // Allow both number and string IDs to match server
  contactIds?: (number | string)[];  // Allow both number and string IDs
  category?: string;
  // Hierarchical categorization fields
  tier?: string | null;
  tier2Category?: string | null;
  section?: string | null;
  subsection?: string | null;
  unit?: string | null;
  cost?: number | null;
  isQuote?: boolean;
  quoteDate?: string | null;
  orderDate?: string | null;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  projectId: number;
  vendor?: string | null;
  status?: string;
  contactIds?: number[] | string[] | null;
  materialIds?: number[] | string[] | null;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileSize: number;
  fileContent: string;
  uploadedAt: string;
  notes: string | null;
  type: string;
}