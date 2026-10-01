import fs from 'node:fs';
import path from 'node:path';

const ROOT = '/Users/kashish/Desktop/portfolio/site';
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const HOSTS = ['framerusercontent.com', 'app.framerstatic.com'];
const seen = new Set();
const queue = [];

// seed from arg list file
const seeds = JSON.parse(fs.readFileSync('/Users/kashish/Desktop/portfolio/_raw/seeds.json', 'utf8'));
for (const s of seeds) enqueue(s);

function enqueue(url) {
  try {
    const u = new URL(url);
    if (!HOSTS.includes(u.host)) return;
    const key = u.origin + u.pathname;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push(u.origin + u.pathname);
  } catch {}
}

function localPath(url) {
  const u = new URL(url);
  return path.join(ROOT, u.host, u.pathname);
}

async function fetchBuf(url) {
  const res = await fetch(url, { headers: { 'User-Agent': UA, 'Accept': '*/*' } });
  if (!res.ok) throw new Error(res.status + ' ' + url);
  return Buffer.from(await res.arrayBuffer());
}

let count = 0;
while (queue.length) {
  const url = queue.shift();
  let buf;
  try { buf = await fetchBuf(url); }
  catch (e) { console.log('FAIL', e.message); continue; }
  const dest = localPath(url);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, buf);
  count++;
  const isText = /\.(mjs|js|json|css)$/.test(url);
  if (isText) {
    const txt = buf.toString('utf8');
    const base = url.substring(0, url.lastIndexOf('/') + 1);
    // relative and absolute references
    const refs = txt.match(/(["'`(])((?:\.\.?\/|https:\/\/(?:framerusercontent\.com|app\.framerstatic\.com)\/)[^"'`)]+?\.(?:mjs|js|json|css|woff2?|png|jpe?g|webp|svg|gif|avif|mp4|webm))/g) || [];
    for (let r of refs) {
      r = r.slice(1); // drop the opening delimiter captured
      let abs;
      if (r.startsWith('http')) abs = r;
      else abs = new URL(r, base).href;
      enqueue(abs);
    }
  }
  if (count % 20 === 0) console.log('...', count, 'downloaded,', queue.length, 'queued');
}
console.log('DONE. total files:', count);
