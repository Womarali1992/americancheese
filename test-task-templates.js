/**
 * Test script to verify task templates are loaded correctly
 */

import { getAllTaskTemplates } from './shared/taskTemplates';

function testTaskTemplates() {
  const templates = getAllTaskTemplates();
  
  console.log(`Found ${templates.length} task templates`);
  console.log('\nCategories:');
  
  // Group templates by tier1 and tier2 categories and count
  const categories = {};
  
  templates.forEach(template => {
    const tier1 = template.tier1Category;
    const tier2 = template.tier2Category;
    
    if (!categories[tier1]) {
      categories[tier1] = {};
    }
    
    if (!categories[tier1][tier2]) {
      categories[tier1][tier2] = 0;
    }
    
    categories[tier1][tier2]++;
  });
  
  // Print category summary
  Object.entries(categories).forEach(([tier1, tier2Categories]) => {
    console.log(`\n${tier1.toUpperCase()}`);
    
    Object.entries(tier2Categories).forEach(([tier2, count]) => {
      console.log(`  ${tier2}: ${count} templates`);
    });
  });
  
  // Print a few sample templates
  console.log('\nSample templates:');
  for (let i = 0; i < Math.min(3, templates.length); i++) {
    const template = templates[i];
    console.log(`\n[${template.id}] ${template.title}`);
    console.log(`Category: ${template.tier1Category} / ${template.tier2Category}`);
    console.log(`Duration: ${template.estimatedDuration} days`);
    console.log(`Description: ${template.description.substring(0, 100)}...`);
  }
}

testTaskTemplates();