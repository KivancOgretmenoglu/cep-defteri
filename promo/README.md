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
| `chat` | (ek) `font`: mesaj yazı boyu, `hits`: büyük cevap mesajlarının vuruş sesi anları |
| `chat` | Grup sohbeti (`people`, `messages`, `typing`) | serbest |
| `talk` | Konuşan kafa Fıstık (`poses`, `talk`, `shake`) | serbest |
| `lineup` | Beş maskot sıra hâlinde | 2,5 sn |
| `end` | Logosuz kapanış: Fıstık (+ `friend`) ve @cep_defteri | 3 sn |

### Müzik türleri
Reels düzeyinde `"musicPlan": [[başla, bitir, tür], ...]`. Türler: `chip` (8-bit, 120 BPM), `lofi` (84 BPM,
elektrik piyano, plak cızırtısı, bant titremesi), `horror` (uğultu, uyumsuz yaylı, hızlanan kalp atışı),
`quiz` (yarışma programı: 132 BPM swing, bakır nefesliler, yürüyen bas), `pop` (hafif tropik pop: 104 BPM,
el çırpma, marimba), `space` (uzay görevi: 112 BPM kare dalga arpej, yavaş pad, sekizlik bas), `thriller`
(kaçış odası gerilimi: 120 BPM, Dm–B♭–Gm–A sekizlik nabız bası, her vuruşta saat tiki, ölçü başında boğuk davul; ikinci
yarıda birbirine sürtünen yüksek yaylılar), `ragtime` (sessiz film piyanosu: honky-tonk akortlu piyano, sol elde
bas–akor, sağ elde senkoplu ezgi, eski kayıt gibi dar bant; seçenekler `bpm`, `minor` (Am–Dm–E7–Am, yoksa
C–A7–D7–G7), `soft` (seyrek ezgi, kısık bas), `gain` (bölümün yüksekliği)), `melodrama` (sessiz film gerilimi: piyanoda
alçak tremolo; `stab`: bölüm başından saniye, o anda vurucu akor; akor `ACC` kanalına gider, konuşmanın kısmasına uğramaz, o
yüzden iki satırın arasına konur; `stabGain`, `gain`, `cresc`). Bölümler arasında boşluk bırakılabilir (ör. korku vuruşundan
sonra sessizlik). Plan yoksa eski chiptune düzeni kullanılır.

Reels düzeyinde `"voiceDuck": {"release": 0.25, "music": 0.3, "amb": 0.7}`: konuşma altında müzik `music` tabanına kısılır
(varsayılan 0,3), kısma kelime aralarında hemen kalkmaz (`release` sn), `amb` verilirse yağmur gibi ortam sesi de kısılır.
Konuşma girişte zor duyuluyorsa önce o bölümün müziğini seyreltin (`soft`, `gain`); ölçmek için: konuşma sırasında müzik
konuşmanın ~18–24 dB altında olmalı.

### Yaratıcı hook sahneleri (`hooks.js`)
| Tür | İçerik |
|---|---|
| `dread` | Karanlık oda, 3-2-1 geri sayım, titreyen Fıstık, banka ekranı çarpması (`scare`) |
| `coffeeQuiz` | Yarışma sahnesi, geri sayım halkası, cevap sayacı, bayılan sunucu (`reveal`, `up`, `price`) |
| `persona` | Altı siluet → maskot kartları tek tek (`c0`, `d`); özellik yazıları `boxes` ile |

