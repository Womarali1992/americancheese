# Connect n8n to Your Deployed App

This guide shows you how to set up n8n on your VPS and connect it to your americancheese app for automations.

## What This Does

The setup script will:
1. ✅ Install Docker (if needed)
2. ✅ Set up n8n in a Docker container
3. ✅ Copy your workflow files to the server
4. ✅ Register webhooks between your app and n8n
5. ✅ Test the connection
6. ✅ Display next steps

## Quick Start (One Command)

Run this command from your local machine:

```bash
ssh root@178.128.118.54 'bash -s' < scripts/connect-n8n.sh
```

**Or** if you prefer to SSH in first:

```bash
# SSH into your server
ssh root@178.128.118.54

# Download the script
cd /var/www/americancheese
git pull

# Run the setup
bash scripts/connect-n8n.sh
```

## After Setup is Complete

### 1. Access n8n

Open in your browser:
```
http://178.128.118.54:5678
```

**Default Credentials:**
- Username: `admin`
- Password: `changeme123`

**⚠️ IMPORTANT:** Change this password immediately!

### 2. Import Workflows

The workflows are already on your server at `/tmp/n8n-workflows/`. You have two options:

**Option A: Import via n8n UI (Recommended)**

1. Open n8n at http://178.128.118.54:5678
2. Click "Workflows" in the sidebar
3. Click "+ Add Workflow" → "Import from File"
4. Upload these files one by one:
   - `task-webhook-handler.json`
   - `ucp-content-generator.json`
5. Activate each workflow (toggle switch in top-right)

**Option B: Import via CLI**

```bash
# SSH into your server
ssh root@178.128.118.54

# Copy workflows to n8n container
docker cp /tmp/n8n-workflows/task-webhook-handler.json n8n:/home/node/task-webhook-handler.json
docker cp /tmp/n8n-workflows/ucp-content-generator.json n8n:/home/node/ucp-content-generator.json

# Import using n8n CLI
docker exec -it n8n n8n import:workflow --input=/home/node/task-webhook-handler.json
docker exec -it n8n n8n import:workflow --input=/home/node/ucp-content-generator.json
```

### 3. Activate Workflows

In the n8n UI:
1. Open each imported workflow
2. Click the "Inactive" toggle in the top-right to activate it
3. Verify the webhook URLs are correct

### 4. Test the Automation

**Test Task Webhook:**

```bash
# Create a test task and trigger the webhook
curl -X POST http://178.128.118.54:5000/api/tasks/TASK_ID/trigger-event \
  -H "Content-Type: application/json" \
  -d '{"event": "task.created"}'
```

Replace `TASK_ID` with an actual task ID from your app.

**Or** simply create a new task in your app UI and watch n8n executions.

### 5. View n8n Executions

In n8n:
1. Click "Executions" in the sidebar
2. You should see your webhook triggers appearing
3. Click on an execution to see the full details

## Workflows Overview

### 1. Task Event Webhook Handler (`task-webhook-handler.json`)

**Triggers on:**
- `task.created` - When a new task is created
- `task.completed` - When a task is marked complete

**What it does:**
- Checks if task has project context
- If yes: Generates AI content outline for the task
- Saves generated content as task attachment
- Updates task status

**Webhook URL:** `http://178.128.118.54:5678/webhook/task-events`

### 2. UCP Content Generator (`ucp-content-generator.json`)

**Triggers on:** Manual execution

**What it does:**
- Fetches all tasks for a specific project
- Filters tasks by status (not_started)
- Generates full AI content for each task
- Saves to task attachments
- Includes rate limiting (5 second delay between tasks)

## Managing n8n

### View Logs
```bash
cd /var/www/n8n
docker-compose logs -f
```

### Restart n8n
```bash
cd /var/www/n8n
docker-compose restart
```

### Stop n8n
```bash
cd /var/www/n8n
docker-compose down
```

### Start n8n
```bash
cd /var/www/n8n
docker-compose up -d
```

### Update n8n
```bash
cd /var/www/n8n
docker-compose pull
docker-compose up -d
```

## Webhook Management

### View All Registered Webhooks
```bash
curl http://178.128.118.54:5000/api/webhooks
```

### Register a New Webhook
```bash
curl -X POST http://178.128.118.54:5000/api/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://178.128.118.54:5678/webhook/YOUR-WEBHOOK-PATH",
    "events": ["task.created", "task.updated"],
    "secret": "optional-secret-key"
  }'
```

### Delete a Webhook
```bash
curl -X DELETE http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID
```

### Toggle Webhook Active/Inactive
```bash
curl -X PATCH http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID/toggle
```

### Test a Webhook
```bash
curl -X POST http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID/test
```

## API Endpoints for n8n

Your app already has these endpoints ready for n8n workflows:

### Get Task Data
```bash
GET /api/n8n/tasks/:taskId
```

### Get Project Tasks
```bash
GET /api/n8n/projects/:projectId/tasks
```

### AI Generate Content
```bash
POST /api/tasks/:taskId/ai-generate
Body: {
  "outputType": "full|outline|brief",
  "saveToTask": true
}
```

### Preview AI Generation
```bash
GET /api/tasks/:taskId/ai-preview
```

### Add Content to Task
```bash
POST /api/n8n/tasks/:taskId/content
Body: {
  "content": "...",
  "fileName": "output.md",
  "contentType": "text/markdown"
}
```

### Update Task Status
```bash
PATCH /api/n8n/tasks/:taskId/status
Body: {
  "status": "completed",
  "completed": true
}
```

## Supported Webhook Events

Your app can trigger these events to n8n:

- `task.created` - New task created
- `task.updated` - Task modified
- `task.completed` - Task marked complete
- `task.deleted` - Task deleted
- `material.created` - New material added
- `material.updated` - Material modified
- `project.created` - New project created
- `project.updated` - Project modified
- `checklist.completed` - Checklist item completed
- `project.content_generated` - Bulk content generated
- `project.ai_content_generated` - AI content generated

## Environment Variables Needed

Make sure your americancheese app has:

```env
# In /var/www/americancheese/americancheese/.env
OPENAI_API_KEY=sk-your-openai-api-key-here
```

This is required for AI content generation features.

## Troubleshooting

### n8n Not Starting
```bash
cd /var/www/n8n
docker-compose logs
```

Check for port conflicts or Docker issues.

### Webhooks Not Firing
1. Check n8n workflow is **active** (not paused)
2. Verify webhook is registered: `curl http://178.128.118.54:5000/api/webhooks`
3. Check n8n execution logs in the UI
4. Test manually: `curl -X POST http://178.128.118.54:5000/api/tasks/1/trigger-event -H "Content-Type: application/json" -d '{"event":"task.created"}'`

### AI Generation Failing
1. Verify `OPENAI_API_KEY` is set in `.env`
2. Check OpenAI API quota/billing
3. View app logs: `pm2 logs americancheese`

### Can't Access n8n UI
```bash
# Check if n8n is running
docker ps | grep n8n

# Check firewall
sudo ufw status

# Allow port 5678
sudo ufw allow 5678/tcp
```

## Security Notes

1. **Change the default n8n password** in `docker-compose.yml`
2. Consider adding IP restrictions to port 5678
3. Use webhook secrets for production
4. Consider using HTTPS for n8n (requires SSL setup)

## Next Steps

Once everything is working:

1. ✅ Create custom workflows for your specific needs
2. ✅ Set up more automation triggers
3. ✅ Connect to external services (Slack, email, etc.)
4. ✅ Build approval workflows
5. ✅ Automate reporting and notifications

---

**Last Updated:** 2026-01-24
