/**
 * Migration script to add referenced_task_ids field to tasks table
 */

export async function addReferencedTaskIdsField(queryClient) {
  try {
    console.log('Adding referenced_task_ids field to tasks table...');

    // Check if the column already exists
    const columnCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'referenced_task_ids'
    `;

    const result = await queryClient.query(columnCheckQuery);

    if (result.rows.length === 0) {
      // Add the column if it doesn't exist
      await queryClient.query(`
        ALTER TABLE tasks
        ADD COLUMN referenced_task_ids TEXT[]
      `);
      console.log('Successfully added referenced_task_ids field to tasks table');
    } else {
      console.log('referenced_task_ids field already exists in tasks table');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding referenced_task_ids field:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
