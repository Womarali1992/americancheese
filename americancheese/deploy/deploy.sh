#!/bin/bash
# Deployment script for American Cheese
# Run this from /var/www/americancheese after uploading files

set -e

APP_DIR="/var/www/americancheese"
LOG_DIR="/var/log/americancheese"

echo "==================================="
echo "Deploying American Cheese"
echo "==================================="

# Create log directory
sudo mkdir -p $LOG_DIR
sudo chown americancheese:americancheese $LOG_DIR

# Navigate to app directory
cd $APP_DIR

# Install dependencies
echo "Installing dependencies..."
npm ci --production=false

# Build the application
echo "Building application..."
npm run build

# Push database schema
echo "Pushing database schema..."
npm run db:push

# Start/restart with PM2
echo "Starting application with PM2..."
pm2 delete americancheese 2>/dev/null || true
pm2 start deploy/ecosystem.config.cjs

# Save PM2 process list
pm2 save

# Set up PM2 to start on boot (run once)
pm2 startup systemd -u americancheese --hp /home/americancheese 2>/dev/null || true

echo ""
echo "==================================="
echo "Deployment complete!"
echo "==================================="
echo ""
echo "Check status with: pm2 status"
echo "View logs with: pm2 logs americancheese"
echo ""
