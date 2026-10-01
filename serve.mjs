import http from 'node:http';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, 'site');
const PORT = process.env.PORT || 4321;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.png': 'image/png', '.jpg': 'image/jpeg', '.jpeg': 'image/jpeg',
  '.webp': 'image/webp', '.svg': 'image/svg+xml', '.gif': 'image/gif',
  '.avif': 'image/avif', '.ico': 'image/x-icon',
  '.woff': 'font/woff', '.woff2': 'font/woff2', '.ttf': 'font/ttf',
  '.mp4': 'video/mp4', '.webm': 'video/webm',
  '.mp3': 'audio/mpeg', '.wav': 'audio/wav', '.m4a': 'audio/mp4',
};

// dev server: never let the browser cache, so edits show up on every reload
const NO_CACHE = 'no-cache, no-store, must-revalidate';

function send(res, code, body, type) {
  res.writeHead(code, { 'Content-Type': type || 'text/plain', 'Access-Control-Allow-Origin': '*', 'Cache-Control': NO_CACHE });
  res.end(body);
}

// log requests from other devices on the LAN (e.g. a phone testing the site) —
// pages + scripts only — so we can tell whether a device fetched fresh files
const LOG = path.join(__dirname, 'serve-lan.log');
function lanLog(req) {
  const ip = (req.socket.remoteAddress || '').replace('::ffff:', '');
  if (ip === '127.0.0.1' || ip === '::1') return;
  if (!/\.(mjs|js|css)$|^\/(pm|kasy)?\/?(\?.*)?$/.test(req.url)) return;
  fs.appendFile(LOG, `${new Date().toISOString()} ${ip} ${req.url} ${(req.headers['user-agent'] || '').slice(0, 60)}\n`, () => {});
}

const server = http.createServer((req, res) => {
  lanLog(req);
  let urlPath = decodeURIComponent(req.url.split('?')[0]);
  let fp = path.join(ROOT, urlPath);

  // resolve directories / clean routes to index.html
  try {
    if (fs.existsSync(fp) && fs.statSync(fp).isDirectory()) fp = path.join(fp, 'index.html');
    else if (!fs.existsSync(fp)) {
      if (fs.existsSync(fp + '.html')) fp = fp + '.html';
      else if (fs.existsSync(path.join(fp, 'index.html'))) fp = path.join(fp, 'index.html');
    }
  } catch {}

  if (!fp.startsWith(ROOT) || !fs.existsSync(fp) || fs.statSync(fp).isDirectory()) {
    return send(res, 404, 'Not found');
  }
  const ext = path.extname(fp).toLowerCase();
  res.writeHead(200, { 'Content-Type': MIME[ext] || 'application/octet-stream', 'Access-Control-Allow-Origin': '*', 'Cache-Control': NO_CACHE });
  fs.createReadStream(fp).pipe(res);
});

server.listen(PORT, () => console.log(`Serving ${ROOT} at http://localhost:${PORT}`));
