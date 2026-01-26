-- Script to update calendar_active field for existing tasks and subtasks
-- Sets calendar_active = true for all tasks/subtasks that have start and end dates
-- Run this on your production database via SSH

-- Update tasks: set calendar_active = true for tasks with dates
UPDATE tasks 
SET calendar_active = true 
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL
  AND (calendar_active IS NULL OR calendar_active = false);

-- Show how many tasks were updated
SELECT COUNT(*) as updated_tasks_count 
FROM tasks 
WHERE calendar_active = true 
  AND start_date IS NOT NULL 
  AND end_date IS NOT NULL;

-- Update subtasks: set calendar_active = true for subtasks with dates
UPDATE subtasks 
SET calendar_active = true 
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL
  AND (calendar_active IS NULL OR calendar_active = false);

-- Show how many subtasks were updated
SELECT COUNT(*) as updated_subtasks_count 
FROM subtasks 
WHERE calendar_active = true 
  AND start_date IS NOT NULL 
  AND end_date IS NOT NULL;
