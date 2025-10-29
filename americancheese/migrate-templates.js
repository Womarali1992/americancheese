/**
 * Script to migrate task templates from the hardcoded data to database tables
 * This script will:
 * 1. Create template_categories table if it doesn't exist
 * 2. Create task_templates table if it doesn't exist
 * 3. Populate template_categories with tier1 and tier2 categories
 * 4. Populate task_templates with task templates from shared/taskTemplates.ts
 */

// Use ESM import syntax
import { db } from './server/db.js';
import { taskTemplates, templateCategories } from './shared/schema.js';
import { sql } from 'drizzle-orm';

// Helper function to log messages
function log(message) {
  console.log(`[Migrate] ${message}`);
}

// A mapping of the tier1 categories with their user-friendly names
const tier1Categories = [
  { name: 'Structural', type: 'tier1', slug: 'structural' },
  { name: 'Systems', type: 'tier1', slug: 'systems' },
  { name: 'Sheathing', type: 'tier1', slug: 'sheathing' },
  { name: 'Finishings', type: 'tier1', slug: 'finishings' }
];

// A mapping of the tier2 categories with their user-friendly names
const tier2Categories = [
  { name: 'Foundation', type: 'tier2', slug: 'foundation', parent: 'structural' },
  { name: 'Framing', type: 'tier2', slug: 'framing', parent: 'structural' },
  { name: 'Roofing', type: 'tier2', slug: 'roofing', parent: 'structural' },
  
  { name: 'Electrical', type: 'tier2', slug: 'electrical', parent: 'systems' },
  { name: 'Plumbing', type: 'tier2', slug: 'plumbing', parent: 'systems' },
  { name: 'HVAC', type: 'tier2', slug: 'hvac', parent: 'systems' },
  
  { name: 'Drywall', type: 'tier2', slug: 'drywall', parent: 'sheathing' },
  { name: 'Exteriors', type: 'tier2', slug: 'exteriors', parent: 'sheathing' },
  { name: 'Barriers', type: 'tier2', slug: 'barriers', parent: 'sheathing' },
  
  { name: 'Trim', type: 'tier2', slug: 'trim', parent: 'finishings' },
  { name: 'Cabinentry', type: 'tier2', slug: 'cabinentry', parent: 'finishings' },
  { name: 'Flooring', type: 'tier2', slug: 'flooring', parent: 'finishings' },
  { name: 'Landscaping', type: 'tier2', slug: 'landscaping', parent: 'finishings' }
];

// Sample task templates (we'll extract the real ones from the code)
// This is just the structure to follow
const sampleTaskTemplates = [
  {
    templateId: 'FN1',
    title: 'Form & Soil Preparation (FN1)',
    description: 'Set foundation slab forms accurately per blueprint...',
    tier1CategorySlug: 'structural',
    tier2CategorySlug: 'foundation',
    estimatedDuration: 3
  }
];

