/**
 * Migration script to add created_by column to contacts table
 */

export async function addContactsCreatedBy(queryClient) {
  try {
    console.log('Checking for created_by column in contacts table...');

    // Check if contacts table has created_by column
    const columnCheckQuery = `
      SELECT column_name
      FROM information_schema.columns
      WHERE table_name = 'contacts' AND column_name = 'created_by'
    `;

    const result = await queryClient.query(columnCheckQuery);

    if (result.rows.length === 0) {
      console.log('Adding created_by column to contacts table...');
      await queryClient.query(`
        ALTER TABLE contacts
        ADD COLUMN created_by INTEGER REFERENCES users(id)
      `);
      console.log('created_by column added to contacts table');

      // Assign existing contacts to user 1 (primary user)
      console.log('Assigning existing contacts to user 1...');
      await queryClient.query(`
        UPDATE contacts SET created_by = 1 WHERE created_by IS NULL
      `);
      console.log('Existing contacts assigned to user 1');
    } else {
      console.log('created_by column already exists in contacts table');
    }

    return { success: true };
  } catch (error) {
    console.error('Error adding created_by to contacts:', error);
    return {
      success: false,
      error: error.message
    };
  }
}
