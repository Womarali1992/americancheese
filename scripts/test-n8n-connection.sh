#!/bin/bash
# Test n8n connection and webhooks
# Run this after setup to verify everything works
#
# Usage: bash scripts/test-n8n-connection.sh

SERVER="178.128.118.54"
APP_URL="http://${SERVER}:5000"
N8N_URL="http://${SERVER}:5678"

echo "========================================="
echo "  Testing n8n Connection"
echo "========================================="
echo ""

# Test 1: Check if app is responding
echo "Test 1: Checking if americancheese app is running..."
APP_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}/health)
if [ "$APP_HEALTH" = "200" ]; then
    echo "✅ App is running at ${APP_URL}"
else
    echo "❌ App is not responding (HTTP ${APP_HEALTH})"
    echo "   Run: ssh root@${SERVER} 'pm2 status'"
    exit 1
fi

# Test 2: Check if n8n is responding
echo ""
echo "Test 2: Checking if n8n is running..."
N8N_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" ${N8N_URL})
if [ "$N8N_HEALTH" = "200" ] || [ "$N8N_HEALTH" = "401" ]; then
    echo "✅ n8n is running at ${N8N_URL}"
else
    echo "❌ n8n is not responding (HTTP ${N8N_HEALTH})"
    echo "   Run: ssh root@${SERVER} 'cd /var/www/n8n && docker-compose logs'"
    exit 1
fi

# Test 3: Check registered webhooks
echo ""
echo "Test 3: Checking registered webhooks..."
WEBHOOKS=$(curl -s ${APP_URL}/api/webhooks)
if echo "${WEBHOOKS}" | grep -q "webhooks"; then
    echo "✅ Webhooks endpoint is working"
    echo ""
    echo "Registered webhooks:"
    echo "${WEBHOOKS}" | python3 -m json.tool 2>/dev/null || echo "${WEBHOOKS}"
else
    echo "⚠️  No webhooks registered yet"
    echo "   This is normal if you haven't imported the workflows"
fi

# Test 4: Check if app has automation routes
echo ""
echo "Test 4: Checking automation endpoints..."
TASK_ENDPOINT=$(curl -s -o /dev/null -w "%{http_code}" ${APP_URL}/api/n8n/projects/1/tasks)
if [ "$TASK_ENDPOINT" = "200" ] || [ "$TASK_ENDPOINT" = "404" ]; then
    echo "✅ Automation endpoints are available"
else
    echo "❌ Automation endpoints not responding (HTTP ${TASK_ENDPOINT})"
fi

# Test 5: Check for OpenAI API key (needed for AI generation)
echo ""
echo "Test 5: Checking OpenAI API configuration..."
echo "⚠️  Cannot check OpenAI key remotely"
echo "   Make sure OPENAI_API_KEY is set in /var/www/americancheese/americancheese/.env"
echo "   Run: ssh root@${SERVER} 'grep OPENAI_API_KEY /var/www/americancheese/americancheese/.env'"

echo ""
echo "========================================="
echo "  Test Summary"
echo "========================================="
echo ""
echo "✅ App:        ${APP_URL}"
echo "✅ n8n:        ${N8N_URL}"
echo ""
echo "Next Steps:"
echo ""
echo "1. Open n8n in browser: ${N8N_URL}"
echo "   Login: admin / changeme123"
echo ""
echo "2. Import workflows from /tmp/n8n-workflows/"
echo "   - task-webhook-handler.json"
echo "   - ucp-content-generator.json"
echo ""
echo "3. Activate the workflows"
echo ""
echo "4. Create a test task to trigger automation"
echo ""
echo "See CONNECT_N8N.md for detailed instructions"
echo ""
