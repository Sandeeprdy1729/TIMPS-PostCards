#!/usr/bin/env python3
"""Center-crop an image to 1600x900 and save as JPEG. Usage: python3 prep_img.py <in> <out> <date>"""
import sys, os

def main():
    if len(sys.argv) < 3:
        print("usage: prep_img.py <in> <out>"); sys.exit(1)
    src, dst = sys.argv[1], sys.argv[2]
    try:
        from PIL import Image
    except ImportError:
        print("PIL missing — /tmp image left for manual crop"); sys.exit(2)
    if not os.path.exists(src) or os.path.getsize(src) < 1000:
        print(f"missing/tiny input: {src}"); sys.exit(3)
    im = Image.open(src).convert("RGB")
    w, h = im.size
    target_ratio = 1600 / 900
    ratio = w / h
    if ratio < target_ratio:
        new_w = int(h * target_ratio)
        x0 = (w - new_w) // 2
        box = (x0, 0, x0 + new_w, h)
    else:
        new_h = int(w / target_ratio)
        y0 = (h - new_h) // 2
        box = (0, y0, w, y0 + new_h)
    im = im.crop(box).resize((1600, 900), Image.LANCZOS)
    im.save(dst, "JPEG", quality=88)
    print(f"OK {dst} ({w}x{h} -> 1600x900)")

if __name__ == "__main__":
    main()