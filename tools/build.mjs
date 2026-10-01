import fs from 'node:fs';
import path from 'node:path';
import { loadPress, sectionHTML, applyHead } from './press-section.mjs';

const REPO = '/Users/kashish/Desktop/portfolio';
const FOOTER_SOCIAL = [['https://(?:www\\.)?linkedin\\.com/in/[^`]*', 'linkedin'], ['https://topmate\\.io/[^`]*', 'topmate']];
const PROFILE_URL = net => ((JSON.parse(fs.readFileSync(path.join(REPO, 'press.json'), 'utf8')).profiles || []).find(p => p.network === net) || {}).url || '';
const SITE = path.join(REPO, 'site');

// /kasy front-row projects (user's picks, 2026-09-30) — drives BOTH the "selected
// work" orbit and the "in detail" stacked cards. Images are homepage screenshots
// in site/work/. Leave year empty rather than guess.
const WORK = [
  { title: 'Marine Consultancy Group', tag: '3d · wix studio', kicker: 'naval architecture — wix studio', year: '',
    description: 'Shipbuilding made easy, for a naval architecture consultancy. A 3D cargo ship sails in on the hero, then turns and cuts through the scroll as each stage of a vessel’s life comes up — pre-build, build, post-build. Serious B2B that is still fun to scroll.',
    tags: 'Wix Studio, 3D, scroll storytelling, B2B', color: 'rgb(22, 78, 140)', image: '/work/marine.jpg', link: 'https://www.shipconsultant.org/' },
  { title: 'TUMU', tag: 'motion · wix studio', kicker: 'snack brand — wix studio', year: '',
    description: 'A Japanese cream puff with an Indian twist, sold in 19+ countries. Loud type, flying almonds, a spin-the-flavour carousel and touch-twist-zoom product moments — a snack site that behaves like a snack.',
    tags: 'Wix Studio, motion, 3D product, franchise', color: 'rgb(206, 43, 92)', image: '/work/tumu.jpg', link: 'https://digipod.wixstudio.com/tumu-version' },
  { title: 'qhwa', tag: 'shopify', kicker: 'shopify storefront', year: '2026',
    description: 'Scroll-scrubbed hero video for a Shopify theme. When Safari refused to seek cleanly, I rebuilt the whole effect as a canvas frame sequence — same cinema, none of the stutter.',
    tags: 'Shopify, Liquid, canvas, scroll scrubbing', color: 'rgb(107, 78, 255)', image: '/work/qhwa.jpg', link: 'https://qhwaco.com' },
  { title: 'Sosh Media', tag: 'wix studio · gsap', kicker: 'agency site — wix studio', year: '2026',
    description: 'A social-first creative agency site with a paper plane that flies you through the page. Gate screen, custom cursor, editorial collage in forest green, cream and pink — and a GSAP-driven plane that hops section to section before unfolding into a letter.',
    tags: 'GSAP, ScrollTrigger, Wix Studio, art direction', color: 'rgb(47, 93, 58)', image: '/work/sosh.jpg', link: 'https://digipod.wixstudio.com/soshmedia/home' },
  { title: 'HeyJobz', tag: 'b2b · recruitment', kicker: 'CA recruitment platform', year: '',
    description: 'A premium hiring site for chartered accountants, trusted by Big 7 firms. Clean corporate blue, floating candidate cards and a partner-first flow that reads more like a product than a job board.',
    tags: 'B2B, recruitment, UI design, lead gen', color: 'rgb(37, 99, 235)', image: '/work/heyjobz.jpg', link: 'https://www.heyjobz.com/' },
];
const tl = v => '`' + String(v).replace(/[`\\]/g, '').replace(/\$\{/g, '$ {') + '`';
const WORK_STACK = WORK.map((w, i) => `{color:${tl(w.color)},description:${tl(w.description)},id:${tl('kxWork' + i)},image:${tl(w.image)},kicker:${tl(w.kicker)},link:${tl(w.link)},tags:${tl(w.tags)},title:${tl(w.title)},year:${tl(w.year)}}`).join(',');
const WORK_ORBIT = WORK.map((w, i) => `{id:${tl('kxOrb' + i)},image:${tl(w.image)},link:${tl(w.link)},tag:${tl(w.tag)},title:${tl(w.title)}}`).join(',');
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36';

const fontsDir = path.join(SITE, 'fonts');
const fontFilesDir = path.join(fontsDir, 'files');
fs.mkdirSync(fontFilesDir, { recursive: true });

async function fetchText(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return await r.text();
}
async function fetchBuf(url) {
  const r = await fetch(url, { headers: { 'User-Agent': UA } });
  if (!r.ok) throw new Error(r.status + ' ' + url);
  return Buffer.from(await r.arrayBuffer());
}

// ---- 1. Localize Google Fonts ----
const cssUrls = [
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&display=swap',
  'https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=Instrument+Serif:ital@0;1&family=Bricolage+Grotesque:opsz,wght@12..96,200..800&family=JetBrains+Mono:wght@400;500&display=swap',
  'https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&display=swap',
];
// map original href (with &amp;) -> local css path
const fontMap = {};
let fontIdx = 0;
const downloadedFonts = new Map(); // gstatic url -> local rel

async function localizeCss(css) {
  const urls = [...css.matchAll(/url\((https:\/\/fonts\.gstatic\.com\/[^)]+)\)/g)].map(m => m[1]);
  for (const fu of urls) {
    let local = downloadedFonts.get(fu);
    if (!local) {
      const name = 'f' + downloadedFonts.size + path.extname(new URL(fu).pathname);
      const buf = await fetchBuf(fu);
      fs.writeFileSync(path.join(fontFilesDir, name), buf);
      local = '/fonts/files/' + name;
      downloadedFonts.set(fu, local);
    }
    css = css.split(fu).join(local);
  }
  return css;
}

// FONT SWAP (user preference): the site's components hard-code three families
// ("Instrument Serif", "Bricolage Grotesque", "JetBrains Mono") inline. Rather
// than editing every element, we load Fraunces + Inter and declare them UNDER
// those original family names, so every page and component picks them up.
//   Instrument Serif    -> Fraunces  (size-adjust: Instrument Serif is condensed)
//   Bricolage Grotesque -> Inter
//   JetBrains Mono      -> Inter
const SWAP_URL = 'https://fonts.googleapis.com/css2?family=Fraunces:ital,opsz,wght@0,9..144,300..800;1,9..144,300..800&family=Inter:ital,wght@0,300..800;1,300..800&display=swap';
const swapCss = await localizeCss(await fetchText(SWAP_URL));
const faces = swapCss.match(/@font-face\s*{[^}]*}/g) || [];
const fam = (b) => (b.match(/font-family:\s*'([^']+)'/) || [])[1];
const rename = (b, to) => b.replace(/font-family:\s*'[^']+'/, `font-family: '${to}'`);
const aliasCss =
  '/* Fraunces + Inter aliased under the original family names (see build.mjs) */\n' +
  faces.filter(b => fam(b) === 'Fraunces').map(b => rename(b, 'Instrument Serif').replace('}', '  size-adjust: 90%;\n}')).join('\n') + '\n' +
  faces.filter(b => fam(b) === 'Inter').map(b => rename(b, 'Bricolage Grotesque')).join('\n') + '\n' +
  faces.filter(b => fam(b) === 'Inter').map(b => rename(b, 'JetBrains Mono')).join('\n') + '\n';
