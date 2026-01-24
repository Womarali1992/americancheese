# Connecting n8n Workflow to Deployed App

This guide walks you through connecting your n8n workflow to the deployed Construction Management Platform.

## Prerequisites

- App deployed and running on your VPS (as per DEPLOYMENT.md)
- n8n instance (cloud or self-hosted)
- A valid project ID from your deployed application
- Domain name or server IP address

## Step 1: Get Your Deployment Information

You'll need:
1. **Server URL**: Your deployed app URL
   - If you set up a domain: `https://yourdomain.com`
   - If using IP only: `http://your-server-ip`

2. **Project ID**: The ID of the project you want to import materials into
   - Log into your deployed app
   - Navigate to the project
   - The project ID is in the URL: `/projects/{PROJECT_ID}`

## Step 2: Configure n8n Webhook

### Option A: Using n8n Cloud or Self-Hosted n8n

1. **Open your n8n workflow editor**

2. **Add an HTTP Request node** to your workflow:
   - Click the "+" button to add a new node
   - Search for "HTTP Request"
   - Select "HTTP Request" node

3. **Configure the HTTP Request node:**

   **Method:** `POST`

   **URL:**
   ```
   https://yourdomain.com/api/projects/YOUR_PROJECT_ID/materials/import-n8n
   ```

   Replace:
   - `yourdomain.com` with your actual domain or `your-server-ip:5000`
   - `YOUR_PROJECT_ID` with your actual project ID (e.g., `1`, `2`, etc.)

   **Authentication:** None (add if you implement API keys later)

   **Send Body:** ✅ Enabled

   **Body Content Type:** `JSON`

   **Body:**
   ```json
   ={{ $json.materials }}
   ```
   (This assumes your previous node outputs a `materials` array)

### Option B: Complete Workflow Example

Here's a complete n8n workflow configuration:

```json
{
  "nodes": [
    {
      "name": "Manual Trigger",
      "type": "n8n-nodes-base.manualTrigger",
      "position": [250, 300]
    },
    {
      "name": "Prepare Materials Data",
      "type": "n8n-nodes-base.function",
      "position": [450, 300],
      "parameters": {
        "functionCode": "// Example: Transform your data to materials format\nconst materials = [\n  {\n    \"name\": \"2x4x8 Pine Stud\",\n    \"quantity\": 50,\n    \"unit\": \"pieces\",\n    \"cost\": 8.50,\n    \"type\": \"Building Materials\",\n    \"category\": \"Dimensional Lumber\",\n    \"tier\": \"structural\",\n    \"tier2Category\": \"framing\",\n    \"supplier\": \"84 Lumber Co.\",\n    \"status\": \"quoted\",\n    \"isQuote\": true,\n    \"taskIds\": [],\n    \"contactIds\": []\n  }\n];\n\nreturn [{ json: materials }];"
      }
    },
    {
      "name": "Import to Construction App",
      "type": "n8n-nodes-base.httpRequest",
      "position": [650, 300],
      "parameters": {
        "method": "POST",
        "url": "https://yourdomain.com/api/projects/1/materials/import-n8n",
        "sendBody": true,
        "bodyContentType": "json",
        "jsonBody": "={{ $json }}"
      }
    }
  ],
  "connections": {
    "Manual Trigger": {
      "main": [[{"node": "Prepare Materials Data", "type": "main", "index": 0}]]
    },
    "Prepare Materials Data": {
      "main": [[{"node": "Import to Construction App", "type": "main", "index": 0}]]
    }
  }
}
```

## Step 3: Test the Connection

### From n8n:

1. **Execute the workflow** in n8n
2. **Check the HTTP Request node output** - you should see:
   ```json
   {
     "message": "Successfully imported X of X materials from n8n",
     "imported": 3,
     "total": 3,
     "materials": [...],
     "projectId": 1
   }
   ```

### From Your Server:

SSH into your server and check the logs:

```bash
ssh root@your-server-ip
pm2 logs americancheese
```

You should see log entries showing the materials import.

### From the Application:

1. Log into your deployed app
2. Navigate to the project you imported to
3. Go to the Materials tab
4. Verify the imported materials appear in the list

## Step 4: Data Transformation Examples

### Example 1: Simple Supplier Quote

If your source data looks like:
```json
{
  "items": [
    { "description": "2x4x8", "qty": "50", "price": "8.50" }
  ]
}
```

