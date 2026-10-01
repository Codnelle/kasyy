/* Kashish Sharma — portfolio interactions. Vanilla JS, no deps. */
(function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion:reduce)').matches;

  /* ---- intro loader (runs on every page load, so nav shows it too) ---- */
  function runLoader() {
    var el = document.querySelector('.loader');
    if (!el) return;
    var bar = el.querySelector('.loader__bar i');
    var pct = el.querySelector('.loader__pct');
    if (reduce) { el.classList.add('done'); return; }
    var n = 0;
    var t = setInterval(function () {
      n += Math.max(1, Math.round((100 - n) * 0.12));
      if (n >= 100) { n = 100; clearInterval(t); setTimeout(function () { el.classList.add('done'); }, 260); }
      if (bar) bar.style.right = (100 - n) + '%';
      if (pct) pct.textContent = String(n).padStart(3, '0');
    }, 90);
  }
  runLoader();

  /* ---- scroll reveal ---- */
  var reveals = document.querySelectorAll('.reveal');
  if (reduce || !('IntersectionObserver' in window)) {
    reveals.forEach(function (n) { n.classList.add('in'); });
  } else {
    var io = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
    }, { rootMargin: '0px 0px -8% 0px', threshold: .1 });
    reveals.forEach(function (n) { io.observe(n); });
  }

  /* ---- count-up ---- */
  function countUp(el) {
    var target = parseFloat(el.getAttribute('data-count'));
    var pre = el.getAttribute('data-prefix') || '', suf = el.getAttribute('data-suffix') || '';
    var dur = 1400, start = null;
    function step(ts) {
      if (!start) start = ts;
      var p = Math.min((ts - start) / dur, 1), e = 1 - Math.pow(1 - p, 3);
      var v = target % 1 === 0 ? Math.round(target * e) : (target * e).toFixed(1);
      el.innerHTML = pre + v + suf;
      if (p < 1) requestAnimationFrame(step);
    }
    requestAnimationFrame(step);
  }
  var nums = document.querySelectorAll('[data-count]');
  if (reduce || !('IntersectionObserver' in window)) {
    nums.forEach(function (el) { el.innerHTML = (el.getAttribute('data-prefix') || '') + el.getAttribute('data-count') + (el.getAttribute('data-suffix') || ''); });
  } else {
    var io2 = new IntersectionObserver(function (es) {
      es.forEach(function (e) { if (e.isIntersecting) { countUp(e.target); io2.unobserve(e.target); } });
    }, { threshold: .6 });
    nums.forEach(function (el) { io2.observe(el); });
  }

  /* ---- rotating hero phrase ---- */
  var rot = document.getElementById('rot');
  if (rot && !reduce) {
    var phrases = (rot.getAttribute('data-phrases') || '').split('|').filter(Boolean);
    if (phrases.length > 1) {
      var i = 0;
      setInterval(function () {
        i = (i + 1) % phrases.length;
        rot.style.opacity = 0;
        setTimeout(function () { rot.textContent = phrases[i]; rot.style.opacity = 1; }, 220);
      }, 2800);
    }
  }

  /* ---- marquee: duplicate track for seamless loop ---- */
  document.querySelectorAll('.marquee__track').forEach(function (tr) { tr.innerHTML += tr.innerHTML; });

  /* ---- live IST clock ---- */
  var clock = document.getElementById('clock');
  if (clock) {
    var tick = function () {
      var d = new Date(Date.now() + 330 * 60000);
      var p = function (x) { return String(x).padStart(2, '0'); };
      clock.textContent = 'Bangalore — ' + p(d.getUTCHours()) + ':' + p(d.getUTCMinutes()) + ':' + p(d.getUTCSeconds()) + ' IST';
    };
    tick(); setInterval(tick, 1000);
  }
})();
