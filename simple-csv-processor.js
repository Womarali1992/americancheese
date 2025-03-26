// Simple CSV processor with plain file reading
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Process the CSV file line by line
async function processSimpleCSV() {
  const csvFilePath = path.join(__dirname, 'attached_assets', 'tasktemplete.csv');
  console.log('Reading CSV file from:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }
  
  // Read the file
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');
  console.log(`CSV file read, size: ${fileContent.length} bytes`);
  
  // Split by lines
  const lines = fileContent.split('\n');
  console.log(`Found ${lines.length} lines in file`);
  
  // The first line is headers
  const headers = lines[0].split(',');
  console.log('Headers:', headers);
  
  // Parse each line after the header
  const tasks = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue; // Skip empty lines
    
    // Split the line by commas, but handle quoted fields properly
    const fields = parseCsvLine(line);
    
    // Only process if we have enough fields and ID/Title are not empty
    if (fields.length >= 5 && fields[0] && fields[1]) {
      // Map fields to a task object
      const task = {
        id: cleanId(fields[0]),
        title: cleanString(fields[1]),
        description: cleanString(fields[2]),
        tier1Category: cleanString(fields[3]).toLowerCase(),
        tier2Category: cleanString(fields[4]).toLowerCase(),
        category: cleanString(fields[4]).toLowerCase(), // Duplicate tier2 to category
        estimatedDuration: 2 // Default value
      };
      
      // Fix 'Seathing' to 'sheathing'
      if (task.tier1Category === 'seathing') {
        task.tier1Category = 'sheathing';
      }
      
      // Validate task has required fields
      if (task.id && task.title && task.tier1Category && task.tier2Category) {
        tasks.push(task);
        console.log(`Parsed task: ${task.id} - ${task.title}`);
      }
    }
  }
  
  console.log(`Successfully parsed ${tasks.length} tasks from CSV`);
  
  // Organize tasks by category
  const categorizedTasks = {};
  
  tasks.forEach(task => {
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

// Helper function to parse a CSV line handling quoted fields
function parseCsvLine(line) {
  const fields = [];
  let currentField = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      // Toggle the quote state
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      // End of field
      fields.push(currentField);
      currentField = '';
    } else {
      // Add character to current field
      currentField += char;
    }
  }
  
  // Add the last field
  fields.push(currentField);
  
  return fields;
}

// Helper function to clean ID values
function cleanId(id) {
  if (!id) return '';
  
  // Remove extra spaces, quotes, etc.
  id = id.trim().replace(/^["'\s-]+|["'\s-]+$/g, '');
  
  // Handle RF IDs - convert from "-RF n -" format to "RFn"
  if (id.match(/^\-RF\s*\d+\s*\-$/)) {
    id = id.replace(/^\-RF\s*(\d+)\s*\-$/, 'RF$1');
  }
  
  return id;
}

// Helper function to clean string values
function cleanString(str) {
  if (!str) return '';
  return str.trim().replace(/^["]+|["]+$/g, '');
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
processSimpleCSV()
  .then(() => console.log('Task template processing complete'))
  .catch(err => console.error('Error processing task templates:', err));