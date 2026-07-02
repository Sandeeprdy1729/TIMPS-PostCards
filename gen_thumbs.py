import os, re, hashlib

POSTCARDS_DIR = "."
THUMBS_DIR = "thumbs"
os.makedirs(THUMBS_DIR, exist_ok=True)

files = sorted(f for f in os.listdir(POSTCARDS_DIR)
               if f.startswith("timps-postcards-") and f.endswith(".html"))

COLORS = [
    ("#FAF9F5", "#141413"),
    ("#F7F5F0", "#2A2A28"),
    ("#F3F0EA", "#1E2E2A"),
    ("#FAF7F2", "#2C2020"),
    ("#F5F4F0", "#1A2A38"),
    ("#F8F6F0", "#1A2828"),
    ("#F7F3EE", "#282028"),
    ("#F4F3EE", "#1E2A1E"),
    ("#F6F4F0", "#262838"),
]

def hash_seed(text):
    return int(hashlib.md5(text.encode()).hexdigest(), 16)

def pf(seed, i):
    return ((seed >> (i * 7)) & 0xFFFF) % 1000 / 1000.0

# ASCII art patterns (20 chars wide, variable height)
# Each pattern is a list of strings where:
#   # = solid, @ = medium, : = light, space = empty
ASCII_ARTS = [
    # 0: DESKTOP
    [
        "      _________      ",
        "     /         \\    ",
        "    |  #   #   |    ",
        "    |  #   #   |    ",
        "    |   ###    |    ",
        "    |         |    ",
        "    |  ::: :::|    ",
        "    |  # # # #|    ",
        "    |  ::: :::|    ",
        "    |         |    ",
        "     \\_______/     ",
        "       |   |       ",
        "       |   |       ",
        "      _|   |_      ",
    ],
    # 1: ROBOT
    [
        "      ########      ",
        "     ##      ##     ",
        "    ##  ####  ##    ",
        "    ##  #  #  ##    ",
        "    ##  ####  ##    ",
        "     ##      ##     ",
        "      ## ## ##      ",
        "       ##   ##      ",
        "     ### ## ###     ",
        "    ##   #   ##     ",
        "   ##   ###   ##    ",
        "   ##         ##    ",
        "    ##       ##     ",
        "      #######       ",
    ],
    # 2: PHONE
    [
        "       ______       ",
        "      /      \\     ",
        "     |  ####  |    ",
        "     |  #  #  |    ",
        "     |  #  #  |    ",
        "     |  #  #  |    ",
        "     |  #  #  |    ",
        "     |  ####  |    ",
        "     |  #  #  |    ",
        "     |  #  #  |    ",
        "     |  ####  |    ",
        "     |        |    ",
        "      \\______/     ",
    ],
    # 3: CONTROLLER
    [
        "    .-----------.    ",
        "   /             \\   ",
        "  |  @@@@  @@@@  |  ",
        "  |  @  @  @  @  |  ",
        "  |  @@@@  @@@@  |  ",
        "  |              |  ",
        "  |  ::::  ::::  |  ",
        "  |  ::::  ::::  |  ",
        "  |  ::::  ::::  |  ",
        "  |              |  ",
        "   \\  \\______/  /   ",
        "    '----------'    ",
    ],
    # 4: SERVER/TOWER
    [
        "    .-------------.",
        "   /               \\",
        "  |  ###   ---   ###|",
        "  |  ###  | |   ###|",
        "  |  ###   ---   ###|",
        "  |                 |",
        "  |  ###   ---   ###|",
        "  |  ###  | |   ###|",
        "  |  ###   ---   ###|",
        "  |                 |",
        "  |  ###   ---   ###|",
        "  |  ###  | |   ###|",
        "  |  ###   ---   ###|",
        "  |                 |",
        "   \\_______________/",
    ],
]

FONT_SIZE = 3.8
CHAR_W = FONT_SIZE * 0.55
CHAR_H = FONT_SIZE * 1.15

