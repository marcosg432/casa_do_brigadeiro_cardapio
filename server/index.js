/**
 * Servidor estático + API REST (/api/*) — SQLite via database/db.js (Node ≥ 22.13).
 * Porta: process.env.PORT (padrão 3019 para deploy Hostinger).
 */
const http = require('http');
const fs = require('fs');
const path = require('path');
const { handleApi } = require('./api');
const { getDb } = require('../database/db');

const ROOT = path.resolve(__dirname, '..');
const PORT = Number(process.env.PORT) || 3019;
const HOST = process.env.HOST || '0.0.0.0';

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.webp': 'image/webp',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.txt': 'text/plain; charset=utf-8',
  '.pdf': 'application/pdf',
  '.sql': 'text/plain; charset=utf-8'
};

let apiDbReady = false;
try {
  getDb();
  apiDbReady = true;
} catch (e) {
  console.error('[cardápio] SQLite indisponível:', e.message);
}

function safeFilePath(relFromUrl) {
  if (relFromUrl.includes('\0')) return null;
  const rel = String(relFromUrl).replace(/^\/+/, '');
  const rootResolved = path.resolve(ROOT);
  const resolved = path.resolve(ROOT, rel);
  if (resolved !== rootResolved && !resolved.startsWith(rootResolved + path.sep)) {
    return null;
  }
  return resolved;
}

function send404(res) {
  res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' });
  res.end('Não encontrado');
}

function serveStatic(req, res, pathname) {
  let filePath = safeFilePath(pathname === '/' ? 'index.html' : pathname.slice(1));
  if (!filePath) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Acesso negado');
  }

  fs.stat(filePath, (err, st) => {
    if (err) return send404(res);

    if (st.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      return fs.stat(indexPath, (err2, st2) => {
        if (!err2 && st2.isFile()) return streamFile(req, res, indexPath);
        return send404(res);
      });
    }

    if (!st.isFile()) return send404(res);
    return streamFile(req, res, filePath);
  });
}

function streamFile(req, res, filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const type = MIME[ext] || 'application/octet-stream';
  const noCache = ['.html', '.css', '.js'].includes(ext);
  const headers = {
    'Content-Type': type,
    'Cache-Control': noCache ? 'no-cache, no-store, must-revalidate' : 'public, max-age=86400'
  };

  if (req.method === 'HEAD') {
    res.writeHead(200, headers);
    return res.end();
  }

  const stream = fs.createReadStream(filePath);
  stream.on('error', () => send404(res));
  res.writeHead(200, headers);
  stream.pipe(res);
}

const server = http.createServer((req, res) => {
  try {
    const url = new URL(req.url || '/', `http://${req.headers.host || 'localhost'}`);
    const pathname = decodeURIComponent(url.pathname);

    if (pathname.startsWith('/api')) {
      return handleApi(req, res, pathname, apiDbReady);
    }

    if (req.method !== 'GET' && req.method !== 'HEAD') {
      res.writeHead(405, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Método não permitido');
    }

    return serveStatic(req, res, pathname);
  } catch (e) {
    res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end('Erro interno');
  }
});

server.listen(PORT, HOST, () => {
  console.log(`[cardápio] ${apiDbReady ? 'SQLite OK' : 'SQLite OFF — só estáticos/API 503'}`);
  console.log(`[cardápio] http://${HOST}:${PORT}/`);
});
