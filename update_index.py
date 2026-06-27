#!/usr/bin/env python3
"""
Add a new issue to the TIMPS PostCards index.

Usage:
    python update_index.py timps-postcards-2026-06-20.html \\
        --title "The Issue Title" \\
        --excerpt "PLUS: Five signals on..."

Run with --dry-run to preview changes without modifying anything.
"""

import argparse
import re
import sys
from pathlib import Path


def extract_issue_info(filepath):
    with open(filepath) as f:
        content = f.read()
    date_match = re.search(r'<span>(\w+ \d+, \d{4})</span>', content)
    if not date_match:
        date_match = re.search(r'(\w+ \d+, \d{4})', content)
    if not date_match:
        print(f"Error: Could not find date in {filepath}")
        sys.exit(1)
    date_str = date_match.group(1)
    date_str = date_str[0].upper() + date_str[1:].lower() if date_str.isupper() else date_str
    issue_match = re.search(r'[Ii]ssue (\d+)', content)
    if not issue_match:
        issue_match = re.search(r'No\. (\d+)', content)
    if not issue_match:
        print(f"Error: Could not find issue number in {filepath}")
        sys.exit(1)
    issue_num = issue_match.group(1)
    return date_str, issue_num


def update_index_html(new_file, title, excerpt, dry_run=False):
    date_str, issue_num = extract_issue_info(new_file)
    index_path = Path('index.html')
    with open(index_path) as f:
        content = f.read()

    # 1. Update the "Read Latest Issue" button href
    btn_match = re.search(
        r'<a href="([^"]+)" class="btn-chunky filled">Read Latest Issue</a>',
        content,
    )
    if btn_match:
        old_file = btn_match.group(1)
        content = content.replace(
            f'href="{old_file}" class="btn-chunky filled">Read Latest Issue',
            f'href="{new_file.name}" class="btn-chunky filled">Read Latest Issue',
        )
    else:
        print("Warning: Could not find 'Read Latest Issue' button")

    # 2. Read current issue count from the stats strip
    stats_match = re.search(
        r'<span class="signal-num">(\d+)</span>\s*<span class="signal-lbl">Issues published</span>',
        content,
    )
    current_count = int(stats_match.group(1)) if stats_match else 0

    # 3. Downgrade the old latest card (remove .latest class, swap badge)
    content = re.sub(
        r'(<a href=")[^"]*(" class="post-card) latest(">)',
        r'\1\2\3',
        content,
        count=1,
    )
    content = content.replace(
        '<span class="badge lime">Latest</span>',
        f'<span class="badge">No. {current_count:03d}</span>',
        1,
    )

    # 4. Bump stats
    content = content.replace(
        f'<span class="signal-num">{current_count:03d}</span>',
        f'<span class="signal-num">{current_count + 1:03d}</span>',
        1,
    )
    content = content.replace(
        f'<span class="archive-count">{current_count:03d} issues</span>',
        f'<span class="archive-count">{current_count + 1:03d} issues</span>',
        1,
    )

    # 5. Build new post card
    new_card = f'''    <!-- Issue {issue_num} \u2013 Latest -->
    <a href="{new_file.name}" class="post-card latest">
      <div class="post-thumb">
        <svg viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg">
          <rect x="8" y="10" width="44" height="8" rx="3" fill="#1C2E22"/>
          <rect x="24" y="18" width="12" height="34" rx="3" fill="#1C2E22"/>
        </svg>
      </div>
      <div class="post-content">
        <div class="post-meta-row">
          <span class="post-date">{date_str}</span>
          <span class="badge lime">Latest</span>
        </div>
        <h3 class="post-title">{title}</h3>
        <p class="post-excerpt">{excerpt}</p>
        <div class="post-author-row">
          <div class="author-dot">
            <svg viewBox="0 0 60 60" fill="none"><rect x="8" y="10" width="44" height="8" rx="3" fill="#DCF07A"/><rect x="24" y="18" width="12" height="34" rx="3" fill="#DCF07A"/></svg>
          </div>
          <span class="author-lbl">TIMPS Team \u00b7 8 min read</span>
        </div>
      </div>
    </a>'''

    # Insert new card at top of post-list
    post_list_match = re.search(r'<div class="post-list" id="postList">', content)
    if post_list_match:
        insert_pos = post_list_match.end()
        content = content[:insert_pos] + '\n' + new_card + '\n\n' + content[insert_pos:]

    if dry_run:
        print("[DRY RUN] Would update index.html:")
        print(f"  New issue #{issue_num}: {new_file.name}")
        print(f"  Date: {date_str}")
        print(f"  Title: {title}")
        print(f"  Excerpt: {excerpt}")
        print(f"  Issue count: {current_count:03d} \u2192 {current_count + 1:03d}")
        print(f"  Latest button: {getattr(btn_match, 'group', lambda: ['?'])(1) if btn_match else '?'} \u2192 {new_file.name}")
    else:
        with open(index_path, 'w') as f:
            f.write(content)
        print(f"\u2705 Updated index.html")
        print(f"  New issue #{issue_num}: {new_file.name}")
        print(f"  Issue count: {current_count:03d} \u2192 {current_count + 1:03d}")


if __name__ == '__main__':
    parser = argparse.ArgumentParser(
        description='Add a new TIMPS PostCards issue to the archive',
    )
    parser.add_argument('file', help='Path to the new issue HTML file')
    parser.add_argument('--title', required=True, help='Issue title for the archive card')
    parser.add_argument('--excerpt', required=True, help='Issue excerpt for the archive card')
    parser.add_argument('--dry-run', action='store_true', help='Preview without modifying files')
    args = parser.parse_args()
    update_index_html(Path(args.file), args.title, args.excerpt, args.dry_run)
