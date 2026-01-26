#!/bin/bash
# Diagnostic script to check production server status
# Run: ssh root@178.128.118.54 "bash -s" < diagnose-production.sh

echo "===================================="
echo "Production Server Diagnostics"
echo "===================================="

cd /var/www/americancheese/americancheese

# Check PM2 status
echo ""
echo "1. PM2 Process Status:"
pm2 status

# Check if server is listening
echo ""
echo "2. Server Port Check:"
netstat -tlnp | grep :5000 || echo "Port 5000 not listening!"

# Check database connection
echo ""
echo "3. Database Connection Test:"
sudo -u postgres psql -d americancheese -c "SELECT COUNT(*) as project_count FROM projects;" 2>&1

# Check recent logs
echo ""
echo "4. Recent PM2 Logs (last 50 lines):"
pm2 logs americancheese --lines 50 --nostream

# Check for error patterns in logs
echo ""
echo "5. Error Patterns in Logs:"
pm2 logs americancheese --lines 200 --nostream | grep -i "error\|exception\|crash\|failed" | tail -20

# Check disk space
echo ""
echo "6. Disk Space:"
df -h | grep -E "Filesystem|/var"

# Check memory
echo ""
echo "7. Memory Usage:"
free -h

# Check if node process is running
echo ""
echo "8. Node Processes:"
ps aux | grep node | grep -v grep

# Test API endpoint directly
echo ""
echo "9. Testing API Endpoint:"
curl -s -o /dev/null -w "HTTP Status: %{http_code}\n" http://localhost:5000/api/projects || echo "API not responding"

echo ""
echo "===================================="
echo "Diagnostics Complete"
echo "===================================="
