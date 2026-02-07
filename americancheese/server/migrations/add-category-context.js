/**
 * Migration script to add structured_context column to project_categories table
 */

export async function addCategoryContext(queryClient) {
  try {
    console.log('Checking for structured_context column in project_categories table...');

    const columnCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'project_categories' AND column_name = 'structured_context'
    `;

    const result = await queryClient.query(columnCheckQuery);

    if (result.rows.length === 0) {
      console.log('Adding structured_context column to project_categories table...');
      await queryClient.query(`
        ALTER TABLE project_categories
        ADD COLUMN structured_context TEXT
      `);
      console.log('structured_context column added to project_categories table');
    } else {
      console.log('structured_context column already exists in project_categories table');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding structured_context to project_categories:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
