# Sahne serisi: senaryolar

Kalıp: gerçek hayattan bir para ikilemi, bir film türünün sahnesinde anlatılır. Ortada 3 saniyelik bir karar anı, sonda yorumda cevaplanacak bir soru var. Oyun yok.

## Hepsinde ortak
- Ses: marka sesi tarifi (Buğra, `eleven_v4` + satır başında ton etiketi, satır başına tek üretim, `voice_check.py`). reels.json'da `"voiceTempo": 1.2`, `"voiceFilter": "brand"`.
- Kanca en fazla 5 kelime ve 0. karede hazır. Kart başına en fazla 12 kelime.
- Yazılar üst %14'e ve alt %20'ye girmez. Görüntü ise tüm kareyi doldurur: siyah sinema bandı yok; gök, duvar ve zemin bu bantların altında da sürer, karakterler büyük çekilir (Ayın katili'nden itibaren).
- Karar anı gerçekten 3 saniye: müzik ve altyazı susar, kalp atışı ve bip sesleri duyulur. Kutu: "… mı, … mı? Yoruma yaz". Yalnız izleyici cevaplayabiliyorsa: kendi seçimi ya da ekrandaki seçeneklerden biri; bilmediği bir rakamı tahmin ettirmez (Abonelik vampirleri'nde yok).
- Videoda kapanış sorusu, ardından ortak takip satırı (`assets/voice/ortak/takip.mp3`) ve takip kartı (Abonelik vampirleri'nden itibaren). "Arkadaşına gönder" ve "Kaydet" açıklamada.
- Son kare ilk kareye bağlanır (döngü).
- Çizimde fizik tutarlı: kol ve pati gövdeden çıkar; karakter bir şeye uzanacaksa önce ona yaklaşır (gövdeden kopuk uzayan kol yok). Tuttuğu nesneyi patileriyle kavrar. Başka karakterden alınan aksesuar (şapka vb.) yeni karakterin kafasına göre yeniden çizilir. Pipetle içilen şeyde pipetin ucu içeriğin içindedir (Abonelik vampirleri'nden itibaren).
- TL tutarları örnektir. Araştırma bilgileri kaynaklıdır ve kaynak satırı ekranda görünür.

---

## 1. Para Mahkemesi: Hesap davası
**Durum:** sırada · **Tür:** mahkeme draması (dizi) · **Süre:** ~26 sn · **Oyuncular:** Hâkim Karamel, davacı Ceviz, davalı Diken, bilirkişi Bilge

**Kanca (0. kare):** Tokmak havada, masada delil poşetinde bir fiş. Kutu: **"Çorba içtin, 600 TL öde"**

**Akış**
- 0–2 sn: Tokmak iner, salonun ışıkları yanar. Fişin yakın planı: TOPLAM 1.200 TL.
- 2–6 sn: Ceviz'in önünde çorba (200 TL), Diken'in önünde biftek ve tatlı (1.000 TL). Diken jüriye döner: "Eşit bölelim, hesap karışmasın." Fişin üstüne "KİŞİ BAŞI 600" damgası.
- 6–8 sn: Hâkim jüriye, yani kameraya döner.
- 8–11 sn: Karar anı, 3 sn sayım. Kutu: "E mi, K mı? Yoruma yaz" (E: eşit, K: kim ne yediyse).
- 11–17 sn: Bilirkişi Bilge kürsüde. Arkasındaki panoda iki masa: ayrı ödeyen masada az tabak, eşit bölen masada çok tabak. Kutu: "Hesap eşit bölünecekse herkes daha çok sipariş veriyor" + "Kaynak: Gneezy ve ark. 2004".
- 17–21 sn: Ders. Ceviz'in telefonunda Cep Defteri, "Hesabı bölüş": Ceviz 200, Diken 1.000.
- 21–25 sn: Kapanış sorusu.
- 25–26 sn: Tokmak yeniden havaya kalkar (döngü).

**Seslendirme**
1. `[energetic]` Para Mahkemesi. Bugün jüri sensin.
2. `[curious]` Ceviz çorba içti: 200 lira. Diken biftek ve tatlı: 1.000 lira.
3. `[dramatic]` Diken diyor ki: "Eşit bölelim." Yani kişi başı 600.
4. `[curious]` Karar senin: eşit mi, kim ne yediyse mi?
5. `[excited]` Bilirkişi raporu: gerçek bir restoranda denendi. Hesabın eşit bölüneceğini bilen masalar daha çok sipariş verdi.
6. `[dramatic]` Yani eşit bölünce herkes biraz Diken oluyor.
7. `[playful]` Siz nasıl bölüyorsunuz: eşit mi, Alman usulü mü? Jürinin kararı yorumlarda.

**Kapanış kutusu:** "Eşit mi, kim ne yediyse mi?" · alt satır: "Cep Defteri'nde hesabı bölüş"
**Uygulamayla bağı:** "Hesabı bölüş": hesabı sen ödersin, arkadaşının payı alacak olarak yazılır.
**Dizi:** Sonraki bölüm "Jüri kararını verdi: %… EŞİT" ile açılır. Sıradaki davalar:
- Fatura davası: ev arkadaşı klimayı hiç kapatmıyor. Eşit mi, kullanıma göre mi?
- Borç davası: 3 ay önce verilen 500 TL ve ardından gelen konser story'si. İstemeli mi? (borç/alacak defteri; Bankrate 2021: ailesine ya da arkadaşına maddi yardım edenlerin %44'ü kötü bir sonuç yaşamış, en sık sonuç parayı kaybetmek)

**Açıklamanın ilk satırı:** Hesap eşit mi bölünmeli, herkes kendi yediğini mi ödemeli? ⚖️
**Yayından önce doğrula:** Popüler özetlerdeki sipariş tutarları (kendi ödeyen 37, eşit bölen 51, bedava 82 şekel) makaledekiyle aynı mı. Kaynak: Gneezy, Haruvy ve Yafe (2004), *The Economic Journal*.

---

## 2. Ayın katili
**Durum:** üretildi (`out/ayin-katili.mp4`, 29,05 sn) · **Tür:** kara film / polisiye · **Oyuncular:** Dedektif Bilge (fötr şapka, trençkot, CEP DEFTERİ defteri), şüpheliler (kahve, yemek siparişi, taksi, abonelik), kapüşonlu "BU SEFERLİK", Ceviz

**Kanca (0. kare):** Yağmur, sokak lambası, yerde tebeşirle çizilmiş cüzdan silueti, duvarda "18" takvim yaprağı, "OLAY YERİ" şeridinin arkasında ağlayan Ceviz. Kutu: **"Harçlığını kim öldürdü?"**

**Akış (videodaki zamanlar)**
- 0–3,2 sn: Olay yeri. Şimşek "Ayın 18'i"de (0,42) ve "ölü"de (2,4); 1,2'de trençkotlu Dedektif Bilge gelir, tebeşir çizimin yanında durur (delilin üstüne basmaz) ve sol kolundaki büyüteçle bakar.
- 3,2–7,4 sn: Sıra odası, boy çizgili duvar. Kamera sırayı yakından tarar; her şüpheli adı söylenirken girer: 1 Kahve (4,1), 2 Yemek siparişi (4,74), 3 Taksi (5,82), 4 Abonelik (6,56).
- 7,4–10,7 sn: Geniş plan; "Ben sadece 90 liraydım" denince dördünün de baloncuğu çıkar: "Sadece 90 TL!" (8,65).
- 10,7–12,2 sn: Bilge kameraya döner: "Sence katil kim?"; kalp atışı başlar.
- 12,2–15,2 sn: Karar anı (gerçek 3 sn): müzik ve altyazı susar, spot sırayla dört şüpheliyi gezer, bip ve kalp atışı. Çağrı: "Katil kaç numara? Yoruma yaz".
- 15,3 sn: Işıklar söner: "Hiçbiri."
- 16,8–18,05 sn: Şimşek "Bu seferlik"te; sıranın sonunda kırmızı spotta kapüşonlu **BU SEFERLİK**, kartları: doğum günü, konser, bayram, "indirim vardı".
- 18,05–22,35 sn: Dedektifin panosu: polaroit, kartlar, "Tahmin mi, gerçek mi?" grafiği. "Sıradan harcamayı"da tahmin = gerçek (✓), "istisnaları"nda gerçek tahminin üstüne çıkar, "eksik"te **EKSİK!** damgası. Kaynak: Sussman ve Alter 2012.
- 22,35–25,5 sn: Cep Defteri, Planlar: pençe "istisna değildir"de "+ Plan ekle"ye basar, liste uzar: "Bu seferlikler · Ödeme · Her ay · 500 TL".
- 25,5–28,55 sn: Kapanış sorusu; sokakta dedektif CEP DEFTERİ'ni iki koluyla önünde tutar, 26,75'te karanlık kapı aralığında gözler belirir.
- 28,55–29,05 sn: Yeniden olay yeri ve kanca kutusu (döngü: ilk kareyle aynı).

**Seslendirme (videodaki hali; altı satır ilk denemede marka sesine uydu, 3,0–4,8 dB)**
1. `[dramatic]` Ayın on sekizi. Ceviz'in harçlığı ölü bulundu.
2. `[curious]` Şüpheliler: kahve, yemek siparişi, taksi ve abonelik.
3. `[energetic]` Hepsi aynı şeyi söylüyor: "Ben sadece doksan liraydım!"
4. Sence... katil kim? (iki v4 denemesi uymadı, 5,97 ve 6,67 dB; tarif gereği etiketsiz `eleven_multilingual_v2`, 5,44 dB)
5. Hiçbiri! Katil... "Bu seferlik." (iki v4 denemesi uymadı, 7,25 ve 7,43 dB; etiketsiz `eleven_multilingual_v2`, 5,14 dB)
6. `[excited]` Bir araştırmaya göre sıradan harcamayı doğru tahmin ediyoruz, istisnaları eksik.
7. `[dramatic]` Her ay bir istisna varsa, istisna değildir.
8. `[playful]` Senin bu ayki bu seferliğin neydi? Yoruma yaz!

Kelime zamanları ElevenLabs Scribe ile ölçüldü (`assets/voice/katil/words.json`, döküm metinle birebir aynı çıktı); olaylar ve altyazılar bu zamanlara oturur.

**Kapanış kutusu:** "Senin bu ayki 'bu seferlik'in neydi?" (seslendirmeyle aynı) · çip: "Yoruma yaz: ne, kaç TL?" · son 1,5 sn: "Bu seferlikleri Cep Defteri'ne önceden yaz · @cep_defteri"
**Uygulamayla bağı:** Planlar ekranı; bu seferlikler her ay için önceden planlı kalem olarak yazılır. Makalenin önerdiği çözüm de bu: istisnaları tek tek değil, bir küme olarak görmek.
**Açıklamanın ilk satırı:** Harçlığın ayın 18'inde bitiyorsa katil büyük ihtimalle bu 🕵️
**Yayından önce doğrula:** Makaledeki "istisnai harcama" tanımı ve 7 çalışmanın özeti. Kaynak: Sussman ve Alter (2012), *Journal of Consumer Research*.

---

## 3. Aynadaki sen
**Durum:** üretildi (`out/aynadaki-sen.mp4`, 26,2 sn) · **Tür:** bilim kurgu / dram · **Oyuncular:** Ceviz (arkadan) ve aynadaki 60 yaşındaki Ceviz (gri tüyler, altın çerçeveli gözlük, beyaz kaşlar)

**Kanca (0. kare):** Karanlık banyo, aynada cızırdayan yaşlı bir yüz. Kutu: **"60 yaşındaki sen konuşuyor"**

**Akış (videodaki zamanlar)**
- 0–0,85 sn: Karanlık banyo, aynada yaşlı Ceviz'in yüzü cızırdar.
- 0,85 sn: Işık yanar, aynada genç Ceviz. Aynanın köşesinde "CEP DEFTERİ'NE YAZ!" notu (banyo planlarında hep görünür).
- 1,25–2,6 sn: Telefonun kilit ekranı: "BANKA · Harçlık yattı +1.000 TL". "Bin lira"da tutar büyür, paralar saçılır.
- 2,6–3,45 sn: Ceviz sevinçle zıplar, yansıması da.
- 3,0–5,34 sn: "Ayna titredi": lamba göz kırpar, yansıma donar. Saat tıkırtısı hızlanır, yansıma yaşlanır.
- 5,34 sn: Yaşlı Ceviz tam belirir (vuruş, derin çan). Ceviz "!" ile sıçrar.
- 6,52–7,85 sn: Yakın plan: "Bunun kaçı bana?" (seste hafif ayna yankısı).
- 7,85–9,75 sn: Tezgâhta ŞİMDİ ve SONRA kavanozları. Pençe 1.000 TL'lik desteyle aralarından yükselir; yaşlı Ceviz'in elinde kum saati.
- 9,75–12,75 sn: Karar anı (gerçek 3 sn): müzik ve altyazı susar, kum akar, kalp atışı ve bip. Pençe bir ŞİMDİ'ye, bir SONRA'ya eğilir. Çağrı: "Kaçını ayırırsın? Yoruma yaz".
- 12,9–17,3 sn: Ayna panoya döner: "kendi yüzü" ve "yaşlı yüzü". Paralar iki "emeklilik" kavanozuna düşer, yaşlınınki daha çok dolar. Kaynak: Hershfield ve ark. 2011 (Stanford).
- 17,3–19,0 sn: "Gelecekteki sen bir yabancı değil": Ceviz ve yaşlı Ceviz aynı anda el sallar.
- 19,0–19,98 sn: Bir 200'lük SONRA kavanozuna düşer.
- 19,98 sn: "Sensin.": aynadaki yüzün yarısı genç, yarısı yaşlı.
- 20,62–23,2 sn: Cep Defteri, Yatırım → Birikim hedefleri: "+ Hedef", "Gelecekteki ben" 200 / 2.000 TL (%10).
- 22,35–25,62 sn: Kapanış sorusu; banyoda iki Ceviz el sallar.
- 25,62–26,2 sn: Işık söner, aynada yaşlı yüz yeniden cızırdar (döngü: ilk kareyle aynı).

**Seslendirme (videodaki hali; yedi satır da ilk denemede marka sesine uydu)**
1. `[dramatic]` Gece yarısı. Harçlık yattı: bin lira.
2. `[curious]` Ayna titredi ve altmış yaşındaki Ceviz tek bir soru sordu.
3. `[dramatic]` "Bunun kaçı bana?" (videoda hafif ayna yankısıyla)
4. `[curious]` Sen olsan kaçını ayırırdın?
5. `[excited]` Bir deneyde, yaşlandırılmış yüzünü görenler emeklilik için daha çok para ayırdı.
6. `[dramatic]` Çünkü gelecekteki sen bir yabancı değil. Sensin.
7. `[playful]` Bin liranın kaçını gelecekteki sana ayırırsın? Yoruma yaz!

**Kapanış kutusu:** "1.000 TL'nin kaçını gelecekteki sana ayırırsın?" (seslendirmeyle aynı) · çip: "Yoruma yaz: kaç TL?" · son 1,5 sn: "Cep Defteri'nde ona hedef aç · @cep_defteri"
**Uygulamayla bağı:** Yatırım ekranındaki "Birikim hedefleri". Hedef bir yatırım hesabına bağlanır, çubuk net katkıyı gösterir.
**Açıklamanın ilk satırı:** 60 yaşındaki sen bu harçlığın kaçını isterdi? 🪞
**Doğrulama sonucu:** "2 kat" kullanılmadı. 172 $ / 80 $ farkı ilk deneyden (sanal gerçeklik, üniversite öğrencileri) geliyor ve DOL CLEAR incelemesine göre istatistiksel olarak anlamlı değil. Anlamlı fark, 18–35 yaş arası yetişkinlerle yapılan deneyde: yaşlandırılmış yüzünü görenler varsayımsal gelirlerinin daha büyük bir kısmını emekliliğe ayırdı. Videoda ve panoda bu yüzden yalnız "daha çok" deniyor; panodaki kavanoz seviyeleri temsilî. Kaynak: Hershfield ve ark. (2011), *Journal of Marketing Research*.

---

## 4. Gece 02.00: Sepet bombası
**Durum:** üretildi (`out/sepet-bombasi.mp4`, 27,7 sn) · **Tür:** gerilim / bomba imhası · **Oyuncu:** Ceviz

**Kanca (0. kare):** Karanlık oda, Ceviz'in yüzü telefon ışığında; ekranda kırmızı sayaç. Kutu: **"Bu sayaç sana yalan söylüyor"**

**Akış (videodaki zamanlar)**
- 0–1,2 sn: Sayacın yakın planı ("FLAŞ İNDİRİM BİTİYOR!", 00:12'den saniye saniye akıyor).
- 1,2–2,35 sn: Oda: Ceviz yatakta, yüzü telefon ışığında; komodinde dijital saat 02:00; battaniyenin üstünde "CEP DEFTERİ" defteri (oda planlarında hep görünür).
- 2,35–5,6 sn: Telefon ekranı: kulaklık, "Son 2 ürün!", "37 kişi bakıyor". Ekran açılır açılmaz eski fiyat 4.999 TL çizili durur, yanında 1.499 TL parlar, "%70" rozeti hemen patlar (1.499 indirimli fiyat olarak okunsun diye); "Yüzde yetmiş" denince rozet bir kez daha büyür.
- 5,6–6,75 sn: "Ama süre bitiyor": sayacın yakın planı.
- 6,75–7,45 sn: Ceviz'in yakın planı: terliyor, kalp atışı başlıyor.
- 7,45–8,2 sn: Pençe "SATIN AL" düğmesinin yanına gelir.
- 8,2–11,2 sn: Karar anı, sayacın son 3 saniyesi (gerçek 3 sn). Müzik ve altyazı susar; bip, kalp atışı. Çağrı: "AL mı, BIRAK mı? Yoruma yaz". Pençe kararsız gidip gelir.
- 11,2 sn: 00:00, "SÜRE DOLDU", her şey griye döner. Ceviz almadı.
- 11,7–13,3 sn: Ceviz sayfayı aşağı çekip yeniler; yükleniyor.
- 13,3 sn: Sayaç 10:00'dan yeniden başlar, indirim hâlâ orada (beyaz flaş, sert vuruş).
- 14,3–15,1 sn: Ceviz şaşkın ("?").
- 15,1–21,1 sn: Lamba yanar; pano: 11.000 site tarandı → 361 sitede geri sayım sayacı → 140 sitede sayaç aldatıcıydı + "BİTMEDİ!" damgası + "Kaynak: Mathur ve ark. 2019 (Princeton)".
- 21,1–22,6 sn: Cep Defteri: "Elektronik · bu ay kalan 300 TL"; kulaklık satırı ve "BÜTÇEYİ 1.199 TL AŞAR".
- 22,6–23,7 sn: Ceviz telefonu komodine bırakır, lambayı söndürür, uyur.
- 23,7–27,15 sn: Kapanış sorusu; 26,4'te komodindeki telefon titreyip parlar, Ceviz döner bakar.
- 27,15–27,7 sn: Sayacın yakın planı ve kanca kutusu (döngü: ilk kareyle aynı).

**Seslendirme (videodaki hali)**
1. `[dramatic]` Gece iki. Sepette 1.499 liralık bir kulaklık.
2. `[energetic]` Yüzde yetmiş indirim! Ama süre bitiyor.
3. Alır mısın... bırakır mısın? (iki v4 denemesi marka sesine uymadı; tarif gereği etiketsiz `eleven_multilingual_v2`)
4. `[dramatic]` Sayfayı yenileyince... sayaç baştan başladı.
5. `[excited]` Araştırmacılar 11 bin alışveriş sitesini taradı. Bazı sayaçlar, süre bitince de devam ediyordu.
6. `[dramatic]` Sayaç değil, bütçen karar versin.
7. `[playful]` Geri sayıma kanıp aldığın en gereksiz şey ne? Yoruma yaz.

**Kapanış kutusu:** "Geri sayıma kanıp aldığın en gereksiz şey ne?" (seslendirmeyle aynı) · çip: "Yoruma yaz: ürünü ve fiyatını" · son 1,7 sn: "Almadan önce Cep Defteri'ne bak · @cep_defteri"
**Açıklamanın ilk satırı:** O geri sayım sayacı gerçekten bitiyor mu? ⏳
**Not:** "Sayfa yenilenince baştan başlıyordu" bilgisi makaleden değil, Nextgov haberinden. Panoda makalede örneği olan "süre bitince de sürüyordu" ifadesi kullanılır.

---

## 5. Çanta
**Durum:** sırada · **Tür:** kara film / teklif · **Süre:** ~24 sn · **Oyuncular:** Ceviz ve gölgedeki teklifçi (yüzü görünmez)

**Kanca (0. kare):** Yeraltı otoparkı, tek lamba, kaputun üstünde açılan siyah çanta. Kutu: **"5.000 TL al, Instagram'ı bırak"**

**Akış**
- 0–3 sn: Çanta açılır, içinde 5.000 TL. Gölgeden bir el uzanır, telefonu ister.
- 3–6 sn: Şart kartı: "1 ay Instagram yok". Ceviz'in telefonuna bildirimler yağıyor.
- 6–9 sn: Karar anı, 3 sn sayım. Kutu: "AL mı, BIRAK mı? Yoruma yaz".
- 9–15 sn: Pano. Kutu: "Facebook'u 4 hafta kapatanlar biraz daha mutlu çıktı" + "Kaynak: Allcott ve ark. 2020". Altında: "Sonra da daha az kullandılar".
- 15–19 sn: İkinci şaşırtıcı bilgi: "Bıraktıktan sonra ona biçtikleri değer düştü."
- 19–23 sn: Kapanış sorusu.
- 23–24 sn: Çanta kapanır, lamba titrer (döngü).

**Seslendirme**
1. `[dramatic]` Gece, otopark. Çanta açıldı: 5.000 lira.
2. `[curious]` Şart tek: bir ay boyunca Instagram yok.
3. `[curious]` Alır mısın?
4. `[excited]` ABD'de bir deneyde insanlara Facebook'u 4 hafta kapatmaları için para verildi. Kapatanlar biraz daha mutlu çıktı.
5. `[dramatic]` Ve deney bitince Facebook'a biçtikleri değer düştü.
6. `[playful]` Sen kaç liraya 1 ay Instagram'ı bırakırdın? Yoruma yaz.

**Kapanış kutusu:** "Kaç TL'ye 1 ay bırakırdın?" · alt satır: "Neye değer verdiğini Cep Defteri'nde gör"
**Uygulamayla bağı:** Zayıf. "Bir şeyin değerini bırakınca anlarsın" fikri aboneliklere bağlanabilir.
**Açıklamanın ilk satırı:** Kaç TL'ye 1 ay Instagram'ı bırakırsın? 💼
**Yayından önce doğrula:** Deneydeki fiyat dağılımı. Yalnız "katılımcıların %61'i 102 doların altında fiyat söyledi" doğrulandı; ortanca fiyat kullanılmayacak. Kaynak: Allcott, Braghieri, Eichmeyer ve Gentzkow (2020), *American Economic Review*.

---

## 6. Sınav salonu
**Durum:** sırada · **Tür:** sınav gerilimi / bulmaca · **Süre:** ~23 sn · **Oyuncular:** Ceviz, Diken, gözetmen Bilge

**Kanca (0. kare):** Amfi, duvar saati, tahtada soru. Kutu: **"Bunu 3 saniyede çöz"**

**Akış**
- 0–2 sn: Gözetmen kâğıtları dağıtır, floresan vızıltısı.
- 2–7 sn: Tahta: "Etikette %25 indirim. Kasada %25 daha. Toplam indirim?"
- 7–10 sn: Karar anı, 3 sn sayım (duvar saati). Kutu: "Cevabını yoruma yaz".
- 10–12 sn: Ceviz emin, "%50" yazıp kâğıdı kaldırır. Bilge kırmızı kalemle çizer.
- 12–16 sn: Çözüm: 1.000 TL → 750 TL → 562,50 TL. Toplam indirim %43,75.
- 16–20 sn: Pano. Kutu: "İnsanlar yüzdeleri topluyor; çift indirim daha çok satıyor" + "Kaynak: Chen ve Rao 2007".
- 20–22 sn: Kapanış sorusu.
- 22–23 sn: Zil (döngü).

**Seslendirme**
1. `[energetic]` Tek soru, 3 saniye.
2. `[curious]` Etikette yüzde 25 indirim, kasada yüzde 25 daha. Toplam indirim yüzde kaç?
3. `[dramatic]` Ceviz yüzde 50 yazdı. Yanlış.
4. `[excited]` Önce 1.000 lira 750 olur, sonra 562,50. Yani indirim yüzde 43,75.
5. `[excited]` Araştırmalara göre insanlar art arda gelen yüzdeleri topluyor. Mağazalar da çift indirimle daha çok satıyor.
6. `[playful]` İlk aklına gelen neydi? Dürüst ol, yoruma yaz.

**Kapanış kutusu:** "İlk cevabın neydi?" · alt satır: "Cep Defteri kasadaki tutarı yazar"
**Uygulamayla bağı:** Kasada ödenen gerçek tutar kaydedilir.
**Açıklamanın ilk satırı:** %25 + %25 indirim = %50 mi? 🧮 (sabit yorum: "Bonus: %50 + %20 = ?")
**Yayından önce doğrula:** Chen ve Rao'nun mağaza denemesinin ayrıntısı (hangi ürün, ne kadar fark). Kaynak: Chen ve Rao (2007), *Journal of Consumer Research*.

---

## 7. Abonelik vampirleri
**Durum:** üretildi (`out/abonelik-vampirleri.mp4`, 32,5 sn) · **Tür:** korku · **Oyuncular:** Ceviz (gece şapkasıyla uyuyor; bu sahnede aynalı, kuyruğu solda, boş yanı lambaya bakar), minik vampirler (müzik, dizi, oyun, bulut; gövdeleri uygulama simgesi), solgun "deneme üyeliği"

**Kanca (0. kare):** Gece, ay ışığında cam kumbara; sırtında karanlık bir siluet pipetle içiyor, iki kırmızı göz parlıyor. Kutu: **"Kumbaranı geceleri kim emiyor?"**

**Akış (videodaki zamanlar)**
- 0–0,72 sn: Kumbaranın yakın planı: siluet pipetle içer; pipet yarıktan paraların içine iner, paralar camın içinden görünür.
- 0,72–2,12 sn: Oda: Ceviz gece şapkasıyla uyuyor (z'ler), duvar saati 03.00, battaniyenin üstünde CEP DEFTERİ defteri (oda planlarında hep görünür).
- 2,12–3,45 sn: Kumbaraya yaklaşma; "boşalıyor"da uzun bir yudum, para seviyesi iner.
- 3,45 sn: Stanttaki telefon kendiliğinden yanar (03:00); siluet ışıktan kaçıp kumbaranın arkasına saklanır.
- 3,98–7,5 sn: Telefon ekranı: dört uygulama simgesi "vampirler"de göz ve diş açar; adı söylenen kanat çırpıp kameraya doğru uçar: Müzik (5,48), Dizi (6,05), Oyun (6,67), Bulut (7,15).
- 7,5–8,6 sn: Dördü kumbaranın başında; pipetler yarıktan geçip para yığınına dalar (uçları seviyeyle birlikte iner), para kırıntıları yığından ağızlarına akar; 7,85'te etiketler: 100 / 250 / 150 / 50 TL, kumbaranın etiketi "AYDA 550 TL".
- 8,6–11,6 sn: "En sinsisi"nde ay ışığı ve telefon titrer; telefonda örümcek ağlı eski bir bildirim (9,75): "Deneme süren bitti · Aboneliğin başladı: ayda 150 TL · 3 ay önce". "Unuttuğun"da (10,34) arkasından solgun vampir tırmanır; göğsünde "ÜCRETSİZ"i çizili "DENEME" kuşağı.
- 11,6–13,6 sn: Beşi birden kumbarada (solgun olan telefonun tepesine tünemiş); "700"de etiket 700 TL olur (kasa sesi).
- 13,6–19,49 sn: CEP DEFTERİ'nin sayfası: "ANKET · ABD · 1.000 KİŞİ", kaynak satırı; "yüzde kırk ikisi"nde (15,45) 100 kişilik ızgarada 42 kare kırmızıya döner, "%42 · kullanmayı bıraktığı aboneliğe hâlâ ödüyordu"; "unutmuştu"da **UNUTULDU!** damgası.
- 19,49–21,35 sn: Ceviz "!" ile uyanır, yatağın ipe yakın ucuna sıçrar (19,75), omzundan kalkan koluyla boncuğu kavrayıp çeker (20,17): oda aydınlanır, vampirler çığlık atıp toza döner.
- 21,35–23,8 sn: Cep Defteri, Bütçe ve planlar → Tüm planlar: Bulut depolama, Deneme üyeliği, Dizi, Müzik ve Oyun aboneliği alt alta gelir (uygulamadaki satır biçimi: "Her ay · Abonelikler · Banka"); deneme üyeliği satırı parlar.
- 23,8–28,85 sn: Kapanış sorusu; aydınlık odada Ceviz yatakta oturmuş, telefonu cevizini tuttuğu yerde iki patisiyle tutuyor (telefonun arkası bize dönük: sol üstte kamera, ortada piksel Apple logosu), kumbaranın etiketi hâlâ "AYDA 700 TL".
- 28,85–31,95 sn: Ortak takip satırı ve takip kartı (Instagram'ın önerilen hesap kartı gibi ortalı: yuvarlak simge, cep_defteri, "Her hafta bir para tuzağı", kart genişliğinde mavi "Takip et"); "takip et"te (31,17) pençe düğmenin sağ ucuna basar (yazıyı kapatmaz), düğme "Takip ediliyor" olur. 30,4'te komodinin karanlık rafında iki kırmızı göz belirir.
- 31,95–32,5 sn: Lamba söner; kumbaradaki gözler ve kanca kutusu (döngü: ilk kareyle aynı).

**Seslendirme (videodaki hali)**
1. Gece üç. Ceviz uyuyor... Kumbarası ise boşalıyor. (iki v4 denemesi uymadı, 6,32 ve 7,11 dB; tarif gereği etiketsiz `eleven_multilingual_v2`, 5,25 dB)
2. `[curious]` Telefondan minik vampirler çıkıyor: müzik, dizi, oyun, bulut.
3. `[dramatic]` En sinsisi: üç ay önce unuttuğun deneme üyeliği.
4. `[excited]` Toplam: ayda yedi yüz lira!
5. `[excited]` ABD'de bir ankette insanların yüzde kırk ikisi, kullanmayı bıraktığı bir aboneliğe hâlâ ödediğini unutmuştu.
6. `[dramatic]` Vampirler ışıktan korkar. Aboneliklerini bir kere alt alta yaz.
7. `[playful]` Sen de dene: önce tahmin et, sonra tek tek say. Fark kaç çıktı? Yoruma yaz!
8. `[playful]` Her hafta bir para tuzağı. Kaçırmamak için takip et! (ortak takip satırı, `assets/voice/ortak/takip.mp3`)

2–8. satırlar ilk denemede marka sesine uydu (2,7–5,3 dB). Kelime zamanları ElevenLabs Scribe ile ölçüldü (`assets/voice/vampir/words.json`, `assets/voice/ortak/words.json`; döküm metinle birebir aynı).

**İlk sürümden farklar:** İlk sürümde (31,1 sn) vampirler kumbaraya yerleşince 3 saniyelik "Ayda kaç TL?" karar anı vardı. İzleyici Ceviz'in aboneliklerinin fiyatını bilmediği için tahmin edemiyordu; karar anı ve "Sence ayda kaç lira emiyorlar?" satırı çıkarıldı, etiketler doğrudan gelir. Araştırma satırı "133 $ eksik tahmin" yerine hikâyedeki unutulan vampire doğrudan bağlanan %42 bulgusu oldu (86 $ / 219 $ açıklamada). Kapanış sorusu izleyiciye anketteki deneyi yaptırır: önce tahmin, sonra tek tek sayım. En sona takip çağrısı eklendi.

**Çizim düzeltmeleri (üçüncü tur):** Fıstık'ın pijama şapkasından türetilen şapka Ceviz'in sağ kulağına ve kuyruğuna taşıyordu; şapka Ceviz'in kafasına göre yeniden çizildi (siper iki kulağın arasında, ucu kuyruğun ters yanına sarkar). Lambayı yakarken gövdeden kopuk uzayan kol vardı; artık Ceviz ipe sıçrar, omzundan kalkan koluyla çeker (kolun kuyruğa takılmaması için Ceviz bu sahnede aynalı). Telefonu tutan parmak uçları havada duruyordu; telefon artık cevizin yerinde, iki patisiyle kavranıyor, arkası kamera ve Apple logosuyla belli. Pipetler kumbaranın boş camından içiyordu; artık yarıktan para yığınına iner. Takip kartının sağ yarısı boştu; kart ortalı düzene geçti.

**Kapanış kutusu:** "Önce tahmin et, sonra tek tek say" · çip: "Yoruma yaz: tahminin kaç, gerçeği kaç?" · ardından takip kartı
**Uygulamayla bağı:** Bütçe → + Plan → Ödeme, Her ay: her abonelik ayrı bir plan; "Tüm planlar"da alt alta görünür, ödemeler kullanılabilir paradan önceden düşülür.
**Açıklamanın ilk satırı:** Kaç aboneliğe para ödediğini biliyor musun? 🧛
**Doğrulama sonucu:** C+R Research'ün kendi sayfası ve CNBC (2 Haziran 2022): 22 Nisan–2 Mayıs 2022, ABD'de 1.000 kişi; %42'si kullanmayı bıraktığı bir aboneliğe hâlâ ödediğini unutmuş (C+R'ın ifadesi: "stopped using a subscription service(s) but forgot they were still paying for the service"); hızlı tahminlerin ortalaması 86 $, kategori kategori sayınca 219 $ (fark 133 $). Türkiye için birincil kaynağı bulunan benzer bir veri yok (haberlerde geçen ING Türkiye "%36"sının kaynağı bulunamadı), bu yüzden ABD anketi kullanıldı ve ekranda "ABD" yazıyor. Vampirlerde marka adı yok, tür adıyla (müzik, dizi, oyun, bulut); Ceviz'in telefonunun arkasında istek üzerine piksel Apple logosu var. TL tutarları örnek.

---

## 8. Ay sonuna iniş
**Durum:** üretildi (`out/ay-sonuna-inis.mp4`, 34,7 sn) · **Tür:** uzay görevi · **Oyuncular:** Kaptan Ceviz (cam kask, beyaz tulum, kuyruğu dışarıda), görev kontrolde mikrofonlu kulaklıklı Bilge, roket HARÇLIK-1

**Kanca (0. kare):** Uzay; yakıtı bitmiş, gövdesinde üç meteor çukuru olan HARÇLIK-1 eğik, sürükleniyor, lüleden ince duman. Sağ üstte Ay ("AY SONU"), aradaki kırmızı kesikli rotada "AY SONUNA 8 GÜN"; altta göstergede "YAKIT 0 TL" yanıp söner, takvim KASIM 22. Kutu: **"Paran ayın kaçında bitiyor?"**

**Akış (videodaki zamanlar)**
- 0–0,45 sn: Kanca karesi, kamera hafifçe yaklaşır; düşük yakıt alarmı, telsiz cızırtısı.
- 0,45–3,85 sn: Rampa, ayın 1'i (YAKIT 8.000 TL, takvim KASIM 1). Kırmızı-beyaz kafes kule, gökte küçük Ay ve ona giden mavi rota. "Kaptan"da (1,32) kamera lomboza yaklaşır: cam kasklı Ceviz el sallar, camda parıltı kayar; 2,0'da kamera geri çekilir; 2,3'te ateşleme (kule kolları açılır, duman); "ay sonuna"da (2,7) Ay parlar; "iniş"te (3,24) kalkış: patlama, alev, sarsıntı.
- 3,85–8,3 sn: Görev kontrol. Dev ekranda "GÖREV KONTROL · HARÇLIK-1", rota haritası (Dünya → Ay, 1-14-22-30 çentikleri), takvim 1'den 14'e akar ("14'ü"de, 4,27). Göstergeler söylendiği anda açılır: "Yakıt"ta (5,07) YAKIT, "4.000"de (5,62) 4.000 TL sayarak gelir; "Kalan plan"da (6,53) KALAN PLAN · ay sonuna kadar, "3.500"de (7,37) 3.500 TL. Önde kulaklıklı Bilge, masada CEP DEFTERİ defteri ve kupa (görev kontrol planlarında hep görünür). Ekran altyazının altında kalır.
- 8,3–9,9 sn: "Sence yakıt yeter mi?": kamera Bilge'ye ve göstergelere yaklaşır, Bilge ekrana bakar; kalp atışı başlar.
- 9,9–12,9 sn: Karar anı (gerçek 3 sn): müzik, seslendirme ve altyazı susar; kamera iki göstergede, takvimin yerinde yeşil "FARK +500 TL" (yeter gibi görünür), göstergeler sırayla parlar, ekranın köşesinde büyük 3-2-1, saniyede bir bip, kalp atışı hızlanır. Çağrı: "YETER mi, YETMEZ mi? Yoruma yaz".
- 13,0–17,75 sn: Uzay; yıldızlar akar, takvim 14'ten 21'e ilerler, her yaprakta yakıt bir günlük plan kadar (~206 TL) düşer. "Meteorlar"da (14,14) alarm ve meteor yağmuru; adı söylenince etiketli meteor gelip gövdeye çarpar: Kırık ekran −1.450 TL (15,56), Doğum günü −500 TL (16,39), Kitap parası −400 TL (17,17). Her çarpmada patlama, sarsıntı, göstergede düşüş ve gövdede çukur; etiket çarpınca geldiği yana kayar, roketin üstünde kalmaz.
- 17,75–20,6 sn: Kokpit. Yuvarlak pencerede uzakta Ay ("AY SONU"), kırmızı döner alarm, panelde yakıt saati E'de, "YAKIT BİTTİ" yanıp söner, "KASIM 22". "Houston"da (18,85) telsiz dalgaları, Ceviz kollarını kaldırır; "sorunumuz"da (19,72) motor öksürür, panelden kıvılcım, pencerede duman.
- 20,6–25,5 sn: Dev ekranda araştırma: "ARAŞTIRMA · HAFTALIK HARCAMA"; "insanlar"da (21,48) TAHMİN (73) ve GERÇEK (100) çubukları dolar; tahminin eksik kısmı, içinde meteorlar olan kesikli kutu; "%27" sayarak gelir (23,68), "eksik"te **EKSİK!** damgası (24,38); "Akla sıradan harcamalar gelir, meteorlar gelmez."; kaynak satırı "Kaynak: %27 Peetz 2010 · neden: Howard ve ark. 2022".
- 25,5–28,2 sn: Cep Defteri, Özet → "Kullanılabilir para" kartı (uygulamadaki satırlar): Kasım sonuna kadar 6.000,00 TL, günde yaklaşık 200,00 TL · 30 gün; Günlük hesaplarda 9.000 TL, − Yaklaşan ödemeler (2) 1.200 TL, − Kenarda tuttuğun birikim payı 1.800 TL, = Kullanılabilir 6.000 TL. "Yakıtı"nda (25,88) kamera birikim payı satırına iner, satır parlar, "↑ YEDEK YAKIT" ve benzin bidonu; "günlere"de (27,5) günlük tutara çıkar, "GÜNLÜK YAKIT ↓". Bu planda altyazı susar (kartın başlığını örtüyordu), satırı kutu taşır.
- 28,2–31,2 sn: Kapanış sorusu; Ay yüzeyi, gökte Dünya, inmiş roket. Ceviz az yerçekiminde yavaş zıplar, 28,58'de "CEP DEFTERİ" bayrağını diker (toz), el sallar.
- 31,2–34,2 sn: Ortak takip satırı ve takip kartı; 32,55'te gökte küçük bir meteor kayar; "takip et"te (33,3) beyaz eldivenli pati düğmenin sağ ucuna basar, düğme "Takip ediliyor" olur.
- 34,2–34,7 sn: Yeniden yakıtı bitmiş roket ve kanca kutusu (döngü: ilk kareyle aynı).

**Müzik:** rampada ve görev kontrolde yeni `space` türü (112 BPM kare dalga arpej, Am–F–G–Em, yavaş pad, sekizlik bas), meteorlardan kokpite kadar korku, araştırma ve uygulamada lofi, kapanışta pop. Karar anında müzik yok.

**Seslendirme (videodaki hali)**
1. `[energetic]` Ayın biri. Kaptan Ceviz'in görevi: ay sonuna iniş!
2. `[curious]` Ayın on dördü. Yakıt: dört bin lira. Kalan plan: üç bin beş yüz.
3. Sence... yakıt yeter mi? (iki v4 denemesi uymadı, ikisi de 5,94 dB; tarif gereği etiketsiz `eleven_multilingual_v2`, 4,20 dB. Videoda 1,3 hızla, karar anının sessizliği tam 9,9'da başlar)
4. `[dramatic]` Ama planda olmayan meteorlar geldi: kırık ekran, doğum günü, kitap parası.
5. `[dramatic]` Ayın yirmi ikisi. Houston, bir sorunumuz var! (videoda iki parça: "Houston…" kısmı telsiz süzgeçli, `i5r.mp3`; başında ve sonunda NASA tarzı telsiz bip'i)
6. `[excited]` Bir araştırmada insanlar haftalık harcamalarını yaklaşık yüzde yirmi yedi eksik tahmin etti.
7. `[dramatic]` Yedek yakıtı kenara koy, kalanını günlere böl.
8. `[playful]` Senin paran ayın kaçında bitiyor? Yoruma yaz!
9. `[playful]` Her hafta bir para tuzağı. Kaçırmamak için takip et! (ortak takip satırı, `assets/voice/ortak/takip.mp3`)

1, 2 ve 4–8. satırlar ilk denemede marka sesine uydu (2,96–4,80 dB). Kelime zamanları ElevenLabs Scribe ile ölçüldü (`assets/voice/inis/words.json`; döküm metinle birebir aynı). Üretilen "Çünkü sıradan harcamalar aklımıza geliyor, meteorlar gelmiyor." satırı süre için çıkarıldı; bu bilgi araştırma ekranında yazılı.

**reels-analiz sonrası düzeltmeler (ikinci sürüm):** Kancada roket küçültülüp sola alındı (göstergelere biniyordu), Ay büyüdü, rota etiketi "8 GÜN" yerine "AY SONUNA 8 GÜN", göstergeler büyüdü. Rampadaki lomboz yakınlaşması kısaldı, ateşleme 2,3'e alındı; yakın planda kırpılan Ay etiketi gizlenir. Görev kontrolde gösterge etiketleri söylendiği anda açılır, KALAN PLAN'ın yanında "ay sonuna kadar" yazar, ekran altyazının altına indi; Bilge'nin "?" işareti göstergeyi örtüyordu, sakin bakış pozu aldı. Karar anında takvimin yerine "FARK +500 TL" geldi. Uçuşta yakıt takvimle birlikte gün gün düşer (sürekli akış takvimle çelişiyordu), roket göstergelerden uzaklaştı, meteor etiketleri altyazının altında kalır. Kokpit paneli 100 px yukarı alındı ("YAKIT BİTTİ" ve "KASIM 22" Instagram'ın alt bandına giriyordu). Araştırma çubuklarına değerler (73 / 100) yazıldı, %27 ve EKSİK! damgası kaynak satırının üstünden kalktı, kaynak satırı büyüdü ve hangi bilginin kaynağı olduğunu söylüyor. Uygulama kartına uygulamada hep görünen "− Yaklaşan ödemeler" satırı eklendi; örnek rakamlar hikâyedeki 8.000 TL ile karışmasın diye 9.000 / 1.200 / 1.800 / 6.000 oldu; kamera satırdan satıra gider, kartın başlığı her an yazı kutusunun altında kalır. "Sence yakıt yeter mi?" 1,3 hızla çalınıyor (karar anının sessizliği geç başlıyordu). Kapanış çipi büyüdü.

**Kapanış kutusu:** "Senin paran ayın kaçında bitiyor?" (seslendirmeyle aynı, kancayla aynı soru) · çip: "Yoruma yaz: ayın kaçı?" · ardından takip kartı
**Uygulamayla bağı:** Özet'teki "Kullanılabilir para" kartı: günlük hesaplardaki para − yaklaşan ödemeler − kenarda tutulan birikim payı; "günde yaklaşık … · … gün" kalan parayı günlere böler. Birikim payı Bütçe ekranında "Günlük hesapta dokunmadan tuttuğun tutar" olarak girilir: meteorlar için yedek yakıt.
**Açıklamanın ilk satırı:** Paran ayın kaçında bitiyor? 🚀
**Doğrulama sonucu:** %27, Johanna Peetz'in 2010 doktora tezinin özetinden ("haftalık harcamalarını yaklaşık %27 eksik tahmin ettiler", Wilfrid Laurier Üniversitesi; danışman Roger Buehler). Aynı çalışmanın yayımlanan makalesi Peetz ve Buehler (2009, *PSPB*): katılımcılar gelecek haftada gerçekte harcadıklarından da, geçen hafta harcadıklarını hatırladıklarından da az harcayacaklarını tahmin etti; sonraki yayınlar bu bulguyu "yaklaşık %30" diye aktarıyor. Makalenin tam metnine bu ortamdan erişilemediği için videoda tezdeki %27 ve kaynak satırında "Peetz 2010" kullanıldı. "Akla sıradan harcamalar gelir" açıklaması Howard, Hardisty, Sussman ve Lukas'tan (2022, *Journal of Marketing Research*, 10 çalışma, N = 6.044; Kanada'da Vancity kredi kooperatifi üyeleriyle saha çalışması: tahminler her hafta gerçeğin altında kaldı; "bu hafta neden farklı olabilir?" diye sordurmak tahminleri gerçeğe yaklaştırdı). Hikâyedeki tutarlar örnek; meteorlar toplamı 2.350 TL, 14'ünden sonra günde ~206 TL planla yakıt 22'sinde biter (8 gün × 206 + 2.350 ≈ 4.000).

---

## Kaynaklar
- Gneezy, Haruvy ve Yafe (2004): [RePEc](https://ideas.repec.org/a/ecj/econjl/v114y2004i495p265-280.html), [özet](https://en.wikipedia.org/wiki/Unscrupulous_diner%27s_dilemma)
- Bankrate (2021) borç anketi: [PDF](https://www.bankrate.com/pdfs/pr/20211213-lending-money-survey.pdf)
- Sussman ve Alter (2012): [NYU Stern özeti](https://stern.nyu.edu/experience-stern/faculty-research/adam-alter-exceptional-expense)
- Hershfield ve ark. (2011): [Stanford VHIL](https://vhil.stanford.edu/publications/increasing-saving-behavior-through-age-progressed-renderings-future-self), [CLEAR incelemesi](https://clear.dol.gov/study/increasing-saving-behavior-through-age-progressed-renderings-future-self-hershfield-et-al-2011)
- Mathur ve ark. (2019): [Princeton proje sayfası](https://webtransparency.cs.princeton.edu/dark-patterns), [Nextgov](https://www.nextgov.com/emerging-tech/2019/12/dark-patterns-trick-you-spending-more-online/161859/)
- Allcott ve ark. (2020): [SIEPR](https://siepr.stanford.edu/publications/working-paper/welfare-effects-social-media)
- Chen ve Rao (2007): [RePEc](https://ideas.repec.org/a/oup/jconrs/v34y2007i3p327-340.html), [ScienceDaily](https://sciencedaily.com/releases/2007/05/070515110951.htm)
- C+R Research (2022): [C+R Research](https://www.crresearch.com/blog/subscription-service-statistics-and-costs/), [CNBC](https://www.cnbc.com/2022/06/02/consumers-spend-133-more-monthly-on-subscriptions-than-they-realize.html), [KTVU haberi](https://www.ktvu.com/news/many-underestimate-monthly-subscription-costs-133-survey-2022)
- Peetz ve Buehler (2009): [DOI](https://doi.org/10.1177/0146167209345160) · Peetz (2010) doktora tezi: [Wilfrid Laurier](https://scholars.wlu.ca/etd/1101/)
- Howard, Hardisty, Sussman ve Lukas (2022): [Journal of Marketing Research](https://journals.sagepub.com/doi/full/10.1177/00222437211068025), [PMC](https://pmc.ncbi.nlm.nih.gov/articles/PMC13038220/)
