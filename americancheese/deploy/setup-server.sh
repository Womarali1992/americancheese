#!/bin/bash
# DigitalOcean Droplet Setup Script for American Cheese
# Run this script as root on a fresh Ubuntu 22.04/24.04 droplet

set -e

echo "==================================="
echo "American Cheese Server Setup"
echo "==================================="

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install Node.js 20 LTS
echo "Installing Node.js 20 LTS..."
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Verify Node.js installation
node --version
npm --version

# Install PostgreSQL
echo "Installing PostgreSQL..."
apt install -y postgresql postgresql-contrib

# Start and enable PostgreSQL
systemctl start postgresql
systemctl enable postgresql

# Install nginx
echo "Installing Nginx..."
apt install -y nginx

# Install PM2 globally
echo "Installing PM2..."
npm install -g pm2

# Install git
apt install -y git

# Create application user
echo "Creating application user..."
useradd -m -s /bin/bash americancheese || echo "User already exists"

# Create application directory
echo "Creating application directory..."
mkdir -p /var/www/americancheese
chown americancheese:americancheese /var/www/americancheese

# Set up PostgreSQL database and user
echo "Setting up PostgreSQL database..."
sudo -u postgres psql <<EOF
CREATE USER americancheese WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';
CREATE DATABASE americancheese OWNER americancheese;
GRANT ALL PRIVILEGES ON DATABASE americancheese TO americancheese;
EOF

echo ""
echo "==================================="
echo "Base setup complete!"
echo "==================================="
echo ""
echo "IMPORTANT: Next steps:"
echo "1. Change the PostgreSQL password in /var/www/americancheese/.env"
echo "2. Also update the password in PostgreSQL:"
echo "   sudo -u postgres psql -c \"ALTER USER americancheese WITH PASSWORD 'your_new_password';\""
echo ""
echo "3. Configure firewall:"
echo "   ufw allow OpenSSH"
echo "   ufw allow 'Nginx Full'"
echo "   ufw enable"
echo ""
echo "4. Copy your application files to /var/www/americancheese"
echo "5. Run the deploy script"
echo ""
