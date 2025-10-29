// Process CSV task templates and generate a new taskTemplates.ts file
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csvParser from 'csv-parser';
import { createReadStream } from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse a CSV row into a task template object
function parseTaskFromCSV(row) {
  return {
    id: row.ID ? row.ID.trim() : '',
    title: row.Title ? row.Title.trim() : '',
    description: row.Description ? row.Description.trim() : '',
    tier1Category: row['Type (Tier 1 Category)'] ? row['Type (Tier 1 Category)'].trim().toLowerCase() : '',
    tier2Category: row['Category (Tier 2 Category) (1) 2'] ? row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase() : '',
    // Default category to tier2 if no specific category can be extracted
    category: row.Title ? (row.Title.trim().split(' ')[0].toLowerCase() || row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase()) : 'general',
    // Default to 2 days if not a number
    estimatedDuration: 2
  };
}

// Function to fix categories for compatibility
function fixCategories(task) {
  // Standardize tier1 categories
  if (task.tier1Category === 'seathing') {
    task.tier1Category = 'sheathing';
  }
  
  // Standardize tier2 categories to match the application structure
  if (task.tier2Category === 'siding') {
    task.tier2Category = 'exteriors';
  }
  
  if (task.tier2Category === 'insulation') {
    task.tier2Category = 'barriers';
  }
  
  if (task.tier2Category === 'cabinentry') {
    task.tier2Category = 'cabinets';
  }

  return task;
}

async function processCsvToTemplates() {
  console.log('Starting CSV processing...');
  
  // Load the CSV file
  // Try both potential paths for the CSV file
  let csvFilePath = path.join(__dirname, 'attached_assets', 'tasktemplete.csv');
  if (!fs.existsSync(csvFilePath)) {
    csvFilePath = './attached_assets/tasktemplete.csv';
    console.log('Trying alternate path for CSV file:', csvFilePath);
  }
  console.log('Looking for CSV file at:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }
  
  const tasks = [];
  
  // Read the CSV file and process the data
  await new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(csvParser())
      .on('data', (row) => {
        // Parse the row into a task template
        if (row.ID && row.Title) { // Skip empty rows
          const task = parseTaskFromCSV(row);
          // Fix category spellings
          const fixedTask = fixCategories(task);
          tasks.push(fixedTask);
          console.log(`Parsed task: ${fixedTask.id} - ${fixedTask.title}`);
        }
      })
      .on('end', () => {
        console.log(`Parsed ${tasks.length} tasks from CSV`);
        resolve();
      })
      .on('error', (error) => {
        reject(error);
      });
  });
  
  console.log('CSV processing completed!');
  
  // Organize tasks by tier1 and tier2 categories
  const organized = {};
  
  tasks.forEach(task => {
    const tier1 = task.tier1Category;
    const tier2 = task.tier2Category;
    
    if (!tier1 || !tier2) {
      console.log(`Skipping task with missing category: ${task.id} - ${task.title}`);
      return;
    }
    
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

// Template arrays by category
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
      
      tsCode += `// ${tier2.charAt(0).toUpperCase() + tier2.slice(1)} tasks\n`;
      tsCode += `const ${variableName}: TaskTemplate[] = [\n`;
      
      categoryTasks.forEach(task => {
        tsCode += `  {\n`;
        tsCode += `    id: "${task.id}",\n`;
        tsCode += `    title: "${task.title.replace(/"/g, '\\"')}",\n`;
        tsCode += `    description: "${task.description.replace(/"/g, '\\"')}",\n`;
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
}
`;

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
  } catch (error) {
    console.error('Error writing task templates file:', error);
    console.error('Will attempt to create directory if needed');
    
    // Try to create the directory if it doesn't exist
    const outputDir = path.dirname(outputPath);
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
      console.log(`Created directory: ${outputDir}`);
      
      // Try writing again
      fs.writeFileSync(outputPath, tsCode);
      console.log(`Task templates written to ${outputPath} after creating directory`);
    }
  }
}

// Run the processor
processCsvToTemplates();