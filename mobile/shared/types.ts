// Mobile App Types - Simplified from web app schema
// These types match the API response structures

export interface Project {
  id: number;
  name: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  status: string;
  progress: number;
  hiddenCategories?: string[] | null;
  selectedTemplates?: string[] | null;
  colorTheme?: string | null;
  useGlobalTheme?: boolean | null;
  presetId?: string | null;
  structuredContext?: string | null;
}

export interface InsertProject {
  name: string;
  location: string;
  startDate?: string | null;
  endDate?: string | null;
  description?: string | null;
  status?: string;
  progress?: number;
  hiddenCategories?: string[] | null;
  selectedTemplates?: string[] | null;
  colorTheme?: string | null;
  useGlobalTheme?: boolean | null;
  presetId?: string | null;
  structuredContext?: string | null;
}

export interface Task {
  id: number;
  title: string;
  description?: string | null;
  projectId: number;
  categoryId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  category?: string | null;
  materialsNeeded?: string | null;
  startDate: string;
  endDate: string;
  status: string;
  assignedTo?: string | null;
  completed?: boolean | null;
  contactIds?: string[] | null;
  materialIds?: string[] | null;
  templateId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  parentTaskId?: number | null;
  sortOrder?: number | null;
}

export interface InsertTask {
  title: string;
  description?: string | null;
  projectId: number;
  categoryId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  category?: string | null;
  materialsNeeded?: string | null;
  startDate: string;
  endDate: string;
  status?: string;
  assignedTo?: string | null;
  completed?: boolean | null;
  contactIds?: string[] | null;
  materialIds?: string[] | null;
  templateId?: string | null;
  estimatedCost?: number | null;
  actualCost?: number | null;
  parentTaskId?: number | null;
  sortOrder?: number | null;
}

export interface Subtask {
  id: number;
  parentTaskId: number;
  title: string;
  description?: string | null;
  completed?: boolean | null;
  sortOrder?: number | null;
  assignedTo?: string | null;
  startDate?: string | null;
  endDate?: string | null;
  status: string;
  estimatedCost?: number | null;
  actualCost?: number | null;
}

export interface Contact {
  id: number;
  name: string;
  role: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  type: string;
  category: string;
  initials?: string | null;
}

export interface InsertContact {
  name: string;
  role: string;
  company?: string | null;
  phone?: string | null;
  email?: string | null;
  type: string;
  category?: string;
  initials?: string | null;
}

export interface Material {
  id: number;
  name: string;
  materialSize?: string | null;
  type: string;
  categoryId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  quantity: number;
  unit?: string | null;
  cost?: number | null;
  status?: string | null;
  supplierId?: number | null;
  projectId?: number | null;
  taskIds?: string[] | null;
  notes?: string | null;
  quoteDate?: string | null;
  quoteExpiration?: string | null;
  description?: string | null;
}

export interface InsertMaterial {
  name: string;
  materialSize?: string | null;
  type: string;
  categoryId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  quantity: number;
  unit?: string | null;
  cost?: number | null;
  status?: string | null;
  supplierId?: number | null;
  projectId?: number | null;
  taskIds?: string[] | null;
  notes?: string | null;
  quoteDate?: string | null;
  quoteExpiration?: string | null;
  description?: string | null;
}

export interface Labor {
  id: number;
  fullName: string;
  company?: string | null;
  projectId?: number | null;
  taskId?: number | null;
  contactId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  startDate: string;
  endDate: string;
  totalHours?: number | null;
  hourlyRate?: number | null;
  laborCost?: number | null;
  description?: string | null;
  status?: string | null;
}

export interface InsertLabor {
  fullName: string;
  company?: string | null;
  projectId?: number | null;
  taskId?: number | null;
  contactId?: number | null;
  tier1Category?: string | null;
  tier2Category?: string | null;
  startDate: string;
  endDate: string;
  totalHours?: number | null;
  hourlyRate?: number | null;
  laborCost?: number | null;
  description?: string | null;
  status?: string | null;
}

export interface Expense {
  id: number;
  description: string;
  amount: number;
  date: string;
  category: string;
  projectId: number;
  vendor?: string | null;
  materialIds?: string[] | null;
  contactIds?: string[] | null;
  status: string;
}

export interface ChecklistItem {
  id: number;
  taskId: number;
  title: string;
  completed?: boolean | null;
  sortOrder?: number | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface InsertChecklistItem {
  taskId: number;
  title: string;
  completed?: boolean | null;
  sortOrder?: number | null;
  dueDate?: string | null;
  notes?: string | null;
}

export interface TaskAttachment {
  id: number;
  taskId: number;
  fileName: string;
  fileType: string;
  fileData?: string | null;
  uploadedAt?: string | null;
  description?: string | null;
}

export interface ProjectCategory {
  id: number;
  projectId: number;
  name: string;
  type: "tier1" | "tier2";
  parentId?: number | null;
  color?: string | null;
  sortOrder?: number | null;
  description?: string | null;
}

// Tier 1 categories (top-level)
export type Tier1Category =
  | "structural"
  | "systems"
  | "sheathing"
  | "finishings"
  | "permitting"
  | string;

// Tier 2 categories (sub-categories)
export type Tier2Category =
  | "foundation"
  | "framing"
  | "electrical"
  | "plumbing"
  | "hvac"
  | "roofing"
  | "flooring"
  | "paint"
  | "fixtures"
  | "landscaping"
  | "drywall"
  | "insulation"
  | "windows"
  | "doors"
  | "cabinets"
  | "countertops"
  | "appliances"
  | string;

// Task status options
export type TaskStatus =
  | "not_started"
  | "pending"
  | "in_progress"
  | "completed"
  | "on_hold"
  | "cancelled";

// Project status options
export type ProjectStatus =
  | "active"
  | "on_hold"
  | "completed"
  | "cancelled";

// Material status options
export type MaterialStatus =
  | "pending"
  | "ordered"
  | "delivered"
  | "installed";

// Contact type options
export type ContactType =
  | "contractor"
  | "supplier"
  | "consultant"
  | "worker"
  | "other";
