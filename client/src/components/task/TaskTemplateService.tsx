import { Task } from "@/types";
import { 
  TaskTemplate, 
  getAllTaskTemplates as getSharedTaskTemplates,
  getTemplatesByTier1 as getSharedTemplatesByTier1,
  getTemplatesByTier2 as getSharedTemplatesByTier2
} from "@/../../shared/taskTemplates";

// Simple implementation - just directly use the shared hardcoded templates
// This eliminates all the API fetching, caching, and duplicated loading

// Export the original function to maintain backward compatibility
// but make it a no-op that just logs
export async function fetchTemplates(): Promise<void> {
  console.log("fetchTemplates is now a no-op - using hardcoded templates");
  return Promise.resolve();
}

// Just pass through to the shared templates module
export function getAllTaskTemplates(): TaskTemplate[] {
  return getSharedTaskTemplates();
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  return getSharedTemplatesByTier1(tier1);
}

export function getTemplatesByTier2(
  tier1: string,
  tier2: string
): TaskTemplate[] {
  return getSharedTemplatesByTier2(tier1, tier2);
}

export function templateToTask(template: TaskTemplate, projectId: number): Task {
  return {
    id: 0, // This will be assigned by the backend
    title: template.title,
    description: template.description,
    status: "not_started",
    startDate: new Date().toISOString().split('T')[0], // Today as YYYY-MM-DD
    endDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // Today + estimated duration
    projectId: projectId,
    tier1Category: template.tier1Category,
    tier2Category: template.tier2Category,
    category: template.category,
    templateId: template.id, // Store reference to template
    materialIds: [], // Initialize empty arrays for materialIds and contactIds
    contactIds: []
  };
}

export function getMergedTasks(
  realTasks: Task[],
  projectId: number,
  filter?: {
    tier1?: string;
    tier2?: string;
  }
): Task[] {
  // If no real tasks are provided, return an empty array
  if (!realTasks) {
    realTasks = [];
  }
  
  // Get templates matching the filter
  let templates: TaskTemplate[] = [];
  
  if (filter?.tier1 && filter?.tier2) {
    templates = getTemplatesByTier2(filter.tier1, filter.tier2);
  } else if (filter?.tier1) {
    templates = getTemplatesByTier1(filter.tier1);
  } else {
    templates = getAllTaskTemplates();
  }
  
  // Filter out templates that already have a corresponding task
  const existingTemplateIds = realTasks
    .filter(task => task.templateId)
    .map(task => task.templateId);
  
  const filteredTemplates = templates.filter(
    template => !existingTemplateIds.includes(template.id)
  );
  
  // Convert templates to tasks with unique negative IDs to avoid UI key conflicts
  const templateTasks = filteredTemplates.map((template, index) => {
    const task = templateToTask(template, projectId);
    // Assign a unique negative ID to avoid conflicts with real tasks (which have positive IDs)
    task.id = -(index + 1); 
    return task;
  });
  
  // Create a copy of real tasks to avoid mutating the original
  const realTasksCopy = [...realTasks];
  
  // Return merged tasks and sort by templateId
  const mergedTasks = [...realTasksCopy, ...templateTasks];
  
  // Sort tasks: first by real tasks vs template tasks, then by templateId
  return mergedTasks.sort((a, b) => {
    // First criterion: real tasks (positive IDs) come before template tasks (negative IDs)
    if ((a.id > 0 && b.id < 0) || (a.id < 0 && b.id > 0)) {
      return a.id > 0 ? -1 : 1;
    }
    
    // Second criterion: sort by template ID (e.g., 'FR1', 'FR2', etc.)
    if (a.templateId && b.templateId) {
      // Extract the numeric part if the template ID has a consistent format (e.g., "FR1", "SC2")
      const aMatch = a.templateId.match(/([A-Z]+)(\d+)/);
      const bMatch = b.templateId.match(/([A-Z]+)(\d+)/);
      
      if (aMatch && bMatch) {
        // If both have the same prefix (e.g., "FR"), sort by number
        if (aMatch[1] === bMatch[1]) {
          return parseInt(aMatch[2]) - parseInt(bMatch[2]);
        }
        // Otherwise sort alphabetically by prefix
        return aMatch[1].localeCompare(bMatch[1]);
      }
    }
    
    // Default to sort by title if template IDs are not available or comparable
    return (a.title || '').localeCompare(b.title || '');
  });
}

export function isTemplateTask(task: Task): boolean {
  return Boolean(task.templateId);
}

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