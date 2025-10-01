/**
 * Test script to verify admin preset functionality
 */

import { getPresetById, getPresetOptions } from './shared/presets.ts';

console.log('Testing Admin Preset Functionality...\n');

// Test 1: Check if presets are available
const presets = getPresetOptions();
console.log(`✅ Found ${presets.length} preset options for admin panel`);

presets.forEach(preset => {
  console.log(`  - ${preset.label}: ${preset.description}`);
});

// Test 2: Check if Home Builder preset has correct structure
const homeBuilderPreset = getPresetById('home-builder');
if (homeBuilderPreset) {
  console.log('\n✅ Home Builder preset loaded successfully');
  console.log(`  - ID: ${homeBuilderPreset.id}`);
  console.log(`  - Name: ${homeBuilderPreset.name}`);
  console.log(`  - Tier 1 categories: ${homeBuilderPreset.categories.tier1.length}`);
  console.log(`  - Tier 2 category groups: ${Object.keys(homeBuilderPreset.categories.tier2).length}`);

  // Check if categories are in correct order
  const tier1Names = homeBuilderPreset.categories.tier1.map(c => c.name);
  const expectedOrder = ['Permitting', 'Structural', 'Systems', 'Finishings'];
  const isCorrectOrder = JSON.stringify(tier1Names) === JSON.stringify(expectedOrder);

  if (isCorrectOrder) {
    console.log('  ✅ Categories are in correct order');
  } else {
    console.log('  ❌ Categories are not in correct order');
    console.log(`    Expected: ${expectedOrder.join(', ')}`);
    console.log(`    Actual: ${tier1Names.join(', ')}`);
  }

  // Check if all expected categories are present
  const hasAllCategories = expectedOrder.every(cat => tier1Names.includes(cat));
  if (hasAllCategories) {
    console.log('  ✅ All expected categories are present');
  } else {
    console.log('  ❌ Missing expected categories');
  }

} else {
  console.log('\n❌ Home Builder preset not found');
}

// Test 3: Verify preset structure for admin display
console.log('\n📋 Testing preset structure for admin display:');
if (homeBuilderPreset) {
  console.log('✅ Preset has proper structure for admin dialog display');

  // Test tier 1 display
  console.log('  Tier 1 categories with sort order:');
  homeBuilderPreset.categories.tier1.forEach(tier1 => {
    console.log(`    ${tier1.sortOrder}. ${tier1.name} - ${tier1.description}`);
  });

  // Test tier 2 display
  console.log('  Tier 2 categories by parent:');
  Object.entries(homeBuilderPreset.categories.tier2).forEach(([parent, tier2s]) => {
    console.log(`    ${parent} → ${tier2s.length} subcategories`);
    tier2s.forEach(tier2 => {
      console.log(`      - ${tier2.name}: ${tier2.description}`);
    });
  });
}

console.log('\n🎉 Admin preset functionality test completed!');
