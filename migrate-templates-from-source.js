/**
 * Script to migrate task templates from the source code to database tables
 * This script extracts templates directly from shared/taskTemplates.ts and
 * populates the database tables.
 */

import fs from 'fs/promises';
import path from 'path';
import { db } from './server/db.ts';
import { taskTemplates, templateCategories } from './shared/schema.ts';
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
    // First check if there are existing categories
    const existingCategories = await db.select().from(templateCategories);
    
    // If categories already exist, don't recreate them
    if (existingCategories.length > 0) {
      log(`Found ${existingCategories.length} existing template categories. Skipping creation.`);
      
      // Create a mapping of slugs to IDs for existing categories
      const tier1Ids = {};
      const tier2Ids = {};
      
      for (const category of existingCategories) {
        // Find the matching category in our predefined lists
        let matchingTier1 = tier1Categories.find(c => c.name.toLowerCase() === category.name.toLowerCase());
        let matchingTier2 = tier2Categories.find(c => c.name.toLowerCase() === category.name.toLowerCase());
        
        if (matchingTier1) {
          tier1Ids[matchingTier1.slug] = category.id;
        } else if (matchingTier2) {
          tier2Ids[matchingTier2.slug] = category.id;
        }
      }
      
      return { tier1Ids, tier2Ids };
    }
    
    // Otherwise, create the categories
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

// Function to extract task templates from the source code
async function extractTaskTemplatesFromSourceCode() {
  try {
    const filePath = path.join(process.cwd(), 'shared', 'taskTemplates.ts');
    let sourceCode = await fs.readFile(filePath, 'utf-8');
    
    // Define regex patterns to find template arrays
    const templateArrayPattern = /const\s+(\w+)Tasks:\s+TaskTemplate\[\]\s+=\s+\[([\s\S]*?)\];/g;
    
    // Define regex to parse individual template objects
    const templateObjectPattern = /{\s*id:\s*"([^"]+)",\s*title:\s*"([^"]+)",\s*description:\s*"([^"]*)",\s*tier1Category:\s*"([^"]+)",\s*tier2Category:\s*"([^"]+)",\s*category:\s*"([^"]+)",\s*estimatedDuration:\s*(\d+),?\s*}/g;
    
    const allTemplates = [];
    let match;
    
    // First extract all the template arrays
    while ((match = templateArrayPattern.exec(sourceCode)) !== null) {
      const arrayName = match[1];
      const arrayContent = match[2];
      
      // Now extract individual template objects from this array
      let templateMatch;
      const templateRegexForArray = new RegExp(templateObjectPattern);
      
      while ((templateMatch = templateRegexForArray.exec(arrayContent)) !== null) {
        allTemplates.push({
          templateId: templateMatch[1],
          title: templateMatch[2],
          description: templateMatch[3],
          tier1CategorySlug: templateMatch[4],
          tier2CategorySlug: templateMatch[5],
          category: templateMatch[6],
          estimatedDuration: parseInt(templateMatch[7], 10)
        });
      }
    }
    
    log(`Extracted ${allTemplates.length} templates from source code`);
    return allTemplates;
  } catch (error) {
    log(`Error extracting templates from source code: ${error.message}`);
    return [];
  }
}

async function populateTaskTemplates(categoryIds) {
  try {
    // First check if there are existing templates
    const existingTemplates = await db.select().from(taskTemplates);
    
    if (existingTemplates.length > 0) {
      log(`Found ${existingTemplates.length} existing task templates. Skipping creation.`);
      return true;
    }
    
    // First clear existing data to avoid duplicates
    await db.delete(taskTemplates);
    log('Cleared existing task templates');

    // Extract templates from source code
    const templates = await extractTaskTemplatesFromSourceCode();
    
    if (templates.length === 0) {
      log('No templates found in source code. Using fallback templates.');
      // Insert a few sample templates if extraction failed
      templates.push(
        {
          templateId: 'FN1',
          title: 'Form & Soil Preparation (FN1)',
          description: 'Set foundation slab forms accurately per blueprint; compact foundation sub-soil thoroughly with moisture and tamper.',
          tier1CategorySlug: 'structural',
          tier2CategorySlug: 'foundation',
          estimatedDuration: 3
        },
        {
          templateId: 'PL1',
          title: 'Fixture Selection and Special Item Ordering (PL1)',
          description: 'Determine type and quantity of plumbing fixtures (styles and colors).',
          tier1CategorySlug: 'systems',
          tier2CategorySlug: 'plumbing',
          estimatedDuration: 7
        }
      );
    }

    // Insert templates
    let insertedCount = 0;
    for (const template of templates) {
      const tier1Id = categoryIds.tier1Ids[template.tier1CategorySlug];
      const tier2Id = categoryIds.tier2Ids[template.tier2CategorySlug];

      if (!tier1Id || !tier2Id) {
        log(`Warning: Could not find category IDs for template ${template.templateId}`);
        continue;
      }

      await db.insert(taskTemplates).values({
        templateId: template.templateId,
        title: template.title,
        description: template.description,
        tier1CategoryId: tier1Id,
        tier2CategoryId: tier2Id,
        estimatedDuration: template.estimatedDuration
      });

      insertedCount++;
      
      // Log progress every 10 templates
      if (insertedCount % 10 === 0) {
        log(`Inserted ${insertedCount} of ${templates.length} templates...`);
      }
    }

    log(`Successfully inserted ${insertedCount} task templates`);
    return true;
  } catch (error) {
    log(`Error populating task templates: ${error.message}`);
    return false;
  }
}

async function main() {
  log('Starting template migration from source code...');

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