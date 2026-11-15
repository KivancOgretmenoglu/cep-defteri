# Cep Defteri

Üniversite hayatı için sade ve hızlı bir kişisel bütçe uygulaması. Paranın nereden gelip nereye gittiğini, yaklaşan ödemelerden sonra ne kadarını rahatça harcayabileceğini ve yatırım hesabına ne kadar para koyduğunu gösterir. Türkçe ve İngilizce çalışır. Altı hayvan maskottan birini seçersin; maskotun duygu hâli kayıtlarından türetilir ve her tepkisinin bir gerekçesi vardır.

## Çalıştırma

```bash
npm install
npm run dev        # geliştirme: http://localhost:5173
npm test           # hesaplama testleri (Vitest)
npm run build      # dist/ klasörüne üretim derlemesi
npm run preview    # derlenmiş sürümü yerelde aç
```

**Telefona kurulum (APK veya ana ekrana ekleme): [ANDROID.md](ANDROID.md).**

`dist/` klasörü herhangi bir statik barındırmaya konabilir (göreli yollar kullanır). Varsayılan dala gönderildiğinde `.github/workflows/pages.yml`, testleri çalıştırıp GitHub Pages'e yayınlar (depo ayarlarında *Pages → Source: GitHub Actions* seçilmeli). Telefonda tarayıcıdan **Ana ekrana ekle** ile uygulama gibi açılır ve çevrimdışı çalışır.

## Maskotlar ve dil

