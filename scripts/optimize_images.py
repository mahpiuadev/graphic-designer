#!/usr/bin/env python3
"""
Optimiza las imágenes de un proyecto: las convierte a WebP en 3 tamaños
y te imprime el bloque JSON listo para pegar en data/projects.json.

Requisitos (una sola vez):   pip install pillow
Uso:                         python scripts/optimize_images.py assets/projects/mi-proyecto

Qué hace con cada imagen (jpg, jpeg, png, tiff, bmp, webp):
  nombre-480.webp, nombre-960.webp, nombre-1600.webp   (solo si la original es más grande)
Las originales NO se borran: cuando termines, elimínalas o muévelas fuera
del repositorio para que la web no pese de más.
"""
import json
import sys
from pathlib import Path

try:
    from PIL import Image, ImageOps
except ImportError:
    sys.exit("Falta Pillow. Instálalo con:  pip install pillow")

WIDTHS = (480, 960, 1600)
QUALITY = 82
EXTS = {".jpg", ".jpeg", ".png", ".tif", ".tiff", ".bmp", ".webp"}


def main(folder: Path) -> None:
    if not folder.is_dir():
        sys.exit(f"No existe la carpeta: {folder}")

    sources = sorted(
        p for p in folder.iterdir()
        if p.suffix.lower() in EXTS and not any(p.stem.endswith(f"-{w}") for w in WIDTHS)
    )
    if not sources:
        sys.exit("No se encontraron imágenes para optimizar en esa carpeta.")

    entries = []
    for src in sources:
        with Image.open(src) as im:
            im = ImageOps.exif_transpose(im)
            if im.mode not in ("RGB", "RGBA"):
                im = im.convert("RGB")
            w, h = im.size
            variants = []
            for target in WIDTHS:
                if w < target and variants:
                    break  # no ampliamos imágenes pequeñas
                tw = min(target, w)
                th = round(h * tw / w)
                out = folder / f"{src.stem}-{target}.webp"
                im.resize((tw, th), Image.LANCZOS).save(out, "WEBP", quality=QUALITY, method=6)
                variants.append((tw, out.name, out.stat().st_size))
        largest = variants[-1]
        entries.append({
            "src": f"{folder.as_posix()}/{largest[1]}",
            "srcset": ", ".join(f"{folder.as_posix()}/{name} {tw}w" for tw, name, _ in variants),
            "alt": "DESCRIBE AQUÍ LA IMAGEN",
            "width": largest[0],
            "height": round(h * largest[0] / w),
        })
        kb = sum(s for _, _, s in variants) // 1024
        print(f"✓ {src.name}: {len(variants)} tamaños, {kb} KB en total")

    print("\nPega esto dentro de \"images\" (y usa el primero como \"cover\") en data/projects.json.")
    print("Recuerda rellenar el campo \"alt\" de cada imagen:\n")
    print(json.dumps(entries, ensure_ascii=False, indent=2))


if __name__ == "__main__":
    if len(sys.argv) != 2:
        sys.exit(__doc__)
    main(Path(sys.argv[1]))
