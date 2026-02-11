/**
 * Migration script to add recurring/calendar fields to tasks, labor, and materials
 */

export async function addRecurringCalendarFields(queryClient) {
  try {
    console.log('Adding recurring and calendar fields...');

    // Check and add is_recurring to tasks
    const isRecurringCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'is_recurring'
    `);

    if (isRecurringCheck.rows.length === 0) {
      console.log('Adding is_recurring column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN is_recurring BOOLEAN DEFAULT false
      `);
      console.log('is_recurring column added to tasks table');
    } else {
      console.log('is_recurring column already exists in tasks table');
    }

    // Check and add recurrence_rule to tasks
    const recurrenceRuleCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'recurrence_rule'
    `);

    if (recurrenceRuleCheck.rows.length === 0) {
      console.log('Adding recurrence_rule column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN recurrence_rule TEXT
      `);
      console.log('recurrence_rule column added to tasks table');
    } else {
      console.log('recurrence_rule column already exists in tasks table');
    }

    // Check and add recurrence_end_date to tasks
    const recurrenceEndCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'recurrence_end_date'
    `);

    if (recurrenceEndCheck.rows.length === 0) {
      console.log('Adding recurrence_end_date column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN recurrence_end_date DATE
      `);
      console.log('recurrence_end_date column added to tasks table');
    } else {
      console.log('recurrence_end_date column already exists in tasks table');
    }

    // Check and add recurrence_pattern to tasks
    const recurrencePatternCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'recurrence_pattern'
    `);

    if (recurrencePatternCheck.rows.length === 0) {
      console.log('Adding recurrence_pattern column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN recurrence_pattern TEXT
      `);
      console.log('recurrence_pattern column added to tasks table');
    } else {
      console.log('recurrence_pattern column already exists in tasks table');
    }

    // Check and add recurrence_interval to tasks
    const recurrenceIntervalCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'recurrence_interval'
    `);

    if (recurrenceIntervalCheck.rows.length === 0) {
      console.log('Adding recurrence_interval column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN recurrence_interval INTEGER DEFAULT 1
      `);
      console.log('recurrence_interval column added to tasks table');
    } else {
      console.log('recurrence_interval column already exists in tasks table');
    }

    // Check and add parent_recurring_task_id to tasks
    const parentRecurringTaskIdCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'tasks' AND column_name = 'parent_recurring_task_id'
    `);

    if (parentRecurringTaskIdCheck.rows.length === 0) {
      console.log('Adding parent_recurring_task_id column to tasks table...');
      await queryClient.query(`
        ALTER TABLE tasks ADD COLUMN parent_recurring_task_id INTEGER
      `);
      console.log('parent_recurring_task_id column added to tasks table');
    } else {
      console.log('parent_recurring_task_id column already exists in tasks table');
    }

    // Check and add estimated_labor_cost to labor
    const estimatedCostCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'labor' AND column_name = 'estimated_labor_cost'
    `);

    if (estimatedCostCheck.rows.length === 0) {
      console.log('Adding estimated_labor_cost column to labor table...');
      await queryClient.query(`
        ALTER TABLE labor ADD COLUMN estimated_labor_cost DOUBLE PRECISION
      `);
      console.log('estimated_labor_cost column added to labor table');
    } else {
      console.log('estimated_labor_cost column already exists in labor table');
    }

    // Check and add calendar_active to materials
    const calendarActiveCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'materials' AND column_name = 'calendar_active'
    `);

    if (calendarActiveCheck.rows.length === 0) {
      console.log('Adding calendar_active column to materials table...');
      await queryClient.query(`
        ALTER TABLE materials ADD COLUMN calendar_active BOOLEAN DEFAULT true
      `);
      console.log('calendar_active column added to materials table');
    } else {
      console.log('calendar_active column already exists in materials table');
    }

    // Check and add estimated_cost to materials
    const estimatedCostMaterialsCheck = await queryClient.query(`
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'materials' AND column_name = 'estimated_cost'
    `);

    if (estimatedCostMaterialsCheck.rows.length === 0) {
      console.log('Adding estimated_cost column to materials table...');
      await queryClient.query(`
        ALTER TABLE materials ADD COLUMN estimated_cost DOUBLE PRECISION
      `);
      console.log('estimated_cost column added to materials table');
    } else {
      console.log('estimated_cost column already exists in materials table');
    }

    console.log('Recurring and calendar fields migration completed successfully');
    return { success: true };
  } catch (error) {
    console.error('Error adding recurring/calendar fields:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
