/**
 * Predefined task templates for construction projects
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

// Foundation tasks
const foundationTasks: TaskTemplate[] = [
  {
    id: "FN1",
    title: "Form & Soil Preparation -CN31, CN 32-",
    description:
      "Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper (CN31, CN32).",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "preparation",
    estimatedDuration: 3,
  },
  {
    id: "FN2",
    title: "Excavation",
    description: "Excavate the area for foundation laying",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "excavation",
    estimatedDuration: 2,
  },
  {
    id: "FN3",
    title: "Formwork Installation",
    description: "Install forms for concrete pouring",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "formwork",
    estimatedDuration: 2,
  },
  {
    id: "FN4",
    title: "Reinforcement Placement",
    description: "Place reinforcement steel in foundation forms",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "reinforcement",
    estimatedDuration: 2,
  },
  {
    id: "FN5",
    title: "Concrete Pouring",
    description: "Pour concrete into foundation forms",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "concrete",
    estimatedDuration: 1,
  },
  {
    id: "FN6",
    title: "Concrete Curing",
    description: "Allow concrete to cure properly",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "concrete",
    estimatedDuration: 7,
  },
  {
    id: "FN7",
    title: "Waterproofing",
    description: "Apply waterproofing to foundation",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "waterproofing",
    estimatedDuration: 2,
  },
  {
    id: "FN8",
    title: "Drainage System Installation",
    description: "Install foundation drainage system",
    tier1Category: "structural",
    tier2Category: "foundation",
    category: "drainage",
    estimatedDuration: 2,
  },
];

// Framing tasks
const framingTasks: TaskTemplate[] = [
  {
    id: "FR1",
    title: "Floor Framing",
    description: "Construct the floor framing system",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "floor",
    estimatedDuration: 4,
  },
  {
    id: "FR2",
    title: "Wall Framing",
    description: "Construct the wall framing",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "wall",
    estimatedDuration: 5,
  },
  {
    id: "FR3",
    title: "Ceiling/Roof Framing",
    description: "Construct the ceiling and roof framing",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "ceiling",
    estimatedDuration: 4,
  },
  {
    id: "FR4",
    title: "Sheathing Installation",
    description: "Install exterior wall sheathing",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "sheathing",
    estimatedDuration: 3,
  },
  {
    id: "FR5",
    title: "Beam & Column Installation",
    description: "Install support beams and columns",
    tier1Category: "structural",
    tier2Category: "framing",
    category: "support",
    estimatedDuration: 2,
  },
];

// Roofing tasks
const roofingTasks: TaskTemplate[] = [
  {
    id: "RF1",
    title: "Roof Truss Installation",
    description: "Install prefabricated roof trusses",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "truss",
    estimatedDuration: 2,
  },
  {
    id: "RF2",
    title: "Roof Decking",
    description: "Install roof decking/sheathing",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "decking",
    estimatedDuration: 2,
  },
  {
    id: "RF3",
    title: "Underlayment Installation",
    description: "Apply roofing underlayment",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "underlayment",
    estimatedDuration: 1,
  },
  {
    id: "RF4",
    title: "Roofing Material Installation",
    description: "Install primary roofing material (shingles, tiles, etc.)",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "covering",
    estimatedDuration: 3,
  },
  {
    id: "RF5",
    title: "Flashing Installation",
    description: "Install roof flashing at joints and penetrations",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "flashing",
    estimatedDuration: 1,
  },
  {
    id: "RF6",
    title: "Gutter Installation",
    description: "Install gutters and downspouts",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "gutters",
    estimatedDuration: 1,
  },
  {
    id: "RF7",
    title: "Roof Ventilation",
    description: "Install roof vents and ventilation systems",
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "ventilation",
    estimatedDuration: 1,
  },
];

// Electrical tasks
const electricalTasks: TaskTemplate[] = [
  {
    id: "EL1",
    title: "Electrical Rough-In",
    description: "Install electrical boxes, conduit, and wiring",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "rough-in",
    estimatedDuration: 5,
  },
  {
    id: "EL2",
    title: "Electrical Panel Installation",
    description: "Install main electrical service panel",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "panel",
    estimatedDuration: 1,
  },
  {
    id: "EL3",
    title: "Lighting Installation",
    description: "Install light fixtures throughout the structure",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "lighting",
    estimatedDuration: 2,
  },
  {
    id: "EL4",
    title: "Outlet and Switch Installation",
    description: "Install electrical outlets and switches",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "outlets",
    estimatedDuration: 2,
  },
  {
    id: "EL5",
    title: "Appliance Connections",
    description: "Connect electrical appliances",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "appliances",
    estimatedDuration: 1,
  },
  {
    id: "EL6",
    title: "Low Voltage Wiring",
    description: "Install data, communication, and security wiring",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "low-voltage",
    estimatedDuration: 2,
  },
  {
    id: "EL7",
    title: "Electrical Inspection",
    description: "Conduct electrical inspection before drywall",
    tier1Category: "systems",
    tier2Category: "electric",
    category: "inspection",
    estimatedDuration: 1,
  },
];

// Plumbing tasks
const plumbingTasks: TaskTemplate[] = [
  {
    id: "PL1",
    title: "Water Supply Line Installation",
    description: "Install water supply lines throughout the structure",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "supply",
    estimatedDuration: 3,
  },
  {
    id: "PL2",
    title: "Drain and Waste Line Installation",
    description: "Install drainage and waste plumbing lines",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "drainage",
    estimatedDuration: 3,
  },
  {
    id: "PL3",
    title: "Fixture Installation",
    description: "Install plumbing fixtures (sinks, toilets, etc.)",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "fixtures",
    estimatedDuration: 2,
  },
  {
    id: "PL4",
    title: "Water Heater Installation",
    description: "Install and connect water heater",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "water-heater",
    estimatedDuration: 1,
  },
  {
    id: "PL5",
    title: "Gas Line Installation",
    description: "Install gas lines for appliances",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "gas",
    estimatedDuration: 2,
  },
  {
    id: "PL6",
    title: "Plumbing Inspection",
    description: "Conduct plumbing inspection before drywall",
    tier1Category: "systems",
    tier2Category: "plumbing",
    category: "inspection",
    estimatedDuration: 1,
  },
];

// HVAC tasks
const hvacTasks: TaskTemplate[] = [
  {
    id: "HV1",
    title: "HVAC System Design",
    description: "Finalize HVAC system design and requirements",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "design",
    estimatedDuration: 2,
  },
  {
    id: "HV2",
    title: "Ductwork Installation",
    description: "Install ductwork throughout the structure",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "ductwork",
    estimatedDuration: 4,
  },
  {
    id: "HV3",
    title: "HVAC Unit Installation",
    description: "Install heating and cooling units",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "units",
    estimatedDuration: 2,
  },
  {
    id: "HV4",
    title: "Vent and Register Installation",
    description: "Install air vents and registers",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "vents",
    estimatedDuration: 1,
  },
  {
    id: "HV5",
    title: "Thermostat Installation",
    description: "Install and configure thermostats",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "controls",
    estimatedDuration: 1,
  },
  {
    id: "HV6",
    title: "HVAC System Testing",
    description: "Test and balance HVAC system",
    tier1Category: "systems",
    tier2Category: "hvac",
    category: "testing",
    estimatedDuration: 1,
  },
];

// Barrier/Insulation tasks
const barrierTasks: TaskTemplate[] = [
  {
    id: "BR1",
    title: "Moisture Barrier Installation",
    description: "Install moisture barriers on exterior walls",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "moisture",
    estimatedDuration: 2,
  },
  {
    id: "BR2",
    title: "Wall Insulation",
    description: "Install insulation in exterior walls",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "insulation",
    estimatedDuration: 2,
  },
  {
    id: "BR3",
    title: "Ceiling/Attic Insulation",
    description: "Install insulation in ceilings and attic spaces",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "insulation",
    estimatedDuration: 2,
  },
  {
    id: "BR4",
    title: "Vapor Barrier Installation",
    description: "Install vapor barriers where required",
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "vapor",
    estimatedDuration: 1,
  },
];

// Drywall tasks
const drywallTasks: TaskTemplate[] = [
  {
    id: "DW1",
    title: "Drywall Delivery and Staging",
    description: "Receive and stage drywall materials",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "DW2",
    title: "Drywall Hanging",
    description: "Install drywall sheets on walls and ceilings",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "installation",
    estimatedDuration: 4,
  },
  {
    id: "DW3",
    title: "Taping and Mudding",
    description: "Apply joint tape and compound to drywall seams",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finishing",
    estimatedDuration: 3,
  },
  {
    id: "DW4",
    title: "Sanding",
    description: "Sand drywall surfaces for smooth finish",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "finishing",
    estimatedDuration: 2,
  },
  {
    id: "DW5",
    title: "Texture Application",
    description: "Apply texture to drywall surfaces (if specified)",
    tier1Category: "sheathing",
    tier2Category: "drywall",
    category: "texture",
    estimatedDuration: 2,
  },
];

// Exterior tasks
const exteriorTasks: TaskTemplate[] = [
  {
    id: "EX1",
    title: "Exterior Siding Preparation",
    description: "Prepare exterior for siding installation",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "EX2",
    title: "Siding Installation",
    description: "Install exterior siding materials",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "siding",
    estimatedDuration: 4,
  },
  {
    id: "EX3",
    title: "Trim Installation",
    description: "Install exterior trim elements",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "trim",
    estimatedDuration: 2,
  },
  {
    id: "EX4",
    title: "Exterior Painting",
    description: "Paint or finish exterior surfaces",
    tier1Category: "sheathing",
    tier2Category: "exteriors",
    category: "painting",
    estimatedDuration: 3,
  },
];

// Window tasks
const windowTasks: TaskTemplate[] = [
  {
    id: "WN1",
    title: "Window Delivery",
    description: "Receive and inspect windows",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "WN2",
    title: "Window Installation",
    description: "Install windows in prepared openings",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "installation",
    estimatedDuration: 2,
  },
  {
    id: "WN3",
    title: "Window Sealing and Flashing",
    description: "Seal and flash windows to prevent water penetration",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "sealing",
    estimatedDuration: 1,
  },
  {
    id: "WN4",
    title: "Window Trim Installation",
    description: "Install interior window trim",
    tier1Category: "finishings",
    tier2Category: "windows",
    category: "trim",
    estimatedDuration: 2,
  },
];

// Door tasks
const doorTasks: TaskTemplate[] = [
  {
    id: "DR1",
    title: "Door Delivery",
    description: "Receive and inspect doors",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "DR2",
    title: "Exterior Door Installation",
    description: "Install exterior entry doors",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "exterior",
    estimatedDuration: 1,
  },
  {
    id: "DR3",
    title: "Interior Door Installation",
    description: "Install interior doors throughout the structure",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "interior",
    estimatedDuration: 2,
  },
  {
    id: "DR4",
    title: "Door Hardware Installation",
    description: "Install doorknobs, hinges, and other hardware",
    tier1Category: "finishings",
    tier2Category: "doors",
    category: "hardware",
    estimatedDuration: 1,
  },
];

// Cabinet tasks
const cabinetTasks: TaskTemplate[] = [
  {
    id: "CB1",
    title: "Cabinet Delivery",
    description: "Receive and inspect cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "CB2",
    title: "Cabinet Layout",
    description: "Mark and prepare cabinet layout",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "CB3",
    title: "Base Cabinet Installation",
    description: "Install base cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "installation",
    estimatedDuration: 2,
  },
  {
    id: "CB4",
    title: "Wall Cabinet Installation",
    description: "Install wall cabinets",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "installation",
    estimatedDuration: 1,
  },
  {
    id: "CB5",
    title: "Cabinet Hardware Installation",
    description: "Install cabinet handles, knobs, and other hardware",
    tier1Category: "finishings",
    tier2Category: "cabinets",
    category: "hardware",
    estimatedDuration: 1,
  },
];

// Fixture tasks
const fixtureTasks: TaskTemplate[] = [
  {
    id: "FX1",
    title: "Bathroom Fixture Installation",
    description: "Install bathroom fixtures (toilet, sink, shower/tub)",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "bathroom",
    estimatedDuration: 2,
  },
  {
    id: "FX2",
    title: "Kitchen Fixture Installation",
    description: "Install kitchen fixtures (sink, faucet)",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "kitchen",
    estimatedDuration: 1,
  },
  {
    id: "FX3",
    title: "Appliance Installation",
    description: "Install major appliances",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "appliances",
    estimatedDuration: 1,
  },
  {
    id: "FX4",
    title: "Light Fixture Installation",
    description: "Install decorative light fixtures",
    tier1Category: "finishings",
    tier2Category: "fixtures",
    category: "lighting",
    estimatedDuration: 2,
  },
];

// Flooring tasks
const flooringTasks: TaskTemplate[] = [
  {
    id: "FL1",
    title: "Flooring Material Delivery",
    description: "Receive and acclimatize flooring materials",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "delivery",
    estimatedDuration: 1,
  },
  {
    id: "FL2",
    title: "Subfloor Preparation",
    description: "Prepare subfloor for flooring installation",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "preparation",
    estimatedDuration: 1,
  },
  {
    id: "FL3",
    title: "Tile Flooring Installation",
    description: "Install tile flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "tile",
    estimatedDuration: 3,
  },
  {
    id: "FL4",
    title: "Hardwood Flooring Installation",
    description: "Install hardwood flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "hardwood",
    estimatedDuration: 3,
  },
  {
    id: "FL5",
    title: "Carpet Installation",
    description: "Install carpet in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "carpet",
    estimatedDuration: 2,
  },
  {
    id: "FL6",
    title: "Vinyl/Laminate Flooring Installation",
    description: "Install vinyl or laminate flooring in designated areas",
    tier1Category: "finishings",
    tier2Category: "flooring",
    category: "vinyl",
    estimatedDuration: 2,
  },
];

// Permits and other administrative tasks
const permitTasks: TaskTemplate[] = [
  {
    id: "PM1",
    title: "Building Permit Application",
    description: "Apply for main building permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 14,
  },
  {
    id: "PM2",
    title: "Electrical Permit",
    description: "Obtain electrical work permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM3",
    title: "Plumbing Permit",
    description: "Obtain plumbing work permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM4",
    title: "HVAC Permit",
    description: "Obtain HVAC installation permit",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "permits",
    estimatedDuration: 7,
  },
  {
    id: "PM5",
    title: "Final Inspection",
    description: "Schedule and complete final building inspection",
    tier1Category: "Uncategorized",
    tier2Category: "permits",
    category: "inspection",
    estimatedDuration: 1,
  },
];

// Organize all templates into a single, structured collection
export const taskTemplates: TaskTemplateCollection = {
  structural: {
    foundation: foundationTasks,
    framing: framingTasks,
    roofing: roofingTasks,
  },
  systems: {
    electric: electricalTasks,
    plumbing: plumbingTasks,
    hvac: hvacTasks,
  },
  sheathing: {
    barriers: barrierTasks,
    drywall: drywallTasks,
    exteriors: exteriorTasks,
  },
  finishings: {
    windows: windowTasks,
    doors: doorTasks,
    cabinets: cabinetTasks,
    fixtures: fixtureTasks,
    flooring: flooringTasks,
  },
  Uncategorized: {
    permits: permitTasks,
    other: [],
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
