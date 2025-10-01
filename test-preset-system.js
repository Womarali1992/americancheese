/**
 * Test script to verify the preset system is working correctly
 */

const { getPresetById, getAllPresets, HOME_BUILDER_PRESET } = require('./shared/presets.ts');

async function testPresetSystem() {
  console.log('Testing Preset System...\n');

  // Test 1: Check if Home Builder preset exists
  console.log('1. Testing Home Builder preset:');
  const homeBuilderPreset = getPresetById('home-builder');
  if (homeBuilderPreset) {
    console.log('✅ Home Builder preset found');
    console.log(`   Name: ${homeBuilderPreset.name}`);
    console.log(`   Categories: ${homeBuilderPreset.categories.tier1.map(c => c.name).join(', ')}`);
  } else {
    console.log('❌ Home Builder preset not found');
  }

  // Test 2: Check preset structure
  console.log('\n2. Testing preset structure:');
  const presets = getAllPresets();
  console.log(`✅ Found ${presets.length} presets`);

  // Test 3: Verify Home Builder has correct categories
  console.log('\n3. Verifying Home Builder categories:');
  const expectedCategories = ['Permitting', 'Structural', 'Systems', 'Finishings'];
  const actualCategories = homeBuilderPreset.categories.tier1.map(c => c.name);

  const hasAllCategories = expectedCategories.every(cat => actualCategories.includes(cat));
  if (hasAllCategories) {
    console.log('✅ All expected categories present');
    console.log(`   Expected: ${expectedCategories.join(', ')}`);
    console.log(`   Actual: ${actualCategories.join(', ')}`);
  } else {
    console.log('❌ Missing expected categories');
  }

  // Test 4: Check category order
  console.log('\n4. Testing category order:');
  const categoryOrder = actualCategories.join(',');
  const expectedOrder = expectedCategories.join(',');
  if (categoryOrder === expectedOrder) {
    console.log('✅ Category order is correct');
  } else {
    console.log('❌ Category order is incorrect');
    console.log(`   Expected: ${expectedOrder}`);
    console.log(`   Actual: ${categoryOrder}`);
  }

  console.log('\n🎉 Preset system test completed!');
}

// Run the test
testPresetSystem().catch(console.error);
