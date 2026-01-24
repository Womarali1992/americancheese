# Automatic Deployment Setup Guide

## Overview

This guide will set up automatic deployment from GitHub to your server. Whenever you push code to the `main` branch on GitHub, your server will automatically:
1. Pull the latest code
2. Install dependencies
3. Run database migrations
4. Build the application
5. Restart the server

## Prerequisites

- Server with SSH access (root or sudo)
- Git repository on GitHub
- Server IP: `178.128.118.54`
- Repository: `https://github.com/Womarali1992/Sitesetupsfinal.git`

## Setup Instructions

### Step 1: Commit and Push Setup Scripts

First, commit the auto-deploy scripts to your repository:

```bash
# On your local machine
cd c:\Users\omara\apps\american

git add scripts/webhook-listener.js scripts/webhook-ecosystem.config.js scripts/setup-auto-deploy.sh AUTO_DEPLOY_SETUP.md

git commit -m "Add automatic deployment via GitHub webhooks"

git push origin main
```

### Step 2: Run Setup Script on Server

SSH into your server and run the setup script:

```bash
# SSH into your server
ssh root@178.128.118.54

# Navigate to app directory
cd /var/www/americancheese

# Pull the setup scripts
git pull origin main

# Make setup script executable
chmod +x scripts/setup-auto-deploy.sh

# Run the setup script
sudo bash scripts/setup-auto-deploy.sh
```

The setup script will:
- ✅ Generate a secure webhook secret
- ✅ Start a webhook listener service
- ✅ Configure Nginx to proxy webhook requests
- ✅ Configure firewall rules
- ✅ Set up PM2 to keep the webhook listener running

**IMPORTANT:** The script will output a **webhook secret**. Copy this secret - you'll need it in the next step!

### Step 3: Configure GitHub Webhook

1. **Go to your GitHub repository settings:**
   - Navigate to: https://github.com/Womarali1992/Sitesetupsfinal/settings/hooks
   - Click **"Add webhook"**

2. **Configure the webhook:**
   - **Payload URL:** `http://178.128.118.54/webhook`
   - **Content type:** `application/json`
   - **Secret:** Paste the webhook secret from Step 2
   - **Which events would you like to trigger this webhook?**
     - Select: **Just the push event**
   - **Active:** ✓ (checked)
   - Click **"Add webhook"**

3. **Verify webhook is active:**
   - GitHub will send a test ping
   - You should see a green checkmark next to your webhook

### Step 4: Test Auto-Deployment

Make a test commit to verify auto-deployment works:

```bash
# On your local machine
cd c:\Users\omara\apps\american

# Make a small change (like adding a comment to a file)
echo "# Auto-deploy test" >> README.md

# Commit and push
git add README.md
git commit -m "Test auto-deployment"
git push origin main
```

**What happens next:**
1. GitHub receives your push
2. GitHub sends a webhook to your server
3. Your server receives the webhook
4. Deployment starts automatically
5. Your changes are live in ~1-2 minutes!

### Step 5: Monitor Deployments

Watch deployment logs in real-time:

```bash
# SSH into your server
ssh root@178.128.118.54

# View webhook listener logs
pm2 logs github-webhook

# Or view deployment history
tail -f /var/www/americancheese/logs/webhook-deployments.log
```

## How It Works

### Architecture

```
GitHub → Push Event
   ↓
GitHub Webhook
   ↓
Your Server (178.128.118.54:80/webhook)
   ↓
Nginx (Reverse Proxy)
   ↓
Webhook Listener (Port 9000)
   ↓
Deployment Script
   ↓
1. git pull
2. npm install
3. npm run db:push
4. npm run build
5. pm2 restart
   ↓
✅ Deployed!
```

### Security

- **Webhook secret:** GitHub signs each webhook with HMAC-SHA256
- **Signature verification:** Server verifies GitHub's signature before deploying
- **Branch filtering:** Only deploys from `main` branch
- **Firewall:** Port 9000 is firewalled (only accessible via Nginx)

### What Gets Auto-Deployed

✅ **Frontend changes** (React components, pages, styles)
✅ **Backend changes** (API routes, server logic)
✅ **Database changes** (schema migrations)
✅ **Dependencies** (package.json updates)
✅ **Configuration** (environment-specific configs)

## Workflow After Setup

### Your New Development Workflow

1. **Make changes locally:**
   ```bash
   # Edit files in your IDE
   # Test locally: npm run dev
   ```

2. **Commit changes:**
   ```bash
   git add .
   git commit -m "Your commit message"
   ```

3. **Push to GitHub:**
   ```bash
   git push origin main
   ```

4. **Wait 1-2 minutes:**
   - Automatic deployment happens
   - Check logs if needed: `pm2 logs github-webhook`

5. **Verify changes:**
   - Visit: http://178.128.118.54:5000
   - Your changes are live!

## Monitoring & Troubleshooting

### Check Webhook Status

```bash
# Check if webhook listener is running
pm2 status

# View recent deployments
tail -n 50 /var/www/americancheese/logs/webhook-deployments.log

# View webhook listener logs
pm2 logs github-webhook --lines 100
```

