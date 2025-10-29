/**
 * Script to identify duplicate tasks for cleanup
 * This script will print SQL queries that can be used to clean up duplicates
 */

// Query to find duplicate tasks by template_id and project_id
console.log("-- STEP 1: Identify duplicate tasks");
console.log(`
WITH duplicates AS (
  SELECT 
    id, 
    template_id, 
    project_id,
    ROW_NUMBER() OVER(PARTITION BY template_id, project_id ORDER BY id) as row_num
  FROM tasks
  WHERE template_id IS NOT NULL
)
SELECT id, template_id, project_id 
FROM duplicates 
WHERE row_num > 1
ORDER BY template_id, project_id;
`);

// Query to delete duplicate tasks
console.log("\n-- STEP 2: Delete duplicate tasks (after reviewing results from step 1)");
console.log(`
DELETE FROM tasks
WHERE id IN (
  WITH duplicates AS (
    SELECT 
      id, 
      template_id, 
      project_id,
      ROW_NUMBER() OVER(PARTITION BY template_id, project_id ORDER BY id) as row_num
    FROM tasks
    WHERE template_id IS NOT NULL
  )
  SELECT id FROM duplicates WHERE row_num > 1
);
`);

// Query to verify the cleanup
console.log("\n-- STEP 3: Verify there are no more duplicates");
console.log(`
SELECT template_id, project_id, COUNT(*) as count
FROM tasks
WHERE template_id IS NOT NULL
GROUP BY template_id, project_id
HAVING COUNT(*) > 1;
`);