# Play Store'a yükleme paketi

Bu klasör Google Play Console'da doldurman gereken her şeyi içerir: metinler, form cevapları, görseller ve adım adım yapılacaklar.

- Görseller: `graphics/` (ekran görüntüleri `tr/`, `en/`; tanıtım görseli `feature-*.png`; simge `icon-512.png`)
- Gizlilik politikası: `public/privacy.html` → yayında `https://kivancogretmenoglu.github.io/cep-defteri/privacy.html` (GitHub Pages açılınca, aşağıya bak)
- Yüklenecek dosya: Releases'taki **`CepDefteri-1.0.N.aab`** (APK değil)

---

## 0. Önce senin yapman gerekenler (bir kez)

1. **Geliştirici hesabı:** <https://play.google.com/console> → kişisel hesap → 25 $ tek seferlik ücret → kimlik doğrulama (birkaç saat ile 2 gün sürebilir).
2. **GitHub Pages'i aç** (gizlilik politikası adresi için): GitHub'da depo → *Settings* → *Pages* → *Build and deployment / Source*: **GitHub Actions**. Sonraki gönderimde `…github.io/cep-defteri/privacy.html` yayına girer.
   - Depo gizliyse Pages ücretsiz planda çalışmayabilir; o durumda depoyu herkese açık yap ya da `privacy.html`'i başka bir yere (ör. Google Sites, Notion herkese açık sayfa) kopyala.
3. **Geliştirici adı:** `Fıstık Stüdyo` · **İletişim e-postası:** `cep.defteri2026@gmail.com` (gizlilik politikasına da yazıldı).

## 1. Uygulamayı oluştur

Play Console → **Uygulama oluştur**
- Uygulama adı: `Cep Defteri: Maskotlu Bütçe`
- Varsayılan dil: **Türkçe – tr-TR**
- Uygulama mı oyun mu: **Uygulama**
- Ücretsiz mi ücretli mi: **Ücretsiz**
- Beyanlar: Geliştirici Program Politikaları ✓, ABD ihracat yasaları ✓

## 2. Uygulama içeriği (Policy → App content)

| Bölüm | Cevap |
|---|---|
| Gizlilik politikası | `https://kivancogretmenoglu.github.io/cep-defteri/privacy.html` |
| Uygulama erişimi | **Tüm işlevler özel erişim gerektirmez** (hesap/giriş yok) |
| Reklamlar | **Hayır, reklam içermiyor** |
| İçerik derecelendirmesi | Aşağıdaki anket cevaplarına bak |
| Hedef kitle | **16-17** ve **18+** (13 altı ve 13-15 seçme → çocuk politikasına girer) |
| Haber uygulaması | Hayır |
| COVID-19 | Hayır |
| Veri güvenliği | Aşağıdaki cevaplara bak |
| Devlet uygulaması | Hayır |
| Finansal özellikler | **"Uygulamam bu finansal özelliklerden hiçbirini sunmuyor"** (banka/kredi/ödeme/yatırım işlemi yok; yalnızca kişisel kayıt tutuyor). Seçeneklerde "kişisel bütçe/finans takibi" gibi bir madde varsa onu seç. |
| Sağlık | Hayır |

### Veri güvenliği formu

- *Uygulamanız, gerekli kullanıcı verisi türlerinden herhangi birini topluyor veya paylaşıyor mu?* → **Hayır**
  - Gerekçe: Tüm kayıtlar yalnızca cihazda kalır. Google'ın tanımında "toplama" = verinin cihazdan geliştiriciye/üçüncü tarafa aktarılması; bizde böyle bir aktarım yok. Altın/döviz fiyatı isteği kullanıcı verisi içermez.
- Form bu cevapla kısa sürer. "Veriler aktarım sırasında şifreleniyor mu" gibi sorular gelirse: fiyat istekleri HTTPS'dir.
- "Kullanıcılar verilerinin silinmesini isteyebilir mi": Uygulamayı kaldırmak + Ayarlar → Tüm verileri sil (hesap olmadığından silme talebi adresi gerekmez).

### İçerik derecelendirmesi anketi (IARC)

