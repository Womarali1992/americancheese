#!/bin/bash
# Complete n8n Setup and Connection Script
# This sets up n8n on the VPS and connects it to the americancheese app
#
# Usage: ssh root@178.128.118.54 'bash -s' < scripts/connect-n8n.sh

set -e

SERVER_IP="178.128.118.54"
APP_URL="http://${SERVER_IP}:5000"
N8N_URL="http://${SERVER_IP}:5678"

echo "========================================="
echo "  n8n Setup & Connection for American Cheese"
echo "========================================="
echo ""
echo "Server: ${SERVER_IP}"
echo "App URL: ${APP_URL}"
echo "n8n URL: ${N8N_URL}"
echo ""

# ==================== STEP 1: Install n8n ====================
echo "STEP 1: Installing n8n (if not already installed)..."
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "✅ Docker installed"
else
    echo "✅ Docker already installed"
fi

# Create n8n directory
mkdir -p /var/www/n8n
cd /var/www/n8n

# Create docker-compose.yml for n8n
echo "Creating n8n docker-compose configuration..."
cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  n8n:
    image: docker.n8n.io/n8nio/n8n
    container_name: n8n
    restart: always
    ports:
      - "5678:5678"
    environment:
      - N8N_HOST=178.128.118.54
      - N8N_PORT=5678
      - N8N_PROTOCOL=http
      - NODE_ENV=production
      - WEBHOOK_URL=http://178.128.118.54:5678/
      - GENERIC_TIMEZONE=America/Chicago
      # Security - CHANGE THESE IN PRODUCTION!
      - N8N_BASIC_AUTH_ACTIVE=true
      - N8N_BASIC_AUTH_USER=admin
      - N8N_BASIC_AUTH_PASSWORD=changeme123
    volumes:
      - n8n_data:/home/node/.n8n
      - ./workflows:/home/node/workflows

volumes:
  n8n_data:
    external: false
EOF

# Open firewall for n8n
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 5678/tcp || true
    echo "✅ Firewall configured for port 5678"
fi

# Start n8n (or restart if already running)
echo "Starting n8n..."
if docker ps -a | grep -q n8n; then
    echo "n8n container exists, restarting..."
    docker-compose down
fi

docker-compose up -d

# Wait for n8n to start
echo "Waiting for n8n to initialize..."
sleep 15

# Check if n8n is running
if docker ps | grep -q n8n; then
    echo "✅ n8n is running"
else
    echo "❌ n8n failed to start. Check logs:"
    docker-compose logs
    exit 1
fi

# ==================== STEP 2: Import Workflows ====================
echo ""
echo "STEP 2: Preparing workflow files..."
echo ""

# Create workflows directory
mkdir -p /tmp/n8n-workflows

# Copy workflows from the app repo
if [ -d "/var/www/americancheese/scripts/n8n-workflows" ]; then
    cp /var/www/americancheese/scripts/n8n-workflows/*.json /tmp/n8n-workflows/
    echo "✅ Workflow files copied"
else
    echo "⚠️  Workflow files not found in /var/www/americancheese/scripts/n8n-workflows"
    echo "   You'll need to import them manually via the n8n UI"
fi

# ==================== STEP 3: Register Webhooks ====================
echo ""
echo "STEP 3: Registering webhooks with americancheese app..."
echo ""

# Wait for app to be ready
sleep 5

# Register webhook for task events
echo "Registering task event webhook..."
WEBHOOK_RESPONSE=$(curl -s -X POST "${APP_URL}/api/webhooks/register" \
  -H "Content-Type: application/json" \
  -d '{
    "url": "'"${N8N_URL}"'/webhook/task-events",
    "events": ["task.created", "task.updated", "task.completed"],
    "secret": "n8n-automation-secret-123"
  }')

echo "Response: ${WEBHOOK_RESPONSE}"

# Check if webhook was registered successfully
if echo "${WEBHOOK_RESPONSE}" | grep -q "id"; then
    echo "✅ Webhook registered successfully"
else
    echo "⚠️  Webhook registration failed or may already exist"
fi

# ==================== STEP 4: Test the Connection ====================
echo ""
echo "STEP 4: Testing the connection..."
echo ""

# Test app health
echo "Testing app endpoint..."
APP_HEALTH=$(curl -s "${APP_URL}/health" || echo "FAILED")
if [ "$APP_HEALTH" != "FAILED" ]; then
    echo "✅ App is responding at ${APP_URL}"
else
    echo "❌ App is not responding. Check PM2 status:"
    pm2 status
fi

# Test n8n health
echo "Testing n8n endpoint..."
N8N_HEALTH=$(curl -s -o /dev/null -w "%{http_code}" "${N8N_URL}" || echo "000")
if [ "$N8N_HEALTH" = "200" ] || [ "$N8N_HEALTH" = "401" ]; then
    echo "✅ n8n is responding at ${N8N_URL}"
else
    echo "❌ n8n is not responding (HTTP ${N8N_HEALTH})"
fi

# ==================== STEP 5: Display Summary ====================
echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "🌐 Access n8n at: ${N8N_URL}"
echo "   Username: admin"
echo "   Password: changeme123"
echo ""
echo "📱 Americancheese App: ${APP_URL}"
echo ""
echo "📋 Next Steps:"
echo ""
echo "1. Open n8n in your browser: ${N8N_URL}"
echo ""
echo "2. Import workflows manually:"
echo "   - Click 'Workflows' > '+ Add Workflow' > Import from File"
echo "   - Import: /tmp/n8n-workflows/task-webhook-handler.json"
echo "   - Import: /tmp/n8n-workflows/ucp-content-generator.json"
echo ""
echo "3. Or use the n8n CLI to import:"
echo "   docker exec -it n8n n8n import:workflow --input=/home/node/workflows/task-webhook-handler.json"
echo ""
echo "4. Activate the workflows in the n8n UI"
echo ""
echo "5. Test the automation:"
echo "   - Create a new task in your app"
echo "   - Check n8n executions to see if it triggers"
echo ""
echo "📚 Workflow Files Location:"
echo "   /tmp/n8n-workflows/"
echo ""
echo "🔧 Manage n8n:"
echo "   cd /var/www/n8n"
echo "   docker-compose logs -f    # View logs"
echo "   docker-compose restart    # Restart n8n"
echo "   docker-compose down       # Stop n8n"
echo ""
echo "🔗 Webhook Endpoint (for manual registration):"
echo "   POST ${APP_URL}/api/webhooks/register"
echo ""
echo "📊 View registered webhooks:"
echo "   curl ${APP_URL}/api/webhooks"
echo ""
echo "⚠️  IMPORTANT:"
echo "   - Change the n8n password in docker-compose.yml!"
echo "   - The workflows are configured for IP: ${SERVER_IP}"
echo "   - Webhook URL: ${N8N_URL}/webhook/task-events"
echo ""
echo "========================================="
echo ""

# Show current webhooks
echo "Current registered webhooks:"
curl -s "${APP_URL}/api/webhooks" | python3 -m json.tool 2>/dev/null || echo "Could not retrieve webhooks"
echo ""
