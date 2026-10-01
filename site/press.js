/* "Elsewhere" (press + profiles) section. It is baked into the static HTML by
   _raw/build.mjs from /press.json at the end of <body>, outside Framer's React
   root, so the links are crawlable without JS. Here it is moved to just above
   the footer; a persistent observer puts it back if a React re-render drops it. */
(function () {
  var p = location.pathname.split('?')[0].replace(/\/$/, '');
  if (p !== '/pm' && p !== '/kasy') return;

  var sec = null;
  function place() {
    sec = sec || document.getElementById('kx-press');
    var f = document.querySelector('footer');
    var host = f && f.closest('[class*="-container"]');
    if (!sec || !host || !host.parentNode) return;
    if (sec.nextElementSibling !== host) host.parentNode.insertBefore(sec, host);
    // /pm reorders its sections with CSS `order` (pm-monitor.js) — take the
    // footer's order so this stays directly above it instead of jumping up
    var o = getComputedStyle(host).order;
    if (sec.style.order !== o) sec.style.order = o;
  }
  function boot() {
    place();
    new MutationObserver(place).observe(document.documentElement, { childList: true, subtree: true });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
