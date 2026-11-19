# Cep Defteri — Gizlilik Politikası

_Son güncelleme: 15 Kasım 2026_

**Kısaca:** Cep Defteri hesap açtırmaz, reklam göstermez, analiz/izleme aracı kullanmaz ve kayıtlarını hiçbir sunucuya göndermez. Girdiğin her şey yalnızca senin cihazında saklanır.

## Hangi veriler, nerede?

- **Kayıtların** (gelir, gider, hesaplar, planlar, hedefler, ayarlar) yalnızca cihazındaki uygulama deposunda tutulur. Geliştirici dahil hiç kimse bunlara erişemez.
- **Otomatik yedek** (Android, açıksa) cihazının *Belgeler/CepDefteri* klasörüne yazılır. Bu dosyalar da yalnızca cihazındadır.
- **Yedek dosyası paylaşma**: "Yedek indir" ile oluşturduğun dosyayı nereye göndereceğini (ör. Drive, mesaj) sen seçersin; uygulama kendiliğinden hiçbir yere göndermez.
- **Uygulama kilidi**: PIN yalnızca tuzlu bir özet (PBKDF2) olarak cihazda tutulur. Parmak izi/yüz tanıma Android sistemi tarafından yapılır; biyometrik veriler uygulamaya hiç ulaşmaz.
- **Bildirimler** cihazda planlanır; hiçbir bildirim sunucusu kullanılmaz.
- **Ana ekran aracı (widget)**, kullanılabilir tutar gibi özet bilgileri cihazın kendi deposundan gösterir. "Widget'ta tutarı gizle" ile gizleyebilirsin.

## İnternet bağlantısı ne için?

Yalnızca **altın, döviz ve hisse senedi fiyatlarını** almak için (bir yatırım hesabında altın, döviz ya da hisse tutuyorsan). Altın/döviz için herkese açık fiyat listesi `finans.truncgil.com` adresinden, yedek olarak `cdn.jsdelivr.net` ve `currency-api.pages.dev` adreslerinden indirilir. Hisse fiyatları için yalnızca **elindeki (ya da o an seçtiğin) hissenin kodu** (ör. THYAO, AAPL) şu adreslere gönderilir: `query1.finance.yahoo.com` / `query2.finance.yahoo.com` (Yahoo Finance), `api.nasdaq.com` (Nasdaq) ve `www.isyatirim.com.tr` (İş Yatırım). Bu isteklerde **hiçbir kişisel veri, tutar, kayıt ya da kimlik bilgisi gönderilmez**; yalnızca fiyat istenir. Bu sunucular, her web isteğinde olduğu gibi IP adresini teknik olarak görebilir. Ayarlar'dan otomatik fiyat almayı kapatıp fiyatı elle girebilirsin; o durumda uygulama hiç internete bağlanmaz.

## Paylaşım ve satış

Verilerini toplamıyoruz; dolayısıyla kimseyle paylaşmıyor ya da satmıyoruz. Reklam ağı, analiz aracı veya üçüncü taraf takip kodu yoktur.

## Verilerini silmek

Uygulamayı kaldırmak, uygulama içindeki tüm verileri siler. Otomatik yedek dosyaları *Belgeler/CepDefteri* klasöründe kalır; istersen dosya yöneticisinden silebilirsin. Uygulama içinde Ayarlar'dan da verilerini sıfırlayabilirsin.

## Çocuklar

Uygulama 13 yaş altı çocuklara yönelik değildir ve bilerek kimseden veri toplamaz.

## Değişiklikler ve iletişim

Bu politika değişirse bu sayfa güncellenir. Sorular için: cep.defteri2026@gmail.com

---

# Cep Defteri — Privacy Policy

_Last updated: November 15, 2026_

**In short:** Cep Defteri has no accounts, no ads, no analytics or tracking, and never sends your records to any server. Everything you enter stays on your device.

## What data, and where?

- **Your records** (income, expenses, accounts, plans, goals, settings) are stored only in the app's storage on your device. Nobody, including the developer, can access them.
- **Automatic backup** (Android, if enabled) is written to your device's *Documents/CepDefteri* folder, also only on your device.
- **Sharing a backup file**: when you use "Download backup", you choose where to send the file (e.g. Drive, a message). The app never sends it anywhere by itself.
- **App lock**: your PIN is stored only as a salted hash (PBKDF2) on the device. Fingerprint/face unlock is handled by Android; biometric data never reaches the app.
- **Notifications** are scheduled on the device; no push server is used.
- **Home-screen widget** shows summary figures from the device's own storage. You can hide amounts with "Hide amount on widget".

## Why internet access?

Only to fetch **gold, currency and stock prices** (if an investment account holds gold, currency or stocks). Gold/currency prices come as a public price list from `finans.truncgil.com`, with `cdn.jsdelivr.net` and `currency-api.pages.dev` as fallbacks. For stock prices, only the **ticker of a stock you hold (or are picking)** (e.g. THYAO, AAPL) is sent to `query1.finance.yahoo.com` / `query2.finance.yahoo.com` (Yahoo Finance), `api.nasdaq.com` (Nasdaq) and `www.isyatirim.com.tr` (İş Yatırım). **No personal data, amounts, records or identifiers are sent** — only prices are requested. As with any web request, these servers can technically see your IP address. You can turn off automatic prices in Settings and enter prices manually; the app then never connects to the internet.

## Sharing and selling

We don't collect your data, so we don't share or sell it. There are no ad networks, analytics tools or third-party trackers.

## Deleting your data

Uninstalling the app deletes all in-app data. Automatic backup files remain in *Documents/CepDefteri*; you can delete them with a file manager. You can also reset your data from Settings inside the app.

## Children

The app is not directed at children under 13 and does not knowingly collect data from anyone.

## Changes and contact

If this policy changes, this page will be updated. Questions: cep.defteri2026@gmail.com
