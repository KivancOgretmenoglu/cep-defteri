# Cep Defteri

## Reels seslendirmesi: marka sesi
Devamlılık için her yeni seslendirmede `promo/brand/marka-sesi.md` tarifini uygula:
- Ses: Buğra, voice_id `78vut4AQryyKEWB72sOv`. Model `eleven_v4`, her satırın başında ton etiketi (`[energetic]`, `[curious]`, `[excited]`, `[dramatic]`, `[playful]`), satır başına tek üretim.
- Üretilen her satırı `python3 promo/voice_check.py <dosyalar>` ile ölç. UYGUN çıkmayanı yeniden üret; yine olmazsa `eleven_multilingual_v2` ile etiketsiz üret.
- Yeni reelslerde reels.json'a `"voiceTempo": 1.2` ve `"voiceFilter": "brand"` ekle.

## Reels sonu: takip çağrısı
Her yeni reelsin son satırı ortak takip satırıdır: `voiceFiles`'a altyazısız `["…", "assets/voice/ortak/takip.mp3"]` ("Her hafta bir para tuzağı. Kaçırmamak için takip et!"), ekranda da takip kartı. Yeniden üretme, aynı dosyayı kullan. Önce kapanış sorusu, sonra takip.

Diğer reels kuralları (hook, süre, çağrılar, döngü): `promo/brand/izlenme-rehberi.md`.
