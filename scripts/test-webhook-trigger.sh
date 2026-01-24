#!/bin/bash
# Test the n8n webhook by triggering a task event

SERVER="178.128.118.54"
APP_URL="http://${SERVER}:5000"
N8N_URL="http://${SERVER}:5678"

echo "========================================="
echo "  Testing n8n Webhook"
echo "========================================="
echo ""

# First, get a list of tasks to find a valid task ID
echo "Step 1: Finding a task to test with..."
echo ""

# Try to get project 1's tasks
TASKS=$(curl -s "${APP_URL}/api/n8n/projects/1/tasks" 2>/dev/null)

if echo "${TASKS}" | grep -q "tasks"; then
    # Extract first task ID
    TASK_ID=$(echo "${TASKS}" | grep -o '"id":[0-9]*' | head -1 | cut -d':' -f2)

    if [ -n "$TASK_ID" ]; then
        echo "✅ Found task ID: ${TASK_ID}"
    else
        echo "⚠️  No tasks found. Using task ID 1 for testing..."
        TASK_ID=1
    fi
else
    echo "⚠️  Could not fetch tasks. Using task ID 1 for testing..."
    TASK_ID=1
fi

echo ""
echo "Step 2: Triggering task.created event..."
echo ""

# Trigger the event
RESPONSE=$(curl -s -X POST "${APP_URL}/api/tasks/${TASK_ID}/trigger-event" \
  -H "Content-Type: application/json" \
  -d '{"event": "task.created"}')

echo "Response:"
echo "${RESPONSE}" | python3 -m json.tool 2>/dev/null || echo "${RESPONSE}"
echo ""

# Check if successful
if echo "${RESPONSE}" | grep -q "webhooksTriggered"; then
    TRIGGERED=$(echo "${RESPONSE}" | grep -o '"webhooksTriggered":[0-9]*' | cut -d':' -f2)

    if [ "$TRIGGERED" -gt "0" ]; then
        echo "✅ Success! Triggered ${TRIGGERED} webhook(s)"
        echo ""
        echo "Next: Check n8n executions"
        echo "  Open: ${N8N_URL}/executions"
        echo "  You should see a new execution with your task data"
    else
        echo "⚠️  Event triggered but no webhooks fired"
        echo ""
        echo "Possible reasons:"
        echo "  - No webhooks registered for this event"
        echo "  - Webhooks are inactive"
        echo ""
        echo "Check registered webhooks:"
        curl -s "${APP_URL}/api/webhooks" | python3 -m json.tool 2>/dev/null
    fi
else
    echo "❌ Event trigger failed"
    echo ""
    echo "Check if the task exists:"
    echo "  curl ${APP_URL}/api/tasks/${TASK_ID}"
fi

echo ""
echo "========================================="
echo "  Checking n8n Workflow Status"
echo "========================================="
echo ""

echo "To verify the workflow received the event:"
echo "1. Open n8n: ${N8N_URL}"
echo "2. Click 'Executions' in the sidebar"
echo "3. Look for recent executions of 'Task Event Webhook Handler'"
echo "4. Click on an execution to see the data received"
echo ""

echo "If you don't see any executions:"
echo "  - Make sure the workflow is ACTIVE (toggle in workflow editor)"
echo "  - Check the webhook is registered: curl ${APP_URL}/api/webhooks"
echo "  - View n8n logs: ssh root@${SERVER} 'cd /var/www/n8n && docker-compose logs -f'"
echo ""
