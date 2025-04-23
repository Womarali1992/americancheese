/**
 * Migration script to add selected_templates field to projects table
 */

export async function addSelectedTemplatesField(queryClient) {
  try {
    console.log('Adding selected_templates field to projects table...');
    
    // Check if the column already exists
    const columnCheckQuery = `
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'projects' AND column_name = 'selected_templates'
    `;
    
    const result = await queryClient.unsafe(columnCheckQuery);
    
    if (result.length === 0) {
      // Add the column if it doesn't exist
      await queryClient`
        ALTER TABLE projects 
        ADD COLUMN selected_templates TEXT[] DEFAULT '{}'::TEXT[]
      `;
      console.log('Successfully added selected_templates field to projects table');
    } else {
      console.log('selected_templates field already exists in projects table');
    }
    
    return { success: true };
  } catch (error) {
    console.error('Error adding selected_templates field:', error);
    return { 
      success: false, 
      error: error.message 
    };
  }
}