- E-posta: cep.defteri2026@gmail.com
- Kategori: **Referans, Haber veya Eğitici değil → "Diğer tüm uygulama türleri" / Utility, Productivity**
- Şiddet, cinsellik, küfür, uyuşturucu, kumar, korku: **hepsi Hayır**
- Kullanıcılar arası etkileşim / içerik paylaşımı: **Hayır** (yalnızca kullanıcının kendi yedek/kart görselini paylaşma menüsü var; uygulama içi sohbet yok)
- Konum paylaşımı: **Hayır**
- Dijital ürün satın alma: **Hayır** (şimdilik)
- Beklenen sonuç: **3+ / Herkes**

## 3. Mağaza girişi (Grow → Store presence → Main store listing)

### Türkçe (tr-TR)

**Uygulama adı (en fazla 30):**
```
Cep Defteri: Maskotlu Bütçe
```

**Kısa açıklama (en fazla 80):**
```
Paranı 3 dokunuşta kaydet, ay sonuna kadar ne kadar harcayabileceğini bil.
```

**Tam açıklama (en fazla 4000):**
```
Cep Defteri, üniversite hayatı için yapılmış sade ve hızlı bir bütçe defteri. Hesap açmana gerek yok, reklam yok, kayıtların telefonundan hiç çıkmaz.

🐾 Bir yol arkadaşı seç
Fıstık (kedi), Bilge (baykuş), Ceviz (sincap), Diken (kirpi), Karamel (köpek) ya da Pamuk (tavşan). Maskotun kayıtlarına göre hisseder ve her düşüncesinin bir nedeni vardır: "Neden böyle?" dediğinde kuralı açıkça söyler. Asla seni suçlamaz.

⚡ 3 dokunuşta kayıt
Tutar → kategori → kaydet. Sık girdiğin kayıtlar ve tutarlar tek dokunuşla gelir. Kategori yoksa listede "+ Yeni kategori" ile hemen eklersin.

💸 Ay sonuna kadar ne kadar harcayabilirsin?
Kullanılabilir para; kira, abonelik gibi yaklaşan ödemeleri ve birikim payını düşerek hesaplanır. "Günde yaklaşık şu kadar" diye net bir rakam görürsün.

📈 Plan çizgisi
"Ay sonunda en az şu kadar kalsın" de; bakiye grafiğinde bu hedefe inen bir plan çizgisi çizilir. Altına inersen maskotun nazikçe uyarır.

🗓 Planlar ve borçlar
Her ay tekrarlanan ödemeler, taksitler, beklenen gelirler, arkadaşlarla hesap bölüşme ve borç/alacak takibi.

🪙 Altın ve döviz birikimi
Yatırım hesabını gram, çeyrek, yarım, tam, Cumhuriyet altını ya da dolar, euro, sterlin olarak tutabilirsin; değeri güncel fiyatla hesaplanır.

📱 Widget ve hızlı kayıt
Maskotunun sahnesiyle ana ekran aracı: kullanılabilir paranı gösterir, Gider/Gelir düğmeleri ve uygulamayı açmadan tek dokunuşla sık kayıt. Bildirim panelinde "+ Kayıt" kutucuğu da var.

🔒 Gizlilik
• Hesap yok, reklam yok, izleme yok.
• Kayıtların yalnızca telefonunda; otomatik günlük yedek Belgeler klasörüne yazılır.
• PIN ve parmak izi ile uygulama kilidi, bakiyeleri tek dokunuşla gizleme.
• İnternet yalnızca altın/döviz fiyatı için kullanılır ve kapatılabilir.

Ayrıca: aylık bütçe ve kategori limitleri, ay karnesi, raporlar, etiketler, sınav haftası modu, karanlık tema, Türkçe ve İngilizce.
```

### English (en-US)

**App name:**
```
Cep Defteri: Pixel Budget
```

**Short description:**
```
Log money in 3 taps and know how much you can spend until month end.
```