Transform it with a Function node:
```javascript
const materials = items.map(item => ({
  name: item.description,
  quantity: parseInt(item.qty),
  cost: parseFloat(item.price),
  unit: "pieces",
  tier: "structural",
  tier2Category: "framing",
  status: "quoted",
  isQuote: true
}));

return [{ json: materials }];
```

### Example 2: Invoice Import

If importing from an invoice:
```javascript
const materials = $json.invoice.line_items.map(item => ({
  name: item.item_name,
  quantity: item.quantity,
  unit: item.unit_of_measure,
  cost: item.unit_price,
  type: "Building Materials",
  category: item.category || "General",
  supplier: $json.invoice.supplier_name,
  status: "ordered",
  isQuote: false,
  orderDate: $json.invoice.order_date,
  quoteNumber: $json.invoice.invoice_number
}));

return [{ json: materials }];
```

## Step 5: Production Checklist

Before going to production:

- [ ] Test with sample data first
- [ ] Verify all required fields are mapped correctly
- [ ] Confirm materials appear in the correct project
- [ ] Set up error handling in n8n workflow
- [ ] Consider adding retry logic for failed imports
- [ ] Document which workflows import to which projects
- [ ] Set up notifications for import failures

## Troubleshooting

### Error: "Cannot connect to server"

**Check if your app is running:**
```bash
ssh root@your-server-ip
pm2 status
curl http://localhost:5000/health
```

**If using HTTPS, verify SSL certificate:**
```bash
sudo certbot certificates
```

### Error: "Project not found"

- Double-check the project ID in the URL
- Verify the project exists in your database:
  ```bash
  ssh root@your-server-ip
  sudo -u postgres psql americancheese
  SELECT id, name FROM projects;
  \q
  ```

### Error: "Request body must be an array"

Your n8n node is sending a single object instead of an array. Wrap your data in brackets:
```javascript
// Wrong:
return { json: { name: "Material", quantity: 10 } };

// Correct:
return [{ json: [{ name: "Material", quantity: 10 }] }];
```

### Materials Not Appearing

Check the response from the HTTP Request node:
- Look for `"errors"` in the response
- Verify `"imported"` matches `"total"`
- Check server logs: `pm2 logs americancheese --lines 50`

### SSL/HTTPS Issues

If using HTTPS and getting certificate errors in n8n:
- Verify your SSL certificate is valid: `sudo certbot certificates`
- Check Nginx is properly configured: `sudo nginx -t`
- Test with curl: `curl -v https://yourdomain.com/health`

## Security Enhancements (Optional)

### Add API Key Authentication

1. **Update your .env file on the server:**
   ```bash
   ssh root@your-server-ip
   cd /var/www/americancheese/americancheese
   nano .env
   ```

   Add:
   ```env
   N8N_API_KEY=your-secure-random-key-here
   ```

2. **Modify the endpoint** in [server/routes.ts](americancheese/server/routes.ts) to check for the API key

3. **Update your n8n HTTP Request node:**
   - Add Header: `x-api-key: your-secure-random-key-here`

## Advanced: Webhook Trigger

For real-time imports when new data arrives:

1. **Add a Webhook node** to your n8n workflow
2. **Configure it as a trigger** (first node)
3. **Get the webhook URL** from n8n
4. **Configure your data source** (supplier system, etc.) to send POST requests to the webhook URL
5. **Add transformation and HTTP Request nodes** as shown above

## Testing from Command Line

Test the endpoint directly from your local machine:

```bash
curl -X POST https://yourdomain.com/api/projects/1/materials/import-n8n \
  -H "Content-Type: application/json" \
  -d '[
    {
      "name": "Test Material",
      "quantity": 10,
      "unit": "pieces",
      "cost": 5.00,
      "tier": "structural",
      "tier2Category": "framing",
      "status": "quoted",
      "isQuote": true
    }
  ]'
```

Expected response:
```json
{
  "message": "Successfully imported 1 of 1 materials from n8n",
  "imported": 1,
  "total": 1,
  "materials": [...]
}
```

## Support

If you encounter issues:
1. Check PM2 logs: `pm2 logs americancheese`
2. Check Nginx logs: `sudo tail -f /var/log/nginx/americancheese-error.log`
3. Verify n8n workflow configuration
4. Test with curl command above to isolate the issue

---

**Last Updated:** 2026-01-24
