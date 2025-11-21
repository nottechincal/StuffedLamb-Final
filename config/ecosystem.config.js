module.exports = {
  apps: [{
    name: 'stuffed-lamb',
    script: 'src/server.js',

    // Instances
    instances: 1,
    exec_mode: 'fork',

    // Environment
    env: {
      NODE_ENV: 'development',
      PORT: 8000
    },
    env_production: {
      NODE_ENV: 'production',
      PORT: 8000
    },

    // Logging
    error_file: 'logs/pm2-error.log',
    out_file: 'logs/pm2-out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss',
    merge_logs: true,

    // Restart behavior
    watch: false,
    autorestart: true,
    max_restarts: 10,
    min_uptime: '10s',
    restart_delay: 4000,

    // Memory management
    max_memory_restart: '300M',

    // Graceful shutdown
    kill_timeout: 5000,
    wait_ready: true,
    listen_timeout: 10000,

    // Advanced PM2 features
    exp_backoff_restart_delay: 100,

    // Environment variables can also be set here
    // But prefer using .env file for secrets
  }]
};
