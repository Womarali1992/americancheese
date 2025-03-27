/**
 * Test script to verify task templates are loaded correctly
 */
import { getAllTaskTemplates, getTaskTemplateById, getTemplatesByTier1, getTemplatesByTier2 } from './shared/taskTemplates.ts';

function testTaskTemplates() {
  // Test 1: Get all templates
  const allTemplates = getAllTaskTemplates();
  console.log(`Total templates: ${allTemplates.length}`);
  
  // Test 2: Display some example templates
  console.log('\nExample templates:');
  allTemplates.slice(0, 3).forEach(template => {
    console.log(`- ${template.id}: ${template.title} (${template.tier1Category}/${template.tier2Category})`);
  });
  
  // Test 3: Find template by ID
  const foundTemplate = getTaskTemplateById('FN1');
  console.log('\nTemplate FN1 details:');
  if (foundTemplate) {
    console.log(JSON.stringify(foundTemplate, null, 2));
  } else {
    console.log('Template FN1 not found');
  }
  
  // Test 4: Get templates by tier1 category
  const structuralTemplates = getTemplatesByTier1('structural');
  console.log(`\nStructural templates count: ${structuralTemplates.length}`);
  
  // Test 5: Get templates by tier2 category
  const foundationTemplates = getTemplatesByTier2('structural', 'foundation');
  console.log(`\nFoundation templates count: ${foundationTemplates.length}`);
  foundationTemplates.forEach(template => {
    console.log(`- ${template.id}: ${template.title}`);
  });
  
  // Test 6: Count templates by tier1 categories
  const categories = {};
  allTemplates.forEach(template => {
    categories[template.tier1Category] = categories[template.tier1Category] || {};
    categories[template.tier1Category][template.tier2Category] = 
      (categories[template.tier1Category][template.tier2Category] || 0) + 1;
  });
  
  console.log('\nTemplates by category:');
  Object.keys(categories).forEach(tier1 => {
    console.log(`\n${tier1.toUpperCase()}:`);
    Object.keys(categories[tier1]).forEach(tier2 => {
      console.log(`  - ${tier2}: ${categories[tier1][tier2]} templates`);
    });
  });
}

testTaskTemplates();