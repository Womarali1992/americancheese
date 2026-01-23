#!/bin/bash
# n8n Setup Script for Digital Ocean Droplet
# Run this on your droplet: bash n8n-setup.sh
#
# Server: 178.128.118.54
# SSH: ssh root@178.128.118.54

set -e

echo "=== n8n Installation on Digital Ocean Droplet ==="
echo ""

# Check if Docker is installed
if ! command -v docker &> /dev/null; then
    echo "Installing Docker..."
    curl -fsSL https://get.docker.com -o get-docker.sh
    sh get-docker.sh
    rm get-docker.sh
    systemctl start docker
    systemctl enable docker
    echo "Docker installed successfully"
fi

# Check if Docker Compose is installed
if ! command -v docker-compose &> /dev/null; then
    echo "Installing Docker Compose..."
    apt-get update
    apt-get install -y docker-compose-plugin
    # Create symlink for docker-compose command
    ln -sf /usr/libexec/docker/cli-plugins/docker-compose /usr/local/bin/docker-compose 2>/dev/null || true
fi

# Create n8n directory
echo "Creating n8n directory..."
mkdir -p /var/www/n8n
cd /var/www/n8n

# Create docker-compose.yml for n8n
echo "Creating docker-compose configuration..."
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
      # Security - set these in production!
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

# Create workflows directory
mkdir -p workflows

# Open firewall for n8n
echo "Configuring firewall..."
if command -v ufw &> /dev/null; then
    ufw allow 5678/tcp
    echo "Firewall configured for port 5678"
fi

# Start n8n
echo "Starting n8n..."
docker-compose up -d

# Wait for n8n to start
echo "Waiting for n8n to initialize..."
sleep 10

# Check status
if docker ps | grep -q n8n; then
    echo ""
    echo "=== n8n Installation Complete! ==="
    echo ""
    echo "n8n is now running at: http://178.128.118.54:5678"
    echo ""
    echo "Default credentials:"
    echo "  Username: admin"
    echo "  Password: changeme123"
    echo ""
    echo "IMPORTANT: Change the password in docker-compose.yml!"
    echo ""
    echo "To manage n8n:"
    echo "  cd /var/www/n8n"
    echo "  docker-compose logs -f    # View logs"
    echo "  docker-compose restart    # Restart n8n"
    echo "  docker-compose down       # Stop n8n"
    echo ""
    echo "Your americancheese API webhook URL:"
    echo "  http://178.128.118.54:5000/api/webhooks/register"
    echo ""
else
    echo "Error: n8n container failed to start"
    docker-compose logs
    exit 1
fi
