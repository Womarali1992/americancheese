// Process CSV template file to extract task templates
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Simple and robust CSV processor
async function processSimpleCSV() {
  console.log('Starting CSV processing with simple parser...');
  
  // Find the CSV file
  let csvFilePath = path.join(__dirname, 'attached_assets', '1Task Temp - Task Temp.csv');
  if (!fs.existsSync(csvFilePath)) {
    // Try alternate location
    csvFilePath = './attached_assets/1Task Temp - Task Temp.csv';
    console.log('Trying alternate path for CSV file:', csvFilePath);
  }
  console.log('Looking for CSV file at:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }

  // Read the file content
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');
  
  // Split into lines and skip header
  const lines = fileContent.split(/\r?\n/).filter(line => line.trim());
  
  console.log(`Found ${lines.length} lines in CSV file`);
  
  // Skip the header line
  const dataLines = lines.slice(1);
  
  // Process each line
  const tasks = [];
  
  for (const line of dataLines) {
    try {
      const parsedTask = parseCsvLine(line);
      if (parsedTask) {
        // Cleanup the task data
        const cleanedTask = {
          id: cleanId(parsedTask.id),
          title: cleanString(parsedTask.title),
          description: cleanString(parsedTask.description),
          tier1Category: cleanString(parsedTask.tier1Category).toLowerCase(),
          tier2Category: cleanString(parsedTask.tier2Category).toLowerCase(),
          category: cleanString(parsedTask.tier2Category).toLowerCase(),
          estimatedDuration: estimateDuration(parsedTask.title, parsedTask.description)
        };

        // Fix Seathing to sheathing
        if (cleanedTask.tier1Category === 'seathing') {
          cleanedTask.tier1Category = 'sheathing';
        }

        // Standardize tier1 categories
        if (cleanedTask.tier1Category.includes('structural')) {
          cleanedTask.tier1Category = 'structural';
        } else if (cleanedTask.tier1Category.includes('system')) {
          cleanedTask.tier1Category = 'systems';
        } else if (cleanedTask.tier1Category.includes('sheathing')) {
          cleanedTask.tier1Category = 'sheathing';
        } else if (cleanedTask.tier1Category.includes('finishing')) {
          cleanedTask.tier1Category = 'finishings';
        }
        
        // Standardize tier2 categories
        if (cleanedTask.tier2Category === 'siding') {
          cleanedTask.tier2Category = 'exteriors';
          cleanedTask.category = 'exteriors';
        } else if (cleanedTask.tier2Category === 'insulation') {
          cleanedTask.tier2Category = 'barriers';
          cleanedTask.category = 'barriers';
        }
        
        tasks.push(cleanedTask);
        console.log(`Processed task: ${cleanedTask.id} - ${cleanedTask.title}`);
      }
    } catch (error) {
      console.error(`Error processing line: ${line}`, error);
    }
  }
  
  console.log(`Successfully processed ${tasks.length} tasks`);
  
  // Organize tasks by tier1 and tier2 categories
  const organized = {};
  
  tasks.forEach(task => {
    const tier1 = task.tier1Category;
    const tier2 = task.tier2Category;
    
    if (!organized[tier1]) {
      organized[tier1] = {};
    }
    
    if (!organized[tier1][tier2]) {
      organized[tier1][tier2] = [];
    }
    
    organized[tier1][tier2].push(task);
  });
  
  // Generate TypeScript code
  let tsCode = `/**
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
`;

  // Create separate arrays for each tier2 category
  for (const tier1 in organized) {
    for (const tier2 in organized[tier1]) {
      const categoryTasks = organized[tier1][tier2];
      
      // Skip if no tasks
      if (categoryTasks.length === 0) {
        continue;
      }
      
      const variableName = `${tier2}Tasks`;
      
      tsCode += `// ${capitalizeFirstLetter(tier2)} tasks\n`;
      tsCode += `const ${variableName}: TaskTemplate[] = [\n`;
      
      categoryTasks.forEach(task => {
        tsCode += `  {\n`;
        tsCode += `    id: "${task.id}",\n`;
        tsCode += `    title: "${escapeString(task.title)}",\n`;
        tsCode += `    description: "${escapeString(task.description)}",\n`;
        tsCode += `    tier1Category: "${task.tier1Category}",\n`;
        tsCode += `    tier2Category: "${task.tier2Category}",\n`;
        tsCode += `    category: "${task.category}",\n`;
        tsCode += `    estimatedDuration: ${task.estimatedDuration},\n`;
        tsCode += `  },\n`;
      });
      
      tsCode += `];\n\n`;
    }
  }
  
  // Create the task templates collection object
  tsCode += `// Organize all templates into a single, structured collection\n`;
  tsCode += `export const taskTemplates: TaskTemplateCollection = {\n`;
  
  for (const tier1 in organized) {
    tsCode += `  ${tier1}: {\n`;
    
    for (const tier2 in organized[tier1]) {
      tsCode += `    ${tier2}: ${tier2}Tasks,\n`;
    }
    
    tsCode += `  },\n`;
  }
  
  tsCode += `};\n\n`;
  
  // Add helper functions
  tsCode += `// Helper function to get all task templates as a flat array
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
}`;

  // Write the generated TS file
  let outputPath = path.join(__dirname, 'shared', 'taskTemplates.ts');
  
  // Check if the path exists, if not try alternate path
  if (!fs.existsSync(path.dirname(outputPath))) {
    outputPath = './shared/taskTemplates.ts';
    console.log('Using alternate output path:', outputPath);
  }
  
  try {
    fs.writeFileSync(outputPath, tsCode);
    console.log(`Task templates written to ${outputPath}`);
    return tasks;
  } catch (error) {
    console.error('Error writing task templates file:', error);
    
    // Try to create the directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
      
      // Try writing again
      fs.writeFileSync(outputPath, tsCode);
      console.log(`Task templates written to ${outputPath} after creating directory`);
      return tasks;
    }
    throw error;
  }
}

