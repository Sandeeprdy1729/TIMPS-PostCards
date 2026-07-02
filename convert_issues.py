#!/usr/bin/env python3
"""Convert all issue HTML files to match the new template structure."""

import re
import glob

TEMPLATE_FILE = "timps-postcards-2026-07-02.html"
EXCLUDE = {TEMPLATE_FILE, "index.html", "sample-postcard.html", "timps-postcards-2026-07-01.html.bak"}

# Read the template to get the CSS block and structural parts
with open(TEMPLATE_FILE) as f:
    template = f.read()

# Extract the <style> block from template
style_match = re.search(r'<style>(.*?)</style>', template, re.DOTALL)
new_css = style_match.group(1)

# Extract the Google Fonts link from template
fonts_match = re.search(
    r'(<link href="https://fonts\.googleapis\.com/css2\?family[^"]+" rel="stylesheet">)',
    template
)
new_fonts_link = fonts_match.group(1)

# Extract the nav block
nav_match = re.search(
    r'(<!-- NAV -->\s*<nav class="nav">.*?</nav>\s*)',
    template, re.DOTALL
)
new_nav = nav_match.group(1)

# Extract the sidebar + wrapper open
layout_open_match = re.search(
    r'(<div class="page-layout">\s*<!-- TOC SIDEBAR -->.*?<div class="wrapper">\s*)',
    template, re.DOTALL
)
new_layout_open = layout_open_match.group(1)

# Extract the page-layout close
layout_close_match = re.search(
    r'(</div> <!-- /wrapper -->\s*</div> <!-- /page-layout -->)',
    template
)
new_layout_close = layout_close_match.group(1)


def add_section_ids(html):
    """Add id attributes to known section elements for TOC navigation."""
    lines = html.split('\n')
    result = []
    cover_done = False
    story_count = 0
    signals_done = False
    themes_done = False
    tool_done = False
    sources_done = False

    for i, line in enumerate(lines):
        # Cover card
        if not cover_done and '<div class="cover-card"' in line:
            line = line.replace('<div class="cover-card"', '<div id="intro" class="cover-card section-anchor"', 1)
            cover_done = True
            result.append(line)
            continue

        # Story cards (first = lead, second = markets)
        if 'class="story-card' in line and '<div' in line and 'id=' not in line:
            story_count += 1
            if story_count == 1:
                line = line.replace('class="story-card', 'id="lead" class="story-card section-anchor', 1)
            elif story_count == 2:
                line = line.replace('class="story-card', 'id="markets" class="story-card section-anchor', 1)

        # Signals section (page-chip on the same or next line)
        if not signals_done and '<div' in line and 'id=' not in line:
            check = line + '\n' + (lines[i+1] if i+1 < len(lines) else '')
            if ('class="story-card' in line or 'class="signals-card' in line) and 'SIGNALS' in check and '<div class="page-chip"' in check:
                line = line.replace('class="story-card', 'id="signals" class="story-card section-anchor', 1)
                line = line.replace('class="signals-card', 'id="signals" class="signals-card section-anchor', 1)
                signals_done = True

        # Themes section
        if not themes_done and '<div' in line and 'id=' not in line:
            check = line + '\n' + (lines[i+1] if i+1 < len(lines) else '')
            if ('class="story-card' in line or 'class="themes-card' in line) and 'THEMES' in check and '<div class="page-chip"' in check:
                line = line.replace('class="story-card', 'id="themes" class="story-card section-anchor', 1)
                line = line.replace('class="themes-card', 'id="themes" class="themes-card section-anchor', 1)
                themes_done = True

        # Tool of the week
        if not tool_done and 'class="tool-week"' in line:
            line = line.replace('class="tool-week"', 'id="tool" class="tool-week section-anchor"', 1)
            tool_done = True

        # Sources section
        if not sources_done and 'class="output-card"' in line:
            line = line.replace('class="output-card"', 'id="sources" class="output-card section-anchor"', 1)
            sources_done = True
        if not sources_done and 'class="sources-card"' in line:
            line = line.replace('class="sources-card"', 'id="sources" class="sources-card section-anchor"', 1)
            sources_done = True
        if not sources_done and 'sources-title' in line and '<div' in line:
            line = line.replace('<div class="sources-title"', '<div id="sources" class="sources-title section-anchor"', 1)
            sources_done = True

        result.append(line)

    return '\n'.join(result)


