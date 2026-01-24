# Deployment Guide - Construction Management Platform

Complete guide for deploying the Construction Management Platform to a VPS via SSH with Git-based deployment.

## Prerequisites

- VPS server (DigitalOcean, Linode, AWS EC2, etc.)
- SSH access to your server (root or sudo privileges)
- Domain name pointed to your server IP (optional but recommended)
- Git repository hosting (GitHub, GitLab, Bitbucket)

## Quick Start

```bash
# 1. SSH into your server
ssh root@your-server-ip

# 2. Download and run server setup script
curl -O https://raw.githubusercontent.com/YOUR_USERNAME/american/main/scripts/server-setup.sh
chmod +x server-setup.sh
sudo bash server-setup.sh

# 3. Follow the post-setup instructions below
```

## Detailed Deployment Steps

### Step 1: Initial Server Setup

1. **SSH into your server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Run the server setup script:**
   ```bash
   cd /tmp
   # Copy the server-setup.sh from scripts/ directory to your server
   # Or download from your repository
   chmod +x server-setup.sh
   sudo bash server-setup.sh
   ```

   This script will:
   - Install Node.js 18/20 LTS
   - Install PostgreSQL
   - Install Nginx
   - Install PM2 process manager
   - Create database and user
   - Set up basic firewall rules

### Step 2: Clone Repository

1. **Navigate to app directory:**
   ```bash
   cd /var/www/americancheese
   ```

2. **Clone your repository:**

   **Option A - HTTPS (easier, no SSH key setup needed):**
   ```bash
   git clone https://github.com/YOUR_USERNAME/american.git .
   ```

   **Option B - SSH (more secure, requires SSH key):**
   ```bash
   # Generate SSH key on server
   ssh-keygen -t ed25519 -C "your-server@deployment"
   cat ~/.ssh/id_ed25519.pub  # Copy this key to GitHub Deploy Keys

   # Clone with SSH
   git clone git@github.com:YOUR_USERNAME/american.git .
   ```

### Step 3: Configure Environment

1. **Set up database password:**
   ```bash
   # Generate a secure password
   openssl rand -base64 32

   # Update PostgreSQL password
   sudo -u postgres psql
   ALTER USER postgres PASSWORD 'YOUR_GENERATED_PASSWORD';
   \q
   ```

2. **Create environment file:**
   ```bash
   cd /var/www/americancheese/americancheese
   cp .env.production.example .env
   nano .env
   ```

3. **Generate session secret:**
   ```bash
   node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
   ```
   Copy the output and paste it into `SESSION_SECRET` in your `.env` file.

4. **Update .env file with your values:**
   ```env
   NODE_ENV=production
   PORT=5000
   DATABASE_URL=postgresql://postgres:YOUR_PASSWORD@localhost:5432/americancheese
   SESSION_SECRET=YOUR_GENERATED_SECRET
   ```

5. **Secure the .env file:**
   ```bash
   chmod 600 .env
   ```

### Step 4: Build and Deploy

1. **Install dependencies:**
   ```bash
   cd /var/www/americancheese/americancheese
   npm install
   ```

2. **Run database migrations:**
   ```bash
   npm run db:push
   ```

3. **Build the application:**
   ```bash
   npm run build
   ```

4. **Create logs directory:**
   ```bash
   mkdir -p logs
   ```

5. **Update PM2 ecosystem config:**
   ```bash
   nano ecosystem.config.cjs
   ```
   Update `YOUR_SERVER_IP` and `YOUR_USERNAME` with your actual values.

6. **Start with PM2:**
   ```bash
   pm2 start ecosystem.config.cjs
   pm2 save
   pm2 startup
   ```
   Follow the command that PM2 outputs to enable startup on boot.

7. **Verify it's running:**
   ```bash
   pm2 status
   pm2 logs americancheese
   curl http://localhost:5000/health
   ```

### Step 5: Configure Nginx

1. **Copy Nginx configuration:**
   ```bash
   sudo cp /var/www/americancheese/scripts/nginx.conf /etc/nginx/sites-available/americancheese
   ```

2. **Update domain name:**
   ```bash
   sudo nano /etc/nginx/sites-available/americancheese
   ```
   Replace `yourdomain.com` with your actual domain.

3. **Enable the site:**
   ```bash
   sudo ln -s /etc/nginx/sites-available/americancheese /etc/nginx/sites-enabled/
   sudo nginx -t
   sudo systemctl reload nginx
   ```

4. **Test your deployment:**
   ```bash
   curl http://your-server-ip
   # or
   curl http://yourdomain.com
   ```

### Step 6: Set Up SSL (HTTPS)

1. **Install Certbot:**
   ```bash
   sudo apt install certbot python3-certbot-nginx
   ```

2. **Obtain SSL certificate:**
   ```bash
   sudo certbot --nginx -d yourdomain.com -d www.yourdomain.com
   ```

