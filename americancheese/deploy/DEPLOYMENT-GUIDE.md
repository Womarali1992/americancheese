# American Cheese - DigitalOcean Deployment Guide

## Step 1: Create a New Droplet

1. Go to [DigitalOcean](https://cloud.digitalocean.com/droplets/new)
2. Create a new Droplet with these settings:
   - **Region**: Choose closest to your users
   - **Image**: Ubuntu 24.04 LTS x64
   - **Size**: Basic > Regular > $6/mo (1 GB RAM / 1 vCPU / 25 GB SSD)
   - **Authentication**: SSH Key (recommended) or Password
   - **Hostname**: `americancheese` or similar

3. Note your droplet's IP address after creation

## Step 2: Connect to Your Droplet

```bash
ssh root@YOUR_DROPLET_IP
```

## Step 3: Run Initial Server Setup

Copy and paste this entire block:

```bash
# Update system
apt update && apt upgrade -y

# Install Node.js 20 LTS
curl -fsSL https://deb.nodesource.com/setup_20.x | bash -
apt install -y nodejs

# Install PostgreSQL
apt install -y postgresql postgresql-contrib
systemctl start postgresql
systemctl enable postgresql

# Install nginx and other tools
apt install -y nginx git

# Install PM2
npm install -g pm2

# Create application directory
mkdir -p /var/www/americancheese
mkdir -p /var/log/americancheese
```

## Step 4: Set Up PostgreSQL Database

```bash
# Create database and user (CHANGE THE PASSWORD!)
sudo -u postgres psql -c "CREATE USER americancheese WITH PASSWORD 'YOUR_SECURE_PASSWORD_HERE';"
sudo -u postgres psql -c "CREATE DATABASE americancheese OWNER americancheese;"
sudo -u postgres psql -d americancheese -c "GRANT ALL ON SCHEMA public TO americancheese;"
```

**Important**: Replace `YOUR_SECURE_PASSWORD_HERE` with a strong password!

## Step 5: Upload Your Application

### Option A: Using Git (Recommended)
```bash
cd /var/www/americancheese
git clone YOUR_REPO_URL .
```

### Option B: Using SCP from your local machine
From your Windows machine (in PowerShell):
```powershell
# First, create a zip of the project (excluding node_modules)
cd c:\Users\omara\apps\american\americancheese
tar -czvf ../americancheese.tar.gz --exclude=node_modules --exclude=.git .

# Upload to server
scp ../americancheese.tar.gz root@YOUR_DROPLET_IP:/var/www/americancheese/

# Then on the server:
cd /var/www/americancheese
tar -xzvf americancheese.tar.gz
rm americancheese.tar.gz
```

## Step 6: Configure Environment Variables

Create the `.env` file on the server:

```bash
cat > /var/www/americancheese/.env << 'EOF'
NODE_ENV=production
PORT=5000
HOST=0.0.0.0

# Database Configuration
DB_HOST=localhost
DB_PORT=5432
DB_NAME=americancheese
DB_USER=americancheese
DB_PASSWORD=YOUR_SECURE_PASSWORD_HERE

# Session Secret (generate with: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
SESSION_SECRET=PASTE_GENERATED_SECRET_HERE

# Optional: OpenAI for n8n integrations
# OPENAI_API_KEY=sk-your-key-here
EOF
```

Generate a secure session secret:
```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

Update the SESSION_SECRET in .env with the generated value.

## Step 7: Install Dependencies and Build

```bash
cd /var/www/americancheese
npm ci
npm run build
npm run db:push
```

## Step 8: Configure Nginx

```bash
# Create nginx config
cat > /etc/nginx/sites-available/americancheese << 'EOF'
server {
    listen 80;
    server_name _;

    client_max_body_size 50M;

    location / {
        proxy_pass http://127.0.0.1:5000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_proxied any;
    gzip_types text/plain text/css text/xml text/javascript application/javascript application/json application/xml;
}
EOF

# Enable the site
ln -sf /etc/nginx/sites-available/americancheese /etc/nginx/sites-enabled/
rm -f /etc/nginx/sites-enabled/default

# Test and reload nginx
nginx -t
systemctl reload nginx
```

## Step 9: Start the Application with PM2

```bash
cd /var/www/americancheese
pm2 start dist/index.js --name americancheese
pm2 save
pm2 startup systemd
```

## Step 10: Configure Firewall

```bash
ufw allow OpenSSH
ufw allow 'Nginx Full'
ufw --force enable
```

## Step 11: Verify Deployment

1. Visit `http://YOUR_DROPLET_IP` in your browser
2. Check PM2 status: `pm2 status`
3. View logs: `pm2 logs americancheese`

## Optional: Set Up SSL with Let's Encrypt

If you have a domain:

```bash
apt install -y certbot python3-certbot-nginx
certbot --nginx -d yourdomain.com
```

## Troubleshooting

### Check application logs
```bash
pm2 logs americancheese
```

### Check nginx logs
```bash
tail -f /var/log/nginx/error.log
```

### Check PostgreSQL connection
```bash
sudo -u postgres psql -c "\l"
```

### Restart services
```bash
pm2 restart americancheese
systemctl restart nginx
```

### Update deployment
```bash
cd /var/www/americancheese
git pull  # if using git
npm ci
npm run build
pm2 restart americancheese
```

## Quick Reference

| Service | Command |
|---------|---------|
| Start app | `pm2 start americancheese` |
| Stop app | `pm2 stop americancheese` |
| Restart app | `pm2 restart americancheese` |
| View logs | `pm2 logs americancheese` |
| Check status | `pm2 status` |
| Restart nginx | `systemctl restart nginx` |
