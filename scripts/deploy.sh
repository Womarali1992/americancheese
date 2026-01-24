#!/bin/bash
# Deployment script for Construction Management Platform
# Run this on your VPS to pull latest code and redeploy

set -e  # Exit on error

APP_DIR="/var/www/americancheese"
APP_NAME="americancheese"

echo "===================================="
echo "Deploying Construction Platform"
echo "===================================="

# Navigate to app directory
cd $APP_DIR

# Pull latest code
echo "Pulling latest code from Git..."
git fetch origin
git pull origin main

# Navigate to americancheese subdirectory
cd americancheese

# Install dependencies
echo "Installing dependencies..."
npm install

# Run database migrations
echo "Running database migrations..."
npm run db:push

# Build the application
echo "Building application..."
npm run build

# Restart PM2 process
echo "Restarting application..."
pm2 restart $APP_NAME || pm2 start ecosystem.config.cjs

# Save PM2 configuration
pm2 save

echo ""
echo "===================================="
echo "Deployment Complete!"
echo "===================================="
echo ""
echo "Application status:"
pm2 status
echo ""
echo "View logs: pm2 logs $APP_NAME"
echo ""
