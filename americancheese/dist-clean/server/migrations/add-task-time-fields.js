/**
 * Migration script to add start_time and end_time fields to tasks and subtasks tables
 */

export async function addTaskTimeFields(queryClient) {
  try {
    console.log('Adding time fields to tasks and subtasks tables...');

    // Check if start_time column exists in tasks table
    const taskStartTimeCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'start_time'
    `);

    if (taskStartTimeCheck.rows.length === 0) {
      // Add the columns if they don't exist
      await queryClient.query(`
        ALTER TABLE tasks
        ADD COLUMN start_time TEXT,
        ADD COLUMN end_time TEXT
      `);
      console.log('Successfully added time fields to tasks table');
    } else {
      console.log('Time fields already exist in tasks table');
    }

    // Check if start_time column exists in subtasks table
    const subtaskStartTimeCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'subtasks' AND column_name = 'start_time'
    `);

    if (subtaskStartTimeCheck.rows.length === 0) {
      // Add the columns if they don't exist
      await queryClient.query(`
        ALTER TABLE subtasks
        ADD COLUMN start_time TEXT,
        ADD COLUMN end_time TEXT
      `);
      console.log('Successfully added time fields to subtasks table');
    } else {
      console.log('Time fields already exist in subtasks table');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding time fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
