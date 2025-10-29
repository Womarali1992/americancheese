/**
 * Migration Script: Legacy Categories to Generic Category System
 * 
 * This script migrates from the old hard-coded tier1/tier2 system to the new
 * generic category system while preserving all existing data.
 */

import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { 
  categories, 
  tasks, 
  materials,
  categoryTemplatesSets,
  categoryTemplateItems,
  projects,
  type InsertCategory,
  type InsertCategoryTemplateSet,
  type InsertCategoryTemplateItem
} from '../shared/schema';
import { eq, isNull } from 'drizzle-orm';

// Database connection
const connectionString = process.env.DATABASE_URL || 'postgresql://postgres:password@localhost:5432/americancheese';
const client = postgres(connectionString);
const db = drizzle(client);

interface MigrationStats {
  categoriesCreated: number;
  tasksUpdated: number;
  materialsUpdated: number;
  templateSetsCreated: number;
}

/**
 * Main migration function
 */
async function migrateToGenericCategories(): Promise<MigrationStats> {
  console.log('🚀 Starting migration to generic category system...');
  
  const stats: MigrationStats = {
    categoriesCreated: 0,
    tasksUpdated: 0,
    materialsUpdated: 0,
    templateSetsCreated: 0
  };

  try {
    // Step 1: Create default template sets
    console.log('📝 Creating default template sets...');
    await createDefaultTemplateSets();
    stats.templateSetsCreated = 3;

    // Step 2: Analyze existing data
    console.log('🔍 Analyzing existing categories...');
    const legacyCategories = await analyzeLegacyCategories();
    
    // Step 3: Create global categories from common patterns
    console.log('🏗️ Creating global categories...');
    const globalCategories = await createGlobalCategories(legacyCategories);
    stats.categoriesCreated += globalCategories.length;

    // Step 4: Create project-specific categories
    console.log('📂 Creating project-specific categories...');
    const allProjects = await db.select().from(projects);
    
    for (const project of allProjects) {
      const projectCategories = await createProjectCategories(project.id, legacyCategories);
      stats.categoriesCreated += projectCategories.length;
    }

    // Step 5: Update tasks to use new category system
    console.log('✅ Updating tasks...');
    stats.tasksUpdated = await updateTaskCategories();

    // Step 6: Update materials to use new category system
    console.log('📦 Updating materials...');
    stats.materialsUpdated = await updateMaterialCategories();

    console.log('✨ Migration completed successfully!');
    console.log('📊 Migration Stats:', stats);
    
    return stats;
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    throw error;
  } finally {
    await client.end();
  }
}

/**
 * Create default template sets
 */
async function createDefaultTemplateSets(): Promise<void> {
  const templateSets = [
    {
      name: 'Generic Project',
      description: 'Simple category structure for any type of project',
      categories: [
        { name: 'Planning', slug: 'planning', color: '#6366f1', level: 1, sortOrder: 1 },
        { name: 'Development', slug: 'development', color: '#10b981', level: 1, sortOrder: 2 },
        { name: 'Testing', slug: 'testing', color: '#f59e0b', level: 1, sortOrder: 3 },
        { name: 'Deployment', slug: 'deployment', color: '#ef4444', level: 1, sortOrder: 4 },
        { name: 'Maintenance', slug: 'maintenance', color: '#8b5cf6', level: 1, sortOrder: 5 },
      ]
    },
    {
      name: 'Construction Project',
      description: 'Traditional construction project categories',
      categories: [
        { name: 'Foundation', slug: 'foundation', color: '#8b4513', level: 1, sortOrder: 1 },
        { name: 'Framing', slug: 'framing', color: '#d2691e', level: 1, sortOrder: 2 },
        { name: 'Systems', slug: 'systems', color: '#4682b4', level: 1, sortOrder: 3 },
        { name: 'Finishing', slug: 'finishing', color: '#32cd32', level: 1, sortOrder: 4 },
        { name: 'Electrical', slug: 'electrical', parentSlug: 'systems', color: '#ffd700', level: 2, sortOrder: 1 },
        { name: 'Plumbing', slug: 'plumbing', parentSlug: 'systems', color: '#00bfff', level: 2, sortOrder: 2 },
        { name: 'HVAC', slug: 'hvac', parentSlug: 'systems', color: '#ff6347', level: 2, sortOrder: 3 },
      ]
    },
    {
      name: 'Software Development',
      description: 'Software development lifecycle categories',
      categories: [
        { name: 'Requirements', slug: 'requirements', color: '#6366f1', level: 1, sortOrder: 1 },
        { name: 'Design', slug: 'design', color: '#10b981', level: 1, sortOrder: 2 },
        { name: 'Implementation', slug: 'implementation', color: '#f59e0b', level: 1, sortOrder: 3 },
        { name: 'Testing', slug: 'testing', color: '#ef4444', level: 1, sortOrder: 4 },
        { name: 'Deployment', slug: 'deployment', color: '#8b5cf6', level: 1, sortOrder: 5 },
        { name: 'Frontend', slug: 'frontend', parentSlug: 'implementation', color: '#ff6b6b', level: 2, sortOrder: 1 },
        { name: 'Backend', slug: 'backend', parentSlug: 'implementation', color: '#4ecdc4', level: 2, sortOrder: 2 },
        { name: 'Database', slug: 'database', parentSlug: 'implementation', color: '#ffe66d', level: 2, sortOrder: 3 },
      ]
    }
  ];

  for (const templateData of templateSets) {
    // Create template set
    const [templateSet] = await db
      .insert(categoryTemplatesSets)
      .values({
        name: templateData.name,
        description: templateData.description,
        isDefault: true
      })
      .returning();

    // Create template items
    const parentMap = new Map<string, number>();
    
    // First pass: create level 1 categories
    for (const category of templateData.categories.filter(c => c.level === 1)) {
      const [item] = await db
        .insert(categoryTemplateItems)
        .values({
          templateSetId: templateSet.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          level: category.level,
          sortOrder: category.sortOrder,
          parentSlug: null
        })
        .returning();
        
      parentMap.set(category.slug, item.id);
    }

    // Second pass: create child categories
    for (const category of templateData.categories.filter(c => c.level > 1)) {
      await db
        .insert(categoryTemplateItems)
        .values({
          templateSetId: templateSet.id,
          name: category.name,
          slug: category.slug,
          color: category.color,
          level: category.level,
          sortOrder: category.sortOrder,
          parentSlug: category.parentSlug || null
        });
    }
  }
}

