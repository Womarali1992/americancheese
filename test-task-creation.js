/**
 * Test script to manually create tasks and see what errors occur
 */

import 'dotenv/config';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import { getAllTaskTemplates } from './shared/taskTemplates.ts';
import { projectCategories, tasks } from './shared/schema.ts';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });
const db = drizzle(queryClient, { schema: { projectCategories, tasks } });

async function testTaskCreation() {
  try {
    console.log('🧪 Testing manual task creation...\n');
    
    // Get all task templates
    const allTaskTemplates = getAllTaskTemplates();
    console.log(`📋 Found ${allTaskTemplates.length} task templates`);
    
    // Get project 1 categories
    const projectCats = await db.select().from(projectCategories).where(eq(projectCategories.projectId, 1));
    const tier1Cats = projectCats.filter(c => c.type === 'tier1');
    const tier2Cats = projectCats.filter(c => c.type === 'tier2');
    
    console.log(`🏗️  Project 1 has ${tier1Cats.length} tier1 and ${tier2Cats.length} tier2 categories`);
    
    // Try to create a task manually
    const firstTemplate = allTaskTemplates[0];
    console.log(`\n📝 Attempting to create task from template: ${firstTemplate.title}`);
    console.log(`   Template ID: ${firstTemplate.id}`);
    console.log(`   Tier1: "${firstTemplate.tier1Category}"`);
    console.log(`   Tier2: "${firstTemplate.tier2Category}"`);
    
    // Find matching categories
    const matchingTier1 = tier1Cats.find(c => 
      c.name.toLowerCase() === firstTemplate.tier1Category.toLowerCase()
    );
    
    if (!matchingTier1) {
      console.log(`   ❌ No matching tier1 category found`);
      return;
    }
    
    console.log(`   ✅ Found tier1 category: "${matchingTier1.name}" (ID: ${matchingTier1.id})`);
    
    const matchingTier2 = tier2Cats.find(c => 
      c.name.toLowerCase() === firstTemplate.tier2Category.toLowerCase() &&
      c.parentId === matchingTier1.id
    );
    
    if (!matchingTier2) {
      console.log(`   ❌ No matching tier2 category found`);
      return;
    }
    
    console.log(`   ✅ Found tier2 category: "${matchingTier2.name}" (ID: ${matchingTier2.id})`);
    
    // Try to create the task
    console.log(`\n🚀 Attempting to create task...`);
    
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + firstTemplate.estimatedDuration);
    
    const taskData = {
      title: firstTemplate.title,
      description: firstTemplate.description,
      projectId: 1,
      tier1Category: firstTemplate.tier1Category,
      tier2Category: firstTemplate.tier2Category,
      category: firstTemplate.category,
      startDate: startDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
      endDate: endDate.toISOString().split('T')[0], // Convert to YYYY-MM-DD string
      status: 'not_started',
      completed: false,
      templateId: firstTemplate.id,
      sortOrder: 0
    };
    
    console.log(`   Task data:`, JSON.stringify(taskData, null, 2));
    
    try {
      const [createdTask] = await db.insert(tasks).values(taskData).returning();
      console.log(`   ✅ Task created successfully!`);
      console.log(`   Created task ID: ${createdTask.id}`);
      console.log(`   Title: ${createdTask.title}`);
    } catch (insertError) {
      console.error(`   ❌ Failed to create task:`, insertError);
      console.error(`   Error details:`, insertError.message);
      
      // Check if it's a constraint violation
      if (insertError.message.includes('violates')) {
        console.log(`   🔍 This appears to be a database constraint violation`);
      }
    }
    
    // Check if task was actually created
    const existingTasks = await db.select().from(tasks).where(eq(tasks.projectId, 1));
    console.log(`\n📋 Project 1 now has ${existingTasks.length} tasks`);
    
    if (existingTasks.length > 0) {
      console.log(`   Latest task:`, existingTasks[existingTasks.length - 1].title);
    }
    
  } catch (error) {
    console.error('❌ Error testing task creation:', error);
  } finally {
    await queryClient.end();
  }
}

// Import missing dependencies
import { eq } from 'drizzle-orm';

// Run the test function
testTaskCreation().catch(console.error);
