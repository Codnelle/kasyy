/* /pm "Product work, with the numbers attached" — re-imagined as CASE FILES.
   Manila folders with tabs (one per case study); the open folder holds a
   paper-clipped sheet (problem / what I did / what shipped) and a yellow sticky
   note with the numbers — matching the hero's sticky note + paperclip.

   Content is the page's own case-study data (the Framer instance's `cases`
   prop). The big figures on the sticky note are lifted verbatim from each
   case's metric line. The original accordion is hidden by a stylesheet rule and
   this section is inserted in its place (inside the same container, so the
   page's section ordering is unchanged); a persistent observer re-inserts it if
   Framer hydration strips it. */
(function () {
  if (location.pathname.split('?')[0].replace(/\/$/, '') !== '/pm') return;

  var CASES = [
    { title: 'Eazeebox', client: 'B2B e-commerce', year: '2026 — now', color: '#6b4eff',
      oneLiner: "Own end-to-end lifecycle and growth across five micromarkets on India's B2B platform for electrical retailers.",
      problem: 'Growth was spread thin across five micromarkets with no shared view of which cohorts actually mattered — and almost nobody ordered in the app. Roughly 3% of the network used it; the rest still bought offline.',
      did: 'Segmented the base by cohort, built margin-aware discount ladders and ran full-funnel AARRR analytics. Migrated offline purchasers into in-app ordering with targeted lifecycle campaigns, and led a three-phase go-to-market launch for a new product line across product design, marketing, sales and customer success.',
      shipped: "An analytics dashboard centralising KPI reporting across every market, and an automated end-to-end communication pipeline — AI cohort segmentation, triggered lifecycle campaigns, KPI reporting — replacing manual ops with always-on engagement. Plus the RRDC-2 rewards ladder and the operator's playbook the team runs on.",
      stats: [['+83%', 'Monthly GMV'], ['+50%', 'MTU'], ['3% → 40%', 'In-app ordering'], ['+40%', 'New line adoption']] },
    { title: 'Hytribe AI', client: 'AI wellness · SF remote', year: '2025', color: '#ff5c39',
      oneLiner: 'Owned the roadmap for AI-driven matching and recommendations, remote into San Francisco.',
      problem: 'Matching quality and onboarding were both leaking users before they ever reached the value. First-week retention was the bottleneck, not acquisition.',
      did: 'Prioritised the roadmap through A/B tests and funnel analysis, backed the matching and recommendation systems with scalable APIs, and redesigned the onboarding flow end to end.',
      shipped: 'A rebuilt onboarding funnel, and core feature delivery driven from concept to launch against shifting digital-wellness trends.',
      stats: [['~15%', 'Onboarding drop-off cut, lifting first-week retention']] },
    { title: 'Digipod AI', client: 'AI-native SaaS', year: '2023 — 24', color: '#2f5d3a',
      oneLiner: 'Product at an AI-native SaaS for agencies — roadmap, launch, and the integration layer underneath it.',
      problem: 'A new AI product with no users, no proof anyone wanted it, and an integration surface nobody had scoped.',
      did: 'Translated customer and market feedback into a shipped roadmap, and owned technical integration design end to end — APIs, auth, data flows — checking technical feasibility against the business goals rather than after them.',
      shipped: 'AI-powered integrations and workflow automation, plus the launch that filled the waitlist and converted the first customers.',
      stats: [['50+', 'Waitlist signups in 8 days'], ['3', 'Agency customers onboarded']] }
  ];

  var SANS = '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';
  var MONO = '"JetBrains Mono", ui-monospace, monospace';
  var SERIF = '"Instrument Serif", ui-serif, Georgia, serif';

  var css = document.createElement('style');
  css.textContent = ''
    + '.kcf-host > section:not(.kcf){display:none!important}'
    + '.kcf{position:relative;width:100%;padding:clamp(60px,10vh,120px) 4vw;box-sizing:border-box;color:#14110f;font-family:' + SANS + '}'
    + '.kcf-eyebrow{font-family:' + MONO + ';font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(20,17,15,.55);margin-bottom:14px}'
    + '.kcf-title{margin:0 0 clamp(34px,5vh,56px);font-weight:700;font-size:clamp(34px,5.4vw,74px);letter-spacing:-.035em;line-height:1.02;max-width:900px}'
    /* the pile: each case is a folder that sticks as you scroll, so the next one
       slides up and lands on top of it. Tabs are staggered left-to-right like real
       file folders, so the tabs underneath keep peeking out and show progress. */
    + '.kcf-stack{position:relative}'
    + '.kcf-card{position:relative;margin-bottom:clamp(28px,5vh,56px)}'
    + '.kcf-card:last-child{margin-bottom:0}'
    + '.kcf-tab{display:inline-flex;align-items:center;gap:9px;font:600 13px/1 ' + SANS + ';color:#14110f;background:#efdcaa;'
    + 'padding:12px 18px 14px;border-radius:12px 12px 0 0;margin-left:calc(22px + var(--i) * 178px);'
    + 'box-shadow:inset 0 3px 0 var(--c),0 -6px 14px rgba(60,45,15,.08)}'
    + '.kcf-tab i{font:500 10.5px/1 ' + MONO + ';font-style:normal;letter-spacing:.1em;opacity:.65}'
    + '@media (min-width:901px) and (min-height:760px){'
    + '.kcf-card{position:sticky;top:calc(96px + var(--i) * 20px)}'
    + '.kcf-card .kcf-folder{box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 -10px 30px rgba(20,30,50,.10),0 30px 60px rgba(20,30,50,.18)}'
    + '}'
    /* each file drops in as it enters */
    + '.kcf-card{opacity:0;transform:translateY(40px) rotate(.6deg);transition:opacity .6s ease,transform .7s cubic-bezier(.22,1,.36,1)}'
    + '.kcf-card.in{opacity:1;transform:none}'
    /* once the next file lands on top, this one's contents tuck away so only the
       manila edge + its tab peek out of the pile */
    + '.kcf-card .kcf-paper,.kcf-card .kcf-sticky{transition:opacity .3s ease}'
    + '.kcf-card.covered .kcf-paper,.kcf-card.covered .kcf-sticky{opacity:0}'
    /* folder */
    + '.kcf-folder{position:relative;background:#efdcaa;border-radius:4px 18px 18px 18px;padding:clamp(22px,3vw,40px);'
    + 'box-shadow:0 1px 0 rgba(255,255,255,.55) inset,0 30px 60px rgba(20,30,50,.18),0 6px 16px rgba(20,30,50,.10);'
    + 'display:grid;grid-template-columns:minmax(0,1fr) minmax(220px,300px);gap:clamp(20px,3vw,40px);align-items:start}'
    + '.kcf-folder::before{content:"";position:absolute;inset:10px 10px auto auto;width:120px;height:6px;border-radius:3px;background:rgba(120,90,30,.12)}'
    /* paper */
    + '.kcf-paper{position:relative;background:#fbf8f2;border-radius:6px;padding:clamp(26px,3vw,40px) clamp(22px,3vw,40px) clamp(26px,3vw,40px) clamp(40px,4vw,58px);'
    + 'box-shadow:0 2px 0 #f1ece2,0 4px 0 #e9e2d4,0 18px 34px rgba(60,45,15,.16);transform:rotate(-.5deg);'
    + 'background-image:linear-gradient(90deg,transparent 0,transparent clamp(26px,2.6vw,38px),rgba(214,90,90,.28) clamp(26px,2.6vw,38px),rgba(214,90,90,.28) calc(clamp(26px,2.6vw,38px) + 1px),transparent calc(clamp(26px,2.6vw,38px) + 1px))}'
    + '.kcf-clip{position:absolute;top:-22px;left:clamp(14px,1.6vw,26px);width:26px;height:70px;z-index:3;filter:drop-shadow(0 3px 3px rgba(0,0,0,.18))}'
    + '.kcf-meta{font-family:' + MONO + ';font-size:10.5px;letter-spacing:.16em;text-transform:uppercase;color:rgba(20,17,15,.5);display:flex;flex-wrap:wrap;gap:6px 14px}'
    + '.kcf-meta b{color:var(--c);font-weight:600}'
    + '.kcf-case{margin:12px 0 10px;font-family:' + SERIF + ';font-weight:400;font-size:clamp(34px,4.4vw,58px);letter-spacing:-.02em;line-height:1}'
    + '.kcf-one{margin:0 0 26px;font-size:16px;line-height:1.6;color:rgba(20,17,15,.72);max-width:640px}'
    + '.kcf-blocks{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:22px;border-top:1px dashed rgba(20,17,15,.18);padding-top:22px}'
    + '.kcf-blocks h4{margin:0 0 9px;font-family:' + MONO + ';font-size:10px;letter-spacing:.16em;text-transform:uppercase;color:var(--c);font-weight:600}'
    + '.kcf-blocks p{margin:0;font-size:14.5px;line-height:1.62;color:rgba(20,17,15,.78)}'
    + '.kcf-stamp{position:absolute;right:clamp(18px,3vw,34px);top:clamp(20px,3vw,34px);font:800 12px/1 ' + MONO + ';letter-spacing:.22em;'
    + 'color:#c8372d;border:2px solid #c8372d;border-radius:6px;padding:8px 11px 7px;transform:rotate(-9deg);opacity:.78;mix-blend-mode:multiply}'
    /* sticky note */
    + '.kcf-sticky{position:relative;background:#fbe38a;border-radius:3px;padding:30px 24px 26px;transform:rotate(2.4deg);margin-top:18px;'
    + 'box-shadow:0 1px 0 rgba(255,255,255,.5) inset,8px 14px 0 -4px rgba(60,45,15,.06),0 20px 36px rgba(60,45,15,.20)}'
    + '.kcf-sticky::after{content:"";position:absolute;right:0;bottom:0;width:34px;height:34px;background:linear-gradient(135deg,#f3d466 50%,rgba(0,0,0,.06) 50%);border-radius:0 0 3px 0}'
    + '.kcf-tape{position:absolute;top:-13px;left:50%;width:86px;height:26px;transform:translateX(-50%) rotate(-3deg);background:rgba(246,179,208,.85);'
    + 'display:flex;align-items:center;justify-content:center;color:#d63384;font-size:14px;box-shadow:0 2px 6px rgba(0,0,0,.10)}'
    + '.kcf-sticky h4{margin:0 0 16px;font-family:' + MONO + ';font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(64,50,20,.65)}'
    + '.kcf-stat{padding:12px 0;border-top:1px solid rgba(90,70,20,.14)}'
    + '.kcf-stat:first-of-type{border-top:0;padding-top:0}'
    + '.kcf-stat b{display:block;font-weight:800;font-size:clamp(28px,3.2vw,40px);letter-spacing:-.03em;line-height:1;color:#14110f}'
    + '.kcf-stat span{display:block;margin-top:6px;font-size:13px;line-height:1.4;color:rgba(40,30,10,.72)}'
    + '@media (prefers-reduced-motion:reduce){.kcf-card{transition:none!important;opacity:1!important;transform:none!important}}'
    /* tablet / phone: no stacking (tall folders), files simply follow each other */
    + '@media (max-width:900px){.kcf-folder{grid-template-columns:1fr}.kcf-sticky{max-width:360px;margin:6px auto 0}.kcf-tab{margin-left:18px}}'
    + '@media (max-width:700px){'
    + '.kcf-tab{padding:11px 14px 13px;font-size:12.5px}'
    + '.kcf-blocks{grid-template-columns:1fr;gap:18px}'
    + '.kcf-stamp{position:static;display:inline-block;margin-top:18px}'
    + '.kcf-paper{transform:none}'
    + '}';
  (document.head || document.documentElement).appendChild(css);

  function esc(s) { return String(s).replace(/[&<>"]/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]; }); }
  var CLIP = '<svg class="kcf-clip" viewBox="0 0 26 70" fill="none" stroke="#8a8f99" stroke-width="2.6" stroke-linecap="round">'
    + '<path d="M8 22 V56 a5 5 0 0 0 10 0 V12 a8 8 0 0 0 -16 0 V52"/></svg>';

  function panel(c, i) {
    var n = String(i + 1).padStart(2, '0');
    return '<div class="kcf-paper">' + CLIP
      + '<span class="kcf-stamp">SHIPPED</span>'
      + '<div class="kcf-meta"><b>case ' + n + '</b><span>' + esc(c.client) + '</span><span>' + esc(c.year) + '</span></div>'
      + '<h3 class="kcf-case">' + esc(c.title) + '</h3>'
      + '<p class="kcf-one">' + esc(c.oneLiner) + '</p>'
      + '<div class="kcf-blocks">'
      + '<div><h4>The problem</h4><p>' + esc(c.problem) + '</p></div>'
      + '<div><h4>What I did</h4><p>' + esc(c.did) + '</p></div>'
      + '<div><h4>What shipped</h4><p>' + esc(c.shipped) + '</p></div>'
      + '</div></div>'
      + '<aside class="kcf-sticky" aria-label="The numbers"><span class="kcf-tape">♥</span><h4>The numbers</h4>'
      + c.stats.map(function (s) { return '<div class="kcf-stat"><b>' + esc(s[0]) + '</b><span>' + esc(s[1]) + '</span></div>'; }).join('')
      + '</aside>';
  }

  function build() {
    if (document.querySelector('.kcf')) return true;
    var h = [].slice.call(document.querySelectorAll('h2')).filter(function (x) { return /product work, with the numbers attached/i.test(x.textContent || ''); })[0];
    var orig = h && h.closest('section');
    var host = orig && orig.parentElement;
    if (!host) return false;
    host.classList.add('kcf-host');

    var sec = document.createElement('section');
    sec.className = 'kcf';
    sec.setAttribute('data-cursor', 'case files');
    sec.innerHTML = '<div class="kcf-eyebrow">case studies</div>'
      + '<h2 class="kcf-title">Product work, with the numbers attached</h2>'
      + '<div class="kcf-stack">'
      + CASES.map(function (c, i) {
          return '<article class="kcf-card" style="--i:' + i + ';--c:' + c.color + '" aria-labelledby="kcf-case-' + i + '">'
            + '<div class="kcf-tab" aria-hidden="true"><i>' + String(i + 1).padStart(2, '0') + '</i>' + esc(c.title) + '</div>'
            + '<div class="kcf-folder">' + panel(c, i).replace('<h3 class="kcf-case">', '<h3 class="kcf-case" id="kcf-case-' + i + '">') + '</div>'
            + '</article>';
        }).join('')
      + '</div>';
    host.appendChild(sec);

    // drop each file in as it scrolls into view
    var cards = [].slice.call(sec.querySelectorAll('.kcf-card'));
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) {
        es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
      }, { threshold: 0.12 });
      cards.forEach(function (c) { io.observe(c); });
    } else cards.forEach(function (c) { c.classList.add('in'); });

    // mark a file "covered" once the next one has slid up over it (sticky mode only)
    var ticking = false;
    function cover() {
      ticking = false;
      var sticky = getComputedStyle(cards[0]).position === 'sticky';
      for (var i = 0; i < cards.length; i++) {
        var next = cards[i + 1];
        var on = sticky && next && next.getBoundingClientRect().top < cards[i].getBoundingClientRect().top + 90;
        cards[i].classList.toggle('covered', !!on);
      }
    }
    window.addEventListener('scroll', function () { if (!ticking) { ticking = true; requestAnimationFrame(cover); } }, { passive: true });
    window.addEventListener('resize', cover);
    cover();
    return true;
  }

  function boot() {
    build();
    new MutationObserver(function () { build(); }).observe(document.documentElement, { childList: true, subtree: true });
    var n = 0, iv = setInterval(function () { build(); if (++n > 120) clearInterval(iv); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