// Parse a single CSV line into a task object
function parseCsvLine(line) {
  // Make sure we have at least one character in the line
  if (!line || line.trim().length === 0) {
    return null;
  }
  
  // Split the line by commas, handling quoted fields
  const parts = [];
  let currentPart = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      parts.push(currentPart);
      currentPart = '';
    } else {
      // Add character to current field
      currentPart += char;
    }
  }
  
  // Add the last part
  parts.push(currentPart);
  
  // Make sure we have at least ID, title, description, tier1, tier2
  if (parts.length < 5) {
    return null;
  }
  
  return {
    id: parts[0],
    title: parts[1],
    description: parts[2],
    tier1Category: parts[3],
    tier2Category: parts[4]
  };
}

// Clean up the ID field
function cleanId(id) {
  return id.replace(/^-|-$/g, '').trim();
}

// Clean up string fields
function cleanString(str) {
  return str.replace(/^"|"$/g, '').trim();
}

// Capitalize first letter of each word
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Escape strings for JavaScript
function escapeString(str) {
  return str.replace(/\\/g, '\\\\').replace(/"/g, '\\"');
}

// Estimate task duration based on content
function estimateDuration(title, description) {
  let duration = 5; // Default duration
  
  // Adjust duration based on complexity indicators in title
  const titleLower = title.toLowerCase();
  
  if (titleLower.includes('inspection') || 
      titleLower.includes('payment') || 
      titleLower.includes('bidding')) {
    duration = 2; // Simple admin tasks
  } else if (titleLower.includes('install') || 
            titleLower.includes('pour') || 
            titleLower.includes('placement')) {
    duration = 7; // Installation tasks
  } else if (titleLower.includes('planning') || 
            titleLower.includes('design') || 
            titleLower.includes('preparation')) {
    duration = 3; // Planning tasks
  } else if (description.length > 300) {
    duration = 7; // Complex tasks typically have longer descriptions
  }
  
  // Adjust based on ID prefix
  if (title.startsWith('PL') || title.startsWith('EL') || title.startsWith('HV')) {
    // Systems tasks often take longer
    duration = Math.max(duration, 6);
  } else if (title.startsWith('FN')) {
    // Foundation tasks can be time-consuming
    duration = Math.max(duration, 5);
  }
  
  return duration;
}

// Run the processor
processSimpleCSV()
  .then(tasks => {
    console.log(`Successfully processed ${tasks ? tasks.length : 0} task templates`);
  })
  .catch(err => {
    console.error('Error in template processing:', err);
  });