### Bilgi reelsleri (`value.js`)
| Tür | İçerik |
|---|---|
| `tagHook` | Hook: peşin/taksit etiketleri, `=` işareti `flip` anında `≠` olur |
| `percentHook` | Hook: hesap makinesine `text` yazılır, `stop` anında "YANLIŞ!" damgası |
| (reels düzeyi) `loop: true` | Müzik bitiş vuruşu ve sondaki kararma kapanır; son sahne olarak hook tekrar eklenirse video kendi içinde döner |
| `quiz` | Quiz: `items` (`t`, `q`, `opts` [A, B], `correct` 0/1, `why`, `color`, `bg`, `mascot`); şıklar gelir, 3-2-1 geri sayım, doğru şık yeşil patlar. `optAt`, `countAt`, `step` |
| `oppTag` | Sallanan fiyat etiketi: `flips` [[t, html, zemin, sayaç]] (html içinde `{HEADPH}`, `{TRAY}`, `{CUP}`, `{COIN}` pixel çizimleri, `<span class='cnt' data-to='15'>` sayaç), `countdown` [başla, adım], `pamuk` [[t, dance/shock/dumb/think/hit/faint]], `bilge` [t] |
| `lesson` | "Buna değer mi?" çizilir, "Bunun yerine ne alırdım?" damgalanır (yakınlaşma + sarsıntı): `a`, `strike`, `b` |
| (reels düzeyi) `captionPixel: true` | Altyazılar pixel fontla |
| `cards` | Bilgi kartları: `items` (`t`, `num`/`badge`, `title`, `body`, `ex` satırları, `big` + `bigTo` sayaç, `mascot`, `color`, `bg`). `bigDec`: ondalık basamak. `decor: {topic, props: "money"|"percent"}` + `dur`: üstte konu başlığı ve ilerleme çubuğu, arkada soluk dev numara ve süzülen pixel paralar/yüzdeler, sayı oturunca kıvılcım; `mascot.say`: maskotun tepki balonu |
| `cartHook` | Sepet ve "Siparişi onayla" düğmesinde tereddüt eden Fıstık |
| `pieHook` | Dönen 50/30/20 pasta grafiği |
| `mailHook` | Okul maili kartı ve kepli Fıstık |

Müzik türlerine `pop` (104 BPM, marimba, el çırpma) eklendi. Sıradaki konu fikirleri ve doğrulama notları:
`brand/icerik-fikirleri.md`.

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

## Seslendirme (ElevenLabs)

Reels'e `"voice": [[başlangıç_sn, "metin"], ...]` eklenir (isteğe bağlı `"voiceSettings"`). Sonra:

```bash
export ELEVENLABS_API_KEY=...          # ortam ayarlarından; sohbete yazma
python3 promo/voice.py voices          # sesleri listele, birini seç
export ELEVENLABS_VOICE_ID=...         # seçtiğin sesin id'si
python3 promo/voice.py dry sepet-3-hesap    # API'ye gitmeden metin ve kredi tahmini
python3 promo/voice.py make sepet-3-hesap   # seslendirmeyi üretir (önbellekli)
promo/make.sh sepet-3-hesap            # ses karışımı + video: konuşurken müzik kısılır, altyazı kelime zamanlı
```

- Üretilen ses `out/<ad>-voice.wav`, altyazı zamanları `out/<ad>.captions.json` olarak yazılır; `audio.py` ve render bunları kendiliğinden bulur.
- Aynı metin + ses + model bir kez üretilir (`out/voice-cache`); yeniden çalıştırmak kredi harcamaz.
- **Marka sesi:** tarif `brand/marka-sesi.md` dosyasında. Yeni reelslerde `"voiceTempo": 1.2` ve `"voiceFilter": "brand"` kullan; `voice.py` marka EQ'sunu uygular.
- Yeni satırları `python3 promo/voice_check.py assets/voice/<reels>/*.mp3` ile ölç: ses rengi önceki reelslere ≤ 5,5 dB uzaksa UYGUN.
- Altyazı kelime zamanları: `voice.py place` hece sayısından tahmin eder (0,4 sn'ye kadar şaşabilir). Satırların klasöründe
  `words.json` varsa (`{"k1.mp3": [kelime başlangıçları, ham mp3 saniyesi], ...}`, ör. ElevenLabs Scribe dökümünden) ölçülmüş
  zamanlar kullanılır; kelime sayısı altyazı metniyle tutmazsa tahmine döner. Örnek: `assets/voice/katil/words.json`.
- Sayıları yazıyla yaz ("iki bin dört yüz lira"): okunuşu daha güvenilir olur.
- Yapay ses kullanıyorsan Instagram'da "Yapay zekâ bilgisi" etiketini aç. Ücretsiz planın sesi ticari kullanıma uygun değildir; yayın için ücretli plan gerekir.
- Bu hat API'ye karşı henüz denenmedi (anahtar ve ağ izni olmadan); karışım ve altyazı tarafı sahte ses dosyasıyla sınandı.