console.log('font swap faces:', faces.length);

for (const url of cssUrls) {
  // every original font stylesheet now serves the aliased Fraunces/Inter faces
  const cssName = 'g' + (fontIdx++) + '.css';
  fs.writeFileSync(path.join(fontsDir, cssName), aliasCss);
  // key by the &amp; escaped original (as it appears in HTML) and the plain
  const ampVersion = url.replace(/&/g, '&amp;');
  fontMap[ampVersion] = '/fonts/' + cssName;
  fontMap[url] = '/fonts/' + cssName;
  console.log('font css', cssName, '(aliased Fraunces/Inter)');
}
console.log('total font files:', downloadedFonts.size);

// ---- 2. Rewrite HTML pages ----
function rewriteHtml(html) {
  // local module + asset hosts
  html = html.split('https://framerusercontent.com/').join('/framerusercontent.com/');
  html = html.split('https://app.framerstatic.com/').join('/app.framerstatic.com/');
  // fonts -> local css
  for (const [orig, local] of Object.entries(fontMap)) {
    html = html.split(orig).join(local);
  }
  // preconnect/preload to font hosts can stay (harmless) but remove analytics + editor
  // remove events.framer.com analytics script tag
  html = html.replace(/<script[^>]*events\.framer\.com[^>]*><\/script>/g, '');
  html = html.replace(/<script[^>]*events\.framer\.com[^>]*>/g, '');
  // neutralize the Framer editor injection (init.mjs modulepreload added by inline bootstrap on localhost)
  html = html.split("https://framer.com/edit/init.mjs").join("/noop.mjs");
  // strip any leftover framer.com/edit references
  html = html.split('https://framer.com/edit').join('data:text/javascript,');
  return html;
}

