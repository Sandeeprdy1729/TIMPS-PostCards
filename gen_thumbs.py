import os, re, hashlib
from xml.sax.saxutils import escape

POSTCARDS_DIR = "."
THUMBS_DIR = "thumbs"
os.makedirs(THUMBS_DIR, exist_ok=True)

files = sorted(f for f in os.listdir(POSTCARDS_DIR)
               if f.startswith("timps-postcards-") and f.endswith(".html"))

COLORS = [
    ("#DCF07A", "#1C2E22"),  # lime
    ("#C8E4F8", "#2A4A6B"),  # sky blue
    ("#F8D4E8", "#6B2A4A"),  # blush pink
    ("#D4EDD8", "#2A6B4A"),  # sage green
    ("#F8ECD4", "#6B5A2A"),  # warm apricot
    ("#DED4F8", "#4A2A6B"),  # soft lavender
    ("#D4F8EC", "#2A6B5A"),  # cool mint
    ("#F8E0C8", "#6B3A2A"),  # peach
    ("#E8F8D4", "#4A6B2A"),  # pale lime
]

def hash_seed(text):
    return int(hashlib.md5(text.encode()).hexdigest(), 16)

def pseudo_rand(seed, i):
    return (seed >> (i * 7)) & 0xFFFF

def pseudo_float(seed, i):
    return (pseudo_rand(seed, i) % 1000) / 1000.0

def gen_svg(title, bg_color, fg_color, seed):
    r = lambda i: pseudo_float(seed, i)
    
    # Choose a composition style based on seed
    style_idx = seed % 5
    
    circles = []
    lines = []
    polys = []
    
    opacity = 0.12
    
    if style_idx == 0:
        # Overlapping circles
        for i in range(6):
            cx = 20 + r(i*2) * 60
            cy = 15 + r(i*2+1) * 70
            cr = 8 + r(i*3) * 28
            circles.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cr:.1f}" fill="{fg_color}" opacity="{opacity + r(i*4) * 0.15}" />')
    
    elif style_idx == 1:
        # Diagonal lines
        for i in range(8):
            x1 = r(i*2) * 100
            y1 = r(i*2+1) * 88
            x2 = r(i*3) * 100
            y2 = r(i*3+1) * 88
            w = 1 + r(i*4) * 4
            lines.append(f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{fg_color}" stroke-width="{w:.1f}" opacity="{opacity * 1.5}" />')
    
    elif style_idx == 2:
        # Dots pattern
        for i in range(15):
            cx = 5 + r(i*2) * 90
            cy = 5 + r(i*2+1) * 78
            cr = 2 + r(i*3) * 6
            circles.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cr:.1f}" fill="{fg_color}" opacity="{opacity * 0.8}" />')
    
    elif style_idx == 3:
        # Triangles
        for i in range(5):
            pts = []
            for j in range(3):
                pts.append(f"{20 + r(i*3+j*2)*60:.1f},{15 + r(i*3+j*2+1)*58:.1f}")
            polys.append(f'<polygon points="{" ".join(pts)}" fill="{fg_color}" opacity="{opacity * 1.2}" />')
    
    elif style_idx == 4:
        # Vertical bars
        for i in range(8):
            x = 5 + i * 11 + r(i) * 3
            h = 15 + r(i*2) * 55
            w = 4 + r(i*3) * 6
            polys.append(f'<rect x="{x:.1f}" y="{88-h:.1f}" width="{w:.1f}" height="{h:.1f}" fill="{fg_color}" opacity="{opacity * 0.9}" rx="{w/2:.1f}" />')
    
    # Always add a couple accent shapes
    accent_op = 0.25
    for i in range(3):
        cx = 20 + r(i*7) * 60
        cy = 15 + r(i*7+1) * 58
        cr = 3 + r(i*7+2) * 10
        circles.append(f'<circle cx="{cx:.1f}" cy="{cy:.1f}" r="{cr:.1f}" fill="{fg_color}" opacity="{accent_op - r(i)*0.05}" />')
    
    # SIGIL: unique icon based on title hash
    sigil_seed = hash_seed(title + "_sigil")
    sr = lambda i: pseudo_float(sigil_seed, i)
    
    # Simple sigil - 4 horizontal bars with varying widths
    sigil_cx, sigil_cy = 50, 44
    sigil = []
    for i in range(4):
        sw = 12 + sr(i) * 24
        sy = sigil_cy - 12 + i * 8
        sigil.append(f'<rect x="{sigil_cx - sw/2:.1f}" y="{sy:.1f}" width="{sw:.1f}" height="3" rx="1.5" fill="{fg_color}" opacity="0.7" />')
    
    elements = circles + lines + polys + sigil
    random.shuffle(elements)
    
    svg = f'''<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 88">
  <rect width="100" height="88" fill="{bg_color}" />
  {"  ".join(elements)}
</svg>'''
    return svg

import random

mappings = []

for idx, fname in enumerate(files):
    html = open(os.path.join(POSTCARDS_DIR, fname)).read()
    date = fname.replace("timps-postcards-", "").replace(".html", "")
    
    # Extract headline
    m = re.search(r'<h[12] class="card-headline[^"]*">(.+?)</h[12]>', html)
    headline = m.group(1) if m else "TIMPS PostCards"
    headline_clean = re.sub(r'<[^>]+>', '', headline).strip()
    
    # Extract issue number
    m2 = re.search(r'<span>Issue (\d+)</span>', html)
    issue = m2.group(1) if m2 else date
    
    bg, fg = COLORS[idx % len(COLORS)]
    seed = hash_seed(headline_clean)
    
    svg_content = gen_svg(headline_clean, bg, fg, seed)
    thumb_name = f"thumb-{date}.svg"
    thumb_path = os.path.join(THUMBS_DIR, thumb_name)
    
    with open(thumb_path, "w") as f:
        f.write(svg_content)
    
    mappings.append((date, headline_clean, thumb_name, issue, bg))
    print(f"  {thumb_name:40s} ← {headline_clean[:50]}")

# Write index mapping for easy reference
with open(os.path.join(THUMBS_DIR, "_mapping.txt"), "w") as f:
    for date, headline, thumb, issue, bg in mappings:
        f.write(f"{date}\t{issue}\t{thumb}\t{headline}\n")

print(f"\nDone — {len(mappings)} thumbnails generated in {THUMBS_DIR}/")
