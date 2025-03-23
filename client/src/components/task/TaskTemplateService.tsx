import { Task } from "@/types";

// Import the TaskTemplate interface locally rather than from the shared file
interface TaskTemplate {
  id: string;
  title: string;
  description: string;
  tier1Category: string;
  tier2Category: string;
  category: string;
  estimatedDuration: number;
}

// Import the templates data using dynamic import
const taskTemplatesCache: {
  allTemplates: TaskTemplate[] | null,
  templatesByTier1: Record<string, TaskTemplate[]>,
  templatesByTier2: Record<string, Record<string, TaskTemplate[]>>
} = {
  allTemplates: null,
  templatesByTier1: {},
  templatesByTier2: {}
};

// Fetch task templates from API
export async function fetchTemplates(): Promise<void> {
  if (taskTemplatesCache.allTemplates) {
    return; // Already fetched
  }
  
  try {
    const response = await fetch('/api/task-templates');
    if (!response.ok) {
      throw new Error(`Failed to fetch templates: ${response.status}`);
    }
    const data = await response.json();
    taskTemplatesCache.allTemplates = data;
    console.log("Fetched task templates:", data);
  } catch (error) {
    console.error("Error fetching task templates:", error);
    // Provide a minimal set of templates if API fails
    taskTemplatesCache.allTemplates = [
      {
        id: "FN1", 
        title: "Site Preparation",
        description: "Clear and prepare the site for foundation work",
        tier1Category: "structural",
        tier2Category: "foundation",
        category: "preparation",
        estimatedDuration: 3
      },
      {
        id: "FR1",
        title: "Floor Framing",
        description: "Construct the floor framing system",
        tier1Category: "structural",
        tier2Category: "framing",
        category: "floor",
        estimatedDuration: 4
      }
    ];
  }
}

// Helper functions to navigate the template structure
export function getAllTaskTemplates(): TaskTemplate[] {
  if (!taskTemplatesCache.allTemplates) {
    // If we haven't loaded templates yet, return an empty array
    // This will be fixed when we properly implement the async loading
    return [];
  }
  return taskTemplatesCache.allTemplates;
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  if (taskTemplatesCache.templatesByTier1[tier1]) {
    return taskTemplatesCache.templatesByTier1[tier1];
  }
  
  // Filter all templates by tier1 category
  const templates = getAllTaskTemplates().filter(
    template => template.tier1Category === tier1
  );
  
  // Cache for future use
  taskTemplatesCache.templatesByTier1[tier1] = templates;
  return templates;
}

export function getTemplatesByTier2(tier1: string, tier2: string): TaskTemplate[] {
  if (taskTemplatesCache.templatesByTier2[tier1]?.[tier2]) {
    return taskTemplatesCache.templatesByTier2[tier1][tier2];
  }
  
  // Filter all templates by tier1 and tier2 categories
  const templates = getAllTaskTemplates().filter(
    template => template.tier1Category === tier1 && template.tier2Category === tier2
  );
  
  // Initialize tier1 cache if it doesn't exist
  if (!taskTemplatesCache.templatesByTier2[tier1]) {
    taskTemplatesCache.templatesByTier2[tier1] = {};
  }
  
  // Cache for future use
  taskTemplatesCache.templatesByTier2[tier1][tier2] = templates;
  return templates;
}

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