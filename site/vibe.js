/* "My World" folder:
   1. keep the native scroll pop-out, but swap the placeholder card labels for
      short vibe traits;
   2. make it obviously interactive — pointer cursor, a gentle bob, a pulsing
      ring and an animated hint on "click to open";
   3. a click smooth-scrolls the folder into view so the cards visibly fan out
      (native click was a no-op).
   Scoped to the folder section; re-applied against Framer's re-renders. */
(function () {
  var PAIRS = [
    ['Brand Design',   'Contrarian by default'],
    ['My Work',        'Bets on founders early'],
    ['Just Me',        'Roasts content strategies'],
    ['Flowers',        'Reads the docs herself'],
    ['Beach',          'Ships at odd hours'],
    ['PEAAACE',        'Allergic to vanity metrics'],
    ['Colors',         'High conviction, low ego'],
    ['MOOD',           'Backs the underdog'],
    ['Slider UI',      'Fuzzy goal → a number'],
    ['Motion Design',  'Booth-talker turned PM'],
    ['Glass Morphism', 'Roasts decks, kindly']
  ];
  var NEW = PAIRS.map(function (p) { return p[1]; });

  var style = document.createElement('style');
  style.textContent = ''
    + '.vibe-poke{position:relative;animation:vibeBob 1.7s ease-in-out infinite}'
    + '.vibe-poke::before{content:"";position:absolute;left:50%;top:44%;width:150%;height:150%;transform:translate(-50%,-50%);'
    + 'border-radius:50%;border:2px solid rgba(107,78,255,.55);pointer-events:none;animation:vibeRing 2s ease-out infinite}'
    + '@keyframes vibeBob{0%,100%{transform:translateY(0)}50%{transform:translateY(-7px)}}'
    + '@keyframes vibeRing{0%{transform:translate(-50%,-50%) scale(.55);opacity:.7}100%{transform:translate(-50%,-50%) scale(1.35);opacity:0}}'
    + '.vibe-open-hint{animation:vibePulse 1.6s ease-in-out infinite}'
    + "@keyframes vibePulse{0%,100%{opacity:.5}50%{opacity:1}}";
  (document.head || document.documentElement).appendChild(style);

  function findFolderLabel() {
    return [].slice.call(document.querySelectorAll('*')).find(function (e) {
      if (e.children.length) return false;
      var t = (e.textContent || '').replace(/\s+/g, ' ').trim();
      return /CLICK TO OPEN/i.test(t);
    });
  }

  function apply() {
    var openLeaf = findFolderLabel();
    if (!openLeaf) return false;
    var sec = openLeaf.closest('section') || openLeaf.parentElement;

    // 1) swap card placeholder labels for vibe traits
    [].forEach.call(sec.querySelectorAll('*'), function (el) {
      if (el.children.length !== 0) return;
      var t = (el.textContent || '').replace(/\s+/g, ' ').trim();
      if (!t || NEW.indexOf(t) !== -1) return;
      for (var i = 0; i < PAIRS.length; i++) {
        if (t === PAIRS[i][0] || t.indexOf(PAIRS[i][0]) === 0) { el.textContent = PAIRS[i][1]; return; }
      }
    });

    // 2) affordances on the folder label block ("My World / click to open")
    var block = openLeaf.parentElement || openLeaf;   // the small centred label block
    if (block && !block.classList.contains('vibe-poke')) block.classList.add('vibe-poke');
    // pointer cursor up the folder graphic
    var n = openLeaf, hops = 0;
    while (n && hops < 5) { n.style.setProperty('cursor', 'pointer', 'important'); n = n.parentElement; hops++; }
    // animate + brighten the "click to open" text, add a tap finger once
    if (openLeaf.getAttribute('data-vibe') !== '1') {
      openLeaf.classList.add('vibe-open-hint');
      openLeaf.style.setProperty('color', '#6b4eff', 'important');
      openLeaf.style.setProperty('font-weight', '600', 'important');
      if (!/👆/.test(openLeaf.textContent)) openLeaf.textContent = '👆 ' + openLeaf.textContent.trim();
      openLeaf.setAttribute('data-vibe', '1');
    }
    return true;
  }

  // manual smooth scroll via setTimeout (site overrides native smooth scrollTo,
  // and rAF can be throttled) — steps instant scrollTo, which works reliably.
  function smoothTo(target) {
    target = Math.max(0, Math.round(target));
    var start = window.scrollY, dist = target - start, steps = 24, i = 0;
    (function tick() {
      i++;
      var p = i / steps, e = 1 - Math.pow(1 - p, 3);
      window.scrollTo(0, Math.round(start + dist * e));
      if (i < steps) setTimeout(tick, 16);
    })();
  }

  // 3) click → scroll the folder into view so the cards fan out
  document.addEventListener('click', function (e) {
    var n = e.target;
    while (n && n !== document.body) {
      var t = (n.textContent || '').replace(/\s+/g, ' ').trim();
      if (/My World/i.test(t) && /CLICK TO OPEN/i.test(t) && t.length < 40) {
        var sec = n.closest('section') || n;
        var y = sec.getBoundingClientRect().top + window.scrollY;
        smoothTo(y + sec.offsetHeight / 2 - window.innerHeight / 2);   // centre the folder
        return;
      }
      n = n.parentElement;
    }
  }, true);

  function boot() {
    apply();
    var tries = 0, iv = setInterval(function () { apply(); if (++tries > 20) clearInterval(iv); }, 350);
    var raf = 0;
    window.addEventListener('scroll', function () {
      if (raf) return; raf = requestAnimationFrame(function () { raf = 0; apply(); });
    }, { passive: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
