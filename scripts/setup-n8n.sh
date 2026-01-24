#!/bin/bash
# Local script to set up n8n on your VPS
# Run this from your local machine (Mac/Linux)
#
# Usage: bash scripts/setup-n8n.sh

set -e

SERVER="178.128.118.54"
USER="root"

echo "========================================="
echo "  n8n Setup for American Cheese"
echo "========================================="
echo ""
echo "This will:"
echo "  1. Connect to your VPS via SSH"
echo "  2. Install and configure n8n"
echo "  3. Copy workflow files"
echo "  4. Register webhooks"
echo "  5. Test the connection"
echo ""
echo "Server: ${SERVER}"
echo ""
read -p "Press Enter to continue..."
echo ""

# Check if we can connect
echo "Testing SSH connection..."
if ssh -o ConnectTimeout=5 ${USER}@${SERVER} "echo 'Connected successfully'" &> /dev/null; then
    echo "✅ SSH connection successful"
else
    echo "❌ Cannot connect to ${SERVER}"
    echo "   Please check:"
    echo "   - Server IP is correct"
    echo "   - SSH key is configured"
    echo "   - Server is running"
    exit 1
fi

echo ""
echo "Uploading setup script to server..."
scp scripts/connect-n8n.sh ${USER}@${SERVER}:/tmp/connect-n8n.sh

echo ""
echo "Running setup on server..."
ssh ${USER}@${SERVER} "bash /tmp/connect-n8n.sh"

echo ""
echo "========================================="
echo "  Setup Complete!"
echo "========================================="
echo ""
echo "🌐 Open n8n at: http://${SERVER}:5678"
echo "   Username: admin"
echo "   Password: changeme123"
echo ""
echo "📚 See CONNECT_N8N.md for next steps"
echo ""
echo "🔧 Quick Commands:"
echo "   ssh ${USER}@${SERVER}              # Connect to server"
echo "   cd /var/www/n8n && docker-compose logs -f   # View n8n logs"
echo ""
