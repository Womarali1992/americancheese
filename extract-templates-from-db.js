/**
 * Script to extract templates from the database for migration
 * This script will fetch all tasks from the database and extract their
 * tier1 and tier2 categories, then format them for migration to the admin panel.
 */

import { db } from './server/db.js';
import { tasks } from './shared/schema.js';
import { sql } from 'drizzle-orm';

async function main() {
  try {
    console.log('Connecting to database...');
    
    // Query all tasks
    const allTasks = await db.select().from(tasks);
    console.log(`Found ${allTasks.length} tasks in the database`);
    
    // Extract unique tier1 categories
    const tier1Categories = [...new Set(allTasks.map(task => task.tier1Category))];
    console.log('Tier1 Categories:');
    console.log(tier1Categories);
    
    // Extract unique tier2 categories
    const tier2Categories = [...new Set(allTasks.map(task => task.tier2Category))];
    console.log('Tier2 Categories:');
    console.log(tier2Categories);
    
    // Map tier2 categories to their parent tier1 categories
    const categoryMapping = {};
    tier2Categories.forEach(tier2 => {
      const tasksWithThisTier2 = allTasks.filter(task => task.tier2Category === tier2);
      const parentTier1 = tasksWithThisTier2[0].tier1Category;
      categoryMapping[tier2] = parentTier1;
    });
    
    console.log('Category Mapping (tier2 -> tier1):');
    console.log(categoryMapping);
    
    // Format this data for migration
    console.log('\nFormatted for migration:');
    
    console.log('Tier1 Categories:');
    const tier1Output = tier1Categories.map(cat => {
      return `{ name: '${cat.charAt(0).toUpperCase() + cat.slice(1)}', type: 'tier1', slug: '${cat.toLowerCase()}' }`;
    });
    console.log(`[\n  ${tier1Output.join(',\n  ')}\n]`);
    
    console.log('\nTier2 Categories:');
    const tier2Output = tier2Categories.map(cat => {
      const parent = categoryMapping[cat];
      return `{ name: '${cat.charAt(0).toUpperCase() + cat.slice(1)}', type: 'tier2', slug: '${cat.toLowerCase()}', parent: '${parent.toLowerCase()}' }`;
    });
    console.log(`[\n  ${tier2Output.join(',\n  ')}\n]`);
    
    // Now extract unique template IDs from tasks
    const templateIds = {};
    allTasks.forEach(task => {
      if (task.templateId) {
        const templateId = task.templateId;
        if (!templateIds[templateId]) {
          templateIds[templateId] = {
            id: templateId,
            title: task.title,
            description: task.description || '',
            tier1Category: task.tier1Category,
            tier2Category: task.tier2Category,
            estimatedDuration: 1 // Default value since we don't have this in the database
          };
        }
      }
    });
    
    console.log(`\nFound ${Object.keys(templateIds).length} unique template IDs`);
    
    if (Object.keys(templateIds).length > 0) {
      console.log('Sample template data:');
      const sampleKey = Object.keys(templateIds)[0];
      console.log(templateIds[sampleKey]);
    }
    
    console.log('Script completed successfully.');
  } catch (error) {
    console.error('Error:', error);
  }
}

main();