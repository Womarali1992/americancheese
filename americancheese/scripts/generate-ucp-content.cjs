/**
 * UCP Project Content Generation Script
 *
 * This script demonstrates how to use the automation endpoints to generate
 * AI-powered content for tasks using the project's structured context.
 *
 * Prerequisites:
 * 1. Server running on port 5000
 * 2. OPENAI_API_KEY set in environment
 *
 * Usage:
 *   node scripts/generate-ucp-content.cjs [options]
 *
 * Options:
 *   --task <id>     Generate content for a single task
 *   --category <name>  Generate for all tasks in a category
 *   --all           Generate for all tasks (use with caution - costs API credits)
 *   --preview       Preview what will be generated without actually generating
 *   --output <type> Output type: full, outline, or brief (default: full)
 */

const BASE_URL = 'http://localhost:5000';
const PROJECT_ID = 171; // UCP project ID

async function fetchApi(endpoint, options = {}) {
  const response = await fetch(`${BASE_URL}${endpoint}`, {
    headers: {
      'Content-Type': 'application/json',
      ...options.headers
    },
    ...options
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`API Error: ${response.status} - ${error}`);
  }

  return response.json();
}

async function getProjectTasks() {
  const data = await fetchApi(`/api/n8n/projects/${PROJECT_ID}/tasks`);
  return data.tasks;
}

async function previewTask(taskId) {
  return fetchApi(`/api/tasks/${taskId}/ai-preview`);
}

async function generateTaskContent(taskId, outputType = 'full', saveToTask = true) {
  return fetchApi(`/api/tasks/${taskId}/ai-generate`, {
    method: 'POST',
    body: JSON.stringify({ outputType, saveToTask })
  });
}

async function generateBulkContent(taskIds, outputType = 'full', categories = null) {
  return fetchApi(`/api/projects/${PROJECT_ID}/ai-generate-all`, {
    method: 'POST',
    body: JSON.stringify({
      taskIds,
      outputType,
      saveToTask: true,
      categories
    })
  });
}

async function main() {
  const args = process.argv.slice(2);

  console.log('=== UCP Content Generation ===\n');

  // Parse arguments
  const taskIdIndex = args.indexOf('--task');
  const categoryIndex = args.indexOf('--category');
  const outputIndex = args.indexOf('--output');
  const previewMode = args.includes('--preview');
  const allMode = args.includes('--all');

  const outputType = outputIndex !== -1 ? args[outputIndex + 1] : 'full';

  try {
    // Get all tasks first
    console.log('Fetching UCP project tasks...');
    const tasks = await getProjectTasks();
    console.log(`Found ${tasks.length} tasks\n`);

    // Group by category for display
    const byCategory = tasks.reduce((acc, t) => {
      const cat = t.tier2Category || 'Uncategorized';
      if (!acc[cat]) acc[cat] = [];
      acc[cat].push(t);
      return acc;
    }, {});

    console.log('Tasks by Category:');
    Object.entries(byCategory).forEach(([cat, catTasks]) => {
      console.log(`  ${cat}: ${catTasks.length} tasks`);
    });
    console.log();

    // Single task mode
    if (taskIdIndex !== -1) {
      const taskId = parseInt(args[taskIdIndex + 1]);

      if (previewMode) {
        console.log(`Previewing task ${taskId}...`);
        const preview = await previewTask(taskId);
        console.log('\nPreview:');
        console.log(JSON.stringify(preview, null, 2));
      } else {
        console.log(`Generating ${outputType} content for task ${taskId}...`);
        const result = await generateTaskContent(taskId, outputType);
        console.log('\nResult:');
        console.log(`Task: ${result.taskTitle}`);
        console.log(`Tokens used: ${result.tokensUsed}`);
        console.log(`Saved: ${result.saved}`);
        console.log('\n--- Generated Content ---\n');
        console.log(result.content);
      }
      return;
    }

    // Category mode
    if (categoryIndex !== -1) {
      const category = args[categoryIndex + 1];
      const categoryTasks = tasks.filter(t => t.tier2Category === category);

      if (categoryTasks.length === 0) {
        console.log(`No tasks found in category: ${category}`);
        console.log('\nAvailable categories:');
        Object.keys(byCategory).forEach(c => console.log(`  - ${c}`));
        return;
      }

      console.log(`\nGenerating content for ${categoryTasks.length} tasks in "${category}"...`);

      if (previewMode) {
        console.log('\nTasks that would be processed:');
        categoryTasks.forEach(t => console.log(`  - [${t.id}] ${t.title}`));
        return;
      }

      const result = await generateBulkContent(
        categoryTasks.map(t => t.id),
        outputType
      );

      console.log('\nBulk Generation Results:');
      console.log(`  Processed: ${result.results.processed}`);
      console.log(`  Successful: ${result.results.successful}`);
      console.log(`  Failed: ${result.results.failed}`);
      console.log(`  Total tokens: ${result.results.totalTokens}`);
      return;
    }

    // All tasks mode
    if (allMode) {
      console.log(`\n⚠️  WARNING: This will generate content for ALL ${tasks.length} tasks.`);
      console.log('This may use significant API credits.\n');

      if (previewMode) {
        console.log('Tasks that would be processed:');
        tasks.slice(0, 10).forEach(t => console.log(`  - [${t.id}] ${t.title}`));
        if (tasks.length > 10) {
          console.log(`  ... and ${tasks.length - 10} more`);
        }
        return;
      }

      // Add confirmation for non-preview mode
      console.log('To proceed, run without --preview flag and confirm by typing: GENERATE_ALL');
      return;
    }

    // Default: show help
    console.log('Usage examples:\n');
    console.log('  Preview a single task:');
    console.log('    node scripts/generate-ucp-content.cjs --task 9467 --preview\n');
    console.log('  Generate content for a single task:');
    console.log('    node scripts/generate-ucp-content.cjs --task 9467 --output full\n');
    console.log('  Generate for all tasks in a category:');
    console.log('    node scripts/generate-ucp-content.cjs --category "Offer Design" --output brief\n');
    console.log('  Preview all tasks:');
    console.log('    node scripts/generate-ucp-content.cjs --all --preview\n');

  } catch (error) {
    console.error('Error:', error.message);
    if (error.message.includes('ECONNREFUSED')) {
      console.log('\nMake sure the server is running: npm run dev');
    }
  }
}

main();
