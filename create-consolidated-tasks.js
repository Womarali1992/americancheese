/**
 * Script to create consolidated tasks for a specific project
 * This adds the new consolidated task templates to an existing project
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Consolidated task templates with detailed sub-components
const consolidatedTemplates = [
  {
    title: "Complete Insulation & Vapor Barrier Installation",
    description: `COMPREHENSIVE INSULATION PROJECT including all phases:

1. PLANNING & BIDDING:
• Determine insulation requirements with local energy guidelines
• Perform standard bidding process to select subcontractor

2. WALL & BATHROOM INSULATION:
• Install wall insulation in small spaces, around chimneys, offsets, and pipe penetrations
• Ensure vapor barrier is securely stapled
• Install soundproofing insulation in bathrooms for noise control

3. FLOOR & ATTIC INSULATION:
• Install floor insulation in crawl spaces and basement foundations using fiberglass and foam-in techniques
• Install attic insulation using batts or blown-in material
• Layer properly to reduce air leaks and protect HVAC vents

4. INSPECTION & CORRECTIONS:
• Inspect insulation work for vapor barrier placement and thorough sealing
• Check around fixtures, plumbing, doors, and windows
• Correct any issues found during inspection

5. FINAL PAYMENT:
• Pay insulation subcontractor and obtain signed affidavit
• Pay remaining retainage after final approval`,
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "barriers"
  },
  {
    title: "Complete Roofing Installation Project",
    description: `COMPREHENSIVE ROOFING PROJECT including all phases:

1. PREPARATION & MATERIAL SELECTION:
• Select shingle style, color, and material
• Conduct bidding process for labor and materials
• Order shingles, felt, and verify specifications with roofer

2. EDGE PROTECTION & FLASHING:
• Install 3 metal drip edges on eaves (under felt)
• Install rake edges (over felt)
• Install necessary flashing at walls and valleys

3. FELT & SHINGLE INSTALLATION:
• Install roofing felt immediately after roof-deck inspection
• Install shingles starting appropriately based on roof width
• Account for weather conditions during installation

4. GUTTER COORDINATION:
• Coordinate gutter installation to follow immediately after roofing completion

5. INSPECTION & PAYMENT:
• Conduct thorough roofing inspection according to checklist and specifications
• Pay roofing subcontractor after obtaining signed affidavit
• Deduct worker's compensation if applicable`,
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing"
  },
  {
    title: "Complete House Framing Project", 
    description: `COMPREHENSIVE FRAMING PROJECT including all phases:

1. PLANNING & PREPARATION:
• Conduct competitive bidding process for materials and labor
• Meet with framing crew to review project details
• Confirm electrical service is on order
• Place orders for special materials early

2. SITE PREPARATION & SILL PLATE:
• Receive and store framing lumber on flat, dry platform
• Mark site layout for framing
• Install moisture barrier on foundation
• Anchor pressure-treated sill plate to embedded lag bolts

3. FIRST FLOOR CONSTRUCTION:
• Install floor joists using 2x10s or I-joists
• Install exterior-grade tongue-and-groove plywood subfloor
• Position large fixtures before framing partitions
• Frame exterior walls and first-floor partitions
• Plumb and line walls for proper alignment

4. SECOND FLOOR CONSTRUCTION:
• Frame and install second floor joists and subfloor
• Position large items before interior partitions
• Frame second floor exterior walls and partitions
• Install ceiling joists if roof is stick-built

5. ROOF FRAMING & DECKING:
• Frame roof using stick framing or prefab trusses
• Install roof deck with staggered 4x8 plywood sheets
• Use ply clips for stability between rafters
• Issue first framing payment (around 45%)

6. DRY-IN & FIREPLACE INSTALLATION:
• Apply lapped tar paper over roof deck
• Frame chimney chases with plywood or rain caps
• Install prefab fireplaces meeting minimum size requirements

7. ARCHITECTURAL FEATURES & SHEATHING:
• Build dormers, skylights, tray ceilings, bay windows
• Install sheathing on all exterior walls
• Inspect for gaps and seal minor issues

8. OPENINGS & BACKING:
• Remove temporary bracing
• Install exterior windows and doors with waterproofing
• Add dead wood backing for drywall and fixtures

9. FINAL FEATURES & INSPECTION:
• Install roof ventilators on rear side
• Frame decks with pressure-treated lumber
• Perform final framing inspection
• Schedule loan officer site visit for rough framing draw

10. PAYMENT & CONTRACT CLOSEOUT:
• Address any final framing issues
• Finalize payments and close out labor contracts`,
    tier1Category: "structural",
    tier2Category: "framing", 
    category: "framing"
  },
  {
    title: "Complete Electrical Installation Project",
    description: `COMPREHENSIVE ELECTRICAL PROJECT including all phases:

1. PLANNING & REQUIREMENTS:
• Determine electrical requirements for lighting fixtures, outlets, and switches
• Verify and improve blueprint electrical diagram
• Select electrical fixtures and appliances from distributor showrooms
• Conduct standard bidding process with licensed electricians

2. PHONE & COMMUNICATION WIRING:
• Arrange modular phone system wiring and jack installations
• Schedule phone company or electrician for installation
• Consider transferring existing phone number

3. TEMPORARY POWER SETUP:
• Apply for permission to hook up temporary pole to public power system
• Install temporary electric pole within 100 feet of foundation center
• Arrange hookup early so power is available by framing start

4. ROUGH-IN WIRING:
• Run electrical wiring through wall studs and ceiling joists
• Mark locations for outlets and switches
• Install modular phone, cable TV, security, and computer wiring
• Provide blocking near outlets as necessary

5. ROUGH-IN INSPECTION & PAYMENT:
• Schedule electrical inspection with county inspector
• Correct any issues noted during inspection
• Pay electrical subcontractor for rough-in work

6. GARAGE DOOR COORDINATION:
• Install garage doors first
• Install electric garage door openers and wire connections
• Secure remote controls in safe location

7. FINISH WORK & FINAL INSPECTION:
• Terminate wiring for switches, outlets, and devices
• Install major appliances and wire connections
• Schedule final electrical inspection
• Call phone company and electrical utility to connect services

8. FINAL PAYMENT & CLOSEOUT:
• Test all switches and outlets
• Pay electrical subcontractor final amount and retainage
• Obtain signed affidavit and finalize contract`,
    tier1Category: "systems",
    tier2Category: "electrical",
    category: "electrical"
  }
];

async function createConsolidatedTasks(projectId = 6) {
  try {
    console.log(`Creating consolidated tasks for project ${projectId}...`);
    
    for (const template of consolidatedTemplates) {
      console.log(`\nCreating: ${template.title}`);
      
      // Check if this task already exists for this project
      const existingTask = await db.execute(`
        SELECT id FROM tasks 
        WHERE project_id = ${projectId} 
        AND title = '${template.title.replace(/'/g, "''")}'
      `);
      
      if (existingTask.length > 0) {
        console.log(`  Task already exists, skipping...`);
        continue;
      }
      
      // Create the consolidated task
      await db.execute(`
        INSERT INTO tasks (
          title, 
          description, 
          tier1_category, 
          tier2_category, 
          category, 
          project_id, 
          status, 
          completed,
          start_date,
          end_date
        ) VALUES (
          '${template.title.replace(/'/g, "''")}',
          '${template.description.replace(/'/g, "''")}',
          '${template.tier1Category}',
          '${template.tier2Category}',
          '${template.category}',
          ${projectId},
          'pending',
          false,
          CURRENT_DATE,
          CURRENT_DATE + INTERVAL '30 days'
        )
      `);
      
      console.log(`  Created successfully!`);
    }
    
    console.log('\nAll consolidated tasks created successfully!');
    
  } catch (error) {
    console.error('Error creating consolidated tasks:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

// Get project ID from command line argument or use default
const projectId = process.argv[2] ? parseInt(process.argv[2]) : 6;
createConsolidatedTasks(projectId);