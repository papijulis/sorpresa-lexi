#!/usr/bin/env python3
"""
optimize-images.py — Fase 5: optimiza las fotos de assets/img/.

Para cada *.jpeg en assets/img/ (que no esté ya dentro de originales/):
  1. Guarda una copia intacta en assets/img/originales/ (si no existe ya).
  2. Reescala el original (lado largo a MAX_EDGE) y lo re-guarda como
     assets/img/<nombre>.jpeg (JPEG progresivo, calidad JPEG_Q).
  3. Genera el hermano assets/img/<nombre>.webp (calidad WEBP_Q).

Nunca borra ni renombra assets/img/originales/*.jpeg — esos son la fuente
de verdad; vuelve a correr este script sobre ellos si cambias MAX_EDGE o
la calidad.

Requiere Pillow (pip install Pillow). Uso:
    python3 tools/optimize-images.py
"""
import os
import shutil
import sys

try:
    from PIL import Image, ImageOps
except ImportError:
    print("Falta Pillow. Instálalo con: pip install Pillow", file=sys.stderr)
    sys.exit(1)

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
SRC_DIR = os.path.join(ROOT, "assets", "img")
ORIG_DIR = os.path.join(SRC_DIR, "originales")
MAX_EDGE = 760
JPEG_Q = 72
WEBP_Q = 72


def main():
    os.makedirs(ORIG_DIR, exist_ok=True)

    names = sorted(f for f in os.listdir(SRC_DIR) if f.lower().endswith((".jpeg", ".jpg")))
    if not names:
        print("No hay .jpeg en assets/img/ para optimizar.")
        return

    total_before = 0
    total_jpeg = 0
    total_webp = 0

    for name in names:
        current_path = os.path.join(SRC_DIR, name)
        orig_path = os.path.join(ORIG_DIR, name)

        # La primera vez que se ve este archivo, se preserva el original
        # intacto. Si ya existe en originales/, ESA es la fuente de verdad
        # (así se puede re-correr el script sin perder calidad en cascada).
        source_path = orig_path if os.path.exists(orig_path) else current_path
        if not os.path.exists(orig_path):
            shutil.copy2(current_path, orig_path)

        before_size = os.path.getsize(source_path)
        total_before += before_size

        im = Image.open(source_path)
        im = ImageOps.exif_transpose(im)
        im = im.convert("RGB")
        w, h = im.size
        long_edge = max(w, h)
        if long_edge > MAX_EDGE:
            scale = MAX_EDGE / long_edge
            im = im.resize((max(1, round(w * scale)), max(1, round(h * scale))), Image.LANCZOS)

        im.save(current_path, "JPEG", quality=JPEG_Q, optimize=True, progressive=True)
        webp_path = os.path.splitext(current_path)[0] + ".webp"
        im.save(webp_path, "WEBP", quality=WEBP_Q, method=6)

        after_jpeg = os.path.getsize(current_path)
        after_webp = os.path.getsize(webp_path)
        total_jpeg += after_jpeg
        total_webp += after_webp

        print(f"{name}: {before_size/1024:.0f}KB -> jpeg {after_jpeg/1024:.0f}KB, "
              f"webp {after_webp/1024:.0f}KB, {im.size}")

    print()
    print(f"TOTAL original: {total_before/1024:.0f}KB")
    print(f"TOTAL jpeg:     {total_jpeg/1024:.0f}KB ({100*(1-total_jpeg/total_before):.0f}% menos)")
    print(f"TOTAL webp:     {total_webp/1024:.0f}KB ({100*(1-total_webp/total_before):.0f}% menos)")
    print()
    print("Recuerda correr: node tools/check-assets.js")


if __name__ == "__main__":
    main()
