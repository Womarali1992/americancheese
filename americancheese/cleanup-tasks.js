import fetch from 'node-fetch';

async function cleanupTasks() {
  try {
    // Get all tasks
    console.log('Fetching all tasks...');
    const response = await fetch('http://localhost:5000/api/tasks');
    const allTasks = await response.json();
    console.log(`Found ${allTasks.length} total tasks`);

    // Define construction-related categories that should be kept
    const validConstructionCategories = [
      'foundation', 'footings', 'basement', 'slab', 'stemwall',
      'framing', 'walls', 'floor-joists', 'ceiling-joists', 'roof-trusses', 'beams', 'posts', 'stairs',
      'electrical', 'wiring', 'outlets', 'switches', 'panel', 'service-entrance', 'circuits', 'lighting',
      'plumbing', 'rough-plumbing', 'fixtures', 'water-lines', 'drain-lines', 'vents', 'water-heater',
      'hvac', 'heating', 'cooling', 'ductwork', 'vents', 'units',
      'insulation', 'fiberglass', 'foam', 'blown-in', 'vapor-barrier',
      'drywall', 'mudding', 'taping', 'texture', 'priming',
      'flooring', 'hardwood', 'tile', 'carpet', 'vinyl', 'laminate',
      'roofing', 'shingles', 'gutters', 'flashing', 'ridge-vents',
      'windows', 'doors', 'trim', 'casing', 'baseboards', 'crown-molding',
      'paint', 'interior-paint', 'exterior-paint', 'stain', 'primer',
      'kitchen', 'cabinets', 'countertops', 'appliances', 'backsplash',
      'bathroom', 'vanity', 'toilet', 'shower', 'bathtub', 'tile-work',
      'landscaping', 'grading', 'seeding', 'walkways', 'driveways',
      'permits', 'inspections', 'cleanup', 'final-walkthrough'
    ];

    // Define invalid categories to remove (workout, marketing, etc.)
    const invalidCategories = [
      'chest', 'shoulders', 'triceps', 'back', 'biceps', 'rear-delts',
      'quads', 'glutes', 'hamstrings', 'calves', 'hiit', 'steady-state', 'circuit',
      'brand-positioning', 'content-marketing', 'seo', 'pr-thought-leadership',
      'organic-social', 'paid-search', 'paid-social', 'affiliates-partnerships',
      'influencer-creator', 'email-marketing', 'conversion-optimization',
      'analytics-attribution', 'customer-success', 'sales-enablement'
    ];

    // Find tasks to delete
    const tasksToDelete = allTasks.filter(task => {
      // Delete if it has invalid categories
      if (invalidCategories.includes(task.category)) return true;
      if (invalidCategories.includes(task.tier2Category)) return true;

      // Delete if tier1Category is workout or marketing related
      if (['Push', 'Pull', 'Legs', 'Cardio', 'Awareness', 'Acquisition', 'Retention'].includes(task.tier1Category)) return true;

      // Delete if it contains workout terms in title or description
      const text = (task.title + ' ' + (task.description || '')).toLowerCase();
      const workoutTerms = ['reps', 'sets', 'barbell', 'dumbbell', 'muscle', 'bicep', 'tricep', 'workout', 'exercise', 'gym', 'fitness'];
      if (workoutTerms.some(term => text.includes(term))) return true;

      // Delete if it contains marketing terms
      const marketingTerms = ['seo', 'marketing', 'brand', 'social media', 'campaign', 'analytics', 'conversion', 'affiliate'];
      if (marketingTerms.some(term => text.includes(term))) return true;

      return false;
    });

    console.log(`Found ${tasksToDelete.length} tasks to delete`);

    if (tasksToDelete.length === 0) {
      console.log('No tasks to delete!');
      return;
    }

    // Delete tasks one by one
    let deletedCount = 0;
    for (const task of tasksToDelete) {
      try {
        const deleteResponse = await fetch(`http://localhost:5000/api/tasks/${task.id}`, {
          method: 'DELETE'
        });

        if (deleteResponse.ok) {
          deletedCount++;
          if (deletedCount % 50 === 0) {
            console.log(`Deleted ${deletedCount}/${tasksToDelete.length} tasks...`);
          }
        } else {
          console.error(`Failed to delete task ${task.id}: ${deleteResponse.status}`);
        }
      } catch (error) {
        console.error(`Error deleting task ${task.id}:`, error.message);
      }
    }

    console.log(`Successfully deleted ${deletedCount} tasks!`);

    // Check final count
    const finalResponse = await fetch('http://localhost:5000/api/tasks');
    const finalTasks = await finalResponse.json();
    console.log(`Final task count: ${finalTasks.length}`);

  } catch (error) {
    console.error('Error during cleanup:', error);
  }
}

cleanupTasks();