def render_ascii(art_lines, fg_color, bg_color, seed):
    sw = max(len(l) for l in art_lines)
    sh = len(art_lines)
    bx = (100 - sw * CHAR_W) / 2
    by = (88 - sh * CHAR_H) / 2
    pos = pf(seed, 0)

    els = []
    for yi, line in enumerate(art_lines):
        for xi, ch in enumerate(line):
            if ch == ' ':
                continue
            if ch == ',' or ch == '.' or ch == "'" or ch == '_' or ch == '-' or ch == '(' or ch == ')':
                xs = bx + xi * CHAR_W
                ys = by + yi * CHAR_H
                els.append(
                    f'<text x="{xs:.1f}" y="{ys:.1f}" '
                    f'font-size="{FONT_SIZE}" font-family="monospace" '
                    f'fill="{fg_color}" opacity="0.35">{ch}</text>'
                )
                continue
            if ch == '|' or ch == '/' or ch == '\\':
                xs = bx + xi * CHAR_W
                ys = by + yi * CHAR_H
                els.append(
                    f'<text x="{xs:.1f}" y="{ys:.1f}" '
                    f'font-size="{FONT_SIZE}" font-family="monospace" '
                    f'fill="{fg_color}" opacity="0.40">{ch}</text>'
                )
                continue
            if ch == ':' or ch == '@':
                xs = bx + xi * CHAR_W
                ys = by + yi * CHAR_H
                els.append(
                    f'<text x="{xs:.1f}" y="{ys:.1f}" '
                    f'font-size="{FONT_SIZE}" font-family="monospace" '
                    f'fill="{fg_color}" opacity="0.30">{ch}</text>'
                )
                continue
            if ch == '=':
                xs = bx + xi * CHAR_W
                ys = by + yi * CHAR_H
                els.append(
                    f'<text x="{xs:.1f}" y="{ys:.1f}" '
                    f'font-size="{FONT_SIZE}" font-family="monospace" '
                    f'fill="{fg_color}" opacity="0.50">{ch}</text>'
                )
                continue
            # # = solid
            xs = bx + xi * CHAR_W
            ys = by + yi * CHAR_H
            els.append(
                f'<text x="{xs:.1f}" y="{ys:.1f}" '
                f'font-size="{FONT_SIZE}" font-family="monospace" '
                f'fill="{fg_color}" opacity="0.55">{ch}</text>'
            )

    # sigil bars at bottom
    sr = lambda i: pf(seed, i + 10)
    for i in range(4):
        sw = 8 + sr(i) * 14
        sy = 72 + i * 5
        els.append(
            f'<rect x="{50 - sw / 2:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="1.5" '
            f'rx="0.75" fill="{fg_color}" opacity="0.20" />'
        )

    return f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 88">
  <rect width="100" height="88" fill="{bg_color}" />
  {"  ".join(els)}
</svg>'''


mappings = []

for idx, fname in enumerate(files):
    html = open(os.path.join(POSTCARDS_DIR, fname)).read()
    date = fname.replace("timps-postcards-", "").replace(".html", "")

    m = re.search(r'<(?:h[12]|div) class="card-headline[^"]*">(.+?)</(?:h[12]|div)>', html)
    headline = m.group(1) if m else "TIMPS PostCards"
    headline_clean = re.sub(r'<[^>]+>', '', headline).strip()

    m2 = re.search(r'<span>Issue (\d+)</span>', html)
    issue = m2.group(1) if m2 else date

    bg, fg = COLORS[idx % len(COLORS)]
    seed = hash_seed(headline_clean)
    art_idx = seed % len(ASCII_ARTS)

    svg_content = render_ascii(ASCII_ARTS[art_idx], fg, bg, seed)
    thumb_name = f"thumb-{date}.svg"
    thumb_path = os.path.join(THUMBS_DIR, thumb_name)

    with open(thumb_path, "w") as f:
        f.write(svg_content)

    mappings.append((date, headline_clean, thumb_name, issue, bg))
    print(f"  {thumb_name:40s} {issue:>4s} {headline_clean[:50]}")

with open(os.path.join(THUMBS_DIR, "_mapping.txt"), "w") as f:
    for date, headline, thumb, issue, bg in mappings:
        f.write(f"{date}\t{issue}\t{thumb}\t{headline}\n")

print(f"\nDone — {len(mappings)} ASCII art thumbnails in {THUMBS_DIR}/")
