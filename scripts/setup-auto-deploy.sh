#!/bin/bash

# Auto-Deploy Setup Script
# This script sets up GitHub webhook-based automatic deployment

set -e

echo "======================================"
echo "GitHub Auto-Deploy Setup"
echo "======================================"
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "Please run as root (use sudo)"
  exit 1
fi

APP_DIR="/var/www/americancheese"
WEBHOOK_PORT=9000

# Generate a secure webhook secret
echo "Generating secure webhook secret..."
WEBHOOK_SECRET=$(openssl rand -hex 32)

# Save webhook secret to environment file
ENV_FILE="$APP_DIR/.webhook.env"
echo "WEBHOOK_SECRET=$WEBHOOK_SECRET" > "$ENV_FILE"
chmod 600 "$ENV_FILE"
echo "✓ Webhook secret saved to $ENV_FILE"

# Make webhook listener executable
chmod +x "$APP_DIR/scripts/webhook-listener.js"
echo "✓ Webhook listener made executable"

# Create logs directory
mkdir -p "$APP_DIR/logs"
chown -R $SUDO_USER:$SUDO_USER "$APP_DIR/logs"
echo "✓ Logs directory created"

# Update PM2 ecosystem config with the secret
export WEBHOOK_SECRET="$WEBHOOK_SECRET"

# Start webhook listener with PM2
echo "Starting webhook listener..."
cd "$APP_DIR"
pm2 start scripts/webhook-ecosystem.config.js
pm2 save
echo "✓ Webhook listener started"

# Configure UFW firewall to allow webhook port
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
  ufw allow $WEBHOOK_PORT/tcp
  echo "✓ Firewall configured (port $WEBHOOK_PORT opened)"
else
  echo "⚠ UFW not found, skipping firewall configuration"
fi

# Update Nginx configuration to proxy webhook requests
NGINX_WEBHOOK_CONF="/etc/nginx/sites-available/webhook"

echo "Creating Nginx configuration for webhook..."
cat > "$NGINX_WEBHOOK_CONF" <<'EOF'
server {
    listen 80;
    server_name _;  # Replace with your domain if needed

    location /webhook {
        proxy_pass http://localhost:9000/webhook;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # GitHub webhook headers
        proxy_set_header X-GitHub-Event $http_x_github_event;
        proxy_set_header X-Hub-Signature-256 $http_x_hub_signature_256;

        # Timeout settings for long deployments
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 300s;
    }
}
EOF

# Enable Nginx configuration if not already enabled
if [ ! -L "/etc/nginx/sites-enabled/webhook" ]; then
  ln -s "$NGINX_WEBHOOK_CONF" /etc/nginx/sites-enabled/webhook
fi

# Test Nginx configuration
nginx -t && systemctl reload nginx
echo "✓ Nginx configured and reloaded"

echo ""
echo "======================================"
echo "✅ Auto-Deploy Setup Complete!"
echo "======================================"
echo ""
echo "Next steps:"
echo ""
echo "1. Note your webhook secret:"
echo "   $WEBHOOK_SECRET"
echo ""
echo "2. Configure GitHub webhook:"
echo "   - Go to: https://github.com/Womarali1992/Sitesetupsfinal/settings/hooks"
echo "   - Click 'Add webhook'"
echo "   - Payload URL: http://178.128.118.54/webhook"
echo "   - Content type: application/json"
echo "   - Secret: (paste the secret above)"
echo "   - Which events: Just the push event"
echo "   - Active: ✓"
echo "   - Click 'Add webhook'"
echo ""
echo "3. Test the webhook:"
echo "   - Make a commit and push to main branch"
echo "   - Server will automatically deploy!"
echo ""
echo "4. View deployment logs:"
echo "   pm2 logs github-webhook"
echo "   tail -f $APP_DIR/logs/webhook-deployments.log"
echo ""
echo "Webhook listener is running on port $WEBHOOK_PORT"
echo ""
