# Marka sesi

Tüm seslendirmelerde aynı ses ve aynı tarif kullanılır. Kulakta referans: **fırsat maliyeti, tuzak seçenek, indirim yanılgısı ve batık maliyet** reelsleri.

## Ses
- **Buğra – Sosyal Medya Seslendirmecisi** (ElevenLabs, genç, İstanbul aksanı)
- voice_id: `78vut4AQryyKEWB72sOv`
- Ton: arkadaşına anlatır gibi, enerjik ama bağırmadan; sayıları net vurgula.

## Üretim tarifi
1. Her satırı ayrı üret, satır başına tek üretim (`generations_count: 1`).
2. Model `eleven_v4`, satırın başına ton etiketi koy. Etiketsiz v4 satırları belirgin şekilde kalın ve düz çıkıyor, başka biri gibi duyuluyor.

   | Satır türü | Etiket |
   |---|---|
   | Hook, iddia | `[energetic]` |
   | Soru, tahmin | `[curious]` |
   | Açıklama, sürpriz | `[excited]` |
   | Vurucu cümle | `[dramatic]` |
   | Çağrı (yorum, paylaşım) | `[playful]` |

3. İndir ve ölç: `python3 promo/voice_check.py assets/voice/<reels>/*.mp3`. Her satır **UYGUN** çıkmalı (ses rengi farkı ≤ 5,5 dB).
4. UYGUN çıkmayan satırı bir kez daha `eleven_v4` ile dene. Yine olmazsa `eleven_multilingual_v2` ile **etiketsiz** üret (bu model etiketi sesli okur), vurguyu noktalama ve ünlemle ver.
5. Dosyaları `promo/assets/voice/<reels>/` altına koy.

## Videoya yerleştirme (reels.json)
```json
"voiceTempo": 1.2,
"voiceFilter": "brand",
"voiceFiles": [[0.1, "assets/voice/<reels>/1.mp3", "altyazı metni"], ...]
```
- `"voiceFilter": "brand"` → `voice.py` marka EQ'sunu uygular: 170 Hz −4 dB, 560 Hz −3 dB, 3,8 kHz üstü +3,5 dB. Bu EQ yeni satırların ses rengini eski reelslerdekine eşitler.
- Hız 1.2 (batık maliyetten itibaren). Eski reelsler 1.15 ile kaldı, onlara dokunma.
- Son satır (çağrı) altyazısız bırakılır; altyazı `captionUntil` ile çağrıdan önce biter.
- En sona ortak takip satırı eklenir: `assets/voice/ortak/takip.mp3` ("Her hafta bir para tuzağı. Kaçırmamak için takip et!", `[playful]`, 3,83 dB; kelime zamanları `assets/voice/ortak/words.json`). Her reelste aynı dosya kullanılır, yeniden üretilmez.

## Neden bu tarif (16 Ekim 2026 ölçümü)
- Önceki reelslerin satırları kendi aralarında **3,0–5,1 dB** farklı.
- Aynı ses ve aynı model, ton etiketi olmadan **7–9 dB** uzak çıktı; perde ~115 Hz'e düştü (öncekiler ~200 Hz). Bu fark kulakta "başka konuşmacı" gibi duyuluyor.
- Etiketle bile v4'ün bir kısmı 7–9 dB uzak kaldı. `eleven_multilingual_v2` 3,7–5,5 dB ile tuttu.
- Seçilen satırlar marka EQ'su ile **3,4–4,9 dB** aralığına girdi.
