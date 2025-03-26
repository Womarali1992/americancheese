// Raw CSV processor to directly handle the CSV file content
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';

// Get the directory name
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

// Function to process the CSV file
async function processRawCsv() {
  console.log('Starting raw CSV processing...');
  
  // Find the CSV file
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

  // Read the file content directly
  const content = fs.readFileSync(csvFilePath, 'utf8');
  console.log('Raw file length:', content.length);
  
  // Output first 1000 characters for inspection
  console.log('File content sample:');
  console.log(content.substring(0, 1000));
  
  // Split by regular newlines
  const lines = content.split(/\n/);
  console.log(`Found ${lines.length} lines using \\n split`);
  
  // Also try carriage return + newline
  const crLines = content.split(/\r\n/);
  console.log(`Found ${crLines.length} lines using \\r\\n split`);
  
  // Also try just carriage return
  const crOnlyLines = content.split(/\r/);
  console.log(`Found ${crOnlyLines.length} lines using \\r split`);
  
  // Try to extract tasks with a simple regex approach
  const idRegex = /\b(FN|RF|PL|HV|EL|SC|DR|IN)[0-9]+\b/g;
  const taskIds = content.match(idRegex) || [];
  console.log(`Found ${taskIds.length} potential task IDs:`, taskIds.slice(0, 10));
  
  // Create a manual task templates TS file with the extracted IDs
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

// Structural Foundation tasks
const foundationTasks: TaskTemplate[] = [
  {
    id: "FN1",
    title: "Form & Soil Preparation",
    description: "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper.",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 2,
  },
  {
    id: "FN2",
    title: "Foundation Utilities Installation & Inspection",
    description: "Install foundation stub plumbing (with foam collars, termite shields) and HVAC gas lines; inspect utility placement and integrity.",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "foundation",
    estimatedDuration: 3,
  },
];

// Structural Roofing tasks
const roofingTasks: TaskTemplate[] = [
  {
    id: "RF1",
    title: "Roofing Prep: Shingle Selection, Bidding & Ordering",
    description: "Select shingle style, color, and material; bid labor/materials; order shingles/felt; verify specifications with roofer.",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 3,
  },
  {
    id: "RF2",
    title: "Roofing Edge Protection: Drip Edge & Flashing Installation",
    description: "Install metal drip edges on eaves (under felt) and rake edges (over felt), plus necessary flashing at walls/valleys.",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 2,
  },
];

// Systems Plumbing tasks
const plumbingTasks: TaskTemplate[] = [
  {
    id: "PL1",
    title: "Fixture Selection and Special Item Ordering",
    description: "Determine type and quantity of plumbing fixtures (styles and colors), including: sinks, shower fixtures, toilets and toilet seats, and more.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "plumbing",
    estimatedDuration: 3,
  },
  {
    id: "PL2",
    title: "Bidding Management and Material Confirmation",
    description: "Conduct a standard bidding process. Shop prices carefully, as bids may vary significantly depending on material selections.",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "plumbing",
    estimatedDuration: 2,
  },
];

// Systems HVAC tasks
const hvacTasks: TaskTemplate[] = [
  {
    id: "HV1",
    title: "HVAC Energy Audit & Requirements",
    description: "Conduct an energy audit to determine your home's heating/cooling needs and select the most suitable HVAC system.",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 2,
  },
  {
    id: "HV2",
    title: "HVAC Bidding & Design",
    description: "Manage the bidding process for the entire HVAC job and finalize the HVAC system design by confirming equipment placement.",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "hvac",
    estimatedDuration: 3,
  },
];

// Systems Electrical tasks
const electricalTasks: TaskTemplate[] = [
  {
    id: "EL1",
    title: "Electrical: Determine requirements, fixtures, appliances, and bidding",
    description: "Determine electrical requirements by deciding where to place lighting fixtures, outlets, and switches.",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 3,
  },
  {
    id: "EL2",
    title: "Electrical: Arrange phone wiring and jack installations",
    description: "Determine charges for wiring the home for a modular phone system and install phone jacks in several locations.",
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical",
    estimatedDuration: 2,
  },
];

// Sheathing Siding tasks
const exteriorsTasks: TaskTemplate[] = [
  {
    id: "SC1",
    title: "Select Siding materials, color, and style; conduct bidding",
    description: "Choose appropriate siding materials that match the desired aesthetic and performance requirements.",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "exteriors",
    estimatedDuration: 2,
  },
  {
    id: "SC2",
    title: "Order Windows/doors; verify dimensions and install correctly",
    description: "Order all necessary windows and doors, ensuring that the dimensions are verified precisely before delivery.",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "exteriors",
    estimatedDuration: 3,
  },
];

// Sheathing Drywall tasks
const drywallTasks: TaskTemplate[] = [
  {
    id: "DR1",
    title: "Manage Drywall Procurement",
    description: "Handle the drywall bidding process, refer to contract specs, ask painters for quality sub referrals, and order materials if not supplied.",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "drywall",
    estimatedDuration: 2,
  },
  {
    id: "DR3",
    title: "Install and Finish Drywall",
    description: "Hang drywall on all walls with metal edging on outside corners and tape on inside corners. Spackle and sand all joints and nail dimples.",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "drywall",
    estimatedDuration: 5,
  },
];

// Sheathing Insulation tasks
const barriersTasks: TaskTemplate[] = [
  {
    id: "IN1",
    title: "Plan Insulation work and bidding",
    description: "Determine insulation requirements with help from local energy guidelines, and perform standard bidding process to select a subcontractor.",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "barriers",
    estimatedDuration: 2,
  },
];

// Organize all templates into a single, structured collection
export const taskTemplates: TaskTemplateCollection = {
  structural: {
    foundation: foundationTasks,
    roofing: roofingTasks,
  },
  systems: {
    plumbing: plumbingTasks,
    hvac: hvacTasks,
    electrical: electricalTasks,
  },
  sheathing: {
    exteriors: exteriorsTasks,
    drywall: drywallTasks,
    barriers: barriersTasks,
  },
};

// Helper function to get all task templates as a flat array
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

  // Write the file to shared/taskTemplates.ts
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
processRawCsv()
  .then(() => console.log('CSV processing complete'))
  .catch(err => {
    console.error('Error processing CSV:', err);
    console.error(err.stack);
  });