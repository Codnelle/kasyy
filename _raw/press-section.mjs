// "Elsewhere" section (press mentions + social profiles) and the SEO head tags,
// all generated from /press.json at build time. The section is baked into the
// static HTML (so crawlers see real <a href> links without running JS) at the end
// of <body>, outside Framer's React root; /press.js then moves it to just above
// the footer once the page has hydrated.
import fs from 'node:fs';

export function loadPress(file) {
  const d = JSON.parse(fs.readFileSync(file, 'utf8'));
  d.profiles = (d.profiles || []).filter(p => p.url);
  d.press = (d.press || []).filter(p => p.url);
  return d;
}

const esc = s => String(s ?? '').replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');

const ICON = {
  instagram: '<rect x="4" y="4" width="16" height="16" rx="4.5"/><circle cx="12" cy="12" r="3.6"/><circle cx="16.9" cy="7.1" r=".9" fill="currentColor" stroke="none"/>',
  linkedin: '<path d="M6.5 10v7.5M6.5 6.6v.1M10.5 17.5V10m0 3.2c0-1.9 1.3-3.3 3-3.3s2.9 1.2 2.9 3.3v4.3"/>',
  youtube: '<rect x="3" y="6" width="18" height="12" rx="3.5"/><path d="M10.4 9.4v5.2l4.4-2.6z" fill="currentColor" stroke="none"/>',
  x: '<path d="M5 5l14 14M19 5L5 19"/>',
  github: '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
  topmate: '<path d="M7 7h10M12 7v11"/>',
  link: '<path d="M9 15l6-6M10 7h7v7"/>'
};
const icon = n => `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${ICON[n] || ICON.link}</svg>`;

const SANS = `"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif`;   // aliased to Inter
const MONO = `"JetBrains Mono", ui-monospace, monospace`;

const CSS = `
.kxp{position:relative;overflow:hidden;width:100vw;max-width:none;margin-left:calc(50% - 50vw);margin-right:calc(50% - 50vw);align-self:center;z-index:1;background:transparent;color:#14110f;font-family:${SANS};padding:clamp(90px,13vh,140px) 5vw clamp(34px,5vh,56px);min-height:min(100vh,1000px);box-sizing:border-box;display:flex;flex-direction:column}
.kxp *{box-sizing:border-box}
.kxp-grid{position:relative;z-index:2;flex:1;display:grid;grid-template-columns:minmax(0,.9fr) minmax(0,1.1fr);gap:4vw}
.kxp-list{grid-column:2;grid-row:1;align-self:center}
.kxp-eyebrow{font-family:${MONO};font-size:11px;letter-spacing:.18em;text-transform:uppercase;color:rgba(20,17,15,.6);margin:0 0 18px}
.kxp-list ol{list-style:none;margin:0;padding:0;border-bottom:1px solid rgba(20,17,15,.2)}
.kxp-row{display:grid;grid-template-columns:clamp(44px,6vw,110px) minmax(0,1fr) auto;align-items:center;gap:12px;padding:clamp(14px,2.2vh,24px) 0;border-top:1px solid rgba(20,17,15,.2);color:inherit;text-decoration:none}
.kxp-num{font-size:clamp(15px,1.5vw,22px);color:rgba(20,17,15,.45);font-variant-numeric:tabular-nums}
.kxp-t{display:block;font-weight:700;font-size:clamp(34px,5.4vw,84px);line-height:.95;letter-spacing:-.045em;transition:transform .35s cubic-bezier(.2,.7,.2,1)}
.kxp-m{display:block;margin-top:8px;font-size:clamp(12.5px,1vw,15px);color:rgba(20,17,15,.62);letter-spacing:0}
.kxp-go{width:clamp(44px,4.4vw,70px);height:clamp(44px,4.4vw,70px);border-radius:50%;border:1px solid rgba(20,17,15,.35);display:grid;place-items:center;transition:background .3s,color .3s,transform .35s}
.kxp-row:hover .kxp-t,.kxp-row:focus-visible .kxp-t{transform:translateX(14px)}
.kxp-row:hover .kxp-go,.kxp-row:focus-visible .kxp-go{background:#14110f;color:#fffdf8;transform:rotate(45deg)}
.kxp-row:focus-visible{outline:2px solid #ff8fb1;outline-offset:4px}
.kxp{--hw:min(360px,26vw)}.kxp-me{grid-column:1;grid-row:1;align-self:center;justify-self:start;position:relative;width:var(--hw);margin-left:0;padding-top:clamp(70px,7vw,100px);pointer-events:none}.kxp-head{position:relative;z-index:1;width:100%;transform:rotate(10deg)}.kxp-head img{filter:drop-shadow(0 18px 36px rgba(20,30,50,.25))}
.kxp-head img{display:block;width:100%;height:auto}
.kxp-bubble{position:absolute;z-index:3;left:62%;top:0;white-space:nowrap;background:#fffdf8;color:#14110f;font-weight:700;font-size:clamp(16px,1.6vw,24px);letter-spacing:-.02em;padding:22px 34px;border-radius:44px 46px 40px 48px;transform:rotate(-6deg);box-shadow:0 14px 30px rgba(20,30,50,.22)}
.kxp-bubble:after{content:"";position:absolute;left:26px;bottom:-16px;border:12px solid transparent;border-top:18px solid #fffdf8;border-bottom:0;transform:skewX(-20deg)}
.kxp-foot{position:relative;z-index:2;display:flex;flex-wrap:wrap;align-items:center;justify-content:flex-end;gap:18px 26px;margin-top:clamp(36px,6vh,70px);font-size:14px;color:rgba(20,17,15,.6)}
.kxp-foot p{margin:0}
.kxp-soc{display:flex;gap:10px;margin:0;padding:0;list-style:none}
.kxp-soc a{width:52px;height:52px;border-radius:50%;border:1px solid rgba(20,17,15,.35);display:grid;place-items:center;color:#14110f;background:rgba(255,253,248,.35);transition:background .25s,color .25s}
.kxp-soc a:hover,.kxp-soc a:focus-visible{background:#14110f;color:#fffdf8}
@media (max-width:810px){
  .kxp{--hw:52vw;padding:84px 20px 34px;min-height:0}
  .kxp-grid{display:flex;flex-direction:column}
  .kxp-list{align-self:stretch}
  .kxp-me{order:2;margin-top:36px;padding-top:74px}
  .kxp-foot{margin-top:28px}
  .kxp-bubble{left:52%;padding:16px 22px}
  .kxp-foot{justify-content:flex-start}
  .kxp-go{display:none}
}
@media (prefers-reduced-motion:reduce){.kxp *{transition:none!important}}`;

