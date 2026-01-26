#!/bin/bash
# Script to check and fix production database issues
# Run this on production server via SSH

echo "===================================="
echo "Checking Production Database"
echo "===================================="

cd /var/www/americancheese/americancheese

# Pull latest scripts
echo "Pulling latest code..."
git pull origin main

# Check database connection
echo ""
echo "Testing database connection..."
sudo -u postgres psql -d americancheese -c "SELECT COUNT(*) as project_count FROM projects;" || {
    echo "ERROR: Cannot connect to database!"
    exit 1
}

# Fix invalid dates
echo ""
echo "Fixing invalid dates..."
sudo -u postgres psql -d americancheese -f fix-invalid-dates.sql

# Sync SuperX project
echo ""
echo "Syncing SuperX project..."
sudo -u postgres psql -d americancheese -f sync-superx-to-production.sql

# Check for any NULL or invalid dates in critical tables
echo ""
echo "Checking for remaining date issues..."
sudo -u postgres psql -d americancheese -c "
SELECT 'Projects with invalid dates' as issue, COUNT(*) as count
FROM projects 
WHERE (start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01'))
   OR (end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01'))
UNION ALL
SELECT 'Tasks with invalid dates', COUNT(*)
FROM tasks 
WHERE (start_date IS NOT NULL AND (start_date < '1900-01-01' OR start_date > '2100-01-01'))
   OR (end_date IS NOT NULL AND (end_date < '1900-01-01' OR end_date > '2100-01-01'))
   OR (start_date IS NOT NULL AND end_date IS NOT NULL AND end_date < start_date);
"

# Restart the application
echo ""
echo "Restarting application..."
pm2 restart americancheese || pm2 start ecosystem.config.cjs
pm2 save

echo ""
echo "===================================="
echo "Check complete!"
echo "===================================="
echo ""
echo "Check application status:"
pm2 status
echo ""
echo "Check logs:"
echo "pm2 logs americancheese --lines 50"
