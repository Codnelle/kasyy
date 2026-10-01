/* /pm hero: turn the black "spec sheet" card into a cream sticky note.
   The card is a single element with a stable hook: [data-cursor="the short version"]
   and inline background:rgb(20,17,15) — so we override it directly (reliable).
   Native tilt + scroll-reveal are preserved (we don't touch transform/opacity). */
(function () {
  var st = document.createElement('style');
  st.textContent = ''
    + '.pm-sticky{background:#f7efd6 !important;color:#403a30 !important;'
    + 'box-shadow:7px 9px 0 rgba(20,17,15,.06), 0 22px 46px rgba(20,25,45,.20) !important;overflow:visible !important;}'
    + '.pm-sticky::before{content:"";position:absolute;left:-14px;top:12px;right:16px;bottom:-10px;'
    + 'background:#efe0a4;border-radius:16px;transform:rotate(2.4deg);z-index:-1;box-shadow:0 14px 30px rgba(20,25,45,.12);}'
    + '.pm-clip{position:absolute;top:-30px;left:28px;font-size:56px;line-height:1;transform:rotate(14deg);'
    + 'filter:drop-shadow(0 3px 4px rgba(0,0,0,.2));z-index:4;pointer-events:none;}'
    + '.pm-tape{position:absolute;top:-15px;right:40px;width:92px;height:30px;background:#f6b3d0;'
    + 'transform:rotate(4deg);display:flex;align-items:center;justify-content:center;color:#d63384;'
    + 'font-size:17px;box-shadow:0 3px 8px rgba(0,0,0,.12);opacity:.92;z-index:4;}';
  (document.head || document.documentElement).appendChild(st);

  function sum(rgb) { var m = /(\d+), (\d+), (\d+)/.exec(rgb || ''); return m ? (+m[1] + +m[2] + +m[3]) : 999; }

  function sticky() {
    // primary hook: the unique data-cursor attribute on the card
    var card = document.querySelector('[data-cursor="the short version"]');
    // fallback: an element whose text (case-insensitive) is the spec sheet
    if (!card) {
      card = [].slice.call(document.querySelectorAll('div,section')).filter(function (e) {
        var t = e.textContent || '';
        return /spec sheet/i.test(t) && /currently/i.test(t) && /also/i.test(t);
      }).sort(function (a, b) { return a.textContent.length - b.textContent.length; })[0];
    }
    if (!card) return false;
    if (card.getAttribute('data-sticky') === '1') return true;
    card.classList.add('pm-sticky');
    card.style.setProperty('background', '#f7efd6', 'important');
    card.style.setProperty('color', '#403a30', 'important');
    // any inner dark fill layers -> transparent so the cream shows
    [].forEach.call(card.querySelectorAll('*'), function (e) {
      if (sum(getComputedStyle(e).backgroundColor) < 120) e.style.setProperty('background', 'transparent', 'important');
      if (sum(getComputedStyle(e).color) > 380) e.style.setProperty('color', '#403a30', 'important');
    });
    var clip = document.createElement('div'); clip.className = 'pm-clip'; clip.textContent = '📎';
    var tape = document.createElement('div'); tape.className = 'pm-tape'; tape.textContent = '♥';
    card.appendChild(clip); card.appendChild(tape);
    card.setAttribute('data-sticky', '1');
    return true;
  }

  // make the "Stages" clothesline(s) span the full viewport width (they sit in
  // a width:100% container that inherits the section's side padding)
  function fullBleedLines() {
    var svgs = document.querySelectorAll('svg[viewBox="0 0 1000 80"]');
    [].forEach.call(svgs, function (s) {
      var c = s.parentElement;
      if (!c || c.getAttribute('data-fb') === '1') return;
      c.style.setProperty('width', '100vw', 'important');
      c.style.setProperty('max-width', 'none', 'important');
      c.style.setProperty('margin-left', 'calc(50% - 50vw)', 'important');
      c.style.setProperty('margin-right', 'calc(50% - 50vw)', 'important');
      c.setAttribute('data-fb', '1');
    });
  }

  // /kasy chat mock: the "Kasy" avatar is a broken placeholder — use the face
  function chatFace() {
    var spans = [].slice.call(document.querySelectorAll('span'));
    spans.forEach(function (s) {
      if ((s.textContent || '').trim() !== 'Kasy') return;
      var r = s, hops = 0;
      while (r && hops < 6) {
        var imgs = r.querySelectorAll ? r.querySelectorAll('img') : [];
        if (imgs.length) {
          var av = imgs[0];
          if (av.getAttribute('data-face') !== '1') {
            av.setAttribute('src', '/kasy-face.webp');
            av.removeAttribute('srcset');
            av.style.setProperty('object-fit', 'cover', 'important');
            av.setAttribute('data-face', '1');
          }
          break;
        }
        r = r.parentElement; hops++;
      }
    });
  }

  function run() { sticky(); fullBleedLines(); chatFace(); }
  function boot() {
    run();
    var n = 0, iv = setInterval(function () { run(); if (++n > 40) clearInterval(iv); }, 250);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot);
  else boot();
})();
