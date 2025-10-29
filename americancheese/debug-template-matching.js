/**
 * Debug script to test template matching logic
 * This will help identify why tasks aren't being created from templates
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getAllTaskTemplates } from './shared/taskTemplates.ts';
import { projectCategories, tasks } from './shared/schema.ts';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema: { projectCategories, tasks } });

async function debugTemplateMatching() {
  try {
    console.log('🔍 Debugging template matching logic...\n');
    
    // Get all task templates
    const allTaskTemplates = getAllTaskTemplates();
    console.log(`📋 Found ${allTaskTemplates.length} task templates`);
    
    // Get all projects
    const projects = await db.select().from(projectCategories).where(eq(projectCategories.projectId, 1));
    console.log(`🏗️  Found ${projects.length} categories for project 1`);
    
    // Show unique tier1 categories from templates
    const templateTier1Categories = [...new Set(allTaskTemplates.map(t => t.tier1Category))];
    console.log(`\n📊 Template tier1 categories:`, templateTier1Categories);
    
    // Show unique tier2 categories from templates
    const templateTier2Categories = [...new Set(allTaskTemplates.map(t => t.tier2Category))];
    console.log(`📊 Template tier2 categories:`, templateTier2Categories);
    
    // Show project categories
    const projectTier1Categories = projects.filter(c => c.type === 'tier1');
    const projectTier2Categories = projects.filter(c => c.type === 'tier2');
    
    console.log(`\n🏗️  Project tier1 categories:`, projectTier1Categories.map(c => c.name));
    console.log(`🏗️  Project tier2 categories:`, projectTier2Categories.map(c => c.name));
    
    // Test matching logic for first few templates
    console.log(`\n🧪 Testing matching logic for first 5 templates:`);
    
    for (let i = 0; i < Math.min(5, allTaskTemplates.length); i++) {
      const template = allTaskTemplates[i];
      console.log(`\n📝 Template ${i + 1}: ${template.title}`);
      console.log(`   Tier1: "${template.tier1Category}"`);
      console.log(`   Tier2: "${template.tier2Category}"`);
      
      // Find matching tier1 category
      const matchingTier1 = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, 1),
          sql`lower(${projectCategories.name}) = lower(${template.tier1Category})`,
          eq(projectCategories.type, 'tier1')
        ));
      
      if (matchingTier1.length === 0) {
        console.log(`   ❌ No matching tier1 category found for "${template.tier1Category}"`);
        continue;
      }
      
      console.log(`   ✅ Found tier1 category: "${matchingTier1[0].name}" (ID: ${matchingTier1[0].id})`);
      
      // Find matching tier2 category
      const matchingTier2 = await db
        .select()
        .from(projectCategories)
        .where(and(
          eq(projectCategories.projectId, 1),
          sql`lower(${projectCategories.name}) = lower(${template.tier2Category})`,
          eq(projectCategories.type, 'tier2'),
          eq(projectCategories.parentId, matchingTier1[0].id)
        ));
      
      if (matchingTier2.length === 0) {
        console.log(`   ❌ No matching tier2 category found for "${template.tier2Category}"`);
        continue;
      }
      
      console.log(`   ✅ Found tier2 category: "${matchingTier2[0].name}" (ID: ${matchingTier2[0].id})`);
      console.log(`   ✅ Template would create task successfully!`);
    }
    
    // Check if any tasks exist
    const existingTasks = await db.select().from(tasks).where(eq(tasks.projectId, 1));
    console.log(`\n📋 Project 1 has ${existingTasks.length} existing tasks`);
    
    if (existingTasks.length > 0) {
      console.log(`   Sample tasks:`, existingTasks.slice(0, 3).map(t => t.title));
    }
    
  } catch (error) {
    console.error('❌ Error debugging template matching:', error);
  } finally {
    await queryClient.end();
  }
}

// Import missing dependencies
import { eq, sql, and } from 'drizzle-orm';

// Run the debug function
debugTemplateMatching().catch(console.error);
