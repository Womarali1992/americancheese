import { Task } from "../../types";
import { TaskTemplate, getAllTaskTemplates, getTemplatesByTier1, getTemplatesByTier2 } from "@/../../shared/taskTemplates";

/**
 * This service provides helper functions to work with task templates and merge them
 * with real tasks from the database to provide a seamless experience for selecting
 * tasks, even those that haven't been created yet.
 */

// Convert a template to a Task object that can be used in the UI
export function templateToTask(template: TaskTemplate, projectId: number): Task {
  return {
    id: -1, // Will be replaced with a temporary ID
    title: `${template.id}: ${template.title}`,
    description: template.description,
    status: "not_started",
    startDate: new Date().toISOString(),
    endDate: new Date(Date.now() + template.estimatedDuration * 24 * 60 * 60 * 1000).toISOString(),
    projectId: projectId,
    tier1Category: template.tier1Category,
    tier2Category: template.tier2Category,
    category: template.category,
    completed: false,
    contactIds: [],
    materialIds: [],
    materialsNeeded: null,
    // Add template ID as a special property to identify it
    templateId: template.id
  };
}

// Get a merged list of real tasks and template tasks
export function getMergedTasks(
  realTasks: Task[],
  projectId: number,
  selectedTier1?: string | null,
  selectedTier2?: string | null
): Task[] {
  // Get existing task IDs to avoid duplication
  const existingTaskTitles = new Set(realTasks.map(task => task.title));
  
  // Get templates based on selected tiers
  let templates: TaskTemplate[] = [];
  if (selectedTier1 && selectedTier2) {
    templates = getTemplatesByTier2(selectedTier1, selectedTier2);
  } else if (selectedTier1) {
    templates = getTemplatesByTier1(selectedTier1);
  } else {
    templates = getAllTaskTemplates();
  }
  
  // Convert templates to tasks, avoiding duplicates with real tasks
  const templateTasks = templates
    .filter(template => {
      const templateTitle = `${template.id}: ${template.title}`;
      return !existingTaskTitles.has(templateTitle);
    })
    .map((template, index) => {
      // Use negative IDs to avoid conflicts with real tasks
      const task = templateToTask(template, projectId);
      task.id = -(index + 1);
      return task;
    });
  
  // Merge real tasks with template tasks
  const mergedTasks = [...realTasks, ...templateTasks];
  
  return mergedTasks;
}

// Check if a task is a template task
export function isTemplateTask(task: Task): boolean {
  return task.id < 0 || (task as any).templateId !== undefined;
}

// Helper function to filter tasks by tier1 and tier2 categories
export function filterTasksByCategories(
  tasks: Task[],
  selectedTier1?: string | null,
  selectedTier2?: string | null
): Task[] {
  if (!selectedTier1 && !selectedTier2) return tasks;
  
  return tasks.filter(task => {
    const tier1Match = !selectedTier1 || task.tier1Category === selectedTier1;
    const tier2Match = !selectedTier2 || task.tier2Category === selectedTier2;
    return tier1Match && tier2Match;
  });
}