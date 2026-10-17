# Cep Defteri

## Reels seslendirmesi: marka sesi
Devamlılık için her yeni seslendirmede `promo/brand/marka-sesi.md` tarifini uygula:
- Ses: Buğra, voice_id `78vut4AQryyKEWB72sOv`. Model `eleven_v4`, her satırın başında ton etiketi (`[energetic]`, `[curious]`, `[excited]`, `[dramatic]`, `[playful]`), satır başına tek üretim.
- Üretilen her satırı `python3 promo/voice_check.py <dosyalar>` ile ölç. UYGUN çıkmayanı yeniden üret; yine olmazsa `eleven_multilingual_v2` ile etiketsiz üret.
- Yeni reelslerde reels.json'a `"voiceTempo": 1.2` ve `"voiceFilter": "brand"` ekle.

Diğer reels kuralları (hook, süre, tek çağrı, döngü): `promo/brand/izlenme-rehberi.md`.