export function sectionHTML(d) {
  const rows = d.press.length
    ? d.press.map(p => ({ url: p.url, t: p.outlet, m: [p.kind, p.year, p.title].filter(Boolean).join(' · '), rel: 'noopener' }))
    : d.profiles.map(p => ({ url: p.url, t: p.label, m: p.url.replace(/^https?:\/\/(www\.)?/, ''), rel: 'me noopener' }));
  const eyebrow = d.press.length ? 'as seen in — press, talks & videos' : 'elsewhere on the internet';
  const list = rows.map((r, i) =>
    `<li><a class="kxp-row" href="${esc(r.url)}" target="_blank" rel="${r.rel}">`
    + `<span class="kxp-num">${String(i + 1).padStart(2, '0')}</span>`
    + `<span><span class="kxp-t">${esc(r.t)}</span>${r.m ? `<span class="kxp-m">${esc(r.m)}</span>` : ''}</span>`
    + `<span class="kxp-go" aria-hidden="true">${icon('link')}</span></a></li>`).join('');
  const soc = d.profiles.map(p =>
    `<li><a href="${esc(p.url)}" target="_blank" rel="me noopener" aria-label="${esc(d.person.name)} on ${esc(p.label)}" title="${esc(p.label)}">${icon(p.network)}</a></li>`).join('');
  return `<section id="kx-press" class="kxp" aria-labelledby="kxp-h"><style>${CSS.replace(/\n\s*/g, '')}</style>`
    + `<div class="kxp-grid"><div class="kxp-me" aria-hidden="true"><div class="kxp-bubble">Leaving so soon?</div><div class="kxp-head"><img src="/kasy-head/peek.webp" alt="" loading="lazy" decoding="async"></div></div><nav class="kxp-list" aria-labelledby="kxp-h"><h2 id="kxp-h" class="kxp-eyebrow">${eyebrow}</h2><ol>${list}</ol></nav></div>`
    + `<div class="kxp-foot"><p>© ${new Date().getFullYear()} ${esc(d.person.name)} · ${esc(d.person.alternateName)}</p>${soc ? `<ul class="kxp-soc">${soc}</ul>` : ''}</div>`
    + `</section>`;
}

// <head>: real title/description (+ og/twitter), rel=me profile links, and a
// schema.org Person that ties the site to every profile (sameAs) and lists the
// press coverage (subjectOf) — this is what search engines use to connect the
// name "Kashish Sharma" / "Kasy" to this site and those profiles.
export function applyHead(html, d, pageKey) {
  const pg = (d.pages || {})[pageKey];
  if (pg) {
    const t = esc(pg.title), ds = esc(pg.description);
    html = html.replace(/<title>[^<]*<\/title>/i, `<title>${t}</title>`)
      .replace(/(<meta (?:name|property)="(?:og:|twitter:)?description" content=")[^"]*(")/gi, `$1${ds}$2`)
      .replace(/(<meta (?:name|property)="(?:og|twitter):title" content=")[^"]*(")/gi, `$1${t}$2`);
  }
  const url = `${d.site}/${pageKey === 'index' ? '' : pageKey}`;
  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Person',
    '@id': `${d.site}/#person`,
    name: d.person.name,
    alternateName: d.person.alternateName,
    url,
    jobTitle: pageKey === 'kasy' ? 'Designer & Creative Developer' : 'Product Manager',
    homeLocation: { '@type': 'Place', name: d.person.location },
    award: d.person.awards,
    sameAs: d.profiles.map(p => p.url)
  };
  if (d.press.length) ld.subjectOf = d.press.map(p => ({
    '@type': /video/i.test(p.kind) ? 'VideoObject' : 'Article',
    name: p.title || `${p.outlet} ${p.kind || ''}`.trim(),
    url: p.url,
    publisher: { '@type': 'Organization', name: p.outlet },
    ...(p.year ? { datePublished: String(p.year) } : {})
  }));
  const tags = d.profiles.map(p => `<link rel="me" href="${esc(p.url)}">`).join('')
    + `<script type="application/ld+json">${JSON.stringify(ld).replace(/</g, '\\u003c')}</script>`;
  return html.replace(/<\/head>/i, tags + '</head>');
}
