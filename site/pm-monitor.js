/* /pm — replace the "Where AI actually shows up in my work" monitor with an
   AgentFlow-style AI node diagram, in the same spot. Nothing else is touched.

   - Hide ONLY the monitor: it's the one section with an inline height:412vh.
     (Never hide by data-code-component-plugin-id="mcp001" — ~17 components share
     it, and hiding it blanks the page.)
   - Insert the node diagram as a sibling right after that section.
   - Persistent observer re-inserts if Framer hydration strips our node. */
(function () {
  if (location.pathname.split('?')[0].replace(/\/$/, '') !== '/pm') return;

  var W = 1000, H = 470; // design coordinate space
  // [key, x, y, title, subtitle, icon]
  var NODES = [
    ['user',     242, 235, 'Fuzzy goal', 'The messy ask',           'user'],
    ['llm',      414, 100, 'LLM',        'Scoped to real limits',   'chip'],
    ['agent',    414, 235, 'AI Agent',   'Reason & act',            'spark'],
    ['memory',   414, 370, 'Real data',  'Checked myself',          'layers'],
    ['mcp',      586, 235, 'My stack',   'REST APIs',               'nodes'],
    ['python',   758, 100, 'Python',     'Prototype the flow',      'code'],
    ['sql',      586, 370, 'SQL',        'Query the data',          'db'],
    ['dash',     758, 370, 'Dashboards', 'Mixpanel · Metabase','chart']
  ];
  var EDGES = [
    'M242,235 H414', 'M414,100 V235', 'M414,235 V370', 'M414,235 H586',
    'M586,235 V370', 'M586,235 H712 V100 H758', 'M586,235 H712 V370 H758'
  ];
  var IC = {
    user:   '<circle cx="12" cy="8" r="3.2"/><path d="M5.5 19a6.5 6.5 0 0 1 13 0"/>',
    chip:   '<rect x="7" y="7" width="10" height="10" rx="2"/><path d="M10 10h4v4h-4z"/><path d="M9 4v2M15 4v2M9 18v2M15 18v2M4 9h2M4 15h2M18 9h2M18 15h2"/>',
    spark:  '<path d="M12 3l1.8 4.9L19 9.7l-4.9 1.8L12 16l-1.8-4.5L5 9.7l5.2-1.8z"/>',
    layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4"/>',
    nodes:  '<circle cx="7" cy="9" r="2.4"/><circle cx="14" cy="7" r="2.4"/><circle cx="12" cy="15" r="2.4"/><path d="M9 9l3-1M9.5 11l2 3"/>',
    code:   '<path d="M9 8l-4 4 4 4M15 8l4 4-4 4"/>',
    db:     '<ellipse cx="12" cy="6" rx="6.5" ry="2.6"/><path d="M5.5 6v6c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6V6"/><path d="M5.5 12c0 1.4 2.9 2.6 6.5 2.6s6.5-1.2 6.5-2.6"/>',
    chart:  '<path d="M5 4v15h15"/><rect x="8" y="11" width="2.6" height="5"/><rect x="12.5" y="8" width="2.6" height="8"/><rect x="17" y="13" width="2.6" height="3"/>'
  };

  var css = document.createElement('style');
  css.textContent = ''
    + 'section[style*="412vh"]{display:none!important}'
    + '.agf{width:100vw;margin-left:calc(50% - 50vw);position:relative;color:#14110f;'
    + 'font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;padding:80px 0 70px;box-sizing:border-box}'
    + '.agf-inner{max-width:1080px;margin:0 auto;padding:0 20px;box-sizing:border-box}'
    + '.agf-eyebrow{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.2em;'
    + 'text-transform:uppercase;color:rgba(20,17,15,.62);text-align:center;margin-bottom:10px}'
    + '.agf-title{margin:0 0 36px;text-align:center;font-family:"Instrument Serif",ui-serif,Georgia,serif;'
    + 'font-weight:400;font-size:clamp(26px,3.6vw,50px);letter-spacing:-.02em;line-height:1.02}'
    + '.agf-scale{width:100%;overflow:hidden}'
    + '.agf-stage{position:relative;width:' + W + 'px;height:' + H + 'px;transform-origin:top left}'
    + '.agf-svg{position:absolute;inset:0;width:100%;height:100%;overflow:visible;pointer-events:none}'
    + '.agf-base{fill:none;stroke:rgba(20,17,15,.16);stroke-width:1.5}'
    + '.agf-flow{fill:none;stroke:#e8934a;stroke-width:1.8;stroke-linecap:round;stroke-dasharray:8 200;animation:agfFlow 3.2s linear infinite}'
    + '@keyframes agfFlow{to{stroke-dashoffset:-208}}'
    + '.agf-node{position:absolute;transform:translate(-50%,-50%);width:176px;box-sizing:border-box;display:flex;align-items:center;gap:11px;'
    + 'background:#fffdf8;border:1px solid rgba(20,17,15,.09);border-radius:16px;padding:13px 15px;'
    + 'box-shadow:0 14px 30px rgba(30,25,15,.12),0 2px 6px rgba(30,25,15,.06);opacity:0;transition:opacity .5s ease}'
    + '.agf-node.in{opacity:1}'
    + '.agf-ic{flex:0 0 auto;width:34px;height:34px;border-radius:10px;background:#f4efe4;display:flex;align-items:center;justify-content:center;color:#5b5648}'
    + '.agf-ic svg{width:19px;height:19px;fill:none;stroke:currentColor;stroke-width:1.7;stroke-linecap:round;stroke-linejoin:round}'
    + '.agf-tx{display:flex;flex-direction:column;line-height:1.15;min-width:0}'
    + '.agf-tx b{font-size:14px;font-weight:650;letter-spacing:-.01em}'
    + '.agf-tx i{font-size:12px;font-style:normal;color:rgba(20,17,15,.56);margin-top:2px}'
    + '.agf-dot{position:absolute;top:9px;right:10px;width:5px;height:5px;border-radius:50%;background:#e8934a;opacity:.6}'
    + '.agf-agent{background:linear-gradient(180deg,#fff6ec,#ffedd8);border-color:rgba(232,147,74,.45);box-shadow:0 16px 38px rgba(232,147,74,.22),0 3px 8px rgba(232,147,74,.14)}'
    + '.agf-agent .agf-ic{background:linear-gradient(160deg,#f8a94e,#ef7d2e);color:#fff;box-shadow:0 6px 14px rgba(232,125,46,.45)}'
    /* phones: the 1000px canvas scaled to ~40% was unreadable — stack the same
       flow vertically instead, full-size nodes on a dashed spine with a pulse */
    + '.agf-m{display:none;position:relative;padding:4px 0 0;max-width:380px;margin:0 auto}'
    + '.agf-m:before{content:"";position:absolute;left:50%;top:24px;bottom:30px;width:2px;margin-left:-1px;'
    + 'background:repeating-linear-gradient(to bottom,rgba(20,17,15,.2) 0 6px,transparent 6px 12px)}'
    + '.agf-pulse{position:absolute;left:50%;top:24px;width:10px;height:10px;margin-left:-5px;border-radius:50%;background:#e8934a;'
    + 'box-shadow:0 0 0 5px rgba(232,147,74,.2),0 0 18px rgba(232,147,74,.7);animation:agfDrop 3.4s cubic-bezier(.45,0,.55,1) infinite}'
    + '@keyframes agfDrop{0%{top:24px;opacity:0}8%{opacity:1}92%{opacity:1}100%{top:calc(100% - 34px);opacity:0}}'
    + '.agf-row{position:relative;z-index:1;display:flex;justify-content:center;gap:12px;margin:0 0 20px}'
    + '.agf-m .agf-node{position:relative;left:auto;top:auto;transform:translateY(10px);width:176px;transition:opacity .5s ease,transform .5s ease}'
    + '.agf-m .agf-node.in{transform:none}'
    + '.agf-row.two .agf-node{width:calc(50% - 6px)}'
    + '.agf-lbl{position:relative;z-index:1;display:table;margin:-6px auto 14px;padding:3px 10px;border-radius:999px;background:#fffdf8;'
    + 'font:500 10px/1.4 "JetBrains Mono",ui-monospace,monospace;letter-spacing:.14em;text-transform:uppercase;color:rgba(20,17,15,.55);box-shadow:0 2px 8px rgba(30,25,15,.08)}'
    + '@media (max-width:700px){.agf{padding:56px 0 36px}.agf-title{margin-bottom:26px}.agf-scale{display:none}.agf-m{display:block}}';
  (document.head || document.documentElement).appendChild(css);

  function pct(v, t) { return (v / t * 100) + '%'; }

  function build() {
    if (document.querySelector('.agf')) return true;
    var mon = document.querySelector('section[style*="412vh"]');
    if (!mon || !mon.parentNode) return false;

    var nodes = NODES.map(function (n) {
      return '<div class="agf-node' + (n[0] === 'agent' ? ' agf-agent' : '') + '" style="left:' + pct(n[1], W) + ';top:' + pct(n[2], H) + '">'
        + '<span class="agf-ic"><svg viewBox="0 0 24 24">' + IC[n[5]] + '</svg></span>'
        + '<span class="agf-tx"><b>' + n[3] + '</b><i>' + n[4] + '</i></span><span class="agf-dot"></span></div>';
    }).join('');
    var edges = EDGES.map(function (d) { return '<path class="agf-base" d="' + d + '"/><path class="agf-flow" d="' + d + '"/>'; }).join('');
    var byKey = {}; NODES.forEach(function (n) { byKey[n[0]] = n; });
    function mnode(k) {
      var n = byKey[k];
      return '<div class="agf-node' + (k === 'agent' ? ' agf-agent' : '') + '">'
        + '<span class="agf-ic"><svg viewBox="0 0 24 24">' + IC[n[5]] + '</svg></span>'
        + '<span class="agf-tx"><b>' + n[3] + '</b><i>' + n[4] + '</i></span><span class="agf-dot"></span></div>';
    }
    function row(keys) { return '<div class="agf-row' + (keys.length > 1 ? ' two' : '') + '">' + keys.map(mnode).join('') + '</div>'; }
    var mobile = '<div class="agf-m"><span class="agf-pulse" aria-hidden="true"></span>'
      + row(['user']) + row(['agent'])
      + '<span class="agf-lbl">grounded in</span>' + row(['llm', 'memory'])
      + row(['mcp'])
      + '<span class="agf-lbl">built with</span>' + row(['python', 'sql'])
      + row(['dash']) + '</div>';

    var sec = document.createElement('section');
    sec.className = 'agf';
    sec.innerHTML = '<div class="agf-inner">'
      + '<div class="agf-eyebrow">ai, specifically</div>'
      + '<h2 class="agf-title">Where AI actually shows up in my work</h2>'
      + '<div class="agf-scale"><div class="agf-stage">'
      + '<svg class="agf-svg" viewBox="0 0 ' + W + ' ' + H + '">' + edges + '</svg>' + nodes
      + '</div></div>' + mobile + '</div>';
    mon.parentNode.insertBefore(sec, mon.nextSibling);

    var wrap = sec.querySelector('.agf-scale'), stage = sec.querySelector('.agf-stage');
    function fit() {
      var a = wrap.clientWidth;
      if (!a) {                                        // never scale to 0
        if (getComputedStyle(wrap).display !== 'none') requestAnimationFrame(fit); // (hidden on phones: ResizeObserver refits later)
        return;
      }
      var s = Math.min(1, a / W);
      stage.style.transform = 'scale(' + s + ')';
      wrap.style.height = (H * s) + 'px';
    }
    fit();
    if ('ResizeObserver' in window) { try { new ResizeObserver(fit).observe(wrap); } catch (e) {} }
    window.addEventListener('resize', fit);

    var els = [].slice.call(sec.querySelectorAll('.agf-node'));
    function reveal() { els.forEach(function (el, i) { setTimeout(function () { el.classList.add('in'); }, i * 90); }); }
    if ('IntersectionObserver' in window) {
      var io = new IntersectionObserver(function (es) { if (es.some(function (e) { return e.isIntersecting; })) { reveal(); io.disconnect(); } }, { threshold: 0.15 });
      io.observe(sec);
    } else reveal();
    return true;
  }

  // Show "Where I'm actually useful" right BEFORE the AI section. The page
  // sections are children of one flex column, so we use CSS `order` (via a
  // stylesheet keyed on each section container's framer-*-container class)
  // instead of moving Framer-managed DOM nodes.
  var orderStyle = null;
  function reorder() {
    if (orderStyle) return true;
    var uh = [].slice.call(document.querySelectorAll('h2')).filter(function (h) { return /where i.?m actually useful/i.test(h.textContent || ''); })[0];
    var ai = document.querySelector('.agf') || document.querySelector('section[style*="412vh"]');
    if (!uh || !ai) return false;
    // climb both to their direct child of the shared flex-column parent
    var parent = null, u = uh, a;
    while (u && u.parentElement) {
      if (u.parentElement.contains(ai) && getComputedStyle(u.parentElement).display.indexOf('flex') !== -1) { parent = u.parentElement; break; }
      u = u.parentElement;
    }
    if (!parent) return false;
    a = ai; while (a && a.parentElement !== parent) a = a.parentElement;
    if (!a || a === u) return false;
    function key(el) { var m = (el.className || '').toString().match(/framer-[a-z0-9]+-container/); return m ? '.' + m[0] : null; }
    var kids = [].slice.call(parent.children), aiIdx = kids.indexOf(a), rules = [];
    for (var i = aiIdx; i < kids.length; i++) {
      if (kids[i] === u) continue;
      var k = key(kids[i]); if (k) rules.push(k + '{order:2}');
    }
    var uk = key(u); if (!uk) return false;
    rules.push(uk + '{order:1}');
    orderStyle = document.createElement('style');
    orderStyle.textContent = rules.join('');
    document.head.appendChild(orderStyle);
    return true;
  }

  // "I explain the work" reels section: add an Instagram link under the blurb.
  var IG = 'https://instagram.com/kasy.ssh';
  var igCss = document.createElement('style');
  igCss.textContent = ''
    + '.kx-ig{display:inline-flex;align-items:center;gap:9px;margin:-14px 0 34px;padding:10px 16px 10px 12px;'
    + 'border-radius:999px;background:rgba(246,241,231,.82);border:1px solid rgba(20,17,15,.14);color:#14110f;'
    + 'text-decoration:none;font:600 14px/1 "Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;'
    + 'box-shadow:0 6px 18px rgba(20,30,50,.12);transition:transform .2s ease,box-shadow .2s ease;position:relative;z-index:5}'
    + '.kx-ig:hover{transform:translateY(-2px);box-shadow:0 10px 24px rgba(20,30,50,.18)}'
    + '.kx-ig svg{width:18px;height:18px}.kx-ig i{font-style:normal;font-weight:500;opacity:.6}';
  document.head.appendChild(igCss);
  function igLink() {
    if (document.querySelector('.kx-ig')) return true;
    var h = [].slice.call(document.querySelectorAll('h2')).filter(function (x) { return /^i explain the work$/i.test((x.textContent || '').trim()); })[0];
    var p = h && h.nextElementSibling;
    if (!p || p.tagName !== 'P') return false;
    var a = document.createElement('a');
    a.className = 'kx-ig'; a.href = IG; a.target = '_blank'; a.rel = 'noopener';
    a.innerHTML = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8"><rect x="3" y="3" width="18" height="18" rx="5"/><circle cx="12" cy="12" r="4"/><circle cx="17.5" cy="6.5" r="1" fill="currentColor"/></svg>'
      + 'Watch on Instagram <i>@kasy.ssh ↗</i>';
    p.parentNode.insertBefore(a, p.nextSibling);
    return true;
  }

  // Stable hook for mobile CSS: the "Rooms I've spoken in" clothesline section
  // (mobile-fix.css turns it into a 2-column polaroid wall on phones).
  function tagRooms() {
    if (document.querySelector('.kx-rooms')) return;
    var h = [].slice.call(document.querySelectorAll('h2')).filter(function (x) { return /rooms i.?ve spoken in/i.test(x.textContent || ''); })[0];
    var s = h && h.closest('section');
    if (s) s.classList.add('kx-rooms');
  }

  function boot() {
    build(); reorder(); igLink(); tagRooms();
    new MutationObserver(function () { build(); reorder(); igLink(); tagRooms(); }).observe(document.documentElement, { childList: true, subtree: true });
    var n = 0, iv = setInterval(function () { build(); reorder(); igLink(); tagRooms(); if (++n > 120) clearInterval(iv); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
