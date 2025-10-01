/**
 * Migration Script: Consolidate Category System
 *
 * This script migrates from the current fragmented category system to a unified approach:
 * 1. Uses projectCategories as the single source of truth
 * 2. Migrates legacy tier1Category/tier2Category string fields to projectCategories
 * 3. Creates project categories based on existing data and presets
 * 4. Updates tasks, materials, and labor to reference categoryId instead of legacy fields
 */

import { db } from '../server/db.ts';
import {
  tasks,
  materials,
  labor,
  projectCategories,
  categoryTemplates,
  projects
} from '../shared/schema.ts';
import {
  HOME_BUILDER_PRESET,
  SOFTWARE_DEVELOPMENT_PRESET,
  STANDARD_CONSTRUCTION_PRESET
} from '../shared/presets.ts';
import { eq, and, sql } from 'drizzle-orm';

// Migration state tracking
const migrationLog = {
  projectsProcessed: 0,
  categoriesCreated: 0,
  tasksUpdated: 0,
  materialsUpdated: 0,
  laborUpdated: 0,
  errors: []
};

/**
 * Create project categories from a preset
 */
async function createCategoriesFromPreset(projectId, preset) {
  const createdCategories = new Map(); // Map legacy name -> new category record

  console.log(`Creating categories from ${preset.name} preset for project ${projectId}`);

  // Create tier1 categories
  for (const tier1 of preset.categories.tier1) {
    try {
      const [tier1Category] = await db.insert(projectCategories).values({
        projectId,
        name: tier1.name,
        type: 'tier1',
        parentId: null,
        sortOrder: tier1.sortOrder,
        description: tier1.description
      }).returning();

      createdCategories.set(tier1.name, tier1Category);
      migrationLog.categoriesCreated++;

      // Create tier2 categories under this tier1
      const tier2List = preset.categories.tier2[tier1.name] || [];
      for (const tier2 of tier2List) {
        const [tier2Category] = await db.insert(projectCategories).values({
          projectId,
          name: tier2.name,
          type: 'tier2',
          parentId: tier1Category.id,
          description: tier2.description
        }).returning();

        createdCategories.set(`${tier1.name}/${tier2.name}`, tier2Category);
        createdCategories.set(tier2.name, tier2Category); // Also map by tier2 name alone
        migrationLog.categoriesCreated++;
      }
    } catch (error) {
      console.error(`Error creating category ${tier1.name}:`, error.message);
      migrationLog.errors.push(`Failed to create category ${tier1.name}: ${error.message}`);
    }
  }

  return createdCategories;
}

/**
 * Create categories based on existing legacy data in project
 */
