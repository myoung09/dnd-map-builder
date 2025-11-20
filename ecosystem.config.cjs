module.exports = {
  apps: [
    {
      name: 'dnd-map-websocket',
      script: './server/websocket-server.js',
      instances: 1,
      exec_mode: 'fork',
      env: {
        NODE_ENV: 'development',
        WS_PORT: 3001
      },
      env_production: {
        NODE_ENV: 'production',
        WS_PORT: 3001
      },
      error_file: './logs/websocket-error.log',
      out_file: './logs/websocket-out.log',
      log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
      merge_logs: true,
      autorestart: true,
      max_restarts: 10,
      min_uptime: '10s',
      watch: false
    }
  ]
};