/**
 * Analyze existing legacy categories
 */
async function analyzeLegacyCategories() {
  const allTasks = await db.select({
    tier1Category: tasks.tier1Category,
    tier2Category: tasks.tier2Category,
    projectId: tasks.projectId
  }).from(tasks);

  const allMaterials = await db.select({
    tier: materials.tier,
    tier2Category: materials.tier2Category,
    projectId: materials.projectId
  }).from(materials);

  // Collect unique category combinations
  const categoryMap = new Map<string, {
    tier1: string;
    tier2?: string;
    count: number;
    projects: Set<number>;
  }>();

  // Process tasks
  allTasks.forEach(task => {
    if (task.tier1Category) {
      const key = `${task.tier1Category}|${task.tier2Category || ''}`;
      const existing = categoryMap.get(key) || {
        tier1: task.tier1Category,
        tier2: task.tier2Category || undefined,
        count: 0,
        projects: new Set()
      };
      
      existing.count++;
      existing.projects.add(task.projectId);
      categoryMap.set(key, existing);
    }
  });

  // Process materials
  allMaterials.forEach(material => {
    if (material.tier) {
      const key = `${material.tier}|${material.tier2Category || ''}`;
      const existing = categoryMap.get(key) || {
        tier1: material.tier,
        tier2: material.tier2Category || undefined,
        count: 0,
        projects: new Set()
      };
      
      existing.count++;
      if (material.projectId) {
        existing.projects.add(material.projectId);
      }
      categoryMap.set(key, existing);
    }
  });

  return Array.from(categoryMap.values());
}

/**
 * Create global categories from common patterns
 */
async function createGlobalCategories(legacyCategories: any[]): Promise<any[]> {
  // Find categories that appear in multiple projects (global patterns)
  const globalCandidates = legacyCategories.filter(cat => cat.projects.size >= 2);
  
  const createdCategories = [];
  const categoryMap = new Map<string, number>();
  
  // Create tier1 categories first
  const uniqueTier1 = [...new Set(globalCandidates.map(cat => cat.tier1))];
  
  for (let i = 0; i < uniqueTier1.length; i++) {
    const tier1Name = uniqueTier1[i];
    const formattedName = formatCategoryName(tier1Name);
    
    const [category] = await db
      .insert(categories)
      .values({
        name: formattedName,
        slug: generateSlug(tier1Name),
        level: 1,
        sortOrder: i + 1,
        color: generateColor(1, i),
        projectId: null, // Global category
        isActive: true,
        isSystem: false,
        description: `Global category migrated from legacy tier1: ${tier1Name}`
      })
      .returning();
      
    createdCategories.push(category);
    categoryMap.set(`${tier1Name}|`, category.id);
  }

  // Create tier2 categories
  const tier2Categories = globalCandidates.filter(cat => cat.tier2);
  
  for (const cat of tier2Categories) {
    const parentId = categoryMap.get(`${cat.tier1}|`);
    if (!parentId) continue;
    
    const formattedName = formatCategoryName(cat.tier2!);
    
    const [category] = await db
      .insert(categories)
      .values({
        name: formattedName,
        slug: generateSlug(cat.tier2!),
        level: 2,
        parentId,
        sortOrder: 1,
        color: generateColor(2, 1),
        projectId: null,
        isActive: true,
        isSystem: false,
        description: `Global category migrated from legacy tier2: ${cat.tier2}`
      })
      .returning();
      
    createdCategories.push(category);
    categoryMap.set(`${cat.tier1}|${cat.tier2}`, category.id);
  }

  return createdCategories;
}

/**
 * Create project-specific categories
 */
