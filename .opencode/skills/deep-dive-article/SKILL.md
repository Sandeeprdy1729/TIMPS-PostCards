---
name: deep-dive-article
description: Create a TIMPS Deep Dive article end-to-end — suggest the top 5 stories worth writing, let the user pick one or give their own news, then research it, download a real web image, build the article page matching the site's design system, add it to the articles hub, swap the homepage recent-article card, and verify. Use when the user says "create an article", "write a deep dive", "add a new article", "make a new article card", "I want to write about <topic>", or asks what they should write about next.
---

# TIMPS Deep Dive Article Builder

You are automating the full deep-dive article pipeline for the TIMPS newsletter site (this repo). The site publishes short daily PostCards plus long-form TIMPS Deep Dives ("One story, explained properly"). A deep dive is a numbered, image-rich explainer that must match the site's exact design system. Never invent structure — mirror the existing files.

## Step 1 — Propose story candidates FIRST (mandatory)

Before writing anything, produce a shortlist of the 5 strongest deep-dive candidates right now and present it to the user with the `question` tool (multiple: false):

1. Glance at the most recent issues (`timps-postcards-2026-*.html`, latest 3–5) and `index.html` archive for themes worth long-form treatment.
2. Run 1–3 web searches for the current AI/tech news cycle if the daily issues don't cover enough.
3. Pick 5 candidates that are (a) big, (b) explainable in ~1,600–2,200 words, (c) have several citable sources, (d) fit the site's AI-landscape focus. Vary the subjects.
4. Present them as one question with up to 5 options, each option = the working title + one-line "because…".

**Do not write the article yet.** If the user picks one of your candidates, use it. If the user replies with their own news/topic instead, use that. Their own topic overrides your list entirely.

Important: if the user gives a bare news phrase as their topic (e.g. "Apple Vision Pro scrubs into surgery"), do NOT use that phrase as the headline or the article title. Craft an original, stronger headline that captures the story.

## Step 2 — Research the story

- Run multiple `websearch` calls: general coverage, the primary announcement/press release, any peer-reviewed study, and one critical/contrarian take. Follow promising `webfetch` leads for facts.
- Extract hard facts: names, dates, company tickers, numbers, percentages, model/device names, dollar amounts, decision IDs, source URLs.
- You need at minimum the primary source (announcement) + 4–8 corroborating/context sources. Keep every URL verbatim for the Sources list.
- If a key fact can't be verified, say so in the article ("as reported") rather than inventing it.

## Step 3 — Get the image (REAL image from the web, never SVG)

Site rule: article heroes are real photographs/imagery downloaded from the web. Do NOT draw an SVG, and do NOT ship inline SVG art.

1. Find the best real image tied to the story: usually the primary source's official announcement/product/hero image, or a news-article lead image.
   - Inspect the page HTML for `og:image` or `<img>` URLs, or fetch the site's asset path. For press releases the hero is often a `-hero.png` / `-thumbnail.jpg` under a `/content/dam/` path — probe likely sibling paths if needed.
2. Download it. Verify it's a real image (`file`/PIL), not an HTML error page (watch for small byte counts, HTML content, or image-like extensions serving text).
3. Crop/pad to **1600×900** (center-crop from a wide source, LANCZOS), save as JPEG quality ~88 to:
   `thumbs/article-<kebab-slug>-hero.jpg`
   - Slug = the article filename stem, e.g. `visionpro-surgery`. Use PIL (`pip`-safe: `from PIL import Image`); fall back to `sips` if PIL is unavailable.
4. Credit it honestly in the figure caption ("Image via <publisher>"). If the only available image is low-res or you cannot find one, tell the user and ask how to proceed — do not silently ship a broken/placeholder image.

## Step 4 — Build the article page

Create `article-<kebab-slug>.html` by copying the newest existing deep-dive (currently `article-pace-the-frontier.html` — check `ls article-*.html`) as the template and rewriting the content. Keep every `<style>` rule that already exists id-to-identical — do not redesign.

