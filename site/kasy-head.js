/* /kasy — "You can hire me for these." A scroll scene (after the Trevor Noah site's
   torn-open head):
   · on arrival, each of the six "hire me for" skills floats on its own smoky
     cloud, spread out across the upper section; Kasy's head only half-peeks up
     from the bottom edge, well clear of them;
   · as you scroll, the head rises into view and the skills leave their clouds
     (which dissipate like smoke) and settle on top of the torn-open head.

   Assets in /kasy-head/: head.png (photo subject-lifted on-device with Apple
   Vision; head only, torn top + paper strip + sticker border) and Apple-emoji
   skill objects. Inserted just before "Hire me for one of these"; a persistent
   observer re-inserts if Framer hydration strips it. */
(function () {
  if (location.pathname.split('?')[0].replace(/\/$/, '') !== '/kasy') return;

  // the page's own "Hire me for one of these" services
  var SKILLS = [
    { label: 'Scroll storytelling', img: 'scroll' },
    { label: 'Creative development', img: 'laptop' },
    { label: 'Storefronts & CMS', img: 'bags' },
    { label: 'Art direction', img: 'palette' },
    { label: 'Motion & film', img: 'clapper' },
    { label: 'Shipping fast', img: 'rocket' }
  ];
  // head.png geometry (1500x1005, head only — 4K upscale via Higgsfield, then
  // cut out on-device): tear ~4.9% from the top; objects rest across 24%–76%
  var HEAD = { tear: 0.049, open0: 0.24, open1: 0.76 };
  // resting spots on the head: x across the opening, centre height above the
  // tear (in item heights), tilt, stacking order (middle ones in front)
  var REST = [[0.02, 0.62, -22, 1], [0.21, 0.98, 10, 3], [0.41, 0.74, -8, 5], [0.60, 1.06, 14, 4], [0.80, 0.8, -12, 2], [0.99, 0.6, 20, 1]];
  // where each cloud floats (centre, as a fraction of the stage) — two staggered
  // rows on wide screens, a 2-column ladder on phones
  var SPOTS_WIDE = [[0.42, 0.25], [0.64, 0.19], [0.86, 0.26], [0.22, 0.52], [0.50, 0.47], [0.78, 0.53]];
  var SPOTS_NARROW = [[0.27, 0.47], [0.73, 0.43], [0.27, 0.59], [0.73, 0.55], [0.27, 0.71], [0.73, 0.67]];   // clear of the heading + hint

  var SERIF = '"Instrument Serif", ui-serif, Georgia, serif';
  var MONO = '"JetBrains Mono", ui-monospace, monospace';
  var SANS = '"Bricolage Grotesque", ui-sans-serif, system-ui, sans-serif';

  var css = document.createElement('style');
  css.textContent = ''
    + '.kh{position:relative;height:320vh;color:#14110f;font-family:' + SANS + '}'
    + '.kh-stage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden}'
    + '.kh-copy{position:absolute;left:4vw;top:clamp(84px,12vh,120px);z-index:8;max-width:420px}'
    + '.kh-eyebrow{font-family:' + MONO + ';font-size:10.5px;letter-spacing:.18em;text-transform:uppercase;color:rgba(20,17,15,.55);margin-bottom:10px}'
    + '.kh-title{margin:0;font-family:' + SERIF + ';font-weight:400;font-size:clamp(36px,5vw,72px);letter-spacing:-.02em;line-height:1}'
    + '.kh-hint{margin-top:14px;font-size:14px;color:rgba(20,17,15,.6);transition:opacity .4s ease}'
    /* smoky clouds: one per skill */
    + '.kh-cloud{position:absolute;left:0;top:0;width:clamp(170px,19vw,270px);aspect-ratio:300/170;z-index:2;pointer-events:none;will-change:transform,opacity}'
    + '.kh-cloud .kh-float{position:absolute;inset:0}'
    /* pre-rendered cloud: 420x290 frame around the 300x170 cloud (-60,-60 margin) */
    + '.kh-cloud img{position:absolute;left:-20%;top:-35.294%;width:140%;height:auto;max-width:none;display:block}'
    + '.kh-float{animation:khFloat var(--d) ease-in-out infinite;animation-delay:var(--dl)}'
    + '.kh-off .kh-float{animation-play-state:paused!important}'
    + '@keyframes khFloat{0%,100%{transform:translateY(0)}50%{transform:translateY(-10px)}}'
    /* skills */
    + '.kh-item{position:absolute;left:0;top:0;z-index:4;width:clamp(58px,6.4vw,92px);will-change:transform;pointer-events:none}'
    + '.kh-item img{display:block;width:100%;height:auto;filter:drop-shadow(0 12px 14px rgba(20,30,50,.22))}'
    + '.kh-label{position:absolute;left:50%;top:-16px;transform:translate(-50%,-100%);white-space:nowrap;'
    + 'background:#14110f;color:#fffdf8;font:700 clamp(14px,1.35vw,18px)/1 ' + SANS + ';letter-spacing:-.01em;padding:11px 16px;border-radius:999px;'
    + 'box-shadow:0 10px 24px rgba(20,30,50,.28),0 0 0 3px rgba(255,255,255,.85);transition:opacity .35s ease}'
    /* the head */
    + '.kh-head{position:absolute;left:50%;bottom:0;width:min(720px,58vw);z-index:6;pointer-events:none;will-change:transform;'
    + 'filter:drop-shadow(0 20px 40px rgba(20,30,50,.25))}'
    + '.kh-head img{display:block;width:100%;height:auto;user-select:none;-webkit-user-drag:none}'
    + '@media (max-width:700px){.kh{height:280vh}.kh-copy{top:84px}.kh-head{width:94vw}'
    + '.kh-cloud{width:40vw}.kh-item{width:50px}.kh-label{font-size:12.5px;padding:8px 11px;top:-12px}}'
    + '@media (prefers-reduced-motion:reduce){.kh-float{animation:none}}';
  (document.head || document.documentElement).appendChild(css);

  // smoky clouds are pre-rendered PNGs (cloud-0..5.png: puffs pushed around by
  // fractal noise, blurred, cool shaded underside — one noise seed each). They
  // used to be live SVG filters, which re-rasterised on every scroll frame (lag).
  function cloudImg(i) {
    return '<img src="/kasy-head/cloud-' + i + '.png" alt="" aria-hidden="true" decoding="async" draggable="false">';
  }

  function ease(t) { return t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2; }
  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }

  function build() {
    if (document.querySelector('.kh')) return true;
    var h = [].slice.call(document.querySelectorAll('h2')).filter(function (x) { return /hire me for one of these/i.test(x.textContent || ''); })[0];
    var anchor = h && h.closest('section');
    if (!anchor || !anchor.parentNode) return false;

    var sec = document.createElement('section');
    sec.className = 'kh';
    sec.setAttribute('aria-label', 'You can hire me for these');
    var html = '<div class="kh-stage">'
      + '<div class="kh-copy"><div class="kh-eyebrow">hire me for</div><h2 class="kh-title">You can hire<br>me for these.</h2>'
      + '<div class="kh-hint">keep scrolling — they’re moving in ↓</div></div>';
    SKILLS.forEach(function (s, i) {
      var d = (4.2 + (i % 3) * .7) + 's', dl = (-i * .9) + 's';
      html += '<div class="kh-cloud" data-i="' + i + '"><div class="kh-float" style="--d:' + d + ';--dl:' + dl + '">' + cloudImg(i) + '</div></div>'
        + '<div class="kh-item" data-i="' + i + '"><div class="kh-float" style="--d:' + d + ';--dl:' + dl + '">'
        + '<span class="kh-label">' + s.label + '</span><img src="/kasy-head/' + s.img + '.png" alt="' + s.label + '"></div></div>';
    });
    html += '<div class="kh-head"><img src="/kasy-head/head.png" alt="Kasy, with the top of her head torn open"></div></div>';
    sec.innerHTML = html;
    anchor.parentNode.insertBefore(sec, anchor);

    var stage = sec.querySelector('.kh-stage');
    var head = sec.querySelector('.kh-head');
    var hint = sec.querySelector('.kh-hint');
    var clouds = [].slice.call(sec.querySelectorAll('.kh-cloud'));
    var items = [].slice.call(sec.querySelectorAll('.kh-item'));
    var reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
    var labels = items.map(function (el) { return el.querySelector('.kh-label'); });
    var floats = items.map(function (el) { return el.querySelector('.kh-float'); });
    var cloudFloats = clouds.map(function (el) { return el.querySelector('.kh-float'); });
    var raf = 0, visible = true, cur = -1, target = 0;
    // geometry is measured once (and on resize / image load), never inside the
    // scroll frame — reading layout every frame was forcing reflows mid-scroll
    var G = null;

    function measure() {
      var W = stage.clientWidth, H = stage.clientHeight || innerHeight;
      G = {
        W: W, H: H, secTop: sec.getBoundingClientRect().top + scrollY, secH: sec.offsetHeight,
        hw: head.offsetWidth, hh: head.offsetHeight,
        cw: clouds.map(function (c) { return c.offsetWidth; }),
        ch: clouds.map(function (c) { return c.offsetHeight || c.offsetWidth * 0.57; }),
        s: items.map(function (el) { return el.offsetWidth; }),
        sh: items.map(function (el) { return el.offsetHeight || el.offsetWidth; })
      };
      target = progress();
      if (cur < 0) cur = target;
      kick();
    }
    function progress() {
      if (reduce) return 1;
      return clamp((scrollY - G.secTop) / Math.max(1, G.secH - G.H), 0, 1);
    }

    // one rAF loop, only while the scene is on screen; it eases the displayed
    // progress toward the scroll position so wheel/trackpad steps glide instead
    // of jumping, then stops once it has caught up
    function tick() {
      raf = 0;
      if (!G) return;
      var d = target - cur;
      cur = Math.abs(d) < 0.0005 ? target : cur + d * 0.18;
      render(cur);
      if (cur !== target && visible) raf = requestAnimationFrame(tick);
    }
    function kick() { if (!raf && visible) raf = requestAnimationFrame(tick); }
    function onScroll() { if (!G) return; target = progress(); kick(); }

    var lastState = [];
    function render(p) {
      var W = G.W, H = G.H;
      var narrow = W < 700, SP = narrow ? SPOTS_NARROW : SPOTS_WIDE;

      // head: half-peeking at first, rises fully into view
      var hw = G.hw, hh = G.hh;
      var rise = ease(clamp(p / 0.5, 0, 1));
      var headDrop = hh * 0.5 * (1 - rise);
      var hx = (W - hw) / 2, hyFinal = H - hh;                 // final (fully risen) head box
      var tearY = hyFinal + hh * HEAD.tear;
      var ox0 = hx + hw * HEAD.open0, ox1 = hx + hw * HEAD.open1;
      var bounce = 0;

      items.forEach(function (el, i) {
        var cl = clouds[i];
        var cw = G.cw[i], ch = G.ch[i];
        var s = G.s[i], sh = G.sh[i];
        var cx = SP[i][0] * W, cy = SP[i][1] * H;
        // cloud sits at its spot; skill sits on top of it
        var sx = cx - s / 2, sy = cy - ch * 0.18 - sh * 0.62;
        var t = clamp((p - (0.12 + i * 0.075)) / 0.4, 0, 1), e = ease(t);
        // rest: on top of the (final) head
        var R = REST[i];
        var ex = ox0 + (ox1 - ox0) * R[0] - s / 2;
        var ey = tearY - sh * R[1] - sh * 0.1;
        var x = sx + (ex - sx) * e;
        var y = sy + (ey - sy) * e - Math.sin(Math.PI * e) * 36;      // lift off the cloud
        // while the head is still rising, a landed skill rides down with it
        var ride = headDrop * e;
        var rot = R[2] * e + Math.sin(Math.PI * e) * (i % 2 ? 22 : -22);
        var sc = 1 + 0.28 * e;
        el.style.transform = 'translate3d(' + x.toFixed(1) + 'px,' + (y + ride).toFixed(1) + 'px,0) rotate(' + rot.toFixed(1) + 'deg) scale(' + sc.toFixed(3) + ')';
        // only touch z-index / label / animation state when they actually change
        var st = lastState[i] || (lastState[i] = {});
        var z = e > 0.5 ? 3 + R[3] / 10 : 4;
        if (st.z !== z) el.style.zIndex = st.z = z;
        // narrow screens: labels overlap mid-flight, so they fade as soon as the skill lifts off
        var lo = narrow ? (t > 0.08 ? 0 : 1) : (t > 0.8 ? (t > 0.94 ? 0 : 1) : 1);
        if (st.lo !== lo) labels[i].style.opacity = st.lo = lo;
        var run = t > 0 ? 'paused' : 'running';
        if (st.run !== run) floats[i].style.animationPlayState = cloudFloats[i].style.animationPlayState = st.run = run;
        // the emptied cloud dissipates like smoke
        cl.style.transform = 'translate3d(' + (cx - cw / 2).toFixed(1) + 'px,' + (cy - ch / 2 - 18 * e).toFixed(1) + 'px,0) scale(' + (1 + 0.25 * e).toFixed(3) + ')';
        cl.style.opacity = (1 - 0.85 * clamp((t - 0.25) / 0.6, 0, 1)).toFixed(3);
        if (t > 0.92 && t < 1) bounce += Math.sin(Math.PI * (t - 0.92) / 0.08) * 6;   // head catches it
      });
      head.style.transform = 'translate3d(' + hx.toFixed(1) + 'px,0,0) translateY(' + (headDrop + bounce).toFixed(1) + 'px)';
      var ho = p > 0.85 ? 0 : 1;
      if (lastState.h !== ho) hint.style.opacity = lastState.h = ho;
    }
    head.style.left = '0';

    window.addEventListener('scroll', onScroll, { passive: true });
    var rz = 0;
    window.addEventListener('resize', function () { clearTimeout(rz); rz = setTimeout(measure, 80); });
    if (window.ResizeObserver) { var ro = new ResizeObserver(function () { measure(); }); ro.observe(sec); ro.observe(document.body); }   // content above can shift the section
    [].forEach.call(sec.querySelectorAll('img'), function (im) {
      if (!im.complete) im.addEventListener('load', measure, { once: true });
      if (im.decode) im.decode().catch(function () {});   // decode up front, not on first scroll into view
    });
    if (window.IntersectionObserver) {
      new IntersectionObserver(function (en) {
        visible = en[0].isIntersecting;
        sec.classList.toggle('kh-off', !visible);   // pauses the bobbing off-screen
        if (visible) { onScroll(); }
      }, { rootMargin: '200px 0px' }).observe(sec);
    }
    measure();
    cur = target; render(cur);
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
