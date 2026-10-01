// Build a GitHub Pages copy of site/ that works under a sub-path
// (https://codnelle.github.io/kasyy/). The site is written for the domain root:
// assets, page links, Framer's route table and our injected scripts all use
// root-relative paths ("/fonts/…", "/kasy", path:`/pm`). This copies site/ to
// dist/ and prefixes every such path with BASE. Framer picks the page from the
// routeId baked into each HTML file, so only paths need rewriting.
//
//   node tools/deploy-pages.mjs /kasyy      (BASE defaults to /kasyy)
import fs from 'node:fs';
import path from 'node:path';

const REPO = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..');
const SRC = path.join(REPO, 'site');
const OUT = path.join(REPO, 'dist');
const BASE = (process.argv[2] || '/kasyy').replace(/\/$/, '');

const TEXT = /\.(html|js|mjs|css|json|svg|txt|xml)$/i;
const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// every top-level file/folder in site/ is servable at "/<name>" — routes (pm, kasy)
// included — so a root-relative reference to any of them gets the prefix
const entries = fs.readdirSync(SRC).filter(n => n !== 'index.html' && !n.startsWith('.'));
const ROOTED = new RegExp(
  `(["'\`(=\\s,;])\\/(${entries.map(esc).join('|')})(?=[\\/"'\`)?#\\s,&\\\\]|$)`, 'g');

function rewrite(t) {
  t = t.replace(ROOTED, (m, pre, name) => `${pre}${BASE}/${name}`);
  // the home route "/" itself
  t = t.split('href="/"').join(`href="${BASE}/"`)
       .split('path:`/`').join(`path:\`${BASE}/\``)
       .split("p==='/'").join(`p==='${BASE}/'`);
  // per-page <title> map patched into shared-lib (build step "kxmeta"): its keys
  // are pathnames with the trailing slash stripped, so home is BASE, not "/"
  t = t.split('{"/":{').join(`{"${BASE}":{`)
       .split('||"/",m=M[k]||M["/"]').join(`||"${BASE}",m=M[k]||M["${BASE}"]`);
  return t;
}

fs.rmSync(OUT, { recursive: true, force: true });
let n = 0, changed = 0;
(function copy(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const src = path.join(dir, e.name), dst = path.join(OUT, path.relative(SRC, src));
    if (e.isDirectory()) { fs.mkdirSync(dst, { recursive: true }); copy(src); continue; }
    if (e.name.endsWith('.log') || e.name === '.DS_Store') continue;
    fs.mkdirSync(path.dirname(dst), { recursive: true });
    if (TEXT.test(e.name)) {
      const t = fs.readFileSync(src, 'utf8'), out = rewrite(t);
      fs.writeFileSync(dst, out); if (out !== t) changed++;
    } else fs.copyFileSync(src, dst);
    n++;
  }
})(SRC);
fs.writeFileSync(path.join(OUT, '.nojekyll'), '');   // serve files as-is, no Jekyll
console.log(`dist/ ready for ${BASE}/ — ${n} files, ${changed} rewritten`);