**Full description:**
```
Cep Defteri is a simple, fast budget notebook made for student life. No account, no ads, and your records never leave your phone.

🐾 Pick a pixel buddy
Peanut (cat), Sage (owl), Walnut (squirrel), Spike (hedgehog), Caramel (dog) or Cotton (bunny). Your buddy's mood comes from your records, and it always tells you why — tap "Why?" to see the rule. It never shames you.

⚡ Log in 3 taps
Amount → category → save. Frequent entries and amounts are one tap away. Missing a category? Add it right in the list with "+ New category".

💸 How much can you spend until month end?
Available money subtracts upcoming payments like rent and subscriptions plus your savings reserve, and shows a clear "about this much per day".

📈 Plan line
Set "keep at least this much at month end" and the balance chart draws a plan line down to it. Drift below and your buddy gently lets you know.

🗓 Plans and IOUs
Recurring payments, installments, expected income, splitting bills with friends and tracking who owes whom.

🪙 Gold and currency savings
Keep an investment account in gold (gram, quarter, half, full, Republic coins) or USD/EUR/GBP; its value updates with current prices.

📱 Widget and quick entry
A home-screen widget with your buddy's scene: available money, Expense/Income buttons and one-tap frequent entries without opening the app. There's also a "+ Entry" Quick Settings tile.

🔒 Privacy
• No account, no ads, no tracking.
• Records stay on your phone; a daily automatic backup goes to your Documents folder.
• App lock with PIN or fingerprint, hide balances with one tap.
• Internet is used only for gold/currency prices, and can be turned off.

Also: monthly budget and category limits, monthly report card, reports, tags, exam-week mode, dark theme, Turkish and English.
```

### Grafikler

| Alan | Dosya | Ölçü |
|---|---|---|
| Uygulama simgesi | `graphics/icon-512.png` | 512×512 |
| Öne çıkan grafik | `graphics/feature-tr.png` (EN girişine `feature-en.png`) | 1024×500 |
| Telefon ekran görüntüleri (2–8) | `graphics/tr/*.png` (EN girişine `graphics/en/*.png`) | 1080×1920 |

**Kategori:** Finans · **Etiketler:** Bütçe, Kişisel finans · **E-posta:** cep.defteri2026@gmail.com

## 4. Kapalı test (12 kişi × 14 gün)

1. Play Console → **Test → Kapalı test → Kanal oluştur** (ör. "Arkadaşlar").
2. **Test kullanıcıları:** bir e-posta listesi oluştur, 12+ kişinin **Google hesabı (Gmail)** adreslerini ekle. Ya da bir Google Grubu oluşturup onun adresini ekle (kişiler gruba kendileri katılır, daha kolay).
3. **Sürüm oluştur → App Bundle yükle:** Releases'taki en yeni `CepDefteri-1.0.N.aab`.
   - İlk yüklemede **Play App Signing** sorulur → **"Google tarafından oluşturulan anahtarı kullan" (önerilen)**. Bizim CI anahtarımız "yükleme anahtarı" olur, ayrıca bir şey yapman gerekmez.
   - Sürüm notu: `İlk test sürümü. Bulduğun her sorunu bana yaz!`
4. **İncelemeye gönder.** İlk inceleme birkaç saat – birkaç gün sürebilir.
5. Onaylanınca **katılım bağlantısını** (opt-in URL) test kullanıcılarına gönder. Bağlantıyı açıp "Test kullanıcısı ol"a basmaları, sonra Play Store'dan indirmeleri gerekir.
6. **14 gün boyunca 12 kişinin uygulamayı yüklü tutması** gerekir (her gün açmak şart değil ama silmesinler). Google bu sürede uygulamayı gerçekten kullanıp kullanmadıklarına ve geri bildirime de bakıyor.
7. 14 gün dolunca **Üretim erişimi için başvur** → birkaç soru (testte ne öğrendin, neyi düzelttin) → onaydan sonra herkese açık yayın.

> İpucu: Daha hızlı dağıtmak istersen **İç test** kanalı da var (100 kişiye kadar, inceleme beklemeden). Ama 14 gün şartı için **kapalı test** sayılıyor.

## 5. Önemli notlar

- **Sürüm numarası:** Her yeni AAB'nin `versionCode`'u bir öncekinden büyük olmalı. CI bunu derleme numarasından (1.0.N) otomatik veriyor; sadece en yeni dosyayı yükle.
- **APK'yı GitHub'dan kuranlar:** Play Store sürümü farklı bir anahtarla (Google'ın imzası) gelir. GitHub'dan kurulan uygulamanın üzerine Play sürümü kurulamaz: önce *Ayarlar → Yedek indir*, eski uygulamayı kaldır, Play'den kur, *Yedekten geri yükle*.
- **İzinler:** INTERNET, POST_NOTIFICATIONS, RECEIVE_BOOT_COMPLETED, USE_BIOMETRIC/USE_FINGERPRINT, VIBRATE, WAKE_LOCK (eski Android'de dosya). Hiçbiri özel beyan gerektirmez. Kesin alarm (SCHEDULE_EXACT_ALARM) bilerek kaldırıldı; bildirimler birkaç dakika kayabilir. CI günlüğündeki "İzinleri listele" adımı güncel listeyi yazar.