const pages = [
  { src: 'pm.html', dest: 'pm/index.html' },
  { src: 'kasy.html', dest: 'kasy/index.html' },
  { src: 'index.html', dest: 'index.html' },
];
// Injected at the very top of <head>, before Framer's modules run:
//  1. clear the intro/loader gate so the loader plays on EVERY reload
//  2. on phones, force the viewport to the real device width (Framer hard-codes
//     width=1200) and keep re-asserting it against Framer's own reset, so the
//     responsive rules in mobile-fix.css take effect
//  3. hide the "Made in Framer" badge
//  4. load the responsive overrides
const headInject =
  `<script>try{sessionStorage.removeItem('kasy-intro-v1');}catch(e){}` +
  // Force a full page load when navigating between /, /pm, /kasy (Framer routes
  // these client-side, which skips the intro loader). Full load re-runs the flag
  // clear above, so the loader replays on nav too — not just on refresh.
  `document.addEventListener('click',function(e){var a=e.target&&e.target.closest&&e.target.closest('a[href]');if(!a)return;var raw=a.getAttribute('href')||'';var p=raw.split('?')[0].split('#')[0];if(p==='/'||p==='/pm'||p==='/kasy'){e.preventDefault();e.stopImmediatePropagation();window.location.assign(raw);}},true);` +
  // Footer: swap the black background for a sky-toned gradient that blends with the
  // theme, flip the cream text to dark ink, and add a thin separator. Done in JS
  // because the footer is built from several stacked opaque dark fill layers with
  // no stable selectors; re-run a few times in case it hydrates late.
  `function fixFooter(){var f=document.querySelector('footer');if(!f)return;f.style.setProperty('background','transparent','important');f.style.setProperty('color','#14110f','important');f.style.setProperty('border-top','1px solid rgba(20,17,15,.22)','important');f.querySelectorAll('*').forEach(function(e){var b=getComputedStyle(e).backgroundColor;var m=/(\\d+), (\\d+), (\\d+)/.exec(b);if(m&&(+m[1]+ +m[2]+ +m[3])<120)e.style.setProperty('background','transparent','important');});f.querySelectorAll('[style*="246, 241, 231"]').forEach(function(e){e.style.setProperty('color','#14110f','important');});}` +
  `addEventListener('load',function(){fixFooter();setTimeout(fixFooter,800);setTimeout(fixFooter,2000);});` +
  // On phones, force the viewport to the real device width and keep re-asserting it.
  `(function(){if(typeof screen!=='undefined'&&screen.width>810)return;var C='width=device-width, initial-scale=1';` +
  `function set(){var m=document.querySelector('meta[name=viewport]');if(m&&m.getAttribute('content')!==C){m.setAttribute('content',C);}return m;}` +
  `function arm(){var m=set();if(m){try{new MutationObserver(set).observe(m,{attributes:true});}catch(e){}}}` +
  `if(document.readyState==='loading'){document.addEventListener('DOMContentLoaded',arm);}else{arm();}` +
  `addEventListener('load',function(){set();setTimeout(set,400);setTimeout(set,1200);setTimeout(set,3000);});})();</script>` +
  `<style>#__framer-badge-container{display:none!important}</style>` +
  `<link rel="stylesheet" href="/mobile-fix.css">` +
  `<script src="/vibe.js" defer></script>` +
  `<script src="/pm-hero.js" defer></script>` +
  `<script src="/pm-monitor.js" defer></script>` +
  `<script src="/desk.js" defer></script>` +
  `<script src="/cases.js" defer></script>` +
  `<script src="/kasy-head.js" defer></script>` +
  `<script src="/press.js" defer></script>`;
