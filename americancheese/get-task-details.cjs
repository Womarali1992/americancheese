const postgres = require('postgres');

const client = postgres({
  host: 'localhost',
  port: 5432,
  database: 'project_management',
  user: 'postgres',
  password: 'richman'
});

async function main() {
  // Get all tasks with full details
  const tasks = await client`SELECT * FROM tasks WHERE project_id = 171 ORDER BY tier1_category, tier2_category, title`;

  console.log('=== FULL TASK DETAILS ===\n');
  tasks.forEach(t => {
    console.log(`ID: ${t.id}`);
    console.log(`Title: ${t.title}`);
    console.log(`Description: ${t.description || '(empty)'}`);
    console.log(`Status: ${t.status}`);
    console.log(`Tier1: ${t.tier1_category}`);
    console.log(`Tier2: ${t.tier2_category}`);
    console.log(`Start: ${t.start_date}`);
    console.log(`End: ${t.end_date}`);
    console.log(`Materials Needed: ${t.materials_needed || '(empty)'}`);
    console.log(`Estimated Cost: ${t.estimated_cost || '(empty)'}`);
    console.log(`Template ID: ${t.template_id || '(none)'}`);
    console.log('---');
  });

  await client.end();
}
main().catch(console.error);
