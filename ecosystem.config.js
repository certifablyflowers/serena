module.exports = {
  apps: [
    {
      name: 'serena',
      script: './serena.js',
      watch: false,
      restart_delay: 5000,
      max_restarts: 10,
      env: {
        NODE_ENV: 'production'
      },
      log_date_format: 'YYYY-MM-DD HH:mm:ss',
      out_file: './logs/serena.out.log',
      error_file: './logs/serena.err.log',
      merge_logs: true
    }
  ]
};
