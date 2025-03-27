/**
 * Predefined task templates for construction projects - Generated from CSV
 * These templates will be available for selection when associating materials with tasks,
 * even if they haven't been created as active tasks in the system yet.
 */

// Helper interface for task templates
export interface TaskTemplate {
  id: string; // Using a string ID format like "FN1" for easier identification
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number; // In days
}

// Organize templates by tier1 and tier2 categories
export interface TaskTemplateCollection {
  [tier1: string]: {
    [tier2: string]: TaskTemplate[];
  };
}

// Task template data from CSV file
// Trim tasks
const trimTasks: TaskTemplate[] = [
  {
    id: "TR20",
    title: "Finalize Trim Subcontract – TR20",
    description: "Install and adjust all hardware including pulls CB13,Seal and Finish Cabinetry – CB13,Caulk all joints between cabinetry and walls for a finished appearance. (CB13),finishings,cabinentry CB14,Inspect and Touch Up Cabinetry – CB14,",
    tier1Category: "finishings",
    tier2Category: "trim",
    category: "trim",
    estimatedDuration: 7,
  },
];

// Cabinentry tasks
const cabinentryTasks: TaskTemplate[] = [
  {
    id: "CB16",
    title: "Finalize Cabinetry Subcontract – CB16",
    description: "Apply tile adhesive FL11,Grout and Seal Tile Flooring – FL11,",
    tier1Category: "finishings",
    tier2Category: "cabinentry",
    category: "cabinentry",
    estimatedDuration: 7,
  },
];

// Organize all templates into a single, structured collection
export const taskTemplates: TaskTemplateCollection = {
  finishings: {
    trim: trimTasks,
    cabinentry: cabinentryTasks,
  },
};

// Helper function to get all task templates as a flat array
export function getAllTaskTemplates(): TaskTemplate[] {
  const allTemplates: TaskTemplate[] = [];

  Object.values(taskTemplates).forEach((tier1Category) => {
    Object.values(tier1Category).forEach((templatesArray) => {
      allTemplates.push(...templatesArray);
    });
  });

  return allTemplates;
}

// Helper function to get task template by ID
export function getTaskTemplateById(id: string): TaskTemplate | undefined {
  return getAllTaskTemplates().find((template) => template.id === id);
}

// Helper function to get templates by tier1 category
export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  const templates: TaskTemplate[] = [];

  if (taskTemplates[tier1]) {
    Object.values(taskTemplates[tier1]).forEach((templatesArray) => {
      templates.push(...templatesArray);
    });
  }

  return templates;
}

// Helper function to get templates by tier1 and tier2 categories
export function getTemplatesByTier2(
  tier1: string,
  tier2: string,
): TaskTemplate[] {
  if (taskTemplates[tier1] && taskTemplates[tier1][tier2]) {
    return taskTemplates[tier1][tier2];
  }
  return [];
}

// Helper function for filtering tasks by task template categories
export function filterTasksByCategories(
  tasks: any[],
  filter: { tier1?: string; tier2?: string }
): any[] {
  if (!filter) {
    return tasks;
  }

  return tasks.filter((task) => {
    if (filter.tier1 && task.tier1Category !== filter.tier1) {
      return false;
    }
    if (filter.tier2 && task.tier2Category !== filter.tier2) {
      return false;
    }
    return true;
  });
}
