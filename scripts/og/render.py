"""Рендерить og-card.html у public/og/og-<lang>.png (1200×630).
Потрібно: pip install playwright pillow && playwright install chromium
Запуск з кореня проєкту: python3 scripts/og/render.py"""
import io, pathlib
from playwright.sync_api import sync_playwright
from PIL import Image

root = pathlib.Path(__file__).resolve().parents[2]
src = (root / "scripts/og/og-card.html").as_uri()
out = root / "public/og"; out.mkdir(parents=True, exist_ok=True)
with sync_playwright() as p:
    b = p.chromium.launch(args=["--no-sandbox"])
    pg = b.new_page(viewport={"width": 1200, "height": 630})
    for lang in ("uk", "en", "ru", "es"):
        pg.goto(f"{src}?lang={lang}"); pg.wait_for_timeout(200)
        im = Image.open(io.BytesIO(pg.screenshot())).convert("RGB")
        im.quantize(colors=128, method=Image.Quantize.MEDIANCUT, dither=Image.Dither.NONE).save(out / f"og-{lang}.png", optimize=True)
        print(lang, (out / f"og-{lang}.png").stat().st_size, "bytes")
    b.close()
