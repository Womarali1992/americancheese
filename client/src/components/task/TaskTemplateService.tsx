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

// We'll initialize the cache on-demand when templates are requested
// This prevents duplicate API calls when components explicitly call fetchTemplates()
let templateCacheInitialized = false;

// Helper function to initialize the cache if it hasn't been initialized yet
const ensureTemplateCache = async (): Promise<void> => {
  if (!templateCacheInitialized && taskTemplatesCache.allTemplates.length === 0) {
    console.log("Initializing template cache on first request");
    try {
      await fetchTemplates();
      templateCacheInitialized = true;
    } catch (error) {
      console.error("Error initializing template cache:", error);
    }
  }
};

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

// We need a synchronous getter for templates, but we should ensure cache is initialized
// To do this, we'll make a "lazy initialization" approach that returns cached data
// but also triggers an async update if cache is empty
export function getAllTaskTemplates(): TaskTemplate[] {
  // Trigger async initialization if cache is empty (no await - just kick it off)
  if (taskTemplatesCache.allTemplates.length === 0) {
    console.log("Template cache is empty, triggering async initialization");
    ensureTemplateCache().catch(error => {
      console.error("Error in async template cache initialization:", error);
    });
    
    // If cache is empty, initialize with shared templates for immediate use
    // The async fetch will update the cache later with API data
    if (taskTemplatesCache.allTemplates.length === 0) {
      taskTemplatesCache.allTemplates = getSharedTaskTemplates();
      populateTemplateCaches();
      console.log("Initialized with shared templates while waiting for API");
    }
  }
  
  return [...taskTemplatesCache.allTemplates];
}

export function getTemplatesByTier1(tier1: string): TaskTemplate[] {
  // Make sure templates are loaded
  if (taskTemplatesCache.allTemplates.length === 0) {
    getAllTaskTemplates(); // This will trigger cache initialization if needed
  }
  
  const tier1Key = tier1.toLowerCase();
  return taskTemplatesCache.templatesByTier1[tier1Key] || [];
}

export function getTemplatesByTier2(
  tier1: string,
  tier2: string
): TaskTemplate[] {
  // Make sure templates are loaded
  if (taskTemplatesCache.allTemplates.length === 0) {
    getAllTaskTemplates(); // This will trigger cache initialization if needed
  }
  
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