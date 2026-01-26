#!/bin/bash
# Complete production fix and restart script
# Run: ssh root@178.128.118.54 "bash -s" < complete-production-fix.sh

set -e  # Exit on error

echo "===================================="
echo "Complete Production Fix & Restart"
echo "===================================="

cd /var/www/americancheese/americancheese

# Pull latest code
echo ""
echo "1. Pulling latest code..."
git pull origin main

# Fix database issues
echo ""
echo "2. Fixing database issues..."
sudo -u postgres psql -d americancheese -f emergency-fix-production.sql

# Stop the server
echo ""
echo "3. Stopping server..."
pm2 stop americancheese || echo "Server not running"

# Clear PM2 logs
echo ""
echo "4. Clearing old logs..."
pm2 flush americancheese || true

# Rebuild if needed
echo ""
echo "5. Rebuilding application..."
npm run build || {
    echo "Build failed, trying npm install..."
    npm install
    npm run build
}

# Start the server
echo ""
echo "6. Starting server..."
pm2 start ecosystem.config.cjs || pm2 restart americancheese
pm2 save

# Wait a moment for server to start
sleep 5

# Check status
echo ""
echo "7. Checking server status..."
pm2 status

# Test the API
echo ""
echo "8. Testing API..."
sleep 2
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" http://localhost:5000/api/projects || echo "000")
if [ "$HTTP_CODE" = "200" ]; then
    echo "✅ API is responding (HTTP $HTTP_CODE)"
else
    echo "❌ API not responding (HTTP $HTTP_CODE)"
    echo ""
    echo "Recent logs:"
    pm2 logs americancheese --lines 30 --nostream
fi

echo ""
echo "===================================="
echo "Fix Complete!"
echo "===================================="
echo ""
echo "View logs: pm2 logs americancheese"
echo "Check status: pm2 status"
