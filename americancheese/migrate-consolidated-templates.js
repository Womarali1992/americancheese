/**
 * Script to migrate consolidated task templates to the database
 * This will replace multiple small tasks with comprehensive consolidated tasks
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

// Database connection
const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  console.error('DATABASE_URL environment variable is required');
  process.exit(1);
}

const sql = postgres(connectionString);
const db = drizzle(sql);

// Consolidated task templates
const consolidatedTemplates = [
  {
    id: "IN_COMPLETE",
    title: "Complete Insulation & Vapor Barrier Installation",
    description: `COMPREHENSIVE INSULATION PROJECT including all phases:

1. PLANNING & BIDDING (IN1-IN2):
• Determine insulation requirements with local energy guidelines
• Perform standard bidding process to select subcontractor

2. WALL & BATHROOM INSULATION (IN3-IN4):
• Install wall insulation in small spaces, around chimneys, offsets, and pipe penetrations
• Ensure vapor barrier is securely stapled
• Install soundproofing insulation in bathrooms for noise control

3. FLOOR & ATTIC INSULATION (IN5-IN6):
• Install floor insulation in crawl spaces and basement foundations using fiberglass and foam-in techniques
• Install attic insulation using batts or blown-in material
• Layer properly to reduce air leaks and protect HVAC vents

4. INSPECTION & CORRECTIONS (IN7-IN8):
• Inspect insulation work for vapor barrier placement and thorough sealing
• Check around fixtures, plumbing, doors, and windows
• Correct any issues found during inspection

5. FINAL PAYMENT (IN9-IN10):
• Pay insulation subcontractor and obtain signed affidavit
• Pay remaining retainage after final approval`,
    tier1Category: "sheathing",
    tier2Category: "barriers",
    category: "barriers",
    estimatedDuration: 23,
    tasksToReplace: ["IN1", "IN3", "IN5", "IN7", "IN9"]
  },
  {
    id: "RF_COMPLETE",
    title: "Complete Roofing Installation Project",
    description: `COMPREHENSIVE ROOFING PROJECT including all phases:

1. PREPARATION & MATERIAL SELECTION (RF1-RF3):
• Select shingle style, color, and material
• Conduct bidding process for labor and materials
• Order shingles, felt, and verify specifications with roofer

2. EDGE PROTECTION & FLASHING (RF4 & RF6):
• Install 3 metal drip edges on eaves (under felt)
• Install rake edges (over felt)
• Install necessary flashing at walls and valleys

3. FELT & SHINGLE INSTALLATION (RF5 & RF7):
• Install roofing felt immediately after roof-deck inspection
• Install shingles starting appropriately based on roof width
• Account for weather conditions during installation

4. GUTTER COORDINATION (RF7A):
• Coordinate gutter installation to follow immediately after roofing completion

5. INSPECTION & PAYMENT (RF8 & RF9):
• Conduct thorough roofing inspection according to checklist and specifications
• Pay roofing subcontractor after obtaining signed affidavit
• Deduct worker's compensation if applicable`,
    tier1Category: "structural",
    tier2Category: "roofing",
    category: "roofing",
    estimatedDuration: 23,
    tasksToReplace: ["RF1", "RF2", "RF3", "RF4", "RF5"]
  },
  {
    id: "FR_COMPLETE",
    title: "Complete House Framing Project",
    description: `COMPREHENSIVE FRAMING PROJECT including all phases:

1. PLANNING & PREPARATION (FR1-FR4):
• Conduct competitive bidding process for materials and labor
• Meet with framing crew to review project details
• Confirm electrical service is on order
• Place orders for special materials early

2. SITE PREPARATION & SILL PLATE (FR5-FR8):
• Receive and store framing lumber on flat, dry platform
• Mark site layout for framing
• Install moisture barrier on foundation
• Anchor pressure-treated sill plate to embedded lag bolts

3. FIRST FLOOR CONSTRUCTION (FR9-FR10):
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

5. ROOF FRAMING & DECKING (FR20-FR22):
• Frame roof using stick framing or prefab trusses
• Install roof deck with staggered 4x8 plywood sheets
• Use ply clips for stability between rafters
• Issue first framing payment (around 45%)

6. DRY-IN & FIREPLACE INSTALLATION:
• Apply lapped tar paper over roof deck
• Frame chimney chases with plywood or rain caps
• Install prefab fireplaces meeting minimum size requirements

7. ARCHITECTURAL FEATURES & SHEATHING (FR26-FR29):
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
    category: "framing",
    estimatedDuration: 60,
    tasksToReplace: ["FR1", "FR2", "FR3", "FR4", "FR5", "FR6", "FR7", "FR8", "FR9", "FR10", "FR11", "FR12"]
  }
];

async function main() {
  try {
    console.log('Starting consolidated task template migration...');
    
    // Get all projects to update their tasks
    const projects = await db.execute(`SELECT id FROM projects`);
    console.log(`Found ${projects.length} projects to update`);
    
    for (const template of consolidatedTemplates) {
      console.log(`\nProcessing template: ${template.title}`);
      
      for (const project of projects) {
        const projectId = project.id;
        
        // Find existing tasks that match the tasks to replace
        const tasksToReplaceStr = template.tasksToReplace.map(id => `'${id}'`).join(',');
        const existingTasks = await db.execute(`
          SELECT id, title, description 
          FROM tasks 
          WHERE project_id = ${projectId} 
          AND (
            title LIKE '%${template.tasksToReplace[0]}%' 
            ${template.tasksToReplace.slice(1).map(id => `OR title LIKE '%${id}%'`).join(' ')}
          )
        `);
        
        if (existingTasks.length > 0) {
          console.log(`  Project ${projectId}: Found ${existingTasks.length} tasks to consolidate`);
          
          // Delete the old individual tasks
          for (const task of existingTasks) {
            await db.execute(`DELETE FROM tasks WHERE id = ${task.id}`);
          }
          
          // Create the new consolidated task
          await db.execute(`
            INSERT INTO tasks (
              title, 
              description, 
              tier1_category, 
              tier2_category, 
              category, 
              project_id, 
              status, 
              completed
            ) VALUES (
              '${template.title.replace(/'/g, "''")}',
              '${template.description.replace(/'/g, "''")}',
              '${template.tier1Category}',
              '${template.tier2Category}',
              '${template.category}',
              ${projectId},
              'pending',
              false
            )
          `);
          
          console.log(`  Project ${projectId}: Created consolidated task`);
        } else {
          console.log(`  Project ${projectId}: No matching tasks found`);
        }
      }
    }
    
    console.log('\nConsolidated task template migration completed successfully!');
    
  } catch (error) {
    console.error('Error during migration:', error);
    process.exit(1);
  } finally {
    await sql.end();
  }
}

main();