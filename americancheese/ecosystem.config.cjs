// PM2 Ecosystem Configuration for Construction Management Platform
// This file configures PM2 process manager for production deployment

module.exports = {
  apps: [
    {
      name: 'americancheese',
      script: 'dist/index.js',
      instances: 1,
      exec_mode: 'cluster',

      // Environment variables
      env: {
        NODE_ENV: 'production',
        PORT: 5000,
      },

      // Restart configuration
      watch: false,
      max_memory_restart: '1G',

      // Logging
      error_file: './logs/pm2-error.log',
      out_file: './logs/pm2-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,

      // Advanced settings
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',

      // Graceful shutdown
      kill_timeout: 5000,
      wait_ready: true,
      listen_timeout: 10000,
    },
  ],

  // Deploy configuration for Git-based deployment
  deploy: {
    production: {
      user: 'root',
      host: 'YOUR_SERVER_IP',  // Change this to your server IP
      ref: 'origin/main',
      repo: 'git@github.com:YOUR_USERNAME/american.git',  // Change this
      path: '/var/www/americancheese',
      'post-deploy': 'cd americancheese && npm install && npm run build && pm2 reload ecosystem.config.cjs',
    },
  },
};
