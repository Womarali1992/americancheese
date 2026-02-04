module.exports = {
  apps: [
    {
      name: 'americancheese',
      script: 'dist/index.js',
      cwd: '/var/www/americancheese',
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '500M',
      env: {
        NODE_ENV: 'production',
        PORT: 5000
      },
      error_file: '/var/log/americancheese/error.log',
      out_file: '/var/log/americancheese/out.log',
      log_file: '/var/log/americancheese/combined.log',
      time: true
    }
  ]
};
