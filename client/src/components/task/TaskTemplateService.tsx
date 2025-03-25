import { Task } from "@/types";
import { 
  TaskTemplate, 
  getAllTaskTemplates as getSharedTaskTemplates 
} from "@/../../shared/taskTemplates";

// Template cache - will be initialized by API, fallback to shared templates if needed
const taskTemplatesCache: {
  allTemplates: TaskTemplate[],
  templatesByTier1: Record<string, TaskTemplate[]>,
  templatesByTier2: Record<string, Record<string, TaskTemplate[]>>
} = {
  allTemplates: [], // Empty array initially, will be populated from API
  templatesByTier1: {},
  templatesByTier2: {}
};

// Initialize cache immediately when this module loads
(function initializeTemplateCache() {
  console.log("Initializing template cache");
  
  // Fetch from API first to load templates (asynchronous)
  fetchTemplates().catch(error => {
    console.error("Error loading templates from API:", error);
    // Only fallback to shared templates if API fetch fails
    if (taskTemplatesCache.allTemplates.length === 0) {
      taskTemplatesCache.allTemplates = getSharedTaskTemplates();
      populateTemplateCaches();
      console.log("Fallback to shared templates after API error");
    }
  });
})();

// Fetch task templates from the API
export async function fetchTemplates(): Promise<void> {
  try {
    // Fetch templates from the API
    const response = await fetch('/api/task-templates');
    
    if (!response.ok) {
      throw new Error('Failed to fetch task templates from API');
    }
    
    // Get template data from the API
    const templateData = await response.json();
    
    // If we have template data from the API, use it
    if (templateData && Array.isArray(templateData) && templateData.length > 0) {
      // Convert API data to TaskTemplate format
      const templates: TaskTemplate[] = templateData.map(template => {
        return {
          id: template.id.toString(),
          title: template.title,
          description: template.description || "",
          tier1Category: template.tier1Category || "",
          tier2Category: template.tier2Category || "",
          category: template.category || "",
          estimatedDuration: template.estimatedDuration || 2
        };
      });
      
      // Store templates in cache
      taskTemplatesCache.allTemplates = templates;
      console.log(`Successfully loaded templates from API: ${templates.length}`);
      
      // Populate tier1 and tier2 caches
      populateTemplateCaches();
    } else {
      console.log("No templates found in API response, using shared templates");
      const sharedTemplates = getSharedTaskTemplates();
      taskTemplatesCache.allTemplates = sharedTemplates;
      populateTemplateCaches();
    }
  } catch (error) {
    console.error("Error fetching templates from API:", error);
    // Fallback to shared templates if we haven't loaded any templates yet
    if (taskTemplatesCache.allTemplates.length === 0) {
      const sharedTemplates = getSharedTaskTemplates();
      taskTemplatesCache.allTemplates = sharedTemplates;
      populateTemplateCaches();
    }
  }
}

function populateTemplateCaches(): void {
  // Clear existing caches
  taskTemplatesCache.templatesByTier1 = {};
  taskTemplatesCache.templatesByTier2 = {};
  
  // Group templates by tier1 category
  taskTemplatesCache.allTemplates.forEach(template => {
    const tier1 = template.tier1Category.toLowerCase();
    const tier2 = template.tier2Category.toLowerCase();
    
    // Initialize tier1 array if it doesn't exist
    if (!taskTemplatesCache.templatesByTier1[tier1]) {
      taskTemplatesCache.templatesByTier1[tier1] = [];
    }
    
    // Add template to tier1 array
    taskTemplatesCache.templatesByTier1[tier1].push(template);
    
    // Initialize tier2 object and array if they don't exist
    if (!taskTemplatesCache.templatesByTier2[tier1]) {
      taskTemplatesCache.templatesByTier2[tier1] = {};
    }
    
    if (!taskTemplatesCache.templatesByTier2[tier1][tier2]) {
      taskTemplatesCache.templatesByTier2[tier1][tier2] = [];
    }
    
    // Add template to tier2 array
    taskTemplatesCache.templatesByTier2[tier1][tier2].push(template);
  });
}

export function getAllTaskTemplates(): TaskTemplate[] {
  return [...taskTemplatesCache.allTemplates];
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  const tier1Key = tier1.toLowerCase();
  return taskTemplatesCache.templatesByTier1[tier1Key] || [];
}

export function getTemplatesByTier2(
  tier1: string,
  tier2: string
): TaskTemplate[] {
  const tier1Key = tier1.toLowerCase();
  const tier2Key = tier2.toLowerCase();
  
  if (
    !taskTemplatesCache.templatesByTier2[tier1Key] ||
    !taskTemplatesCache.templatesByTier2[tier1Key][tier2Key]
  ) {
    return [];
  }
  
  return taskTemplatesCache.templatesByTier2[tier1Key][tier2Key];
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
    templateId: template.id // Store reference to template
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
  
  // Convert templates to tasks
  const templateTasks = filteredTemplates.map(template =>
    templateToTask(template, projectId)
  );
  
  // Create a copy of real tasks to avoid mutating the original
  const realTasksCopy = [...realTasks];
  
  // Return merged tasks
  const mergedTasks = [...realTasksCopy, ...templateTasks];
  
  return mergedTasks;
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