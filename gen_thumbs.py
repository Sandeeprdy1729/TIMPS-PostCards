import os, re, subprocess, shutil

POSTCARDS_DIR = "."
THUMBS_DIR = "thumbs"
NEW_STYLE_DIR = os.path.join("samples", "new-style")
NEW_STYLE_OUT = os.path.join(NEW_STYLE_DIR, "out")
os.makedirs(THUMBS_DIR, exist_ok=True)
os.makedirs(NEW_STYLE_OUT, exist_ok=True)

files = sorted(f for f in os.listdir(POSTCARDS_DIR)
               if f.startswith("timps-postcards-") and f.endswith(".html"))

mappings = []

for idx, fname in enumerate(files):
    html = open(os.path.join(POSTCARDS_DIR, fname)).read()
    date = fname.replace("timps-postcards-", "").replace(".html", "")

    m = re.search(r'<(?:h[12]|div) class="card-headline[^"]*">(.+?)</(?:h[12]|div)>', html)
    headline = m.group(1) if m else "TIMPS PostCards"
    headline_clean = re.sub(r'<[^>]+>', '', headline).strip()

    m2 = re.search(r'<span>Issue (\d+)</span>', html)
    issue = m2.group(1) if m2 else date

    mappings.append((date, issue, headline_clean))
    print(f"  parsed: {date} issue={issue} {headline_clean[:60]}")

# Run topic mapping first to get icon names
print(f"\nMapping headlines to icons...")
icon_map = {}
for date, issue, headline in mappings:
    result = subprocess.run(
        ["node", "-e", f"const {{mapTopicToIcon}} = require('./topic-map'); console.log(mapTopicToIcon('{headline.replace("'", "\\'")}'))"],
        cwd=NEW_STYLE_DIR,
        capture_output=True,
        text=True,
    )
    icon_name = result.stdout.strip() if result.returncode == 0 else "chip"
    icon_map[date] = icon_name

# Write _mapping.txt in tab-separated format for generate.js
mapping_path = os.path.join(THUMBS_DIR, "_mapping.txt")
with open(mapping_path, "w") as f:
    for date, issue, headline in mappings:
        icon = icon_map.get(date, "chip")
        f.write(f"{date}\t{issue}\tthumb-{date}.svg\t{headline}\t{icon}\n")

print(f"\nWrote {len(mappings)} entries to {mapping_path}")

# Run the Node.js renderer
print(f"\nRunning new-style renderer...")
result = subprocess.run(
    ["node", "generate.js", "--map-all"],
    cwd=NEW_STYLE_DIR,
    capture_output=True,
    text=True,
)

if result.returncode != 0:
    print(f"Renderer error:\n{result.stderr}")
    raise SystemExit(1)

print(result.stdout)

# Copy generated SVGs from samples/new-style/out/ to thumbs/
copied = 0
for fname in os.listdir(NEW_STYLE_OUT):
    if fname.startswith("thumb-") and fname.endswith(".svg"):
        src = os.path.join(NEW_STYLE_OUT, fname)
        dst = os.path.join(THUMBS_DIR, fname)
        shutil.copy2(src, dst)
        copied += 1

print(f"Copied {copied} thumbnails to {THUMBS_DIR}/")
print(f"\nDone — {copied} hand-inked thumbnails in {THUMBS_DIR}/")
