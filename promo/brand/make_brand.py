"""Instagram profil görselleri: profil fotoğrafı ve öne çıkan hikâye kapakları.
Maskot pozları assets/sprites.json'dan (uygulamanın kendi çizimi) piksel piksel çizilir.
Kullanım: python3 promo/brand/make_brand.py → promo/brand/*.png
"""
import json, os
from PIL import Image, ImageDraw

HERE = os.path.dirname(os.path.abspath(__file__))
SP = json.load(open(os.path.join(HERE, '..', 'assets', 'sprites.json')))
ACC, SOFT, PAPER, CREAM, INK = '#AE4716', '#F8DCC8', '#F6EEE6', '#FFFCF6', '#2A1E1A'


def sprite(key, cell, crop=None):
    """Sprite'ı cell büyüklüğünde pikselle çizer; crop=(x0,y0,x1,y1) ızgara biriminde kırpar."""
    rects = SP[key]
    xs = [r[0] for r in rects] + [r[0] + r[2] for r in rects]
    ys = [r[1] for r in rects] + [r[1] + r[3] for r in rects]
    x0, y0, x1, y1 = crop or (min(xs), min(ys), max(xs), max(ys))
    im = Image.new('RGBA', (int((x1 - x0) * cell), int((y1 - y0) * cell)), (0, 0, 0, 0))
    d = ImageDraw.Draw(im)
    for x, y, w, h, f in rects:
        d.rectangle([round((x - x0) * cell), round((y - y0) * cell), round((x - x0 + w) * cell) - 1, round((y - y0 + h) * cell) - 1], fill=f)
    return im


def bbox(key):
    rects = SP[key]
    return (min(r[0] for r in rects), min(r[1] for r in rects), max(r[0] + r[2] for r in rects), max(r[1] + r[3] for r in rects))


def profile(name, key, bg, ring=None, size=1080, fill=0.78, crop=None, dy=0):
    im = Image.new('RGB', (size, size), bg)
    d = ImageDraw.Draw(im)
    if ring:
        r = size * 0.40
        d.ellipse([size / 2 - r, size / 2 - r, size / 2 + r, size / 2 + r], fill=ring)
    b = crop or bbox(key)
    gw, gh = b[2] - b[0], b[3] - b[1]
    cell = int(size * fill / max(gw, gh))  # tam sayı piksel: keskin kenarlar
    sp = sprite(key, cell, b)
    im.paste(sp, ((size - sp.width) // 2, (size - sp.height) // 2 + int(dy * size)), sp)
    im.save(os.path.join(HERE, name))
    return im


def peek(name, key, bg, size=1080, rows=19, fill=0.86):
    """Fıstık dairenin alt kenarından bakar: kırpılan kenar görselin altına oturur."""
    im = Image.new('RGB', (size, size), bg)
    b = bbox(key)
    crop = (b[0], b[1], b[2], b[1] + rows)
    cell = int(size * fill / (crop[2] - crop[0]))
    sp = sprite(key, cell, crop)
    im.paste(sp, ((size - sp.width) // 2 + int(cell * 0.5), size - sp.height), sp)
    im.save(os.path.join(HERE, name))


if __name__ == '__main__':
    for f in os.listdir(HERE):
        if f.startswith('profil-') and f.endswith('.png'):
            os.remove(os.path.join(HERE, f))
    peek('profil-1-turuncu.png', 'fistik|calm|null|mood', ACC)
    peek('profil-2-krem.png', 'fistik|calm|null|mood', SOFT)
    profile('profil-3-tam-boy.png', 'fistik|calm|null|mood', SOFT, fill=0.72, dy=0.02)
