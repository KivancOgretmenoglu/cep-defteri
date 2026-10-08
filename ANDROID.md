# Telefona kurulum

İki yol var. İkisi de internetsiz çalışır ve verileri yalnızca telefonda tutar. **İkisinin verileri ayrıdır**; birinden diğerine geçerken *Ayarlar → Yedek indir* ve diğerinde *Yedekten geri yükle* kullan.

## 1. Android APK (önerilen: gerçek uygulama)

**APK'yı indir:** telefonda <https://github.com/KivancOgretmenoglu/cep-defteri/releases/latest> adresini aç, `CepDefteri-1.0.N.apk` dosyasına dokun.

**Kur:** indirilen dosyayı aç. Android "bilinmeyen uygulamaları yükleme" izni isterse tarayıcına (Chrome) bu izni ver ve **Yükle**'ye dokun. Play Protect uyarısı çıkarsa *Yine de yükle* de: uygulama Play Store'dan gelmediği için bu uyarı normal.

**Güncelleme:** yeni sürümü aynı şekilde indirip kur. Kalıcı imza anahtarı tanımlıysa (aşağıda) eski sürümün üzerine kurulur, **veriler korunur**.

**Yedek:** *Ayarlar → Yedek indir* Android paylaşım ekranını açar; Drive'a, Dosyalar'a ya da kendine mesaj olarak kaydedebilirsin. Geri yüklerken *Yedekten geri yükle* ile o dosyayı seç.

### Uygulamaya özel özellikler

**Uygulama kilidi** (*Ayarlar → Uygulama kilidi*; tarayıcıda da çalışır): 4–6 haneli PIN. PIN yalnız tuzlu PBKDF2-SHA256 özeti olarak bu cihazda tutulur, yedek dosyasına girmez. Uygulama açılırken ve arka planda seçilen süreden (hemen / 1 / 5 / 15 dk) uzun kaldıktan sonra sorulur. Telefonda parmak izi / yüz ile açma eklenebilir (cihazda tanımlıysa). Üst üste 5 yanlış denemeden sonra bekleme süresi artar (30 sn → 15 dk). PIN'i değiştirmek ya da kapatmak için mevcut PIN gerekir.
Kilit bir **gizlilik perdesidir**, kayıtlar şifrelenmez. PIN unutulursa: parmak izi açıksa onunla açılır; değilse kilit ekranındaki *PIN'i unuttum → Kilidi kaldır ve verileri sil* her şeyi siler. Sonra *Yedekten geri yükle* ile otomatik yedeğe dönülür.

**Bildirimler** (yalnız APK; *Ayarlar → Bildirimler*): açınca Android 13+ izin sorar. Yaklaşan ödeme ve planlı yatırım aktarımı için bir gün önce 10:00'da ("Yarın: Yurt ödemesi 4.500 TL"), beklenen gelir için o gün 12:00'de ("Burs geldi mi?"), isteğe bağlı her akşam seçilen saatte "Bugünkü harcamalarını girdin mi?" (o gün kayıt varsa atlanır). En fazla 30 gün ileri ve 60 bildirim planlanır; veri değişince ve uygulamaya dönünce yeniden hesaplanır. Hatırlatma saati geçmiş ama vadesi gelmemiş bir kalem bir kez hemen bildirilir. Bildirime dokununca ilgili "Ödendi / Geldi" sayfası ya da yeni kayıt sayfası açılır. Örnek veri modunda bildirim gönderilmez.