def extract_content(old_html):
    """Extract the inner content from the old HTML structure.
    
    Content is everything between <div class="wrapper"> and the start of
    the footer section (footer-card or footer-bar).
    """
    patterns = [
        # wrapper ... footer-card
        (r'<div class="wrapper">(.*?)<div class="footer-card"', re.DOTALL),
        # wrapper ... footer-bar
        (r'<div class="wrapper">(.*?)<div class="footer-bar"', re.DOTALL),
        # wrapper ... </body> (no footer-card)
        (r'<div class="wrapper">(.*?)</div>\s*\n\s*</body>', re.DOTALL),
        # body directly
        (r'<body>(.*?)</body>', re.DOTALL),
    ]
    for pat, flags in patterns:
        m = re.search(pat, old_html, flags)
        if m:
            content = m.group(1).strip()
            if len(content) > 100:  # sanity check — real content should be long
                return content
    return None


def find_title_in_footer(html):
    """Extract issue info from old footer text."""
    m = re.search(r'Issue\s+\d+\s*[·–]\s*([\w\s,:]+?)\s*[·–]', html)
    if m:
        return m.group(1).strip()
    return None


# Get all issue files
issue_files = sorted(glob.glob("timps-postcards-*.html"))
issue_files = [f for f in issue_files if f not in EXCLUDE]

print(f"Found {len(issue_files)} issue files to convert")

for filepath in issue_files:
    print(f"\nProcessing {filepath}...")

    with open(filepath) as f:
        old_html = f.read()

    # 1. Extract issue info
    title_match = re.search(r'<title>(.*?)</title>', old_html)
    old_title = title_match.group(1) if title_match else "TIMPS PostCards"
    # Clean title: remove "TIMPS PostCards — " or "TIMPS PostCards · " prefix for footer
    footer_title = re.sub(r'^TIMPS PostCards [—·] ', '', old_title)

    # 2. Extract content
    inner_content = extract_content(old_html)
    if not inner_content:
        print(f"  ERROR: Could not extract content")
        continue

    # 3. Clean up old footer references in content
    inner_content = re.sub(r'<!--\s*FOOTER\s*-->', '', inner_content)
    inner_content = re.sub(r'<div class="footer-bar">.*?</div>', '', inner_content)

    # 4. Fix old highlight classes → use new hl-lime
    for old_cls in ("hl-terra", "hl-sage", "hl-lav"):
        inner_content = inner_content.replace(f'class="{old_cls}"', 'class="hl-lime"')
        inner_content = inner_content.replace(f'class="{old_cls} ', 'class="hl-lime" ')

    # 5. Add section IDs
    inner_content = add_section_ids(inner_content)

    # 6. Build footer
    new_footer = f'''  <!-- FOOTER -->
  <footer class="footer">
    <div class="footer-logo">
      <div class="footer-mark">
        <img src="timps_logo.svg" alt="TIMPS">
      </div>
      <span class="footer-brand">TIMPS PostCards</span>
    </div>
    <div class="footer-center">
      {footer_title}<br>
      Hyderabad, India
    </div>
    <div class="footer-right">
      <a href="index.html">Home</a><br>
      <a href="index.html#archive">Archive</a><br>
      &copy; 2026 TIMPS
    </div>
  </footer>'''

    # 7. Build the new complete HTML
    new_body = f'''{new_nav}

{new_layout_open}
  {inner_content}

  {new_footer}

{new_layout_close}'''

    new_html = f'''<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>{old_title}</title>
{new_fonts_link}
<style>
{new_css}
</style>
</head>
<body>
{new_body}
</html>'''

    # Write file
    with open(filepath, 'w') as f:
        f.write(new_html)

    print(f"  Done: {old_title}")

print("\nAll conversions complete!")
