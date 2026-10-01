# Kashish Sharma — portfolio

A hand-coded, fully editable static site (no framework, no build step). Two pages:

- **/pm** — Product Manager
- **/kasy** — Web Design & Motion

## Run it

```bash
npm start
```

Open http://localhost:4321 (redirects to `/pm`). Set another port with `PORT=8080 npm start`.

## Structure

```
web/                          ← the site (this is what you edit)
  index.html                  ← / (redirects to /pm)
  pm.html                     ← /pm
  kasy.html                   ← /kasy
  assets/
    css/styles.css            ← all styles, organised by section w/ comments
    js/main.js                ← loader, scroll reveals, count-up, marquee, clock
    img/                      ← portrait cut-outs (portrait-smirk / -serious / …)
    fonts/                    ← self-hosted Bricolage Grotesque, JetBrains Mono, Instrument Serif
serve.mjs                     ← tiny static server (clean routes, correct MIME)
site/                         ← ARCHIVE: the earlier exact Framer mirror (not served)
tools/, _raw/                 ← the mirror's build pipeline (archive only)
```

## Editing — the two custom components you asked for

**Folder-scroll case studies** (`.folder` in `pm.html` / `kasy.html`)
Project cards stack up like folders as you scroll (CSS `position:sticky`, each card
offset by `--i`). To add a project, copy a `.folder__case` block and bump its `--i`:

```html
<div class="folder__case" style="--i:4"><div class="folder__card">
  <div class="folder__tab"><span class="no">Project 05</span><span>Name</span><span class="yr">2026</span></div>
  <div class="folder__body"><h3>Name</h3><p>…</p><span class="folder__nums">…</span></div>
  <div class="folder__side"><div class="folder__meta">Role<br><b>…</b></div></div>
</div></div>
```

**Stitch card** (`.stitch`) — the dashed "stitched" widget, reused everywhere
(spec sheet, stat tiles, awards, the compare table). Just add the class:

```html
<div class="stitch">…</div>                 <!-- cream -->
<div class="stitch stitch--dark">…</div>     <!-- dark -->
<div class="stitch stitch--tilt">…</div>     <!-- slight rotation -->
```

Colours live as CSS variables at the top of `styles.css`
(`--ink --cream --coral --lime --purple --taupe --sky-*`).

## Notes
- The intro **loader** runs on every page load, so it also plays when you switch
  between *design* and *product* (they're separate pages — a real navigation).
- Fully responsive; the footer blends into the sky with a dashed separator.
- The original Framer site was mirrored first into `site/` — kept for reference only.