### Must-match design system (do not deviate)
- Colors: `--cream:#EDE8DA --forest:#1C2E22 --pink:#E8B4E8 --lime:#DCF07A --lime-d:#C8DE60 --black:#111111 --card-bg:#F5F1E6`; graph-paper grid background.
- **Two fonts only** for article content: `--serif:'TIMPS'` (headings, from `TIMPS-Family-v2/*.woff2`) and `--news:'Newsreader'` (prose/descriptions). `--mono:'Space Mono'` only for nav + UI chips/labels/buttons. Google Fonts link = Newsreader + Space Mono ONLY (no Playfair). Keep the `@font-face` block.
- **Navbar identical** to `index.html` (same link set, same classes): logo → `index.html`; Articles → `articles.html` (class `active` on this page); Archive → `index.html#archive`; Latest Issue → the CURRENT latest issue file (check `ls timps-postcards-2026-*.html | tail -1` — today's date is Sep 2026); Subscribe → `index.html#subscribe`; CTA "Subscribe" → `index.html#subscribe`. Keep the mobile media queries.

### Page structure (order matters)
1. `<head>` — same title tag pattern: `TIMPS Articles — <descriptive title>`.
2. Nav.
3. Masthead: `masthead-kicker` = `TIMPS Deep Dive · № 00X` (next number in sequence: read the highest № in the hub, add 1). `masthead-h` = original headline (with `<em>` on the money phrase). `masthead-dek` = 2–3 sentence summary. `masthead-meta` = `<b>Sandeep Thummala</b> · <Month D, YYYY> · <N> min read`.
4. Hero `<figure>`: `Fig. 01` tag, real image, descriptive alt, caption crediting source + publisher.
5. Lede paragraph `<p class="lede">` — kicker `<b>Good morning.</b>`, strong hook, ends setting up the stakes.
6. One-card summary `<div class="callout">` with `<b>What:</b>`, `<b>When:</b>`, `<b>Why it matters:</b>`.
7. Sections — the LAST one is always the TIMPS verdict. Typical arc for 8 sections: 01 What happened / 02 Background or "what the docs actually say" / 03 How it works / 04 The evidence (pair with `.bench` bars when there are numbers) / 05 Context or adjacent developments / 06 The counter-reading or caveats / 07 What to watch next (bulleted) / 08 The TIMPS verdict (callout with "Our read"). Use `.section-h` + `.section-no` chips. Use `<ul class="para">` for lists. Add `.spec` sheet and/or `.bench` card where numbers justify them; `.pullquote` for the best quote with attribution.
8. Disclaimer `<p class="para" style="opacity:.6;...">` — "Facts in this piece were compiled from …" listing your sources and ending "this is news analysis by an independent publication — not medical advice, not investment advice, and not AI advice." (Adapt the disclaimer to the topic type.)
9. `.sources` block: `<h3>Sources</h3>` + `<ol>` of every source with full URLs, `target="_blank" rel="noopener"`. At least 5.
10. `.endcard`: title `One story a day,<br>explained properly.`, the free-forever sub, `Subscribe free` btn, prev-link to the previously published article (`&larr; Prev: <Previous title>`), and a `Browse all deep dives →` link to `articles.html`.
11. Footer (copy verbatim from template).

### Writing rules
- Read time: standard density ≈ words/130, rounded to nearest minute (previous pieces: 10–14 min).
- Byline always `Sandeep Thummala`. Publish date = today (today is Sep 2026; use the real current date).
- Tone: sharp news analysis for an independent publication. Bold the load-bearing nouns/numbers with `<b>`; italicize cautionary phrases with `<i>`.
- Facts match Step 2 exactly; note uncertainty honestly.

## Step 5 — Wire it into the site

1. **Hub** (`articles.html`): the hub lists articles **newest-first** — insert the new `<a href="article-<slug>.html" class="card">` as the FIRST card, BEFORE the previous most-recent one (older articles stay in order beneath it). Structure: `card-thumb` (real image), `card-body` → `card-tag` = `Deep Dive № 00X · <Company> · <Vertical>` (add `class="pink"` on alternating cards for variety), `card-title`, `card-deck` (2–3 sentences), `card-byline` = `<b>Sandeep Thummala</b> · <N> min read · <date>`, `card-cta` = `Read the deep dive →`.
2. **Homepage** (`index.html`, `#articles` section): the site shows ONLY the most recent deep dive as a single `article-card` — REPLACE the existing card's content with the new article (do not append; do not list all articles). Match the `article-card` classes used there (`article-card-tag`, `article-card-title`, `article-card-deck`, `article-card-meta`, `btn-chunky lime article-card-cta`).
3. **Prev/next links**: update the previous article's `.endcard` to add the new article as the next link if desired (e.g. `Next: <Title> →`), keeping the browse link.
4. If the index nav "Latest Issue" still points at an older daily issue file, bump it to the newest `timps-postcards-2026-*.html` on ALL article/hub pages so every navbar stays identical.

## Step 6 — Regenerate the do-not-repeat news tracker

Run this after EVERY published issue or article (a deep dive via this skill, or any daily PostCard), so the tracker always reflects what has already been covered and no story is ever reused:

1. Run `python3 update_coverage_log.py` from the repo root. It regenerates `NEWS-COVERAGE.md` from `timps-postcards-*.html` + `articles.html` (headline, summary deck, sources, signal briefs, newest first).
2. Confirm the output line reports the new issue/article: e.g. `Wrote NEWS-COVERAGE.md (97 issues, 8 articles)` — issue/article counts must go up by one vs before.
3. Grep the new entry in `NEWS-COVERAGE.md` (search by date for a daily issue, or by title for a deep dive) and verify the headline/deck/sources match what you just published.
4. If any new daily issue file exists that the script didn't pick up, or any count looks stale, investigate before moving on — the tracker must stay complete.

## Step 7 — Verify

1. Parse every touched HTML file with Python's `html.parser` (tag balance check used before) — no mismatched tags, empty stack at EOF.
2. Check every internal `href`/`src` resolves to an existing file (images exist in `thumbs/`, links point to real pages).
3. Grep that no `Playfair` remains and Newsreader is loaded.
4. Confirm `thumbs/article-<slug>-hero.jpg` opens as a valid image.
5. Confirm hub + homepage both reference the new article and the homepage shows exactly one article card.
6. Do a final web-search spot check that the headline doesn't restate a user-supplied literal news phrase and facts match sources.

## Step 8 — Git

- Commit + push ONLY when the user explicitly asks ("push", "commit and push").
- Never commit `.vscode/settings.json` (a live-server port file with export complaints — it must stay out) or unrelated `samples/` output.
- Stage exactly the intended files, commit with a concise Conventional-Commit style message (e.g. `Add Deep Dive № 004: <topic>`), and push to `origin main`.