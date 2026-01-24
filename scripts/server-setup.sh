#!/bin/bash
# One-time server setup script for americancheese backend
# Run this on your Digital Ocean droplet: bash server-setup.sh

set -e

echo "=== AmericanCheese Backend Server Setup ==="

# Update system
echo "Updating system packages..."
apt update && apt upgrade -y

# Install PostgreSQL if not installed
if ! command -v psql &> /dev/null; then
    echo "Installing PostgreSQL..."
    apt install -y postgresql postgresql-contrib
    systemctl start postgresql
    systemctl enable postgresql
fi

# Create database and user
echo "Setting up PostgreSQL database..."
DB_NAME="americancheese"
DB_USER="postgres"
DB_PASSWORD="your_secure_password_here"  # CHANGE THIS!

# Create database
sudo -u postgres psql -c "CREATE DATABASE $DB_NAME;" 2>/dev/null || echo "Database already exists"

# Set postgres password
sudo -u postgres psql -c "ALTER USER postgres PASSWORD '$DB_PASSWORD';"

# Configure PostgreSQL to accept local connections
PG_HBA=$(sudo -u postgres psql -t -c "SHOW hba_file;" | xargs)
if ! grep -q "host.*americancheese.*127.0.0.1" "$PG_HBA"; then
    echo "host    americancheese    postgres    127.0.0.1/32    md5" >> "$PG_HBA"
    systemctl restart postgresql
fi

# Install Node.js via NVM if not installed
if [ ! -d "$HOME/.nvm" ]; then
    echo "Installing NVM and Node.js..."
    curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.39.0/install.sh | bash
    export NVM_DIR="$HOME/.nvm"
    [ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
    nvm install 18
    nvm use 18
fi

# Install PM2 globally if not installed
if ! command -v pm2 &> /dev/null; then
    echo "Installing PM2..."
    npm install -g pm2
fi

# Create app directory
mkdir -p /var/www/americancheese
cd /var/www/americancheese

# Clone repository (you may need to set up deploy keys or use HTTPS)
if [ ! -d ".git" ]; then
    echo "Please clone your repository manually:"
    echo "  cd /var/www/americancheese"
    echo "  git clone https://github.com/YOUR_USERNAME/american.git ."
fi

# Create .env file
echo "Creating environment file..."
cat > /var/www/americancheese/americancheese/.env << EOF
NODE_ENV=production
DB_HOST=localhost
DB_PORT=5432
DB_NAME=$DB_NAME
DB_USER=$DB_USER
DB_PASSWORD=$DB_PASSWORD
EOF

# Set proper permissions
chmod 600 /var/www/americancheese/americancheese/.env

# Configure firewall for port 5000
if command -v ufw &> /dev/null; then
    echo "Configuring firewall..."
    ufw allow 5000/tcp
fi

# Set up Nginx reverse proxy (optional but recommended)
echo "Setting up Nginx reverse proxy..."
if command -v nginx &> /dev/null; then
    cat > /etc/nginx/sites-available/americancheese << 'NGINX'
server {
    listen 80;
    server_name api.yourdomain.com;  # CHANGE THIS to your domain

    location / {
        proxy_pass http://localhost:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Increase timeouts for large file uploads
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Increase body size for file uploads
        client_max_body_size 50M;
    }
}
NGINX
    ln -sf /etc/nginx/sites-available/americancheese /etc/nginx/sites-enabled/
    nginx -t && systemctl reload nginx
fi

echo ""
echo "=== Setup Complete ==="
echo ""
echo "Next steps:"
echo "1. Update DB_PASSWORD in /var/www/americancheese/americancheese/.env"
echo "2. Clone your repo: cd /var/www/americancheese && git clone https://github.com/YOUR_USERNAME/american.git ."
echo "3. Navigate to app: cd /var/www/americancheese/americancheese"
echo "4. Install deps: npm install"
echo "5. Build: npm run build"
echo "6. Start: pm2 start npm --name americancheese -- run start"
echo "7. Save PM2: pm2 save && pm2 startup"
echo ""
echo "Your API will be available at: http://178.128.118.54:5000"
echo ""
