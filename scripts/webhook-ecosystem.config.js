module.exports = {
  apps: [{
    name: 'github-webhook',
    script: './scripts/webhook-listener.js',
    cwd: '/var/www/americancheese',
    instances: 1,
    autorestart: true,
    watch: false,
    max_memory_restart: '200M',
    env: {
      NODE_ENV: 'production',
      WEBHOOK_PORT: 9000,
      WEBHOOK_SECRET: process.env.WEBHOOK_SECRET || 'change-this-secret'
    },
    error_file: '/var/www/americancheese/logs/webhook-error.log',
    out_file: '/var/www/americancheese/logs/webhook-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    merge_logs: true
  }]
};
