// Serves the production build (dist/) on 127.0.0.1:4400 and proxies /api/* to the local Spotify bridge
// (serve.mjs on 4399), so the built home works exactly as it will on Cloudflare: same origin for page and API.
// Expose with: tailscale serve --bg --https=10007 http://127.0.0.1:4400
import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';

const root = path.resolve(new URL('..', import.meta.url).pathname.replace(/^\/([A-Za-z]:)/, '$1'), 'dist');
const mime = { '.html': 'text/html; charset=utf-8', '.css': 'text/css', '.js': 'text/javascript', '.mjs': 'text/javascript', '.json': 'application/json', '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg', '.webp': 'image/webp', '.svg': 'image/svg+xml', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.txt': 'text/plain' };

http.createServer((req, res) => {
  const url = new URL(req.url, 'http://127.0.0.1');
  if (url.pathname.startsWith('/api/')) {
    const up = http.request({ host: '127.0.0.1', port: 4399, path: req.url, method: req.method, headers: req.headers }, (r) => { res.writeHead(r.statusCode, r.headers); r.pipe(res); });
    up.on('error', () => { res.writeHead(502); res.end('bridge down'); }); req.pipe(up); return;
  }
  let p = decodeURIComponent(url.pathname); if (p.endsWith('/')) p += 'index.html';
  let abs = path.join(root, p); if (!abs.startsWith(root)) { res.writeHead(403); return res.end(); }
  if (!fs.existsSync(abs) && fs.existsSync(abs + '/index.html')) abs += '/index.html';
  fs.readFile(abs, (err, data) => {
    if (err) { fs.readFile(path.join(root, '404.html'), (e2, d2) => { res.writeHead(404, { 'content-type': 'text/html; charset=utf-8' }); res.end(e2 ? 'not found' : d2); }); return; }
    res.writeHead(200, { 'content-type': mime[path.extname(abs).toLowerCase()] || 'application/octet-stream', 'cache-control': 'no-store' }); res.end(data);
  });
}).listen(4400, '127.0.0.1', () => console.log('dist on http://127.0.0.1:4400, /api → 4399'));