for (const p of pages) {
  let html = rewriteHtml(fs.readFileSync(path.join(REPO, '_raw', p.src), 'utf8'));
  html = html.replace(/<head[^>]*>/i, m => m + headInject);
  // press mentions + social profiles (/press.json): SEO head tags on every page,
  // and the crawlable "Elsewhere" section on /pm + /kasy (moved above the footer by /press.js)
  const PRESS = loadPress(path.join(REPO, 'press.json'));
  const pageKey = p.src.replace('.html', '');
  html = applyHead(html, PRESS, pageKey);
  html = html.split('Built in Framer. Designed at unreasonable hours.').join('Designed at unreasonable hours.');
  for (const [re, net] of FOOTER_SOCIAL) { const u = PROFILE_URL(net); if (u) html = html.replace(new RegExp('href="' + re.replace('[^`]*', '[^"]*') + '"', 'g'), 'href="' + u + '"'); }
  // same youtube link in the pre-rendered footer (identical markup to the topmate one, so hydration matches)
  { const yt = PROFILE_URL('youtube');
    if (yt) html = html.replace(/(<a href="[^"]*" target="_blank" rel="noreferrer" data-cursor=")topmate(" style="[^"]*">)topmate(<!-- --> ↗<\/a>)/g,
      (m, a1, a2, a3) => m + a1.replace(/href="[^"]*"/, 'href="' + yt + '"') + 'youtube' + a2 + 'youtube' + a3); }
  if (pageKey !== 'index') html = html.replace(/<\/body>/i, sectionHTML(PRESS) + '</body>');
  // "Rooms I've spoken in" photos: also bake them into the pre-rendered HTML (the
  // module patch alone only shows them once the page's JS re-renders the shot), using
  // exactly the markup the component renders so hydration matches.
  if (p.src === 'pm.html') {
    const SHOT_SSR = { '01': ['/awards/ms-build-stage.jpg', 'Microsoft Build'], '02': ['/awards/ms-ai-tour-chicago.jpg', 'Microsoft AI Tour'], '04': ['/awards/iit-madras-bootcamp.jpg', 'IIT Madras'], '05': ['/awards/google-summit.jpg', 'Google Summit'], '07': ['/awards/srm-university.jpg', 'SRM University'], '03': ['/awards/swift-bengaluru.jpg', 'Swift Bengaluru'], '06': ['/awards/ios-dev-summit.jpg', 'iOS Developer Summit'], '08': ['/awards/vit-bhopal-poster.jpg', 'VIT Bhopal'], '09': ['/awards/philippines-r15e.jpg', 'Philippines University'], '10': ['/awards/mlsa-student-summit.jpg', 'MLSA event'], '11': ['/awards/sophia-chief-guest.jpg', 'Sophia Girls School'], '12': ['/awards/sophia-career-counsellor.jpg', 'Sophia Girls School'] };
    for (const [n, [src, alt]] of Object.entries(SHOT_SSR)) {
      html = html.split(`<div style="position:absolute;inset:0;display:grid;place-items:center;font-family:'Instrument Serif', ui-serif, Georgia, serif;font-size:46px;line-height:1;color:rgba(20, 17, 15, 0.16)">${n}</div>`)
        .join(`<img src="${src}" alt="${alt}" draggable="false" style="width:100%;height:100%;object-fit:cover;display:block"/>`);
    }
  }
  const dest = path.join(SITE, p.dest);
  fs.mkdirSync(path.dirname(dest), { recursive: true });
  fs.writeFileSync(dest, html);
  console.log('page', p.dest, (html.length/1024|0)+'KB');
}

// ---- 3. Rewrite absolute asset URLs inside JS modules/JSON ----
function walk(dir) {
  for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
    const fp = path.join(dir, e.name);
    if (e.isDirectory()) walk(fp);
    else if (/\.(mjs|js|json|css)$/.test(e.name)) {
      let t = fs.readFileSync(fp, 'utf8');
      const before = t;
      t = t.split('https://framerusercontent.com/').join('/framerusercontent.com/');
      t = t.split('https://app.framerstatic.com/').join('/app.framerstatic.com/');
      // neutralize the Framer editor bar loader (only fires in edit/localhost context)
      t = t.split('https://framer.com/edit/init.mjs').join('/noop.mjs');
      // components inject their own Google Fonts <link>s at runtime — point them at
      // the local aliased (Fraunces/Inter) stylesheets too, or the old fonts load
      for (const [orig, local] of Object.entries(fontMap)) t = t.split(orig).join(local);
      // /kasy front-row projects from WORK (see top): "in detail" stack + orbit
      // screenshots are wide and every site's headline sits on the left — anchor the crop there
      t = t.split('g?l(`img`,{src:g,alt:``,style:{width:`100%`,height:`100%`,objectFit:`cover`,display:`block`}})').join('g?l(`img`,{src:g,alt:``,style:{width:`100%`,height:`100%`,objectFit:`cover`,objectPosition:`left center`,display:`block`}})');
      t = t.replace(/(label:`in detail`,layoutId:`Gp2_nEvdI`,paper:`rgb\(246, 241, 231\)`,projects:\[)[\s\S]*?(\],style:\{width:`100%`\},surface:`clear`,width:`100%`\}\))/, (m, a, b) => a + WORK_STACK + b);
      t = t.replace(/(heading:`Work that refuses to sit still\.`,height:`100%`,id:`gKDAGnXKA`,ink:`rgb\(20, 17, 15\)`,items:\[)[\s\S]*?(\],layoutId:`gKDAGnXKA`)/, (m, a, b) => a + WORK_ORBIT + b);
      // dotted-name hero (SkyShader `me`): (1) never overflow — shrink to the
      // container width when the fixed size is too wide (/kasy "KASY" at 200px
      // clipped on phones); (2) touch devices: it only ran for a mouse, so phones
      // got a dead image — a finger now scatters the dots, and an automatic sweep
      // keeps it alive between touches.
      if (t.includes('let l=d*u;if(n){o.font=')) {
        t = t.replace('let l=d*u;if(n){o.font=', 'let l=d*u,FIT=n;{o.font=')
             .replace('l=Math.max(40,(w-i*2)*u)/t*100}let _=l*f,v=W.length*_;k=Math.ceil(v/u)+16,c(()=>A(n?k:T)),n||(k=T),',
                      'let FL=Math.max(40,(w-i*2)*u)/t*100;n?l=FL:FL<l&&(l=FL,FIT=!0)}let _=l*f,v=W.length*_;k=Math.ceil(v/u)+16,c(()=>A(FIT?k:T)),FIT||(k=T),')
             .replace('K=()=>{ee&&(re(),ne(),H&&(V=requestAnimationFrame(K)))}',
                      'AUTO=!1,TOUCH=0,K=()=>{if(AUTO&&!TOUCH){let t=performance.now();z=w*(.5+.46*Math.sin(t*9e-4)),B=k*(.5+.4*Math.sin(t*1.7e-3))}ee&&(re(),ne(),H&&(V=requestAnimationFrame(K)))}')
             .replace('q=()=>{z=-99999,B=-99999};G(),ne(),!o&&l&&(s.addEventListener(`mousemove`,ie,{passive:!0}),e.addEventListener(`mouseleave`,q),V=requestAnimationFrame(K));',
                      'q=()=>{z=-99999,B=-99999},TS=e=>{let t=e.touches&&e.touches[0];t&&(TOUCH=1,ie(t))},TE=()=>{TOUCH=0,q()};G(),ne(),!o&&(l?(s.addEventListener(`mousemove`,ie,{passive:!0}),e.addEventListener(`mouseleave`,q)):(AUTO=!0,v=Math.min(v,Math.max(60,w*.2)),e.addEventListener(`touchstart`,TS,{passive:!0}),e.addEventListener(`touchmove`,TS,{passive:!0}),e.addEventListener(`touchend`,TE)),V=requestAnimationFrame(K));')
             .replace('H&&!o&&l&&(V=requestAnimationFrame(K))},{rootMargin:`120px`})', 'H&&!o&&(l||AUTO)&&(V=requestAnimationFrame(K))},{rootMargin:`120px`})')
             .replace('s.removeEventListener(`mousemove`,ie),s.removeEventListener(`resize`,ae),e.removeEventListener(`mouseleave`,q),',
                      's.removeEventListener(`mousemove`,ie),s.removeEventListener(`resize`,ae),e.removeEventListener(`mouseleave`,q),e.removeEventListener(`touchstart`,TS),e.removeEventListener(`touchmove`,TS),e.removeEventListener(`touchend`,TE),');
      }
      // safety net for the dotted name that doesn't trust measureText: after the
      // text is rasterised, if ink touches the canvas's right edge (i.e. it was cut
      // off) shrink the type 14% and redraw, up to 5 times; reset on width change
      if (t.includes('AUTO&&!TOUCH') && !t.includes('G.shrink')) {
        t = t.replace('let S=o.getImageData(0,0,a.width,a.height).data,C=',
                      'let S=o.getImageData(0,0,a.width,a.height).data;if((()=>{let W2=a.width,H2=a.height;for(let y=0;y<H2;y+=2)if(S[(y*W2+W2-2)*4+3]>60)return!0;return!1})()&&(G.n=(G.n||0)+1)<6){G.shrink=(G.shrink||1)*.86;return G()}G.n=0;let C=')
             .replace('n?l=FL:FL<l&&(l=FL,FIT=!0)}', 'n?l=FL:FL<l&&(l=FL,FIT=!0);(G.shrink||1)<1&&(l*=G.shrink,FIT=!0)}')
             .replace('t!==X&&(X=t,G(),ne())', 't!==X&&(X=t,G.shrink=1,G(),ne())');
      }
      // real iPhones: the page first lays out at Framer's 1200px viewport and is then
      // switched to device width, which fires no window resize in iOS Safari — so the
      // dotted name also re-measures whenever its own container changes width
      if (t.includes('s.addEventListener(`resize`,ae);let J') || (t.includes('AUTO&&!TOUCH') && !t.includes('RO&&RO.observe(e)'))) {
        t = t.replace('s.addEventListener(`resize`,ae);', 's.addEventListener(`resize`,ae);let RO=typeof ResizeObserver<`u`?new ResizeObserver(ae):null;RO&&RO.observe(e);')
             .replace('s.removeEventListener(`resize`,ae),', 's.removeEventListener(`resize`,ae),RO&&RO.disconnect(),');
      }
      // footer note: user asked to keep only "Designed at unreasonable hours."
      t = t.split('Built in Framer. Designed at unreasonable hours.').join('Designed at unreasonable hours.');
      // footer social links (linkedin / topmate) from press.json — the Framer
      // footer shipped with bare placeholders (linkedin.com/in/, topmate.io/)
      for (const [re, net] of FOOTER_SOCIAL) { const u = PROFILE_URL(net); if (u) t = t.replace(new RegExp('url:`' + re + '`', 'g'), 'url:`' + u + '`'); }
      // footer: add a youtube link after topmate (id'd so Framer's list keys stay unique)
      { const yt = PROFILE_URL('youtube');
        if (yt) { t = t.replace(/,\{id:`kxYouTube`,label:`youtube`,url:`[^`]*`\}/g, '');
          t = t.replace(/(label:`topmate`,url:`[^`]*`\})/g, '$1,{id:`kxYouTube`,label:`youtube`,url:`' + yt + '`}'); } }
      // page <title>/description: Framer's runtime resets document.title to the
      // shared default ("My Framer Site") after load — make it per-page from
      // press.json. Matches the original body or a previously patched one.
      t = t.replace(/return\{description:`Made with Framer`,robots:`max-image-preview:large`,title:`My Framer Site`\}|\/\*kxmeta\*\/.*?\/\*\/kxmeta\*\//, () => {
        const P = JSON.parse(fs.readFileSync(path.join(REPO, 'press.json'), 'utf8')).pages || {};
        const M = {}; for (const [k, v] of Object.entries(P)) M[k === 'index' ? '/' : '/' + k] = { t: v.title, d: v.description };
        return `/*kxmeta*/var M=${JSON.stringify(M).replace(/`/g, '')},k=(typeof location<"u"?location.pathname:"/").replace(/\\/$/,"")||"/",m=M[k]||M["/"]||{};return{description:m.d||\`Made with Framer\`,robots:\`max-image-preview:large\`,title:m.t||\`My Framer Site\`}/*/kxmeta*/`;
      });
      // /pm "I explain the work" Phone Carousel: attach the user's reels (files in
      // site/reels/, transcoded to H.264 720p) to the page instance's 5 slots.
      // Idempotent: once patched, the `{id:`X`,platform:` pattern no longer matches.
      const REEL_SLOTS = ['Islgnczcq', 'kOSNZL7if', 'aFKTvP5HQ', 'ybmfiCDx2', 'zOufsZqZO'];
      REEL_SLOTS.forEach((id, i) => {
        t = t.split('{id:`' + id + '`,platform:').join(
          '{id:`' + id + '`,video:`/reels/reel-' + (i + 1) + '.mp4`,poster:`/reels/reel-' + (i + 1) + '.jpg`,platform:');
      });
      // Loading screen ("Loader" component, /pm + /kasy instances): light-blue
      // background instead of near-black, and dark ink so the text stays legible.
      t = t.replace(
        /background:`rgb\(20, 17, 15\)`,dieCut:(\d+),duration:(\d+),enabled:!0,faces:\[\],height:`100%`,id:`(\w+)`,ink:`rgb\(246, 241, 231\)`/g,
        'background:`rgb(200, 226, 246)`,dieCut:$1,duration:$2,enabled:!0,faces:[],height:`100%`,id:`$3`,ink:`rgb(20, 17, 15)`');
      // /pm "Recognition" (Awards component): photos on the MVP + Times Square
      // cards (site/awards/*.jpg), drop the Linux Foundation Scholarship entry, and
      // teach the card renderer (Le) to show an award photo before the seal.
      t = t.split('id:`O3Nh9Kc2o`,issuer:').join('id:`O3Nh9Kc2o`,image:`/awards/mvp.jpg`,issuer:');
      t = t.split('id:`VUAgjmGxr`,issuer:').join('id:`VUAgjmGxr`,image:`/awards/billboard.jpg`,issuer:');
      t = t.replace(/,\{detail:`[^`]*`,id:`YExfDyXb4`[^}]*\}/, '');
      if (!t.includes('kasyAwardImg')) {
        t = t.split('l(`div`,{style:{flex:`0 0 auto`,width:`clamp(96px, 11vw, 138px)`').join(
          'e.image?l(`img`,{className:`kasyAwardImg`,src:e.image,alt:e.title,loading:`lazy`,style:{flex:`0 0 auto`,'
          + 'width:`clamp(220px, 26vw, 360px)`,aspectRatio:`3 / 4`,height:`auto`,objectFit:`cover`,objectPosition:e.imagePos||`50% 50%`,borderRadius:18,'
          + 'border:`1px solid rgba(20,17,15,0.12)`,boxShadow:`0 18px 40px rgba(20,17,15,0.18)`,display:`block`}}):null,'
          + 'l(`div`,{style:{flex:`0 0 auto`,width:`clamp(96px, 11vw, 138px)`');
      }
      // same size for both photos: one 3:4 frame (migrates an earlier patch), and
      // crop the wide billboard shot onto the Kashish billboard (right of centre)
      t = t.split('width:`clamp(200px, 24vw, 340px)`,height:`auto`,maxHeight:420,objectFit:`cover`,').join(
        'width:`clamp(220px, 26vw, 360px)`,aspectRatio:`3 / 4`,height:`auto`,objectFit:`cover`,objectPosition:e.imagePos||`50% 50%`,');
      t = t.split('image:`/awards/billboard.jpg`,issuer:').join('image:`/awards/billboard.jpg`,imagePos:`58% 46%`,issuer:');
      t = t.split('title:`Times Square Billboard`,year:').join('title:`New York Times Square Billboard`,year:');
      // Google Summer of Code card (both completion certificates, MIT App Inventor
      // 2023 + 2025), placed right after Microsoft MVP.
      if (!t.includes('kasyGsoc')) {
        t = t.split('title:`Microsoft MVP`,year:`2024 · 2025 · 2026`}').join(
          'title:`Microsoft MVP`,year:`2024 · 2025 · 2026`},'
          + '{detail:`Selected twice to contribute to MIT App Inventor, the visual app builder used by millions of learners. Each summer: scope the work with MIT’s maintainers, build it in the open, ship it on a fixed timeline.`,'
          + 'id:`kasyGsoc`,image:`/awards/gsoc.jpg`,issuer:`Google — contributor to MIT App Inventor, twice`,seal:`2×`,title:`Google Summer of Code`,year:`2023 · 2025`}');
      }
      // /pm "Where I judge": Imagine Cup 2026 judge badge (site/awards/imagine-cup-judge.png)
      // pinned like a sticker on the Microsoft Imagine Cup card; text gets room so it
      // never runs under the badge.
      t = t.split('id:`lVMjcJe64`,note:').join('id:`lVMjcJe64`,badge:`/awards/imagine-cup-judge.png`,note:');
      if (!t.includes('kasyJudgeBadge')) {
        t = t.split('minHeight:250,overflow:`hidden`},children:[').join(
          'minHeight:250,overflow:`hidden`},children:[e.badge?l(`img`,{className:`kasyJudgeBadge`,src:e.badge,alt:`${e.event} judge badge`,'
          + 'style:{position:`absolute`,right:14,top:`50%`,width:`clamp(92px, 30%, 124px)`,height:`auto`,'
          + 'transform:`translateY(-38%) rotate(8deg)`,filter:`drop-shadow(0 8px 14px rgba(20,17,15,0.22))`,pointerEvents:`none`,zIndex:2}}):null,');
        t = t.split('margin:`22px 0 0`,fontFamily:ft,').join(
          'margin:`22px 0 0`,paddingRight:e.badge?`clamp(96px, 33%, 134px)`:0,fontFamily:ft,');
        t = t.split('e.org?l(`div`,{style:{marginTop:8,fontSize:14,color:X(a,.6)}').join(
          'e.org?l(`div`,{style:{marginTop:8,paddingRight:e.badge?`clamp(96px, 33%, 134px)`:0,fontSize:14,color:X(a,.6)}');
      }
      // Imagine Cup Junior 2023 judge certificate (site/awards/imagine-cup-junior-2023.jpg):
      // a small tilted "print" on that card; click opens the full certificate.
      t = t.split('id:`KRAbiz9HV`,note:').join('id:`KRAbiz9HV`,cert:`/awards/imagine-cup-junior-2023.jpg`,note:');
      if (!t.includes('kasyJudgeCert')) {
        t = t.split('pointerEvents:`none`,zIndex:2}}):null,').join(
          'pointerEvents:`none`,zIndex:2}}):null,'
          + 'e.cert?l(`a`,{className:`kasyJudgeCert`,href:e.cert,target:`_blank`,rel:`noopener`,"aria-label":`${e.event} judge certificate`,"data-cursor":`view certificate`,'
          + 'style:{position:`absolute`,right:14,top:`50%`,width:`clamp(120px, 40%, 168px)`,transform:`translateY(-34%) rotate(-6deg)`,zIndex:2,'
          + 'background:`#fff`,padding:5,borderRadius:6,boxShadow:`0 10px 22px rgba(20,17,15,0.24)`,display:`block`,lineHeight:0},'
          + 'children:l(`img`,{src:e.cert,alt:`${e.event} judge certificate`,loading:`lazy`,style:{width:`100%`,height:`auto`,borderRadius:3,display:`block`}})}):null,');
        t = t.split('paddingRight:e.badge?`clamp(96px, 33%, 134px)`:0').join(
          'paddingRight:e.cert?`clamp(126px, 42%, 176px)`:e.badge?`clamp(96px, 33%, 134px)`:0');
      }
      // /pm "Rooms I've spoken in": stage photo on the Microsoft Build shot
      // (site/awards/ms-build-stage.jpg, pre-cropped to the shot's 4:5 frame)
      t = t.split('{id:`JDn5GA4TW`,place:').join('{id:`JDn5GA4TW`,image:`/awards/ms-build-stage.jpg`,place:');
      t = t.split('{id:`KkCZEbP4j`,place:').join('{id:`KkCZEbP4j`,image:`/awards/ms-ai-tour-chicago.jpg`,place:');
      t = t.split('{id:`occgDTIZi`,place:').join('{id:`occgDTIZi`,image:`/awards/sophia-career-counsellor.jpg`,place:');
      t = t.split('{id:`YuTzwBdRy`,place:').join('{id:`YuTzwBdRy`,image:`/awards/google-summit.jpg`,place:');
      t = t.split('{id:`OLYMW1Gsu`,place:').join('{id:`OLYMW1Gsu`,image:`/awards/srm-university.jpg`,place:');
      t = t.split('{id:`ntykJMD18`,place:').join('{id:`ntykJMD18`,image:`/awards/vit-bhopal-poster.jpg`,place:');
      t = t.split('image:`/awards/vit-bhopal.jpg`').join('image:`/awards/vit-bhopal-poster.jpg`'); // migrate old photo
      t = t.split('{id:`A9zJmFL79`,place:').join('{id:`A9zJmFL79`,image:`/awards/swift-bengaluru.jpg`,place:');
      t = t.split('{id:`DcSCUozkm`,place:').join('{id:`DcSCUozkm`,image:`/awards/ios-dev-summit.jpg`,place:');
      t = t.split('{id:`Q5ROZ4YwS`,place:').join('{id:`Q5ROZ4YwS`,image:`/awards/sophia-chief-guest.jpg`,place:');
      t = t.split('{id:`wOhH48N9L`,place:').join('{id:`wOhH48N9L`,image:`/awards/iit-madras-bootcamp.jpg`,place:');
      t = t.split('{id:`BZ45v39E7`,place:').join('{id:`BZ45v39E7`,image:`/awards/philippines-r15e.jpg`,place:');
      t = t.split('{id:`la1eUKk1V`,place:').join('{id:`la1eUKk1V`,image:`/awards/mlsa-student-summit.jpg`,place:');
      // IIT Madras (DataHacks 2.0) letter — portrait, so a narrower print (certW)
      t = t.split('id:`ErYjUYnvQ`,note:').join('id:`ErYjUYnvQ`,cert:`/awards/iit-madras-datahacks.jpg`,certW:`clamp(92px, 29%, 122px)`,note:');
      t = t.split('width:`clamp(120px, 40%, 168px)`,transform:').join('width:e.certW||`clamp(120px, 40%, 168px)`,transform:');
      // 6th reel: append a new slot after the 5th (page instance array only — the
      // component's own defaultValue lists title before platform, so it won't match)
      if (!t.includes('kasyReel6')) {
        t = t.split('title:`Reading a retention curve`}]').join(
          'title:`Reading a retention curve`},{id:`kasyReel6`,video:`/reels/reel-6.mp4`,poster:`/reels/reel-6.jpg`,platform:`instagram`,title:`Reel`}]');
      }
      if (t !== before) { fs.writeFileSync(fp, t); }
    }
  }
}
walk(path.join(SITE, 'framerusercontent.com'));
console.log('rewrote module absolute URLs');

