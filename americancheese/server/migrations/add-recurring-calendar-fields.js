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