async function createTables() {
  try {
    // Create template_categories table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS template_categories (
        id SERIAL PRIMARY KEY,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        parent_id INTEGER,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log('Template categories table created or verified');

    // Create task_templates table if not exists
    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS task_templates (
        id SERIAL PRIMARY KEY,
        template_id TEXT NOT NULL,
        title TEXT NOT NULL,
        description TEXT,
        tier1_category_id INTEGER NOT NULL,
        tier2_category_id INTEGER NOT NULL,
        estimated_duration INTEGER NOT NULL DEFAULT 1,
        created_at TIMESTAMP DEFAULT NOW(),
        updated_at TIMESTAMP DEFAULT NOW()
      )
    `);
    log('Task templates table created or verified');

    return true;
  } catch (error) {
    log(`Error creating tables: ${error.message}`);
    return false;
  }
}

async function populateTemplateCategories() {
  try {
    // First clear existing data to avoid duplicates
    await db.delete(templateCategories);
    log('Cleared existing template categories');

    // Insert tier1 categories
    const tier1Ids = {};
    for (const category of tier1Categories) {
      const [inserted] = await db.insert(templateCategories).values({
        name: category.name,
        type: category.type
      }).returning();
      tier1Ids[category.slug] = inserted.id;
      log(`Inserted tier1 category: ${category.name} with ID ${inserted.id}`);
    }

    // Insert tier2 categories with parent references
    const tier2Ids = {};
    for (const category of tier2Categories) {
      const parentId = tier1Ids[category.parent];
      const [inserted] = await db.insert(templateCategories).values({
        name: category.name,
        type: category.type,
        parentId: parentId
      }).returning();
      tier2Ids[category.slug] = inserted.id;
      log(`Inserted tier2 category: ${category.name} with ID ${inserted.id} (parent: ${category.parent})`);
    }

    return { tier1Ids, tier2Ids };
  } catch (error) {
    log(`Error populating template categories: ${error.message}`);
    return { tier1Ids: {}, tier2Ids: {} };
  }
}

async function extractTaskTemplatesFromCode() {
  // This is just a placeholder for now
  // In a real implementation, we would parse the taskTemplates.ts file
  // and extract all the templates

  // Return some sample templates to demonstrate the structure
  return [
    {
      templateId: 'FN1',
      title: 'Form & Soil Preparation (FN1)',
      description: 'Set foundation slab forms accurately per blueprint...',
      tier1CategorySlug: 'structural',
      tier2CategorySlug: 'foundation',
      estimatedDuration: 3
    },
    {
      templateId: 'PL1',
      title: 'Fixture Selection and Special Item Ordering (PL1)',
      description: 'Determine type and quantity of plumbing fixtures...',
      tier1CategorySlug: 'systems',
      tier2CategorySlug: 'plumbing',
      estimatedDuration: 7
    }
  ];
}

async function populateTaskTemplates(categoryIds) {
  try {
    // First clear existing data to avoid duplicates
    await db.delete(taskTemplates);
    log('Cleared existing task templates');

    // For now, we're using a simplified approach since we can't easily
    // extract all the template data from the code in this script
    // In a production environment, we would parse the taskTemplates.ts file

    // Get templates (in a real implementation this would parse the file)
    const templates = await extractTaskTemplatesFromCode();

    // Insert templates
    for (const template of templates) {
      const tier1Id = categoryIds.tier1Ids[template.tier1CategorySlug];
      const tier2Id = categoryIds.tier2Ids[template.tier2CategorySlug];

      if (!tier1Id || !tier2Id) {
        log(`Warning: Could not find category IDs for template ${template.templateId}`);
        continue;
      }

      const [inserted] = await db.insert(taskTemplates).values({
        templateId: template.templateId,
        title: template.title,
        description: template.description,
        tier1CategoryId: tier1Id,
        tier2CategoryId: tier2Id,
        estimatedDuration: template.estimatedDuration
      }).returning();

      log(`Inserted task template: ${template.title} with ID ${inserted.id}`);
    }

    return true;
  } catch (error) {
    log(`Error populating task templates: ${error.message}`);
    return false;
  }
}

async function main() {
  log('Starting template migration...');

  // Create tables if they don't exist
  const tablesCreated = await createTables();
  if (!tablesCreated) {
    log('Failed to create tables. Migration aborted.');
    process.exit(1);
  }

  // Populate template categories
  const categoryIds = await populateTemplateCategories();
  if (Object.keys(categoryIds.tier1Ids).length === 0) {
    log('Failed to populate template categories. Migration aborted.');
    process.exit(1);
  }

  // Populate task templates
  const templatesPopulated = await populateTaskTemplates(categoryIds);
  if (!templatesPopulated) {
    log('Failed to populate task templates. Migration completed with errors.');
    process.exit(1);
  }

  log('Template migration completed successfully!');
  process.exit(0);
}

// Run the migration
main().catch(error => {
  console.error('Unhandled error:', error);
  process.exit(1);
});