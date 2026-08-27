# TIMPS PostCards — Thumbnail Generator Brief

Hand this file (plus the code in this folder) to the coding agent. It's a
working prototype — run `node generate.js` to see it produce real SVGs — the
job left is to grow the icon library and wire it into the newsletter build.

## The style, in words

Two reference images define the look (see `/mnt/user-data/uploads/` in this
conversation, or ask the user to re-share them):

1. A thick, black, hand-inked line with **variable width and rounded ends** —
   never a uniform-width stroke. Corners and stroke terminals get a solid
   round "blob" dot, like the line was drawn with a felt marker that pooled
   ink at each pause.
2. Every glyph sits in front of **2–3 flat, muted cream shapes**
   (`#F6F3EC`) — a circle, triangle, square/rounded-square — scattered
   behind it at odd angles, often cropped by the canvas edge. They add depth
   without any gradient or shadow.
3. Pure white background, no outline/border, square canvas (1000×1000 works
   well as a source, downscale for actual thumbnail size).
4. Ink color is near-black (`#141414`), not pure `#000` — reads as "drawn,"
   not "vector default."
5. Subjects are simple: one clear action or object per icon (a hand
   swiping, a hand stacking a brick, a chip, a cloud). No fine detail, no
   more than 6–8 strokes per glyph.

## How the code produces it

- **`perfect-freehand`** turns a short list of raw points into the
  tapered, rounded-cap outline — that's what gives the "inked, not vector"
  feel. Don't hand-draw bezier curves; place 3–6 skeleton points per stroke
  and let the library do the rounding (see `render.js` → `STROKE_OPTIONS`).
- **`icons.js`** is the only file with real "content" in it — each icon is
  just a list of point-paths (`strokes`) and blob positions (`dots`). This
  is the file to grow.
- **`render.js`** applies the shared brush settings, ink color, and
  background-shape renderer so every icon looks consistent regardless of
  who adds it.
- **`generate.js`** is the batch entrypoint — loops over `icons.js` and
  writes one SVG per icon into `out/`.

## What's left to build

1. **Grow the icon library** to cover recurring TIMPS PostCards topics —
   scan `https://sandeeprdy1729.github.io/TIMPS-PostCards/` for the last
   ~80 issue headlines and derive a concept per recurring theme. Rough
   starter list: `chip` ✅, `cloud_sync` ✅, `rocket_launch`, `robot`,
   `lawsuit_gavel`, `funding_coin`, `brain_circuit`, `handshake_deal`,
   `lock_security`, `chart_up`, `voice_clone`, `data_center`. Each new
   entry is just an object in `icons.js` — copy the `chip` shape as a
   template.
2. **Topic → icon mapping.** Write a small keyword map (e.g. `{"lawsuit":
   "lawsuit_gavel", "funding|billion|\\$": "funding_coin", "robot|humanoid":
   "robot", ...}`) that picks an icon per issue from its headline, with a
   documented fallback icon (e.g. `chip`) for unmatched issues.
3. **Batch + naming.** Extend `generate.js` (or add a `build-thumbs.js`) to
   read the issue list/dates, run the mapping, render each icon, rasterize
   to PNG at the site's actual thumbnail size, and save as
   `timps-postcards-YYYY-MM-DD-thumb.png` next to the existing issue HTML
   files in the `TIMPS-PostCards` repo.
4. **Rasterization.** `sharp` is already installed and proven working in
   this prototype (`sharp('out/x.svg').resize(W,H).png().toFile(...)`) —
   reuse that, don't reach for a browser/puppeteer screenshot approach, it's
   unnecessary overhead for flat SVG.
5. **Background-shape variety.** Don't reuse the same 3 background shapes
   for every icon — randomize position/rotation/opacity per icon (seeded by
   icon name, so it's reproducible) so the archive grid doesn't look
   copy-pasted.

## Files in this folder

- `svgPath.js` — perfect-freehand → SVG path string helper (don't touch)
- `render.js` — brush settings, background-shape renderer, ink color
- `icons.js` — the icon library (grow this)
- `generate.js` — batch runner, writes to `out/`
- `out/chip.svg`, `out/cloud_sync.svg` — two working proof-of-concept icons
