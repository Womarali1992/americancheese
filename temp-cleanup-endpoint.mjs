// Temporary script to add cleanup endpoint to running server
const cleanupCategories = [
  'Activation & Conversion',
  'Acquisition',
  'Awareness',
  'Retention & Advocacy',
  'Phase 1',
  'Phase 2',
  'Phase 3',
  'Phase 4'
];

// We'll make DELETE requests for each category
cleanupCategories.forEach(async (categoryName) => {
  try {
    const response = await fetch(`http://localhost:5000/api/category-templates/by-name/${encodeURIComponent(categoryName)}`, {
      method: 'DELETE'
    });

    if (response.ok) {
      console.log(`✅ Deleted category: ${categoryName}`);
    } else {
      console.log(`❌ Failed to delete category: ${categoryName} - ${response.status}`);
    }
  } catch (error) {
    console.log(`❌ Error deleting category ${categoryName}:`, error.message);
  }
});

console.log('Cleanup requests sent for all categories.');