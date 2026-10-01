# Telefona kurulum

İki yol var. İkisi de internetsiz çalışır ve verileri yalnızca telefonda tutar. **İkisinin verileri ayrıdır**; birinden diğerine geçerken *Ayarlar → Yedek indir* ve diğerinde *Yedekten geri yükle* kullan.

## 1. Android APK (önerilen: gerçek uygulama)

**APK'yı indir:** telefonda <https://github.com/KivancOgretmenoglu/cep-defteri/releases/latest> adresini aç, `CepDefteri-1.0.N.apk` dosyasına dokun.

**Kur:** indirilen dosyayı aç. Android "bilinmeyen uygulamaları yükleme" izni isterse tarayıcına (Chrome) bu izni ver ve **Yükle**'ye dokun. Play Protect uyarısı çıkarsa *Yine de yükle* de: uygulama Play Store'dan gelmediği için bu uyarı normal.

**Güncelleme:** yeni sürümü aynı şekilde indirip kur. Kalıcı imza anahtarı tanımlıysa (aşağıda) eski sürümün üzerine kurulur, **veriler korunur**.

**Yedek:** *Ayarlar → Yedek indir* Android paylaşım ekranını açar; Drive'a, Dosyalar'a ya da kendine mesaj olarak kaydedebilirsin. Geri yüklerken *Yedekten geri yükle* ile o dosyayı seç.

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
