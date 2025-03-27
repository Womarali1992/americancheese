// Process CSV template file to extract task templates
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Manual CSV parser for our specific file that has formatting issues
async function processCsvToTemplates() {
  console.log('Starting CSV processing with manual parser...');
  
  // Find the CSV file
  let csvFilePath = path.join(__dirname, 'attached_assets', 'Task Temp.csv');
  if (!fs.existsSync(csvFilePath)) {
    csvFilePath = './attached_assets/Task Temp.csv';
    console.log('Trying alternate path for CSV file:', csvFilePath);
  }
  console.log('Looking for CSV file at:', csvFilePath);
  
  if (!fs.existsSync(csvFilePath)) {
    console.error('CSV file not found at:', csvFilePath);
    return;
  }

  // Read the entire file content
  const fileContent = fs.readFileSync(csvFilePath, 'utf8');
  
  // Split by line breaks into rows
  let rows = fileContent.split(/\r?\n/);
  
  console.log(`Found ${rows.length} raw rows in CSV file`);
  
  // Add a cleanup step to remove rows that are just empty or commas
  rows = rows.filter(row => {
    const trimmedRow = row.trim();
    if (!trimmedRow) return false;
    
    // Check if row is just commas with no values
    const cells = trimmedRow.split(',');
    const hasNonEmptyCell = cells.some(cell => cell.trim() !== '');
    return hasNonEmptyCell;
  });
  
  console.log(`After filtering empty rows, found ${rows.length - 1} potential task rows`);
  
  // Process rows manually
  const tasks = [];
  let currentTask = null;
  let inMultilineField = false;
  let multilineBuffer = '';
  let multilineFieldIndex = -1;
  
  for (let i = 1; i < rows.length; i++) { // Skip header row
    let row = rows[i].trim();
    
    // Skip empty rows
    if (!row) continue;
    
    if (!inMultilineField) {
      // Check if this is the start of a new task
      const cells = row.split(',');
      
      if (cells.length >= 5 && cells[0].trim()) {
        // This looks like a valid task row with an ID
        const id = cells[0].trim().replace(/^-|-$/g, ''); // Strip leading/trailing dashes
        let title = cells[1].trim();
        
        // Check if title starts with a quote but doesn't end with one (multiline)
        if (title.startsWith('"') && !title.endsWith('"') && title.length > 1) {
          inMultilineField = true;
          multilineBuffer = title;
          multilineFieldIndex = 1; // Title column
          continue;
        }
        
        // Clean up title - remove surrounding quotes
        title = title.replace(/^"|"$/g, '').trim();
        
        let description = cells[2].trim();
        
        // Check if description starts with a quote but doesn't end with one (multiline)
        if (description.startsWith('"') && !description.endsWith('"') && description.length > 1) {
          inMultilineField = true;
          multilineBuffer = description;
          multilineFieldIndex = 2; // Description column
          continue;
        }
        
        // Clean up description - remove surrounding quotes
        description = description.replace(/^"|"$/g, '').trim();
        
        const tier1 = cells[3]?.trim().toLowerCase() || '';
        const tier2 = cells[4]?.trim().toLowerCase() || '';
        
        // Calculate estimated duration based on the task type
        let estimatedDuration = 7; // Default duration for most tasks
        
        // Adjust duration based on task complexity
        if (title.toLowerCase().includes('inspection') || 
            title.toLowerCase().includes('payment') || 
            title.toLowerCase().includes('bidding')) {
          estimatedDuration = 2; // Simple admin tasks
        } else if (title.toLowerCase().includes('install') || 
                  title.toLowerCase().includes('pour') || 
                  title.toLowerCase().includes('placement')) {
          estimatedDuration = 10; // Complex installation tasks
        } else if (title.toLowerCase().includes('planning') || 
                  title.toLowerCase().includes('design') || 
                  title.toLowerCase().includes('preparation')) {
          estimatedDuration = 5; // Planning tasks
        } else if (description.length > 300) {
          estimatedDuration = 14; // Very detailed tasks are likely complex
        }
        
        // Adjust based on ID prefix
        if (id.startsWith('PL') || id.startsWith('EL') || id.startsWith('HV')) {
          // Systems tasks often take longer
          estimatedDuration = Math.max(estimatedDuration, 7);
        } else if (id.startsWith('FN')) {
          // Foundation tasks can be time-consuming
          estimatedDuration = Math.max(estimatedDuration, 5);
        }
        
        currentTask = {
          id: id,
          title: title,
          description: description,
          tier1Category: tier1,
          tier2Category: tier2,
          category: tier2 || 'general', // Use tier2 as category fallback
          estimatedDuration: estimatedDuration
        };
        
        // Apply category fixes
        if (currentTask.tier1Category === 'seathing') {
          currentTask.tier1Category = 'sheathing';
        }
        
        // Fix tier1 categories to normalize them
        if (currentTask.tier1Category.includes('structural')) {
          currentTask.tier1Category = 'structural';
        } else if (currentTask.tier1Category.includes('system')) {
          currentTask.tier1Category = 'systems';
        } else if (currentTask.tier1Category.includes('sheathing') || currentTask.tier1Category.includes('seathing')) {
          currentTask.tier1Category = 'sheathing';
        } else if (currentTask.tier1Category.includes('finishing')) {
          currentTask.tier1Category = 'finishings';
        }
        
        // Fix tier2 categories to normalize them
        if (currentTask.tier2Category === 'siding') {
          currentTask.tier2Category = 'exteriors';
        } else if (currentTask.tier2Category === 'insulation') {
          currentTask.tier2Category = 'barriers';
        } else if (currentTask.tier2Category.includes('foundation')) {
          currentTask.tier2Category = 'foundation';
        } else if (currentTask.tier2Category.includes('framing')) {
          currentTask.tier2Category = 'framing';
        } else if (currentTask.tier2Category.includes('roofing')) {
          currentTask.tier2Category = 'roofing';
        } else if (currentTask.tier2Category.includes('plumbing')) {
          currentTask.tier2Category = 'plumbing';
        } else if (currentTask.tier2Category.includes('hvac')) {
          currentTask.tier2Category = 'hvac';
        } else if (currentTask.tier2Category.includes('electrical')) {
          currentTask.tier2Category = 'electrical';
        } else if (currentTask.tier2Category.includes('drywall')) {
          currentTask.tier2Category = 'drywall';
        } else if (currentTask.tier2Category.includes('cabinet')) {
          currentTask.tier2Category = 'cabinentry';
        } else if (currentTask.tier2Category.includes('floor')) {
          currentTask.tier2Category = 'flooring';
        } else if (currentTask.tier2Category.includes('trim')) {
          currentTask.tier2Category = 'trim';
        }
        
        // Make sure we have valid category values
        if (!currentTask.tier1Category || currentTask.tier1Category === 'type (tier 1 category)') {
          // Try to guess from the ID pattern
          const id = currentTask.id;
          if (id.startsWith('FN') || id.startsWith('FR') || id.startsWith('RF')) {
            currentTask.tier1Category = 'structural';
          } else if (id.startsWith('PL') || id.startsWith('HV') || id.startsWith('EL')) {
            currentTask.tier1Category = 'systems';
          } else if (id.startsWith('SC') || id.startsWith('DR') || id.startsWith('IN')) {
            currentTask.tier1Category = 'sheathing';
          } else if (id.startsWith('CB') || id.startsWith('FL') || id.startsWith('TR')) {
            currentTask.tier1Category = 'finishings';
          } else {
            currentTask.tier1Category = 'other';
          }
        }
        
        if (!currentTask.tier2Category || currentTask.tier2Category === 'category (tier 2 category) (1) 2') {
          // Try to guess from the ID pattern
          const id = currentTask.id;
          if (id.startsWith('FN')) {
            currentTask.tier2Category = 'foundation';
          } else if (id.startsWith('FR')) {
            currentTask.tier2Category = 'framing';
          } else if (id.startsWith('RF')) {
            currentTask.tier2Category = 'roofing';
          } else if (id.startsWith('PL')) {
            currentTask.tier2Category = 'plumbing';
          } else if (id.startsWith('HV')) {
            currentTask.tier2Category = 'hvac';
          } else if (id.startsWith('EL')) {
            currentTask.tier2Category = 'electrical';
          } else if (id.startsWith('SC')) {
            currentTask.tier2Category = 'exteriors';
          } else if (id.startsWith('DR')) {
            currentTask.tier2Category = 'drywall';
          } else if (id.startsWith('IN')) {
            currentTask.tier2Category = 'barriers';
          } else if (id.startsWith('CB')) {
            currentTask.tier2Category = 'cabinentry';
          } else if (id.startsWith('FL')) {
            currentTask.tier2Category = 'flooring';
          } else if (id.startsWith('TR')) {
            currentTask.tier2Category = 'trim';
          } else {
            currentTask.tier2Category = 'general';
          }
        }
        
        tasks.push(currentTask);
        console.log(`Parsed task: ${currentTask.id} - ${currentTask.title}`);
      } 
      else if (currentTask && cells.length >= 2) {
        // This might be a continuation of the previous task
        // Try to append data to the previous task if appropriate
        if (cells[1]?.trim()) {
          currentTask.title += ' ' + cells[1].trim();
        }
        if (cells[2]?.trim()) {
          currentTask.description += ' ' + cells[2].trim();
        }
      }
    } 
    else {
      // We're in the middle of a multiline field
      // Check if this line ends the multiline field
      if (row.includes('"')) {
        // This line contains the end quote
        const endQuotePos = row.indexOf('"');
        multilineBuffer += ' ' + row.substring(0, endQuotePos).trim();
        
        // Update the current task with the complete multiline field
        if (currentTask) {
          if (multilineFieldIndex === 1) {
            currentTask.title = multilineBuffer.replace(/^"|"$/g, '').trim();
          } else if (multilineFieldIndex === 2) {
            currentTask.description = multilineBuffer.replace(/^"|"$/g, '').trim();
          }
        } else {
          console.log('Warning: Trying to update a null currentTask object. Multiline field ignored.');
        }
        
        // Reset multiline tracking
        inMultilineField = false;
        multilineBuffer = '';
        multilineFieldIndex = -1;
        
        // Process remaining part of the line if needed
        const remainingCells = row.substring(endQuotePos + 1).split(',');
        // ... handle remaining cells if needed
      } 
      else {
        // Still in multiline, add this line to buffer
        multilineBuffer += ' ' + row.trim();
      }
    }
  }
  
  console.log(`Successfully parsed ${tasks.length} tasks from CSV`);
  
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

  // Write the generated TS file to shared/taskTemplates.ts
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
    console.error('Will attempt to create directory if needed');
    
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

// Run the processor
processCsvToTemplates()
  .then((tasks) => {
    console.log(`Successfully processed ${tasks ? tasks.length : 0} task templates`);
  })
  .catch(err => {
    console.error('Error in template processing:', err);
    console.error(err.stack);
  });