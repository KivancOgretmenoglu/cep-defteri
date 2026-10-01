# Cep Defteri

Üniversite hayatı için sade ve hızlı bir kişisel bütçe uygulaması. Paranın nereden gelip nereye gittiğini, yaklaşan ödemelerden sonra ne kadarını rahatça harcayabileceğini ve yatırım hesabına ne kadar para koyduğunu gösterir. Maskotu **Clawd**: duygu hâli kayıtlarından türetilir ve her tepkisinin bir gerekçesi vardır.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm test           # hesaplama testleri (Vitest)
npm run build      # dist/ klasörüne üretim derlemesi
npm run preview    # derlenmiş sürümü yerelde aç
```

`dist/` klasörü herhangi bir statik barındırmaya konabilir (göreli yollar kullanır). `main` dalına gönderildiğinde `.github/workflows/pages.yml`, testleri çalıştırıp GitHub Pages'e yayınlar (depo ayarlarında *Pages → Source: GitHub Actions* seçilmeli). Telefonda tarayıcıdan **Ana ekrana ekle** ile uygulama gibi açılır ve çevrimdışı çalışır.

## Kullanım

- **+** düğmesi (masaüstünde `N` kısayolu): tutar → kategori → Kaydet. Hesap son kullanılan, tarih bugün gelir; not isteğe bağlı. Sık tekrarlanan kayıtlar tek dokunuşla doldurulur. Kaydedince 6 saniye boyunca **Geri al** görünür.
- **Gider / Gelir / Transfer / Yatırım** sekmeleri. Yatırım sekmesi "yatırıma aktar" ve "yatırımdan çek" hareketlerini kaydeder; bunlar harcama ya da gelir sayılmaz.
- Bir işleme dokununca düzenlenir veya silinir; giderlerde **İade ekle** vardır.
- **Bütçe**: isteğe bağlı aylık bütçe, isteğe bağlı kategori limitleri, yaklaşan ödemeler/beklenen gelirler (tekrarlayan planlar). Vadesi gelen kalem kendiliğinden gerçekleşmez; **Ödendi/Geldi** ile tutarı düzeltip kaydedersin.
- **Yatırım**: güncel değer (elle, tarihli), bu ay / toplam yatırılan, çekilen, net katkı, birikim hedefleri.
- **Raporlar**: kategori ve gelir kaynağı dağılımı, önceki dönemle karşılaştırma (devam eden ayda aynı gün aralığı), son 6 ay. Satıra dokununca o işlemlere gidilir.
- **Ayarlar**: hesaplar, kategoriler, Clawd'ın dolabı, tema, yedek indir / geri yükle, CSV, örnek veri modu.

## Hesaplama kuralları

Tüm hesaplar `src/domain/ledger.ts` içindeki saf fonksiyonlardan gelir; bakiye gibi türetilmiş değerler saklanmaz, bu yüzden düzenleme ve silme her şeyi tutarlı günceller. Tutarlar tam sayı kuruştur.

| Gösterge | Tanım |
|---|---|
| Günlük hesaplarda | Banka + nakit hesapların açılış bakiyesi + tüm hareketleri. Yatırım hariç. |
| Kullanılabilir para | Günlük hesaplar − dönem sonuna kadar bekleyen planlı ödemeler (gecikmişler dahil) − bekleyen planlı yatırım aktarımları − birikim payı. Beklenen gelir eklenmez. |
| Bu ay gelir | Gerçekleşmiş gelirler. Açılış bakiyesi, transfer, iade ve yatırımdan çekim hariç. |
| Bu ay harcama | Giderler − iadeler. Transfer ve yatırım katkısı hariç. |
| Yatırım değeri | Son girilen değer + o değerden sonraki katkı − çekim. Değer girişi para hareketi değildir. |
| Değer farkı | Yalnız takip öncesi katkı biliniyorsa: değer − (önceki katkı + net katkı). Getiri oranı hesaplanmaz. |

Bir planlı kalem gerçekleşince oluşan işlem plana bağlanır ve o vade artık "bekleyen" sayılmaz; böylece aynı ödeme iki kez düşülmez. Eşleşme dönem bazındadır (aylık planda ay), plan günü sonradan değişse de çift sayım olmaz.

### Clawd'ın duyguları (`src/domain/mood.ts`)

Öncelik sırasıyla: hesap/kayıt yok → **meraklı**; bekleyen ödemeler bakiyeyi aşıyor → **düşünceli**; son 7 günde hedef tamamlandı → **kutlama**; bütçe aşıldı / esnek harcama ayın akışının belirgin önünde / kategori limiti aşıldı / bekleyen ödemeler sonrası günlük pay çok düşük → **düşünceli**; hedefin %80'i veya bütçe yolunda → **keyifli**; diğerleri → **sakin**. Bütçe yoksa yargı yok. Planlı ödemeler bütçe temposuna, yatırım katkıları harcamaya girmez; yatırım değerindeki düşüş yorum doğurmaz. Clawd'a dokunup "Neden böyle?" ile kuralı görebilirsin.

## Veri

Kayıtlar yalnızca bu cihazdaki tarayıcıda (`localStorage`) tutulur; sunucu ve cihazlar arası eşitleme yoktur. Taşımak ya da korumak için **Ayarlar → Yedek indir** (JSON) kullan; geri yükleme dosyayı baştan sona doğrular ve önceki veriyi geri alınabilir şekilde saklar. Örnek veri ayrı bir alanda tutulur, gerçek kayıtlara dokunmaz.

## Yapı

```
src/domain/   hesaplama, doğrulama, yedek/CSV, Clawd kuralları (+ testler)
src/clawd/    piksel Clawd: 5 duygu, 10 kıyafet, 5 gövde rengi
src/store/    kalıcı saklama ve geri alma
src/screens/  Özet, İşlemler, Bütçe, Yatırım, Raporlar, Ayarlar, İlk açılış
src/sheets/   işlem/iade/plan/hesap/değer formları
```

## Bilinen sınırlar

- Kredi kartı ayrı hesap türü değil (kart harcaması, ödendiği hesaptan gider olarak girilir).
- Bağımsız (bir gidere bağlı olmayan) iade girişi yok.
- Fiş fotoğrafı, banka bağlantısı, canlı fiyatlar yok (ilk sürüm kapsamı dışında).
- Tek para birimi: TL.
