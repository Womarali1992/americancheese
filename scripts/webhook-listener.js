#!/usr/bin/env node

/**
 * GitHub Webhook Listener for Auto-Deployment
 *
 * This script listens for GitHub push events and automatically
 * deploys the latest code to the server.
 */

const http = require('http');
const crypto = require('crypto');
const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Configuration
const PORT = process.env.WEBHOOK_PORT || 9000;
const SECRET = process.env.WEBHOOK_SECRET || 'your-webhook-secret-change-this';
const APP_DIR = '/var/www/americancheese';
const LOG_FILE = path.join(APP_DIR, 'logs', 'webhook-deployments.log');
const BRANCH = 'main'; // Only deploy from main branch

// Ensure logs directory exists
const logsDir = path.join(APP_DIR, 'logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Logging function
function log(message) {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] ${message}\n`;
  console.log(logMessage.trim());
  fs.appendFileSync(LOG_FILE, logMessage);
}

// Verify GitHub signature
function verifySignature(payload, signature) {
  if (!signature) {
    return false;
  }

  const hmac = crypto.createHmac('sha256', SECRET);
  const digest = 'sha256=' + hmac.update(payload).digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Execute deployment
function deploy() {
  log('='.repeat(80));
  log('Starting automatic deployment...');

  try {
    // Navigate to app directory
    process.chdir(APP_DIR);
    log(`Changed directory to: ${APP_DIR}`);

    // Pull latest code
    log('Pulling latest code from GitHub...');
    execSync('git fetch origin', { stdio: 'inherit' });
    execSync(`git pull origin ${BRANCH}`, { stdio: 'inherit' });
    log('✓ Code pulled successfully');

    // Navigate to americancheese subdirectory
    const appSubDir = path.join(APP_DIR, 'americancheese');
    process.chdir(appSubDir);
    log(`Changed directory to: ${appSubDir}`);

    // Install dependencies
    log('Installing dependencies...');
    execSync('npm install', { stdio: 'inherit' });
    log('✓ Dependencies installed');

    // Run database migrations
    log('Running database migrations...');
    try {
      execSync('npm run db:push', { stdio: 'inherit' });
      log('✓ Database migrations completed');
    } catch (error) {
      log('⚠ Database migrations failed (may be expected if no changes)');
    }

    // Build the application
    log('Building application...');
    execSync('npm run build', { stdio: 'inherit' });
    log('✓ Application built successfully');

    // Restart PM2
    log('Restarting PM2 process...');
    execSync('pm2 restart americancheese', { stdio: 'inherit' });
    log('✓ PM2 process restarted');

    // Save PM2 configuration
    execSync('pm2 save', { stdio: 'inherit' });
    log('✓ PM2 configuration saved');

    log('='.repeat(80));
    log('✅ Deployment completed successfully!');
    log('='.repeat(80));

    return { success: true, message: 'Deployment completed successfully' };
  } catch (error) {
    log('='.repeat(80));
    log(`❌ Deployment failed: ${error.message}`);
    log('='.repeat(80));
    return { success: false, message: error.message };
  }
}

// Create HTTP server
const server = http.createServer((req, res) => {
  // Only accept POST requests to /webhook
  if (req.method !== 'POST' || req.url !== '/webhook') {
    res.writeHead(404, { 'Content-Type': 'text/plain' });
    res.end('Not Found');
    return;
  }

  let body = '';

  req.on('data', chunk => {
    body += chunk.toString();
  });

  req.on('end', () => {
    try {
      // Verify signature
      const signature = req.headers['x-hub-signature-256'];
      if (!verifySignature(body, signature)) {
        log('⚠ Invalid webhook signature - request rejected');
        res.writeHead(401, { 'Content-Type': 'text/plain' });
        res.end('Unauthorized');
        return;
      }

      // Parse payload
      const payload = JSON.parse(body);
      const event = req.headers['x-github-event'];

      log(`Received GitHub webhook: ${event}`);

      // Only respond to push events
      if (event !== 'push') {
        log(`Ignoring non-push event: ${event}`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Event ignored' }));
        return;
      }

      // Check if push is to the main branch
      const ref = payload.ref;
      if (ref !== `refs/heads/${BRANCH}`) {
        log(`Ignoring push to branch: ${ref} (only deploying ${BRANCH})`);
        res.writeHead(200, { 'Content-Type': 'application/json' });
        res.end(JSON.stringify({ message: 'Branch ignored' }));
        return;
      }

      // Log commit information
      const commits = payload.commits || [];
      log(`Push to ${BRANCH} branch detected`);
      log(`Commits: ${commits.length}`);
      commits.forEach(commit => {
        log(`  - ${commit.id.substring(0, 7)}: ${commit.message}`);
      });

      // Respond immediately to GitHub
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ message: 'Deployment triggered' }));

      // Deploy asynchronously (don't block webhook response)
      setImmediate(() => {
        deploy();
      });

    } catch (error) {
      log(`Error processing webhook: ${error.message}`);
      res.writeHead(500, { 'Content-Type': 'text/plain' });
      res.end('Internal Server Error');
    }
  });
});

// Start server
server.listen(PORT, () => {
  log(`GitHub webhook listener started on port ${PORT}`);
  log(`Listening for push events to ${BRANCH} branch`);
  log(`Application directory: ${APP_DIR}`);
  log(`Log file: ${LOG_FILE}`);
  log('Ready to receive webhooks!');
});

// Graceful shutdown
process.on('SIGTERM', () => {
  log('Received SIGTERM, shutting down gracefully...');
  server.close(() => {
    log('Webhook listener stopped');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  log('Received SIGINT, shutting down gracefully...');
  server.close(() => {
    log('Webhook listener stopped');
    process.exit(0);
  });
});