İlk açılışta sırayla **dil** (Türkçe / English), **maskot** (ve Android'de uygulama simgesinin maskotla değişip değişmeyeceği) ve başlangıç bakiyeleri sorulur. Hepsi sonra Ayarlar'dan değiştirilebilir.

| Maskot | Tür | Kişiliği |
|---|---|---|
| Fıstık | Sokak kedisi (varsayılan, mağaza simgesi) | şakacı, biraz ukala ama kalbi altın |
| Bilge | Baykuş | sakin, meraklı, rakamları sever; az konuşur, çok ipucu verir |
| Ceviz | Sincap | tutumlu, hareketli, sabırlı; birikim hedeflerine bayılır |
| Diken | Kirpi | sakin, minimalist, kuru mizahlı; asla telaşlanmaz |
| Karamel | Sokak köpeği | neşeli, sadık; bölüşme ve arkadaş hesaplarını sever |
| Pamuk | Tavşan | tatlı, şefkatli, biraz dramatik; küçük ödülleri ve kendine bakmayı sever, hep gaza getirir |

- Uygulamanın vurgu renkleri ve zemini seçili maskotun paletine göre değişir (gelir/gider gibi anlam taşıyan renkler sabit kalır).
- Maskota isim verilebilir. Her maskotun kendi selamları, espri sıklığı ve imza hareketleri vardır.
- Yılbaşı, bayram ve yaz günlerinde kendiliğinden özel kıyafet giyer.
- **Sınav haftası**: Ayarlar'dan bir haftalığına açılır; maskot ders çalışır, akşamki "bugün kayıt girdin mi?" bildirimi susar (ödeme hatırlatmaları sürer).
- Android'de kayıtta hafif titreşim (dokunsal geri bildirim).

## Kullanım

- **+** düğmesi (masaüstünde `N` kısayolu): tutar → kategori → Kaydet. Hesap son kullanılan, tarih bugün gelir; not isteğe bağlı. Sık tekrarlanan kayıtlar tek dokunuşla doldurulur. Kaydedince 6 saniye boyunca **Geri al** görünür.
- **Gider / Gelir / Transfer / Yatırım** sekmeleri. Yatırım sekmesi "yatırıma aktar" ve "yatırımdan çek" hareketlerini kaydeder; bunlar harcama ya da gelir sayılmaz.
- Bir işleme dokununca düzenlenir veya silinir; giderlerde **İade ekle** vardır.
- **Bütçe dışı gider**: gider formundaki *Bütçe dışı* çipi. Biriktirip alınan gitar gibi tek seferlik büyük harcamalar aylık bütçeye, bütçe temposuna, kategori limitine, harcama eğrisine (bütçe çizgisi) ve maskotun bütçe yargısına sayılmaz; bakiyeden yine düşer, "bu ay harcama" toplamında ve raporlarda görünür, işlem listesinde *bütçe dışı* etiketi taşır. Tek bir gider aylık bütçenin %30'unu aşarsa form bunu önerir. İadesi de bütçe dışıdır. Bütçe ekranı bütçe dışı tutulan toplamı ayrıca yazar.
- **Bütçe**: isteğe bağlı aylık bütçe, isteğe bağlı kategori limitleri, yaklaşan ödemeler/beklenen gelirler (tekrarlayan planlar). Vadesi gelen kalem kendiliğinden gerçekleşmez; **Ödendi/Geldi** ile tutarı düzeltip kaydedersin.
- **Yatırım**: güncel değer (elle, tarihli), bu ay / toplam yatırılan, çekilen, net katkı, birikim hedefleri.
- **Altın / döviz hesabı**: yatırım hesabı açarken *Ne olarak tutuyorsun? TL / Altın / döviz*. Bir altın/döviz hesabı **birden çok türü bir arada** tutar (gram 24 ayar, çeyrek, yarım, tam, Cumhuriyet, 22 ayar bilezik gram; USD, EUR, GBP): ör. 5 gram 24 ayar + 10 gram bilezik + 2 çeyrek. *Mevcut birikimimi ekle* ile elindekiler tür tür satır olarak girilir (tür + miktar + o günkü fiyat; fiyat güncel alış fiyatıyla dolar, düzeltilebilir; satır eklenip silinebilir). Katkı/çekimde önce tür seçilir (elindeki türler miktarıyla önde; çekimde yalnız elindekiler), TL tutarın yanında güncel fiyat önerilir (katkıda satış, çekimde alış; kuyumcunun fiyatı farklıysa düzeltilir) ve miktar = tutar ÷ fiyat hesaplanır; miktarı yazarsan fiyat tutardan bulunur. Yatırım ekranında tür tür döküm ("Gram altın (24 ayar): 5 gram · ₺…"), toplam değer, fiyatların yaşı, net katkı ve değer farkı görünür. Kayıt girilmiş hesapta TL ↔ altın/döviz modu değiştirilemez; yeni tür eklemek her zaman serbest.
- **Hisse senetleri (BIST + ABD)**: aynı altın/döviz hesabına hisse de eklenir (*Ne olarak tutuyorsun? TL / Altın / döviz / hisse*); ör. 2 gram altın + 10 THYAO + 0,5 AAPL bir arada. Katkı formunda **Hisse ekle** → kod ya da şirket adıyla arama (Türkçe karakter duyarsız): Borsa İstanbul'daki tüm hisseler, piyasa değerine göre en büyük 2.000 ABD hissesi ve yaygın ETF'ler uygulamaya gömülüdür (`src/data/stocks.json`, ilk ihtiyaçta yüklenir, çevrimdışı çalışır). Listede olmayan kod yazılıp borsası seçilerek eklenir (önce fiyatı denenir; bulunamazsa yine de eklenip fiyat elle girilir). Hissede önce **adet** sorulur (BIST'te tam adet, ABD'de kesirli adet); tutar boşsa *Tutarı doldur* ile adet × güncel fiyat yazılır. ABD hissesinin TL fiyatı = dolar fiyatı × dolar kuru (katkıda satış, değerde alış kuru). *Mevcut birikimimi ekle* satırlarında ve *Fiyatı gir* sayfasında da hisse seçilir; elle fiyat hissenin kendi para biriminde girilir ($ ya da TL).
- **Hesap arşivleme ve silme**: Kaydı olan hesap silinmez, **arşivlenir**. Arşivlenen yatırım hesabı Yatırım ekranındaki ana listeden/çiplerden, Özet'teki yatırım satırından ve *toplam yatırım değeri* gösterimlerinden çıkar (geçmiş aktarımları raporlarda ve işlem listesinde kalır); Yatırım ekranının altındaki katlanır **Arşivlenmiş hesaplar (n)** bölümünden açılıp *Arşivden çıkar* ile geri alınır. Hesapta hâlâ değer varsa arşivlemeden önce onay sorulur. Yatırım ve kişi hesapları ayrıca **Hesabı ve hareketlerini sil** ile tüm geçmişiyle silinebilir: o hesaba/hesaptan aktarımlar (ve onlara bağlı iadeler), değer kayıtları, planlar ve hedefler gider; onay ekranı kaç kaydın silineceğini ve günlük hesap bakiyelerinin ne kadar değişeceğini gösterir, silme birkaç saniye geri alınabilir. Günlük (banka/nakit) hesaplarda bu yoktur (geçmişleri giderlerdir), yalnız arşivlenir.
- **Raporlar**: kategori ve gelir kaynağı dağılımı, önceki dönemle karşılaştırma (devam eden ayda aynı gün aralığı), son 6 ay. Satıra dokununca o işlemlere gidilir.
- **Ayarlar**: hesaplar, kategoriler, maskot, adı ve dolabı, sınav haftası, dil, tema, yedek indir / geri yükle, CSV, örnek veri modu.
- **Bakiye gizleme**: Özet'teki göz simgesi toplam bakiyeleri (kullanılabilir para, hesap bakiyeleri, yatırım değeri) "•••••" yapar; işlem tutarları görünür kalır. Maskot bu sırada gizli ajan kılığına girer.
- **Bakiye geçmişi**: Özet'teki küçük grafikten açılır. Günlük hesapların gün sonu bakiyesi (1/3/6 ay, tümü; hesap hesap), kesik çizgiyle dönem sonuna kadar tahmin (bekleyen ödemeler ve beklenen gelirler vadelerinde).
- **Borç ve alacak**: arkadaşlar "kişi" hesabıdır. *Ben verdim / ben aldım* hareketleri gelir/gider sayılmaz. *O ödedi*: harcama sana yazılır, ona borçlanırsın. Gider girerken **Hesabı bölüş** ile arkadaşın payı alacak olarak ayrılır. Borçların kullanılabilir paradan düşülür; alacaklar gelene kadar eklenmez.
- **Planlar**: yaklaşan bir kaleme dokununca *Ödendi · Bu seferlik atla · Planı düzenle (ad, tutar…) · Planı iptal et*. İptal, seçilen günden sonraki vadeleri kaldırır; geçmiş korunur; biten planlar yeniden başlatılabilir. **Taksitli ödeme**: aylık ödeme + taksit sayısı; vadeler "2/6" diye görünür.
- **Etiketler**: işleme en fazla 5 etiket (ör. #erasmus). İşlemler'de etikete göre filtre, Raporlar'da etiket toplamları.
- **Ay karnesi**: ay bitince Özet'te belirir; ayın özeti ve resim olarak paylaşma.
- **Abonelik avcısı** (Bütçe ekranı, `src/domain/recurring.ts`): son 4 ayda her ay aşağı yukarı aynı gün (±6 gün) ve aynı tutarda (±%10) tekrar eden, plan olmayan giderler "Düzenli görünen giderler" kartında önerilir: *Plan yap* (ad, tutar, kategori, hesap ve bir sonraki vade dolu plan formu) ya da *Abonelik değil* (bir daha önerilmez; `settings.hintsSeen` içinde `rec:` önekiyle). En az 3 ardışık ay, ya da notu ve tutarı aynı 2 ardışık ay gerekir; ayda birden çok kayıt, boş ay, planlı/bütçe dışı/kişi hesabı giderleri sayılmaz.
- **Haftalık özet bildirimi** (Ayarlar → Bildirimler → *Haftalık özet*, varsayılan açık; bildirimler açıksa): pazar 20:00'de "Bu hafta 850 TL harcadın · geçen haftadan %15 az 👏. En çok: Ulaşım." Haftada harcama yoksa ya da saat geçtiyse gönderilmez; dokununca Raporlar açılır.
- **Google Play bağlantıları** (`src/native/playStore.ts`, yalnız Play'den kurulan uygulamada): açılışta ve uygulamaya dönüldüğünde (en fazla 6 saatte bir) Play'de yeni sürüm varsa Google'ın tam ekran **Güncelle** penceresi açılır; izin verilmezse arka planda indirilip "Yeniden başlat" bildirimi çıkar. **Puanlama isteği**: en az 2 gündür kullanılan ve en az 5 kaydı olan gerçek veride, iyi bir anda (yeni kayıt kaydedildi ve maskot düşünceli değil, ya da bütçe içinde biten ayın kutlaması) Google'ın uygulama içi puanlama penceresi; en fazla 120 günde bir, gösterilip gösterilmeyeceğine Google karar verir. Tarayıcıda ve APK'da hiçbir şey yapmaz.

## Hesaplama kuralları

Tüm hesaplar `src/domain/ledger.ts` içindeki saf fonksiyonlardan gelir; bakiye gibi türetilmiş değerler saklanmaz, bu yüzden düzenleme ve silme her şeyi tutarlı günceller. Tutarlar tam sayı kuruştur.

| Gösterge | Tanım |
|---|---|
| Günlük hesaplarda | Banka + nakit hesapların açılış bakiyesi + tüm hareketleri. Yatırım hariç. |
| Kullanılabilir para | Günlük hesaplar − dönem sonuna kadar bekleyen planlı ödemeler (gecikmişler dahil) − bekleyen planlı yatırım aktarımları − birikim payı − arkadaşlara borçların. Beklenen gelir ve alacaklar eklenmez. |
| Kişi bakiyesi | > 0: o sana borçlu, < 0: sen ona borçlusun. Kişiyle yapılan para hareketleri transferdir (gelir/gider değil). |
| Bu ay gelir | Gerçekleşmiş gelirler. Açılış bakiyesi, transfer, iade ve yatırımdan çekim hariç. |
| Bu ay harcama | Giderler − iadeler. Transfer ve yatırım katkısı hariç. Bütçe dışı giderler dahildir. |
| Bütçeye sayılan harcama | Bu ay harcama − bütçe dışı giderler (ve onların iadeleri). Bütçe, tempo, kategori limitleri ve bütçeli harcama eğrisi bunu kullanır. `Tx.offBudget: true` yalnız giderde saklanır. |
| Yatırım değeri | Son girilen değer + o değerden sonraki katkı − çekim. Değer girişi para hareketi değildir. Toplam yatırım değeri arşivlenmiş hesapları içermez. |
| Altın/döviz miktarı | **Tür başına** ayrı tutulur: açılış kalemi + katkılarda alınan − çekimlerde satılan. Her işlem türünü (`unit`), miktarını (`qty`) ve birim fiyatını (`unitPrice`) saklar. Bir türden, hiçbir tarihte elde olandan fazlası satılamaz (geçmişe girilen satış, sonraki satışları karşılıksız bırakamaz; alımı silmek/küçültmek de). |
| Hisse birimi | `BIST:THYAO`, `US:AAPL`, `US:BRK.B` (`src/domain/assets.ts`). Miktar adettir (BIST 0, ABD 6 ondalık). İşlem TL tutarı ve TL birim fiyatı saklar (ABD hissesinde işlem anındaki kurla); veri modeli altın/dövizle aynıdır, şema değişmedi. |
| Hisse değeri | adet × hissenin TL fiyatı. Kotasyon kendi para biriminde saklanır (`src/domain/stocks.ts`); TL fiyat kullanılırken türetilir: BIST doğrudan, ABD = dolar fiyatı × USD alış kuru. Dolar kuru yoksa son işlem fiyatı. |
| Altın/döviz değeri | Σ tür miktarı × o türün güncel **alış** fiyatı (bugün satsan eline geçecek). Fiyat sırası: bu cihazdaki en yeni fiyat (internetten ya da elle girilen; hangisi daha yeniyse) → yoksa o türün son işlem/açılış fiyatı. Elle değer kaydı bu hesaplarda kullanılmaz; "Fiyatı gir" ile türün birim fiyatı girilir. Net katkı ve hedefler TL üzerinden ölçülür. |
| Altın/döviz veri modeli | `Account.asset = { opening: [{ unit, qty, price }] }` (tür başına en fazla bir açılış kalemi; boş olabilir), `openingBalance = Σ qty × price`. Önceki sürümün tek birimli hesapları (`asset: { kind, unit }` + `openingQty`/`openingPrice`, işlemlerde birim yok) yüklenirken ve yedekten dönerken `src/domain/migrate.ts` ile bu biçime çevrilir (açılış kalemi + işlemlere hesabın birimi); miktar, fiyat ve değerler aynen korunur. CSV'de altın/döviz işlemi varsa *Miktar*, *Birim*, *Birim fiyat* sütunları eklenir. |
| Değer farkı | Yalnız takip öncesi katkı biliniyorsa: değer − (önceki katkı + net katkı). Getiri oranı hesaplanmaz. |

Bir planlı kalem gerçekleşince oluşan işlem plana bağlanır ve o vade artık "bekleyen" sayılmaz; böylece aynı ödeme iki kez düşülmez. Eşleşme dönem bazındadır (aylık planda ay), plan günü sonradan değişse de çift sayım olmaz.

### Maskotun duyguları (`src/domain/mood.ts`)

Öncelik sırasıyla: hesap/kayıt yok → **meraklı**; bekleyen ödemeler bakiyeyi aşıyor → **düşünceli**; son 7 günde hedef tamamlandı → **kutlama**; bütçe aşıldı / esnek harcama ayın akışının belirgin önünde / kategori limiti aşıldı / bekleyen ödemeler sonrası günlük pay çok düşük → **düşünceli**; hedefin %80'i veya bütçe yolunda → **keyifli**; diğerleri → **sakin**. Bütçe yoksa yargı yok. Planlı ödemeler bütçe temposuna, yatırım katkıları harcamaya girmez; yatırım değerindeki düşüş yorum doğurmaz. Maskotun yanındaki "Neden böyle?" ile kuralı görebilirsin.

## Veri

Kayıtlar yalnızca bu cihazdaki tarayıcıda (`localStorage`) tutulur; sunucu ve cihazlar arası eşitleme yoktur. Taşımak ya da korumak için **Ayarlar → Yedek indir** (JSON) kullan; geri yükleme dosyayı baştan sona doğrular ve önceki veriyi geri alınabilir şekilde saklar. Örnek veri ayrı bir alanda tutulur, gerçek kayıtlara dokunmaz.

Ağ istekleri yalnız fiyatlar içindir. Altın/döviz: bir altın/döviz hesabı varsa açılışta ve Yatırım ekranında (son fiyat 15 dakikadan eskiyse) anahtarsız, herkese açık JSON'dan yalnızca fiyat **alınır** (GET; kayıt, kimlik ya da çerez gönderilmez). Kaynak `finans.truncgil.com/today.json` (Türk altın türleri + USD/EUR/GBP alış/satış); erişilemezse `@fawazahmed0/currency-api` (jsDelivr) yedeği: döviz orta kur, altın ons fiyatından *tahmini*. Android uygulamasında istek yerel HTTP (CapacitorHttp) ile atılır, tarayıcıda `fetch` ile. Fiyatlar bu cihazda ayrı bir anahtarda önbelleğe alınır ve yedeğe girmez; çevrimdışıyken son fiyat "x saat önce" diye gösterilir, fiyat elle de girilebilir. **Hisse fiyatları**: yalnız elde olan (ve formda o an seçilen) hisseler için, istekte yalnız hisse kodu bulunur. BIST: Yahoo Finance grafik uç noktası (`THYAO.IS`, ~15 dk gecikmeli) → erişilemezse İş Yatırım günlük verisi (son kapanış). ABD: Nasdaq'ın kotasyon uç noktası (`api.nasdaq.com`, önce hisse sonra ETF sınıfı) → erişilemezse Yahoo. Yahoo bir turda 429/403 verirse o turda bir daha denenmez. Hiçbiri anahtar istemez; ikisi de resmi bir "API sözleşmesi" değildir, bu yüzden her borsa için iki bağımsız kaynak vardır ve fiyat her zaman elle de girilebilir. Bu kaynaklar CORS başlığı göndermediği için hisse fiyatları **yalnız Android uygulamasında** otomatik gelir; tarayıcı/PWA sürümünde elle girilir. Liste `scripts/gen-stock-list.mjs` ile yenilenir. **Ayarlar → Altın, döviz ve hisse fiyatları**'ndan otomatik fiyat alma kapatılabilir (o zaman hiç istek atılmaz).

## Yapı

```
src/domain/   hesaplama, doğrulama, yedek/CSV, maskot duygu kuralları (+ testler)
src/mascot/   6 piksel maskot: karakterler, çizim, hareketler, espriler, özel günler, tema
src/i18n/     Türkçe / İngilizce metinler ve biçimlendirme
src/native/   bildirim, otomatik yedek, ana ekran aracı, uygulama simgesi, titreşim
src/store/    kalıcı saklama ve geri alma
src/screens/  Özet, İşlemler, Bütçe, Yatırım, Raporlar, Ayarlar, İlk açılış
src/sheets/   işlem/iade/plan/hesap/değer formları
src/platform.ts  Android (Capacitor) farkları: dosya paylaşımı, geri tuşu
android/      Capacitor ile üretilen Android projesi
```

## Bilinen sınırlar

- Kredi kartı ayrı hesap türü değil (kart harcaması, ödendiği hesaptan gider olarak girilir).
- Hesap para birimi TL; altın/döviz/hisse yalnız yatırım hesabında miktar olarak tutulur (değeri TL'ye çevrilerek gösterilir).
- Hisselerde temettü, bedelsiz/bölünme ve komisyon ayrıca izlenmez (bedelsiz hisseler için açılış kalemi düzenlenebilir); getiri oranı hesaplanmaz. Yalnız BIST ve ABD borsaları.
- Kuyumcu fiyatları kaynaktaki ortalamadır; bulunduğun yerdeki fiyat farklı olabilir (formda düzeltilebilir). Yedek kaynaktaki altın fiyatı işçiliksiz tahmindir.
- Bağımsız (bir gidere bağlı olmayan) iade girişi yok.
- Fiş fotoğrafı ve banka bağlantısı yok (ilk sürüm kapsamı dışında).