async function createProjectCategories(projectId: number, legacyCategories: any[]): Promise<any[]> {
  // Find categories specific to this project
  const projectCategories = legacyCategories.filter(cat => 
    cat.projects.has(projectId) && cat.projects.size === 1
  );
  
  const createdCategories = [];
  const categoryMap = new Map<string, number>();
  
  // Create tier1 categories
  const uniqueTier1 = [...new Set(projectCategories.map(cat => cat.tier1))];
  
  for (let i = 0; i < uniqueTier1.length; i++) {
    const tier1Name = uniqueTier1[i];
    const formattedName = formatCategoryName(tier1Name);
    
    const [category] = await db
      .insert(categories)
      .values({
        name: formattedName,
        slug: generateSlug(`${tier1Name}-${projectId}`), // Make slug unique per project
        level: 1,
        sortOrder: i + 1,
        color: generateColor(1, i),
        projectId,
        isActive: true,
        isSystem: false,
        description: `Project category migrated from legacy tier1: ${tier1Name}`
      })
      .returning();
      
    createdCategories.push(category);
    categoryMap.set(`${tier1Name}|`, category.id);
  }

  // Create tier2 categories
  const tier2Categories = projectCategories.filter(cat => cat.tier2);
  
  for (const cat of tier2Categories) {
    const parentId = categoryMap.get(`${cat.tier1}|`);
    if (!parentId) continue;
    
    const formattedName = formatCategoryName(cat.tier2!);
    
    const [category] = await db
      .insert(categories)
      .values({
        name: formattedName,
        slug: generateSlug(`${cat.tier2}-${projectId}`),
        level: 2,
        parentId,
        sortOrder: 1,
        color: generateColor(2, 1),
        projectId,
        isActive: true,
        isSystem: false,
        description: `Project category migrated from legacy tier2: ${cat.tier2}`
      })
      .returning();
      
    createdCategories.push(category);
    categoryMap.set(`${cat.tier1}|${cat.tier2}`, category.id);
  }

  return createdCategories;
}

/**
 * Update all tasks to use new category IDs
 */
async function updateTaskCategories(): Promise<number> {
  const allTasks = await db.select().from(tasks);
  const allCategories = await db.select().from(categories);
  
  let updatedCount = 0;
  
  for (const task of allTasks) {
    if (task.tier1Category) {
      // Find matching category
      let matchingCategory = null;
      
      // Try to find by tier2 first if it exists
      if (task.tier2Category) {
        matchingCategory = allCategories.find(cat => 
          cat.slug.includes(generateSlug(task.tier2Category!)) &&
          (cat.projectId === task.projectId || cat.projectId === null)
        );
      }
      
      // Fall back to tier1
      if (!matchingCategory) {
        matchingCategory = allCategories.find(cat => 
          cat.slug.includes(generateSlug(task.tier1Category!)) &&
          cat.level === 1 &&
          (cat.projectId === task.projectId || cat.projectId === null)
        );
      }
      
      if (matchingCategory) {
        await db
          .update(tasks)
          .set({ categoryId: matchingCategory.id })
          .where(eq(tasks.id, task.id));
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

/**
 * Update all materials to use new category IDs
 */
async function updateMaterialCategories(): Promise<number> {
  const allMaterials = await db.select().from(materials);
  const allCategories = await db.select().from(categories);
  
  let updatedCount = 0;
  
  for (const material of allMaterials) {
    if (material.tier) {
      let matchingCategory = null;
      
      // Try to find by tier2 first if it exists
      if (material.tier2Category) {
        matchingCategory = allCategories.find(cat => 
          cat.slug.includes(generateSlug(material.tier2Category!)) &&
          (cat.projectId === material.projectId || cat.projectId === null)
        );
      }
      
      // Fall back to tier1
      if (!matchingCategory) {
        matchingCategory = allCategories.find(cat => 
          cat.slug.includes(generateSlug(material.tier!)) &&
          cat.level === 1 &&
          (cat.projectId === material.projectId || cat.projectId === null)
        );
      }
      
      if (matchingCategory) {
        await db
          .update(materials)
          .set({ categoryId: matchingCategory.id })
          .where(eq(materials.id, material.id));
        updatedCount++;
      }
    }
  }
  
  return updatedCount;
}

// Utility functions
function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, '')
    .replace(/\s+/g, '-')
    .replace(/-+/g, '-')
    .replace(/^-|-$/g, '');
}

function formatCategoryName(name: string): string {
  return name
    .split(/[-_\s]+/)
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

function generateColor(level: number, sortOrder: number): string {
  const colorPalettes = {
    1: ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4', '#84cc16', '#f97316'],
    2: ['#8b5cf6', '#f59e0b', '#10b981', '#ef4444', '#6366f1', '#84cc16', '#f97316', '#06b6d4']
  };

  const palette = colorPalettes[level as keyof typeof colorPalettes] || colorPalettes[1];
  return palette[sortOrder % palette.length] || palette[0];
}

// Run migration if called directly
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
if (process.argv[1] === __filename) {
  migrateToGenericCategories()
    .then((stats) => {
      console.log('🎉 Migration completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('💥 Migration failed:', error);
      process.exit(1);
    });
}

export { migrateToGenericCategories };