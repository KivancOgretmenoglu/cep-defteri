# Reels üretimi

Her reels `reels.json` içinde birkaç satırla tanımlanır; görüntü (`reel.js`) ve ses (`audio.py`)
aynı tanımdan üretilir.

```bash
promo/make.sh ay-sonu                         # → promo/out/ay-sonu.mp4
node promo/render.mjs still ay-sonu 0 2.5     # tek kareler (kapak kontrolü)
```

Gereksinimler: `npm install` (playwright-core), Python'da `numpy` ve `scipy`, `ffmpeg`.

## Yeni reels eklemek

```json
"yeni-ad": {
  "title": "Açıklama",
  "end": 10.0,
  "scenes": [
    ["daily", 0, { "poster": true, "skip": 0.5 }],
    ["outro", 5.5, { "flash": true, "sub": "Küçük satır", "accent": "Piksel vurgu", "cta": "Takipte kal" }]
  ]
}
```

Her sahne: `[tür, başlangıç saniyesi, seçenekler]`.

| Tür | İçerik | Doğal süre |
|---|---|---|
| `hook` | Ayın 1'i / 15'i / 30'u, "Tanıdık geldi mi?" | 4,5 sn |
| `brand` | "Bütçeni cebine koy." | 3 sn |
| `quickAdd` | 95 TL'yi 5 saniyede kaydetme | 4–5 sn |
| `daily` | Bugün ne kadar harcayabilirim? | 3–5 sn |
| `bills` | Faturalar, taksitler, abonelikler + ÖDENDİ damgaları | 4 sn |
| `savings` | Raporlar, birikim sayacı, hedef çubuğu | 3 sn |
| `mascots` | Beş maskot ve sesleri | 3 sn |
| `outro` | Logo, iki satır, düğme (`sub`, `accent`, `cta`) | 4 sn |

Seçenekler:
- `poster`: girişler ilk karede tamamlanmış olur. Videonun ilk sahnesinde kullanılır, çünkü ilk kare kapak olur.
- `skip`: sahneye bu kadar saniye ileriden başlanır (baştaki boşluğu keser).
- `flash`: açılışta beyaz flaş ve patlama sesi.

Kısa reels için 8–12 sn önerilir: ilk karede soru veya kanca, sonda `outro`.

Uygulama ekranları `assets/ui/` altındadır (örnek veri modundan çekildi). Maskot pozları `assets/sprites.json` içindedir (uygulamanın kendi çiziminden üretildi).
