#!/usr/bin/env python3
"""Extract the lead story and the five headlines from a daily issue page.

Default output (two lines, used by the push workflow):
    <title>
    <body>

With --json, emits the full Dynamic Island payload:
    {"title": ..., "body": ..., "issue": ..., "date": ...,
     "stories": [{"num","cat","label","headline","hash"}, ...]}
"""
import html
import json
import re
import sys


def text(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def grab(doc, pat):
    m = re.search(pat, doc, re.S)
    return text(m.group(1)) if m else ""


def clip(s, n):
    return s if len(s) <= n else s[: n - 1].rstrip() + "\u2026"


def meta(doc):
    """Issue number and date from the cover card."""
    m = re.search(
        r'<div class="cover-meta">\s*<span>(.*?)</span>\s*<span>(.*?)</span>',
        doc,
        re.S,
    )
    if not m:
        return "", ""
    return text(m.group(1)), text(m.group(2))


def stories(doc):
    """The five real stories: every non-`sm` card headline, in page order."""
    out = []
    pat = re.compile(r'<h2 class="card-headline([^"]*)">(.*?)</h2>', re.S)
    for m in pat.finditer(doc):
        classes = m.group(1)
        if "sm" in classes:
            continue
        before = doc[max(0, m.start() - 700) : m.start()]
        ids = re.findall(r'<div id="([^"]+)" class="story-card', before)
        if not ids:
            continue
        routine = re.search(r'<div class="card-routine">(.*?)</div>', before, re.S)
        routine_text = text(routine.group(1)) if routine else ""
        bits = [b.strip() for b in routine_text.split("\u00b7")]
        cat = bits[0] if bits else ""
        label = bits[1] if len(bits) > 1 else cat
        out.append(
            {
                "num": f"{len(out) + 1:02d}",
                "cat": cat,
                "label": label,
                "headline": text(m.group(2)),
                "hash": ids[-1],
            }
        )
        if len(out) == 5:
            break
    return out


def main(argv):
    args = [a for a in argv[1:] if not a.startswith("--")]
    as_json = "--json" in argv
    if not args:
        print("usage: pick-title.py [--json] <page.html>", file=sys.stderr)
        return 2

    path = args[0]
    doc = open(path, encoding="utf-8").read()
    is_daily = path.startswith("daily/") or "/daily/" in path

    if is_daily:
        title = grab(doc, r'<h2 class="card-headline lg">(.*?)</h2>') or grab(
            doc, r'<h2 class="card-headline[^"]*">(.*?)</h2>'
        )
        body = grab(doc, r'<div class="card-deck">(.*?)</div>')
    else:
        title = grab(doc, r'<h1 class="masthead-h">(.*?)</h1>')
        body = grab(doc, r'<p class="masthead-dek">(.*?)</p>')

    if not title:
        m = re.search(r"<title>(.*?)</title>", doc, re.S)
        title = text(m.group(1)) if m else ""
        title = re.sub(r"^TIMPS (?:PostCards|Articles)\s*[\u2014\u00b7-]\s*", "", title)

    issue, date = meta(doc)

    if as_json:
        print(
            json.dumps(
                {
                    "title": clip(title, 110),
                    "body": clip(body, 160),
                    "issue": issue,
                    "date": date,
                    "stories": stories(doc) if is_daily else [],
                },
                ensure_ascii=False,
            )
        )
        return 0

    print(clip(title, 110))
    print(clip(body, 160))
    return 0


if __name__ == "__main__":
    sys.exit(main(sys.argv))
