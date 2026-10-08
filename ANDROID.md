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

**Ana ekran aracı (widget)**: ana ekranda boş yere uzun bas → *Araçlar* → *Cep Defteri – Kullanılabilir para*. Seçili maskotu, kullanılabilir tutarı ve dönemi ("Ekim sonuna kadar") gösterir; örnek veri modunda "örnek veri" yazar. Metinler uygulamada seçilen dili izler (Türkçe / English). Metinler `src/native/widgetPayload.ts`'te hazırlanır; tutarlar ayrıca ham kuruş + dil olarak gider ve `CepWidgetProvider.formatMoney` bunları `src/domain/money.ts` ile birebir aynı yazar ("53.168,58 TL" / "₺53,168.58"). Kenarından sürükleyip boyutunu değiştirince düzen de değişir; seçim **boyut ve en/boy oranına** göredir (`CepWidgetProvider.pickSize`, dp):

| Kova | Koşul (dp) | Samsung ızgarası (hücre ≈ 80×100 dp) | Düzen | İçerik |
| --- | --- | --- | --- | --- |
| küçük | h < 130, w < 200 | 2×1 | `widget_small` | 2:1 mini sahne, yüksekliğin ≈ %88'i kadar maskot büstü (en fazla aracın yarısı), sağda dikey ortalı tutar |
| geniş | h < 130, w ≥ 200 | 3×1, 4×1, 5×1 | `widget_cep` | ≈3.3:1 şerit sahne, solda maskot (w < 280'de büst), büyük tutar, dönem (dar araçta kısa "Ekim sonu" ya da gizli), yuvarlak **+** |
| büyük | w ≥ 280, h ≥ 250 | 4×3, 4×4, 5×3+ | `widget_large` | uzun sahne, canlanan maskot (en fazla aracın %45'i), tutar, dönem, **bugünkü harcama**, Gider / Gelir, sığdığı kadar (en fazla 3) **tek dokunuşla kayıt** çipi |
| orta | w ≥ 260, w/h ≥ 1.4 | 4×2, 5×2 | `widget_medium` | geniş sahne, solda maskot, sağ üstte tutar + dönem, **Gider** / **Gelir** |
| kare | geri kalan her şey | 2×2, 3×2, 3×3, 2×3 | `widget_square` | kare sahne, üstte tutar + dönem, altta ortada büyük maskot (hiç kırpılmaz, ayakları zeminde), sağ altta küçük **+** |

Android 12+ başlatıcının bildirdiği gerçek boyutların (`OPTION_APPWIDGET_SIZES`, dikey/yatay) her biri için tam o boyutun düzeni `RemoteViews(Map<SizeF, RemoteViews>)` ile verilir; boyutlar bildirilmemişse 16 çapa (w ∈ 100/200/280/320 × h ∈ 40/130/200/250, her biri `pickSize` ile etiketli) kullanılır ve başlatıcı sığanların en yakınını seçer. Android 11 ve öncesinde düzen, aracın en/boy seçeneklerinden (dikey: en küçük genişlik × en büyük yükseklik) `onAppWidgetOptionsChanged`'de seçilir. Bilinen boyutta Java ayrıca büst/maskot genişliğini (`setMaxWidth`), dönem metninin tam/kısa/gizli hâlini ve sığmayan çipleri ayarlar; tutar Android 8+'da `autoSizeTextType="uniform"` ile hiç kesilmeden küçülür (8 öncesinde boyut genişlikten hesaplanır). Tek satırlık ve kare araçta "Not aldım ✓" gibi durum notu birkaç dakikalığına dönemin yerini alır.

Tasarım "önce sahne"dir: maskotun kendi sahnesi (kedi: sıcak oda + kilim, baykuş: aylı gece penceresi + kitaplık, sincap: gökyüzü + meşe dalı, kirpi: çayır + yapraklı toprak, köpek: güneşli park + çit) aracın **tamamını** kaplar (`widget_scene`, `centerCrop`; her düzenin oranında ayrı görsel, bu yüzden az kırpılır), maskot sahnenin zemin bandında büyük durur. Metin, açık temada %85 kâğıt, koyu temada %85 koyu kâğıt renkli yarı saydam bir panelde (`widget_panel`, `widget_scrim`) olduğundan her sahnede okunur. Düğmeler **maskotun renginde**: Gider ve "+" dolu (`widget_btn_<anahtar>`, `widget_fab_<anahtar>`; kedi turuncu, baykuş mavi, sincap kahve, kirpi adaçayı yeşili, köpek karamel), Gelir ve çipler aynı rengin saydam tonu (`widget_btn_soft_`, `widget_chip_<anahtar>`). Tüm dokunulabilir yüzeyler (düğmeler, "+", çipler, tutar paneli) `<ripple>`dır: basınca yarı saydam mürekkep dalgası; sahnenin boş yerine basınca kökteki ön plan dalgası (`widget_ripple_root`). **Çerçeve**: kök zemini maskot renginin biraz koyusu (`widget_frame_<anahtar>`), içerik (`widget_inner`) 2 dp içeride, böylece kenarda duvar kâğıdından ayıran 2 dp'lik çizgi kalır; dokunuşları engelleyen üst katman yoktur. Köşeler Android 12+'da `clipToOutline` ve sistemin araç köşe yarıçapıyla (`values-v31/widget_dimens.xml`) yuvarlanır. Önizleme (tüm ızgara boyutları, gizli durum, koyu tema): `docs/widget-preview.png`.

**Gizli tutar**: uygulamada *Toplamları gizle* açıksa **ya da** *Ayarlar → Ana ekran aracı → Widget'ta tutarı gizle* (yalnız bu cihaz, `widgetPrefs.ts` `hideAmount`) açıksa araç tutarları "•••• TL" (en: "₺••••") gösterir, çiplerde tutar yazmaz ("☕ Kahve"), "Bugün" satırı da gizlenir ve maskot uygulamadaki gibi **gizli ajan** kıyafetine (fötr şapka + güneş gözlüğü) girer (`_spy` görselleri). Payload'da `hidden`.

**Güncelleme**: uygulamada kayıt eklenince/değişince araç ≈ 0,3 sn içinde, uygulama arka plana geçerken de beklemeden güncellenir (`useNativeSync.ts`). Çiple eklenen kayıt uygulama açılmadan **hemen** tutara yansır (iyimser gösterim): `CepWidgetProvider` kuyrukta olup payload'ın `seen` listesinde (uygulamanın zaten işlediği qid'ler, `widgetSeen.ts`) bulunmayan öğeleri kullanılabilir tutardan düşer (gelirse ekler) ve bugün dokunulmuş giderleri "Bugün"e ekler; yalnız gerçek veride. Uygulama kuyruğu işleyip sildikten sonra taze payload gönderir.

- Tutara/panele ya da sahneye dokununca uygulama açılır. **Gider** / **Gelir** doğrudan ilgili sekmede yeni kayıt sayfasını açar (`io.github.kivancogretmenoglu.cepdefteri://add?type=expense|income`; **+ Ekle** ve kutucuk `…://add`). Bu bağlantıyla açılınca maskot 2 dk "Yazmaya gidiyorum…" pozuna geçer (`MainActivity.onNewIntent`); uygulamada bir kayıt eklenince (veya çipe dokununca) 3 dk "Not aldım! ✓" pozunu gösterir. Pozun bitişi için kesin olmayan bir `AlarmManager` alarmı kurulur (izin gerekmez); alarm gecikse bile bir sonraki güncellemede poz düşer.
- **Canlandırma** (yalnız büyük araç): maskot 6 karelik bir döngü oynar (`ViewFlipper`, 420 ms; kedi yumak kovalar, baykuş başını çevirip göz kırpar, sincap palamut kemirir, kirpi yerleri koklar, köpek top zıplatıp kuyruk sallar). *Ayarlar → Ana ekran aracı → Widget animasyonu* kapatılırsa sabit kare gösterilir (cihaz tercihi, `src/native/widgetPrefs.ts`; payload'da `animate`).
- **Tek dokunuşla kayıt** (büyük araç): son 60 günde en az 3 kez tekrarlanan giderlerden (aynı kategori + tutar + not; `frequentTemplates`) en fazla 3 çip, ör. "☕ Kahve 60 TL". Çipe dokunmak **uygulamayı açmaz**: `CepWidgetProvider` çipin o anki şablonunu benzersiz bir `qid` ve dokunma zamanıyla SharedPreferences'taki kuyruğa ekler (en fazla 50), aracı hemen "Not aldım ✓" pozuna ve kuyruk düşülmüş tutara geçirir, sonra kısa bir bildirim ("Not aldım ✓ ☕ Kahve 60 TL") gösterir. Uygulama açılınca / öne gelince `src/native/widgetQueue.ts` kuyruğu okur (`WidgetBridge.readQueue`), her öğeyi dokunulan günün tarihiyle kayda çevirir (`addTx`), "Widget'tan 2 kayıt eklendi" bildirimini **Geri al** ile gösterir ve işlenenleri siler (`ackQueue`; arada eklenenler kalır). İşlenen `qid`'ler cihazda hatırlanır, bu yüzden silme başarısız olsa da aynı kayıt iki kez eklenmez. Hesabı silinmiş/arşivlenmiş gibi eklenemeyen öğeler sayılıp atılır. Örnek veri modunda çip gösterilmez ve kuyruk işlenmez (gerçek moda dönülünce işlenir).

**Hızlı ayarlar kutucuğu**: bildirim panelini aşağı çek → kalem/düzenle → *Cep Defteri: + Kayıt* kutucuğunu panele sürükle. Dokununca panel kapanır ve yeni kayıt sayfası açılır (ekran kilitliyse önce kilit açılır). `AddTileService.java`; Android 14+ `startActivityAndCollapse(PendingIntent)`, öncesinde `Intent` sürümü kullanılır.

**Uygulama simgesi = maskot**: simge seçilen maskotu (Fıstık, Bilge, Ceviz, Diken, Karamel) izleyebilir. Manifest'te her maskot için bir `<activity-alias>` (`.Icon_<anahtar>`) vardır; yalnız biri etkindir (varsayılan Fıstık). `AppIconPlugin.java` seçileni etkinleştirip diğerlerini kapatır (`PackageManager.setComponentEnabledSetting`, `DONT_KILL_APP`); JS tarafı `src/native/appIcon.ts` (`appIconSupported()`, `setAppIcon(key)`, `getAppIcon()`; tarayıcıda hiçbir şey yapmaz). Bilinen kısıtlar:
- Bazı başlatıcılar yeni simgeyi birkaç saniye (bazen telefonu yeniden başlatana kadar) geç gösterir.
- Bazı başlatıcılar (ör. Samsung One UI, bazı Xiaomi sürümleri) değişiklikte **ana ekrandaki kısayolu kaldırır**; uygulama çekmecesinden yeniden sürüklemek gerekir. Ana ekran aracı etkilenmez.
- Değişiklik anında açık olan görev bazı sürümlerde kapanabilir; veri kaybı olmaz (her şey cihaza yazılmıştır).
- Tarayıcı / PWA sürümünde simge değiştirilemez; web simgesi her zaman Fıstık'tır.
Bildirime dokunma, ana ekran aracı ve `://add` derin bağlantısı takma adlardan bağımsız çalışır: derin bağlantı doğrudan `MainActivity`'ye gider, araç ve bildirimler etkin takma adın başlatma niyetini kullanır.

**Aracı / kutucuğu uygulamadan ekleme**: `ShortcutsPlugin.java` (eklenti adı `Shortcuts`) sistemin ekleme pencerelerini açar; JS tarafı `src/native/shortcuts.ts` (`pinWidgetSupported()`, `addTileSupported()`, `requestPinWidget()`, `requestAddTile()`; destek bayrakları açılışta `initShortcuts()` ile bir kez okunur, o zamana dek ve tarayıcıda `false`).
- Araç: Android 8+ (API 26) ve başlatıcı destekliyorsa `AppWidgetManager.requestPinAppWidget(CepWidgetProvider)`. Sonuç `'ok'` yalnız pencerenin gösterildiğini söyler; kullanıcının aracı gerçekten bırakıp bırakmadığı bildirilmez. Başlatıcı desteklemiyorsa `'unsupported'`.
- Kutucuk: Android 13+ (API 33) `StatusBarManager.requestAddTileService(AddTileService, tile_label, ic_tile_add)`; sonuç `'ok'` (eklendi), `'already'` (zaten var), `'dismissed'` (reddedildi), diğer sistem hata kodları `'error'`. Sistem, isteği yalnız uygulama ön plandayken kabul eder; kullanıcı arka arkaya birkaç kez reddederse sistem bir süre yeni pencere göstermeyebilir (`'dismissed'`/`'error'` döner).

**Titreşim**: `src/native/haptics.ts` → `haptic('light' | 'success' | 'warning')` (`@capacitor/haptics`); yalnız uygulamada çalışır, hata vermez.

**Otomatik yedek** (*Ayarlar → Otomatik yedek*, varsayılan açık): her gün bir kopya `Belgeler/CepDefteri/cep-defteri-otomatik-YYYY-AA-GG.json` dosyasına yazılır (gün içinde veri değişirse o günün dosyası güncellenir), son 7 gün tutulur. Bu klasör **uygulamayı silsen de kalır**: yeniden kurunca *Ayarlar → Yedekten geri yükle* ile oradaki en yeni dosyayı seç. Örnek veri ve boş veri yedeklenmez. Android 10 ve öncesinde ilk seferde dosya izni istenebilir (*Şimdi yedekle*). Tarayıcı sürümünde son 5 günün kopyası tarayıcının kendi deposunda tutulur ve aynı karttan geri yüklenir; 14 gündür yedek dosyası indirilmediyse nazik bir hatırlatma çıkar.

Kod: `src/lock/` (kilit), `src/native/` (bildirim planı, araç köprüsü, otomatik yedek, eşitleme), `android/app/src/main/java/.../CepWidgetProvider.java` ve `WidgetBridgePlugin.java` (araç, çip kuyruğu ve JS köprüsü), `AddTileService.java` (hızlı ayarlar kutucuğu), `AppIconPlugin.java` (simge), `ShortcutsPlugin.java` (araç/kutucuk ekleme istekleri).

**Simgeler ve görseller** maskot tanımlarından (`src/mascot/characters.ts`) üretilir: başlatıcı simgeleri (her maskot için kare, yuvarlak ve uyarlanabilir; zemin `palette.iconBg`), varsayılan `ic_launcher*` ve açılış ekranı (Fıstık, kâğıt zemin `#F4EFE6`), araç görselleri: sahne zeminleri `drawable-nodpi/widget_scene_<anahtar>_mini|strip|square|wide|tall.png` (2:1, ≈3.3:1, 1:1, 2:1, 1.2:1), saydam maskot kareleri `widget_anim_<anahtar>_0…5.png` ile `_write` / `_noted` pozları (kare sayısı `CepWidgetProvider.FRAMES` ile aynı olmalı), küçük araç büstleri `widget_bust_<anahtar>[_write|_noted].png` ve bunların hepsinin gizli ajan takımı (`widget_anim_<anahtar>_spy_*`, `widget_bust_<anahtar>_spy*`), maskot renginde dalgalı (ripple) düğme şekilleri `drawable/widget_btn|btn_soft|chip|fab_<anahtar>.xml`, çerçeve `widget_frame_<anahtar>.xml` ve renkleri `values(-night)/widget_mascot_colors.xml` (betikteki `WIDGET_BTN`; yazı kontrastı 4.5'in altındaysa betik durur), ayrıca `widget_mascot_<anahtar>.png` + `widget_preview.png`. Araç görselleri küçük bir piksel ızgarasında çizilip tam sayı katla büyütülür ve dizinli (palet) PNG olarak yazılır (hepsi ≈ 600 KB) ve web simgeleri `public/icon*.png`, `public/icon.svg`. Maskot değişince yeniden üret:

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
