#!/bin/bash
# Script to update calendar_active on production database
# Run this on your server via SSH

cd /var/www/americancheese/americancheese

echo "Updating calendar_active for tasks and subtasks..."

# Update tasks
sudo -u postgres psql -d americancheese -c "
UPDATE tasks 
SET calendar_active = true 
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL
  AND (calendar_active IS NULL OR calendar_active = false);
"

# Show count of updated tasks
echo "Tasks updated. Count:"
sudo -u postgres psql -d americancheese -c "
SELECT COUNT(*) as updated_tasks_count 
FROM tasks 
WHERE calendar_active = true 
  AND start_date IS NOT NULL 
  AND end_date IS NOT NULL;
"

# Update subtasks
sudo -u postgres psql -d americancheese -c "
UPDATE subtasks 
SET calendar_active = true 
WHERE start_date IS NOT NULL 
  AND end_date IS NOT NULL
  AND (calendar_active IS NULL OR calendar_active = false);
"

# Show count of updated subtasks
echo "Subtasks updated. Count:"
sudo -u postgres psql -d americancheese -c "
SELECT COUNT(*) as updated_subtasks_count 
FROM subtasks 
WHERE calendar_active = true 
  AND start_date IS NOT NULL 
  AND end_date IS NOT NULL;
"

echo "Calendar active update completed!"
