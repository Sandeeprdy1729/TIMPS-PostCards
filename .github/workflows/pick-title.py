#!/usr/bin/env python3
"""Extract the lead story title/body from a daily issue or deep-dive page."""
import re
import sys
import html


def text(s):
    return re.sub(r"\s+", " ", html.unescape(re.sub(r"<[^>]+>", "", s))).strip()


def grab(doc, pat):
    m = re.search(pat, doc, re.S)
    return text(m.group(1)) if m else ""


def main():
    doc = open(sys.argv[1], encoding="utf-8").read()
    if sys.argv[1].startswith("daily/"):
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

    def clip(s, n):
        return s if len(s) <= n else s[: n - 1].rstrip() + "\u2026"

    print(clip(title, 110))
    print(clip(body, 160))


if __name__ == "__main__":
    main()