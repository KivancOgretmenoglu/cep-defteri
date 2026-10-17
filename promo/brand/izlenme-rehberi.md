# Reels izlenme süresi rehberi

Kaynaklı araştırmanın özeti (Ekim 2026). [RESMİ] = Instagram/Mosseri açıklaması, [PRATİK] = içerik üreticilerinin deneyimi.

## Instagram neye bakıyor
- [RESMİ] En önemli üç sinyal: izlenme süresi, beğeni/erişim ve **gönderim/erişim**. Takip etmeyenlere ulaşmada gönderim biraz daha önemli. ([Social Media Today](https://www.socialmediatoday.com/news/instagram-shares-algorithm-insights-2025/738034/))
- [RESMİ] Hem izlenme yüzdesi hem de toplam saniye sayılıyor; kaydetmeler hâlâ önemli. ([Inman](https://news.inman.com/2025/03/07/head-of-instagram-reveals-secrets-to-social-media-success/))
- [RESMİ] Özgün içerik öne çıkar. Sessiz, düşük çözünürlüklü, filigranlı ya da **ekranın çoğu yazıyla kaplı** reelsler daha az önerilir. ([Instagram Yardım](https://help.instagram.com/1525585517644948))
- [RESMİ] İstatistiklerde "Skip rate" (ilk 3 sn'de kaydırma oranı) ve izlenme grafiği var. ([Social Samosa](https://www.socialsamosa.com/news-2/instagram-retention-chart-skip-rate-new-performance-metrics-reels-9730992))

## Kurallarımız
1. **Hook ≤ 5 kelime**, 0. karede hazır, 0,5 sn içinde hareket başlar. Karşıt iddia ya da somut sayı.
2. Hook'tan hemen sonra **açık döngü**: "3.sü en sinsisi", "Sonda 5 saniyelik hesap". En güçlü madde sona.
3. **Kart başına ≤ 12 kelime** (≈ saniyede 3 kelime). Açıklama ve formüller Instagram açıklamasına.
4. Her ~2 sn'de bir hareket: sayaç, kıvılcım, maskot tepkisi.
5. **Ayrı kapanış kartı yok.** CTA son kartın üstünde; son kare ilk kareye bağlanır (döngü → tekrar izlenme).
6. Videoda CTA **"arkadaşına gönder"**; "kaydet" açıklamada.
7. Yazı ekranı kaplamasın, pixel sahne görünsün. Üst %14 ve alt %20–35 Instagram arayüzüne ayrılmış.
8. **Format çeşitliliği:** aynı kart düzenini art arda kullanma; kartlar, quiz (`quiz`), mesajlaşma hikâyesi (`chat`), POV arasında dön. Örnekler öğrenci hayatından olsun (telefon, kulaklık, kart borcu, burs).
9. **Tahmin anı:** cevabı vermeden önce 1–2 sn beklet (geri sayım, "yazıyor…"). İzleyici tahmin eder, kalır, yorumda skorunu yazar.
10. Ses her zaman açık. Müziksiz sürümle sessiz bir trend ses A/B test edilebilir.

## Yayınlarken
- Önce **Deneme reelsi** (Trial Reels: yalnız takip etmeyenlere gösterilir) olarak paylaş; skip rate'i sadece diğer deneme reelsleriyle karşılaştır. ([Fanpage Karma](https://www.fanpagekarma.com/insights/?p=9293))
- Skip rate %30–40 altı iyi, %50 üstü hook zayıf demek. ([Metricool](https://metricool.com/instagram-reel-analytics/))
- İzlenme grafiğinde düşüşün olduğu saniyeye bak; o kartı kısalt ya da hareket ekle.
- Açıklamanın ilk satırı arama için anahtar kelimeli olsun ("Peşin mi taksit mi? Enflasyonda…").

## Ödeme acısı sürecinden dersler (Ekim 2026, v1–v5)
Beş sürüm ve dört ajan paneli sonunda öğrenilenler. Yeni her reelste uygula.

**Hook**
- İlk kare **kişisel ve okunur** olsun: bir kişinin anı + somut sonuç ("Kartla ödedim, hiç acımamıştı" + "4.300 TL"). Bulanık/bağlamsız rakam ("kimin ekstresi?") tutmadı (v5, 7/10 ajan).
- Cevabı belli soru ("Hangisi acıtır?") ve hook'tan önceki tahmin boşluğu ilk 3 sn'yi harcar. Tahmin anı hook'tan **sonra** gelsin.

**Doğruluk** (davranışsal ekonomi içeriklerinde)
- Kavramı doğru adlandır: ödeme acısı = **ödeme anındaki** acı; ay sonu ekstre şoku ayrı şey.
- "Kart" değil **"kredi kartı"**: banka kartında para anında düşer.
- Nedensellik gibi okunan örnek rakamlara (450 → 610) ekranda **"örnek"** yaz. Kanıtsız iddia kurma ("yazınca acı geri gelir" yerine "toplamı önceden gör").
- Etki bir **eğilim**; herkes için kesin sonuç gibi söyleme.

**Ekran**
- Rakam listeleri ≤ 3 satır, ≥ 46 px, aynı anda ve tam okunur; toplam tutsun.
- Mikro yazı (etiket, "AH!", "+45") 40 px altına inmesin; okunmuyorsa hiç koyma.
- Künye maskotların/animasyonun üstüne binmesin; tam boy karede kontrol et.

**Marka ve çağrı**
- Uygulama **kapalı testte**: link, "profilde", "indir" yazma.
- Videoda uygulamanın faydası tek cümle olsun ("ekstre gelmeden toplamı gör"); "Cep Defteri'ne yaz" tek başına bir şey anlatmıyor.
- "Arkadaşına gönder" çağrısı **kime ve neden** göndereceğini söylesin.

**Süre**: hedef ≤ 16 sn. Aynı kare 2 sn'den uzun durmasın.

**Üretim hattı**
- `out/<ad>-voice.wav` git'te yok: `make.sh` artık önce `voice.py place` çalıştırır. Render sonrası müziksiz sürümde konuşma bölümlerinin sesini `volumedetect` ile doğrula.
- Seslendirme satırları ElevenLabs bağlayıcısıyla (marka sesi tarifi) üretilir, `voice_check.py` UYGUN olmalı; gereksiz kısım ffmpeg ile kesilebilir.

**Ajan panelleri**
- Ajanlar videoyu izlemez: 1 sn aralıklı kareler + metin brif görür; ses, tempo ve hareket iyileşmeleri onlara pek ulaşmaz.
- Kurallarsız paneller nazik ve şişkin puan verir (v1: 6,6, "5/10 kaydederim"). Gerçekçilik kuralları (taban oranlar: ilk 3 sn kaydırma %30–50, kaydetme %1–3; varsayılan eylem "hiçbiri") ile puanlar ~5'e iner ve küçük düzeltmeleri ayırt etmez (v4 ve v5: 5,1).
- Panel; okunabilirlik, doğruluk ve kafa karışıklığı bulmak için iyi, viral tahmin için değil. Asıl ölçüm: **Deneme reelsi** skip rate ve izlenme grafiği.
