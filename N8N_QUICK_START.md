# n8n Quick Start - Connect Your App to n8n

## ⚡ Super Quick Setup (5 minutes)

### Option 1: Windows (Run from this directory)
```cmd
setup-n8n.bat
```

### Option 2: Mac/Linux (Run from this directory)
```bash
bash scripts/setup-n8n.sh
```

### Option 3: Manual SSH
```bash
ssh root@178.128.118.54 'bash -s' < scripts/connect-n8n.sh
```

## What Just Happened?

The script automatically:
- ✅ Installed n8n on your VPS via Docker
- ✅ Configured n8n to run on port 5678
- ✅ Copied your workflow files to the server
- ✅ Registered webhooks with your app
- ✅ Tested the connection

## Next: Import Workflows (2 minutes)

1. **Open n8n in your browser:**
   ```
   http://178.128.118.54:5678
   ```

2. **Login:**
   - Username: `admin`
   - Password: `changeme123`
   - ⚠️ Change this immediately!

3. **Import workflows:**
   - Click "Workflows" → "+ Add Workflow" → "Import from File"
   - Upload from server path: `/tmp/n8n-workflows/task-webhook-handler.json`
   - Upload from server path: `/tmp/n8n-workflows/ucp-content-generator.json`

   **Or download from your local repo:**
   - Import `scripts/n8n-workflows/task-webhook-handler.json`
   - Import `scripts/n8n-workflows/ucp-content-generator.json`

4. **Activate workflows:**
   - Open each workflow
   - Toggle "Inactive" → "Active" in top-right

## Test It (1 minute)

### Test in Your App UI:
1. Go to http://178.128.118.54:5000
2. Create a new task
3. Check n8n "Executions" tab - you should see it fire!

### Test via Command Line:
```bash
# List registered webhooks
curl http://178.128.118.54:5000/api/webhooks

# Manually trigger a task event
curl -X POST http://178.128.118.54:5000/api/tasks/1/trigger-event \
  -H "Content-Type: application/json" \
  -d '{"event": "task.created"}'
```

## What Automations Are Now Active?

### 1. Auto-Generate Task Content
**Trigger:** When you create a new task
**What happens:**
- n8n receives the webhook
- Checks if your project has context (mission/scope)
- If yes: Generates AI content for the task
- Saves it as a task attachment

### 2. Bulk Content Generator
**Trigger:** Manual execution
**What happens:**
- Fetches all "not started" tasks from a project
- Generates full AI content for each
- Saves to attachments
- Rate-limited to avoid API issues

## Available API Endpoints for Custom Workflows

Your app exposes these endpoints for n8n:

```bash
# Get task details with full context
GET /api/n8n/tasks/:taskId

# Get all tasks for a project
GET /api/n8n/projects/:projectId/tasks

# Generate AI content
POST /api/tasks/:taskId/ai-generate
Body: {"outputType": "full|outline|brief", "saveToTask": true}

# Add content to task
POST /api/n8n/tasks/:taskId/content
Body: {"content": "...", "fileName": "output.md"}

# Update task status
PATCH /api/n8n/tasks/:taskId/status
Body: {"status": "completed", "completed": true}
```

## Webhook Events You Can Subscribe To

Your app can trigger these events to n8n:
- `task.created`
- `task.updated`
- `task.completed`
- `task.deleted`
- `material.created`
- `material.updated`
- `project.created`
- `project.updated`
- `checklist.completed`

## Required: Set Up OpenAI API Key

For AI generation to work, add your OpenAI key:

```bash
ssh root@178.128.118.54
cd /var/www/americancheese/americancheese
nano .env
```

Add:
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

Restart app:
```bash
pm2 restart americancheese
```

## Troubleshooting

### Can't access n8n UI
```bash
ssh root@178.128.118.54
cd /var/www/n8n
docker-compose logs
```

### Webhooks not firing
1. Check workflow is **active** (not paused)
2. View executions in n8n UI
3. Check webhook is registered:
   ```bash
   curl http://178.128.118.54:5000/api/webhooks
   ```

### AI generation failing
1. Check OpenAI key is set: `grep OPENAI_API_KEY /var/www/americancheese/americancheese/.env`
2. Restart app: `pm2 restart americancheese`
3. Check logs: `pm2 logs americancheese`

## Test Everything is Working

Run the test script:
```bash
bash scripts/test-n8n-connection.sh
```

## Managing n8n

```bash
# SSH into server
ssh root@178.128.118.54

# View logs
cd /var/www/n8n && docker-compose logs -f

# Restart n8n
cd /var/www/n8n && docker-compose restart

# Stop n8n
cd /var/www/n8n && docker-compose down

# Start n8n
cd /var/www/n8n && docker-compose up -d
```

## Files Created

- `/var/www/n8n/` - n8n installation directory
- `/tmp/n8n-workflows/` - Your workflow JSON files
- `http://178.128.118.54:5678` - n8n web UI

## What's Next?

1. ✅ Create custom workflows for your needs
2. ✅ Connect to external services (Slack, email, etc.)
3. ✅ Build approval workflows
4. ✅ Automate notifications
5. ✅ Create dashboard automations

## Documentation

- 📖 Full guide: [CONNECT_N8N.md](CONNECT_N8N.md)
- 📖 n8n docs: https://docs.n8n.io
- 📖 Deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

## Support

- n8n not starting? → `cd /var/www/n8n && docker-compose logs`
- Webhooks not working? → Check n8n "Executions" tab
- AI not generating? → Check OpenAI API key in `.env`
- App issues? → `pm2 logs americancheese`

---

**Your Setup:**
- Server: 178.128.118.54
- App: http://178.128.118.54:5000
- n8n: http://178.128.118.54:5678
- Default n8n login: admin / changeme123

**Last Updated:** 2026-01-24
