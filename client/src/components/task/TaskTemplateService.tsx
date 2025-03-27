import { Task } from "@/types";
import { TaskTemplate } from "@/../../shared/taskTemplates";

/**
 * Template functionality has been completely removed from the application
 * These are placeholder functions for backward compatibility only
 */

// Export a no-op function for backward compatibility
export async function fetchTemplates(): Promise<void> {
  console.log("Task templates have been removed from the application");
  return Promise.resolve();
}

// Return empty arrays since templates are removed
export function getAllTaskTemplates(): TaskTemplate[] {
  return [];
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  return [];
}

export function getTemplatesByTier2(
  tier1: string,
  tier2: string
): TaskTemplate[] {
  return [];
}

// Simplified empty function for backward compatibility
export function templateToTask(template: TaskTemplate, projectId: number): Task {
  return {
    id: 0,
    title: "",
    description: "",
    status: "not_started",
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0],
    projectId: projectId,
    tier1Category: "",
    tier2Category: "",
    category: "",
    templateId: "",
    materialIds: [],
    contactIds: []
  };
}

// Filter and return tasks (simplified version without templates)
export function getMergedTasks(
  realTasks: Task[],
  projectId: number,
  filter?: {
    tier1?: string;
    tier2?: string;
  }
): Task[] {
  if (!realTasks) {
    return [];
  }
  
  // Filter by project ID if specified
  let filteredTasks = realTasks;
  if (projectId > 0) {
    filteredTasks = filteredTasks.filter(task => task.projectId === projectId);
  }
  
  // Filter by categories if specified
  if (filter && (filter.tier1 || filter.tier2)) {
    filteredTasks = filterTasksByCategories(filteredTasks, filter);
  }
  
  return filteredTasks;
}

// Always returns false as there are no more template tasks
export function isTemplateTask(task: Task): boolean {
  return false;
}

// Filter tasks by category (kept for backwards compatibility)
export function filterTasksByCategories(
  tasks: Task[],
  filter?: {
    tier1?: string;
    tier2?: string;
  }
): Task[] {
  if (!filter || (!filter.tier1 && !filter.tier2)) {
    return tasks;
  }
  
  return tasks.filter(task => {
    if (filter.tier1 && filter.tier2) {
      return (
        task.tier1Category?.toLowerCase() === filter.tier1.toLowerCase() &&
        task.tier2Category?.toLowerCase() === filter.tier2.toLowerCase()
      );
    } else if (filter.tier1) {
      return task.tier1Category?.toLowerCase() === filter.tier1.toLowerCase();
    }
    return true;
  });
}