async function createCategoriesFromLegacyData(projectId) {
  const createdCategories = new Map();

  console.log(`Creating categories from legacy data for project ${projectId}`);

  // Get all unique legacy categories used in this project
  const projectTasks = await db.select({
    tier1Category: tasks.tier1Category,
    tier2Category: tasks.tier2Category
  }).from(tasks).where(eq(tasks.projectId, projectId));

  const projectMaterials = await db.select({
    tier: materials.tier,
    tier2Category: materials.tier2Category
  }).from(materials).where(eq(materials.projectId, projectId));

  const projectLabor = await db.select({
    tier1Category: labor.tier1Category,
    tier2Category: labor.tier2Category
  }).from(labor).where(eq(labor.projectId, projectId));

  // Collect unique categories
  const tier1Categories = new Set();
  const tier2Categories = new Set();

  // From tasks
  projectTasks.forEach(task => {
    if (task.tier1Category) tier1Categories.add(task.tier1Category);
    if (task.tier2Category) tier2Categories.add(task.tier2Category);
  });

  // From materials (tier field maps to tier1)
  projectMaterials.forEach(material => {
    if (material.tier && material.tier !== 'other') {
      // Map legacy tier values to proper tier1 names
      const tierMapping = {
        'subcategory-one': 'Structural',
        'subcategory-two': 'Systems',
        'subcategory-three': 'Sheathing',
        'subcategory-four': 'Finishings'
      };
      const mappedTier = tierMapping[material.tier] || material.tier;
      tier1Categories.add(mappedTier);
    }
    if (material.tier2Category) tier2Categories.add(material.tier2Category);
  });

  // From labor
  projectLabor.forEach(laborEntry => {
    if (laborEntry.tier1Category) tier1Categories.add(laborEntry.tier1Category);
    if (laborEntry.tier2Category) tier2Categories.add(laborEntry.tier2Category);
  });

  // Create tier1 categories
  for (const tier1Name of tier1Categories) {
    try {
      const [tier1Category] = await db.insert(projectCategories).values({
        projectId,
        name: tier1Name,
        type: 'tier1',
        parentId: null,
        description: `Legacy category: ${tier1Name}`
      }).returning();

      createdCategories.set(tier1Name, tier1Category);
      migrationLog.categoriesCreated++;
    } catch (error) {
      console.error(`Error creating tier1 category ${tier1Name}:`, error.message);
      migrationLog.errors.push(`Failed to create tier1 category ${tier1Name}: ${error.message}`);
    }
  }

  // Create tier2 categories
  for (const tier2Name of tier2Categories) {
    try {
      // Try to find appropriate parent tier1 for this tier2
      let parentId = null;

      // Look for a tier1 category that this tier2 commonly belongs to
      const tier2Mappings = {
        'Foundation': 'Structural',
        'Framing': 'Structural',
        'Roofing': 'Structural',
        'Electrical': 'Systems',
        'Plumbing': 'Systems',
        'HVAC': 'Systems',
        'Insulation': 'Sheathing',
        'Drywall': 'Sheathing',
        'Windows': 'Sheathing',
        'Flooring': 'Finishings',
        'Paint': 'Finishings',
        'Fixtures': 'Finishings',
        'Landscaping': 'Finishings'
      };

      const suggestedParent = tier2Mappings[tier2Name];
      if (suggestedParent && createdCategories.has(suggestedParent)) {
        parentId = createdCategories.get(suggestedParent).id;
      }

      const [tier2Category] = await db.insert(projectCategories).values({
        projectId,
        name: tier2Name,
        type: 'tier2',
        parentId,
        description: `Legacy category: ${tier2Name}`
      }).returning();

      createdCategories.set(tier2Name, tier2Category);
      migrationLog.categoriesCreated++;
    } catch (error) {
      console.error(`Error creating tier2 category ${tier2Name}:`, error.message);
      migrationLog.errors.push(`Failed to create tier2 category ${tier2Name}: ${error.message}`);
    }
  }

  return createdCategories;
}

/**
 * Update tasks to use categoryId instead of legacy tier fields
 */
async function migrateTasks(projectId, categoryMap) {
  const projectTasks = await db.select().from(tasks).where(eq(tasks.projectId, projectId));

  for (const task of projectTasks) {
    try {
      let categoryId = null;

      // Priority: tier2Category (more specific) > tier1Category
      if (task.tier2Category && categoryMap.has(task.tier2Category)) {
        categoryId = categoryMap.get(task.tier2Category).id;
      } else if (task.tier1Category && categoryMap.has(task.tier1Category)) {
        categoryId = categoryMap.get(task.tier1Category).id;
      }

      if (categoryId) {
        await db.update(tasks)
          .set({ categoryId })
          .where(eq(tasks.id, task.id));
        migrationLog.tasksUpdated++;
      }
    } catch (error) {
      console.error(`Error updating task ${task.id}:`, error.message);
      migrationLog.errors.push(`Failed to update task ${task.id}: ${error.message}`);
    }
  }
}

/**
 * Update materials to use categoryId instead of legacy tier fields
 */
async function migrateMaterials(projectId, categoryMap) {
  const projectMaterials = await db.select().from(materials).where(eq(materials.projectId, projectId));

  for (const material of projectMaterials) {
    try {
      let categoryId = null;

      // Priority: tier2Category > tier field mapped to tier1
      if (material.tier2Category && categoryMap.has(material.tier2Category)) {
        categoryId = categoryMap.get(material.tier2Category).id;
      } else if (material.tier) {
        // Map legacy tier to tier1 category
        const tierMapping = {
          'subcategory-one': 'Structural',
          'subcategory-two': 'Systems',
          'subcategory-three': 'Sheathing',
          'subcategory-four': 'Finishings'
        };
        const mappedTier = tierMapping[material.tier] || material.tier;
        if (categoryMap.has(mappedTier)) {
          categoryId = categoryMap.get(mappedTier).id;
        }
      }

      if (categoryId) {
        await db.update(materials)
          .set({ categoryId })
          .where(eq(materials.id, material.id));
        migrationLog.materialsUpdated++;
      }
    } catch (error) {
      console.error(`Error updating material ${material.id}:`, error.message);
      migrationLog.errors.push(`Failed to update material ${material.id}: ${error.message}`);
    }
  }
}

