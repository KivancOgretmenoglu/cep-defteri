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
| `app` | Genel uygulama sahnesi: `lines`, `phone` (`img` ya da `scroll`), `chips`, `taps`, `mascot` | 3 sn |
| `bursStory` | Burs yattı bildirimi → alışveriş → "2 gün sonra" | 5 sn |
| `tostStory` | Tost mu, yemekhane mi? → 22 günlük hesap | 5,2 sn |
| `subsStory` | Unuttuğun abonelikler → dedektif Fıstık İPTAL damgaları | 5 sn |
| `debtStory` | Karamel: "Yarın veririm" → 3 ay sonra "Hangi 120?" | 5,6 sn |
| `examStory` | Sınav haftası gecesi → hatırlatma → sınav haftası modu | 5,4 sn |
| `pov` | Telefon ekranı adımları (`steps`: `img`, `scroll`, `seq`), `taps`, `chips`, `stopwatch`, `mascot` | serbest |
| `chat` | Grup sohbeti (`people`, `messages`, `typing`) | serbest |
| `talk` | Konuşan kafa Fıstık (`poses`, `talk`, `shake`) | serbest |
| `lineup` | Beş maskot sıra hâlinde | 2,5 sn |
| `end` | Logosuz kapanış: Fıstık (+ `friend`) ve @cep_defteri | 3 sn |

### Müzik türleri
Reels düzeyinde `"musicPlan": [[başla, bitir, tür], ...]`. Türler: `chip` (8-bit, 120 BPM), `lofi` (84 BPM,
elektrik piyano, plak cızırtısı, bant titremesi), `horror` (uğultu, uyumsuz yaylı, hızlanan kalp atışı),
`quiz` (yarışma programı: 132 BPM swing, bakır nefesliler, yürüyen bas). Bölümler arasında boşluk bırakılabilir
(ör. korku vuruşundan sonra sessizlik). Plan yoksa eski chiptune düzeni kullanılır.

### Yaratıcı hook sahneleri (`hooks.js`)
| Tür | İçerik |
|---|---|
| `dread` | Karanlık oda, 3-2-1 geri sayım, titreyen Fıstık, banka ekranı çarpması (`scare`) |
| `coffeeQuiz` | Yarışma sahnesi, geri sayım halkası, cevap sayacı, bayılan sunucu (`reveal`, `up`, `price`) |
| `persona` | Altı siluet → maskot kartları tek tek (`c0`, `d`); özellik yazıları `boxes` ile |

### Ekranlar
`assets/ui2/` uygulamanın güncel hâlidir: uygulamayı çalıştırıp `node promo/tools/capture.mjs` ile yenilenir.
`assets/ui/` eski arayüzden kalmıştır (önceki reelslerde kullanılıyor).

### Organik (reklam gibi durmayan) reelsler
Reels düzeyinde `boxes` (Instagram yazı kutusu: `[başla, bitir, html, y]`), `captions` (otomatik altyazı),
`handheld` (elde çekim titremesi), `babble` (Fıstık altyazıyla konuşur), `musicGain`, `noMusicVariant`
(trend ses eklemek için `<ad>-muziksiz.wav`; mp4'e `ffmpeg -map` ile eklenir). Açıklama metinleri ve hook
testleri: `brand/reels-metinleri.md`.

Seçenekler:
- `poster`: girişler ilk karede tamamlanmış olur. Videonun ilk sahnesinde kullanılır, çünkü ilk kare kapak olur.
- `skip`: sahneye bu kadar saniye ileriden başlanır (baştaki boşluğu keser).
- `flash`: açılışta beyaz flaş ve patlama sesi.

Kısa reels için 10–12 sn önerilir: kanca + hikâye (`*Story`), uygulama ekranı (`app`), `outro`.
Hikâye sahneleri `stories.js`, sesleri `audio.py` içindeki `cue_<sahne>` fonksiyonlarındadır.

Reels düzeyinde `"music": { "gaps": [[a, b]], "lowpass": [[a, b]] }`: müzik a–b arasında bant gibi durur
ya da boğuklaşır (komik dönüşlerde efektlere yer açmak için).

Uygulama ekranları `assets/ui/` altındadır (örnek veri modundan çekildi). Maskot pozları `assets/sprites.json` içindedir (uygulamanın kendi çiziminden üretildi).
