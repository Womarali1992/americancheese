/**
 * Script to update calendar_active field for existing tasks and subtasks
 * Sets calendar_active = true for all tasks/subtasks that have start and end dates
 */

import 'dotenv/config';
import postgres from 'postgres';

// Database connection
const queryClient = postgres(process.env.DATABASE_URL, { max: 1 });

async function updateCalendarActive() {
  try {
    console.log('Updating calendar_active for tasks and subtasks...');
    
    // Update tasks: set calendar_active = true for tasks with dates
    const tasksResult = await queryClient`
      UPDATE tasks 
      SET calendar_active = true 
      WHERE start_date IS NOT NULL 
        AND end_date IS NOT NULL
        AND (calendar_active IS NULL OR calendar_active = false)
      RETURNING id, title
    `;
    
    console.log(`Updated ${tasksResult.length} tasks to calendar_active = true`);
    
    // Update subtasks: set calendar_active = true for subtasks with dates
    const subtasksResult = await queryClient`
      UPDATE subtasks 
      SET calendar_active = true 
      WHERE start_date IS NOT NULL 
        AND end_date IS NOT NULL
        AND (calendar_active IS NULL OR calendar_active = false)
      RETURNING id, title
    `;
    
    console.log(`Updated ${subtasksResult.length} subtasks to calendar_active = true`);
    
    console.log('Calendar active update completed successfully!');
  } catch (error) {
    console.error('Error updating calendar_active:', error);
  } finally {
    await queryClient.end();
    console.log('Disconnected from database');
  }
}

// Run the update
updateCalendarActive();
