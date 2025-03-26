// Process CSV task templates and update shared/taskTemplates.ts
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import csv from 'csv-parser';
import { createReadStream } from 'fs';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Helper function to parse a CSV row into a task template object
function parseTaskFromCSV(row) {
  // Clean up the ID value (remove extra spaces, quotes, etc.)
  let id = row.ID ? row.ID.trim() : '';
  id = id.replace(/^[\s"'-]+|[\s"'-]+$/g, ''); // Remove quotes, spaces, dashes at start/end
  
  // Handle RF IDs - convert from "-RF n -" format to "RFn"
  if (id.match(/^\-RF\s*\d+\s*\-$/)) {
    id = id.replace(/^\-RF\s*(\d+)\s*\-$/, 'RF$1');
  }
  
  // Clean up the title (remove extra quotes and spaces)
  let title = row.Title ? row.Title.trim() : '';
  title = title.replace(/^[\s"]+|[\s"]+$/g, ''); // Remove quotes and spaces
  
  // Handle tier1 category normalization
  let tier1 = row['Type (Tier 1 Category)'] ? row['Type (Tier 1 Category)'].trim().toLowerCase() : '';
  
  // Fix 'Seathing' to 'sheathing' for consistency
  if (tier1 === 'seathing') {
    tier1 = 'sheathing';
  }
  
  // Extract tier2 category and normalize
  let tier2 = row['Category (Tier 2 Category) (1) 2'] ? row['Category (Tier 2 Category) (1) 2'].trim().toLowerCase() : '';
  
  // Debug logging
  console.log('Raw row data:', JSON.stringify(row));
  
  const task = {
    id: id,
    title: title,
    description: row.Description ? row.Description.trim() : '',
    tier1Category: tier1,
    tier2Category: tier2,
    category: tier2, // Use tier2 as the category
    estimatedDuration: 2 // Default to 2 days
  };
  
  console.log('Parsed task:', JSON.stringify(task));
  return task;
}

// Process CSV file and generate taskTemplates.ts
async function processTemplates() {
  console.log('Starting template processing...');
  
  // Look for the CSV file in attached_assets
  const csvFilePath = path.join(__dirname, 'attached_assets', 'tasktemplete.csv');
  console.log('Looking for CSV file at:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }
  
  // Read the file content directly to debug
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');
  console.log('File exists, size:', fileContent.length);
  console.log('First 200 characters:', fileContent.substring(0, 200));
  
  const tasks = [];
  
  // Read the CSV file and process the data
  await new Promise((resolve, reject) => {
    createReadStream(csvFilePath)
      .pipe(csv())
      .on('data', (row) => {
        console.log('Row received:', JSON.stringify(row));
        // Only process rows with ID and Title
        if (row.ID && row.Title) {
          const task = parseTaskFromCSV(row);
          if (task.id && task.title) {
            tasks.push(task);
            console.log(`Added task: ${task.id} - ${task.title}`);
          } else {
            console.log('Skipping task with empty ID or title');
          }
        } else {
          console.log('Skipping row without ID or Title:', JSON.stringify(row));
        }
      })
      .on('end', () => {
        console.log(`Parsed ${tasks.length} tasks from CSV`);
        resolve();
      })
      .on('error', (error) => {
        console.error('Error parsing CSV:', error);
        reject(error);
      });
  });
  
  // Organize tasks by category
  const categorizedTasks = {};
  
  tasks.forEach(task => {
    if (!task.tier1Category || !task.tier2Category) {
      console.log(`Skipping task with incomplete categories: ${task.id}`);
      return;
    }
    
    if (!categorizedTasks[task.tier1Category]) {
      categorizedTasks[task.tier1Category] = {};
    }
    
    if (!categorizedTasks[task.tier1Category][task.tier2Category]) {
      categorizedTasks[task.tier1Category][task.tier2Category] = [];
    }
    
    categorizedTasks[task.tier1Category][task.tier2Category].push(task);
  });
  
  // Generate the TypeScript code
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

`;

  // Generate array declarations for each category
  Object.entries(categorizedTasks).forEach(([tier1, tier2Categories]) => {
    Object.entries(tier2Categories).forEach(([tier2, tasksList]) => {
      const arrayName = `${tier2}Tasks`;
      
      tsCode += `// ${capitalizeFirstLetter(tier1)} ${capitalizeFirstLetter(tier2)} tasks\n`;
      tsCode += `const ${arrayName}: TaskTemplate[] = [\n`;
      
      tasksList.forEach(task => {
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
    });
  });
  
  // Generate the taskTemplates object
  tsCode += `// Organize all templates into a single, structured collection\n`;
  tsCode += `export const taskTemplates: TaskTemplateCollection = {\n`;
  
  Object.entries(categorizedTasks).forEach(([tier1, tier2Categories]) => {
    tsCode += `  ${tier1}: {\n`;
    
    Object.entries(tier2Categories).forEach(([tier2, _]) => {
      tsCode += `    ${tier2}: ${tier2}Tasks,\n`;
    });
    
    tsCode += `  },\n`;
  });
  
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
  
  // Write the generated file to shared/taskTemplates.ts
  const outputPath = path.join(__dirname, 'shared', 'taskTemplates.ts');
  
  try {
    fs.writeFileSync(outputPath, tsCode);
    console.log(`Task templates written to ${outputPath}`);
  } catch (error) {
    console.error('Error writing task templates file:', error);
  }
}

// Helper function to capitalize the first letter of a string
function capitalizeFirstLetter(string) {
  return string.charAt(0).toUpperCase() + string.slice(1);
}

// Helper function to escape strings for JavaScript
function escapeString(str) {
  if (!str) return '';
  return str
    .replace(/\\/g, '\\\\')
    .replace(/"/g, '\\"')
    .replace(/\n/g, ' ');
}

// Run the processor
processTemplates()
  .then(() => console.log('Task template processing complete'))
  .catch(err => console.error('Error processing task templates:', err));