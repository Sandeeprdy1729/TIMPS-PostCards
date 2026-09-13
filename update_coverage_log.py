#!/usr/bin/env python3
"""Regenerate NEWS-COVERAGE.md — a do-not-repeat log of every story already
published in the TIMPS daily PostCards and Deep Dive articles.

Run after publishing a new issue:  python3 update_coverage_log.py
The output file is the source of truth for "already covered" news.
"""
import datetime
import glob
import html
import re

ROOT = "/Users/sandeepreddy/timps-newsletter"
OUT = f"{ROOT}/NEWS-COVERAGE.md"

TAG = re.compile(r"<[^>]+>")
WS = re.compile(r"\s+")


def inline(raw):
    return WS.sub(" ", TAG.sub(" ", html.unescape(raw or ""))).strip()


def pick(pattern, src, flags=re.S):
    m = re.search(pattern, src, flags)
    return inline(m.group(1)) if m else ""


def split_story_cards(raw):
    """Split raw HTML into balanced <div class="story-card ..."> blocks."""
    starts = list(re.finditer(r'<div\b[^>]*class="[^"]*story-card[^"]*"[^>]*>', raw))
    blocks = []
    for i, tok in enumerate(starts):
        depth = 0
        end = None
        for m in re.finditer(r'(</?)\s*div\b[^>]*>', raw[tok.end():]):
            if m.group(1) == "<":
                depth += 1
            else:
                if depth == 0:
                    end = tok.end() + m.start()
                    break
                depth -= 1
        if end is None:
            end = starts[i + 1].start() if i + 1 < len(starts) else len(raw)
        blocks.append(raw[tok.start():end])
    return blocks


def parse_daily(path):
    with open(path, encoding="utf-8") as f:
        raw = f.read()

    date = re.search(r"timps-postcards-(\d{4}-\d{2}-\d{2})\.html", path).group(1)
    tm = re.search(r"<title>(.*?) — Issue (\d+)</title>", raw)
    issue = int(tm.group(2)) if tm else 0

    stories, signals = [], []
    for card in split_story_cards(raw):
        chip = pick(r'class="[^"]*page-chip[^"]*">(.*?)</div>', card)
        headline = pick(r'<(?:h1|h2|div)[^>]*class="[^"]*card-headline[^"]*"[^>]*>(.*?)</(?:h1|h2|div)>', card)
        deck = pick(r'class="[^"]*card-deck[^"]*"[^>]*>(.*?)</div>', card)

        if re.search(r'class="[^"]*card-body[^"]*"', card):
            links = []
            for a in re.finditer(r'<a[^>]*class="[^"]*source-link[^"]*"[^>]*href="([^"]*)"[^>]*>(.*?)</a>', card, re.S):
                links.append((inline(a.group(2)), a.group(1)))
            for a in re.finditer(r'<a[^>]*href="([^"]*)"[^>]*class="[^"]*source-link[^"]*"[^>]*>(.*?)</a>', card, re.S):
                links.append((inline(a.group(2)), a.group(1)))
            stories.append({"chip": chip, "headline": headline, "deck": deck, "links": links})
        elif re.search(r'class="[^"]*signals-grid[^"]*"', card):
            for s in re.finditer(r'class="[^"]*signal-title[^"]*">(.*?)</div>', card, re.S):
                signals.append(inline(s.group(1)))

    return {"date": date, "issue": issue, "file": path.split("/")[-1],
            "stories": stories, "signals": signals}


def parse_articles():
    with open(f"{ROOT}/articles.html", encoding="utf-8") as f:
        raw = f.read()
    arts = []
    for m in re.finditer(r'<a href="(article-[^"]+)\.html" class="card">(.*?)</a>', raw, re.S):
        href, card = m.group(1), m.group(2)
        tag = pick(r'class="[^"]*card-tag[^"]*">(.*?)</span>', card)
        title = pick(r'class="[^"]*card-title[^"]*">(.*?)</h2>', card)
        deck = pick(r'class="[^"]*card-deck[^"]*">(.*?)</p>', card)
        byline = pick(r'class="[^"]*card-byline[^"]*">(.*?)</div>', card)
        no = re.search(r"№\s*(\d+)", tag)
        arts.append({"no": int(no.group(1)) if no else 0, "file": href, "tag": tag,
                     "title": title, "deck": deck, "byline": byline})
    arts.sort(key=lambda a: a["no"], reverse=True)
    return arts


def render(issues, arts):
    today = datetime.date.today().isoformat()
    L = []
    L.append("# TIMPS News Coverage Log")
    L.append("")
    L.append("> **Purpose — do-not-repeat tracker.** Every story below has already been published in TIMPS PostCards (daily) or TIMPS Deep Dives (articles). When writing a new issue, treat this list as *used news*: if a candidate overlaps an entry here (same story, same core fact, same company event), do NOT reuse it — pick genuinely new news so every day stays unique.")
    L.append("")
    L.append("**Regenerate after publishing:** `python3 update_coverage_log.py`")
    L.append("")
    L.append("**How to use:** search this file for a candidate's keywords before finalising a future issue. A match on headline angle, central fact, or company-story means it is already covered — skip it.")
    L.append("")
    L.append(f"**Coverage: {len(issues)} daily issues + {len(arts)} deep dives · regenerated {today}**")
    L.append("")
    L.append("---")
    L.append("")
    L.append("## Daily PostCards — already covered (newest first)")
    L.append("")
    for it in sorted(issues, key=lambda x: x["date"], reverse=True):
        L.append(f"### Issue {it['issue']} · {it['date']} · `{it['file']}`")
        L.append("")
        for s in it["stories"]:
            L.append(f"- **[{s['chip'].strip()}]** {s['headline']}")
            if s["deck"]:
                L.append(f"  - _{s['deck']}_")
            real = [(t, u) for t, u in s["links"] if u != "#"]
            if real:
                L.append("  - Source: " + "; ".join(f"[{t}]({u})" for t, u in real))
            elif s["links"]:
                L.append("  - Source: " + ", ".join(t for t, _ in s["links"]))
            L.append("")
        if it["signals"]:
            L.append("  **Signals / briefs:**")
            for sg in it["signals"]:
                L.append(f"  - {sg}")
            L.append("")
    L.append("---")
    L.append("")
    L.append("## Deep Dive Articles — already covered")
    L.append("")
    for a in arts:
        L.append(f"- **№ {a['no']} — {a['title']}** (`{a['file']}.html`)")
        if a["tag"]:
            L.append(f"  - {a['tag']}")
        if a["deck"]:
            L.append(f"  - _{a['deck']}_")
        if a["byline"]:
            L.append(f"  - {a['byline']}")
        L.append("")

    with open(OUT, "w", encoding="utf-8") as f:
        f.write("\n".join(L))
    print(f"Wrote {OUT} ({len(issues)} issues, {len(arts)} articles)")


def main():
    issues = [parse_daily(p) for p in sorted(glob.glob(f"{ROOT}/timps-postcards-*.html"))]
    render(issues, parse_articles())


if __name__ == "__main__":
    main()