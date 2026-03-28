/**
 * Servidor estático - Senna Doce
 * Node nativo (sem dependências)
 *
 * Use sempre esta origem para site + /admin (mesmo localStorage):
 *   http://localhost:3003/
 *   http://localhost:3003/admin/
 *
 * Inicie com: npm start
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const PORT = 3003;
const MIME_TYPES = {
  '.html': 'text/html',
  '.js': 'text/javascript',
  '.css': 'text/css',
  '.json': 'application/json',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.webp': 'image/webp'
};

const ROOT = process.cwd();

function resolveFilePath(urlPathname) {
  let rel = urlPathname.split('?')[0] || '/';
  if (rel === '/' || rel === '') {
    return path.join(ROOT, 'index.html');
  }
  let filePath = path.join(ROOT, rel.replace(/^\//, ''));
  filePath = path.normalize(filePath);
  if (!filePath.startsWith(ROOT)) {
    return null;
  }
  return filePath;
}

function sendFile(res, filePath) {
  fs.readFile(filePath, (err, content) => {
    if (err) {
      if (err.code === 'ENOENT') {
        res.writeHead(404);
        res.end('Arquivo não encontrado');
      } else {
        res.writeHead(500);
        res.end('Erro do servidor');
      }
      return;
    }
    const ext = path.extname(filePath);
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';
    res.writeHead(200, { 'Content-Type': contentType });
    res.end(content);
  });
}

const server = http.createServer((req, res) => {
  const urlPath = new URL(req.url || '/', 'http://localhost').pathname;
  let filePath = resolveFilePath(urlPath);

  if (!filePath) {
    res.writeHead(403);
    res.end('Caminho inválido');
    return;
  }

  fs.stat(filePath, (err, st) => {
    if (!err && st.isDirectory()) {
      const indexPath = path.join(filePath, 'index.html');
      return sendFile(res, indexPath);
    }
    if (!err && st.isFile()) {
      return sendFile(res, filePath);
    }
    if (!path.extname(filePath)) {
      const withHtml = filePath + '.html';
      fs.stat(withHtml, (e2, st2) => {
        if (!e2 && st2.isFile()) {
          return sendFile(res, withHtml);
        }
        res.writeHead(404);
        res.end('Arquivo não encontrado');
      });
      return;
    }
    res.writeHead(404);
    res.end('Arquivo não encontrado');
  });
});

server.listen(PORT, '0.0.0.0', () => {
  console.log(`Senna Doce — use esta origem para site e admin (mesmo localStorage):`);
  console.log(`  http://localhost:${PORT}/`);
  console.log(`  http://localhost:${PORT}/admin/`);
});
