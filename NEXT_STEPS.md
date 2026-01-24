# ✅ n8n Workflow Activated - Next Steps

Great! Your n8n workflow is active at: http://178.128.118.54:5678/workflow/OuDb4VKBO1MpJaF4

## 🔗 Step 1: Register the Webhook (1 minute)

This tells your app to send events to n8n when tasks are created/updated/completed.

### Windows:
```cmd
register-webhook.bat
```

### Mac/Linux:
```bash
bash scripts/register-webhook.sh
```

### Or manually with curl:
```bash
curl -X POST http://178.128.118.54:5000/api/webhooks/register \
  -H "Content-Type: application/json" \
  -d '{
    "url": "http://178.128.118.54:5678/webhook/task-events",
    "events": ["task.created", "task.updated", "task.completed"],
    "secret": "n8n-automation-secret"
  }'
```

## 🧪 Step 2: Test the Webhook (1 minute)

### Option A: Create a Task in the App
1. Go to http://178.128.118.54:5000
2. Create a new task
3. Check n8n executions: http://178.128.118.54:5678/executions
4. You should see it trigger!

### Option B: Manually Trigger a Test Event

**Windows:**
```cmd
curl -X POST http://178.128.118.54:5000/api/tasks/1/trigger-event ^
  -H "Content-Type: application/json" ^
  -d "{\"event\": \"task.created\"}"
```

**Mac/Linux:**
```bash
bash scripts/test-webhook-trigger.sh
```

Or manually:
```bash
curl -X POST http://178.128.118.54:5000/api/tasks/1/trigger-event \
  -H "Content-Type: application/json" \
  -d '{"event": "task.created"}'
```

## 📊 Step 3: View Executions in n8n

1. Open: http://178.128.118.54:5678/executions
2. You should see your workflow executing
3. Click on an execution to see:
   - Input data (task details)
   - Each step's output
   - Whether AI content was generated

## 🎯 What Your Workflow Does

### When a task is created:
1. ✅ n8n receives the webhook
2. ✅ Checks if the project has context (mission/scope)
3. ✅ If yes: Calls OpenAI to generate task content outline
4. ✅ Saves the generated content to the task as an attachment
5. ✅ If no: Skips generation

### When a task is completed:
1. ✅ n8n receives the webhook
2. ✅ Confirms the status update in the database

## 🔑 Step 4: Add OpenAI API Key (Required for AI Generation)

The workflow needs an OpenAI API key to generate content.

**SSH into your server:**
```bash
ssh root@178.128.118.54
cd /var/www/americancheese/americancheese
nano .env
```

**Add this line:**
```env
OPENAI_API_KEY=sk-your-actual-openai-key-here
```

**Save and restart:**
```bash
# Press Ctrl+X, Y, Enter to save
pm2 restart americancheese
```

**Test it worked:**
```bash
pm2 logs americancheese --lines 20
```

## ✨ What Happens Now

Every time you:
- **Create a task** → n8n generates AI content for it (if project has context)
- **Complete a task** → n8n confirms the status update
- **Update a task** → n8n receives the update event

The generated content is saved as a markdown attachment on the task!

## 🔍 Verify Everything is Connected

### Check webhooks are registered:
```bash
curl http://178.128.118.54:5000/api/webhooks
```

You should see:
```json
{
  "webhooks": [
    {
      "id": "wh_...",
      "url": "http://178.128.118.54:5678/webhook/task-events",
      "events": ["task.created", "task.updated", "task.completed"],
      "active": true
    }
  ]
}
```

### Check n8n workflow is active:
1. Open http://178.128.118.54:5678/workflow/OuDb4VKBO1MpJaF4
2. Look for green "Active" badge in top-right
3. If it says "Inactive", click to activate

### Test with a real project:
1. Create a project with a mission and scope
2. Create a task in that project
3. Check n8n executions - should generate content!
4. View the task - should have a new markdown attachment

## 📚 Advanced: Import Second Workflow

You also have a UCP Content Generator workflow for bulk content generation.

**To import:**
1. Open n8n: http://178.128.118.54:5678
2. Click "Workflows" → "+ Add Workflow" → "Import from File"
3. Upload: `scripts/n8n-workflows/ucp-content-generator.json`
4. This workflow lets you bulk-generate content for all tasks in a project

## 🛠️ Troubleshooting

### Webhook not triggering?
```bash
# Check if webhook is registered and active
curl http://178.128.118.54:5000/api/webhooks

# Check n8n logs
ssh root@178.128.118.54
cd /var/www/n8n
docker-compose logs -f
```

### AI generation failing?
```bash
# Check if OpenAI key is set
ssh root@178.128.118.54
grep OPENAI_API_KEY /var/www/americancheese/americancheese/.env

# Check app logs for errors
pm2 logs americancheese
```

### Workflow not active?
- Open the workflow in n8n
- Click the toggle switch in top-right
- Make sure it says "Active" (green)

## 📖 Reference Commands

**View all webhooks:**
```bash
curl http://178.128.118.54:5000/api/webhooks
```

**Delete a webhook:**
```bash
curl -X DELETE http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID
```

**Toggle webhook active/inactive:**
```bash
curl -X PATCH http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID/toggle
```

**Test a webhook:**
```bash
curl -X POST http://178.128.118.54:5000/api/webhooks/WEBHOOK_ID/test
```

**Trigger task event manually:**
```bash
curl -X POST http://178.128.118.54:5000/api/tasks/TASK_ID/trigger-event \
  -H "Content-Type: application/json" \
  -d '{"event": "task.created"}'
```

## 🎉 You're All Set!

Your automation is now live. Create a task and watch the magic happen!

**Quick Links:**
- 🌐 Your App: http://178.128.118.54:5000
- 🤖 n8n Dashboard: http://178.128.118.54:5678
- 📊 n8n Executions: http://178.128.118.54:5678/executions
- 🔧 Your Workflow: http://178.128.118.54:5678/workflow/OuDb4VKBO1MpJaF4

---

**Need help?** Check [CONNECT_N8N.md](CONNECT_N8N.md) for full documentation.

**Last Updated:** 2026-01-24
