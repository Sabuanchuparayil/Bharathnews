#!/usr/bin/env python3
"""
Generate all brand icons (favicon, PWA, Apple, OG) from the master logo.

Source: scripts/assets/brand-logo-source.png  (tricolor "B" vortex on navy)
The logo is never stretched — it is centered on a square/landscape navy canvas
sampled from the artwork itself, preserving the original look.

Requires Pillow. One-off helper:
    python3 -m venv /tmp/imgvenv && /tmp/imgvenv/bin/pip install Pillow
    /tmp/imgvenv/bin/python scripts/generate-brand-icons.py
"""
import os
from PIL import Image

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC = os.path.join(ROOT, "scripts", "assets", "brand-logo-source.png")
PUB = os.path.join(ROOT, "public")
ICONS = os.path.join(PUB, "icons")
os.makedirs(ICONS, exist_ok=True)


def sample_bg(img):
    """Average the four corners to get the navy backdrop color."""
    w, h = img.size
    pts = [(2, 2), (w - 3, 2), (2, h - 3), (w - 3, h - 3)]
    px = [img.getpixel(p) for p in pts]
    r = sum(p[0] for p in px) // len(px)
    g = sum(p[1] for p in px) // len(px)
    b = sum(p[2] for p in px) // len(px)
    return (r, g, b, 255)


def square_canvas(logo, bg, scale=1.0):
    """Center the logo on a square navy canvas. scale<1 adds safe-zone padding."""
    side = int(round(max(logo.size) / scale))
    canvas = Image.new("RGBA", (side, side), bg)
    x = (side - logo.width) // 2
    y = (side - logo.height) // 2
    canvas.alpha_composite(logo, (x, y))
    return canvas


def resized(canvas, size):
    return canvas.resize((size, size), Image.LANCZOS)


def main():
    logo = Image.open(SRC).convert("RGBA")
    bg = sample_bg(logo)
    print(f"Sampled navy background: #{bg[0]:02x}{bg[1]:02x}{bg[2]:02x}")

    # "any" icons: minimal margin, logo fills the square edge-to-edge
    any_sq = square_canvas(logo, bg, scale=0.98)
    # maskable icons: ~78% safe zone so circular/squircle masks don't clip the logo
    mask_sq = square_canvas(logo, bg, scale=0.78)

    outputs = {
        "icons/icon-192x192.png": (any_sq, 192),
        "icons/icon-512x512.png": (any_sq, 512),
        "icons/icon-maskable-192x192.png": (mask_sq, 192),
        "icons/icon-maskable-512x512.png": (mask_sq, 512),
        "icons/apple-touch-icon.png": (any_sq, 180),
        # crisp square logo mark for in-app UI (header/footer/install card)
        "logo-mark.png": (any_sq, 256),
    }
    for rel, (canvas, size) in outputs.items():
        out = resized(canvas, size)
        if rel == "icons/apple-touch-icon.png":
            out = out.convert("RGB")  # Apple icons must be opaque
        out.save(os.path.join(PUB, rel))
        print(f"  wrote public/{rel} ({size}x{size})")

    # favicon.ico — full logo, multi-resolution (ensure source is large enough)
    ico_src = any_sq if any_sq.width >= 256 else any_sq.resize((256, 256), Image.LANCZOS)
    ico_src.save(
        os.path.join(PUB, "favicon.ico"),
        sizes=[(16, 16), (32, 32), (48, 48), (64, 64)],
    )
    print("  wrote public/favicon.ico (16/32/48/64)")

    # og-default.png — 1200x630 social card, logo centered on navy
    if logo.width == 0 or logo.height == 0:
        raise ValueError(f"Source image has invalid dimensions: {logo.size}")
    og = Image.new("RGBA", (1200, 630), bg)
    target_h = 540
    ratio = target_h / logo.height
    lw, lh = int(logo.width * ratio), target_h
    logo_og = logo.resize((lw, lh), Image.LANCZOS)
    og.alpha_composite(logo_og, ((1200 - lw) // 2, (630 - lh) // 2))
    og.convert("RGB").save(os.path.join(PUB, "og-default.png"), quality=90)
    print("  wrote public/og-default.png (1200x630)")

    print("Done.")


if __name__ == "__main__":
    main()
