#!/bin/bash
# Deploy American Cheese to Production Server

set -e  # Exit on error

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

echo -e "${BLUE}========================================"
echo "Deploying to Production"
echo -e "========================================${NC}"
echo

# Configuration - UPDATE THESE!
SERVER_USER="${SERVER_USER:-root}"
SERVER_HOST="${SERVER_HOST:-your-server-ip}"
APP_PATH="${APP_PATH:-/var/www/apps/americancheese}"

echo -e "${YELLOW}Server: ${SERVER_USER}@${SERVER_HOST}${NC}"
echo -e "${YELLOW}Path: ${APP_PATH}${NC}"
echo

# Step 1: Pull latest code
echo -e "${BLUE}Step 1: Pulling latest code...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${APP_PATH} && git pull origin main"
echo -e "${GREEN}✅ Code pulled successfully${NC}"
echo

# Step 2: Check database status
echo -e "${BLUE}Step 2: Checking database status...${NC}"
ssh ${SERVER_USER}@${SERVER_HOST} "cd ${APP_PATH} && node check-production-data.js"
echo

# Step 3: Ask about initializing categories
echo -e "${YELLOW}Step 3: Initialize categories?${NC}"
read -p "Initialize categories for projects without them? (y/n): " -n 1 -r
echo
if [[ $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${BLUE}Initializing project categories...${NC}"
    ssh ${SERVER_USER}@${SERVER_HOST} "cd ${APP_PATH} && node initialize-project-categories.js"
    echo -e "${GREEN}✅ Categories initialized${NC}"
    echo
fi

# Step 4: Restart server
echo -e "${BLUE}Step 4: Restarting server...${NC}"
echo "Choose restart method:"
echo "1) PM2"
echo "2) Systemd"
echo "3) Docker Compose"
echo "4) Skip restart"
read -p "Enter option (1-4): " restart_option

case $restart_option in
    1)
        ssh ${SERVER_USER}@${SERVER_HOST} "pm2 restart americancheese"
        echo -e "${GREEN}✅ PM2 restarted${NC}"
        ;;
    2)
        ssh ${SERVER_USER}@${SERVER_HOST} "sudo systemctl restart americancheese"
        echo -e "${GREEN}✅ Systemd service restarted${NC}"
        ;;
    3)
        ssh ${SERVER_USER}@${SERVER_HOST} "cd ${APP_PATH} && docker-compose restart"
        echo -e "${GREEN}✅ Docker containers restarted${NC}"
        ;;
    4)
        echo -e "${YELLOW}⚠️  Skipped restart. Remember to restart manually!${NC}"
        ;;
    *)
        echo -e "${RED}Invalid option. Please restart manually.${NC}"
        ;;
esac

echo
echo -e "${GREEN}========================================"
echo "Deployment Complete!"
echo -e "========================================${NC}"
echo
echo "Next: Visit https://app.sitesetups.com/dashboard to verify:"
echo "  ✅ Projects should load"
echo "  ✅ Categories should appear"
echo "  ✅ Tasks should display"
echo
