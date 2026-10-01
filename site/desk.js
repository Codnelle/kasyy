/* "Arrange my desk" — a self-contained interactive section for /pm.
   Recreates the Framer community component (Arrange-desk) in plain JS so it runs
   on the static mirror with no React/framer-motion runtime and no lazy-mount
   surprises. Drag the objects, they wobble when idle, click one for a blurb.
   Assets (illustrations + grab/drop sounds) are hosted locally in /desk/. */
(function () {
  if (location.pathname.split('?')[0].replace(/\/$/, '') !== '/pm') return;

  // per-breakpoint layout for each object (from the original component), plus
  // personalized copy in Kashish's voice.
  var SLOTS = {
    penholder: { img: 'penholder.png', z: 3,
      desktop: { w: 150, h: 220, x: .06, y: .21 }, tablet: { w: 125, h: 180, x: .13, y: .16 }, mobile: { w: 85, h: 120, x: .17, y: .30 },
      label: 'Pen holder', detail: 'Ideas get written down before they get hyped. If it can’t survive ink, it won’t survive a roadmap.' },
    light: { img: 'mushroom-light.png', z: 2,
      desktop: { w: 140, h: 140, x: 0, y: .33 }, tablet: { w: 120, h: 120, x: .015, y: .25 }, mobile: { w: 90, h: 90, x: .005, y: .36 },
      label: 'Lamp', detail: 'Flicks on the moment a fuzzy goal finally turns into a number worth moving.' },
    plant: { img: 'plant.png', z: 1,
      desktop: { w: 200, h: 240, x: .28, y: .39 }, tablet: { w: 160, h: 190, x: .05, y: .45 }, mobile: { w: 110, h: 130, x: .05, y: .58 },
      label: 'Plant', detail: 'Low maintenance, high conviction — exactly the kind of early founder I like to bet on.' },
    duck: { img: 'duck.png', z: 4,
      desktop: { w: 50, h: 50, x: .14, y: .44 }, tablet: { w: 42, h: 42, x: .28, y: .35 }, mobile: { w: 34, h: 34, x: .35, y: .45 },
      label: 'Debug duck', detail: 'My debugging partner and my most honest content-strategy focus group. Quacks back.' },
    laptop: { img: 'laptop.png', z: 3,
      desktop: { w: 300, h: 260, x: .43, y: .40 }, tablet: { w: 230, h: 200, x: .38, y: .45 }, mobile: { w: 150, h: 130, x: .33, y: .58 },
      label: 'Laptop', detail: 'Where the roadmap meets the API docs. I open both before anyone starts building.' },
    headphone: { img: 'headphone.png', z: 4,
      desktop: { w: 160, h: 160, x: .31, y: .69 }, tablet: { w: 125, h: 125, x: .18, y: .68 }, mobile: { w: 88, h: 88, x: .07, y: .76 },
      label: 'Headphones', detail: 'On means don’t pitch me. Deep work in progress — come back with the data.' },
    matcha: { img: 'matcha.png', z: 3,
      desktop: { w: 130, h: 130, x: .63, y: .63 }, tablet: { w: 100, h: 100, x: .74, y: .65 }, mobile: { w: 72, h: 72, x: .74, y: .70 },
      label: 'Matcha', detail: 'Fuel, and a contrarian stance: matcha over coffee. Yes, that’s a hill.' },
    keyboard: { img: 'keyboard.png', z: 5,
      desktop: { w: 250, h: 97, x: .44, y: .73 }, tablet: { w: 210, h: 82, x: .40, y: .70 }, mobile: { w: 150, h: 58, x: .34, y: .80 },
      label: 'Keyboard', detail: 'For shipping, not for slideware. Most of my best decisions were typed, not presented.' },

    // extra items drawn as inline SVG (no CDN asset exists for these)
    mug: { z: 6,
      desktop: { w: 96, h: 96, x: .70, y: .55 }, tablet: { w: 80, h: 80, x: .72, y: .56 }, mobile: { w: 60, h: 60, x: .62, y: .64 },
      label: 'Coffee', detail: 'For the days matcha can’t fix. Rare — but they happen.',
      svg: '<svg viewBox="0 0 100 100"><path d="M34 24 q-4 6 0 12 M46 22 q-4 6 0 12 M58 24 q-4 6 0 12" fill="none" stroke="#c9c0aa" stroke-width="3" stroke-linecap="round"/><path d="M20 42 h48 v18 a20 20 0 0 1 -20 20 h-8 a20 20 0 0 1 -20 -20 z" fill="#f0e9d6" stroke="#3b3527" stroke-width="3"/><path d="M68 46 a14 14 0 0 1 0 24" fill="none" stroke="#3b3527" stroke-width="3"/><rect x="26" y="49" width="34" height="7" rx="3.5" fill="#6b4e2e" opacity=".55"/></svg>' },
    sticky: { z: 6,
      desktop: { w: 92, h: 92, x: .80, y: .37 }, tablet: { w: 76, h: 76, x: .80, y: .35 }, mobile: { w: 58, h: 58, x: .80, y: .45 },
      label: 'Sticky notes', detail: 'Where every roadmap starts: one ugly sticky at a time.',
      svg: '<svg viewBox="0 0 100 100"><rect x="24" y="30" width="52" height="52" rx="4" fill="#ffe27a" stroke="#3b3527" stroke-width="3" transform="rotate(-7 50 56)"/><rect x="26" y="26" width="52" height="52" rx="4" fill="#f6b3d0" stroke="#3b3527" stroke-width="3" transform="rotate(4 52 52)"/><g transform="rotate(4 52 52)" opacity=".6"><path d="M40 44 h26 M40 54 h26 M40 64 h16" stroke="#3b3527" stroke-width="3" stroke-linecap="round" fill="none"/></g></svg>' },
    book: { z: 5,
      desktop: { w: 104, h: 100, x: .15, y: .58 }, tablet: { w: 84, h: 82, x: .10, y: .60 }, mobile: { w: 62, h: 60, x: .10, y: .66 },
      label: 'Notebook', detail: 'The docs, again. Reading them yourself is a personality trait.',
      svg: '<svg viewBox="0 0 100 100"><rect x="26" y="26" width="46" height="56" rx="5" fill="#8fbf9f" stroke="#2f3a30" stroke-width="3"/><rect x="30" y="26" width="6" height="56" fill="#2f3a30" opacity=".22"/><g stroke="#2f3a30" stroke-width="2.5" stroke-linecap="round" opacity=".5"><path d="M42 42 h22 M42 52 h22 M42 62 h14"/></g><path d="M60 26 v20 l-5 -5 -5 5 v-20 z" fill="#f6b3d0" stroke="#2f3a30" stroke-width="2"/></svg>' },
    clock: { z: 6,
      desktop: { w: 88, h: 88, x: .85, y: .20 }, tablet: { w: 74, h: 74, x: .85, y: .18 }, mobile: { w: 56, h: 56, x: .84, y: .26 },
      label: 'Clock', detail: 'Ships on the date. The clock isn’t decorative.',
      svg: '<svg viewBox="0 0 100 100"><path d="M28 30 a12 12 0 0 1 16 0 M56 30 a12 12 0 0 1 16 0" fill="#f0e9d6" stroke="#3b3527" stroke-width="3"/><circle cx="50" cy="56" r="26" fill="#f0e9d6" stroke="#3b3527" stroke-width="3"/><line x1="50" y1="56" x2="50" y2="42" stroke="#3b3527" stroke-width="3" stroke-linecap="round"/><line x1="50" y1="56" x2="60" y2="60" stroke="#c94f7c" stroke-width="3" stroke-linecap="round"/><circle cx="50" cy="56" r="3" fill="#3b3527"/><line x1="46" y1="80" x2="42" y2="90" stroke="#3b3527" stroke-width="3" stroke-linecap="round"/><line x1="54" y1="80" x2="58" y2="90" stroke="#3b3527" stroke-width="3" stroke-linecap="round"/></svg>' },
    frame: { z: 5,
      desktop: { w: 92, h: 102, x: .55, y: .24 }, tablet: { w: 78, h: 86, x: .58, y: .22 }, mobile: { w: 58, h: 64, x: .56, y: .30 },
      label: 'Photo frame', detail: 'Founders I backed early. Framed on purpose.',
      svg: '<svg viewBox="0 0 100 100"><rect x="24" y="22" width="52" height="62" rx="6" fill="#e9dfc8" stroke="#3b3527" stroke-width="3"/><rect x="32" y="30" width="36" height="34" rx="3" fill="#bcd7ea"/><path d="M50 60 c-8 -6 -14 -10 -14 -17 a7 7 0 0 1 14 -3 a7 7 0 0 1 14 3 c0 7 -6 11 -14 17 z" fill="#f6b3d0" stroke="#c94f7c" stroke-width="1.5"/><rect x="34" y="70" width="32" height="6" rx="3" fill="#3b3527" opacity=".28"/></svg>' }
  };
  var ORDER = ['penholder', 'light', 'plant', 'laptop', 'duck', 'headphone', 'matcha', 'keyboard', 'mug', 'sticky', 'book', 'clock', 'frame'];

  var css = document.createElement('style');
  css.textContent = ''
    + '.deskx{width:100vw;margin-left:calc(50% - 50vw);position:relative;color:#14110f;'
    + 'font-family:"Bricolage Grotesque",ui-sans-serif,system-ui,sans-serif;padding:56px 0 40px;box-sizing:border-box}'
    + '.deskx-inner{max-width:1120px;margin:0 auto;padding:0 16px;box-sizing:border-box}'
    + '.deskx-eyebrow{font-family:"JetBrains Mono",ui-monospace,monospace;font-size:10.5px;letter-spacing:.2em;'
    + 'text-transform:uppercase;color:rgba(20,17,15,.6);text-align:center;margin-bottom:10px}'
    + '.deskx-title{margin:0 0 18px;text-align:center;font-family:"Instrument Serif",ui-serif,Georgia,serif;'
    + 'font-weight:400;font-size:clamp(30px,5vw,54px);letter-spacing:-.02em;line-height:1}'
    + '.deskx-stage{position:relative;width:100%;border-radius:24px;overflow:hidden;'
    + 'background:linear-gradient(180deg,#fbf7ec,#f3ead6);border:1px solid rgba(20,17,15,.10);'
    + 'background-image:radial-gradient(rgba(20,17,15,.12) 1px,transparent 1px);background-size:16px 16px;'
    + 'box-shadow:0 30px 60px rgba(18,28,40,.16),inset 0 1px 0 rgba(255,255,255,.6);touch-action:none}'
    + '.deskx-bg{position:absolute;pointer-events:none;object-fit:contain}'
    + '.deskx-item{position:absolute;left:0;top:0;cursor:grab;user-select:none;touch-action:none;will-change:transform}'
    + '.deskx-item.grabbing{cursor:grabbing}'
    + '.deskx-item img{display:block;width:100%;height:100%;object-fit:contain;pointer-events:none;-webkit-user-drag:none}'
    + '.deskx-item svg{display:block;width:100%;height:100%;pointer-events:none;filter:drop-shadow(0 6px 8px rgba(20,25,45,.16))}'
    + '.deskx-bob{animation:deskBob var(--d,5s) ease-in-out infinite}'
    + '.deskx-item.settled .deskx-bob{animation:none}'
    + '@keyframes deskBob{0%,100%{transform:translate3d(0,0,0) rotate(var(--r,0deg))}'
    + '50%{transform:translate3d(0,-6px,0) rotate(calc(var(--r,0deg) + .6deg))}}'
    + '.deskx-panel{position:absolute;z-index:1000;right:24px;top:50%;transform:translateY(-50%);width:300px;'
    + 'background:rgba(253,230,138,.97);color:#14110f;border-radius:14px;padding:16px 18px;'
    + 'box-shadow:0 12px 34px rgba(0,0,0,.16);opacity:0;pointer-events:none;transition:opacity .2s ease}'
    + '.deskx-panel.show{opacity:1;pointer-events:auto}'
    + '.deskx-panel h4{margin:0 0 8px;font-size:15px;font-weight:650}'
    + '.deskx-panel p{margin:0;font-size:14px;line-height:1.5;opacity:.82}'
    + '.deskx-panel button{position:absolute;top:8px;right:10px;border:0;background:transparent;font-size:20px;'
    + 'line-height:1;cursor:pointer;color:inherit;opacity:.55}'
    + '.deskx-prompt{position:absolute;left:50%;bottom:16px;transform:translateX(-50%);z-index:900;'
    + 'background:rgba(254,243,199,.92);border-radius:12px;padding:9px 14px;font-size:13px;line-height:1.4;'
    + 'box-shadow:0 6px 18px rgba(0,0,0,.10);transition:opacity .25s ease}'
    + '@media (max-width:680px){.deskx-panel{right:12px;top:12px;transform:none;width:min(320px,calc(100% - 24px))}}';
  (document.head || document.documentElement).appendChild(css);

  function bp(w) { return w >= 1000 ? 'desktop' : w >= 680 ? 'tablet' : 'mobile'; }

  function build() {
    if (document.querySelector('.deskx')) return true;

    // place the desk directly ABOVE the "I explain the work" section
    var before = null, h2s = document.querySelectorAll('h2');
    for (var i = 0; i < h2s.length; i++) {
      if (/i explain the work/i.test(h2s[i].textContent || '')) { before = h2s[i].closest('section'); break; }
    }
    var footer = document.querySelector('footer');
    if (!before && !footer) return false;

    var sec = document.createElement('section');
    sec.className = 'deskx';
    sec.innerHTML =
      '<div class="deskx-inner">'
      + '<div class="deskx-eyebrow">off the clock</div>'
      + '<h2 class="deskx-title">Arrange my desk</h2>'
      + '<div class="deskx-stage" role="group" aria-label="Draggable desk">'
      + '<img class="deskx-bg deskx-desk" src="/desk/desk.png" alt="Desk" draggable="false">'
      + '<img class="deskx-bg deskx-shelf" src="/desk/shelf.png" alt="Shelf" draggable="false">'
      + '<div class="deskx-prompt">Drag things around · click one to see what it’s for</div>'
      + '<div class="deskx-panel"><button aria-label="Close">×</button><h4></h4><p></p></div>'
      + '</div></div>';

    if (before && before.parentNode) before.parentNode.insertBefore(sec, before);
    else footer.parentNode.insertBefore(sec, footer);

    var stage = sec.querySelector('.deskx-stage');
    var deskImg = sec.querySelector('.deskx-desk');
    var shelfImg = sec.querySelector('.deskx-shelf');
    var panel = sec.querySelector('.deskx-panel');
    var prompt = sec.querySelector('.deskx-prompt');
    panel.querySelector('button').addEventListener('click', function () { panel.classList.remove('show'); });

    // sounds (best-effort; unlocked on first pointer)
    var grab, drop, unlocked = false;
    try { grab = new Audio('/desk/grab.MP3'); drop = new Audio('/desk/drop.MP3'); grab.volume = .5; drop.volume = .5; } catch (e) {}
    function unlock() { if (unlocked) return; unlocked = true; [grab, drop].forEach(function (a) { if (!a) return; try { a.muted = true; a.play().then(function () { a.pause(); a.currentTime = 0; a.muted = false; }).catch(function () {}); } catch (e) {} }); }
    function play(a) { if (!a) return; try { a.currentTime = 0; a.play().catch(function () {}); } catch (e) {} }

    var els = {};
    ORDER.forEach(function (key) {
      var s = SLOTS[key];
      var el = document.createElement('div');
      el.className = 'deskx-item';
      el.style.zIndex = s.z;
      el.dataset.key = key;
      var seed = key.split('').reduce(function (t, c) { return t + c.charCodeAt(0); }, 0);
      var inner = document.createElement('div');
      inner.className = 'deskx-bob';
      inner.style.width = '100%'; inner.style.height = '100%';
      inner.style.setProperty('--d', (4 + (seed % 4) * .5) + 's');
      inner.style.setProperty('--r', ((seed % 5 - 2) * .5) + 'deg');
      inner.style.animationDelay = (seed % 7) * .2 + 's';
      if (s.svg) {
        inner.innerHTML = s.svg;
      } else {
        var img = document.createElement('img');
        img.src = '/desk/' + s.img; img.alt = s.label; img.draggable = false;
        inner.appendChild(img);
      }
      el.appendChild(inner);
      stage.appendChild(el);
      els[key] = el;
    });

    var maxZ = 10;
    function layout() {
      var w = stage.clientWidth;
      var mode = bp(w);
      var h = mode === 'mobile' ? 560 : mode === 'tablet' ? 620 : 700;
      stage.style.height = h + 'px';
      var scale = Math.max(.42, Math.min(1, w / 1200));

      // desk + shelf backgrounds (desk enlarged)
      var deskW = mode === 'desktop' ? .64 : mode === 'tablet' ? .96 : 1;
      deskImg.style.width = (deskW * 100) + '%';
      deskImg.style.left = '50%'; deskImg.style.transform = 'translateX(-50%)';
      deskImg.style.bottom = (mode === 'desktop' ? -80 : 0) + 'px';
      deskImg.style.zIndex = 0;
      var shelfW = mode === 'desktop' ? 350 : mode === 'tablet' ? 250 : 180;
      shelfImg.style.width = shelfW + 'px';
      shelfImg.style.left = '0'; shelfImg.style.top = (mode === 'tablet' ? '40%' : '50%');
      shelfImg.style.transform = 'translateY(-50%)'; shelfImg.style.zIndex = 0;

      ORDER.forEach(function (key) {
        var el = els[key]; if (el.dataset.moved === '1') return; // keep user positions
        var L = SLOTS[key][mode];
        el.style.width = L.w * scale + 'px';
        el.style.height = L.h * scale + 'px';
        el.style.transform = 'translate3d(' + (L.x * w) + 'px,' + (L.y * h) + 'px,0)';
        el.dataset.tx = L.x * w; el.dataset.ty = L.y * h;
      });
    }

    // drag handling (pointer events) with click-vs-drag detection
    ORDER.forEach(function (key) {
      var el = els[key];
      var startX, startY, baseX, baseY, moved, dragging = false;
      el.addEventListener('pointerdown', function (e) {
        unlock();
        dragging = true; moved = false;
        startX = e.clientX; startY = e.clientY;
        baseX = parseFloat(el.dataset.tx) || 0; baseY = parseFloat(el.dataset.ty) || 0;
        el.classList.add('grabbing', 'settled');
        el.style.zIndex = (++maxZ);
        try { el.setPointerCapture(e.pointerId); } catch (err) {}
      });
      el.addEventListener('pointermove', function (e) {
        if (!dragging) return;
        var dx = e.clientX - startX, dy = e.clientY - startY;
        if (Math.abs(dx) + Math.abs(dy) > 4) { if (!moved) play(grab); moved = true; }
        var w = stage.clientWidth, h = stage.clientHeight;
        var nx = Math.max(0, Math.min(w - el.offsetWidth, baseX + dx));
        var ny = Math.max(0, Math.min(h - el.offsetHeight, baseY + dy));
        el.dataset.tx = nx; el.dataset.ty = ny; el.dataset.moved = '1';
        el.style.transform = 'translate3d(' + nx + 'px,' + ny + 'px,0)';
      });
      function end(e) {
        if (!dragging) return; dragging = false;
        el.classList.remove('grabbing');
        try { el.releasePointerCapture(e.pointerId); } catch (err) {}
        if (moved) { play(drop); }
        else {  // a click → show info
          var s = SLOTS[key];
          panel.querySelector('h4').textContent = s.label;
          panel.querySelector('p').textContent = s.detail;
          panel.classList.add('show');
        }
      }
      el.addEventListener('pointerup', end);
      el.addEventListener('pointercancel', end);
    });

    layout();
    var rt; window.addEventListener('resize', function () { clearTimeout(rt); rt = setTimeout(layout, 150); });
    // hide the prompt after first successful drag
    stage.addEventListener('pointerup', function () { if (Object.keys(els).some(function (k) { return els[k].dataset.moved === '1'; })) { if (prompt) prompt.style.opacity = '0'; } }, true);
    return true;
  }

  function boot() {
    // Two Framer traps: (1) footer/monitor anchor hydrate late, so we must keep
    // trying; (2) Framer's React hydration REMOVES our injected node (it's an
    // unknown child of a managed parent), so we must re-insert if it disappears —
    // never disconnect after the first success, or it vanishes for good once
    // hydration re-renders. A reinsert cap prevents any pathological loop.
    var reinserts = 0;
    function ensure() { if (!document.querySelector('.deskx') && reinserts < 200) { if (build()) reinserts++; } }
    ensure();
    var obs = new MutationObserver(function () { ensure(); });
    obs.observe(document.documentElement, { childList: true, subtree: true });
    // keepalive for the first ~60s while the app settles
    var n = 0, iv = setInterval(function () { ensure(); if (++n > 120) clearInterval(iv); }, 500);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
