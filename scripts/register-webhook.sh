#!/bin/bash
# Register the n8n webhook with your americancheese app
# This tells the app to send events to n8n

SERVER="178.128.118.54"
APP_URL="http://${SERVER}:5000"
N8N_WEBHOOK_URL="http://${SERVER}:5678/webhook/task-events"

echo "========================================="
echo "  Registering n8n Webhook"
echo "========================================="
echo ""
echo "App URL: ${APP_URL}"
echo "n8n Webhook URL: ${N8N_WEBHOOK_URL}"
echo ""

# Register the webhook
echo "Registering webhook..."
RESPONSE=$(curl -s -X POST "${APP_URL}/api/webhooks/register" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"${N8N_WEBHOOK_URL}"'",
    "events": ["task.created", "task.updated", "task.completed"],
    "secret": "n8n-automation-secret"
  }')

echo ""
echo "Response:"
echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"
echo ""

# Check if registration was successful
if echo "${RESPONSE}" | grep -q "id"; then
    echo "✅ Webhook registered successfully!"

    # Extract webhook ID
    WEBHOOK_ID=$(echo "${RESPONSE}" | grep -o '"id":"[^"]*"' | cut -d'"' -f4)
    echo ""
    echo "Webhook ID: ${WEBHOOK_ID}"
    echo ""
    echo "The webhook is now active. Your app will send these events to n8n:"
    echo "  - task.created"
    echo "  - task.updated"
    echo "  - task.completed"
else
    echo "⚠️  Webhook registration may have failed or already exists"
    echo ""
    echo "To check existing webhooks, run:"
    echo "  curl ${APP_URL}/api/webhooks"
fi

echo ""
echo "========================================="
echo "  Next: Test the Webhook"
echo "========================================="
echo ""
echo "Option 1: Create a new task in the app UI"
echo "  Go to: ${APP_URL}"
echo "  Create a task and watch n8n executions"
echo ""
echo "Option 2: Manually trigger a test event"
echo "  curl -X POST ${APP_URL}/api/tasks/1/trigger-event \\"
echo "    -H 'Content-Type: application/json' \\"
echo "    -d '{\"event\": \"task.created\"}'"
echo ""
echo "Option 3: Use the test webhook endpoint"
echo "  curl -X POST ${APP_URL}/api/webhooks/\${WEBHOOK_ID}/test"
echo ""
echo "View executions in n8n:"
echo "  ${N8N_WEBHOOK_URL%/webhook/*}/executions"
echo ""
