/**
 * Migration script to add calendar schedule fields to tasks and subtasks tables
 * These fields allow tasks to have separate "actual schedule" dates for the calendar
 * distinct from the "planned schedule" (start_date/end_date)
 */

export async function addCalendarScheduleFields(queryClient) {
  try {
    console.log('Adding calendar schedule fields to tasks and subtasks tables...');

    // Check if calendar_start_date column exists in tasks table
    const taskCalendarCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'calendar_start_date'
    `);

    if (taskCalendarCheck.rows.length === 0) {
      // Add the columns if they don't exist
      await queryClient.query(`
        ALTER TABLE tasks
        ADD COLUMN calendar_start_date DATE,
        ADD COLUMN calendar_end_date DATE,
        ADD COLUMN calendar_start_time TEXT,
        ADD COLUMN calendar_end_time TEXT
      `);
      console.log('Successfully added calendar schedule fields to tasks table');
    } else {
      console.log('Calendar schedule fields already exist in tasks table');
    }

    // Check if calendar_start_date column exists in subtasks table
    const subtaskCalendarCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'subtasks' AND column_name = 'calendar_start_date'
    `);

    if (subtaskCalendarCheck.rows.length === 0) {
      // Add the columns if they don't exist
      await queryClient.query(`
        ALTER TABLE subtasks
        ADD COLUMN calendar_start_date DATE,
        ADD COLUMN calendar_end_date DATE,
        ADD COLUMN calendar_start_time TEXT,
        ADD COLUMN calendar_end_time TEXT
      `);
      console.log('Successfully added calendar schedule fields to subtasks table');
    } else {
      console.log('Calendar schedule fields already exist in subtasks table');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding calendar schedule fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
