/**
 * PM2 — Hostinger (Node na porta 3019 atrás do nginx, se aplicável).
 * Na VPS: npm install -g pm2 && npm ci && npm run pm2:start
 */
const path = require('path');

const root = __dirname;

module.exports = {
  apps: [
    {
      name: 'casa-do-brigadeiro-cardapio',
      script: path.join(root, 'server', 'index.js'),
      cwd: root,
      instances: 1,
      exec_mode: 'fork',
      autorestart: true,
      watch: false,
      max_memory_restart: '300M',
      env: {
        NODE_ENV: 'production',
        PORT: '3019'
      },
      error_file: path.join(root, 'logs', 'pm2-error.log'),
      out_file: path.join(root, 'logs', 'pm2-out.log'),
      merge_logs: true,
      time: true
    }
  ]
};