**Ana ekran aracı (widget)**: ana ekranda boş yere uzun bas → *Araçlar* → *Cep Defteri – Kullanılabilir para*. Seçili maskotu, kullanılabilir tutarı ve dönemi ("Ekim sonuna kadar") gösterir; *Toplamları gizle* açıksa "•••• TL", örnek veri modunda "örnek veri" yazar. Metinler uygulamada seçilen dili izler (Türkçe / English). Araç, uygulama her açıldığında ve veri değiştiğinde güncellenir (metinler `src/native/widgetPayload.ts`'te hazırlanır). Kenarından sürükleyip boyutunu değiştirince düzen de değişir:

| Boyut | Düzen | İçerik |
| --- | --- | --- |
| 2×1 | `widget_small` | şerit sahne, alttan bakan maskot büstü, tutar |
| 3×1, 4×1 | `widget_cep` | şerit sahne, solda büyük maskot, tutar + dönem, maskot renginde yuvarlak **+** |
| 3×2, 4×2 (varsayılan) | `widget_medium` | geniş sahne, solda büyük maskot, sağ üstte tutar + dönem, **Gider** / **Gelir** |
| 4×3 ve üstü | `widget_large` | uzun sahne, canlanan büyük maskot, tutar, dönem, **bugünkü harcama**, Gider / Gelir, en fazla 3 **tek dokunuşla kayıt** çipi |

Tasarım "önce sahne"dir: maskotun kendi sahnesi (kedi: sıcak oda + kilim, baykuş: aylı gece penceresi + kitaplık, sincap: gökyüzü + meşe dalı, kirpi: çayır + yapraklı toprak, köpek: güneşli park + çit) aracın **tamamını** kaplar (`widget_scene`, `centerCrop`), maskot sahnenin zemin bandında büyük durur. Metin, açık temada %85 kâğıt, koyu temada %85 koyu kâğıt renkli yarı saydam bir panelde (`widget_panel`, `widget_scrim`) olduğundan her sahnede okunur. Düğmeler **maskotun renginde**: Gider ve "+" dolu (`widget_btn_<anahtar>`, `widget_fab_<anahtar>`; kedi turuncu, baykuş mavi, sincap kahve, kirpi adaçayı yeşili, köpek karamel), Gelir ve çipler aynı rengin saydam tonu (`widget_btn_soft_`, `widget_chip_<anahtar>`); `CepWidgetProvider` bunları payload'daki `mascot` anahtarına göre `setBackgroundResource` / `setTextColor` ile seçer. Köşeler Android 12+'da kökteki `clipToOutline` ve sistemin araç köşe yarıçapıyla (`values-v31/widget_dimens.xml`) yuvarlanır; Android 11 ve öncesinde sahne köşeleri düz kalır. Önizleme: `docs/widget-preview.png`.

Android 12+ boyuta duyarlı `RemoteViews(Map<SizeF, RemoteViews>)` kullanır (eşikler dp: 100×40 küçük, 180×40 geniş, 180×120 orta, 250×200 büyük); Android 11 ve öncesinde düzen, aracın en/boy seçeneklerinden `onAppWidgetOptionsChanged`'de seçilir.

- Tutara dokununca uygulama açılır. **Gider** / **Gelir** doğrudan ilgili sekmede yeni kayıt sayfasını açar (`io.github.kivancogretmenoglu.cepdefteri://add?type=expense|income`; **+ Ekle** ve kutucuk `…://add`). Bu bağlantıyla açılınca maskot 2 dk "Yazmaya gidiyorum…" pozuna geçer (`MainActivity.onNewIntent`); uygulamada bir kayıt eklenince (veya çipe dokununca) 3 dk "Not aldım! ✓" pozunu gösterir. Pozun bitişi için kesin olmayan bir `AlarmManager` alarmı kurulur (izin gerekmez); alarm gecikse bile bir sonraki güncellemede poz düşer.
- **Canlandırma** (yalnız büyük araç): maskot 6 karelik bir döngü oynar (`ViewFlipper`, 420 ms; kedi yumak kovalar, baykuş başını çevirip göz kırpar, sincap palamut kemirir, kirpi yerleri koklar, köpek top zıplatıp kuyruk sallar). *Ayarlar → Ana ekran aracı → Widget animasyonu* kapatılırsa sabit kare gösterilir (cihaz tercihi, `src/native/widgetPrefs.ts`; payload'da `animate`).
- **Tek dokunuşla kayıt** (büyük araç): son 60 günde en az 3 kez tekrarlanan giderlerden (aynı kategori + tutar + not; `frequentTemplates`) en fazla 3 çip, ör. "☕ Kahve 60 TL". Çipe dokunmak **uygulamayı açmaz**: `CepWidgetProvider` çipin o anki şablonunu benzersiz bir `qid` ve dokunma zamanıyla SharedPreferences'taki kuyruğa ekler (en fazla 50), kısa bir bildirim ("Not aldım ✓ ☕ Kahve 60 TL") gösterir ve "Not aldım" pozuna geçer. Uygulama açılınca / öne gelince `src/native/widgetQueue.ts` kuyruğu okur (`WidgetBridge.readQueue`), her öğeyi dokunulan günün tarihiyle kayda çevirir (`addTx`), "Widget'tan 2 kayıt eklendi" bildirimini **Geri al** ile gösterir ve işlenenleri siler (`ackQueue`; arada eklenenler kalır). İşlenen `qid`'ler cihazda hatırlanır, bu yüzden silme başarısız olsa da aynı kayıt iki kez eklenmez. Hesabı silinmiş/arşivlenmiş gibi eklenemeyen öğeler sayılıp atılır. Örnek veri modunda çip gösterilmez ve kuyruk işlenmez (gerçek moda dönülünce işlenir).

**Hızlı ayarlar kutucuğu**: bildirim panelini aşağı çek → kalem/düzenle → *Cep Defteri: + Kayıt* kutucuğunu panele sürükle. Dokununca panel kapanır ve yeni kayıt sayfası açılır (ekran kilitliyse önce kilit açılır). `AddTileService.java`; Android 14+ `startActivityAndCollapse(PendingIntent)`, öncesinde `Intent` sürümü kullanılır.

**Uygulama simgesi = maskot**: simge seçilen maskotu (Fıstık, Bilge, Ceviz, Diken, Karamel) izleyebilir. Manifest'te her maskot için bir `<activity-alias>` (`.Icon_<anahtar>`) vardır; yalnız biri etkindir (varsayılan Fıstık). `AppIconPlugin.java` seçileni etkinleştirip diğerlerini kapatır (`PackageManager.setComponentEnabledSetting`, `DONT_KILL_APP`); JS tarafı `src/native/appIcon.ts` (`appIconSupported()`, `setAppIcon(key)`, `getAppIcon()`; tarayıcıda hiçbir şey yapmaz). Bilinen kısıtlar:
- Bazı başlatıcılar yeni simgeyi birkaç saniye (bazen telefonu yeniden başlatana kadar) geç gösterir.
- Bazı başlatıcılar (ör. Samsung One UI, bazı Xiaomi sürümleri) değişiklikte **ana ekrandaki kısayolu kaldırır**; uygulama çekmecesinden yeniden sürüklemek gerekir. Ana ekran aracı etkilenmez.
- Değişiklik anında açık olan görev bazı sürümlerde kapanabilir; veri kaybı olmaz (her şey cihaza yazılmıştır).
- Tarayıcı / PWA sürümünde simge değiştirilemez; web simgesi her zaman Fıstık'tır.
Bildirime dokunma, ana ekran aracı ve `://add` derin bağlantısı takma adlardan bağımsız çalışır: derin bağlantı doğrudan `MainActivity`'ye gider, araç ve bildirimler etkin takma adın başlatma niyetini kullanır.

**Titreşim**: `src/native/haptics.ts` → `haptic('light' | 'success' | 'warning')` (`@capacitor/haptics`); yalnız uygulamada çalışır, hata vermez.

**Otomatik yedek** (*Ayarlar → Otomatik yedek*, varsayılan açık): her gün bir kopya `Belgeler/CepDefteri/cep-defteri-otomatik-YYYY-AA-GG.json` dosyasına yazılır (gün içinde veri değişirse o günün dosyası güncellenir), son 7 gün tutulur. Bu klasör **uygulamayı silsen de kalır**: yeniden kurunca *Ayarlar → Yedekten geri yükle* ile oradaki en yeni dosyayı seç. Örnek veri ve boş veri yedeklenmez. Android 10 ve öncesinde ilk seferde dosya izni istenebilir (*Şimdi yedekle*). Tarayıcı sürümünde son 5 günün kopyası tarayıcının kendi deposunda tutulur ve aynı karttan geri yüklenir; 14 gündür yedek dosyası indirilmediyse nazik bir hatırlatma çıkar.

Kod: `src/lock/` (kilit), `src/native/` (bildirim planı, araç köprüsü, otomatik yedek, eşitleme), `android/app/src/main/java/.../CepWidgetProvider.java` ve `WidgetBridgePlugin.java` (araç, çip kuyruğu ve JS köprüsü), `AddTileService.java` (hızlı ayarlar kutucuğu), `AppIconPlugin.java` (simge).

**Simgeler ve görseller** maskot tanımlarından (`src/mascot/characters.ts`) üretilir: başlatıcı simgeleri (her maskot için kare, yuvarlak ve uyarlanabilir; zemin `palette.iconBg`), varsayılan `ic_launcher*` ve açılış ekranı (Fıstık, kâğıt zemin `#F4EFE6`), araç görselleri: sahne zeminleri `drawable-nodpi/widget_scene_<anahtar>_strip|wide|tall.png` (≈4:1, 2:1, 1.2:1), saydam maskot kareleri `widget_anim_<anahtar>_0…5.png` ile `_write` / `_noted` pozları (kare sayısı `CepWidgetProvider.FRAMES` ile aynı olmalı), küçük araç büstleri `widget_bust_<anahtar>[_write|_noted].png`, maskot renginde düğme şekilleri `drawable/widget_btn|btn_soft|chip|fab_<anahtar>.xml` ve renkleri `values(-night)/widget_mascot_colors.xml` (betikteki `WIDGET_BTN`; yazı kontrastı 4.5'in altındaysa betik durur), ayrıca `widget_mascot_<anahtar>.png` + `widget_preview.png`. Araç görselleri küçük bir piksel ızgarasında çizilip tam sayı katla büyütülür ve dizinli (palet) PNG olarak yazılır (hepsi ≈ 300 KB) ve web simgeleri `public/icon*.png`, `public/icon.svg`. Maskot değişince yeniden üret:

```bash
npx tsx scripts/gen-android-icons.ts
```

Betik tarayıcı gerektirmez (PNG'yi kendisi kodlar); maskot pikselleri keskin kalır ve uyarlanabilir simgenin güvenli bölgesinin (66 dp daire) içinde durur.

### APK nasıl üretiliyor?

`.github/workflows/android.yml` her gönderimde testleri çalıştırır, web uygulamasını derler, Capacitor ile Android projesine gömer ve `assembleRelease` ile APK üretir. Varsayılan daldaki her derleme *Releases* sayfasına `v1.0.<çalıştırma no>` olarak eklenir.

### Kalıcı imza anahtarı (bir kez yapılır)

Android, bir güncellemeyi ancak aynı anahtarla imzalandıysa eskisinin üzerine kurar. Anahtar depoda **değil**, GitHub secret olarak durur:

*Settings → Secrets and variables → Actions → New repository secret*

- `CEP_KEYSTORE_B64`: `.jks` dosyasının base64 hali
- `CEP_KEYSTORE_PASSWORD`: anahtar parolası (anahtar takma adı: `cep-defteri`)

Secret yoksa APK yine üretilir, ama her derlemede değişen geçici bir test anahtarıyla imzalanır. Bu durumda güncellemeden önce yedek alıp eski uygulamayı kaldırman gerekir.

Kendi anahtarını üretmek istersen:

```bash
keytool -genkeypair -keystore cep.jks -storetype PKCS12 -alias cep-defteri -keyalg RSA -keysize 4096 -validity 36500
base64 -w0 cep.jks   # çıktıyı CEP_KEYSTORE_B64 olarak ekle
```

### Kendi bilgisayarında derlemek

Android Studio (veya Android SDK + JDK 21) gerekir:

```bash
npm ci && npm run build && npx cap sync android
cd android && ./gradlew assembleDebug   # app/build/outputs/apk/debug/app-debug.apk
```

## 2. Tarayıcıdan "uygulama olarak yükle" (Android ve iPhone)

Bunun için uygulamanın bir adreste yayında olması gerekir. Depo ayarlarında **Settings → Pages → Source: GitHub Actions** seçilince `.github/workflows/pages.yml` uygulamayı <https://kivancogretmenoglu.github.io/cep-defteri/> adresinde yayınlar.

- **Android (Chrome):** adresi aç, ⋮ menüsünden **Uygulamayı yükle / Ana ekrana ekle**'ye dokun.
- **iPhone (Safari):** adresi aç, Paylaş düğmesinden **Ana Ekrana Ekle**'ye dokun. iPhone'a APK kurulamaz; bu yol iPhone için tek seçenek.

Bu yolla eklenen uygulama tam ekran açılır ve internetsiz çalışır. Veriler o tarayıcının deposunda durur: tarayıcı verilerini temizlersen silinir, o yüzden düzenli yedek al.