### Common Issues

#### Webhook Not Triggering

**Check GitHub webhook status:**
1. Go to: https://github.com/Womarali1992/Sitesetupsfinal/settings/hooks
2. Click on your webhook
3. Scroll to "Recent Deliveries"
4. Check for errors

**Possible causes:**
- Server is down
- Firewall blocking port
- Nginx not running
- Webhook secret mismatch

**Solution:**
```bash
# Restart Nginx
sudo systemctl restart nginx

# Restart webhook listener
pm2 restart github-webhook

# Check firewall
sudo ufw status
```

#### Deployment Fails

**View detailed error logs:**
```bash
tail -f /var/www/americancheese/logs/webhook-deployments.log
```

**Common causes:**
- Git conflicts
- npm install errors
- Build failures
- Database migration errors

**Solution:**
```bash
# SSH into server
ssh root@178.128.118.54

# Manual deployment to see full error
cd /var/www/americancheese
bash scripts/deploy.sh
```

#### Wrong Branch Deployed

The webhook only deploys from `main` branch by default.

**To change the branch:**
Edit `/var/www/americancheese/scripts/webhook-listener.js`:
```javascript
const BRANCH = 'main'; // Change to your branch name
```

Then restart:
```bash
pm2 restart github-webhook
```

## Advanced Configuration

### Deploy from Multiple Branches

Edit `webhook-listener.js` to accept multiple branches:

```javascript
const ALLOWED_BRANCHES = ['main', 'staging', 'production'];

// In the webhook handler:
const branch = ref.replace('refs/heads/', '');
if (!ALLOWED_BRANCHES.includes(branch)) {
  log(`Ignoring push to branch: ${branch}`);
  return;
}
```

### Add Deployment Notifications

Install a notification service to get alerts when deployments complete:

**Slack Integration:**
```javascript
// Add to deploy() function in webhook-listener.js
const axios = require('axios');

function notifySlack(message) {
  axios.post('YOUR_SLACK_WEBHOOK_URL', {
    text: message
  });
}

// After successful deployment:
notifySlack(`✅ Deployment completed: ${commits.length} commits`);
```

### Deployment Approvals

For production environments, you may want manual approval:

1. Create a `/deploy-approve` endpoint
2. Modify webhook to queue deployments
3. Require approval before executing

## Rollback Procedure

If a deployment causes issues, rollback to previous version:

```bash
# SSH into server
ssh root@178.128.118.54
cd /var/www/americancheese

# View recent commits
git log --oneline -n 10

# Rollback to specific commit
git reset --hard COMMIT_HASH

# Rebuild and restart
cd americancheese
npm run build
pm2 restart americancheese
```

## Maintenance

### View Webhook Stats

```bash
# Number of deployments today
grep "$(date +%Y-%m-%d)" /var/www/americancheese/logs/webhook-deployments.log | grep "Deployment completed" | wc -l

# Recent deployments
tail -20 /var/www/americancheese/logs/webhook-deployments.log | grep "Deployment completed"
```

### Rotate Logs

Add log rotation to prevent logs from growing too large:

```bash
# Create logrotate config
sudo nano /etc/logrotate.d/americancheese

# Add:
/var/www/americancheese/logs/*.log {
    daily
    rotate 14
    compress
    delaycompress
    notifempty
    missingok
    create 0640 root root
}
```

### Update Webhook Secret

To change the webhook secret:

```bash
# Generate new secret
NEW_SECRET=$(openssl rand -hex 32)

# Update server
echo "WEBHOOK_SECRET=$NEW_SECRET" > /var/www/americancheese/.webhook.env
pm2 restart github-webhook

# Update GitHub webhook with new secret
# Go to: https://github.com/Womarali1992/Sitesetupsfinal/settings/hooks
```

## Disable Auto-Deploy

To temporarily or permanently disable auto-deployment:

```bash
# Stop webhook listener
pm2 stop github-webhook

# To completely remove
pm2 delete github-webhook
pm2 save
```

Re-enable by running setup script again.

## Support

### Useful Commands

```bash
# Check webhook listener status
pm2 status github-webhook

# View logs
pm2 logs github-webhook

# Restart webhook listener
pm2 restart github-webhook

# View deployment history
cat /var/www/americancheese/logs/webhook-deployments.log

# Test webhook manually
curl -X POST http://localhost:9000/webhook
```

### Getting Help

If issues persist:
1. Check webhook listener logs: `pm2 logs github-webhook`
2. Check deployment logs: `tail -f /var/www/americancheese/logs/webhook-deployments.log`
3. Check Nginx logs: `sudo tail -f /var/log/nginx/error.log`
4. Check GitHub webhook deliveries for errors

---

**Last Updated:** 2026-01-24
**Version:** 1.0

## Summary

After setup, your workflow becomes:
```
Make changes → git push → ☕ Wait 1-2 minutes → ✅ Live on server!
```

No more manual SSH deployments! 🎉