3. **Test auto-renewal:**
   ```bash
   sudo certbot renew --dry-run
   ```

Your application should now be available at `https://yourdomain.com`!

## Future Deployments (Git-Based)

After initial setup, deploy updates using the deployment script:

1. **SSH into server:**
   ```bash
   ssh root@your-server-ip
   ```

2. **Run deployment script:**
   ```bash
   cd /var/www/americancheese
   bash scripts/deploy.sh
   ```

Or manually:
```bash
cd /var/www/americancheese
git pull origin main
cd americancheese
npm install
npm run db:push
npm run build
pm2 restart americancheese
```

## Monitoring & Maintenance

### View Application Logs
```bash
pm2 logs americancheese          # Real-time logs
pm2 logs americancheese --lines 100  # Last 100 lines
```

### Check Application Status
```bash
pm2 status                       # Process status
pm2 monit                       # Live monitoring dashboard
pm2 show americancheese         # Detailed process info
```

### Database Backup
```bash
# Create backup
sudo -u postgres pg_dump americancheese > backup_$(date +%Y%m%d).sql

# Restore backup
sudo -u postgres psql americancheese < backup_20260124.sql
```

### Nginx Logs
```bash
sudo tail -f /var/log/nginx/americancheese-access.log
sudo tail -f /var/log/nginx/americancheese-error.log
```

### Restart Services
```bash
pm2 restart americancheese       # Restart app
sudo systemctl restart nginx     # Restart Nginx
sudo systemctl restart postgresql # Restart PostgreSQL
```

## Troubleshooting

### Application Won't Start
```bash
# Check logs
pm2 logs americancheese --err

# Check if port is in use
sudo lsof -i :5000

# Verify environment variables
cd /var/www/americancheese/americancheese
cat .env

# Test database connection
sudo -u postgres psql -d americancheese -c "SELECT 1;"
```

### Database Connection Errors
```bash
# Check PostgreSQL is running
sudo systemctl status postgresql

# Verify database exists
sudo -u postgres psql -l | grep americancheese

# Test connection string
sudo -u postgres psql "postgresql://postgres:PASSWORD@localhost:5432/americancheese"
```

### Nginx Not Proxying
```bash
# Test Nginx config
sudo nginx -t

# Check Nginx is running
sudo systemctl status nginx

# Verify proxy settings
sudo nano /etc/nginx/sites-available/americancheese

# Check Nginx error logs
sudo tail -f /var/log/nginx/error.log
```

### Out of Memory
```bash
# Check memory usage
free -h

# Increase PM2 memory limit in ecosystem.config.cjs:
# max_memory_restart: '2G'

# Restart with new config
pm2 delete americancheese
pm2 start ecosystem.config.cjs
```

## Security Best Practices

1. **Firewall Configuration:**
   ```bash
   sudo ufw enable
   sudo ufw allow 'Nginx Full'
   sudo ufw allow OpenSSH
   sudo ufw status
   ```

2. **Secure PostgreSQL:**
   - Use strong passwords
   - Restrict connections to localhost only
   - Regular backups

3. **Environment Variables:**
   - Never commit `.env` to version control
   - Use strong `SESSION_SECRET` (min 32 characters)
   - Rotate secrets periodically

4. **Keep Software Updated:**
   ```bash
   sudo apt update && sudo apt upgrade
   npm update
   ```

5. **Monitor Logs:**
   - Set up log rotation
   - Monitor for suspicious activity
   - Use PM2 monitoring or external services

## Performance Optimization

1. **Enable PM2 Cluster Mode:**
   Edit `ecosystem.config.cjs`:
   ```javascript
   instances: 'max',  // Use all CPU cores
   exec_mode: 'cluster',
   ```

2. **Database Connection Pooling:**
   Already configured in the application via Drizzle ORM.

3. **Nginx Caching:**
   Add to Nginx config for static assets (if serving static files).

4. **Gzip Compression:**
   Already enabled in the provided Nginx configuration.

## Support

For issues or questions:
- Check application logs: `pm2 logs americancheese`
- Review Nginx logs: `sudo tail -f /var/log/nginx/americancheese-error.log`
- Check database connectivity
- Verify environment variables are correctly set

## File Structure Reference

```
/var/www/americancheese/
├── americancheese/              # Main application directory
│   ├── client/                  # React frontend
│   ├── server/                  # Express backend
│   ├── shared/                  # Shared code
│   ├── dist/                    # Built application (generated)
│   ├── .env                     # Environment config (create from template)
│   ├── ecosystem.config.cjs     # PM2 configuration
│   └── package.json
├── scripts/
│   ├── server-setup.sh          # Initial server setup
│   ├── deploy.sh                # Deployment script
│   └── nginx.conf               # Nginx configuration template
└── .git/                        # Git repository
```

---

**Last Updated:** 2026-01-24
