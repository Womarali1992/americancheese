/**
 * Task templates have been removed from the application
 */

// Helper interface for task templates
export interface TaskTemplate {
  id: string; 
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

// Empty collection with no templates
export const taskTemplates: TaskTemplateCollection = {
  structural: {},
  systems: {},
  finishings: {},
};

// Helper functions return empty arrays or undefined since templates are removed

// Helper function to get all task templates as a flat array
export function getAllTaskTemplates(): TaskTemplate[] {
  return [];
}

// Helper function to get task template by ID
export function getTaskTemplateById(id: string): TaskTemplate | undefined {
  return undefined;
}

// Helper function to get templates by tier1 category
export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  return [];
}

// Helper function to get templates by tier1 and tier2 categories
export function getTemplatesByTier2(
  tier1: string,
  tier2: string,
): TaskTemplate[] {
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