/**
 * Update labor to reference categoryId
 */
async function migrateLabor(projectId, categoryMap) {
  const projectLabor = await db.select().from(labor).where(eq(labor.projectId, projectId));

  for (const laborEntry of projectLabor) {
    try {
      let categoryId = null;

      // Priority: tier2Category > tier1Category
      if (laborEntry.tier2Category && categoryMap.has(laborEntry.tier2Category)) {
        categoryId = categoryMap.get(laborEntry.tier2Category).id;
      } else if (laborEntry.tier1Category && categoryMap.has(laborEntry.tier1Category)) {
        categoryId = categoryMap.get(laborEntry.tier1Category).id;
      }

      if (categoryId) {
        // Note: labor table doesn't have categoryId field yet, we'll add it in schema update
        // For now, just log what would be updated
        console.log(`Would update labor ${laborEntry.id} to categoryId ${categoryId}`);
        migrationLog.laborUpdated++;
      }
    } catch (error) {
      console.error(`Error processing labor ${laborEntry.id}:`, error.message);
      migrationLog.errors.push(`Failed to process labor ${laborEntry.id}: ${error.message}`);
    }
  }
}

/**
 * Main migration function
 */
async function runMigration() {
  console.log('🚀 Starting Category System Migration...\n');

  try {
    // Get all projects
    const allProjects = await db.select().from(projects);
    console.log(`Found ${allProjects.length} projects to process\n`);

    for (const project of allProjects) {
      console.log(`📋 Processing Project ${project.id}: ${project.name}`);

      // Check if project already has categories
      const existingCategories = await db.select()
        .from(projectCategories)
        .where(eq(projectCategories.projectId, project.id));

      let categoryMap;

      if (existingCategories.length > 0) {
        console.log(`  ✅ Project already has ${existingCategories.length} categories, using existing`);
        // Build map from existing categories
        categoryMap = new Map();
        existingCategories.forEach(cat => {
          categoryMap.set(cat.name, cat);
        });
      } else {
        // Determine which preset to use based on project preset or create from legacy data
        let preset = null;
        if (project.presetId === 'home-builder') {
          preset = HOME_BUILDER_PRESET;
        } else if (project.presetId === 'software-development') {
          preset = SOFTWARE_DEVELOPMENT_PRESET;
        } else if (project.presetId === 'standard-construction') {
          preset = STANDARD_CONSTRUCTION_PRESET;
        }

        if (preset) {
          console.log(`  📂 Creating categories from ${preset.name} preset`);
          categoryMap = await createCategoriesFromPreset(project.id, preset);
        } else {
          console.log(`  🔍 Creating categories from existing legacy data`);
          categoryMap = await createCategoriesFromLegacyData(project.id);
        }
      }

      // Migrate data to use new category system
      console.log(`  🔄 Migrating project data...`);
      await migrateTasks(project.id, categoryMap);
      await migrateMaterials(project.id, categoryMap);
      await migrateLabor(project.id, categoryMap);

      migrationLog.projectsProcessed++;
      console.log(`  ✅ Project ${project.id} migration complete\n`);
    }

    // Migration summary
    console.log('🎉 Migration Complete!\n');
    console.log('📊 Migration Summary:');
    console.log(`  Projects processed: ${migrationLog.projectsProcessed}`);
    console.log(`  Categories created: ${migrationLog.categoriesCreated}`);
    console.log(`  Tasks updated: ${migrationLog.tasksUpdated}`);
    console.log(`  Materials updated: ${migrationLog.materialsUpdated}`);
    console.log(`  Labor entries processed: ${migrationLog.laborUpdated}`);

    if (migrationLog.errors.length > 0) {
      console.log(`\n⚠️  ${migrationLog.errors.length} errors encountered:`);
      migrationLog.errors.forEach(error => console.log(`  - ${error}`));
    } else {
      console.log(`\n✅ No errors encountered!`);
    }

  } catch (error) {
    console.error('💥 Migration failed:', error);
    throw error;
  }
}

// Run migration if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  runMigration()
    .then(() => {
      console.log('\n🏁 Migration script completed successfully');
      process.exit(0);
    })
    .catch((error) => {
      console.error('\n💥 Migration script failed:', error);
      process.exit(1);
    });
}

export { runMigration, migrationLog };