// ---- 4. Cache-bust patched modules ----
// Framer's module names look content-hashed, so Safari (iOS especially) treats
// them as immutable and reuses its saved copies without asking the server — our
// in-place patches never reached phones. Stamp every module name with a version
// derived from the patched contents (NAME.kXXXXXXXX.mjs) and rewrite every
// import / modulepreload to match: names change only when contents change.
{
  const crypto = await import('node:crypto');
  const MOD = path.join(SITE, 'framerusercontent.com/sites/5t97gnnUzJW1S59wPtseHJ');
  const esc = s => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const files = fs.readdirSync(MOD).filter(f => f.endsWith('.mjs'));
  const baseOf = f => f.replace(/(\.k[0-9a-f]{8})?\.mjs$/, '');
  const bases = files.map(baseOf);
  const anyName = b => new RegExp(esc(b) + '(?:\\.k[0-9a-f]{8})?\\.mjs', 'g');
  // version = hash of all module contents with the stamps normalised away
  const h = crypto.createHash('sha1');
  for (const f of [...files].sort()) {
    let t = fs.readFileSync(path.join(MOD, f), 'utf8');
    for (const b of bases) t = t.replace(anyName(b), b + '.mjs');
    h.update(baseOf(f) + '\0' + t);
  }
  const ver = h.digest('hex').slice(0, 8);
  const newName = b => `${b}.k${ver}.mjs`;
  const rewrite = t => { for (const b of bases) t = t.replace(anyName(b), newName(b)); return t; };
  for (const f of files) {
    const src = path.join(MOD, f), dst = path.join(MOD, newName(baseOf(f)));
    const t = fs.readFileSync(src, 'utf8'), out = rewrite(t);
    fs.writeFileSync(dst, out);
    if (src !== dst) fs.unlinkSync(src);
  }
  for (const f of fs.readdirSync(MOD).filter(f => f.endsWith('.json'))) {
    const fp = path.join(MOD, f), t = fs.readFileSync(fp, 'utf8'), out = rewrite(t);
    if (out !== t) fs.writeFileSync(fp, out);
  }
  for (const p of pages) {
    const fp = path.join(SITE, p.dest), t = fs.readFileSync(fp, 'utf8'), out = rewrite(t);
    if (out !== t) fs.writeFileSync(fp, out);
  }
  console.log('module version', ver);
}
console.log('BUILD DONE');
