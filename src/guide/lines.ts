/**
 * Rehberin maskot ağzından satırları: adım × 6 karakter × tr+en. Her satır 1–2 kısa cümle.
 * Ton: Fıstık oyuncu, Bilge sakin ve az sözlü, Ceviz tutumlu/telaşlı, Diken kuru ve minimal, Karamel neşeli/sadık,
 * Pamuk tatlı, şefkatli ve biraz dramatik.
 */
import type { Lang, MascotKey } from '../mascot/characters';
import type { StepId } from './steps';

type Line = { tr: string; en: string };
const L = (tr: string, en: string): Line => ({ tr, en });

export const GUIDE_LINES: Record<MascotKey, Record<StepId, Line>> = {
  fistik: {
    add: L('Kayıt buradan! Tutar, kategori, kaydet: 3 dokunuşta biter.', 'Entries start here! Amount, category, save: done in 3 taps.'),
    amount: L('Önce tutarı yaz. Ya da hazır tutarlardan birine dokun, daha da hızlı.', 'Type the amount first. Or tap a ready amount, even faster.'),
    newCat: L('Kategorin yok mu? “+ Yeni kategori” ile kendininkini yap.', 'Missing a category? Make your own with “+ New category”.'),
    why: L('Ruh halimi merak edersen “Neden böyle?”ye dokun. Sebepsiz yargılamam!', 'Curious about my mood? Tap “Why?”. I never judge without a reason!'),
    eye: L('Biri omzundan mı bakıyor? Göze dokun, toplamları saklarım. Ajan modu!', 'Someone peeking? Tap the eye and I hide the totals. Spy mode!'),
    reports: L('Raporlar burada! Ay ay neye harcadığını grafiklerle gösteririm.', 'Reports live here! I chart what you spent, month by month.'),
    rings: L('Bu kart ayın gidişatı: bütçe, hedef, geçen günler. Bir bakışta durum.', 'This card is your month at a glance: budget, goals, days gone.'),
    floor: L('Bütçe yoksa buradan harcama planı çizerim; plandan hızlı gidersen söylerim.', 'No budget? I’ll draw a spending plan from this and tell you if you run ahead.'),
    invest: L('Yatırımın kendi sekmesinde! Altın ya da döviz de tut; fiyatı ben güncellerim.', 'Investments have their own tab! Keep gold or currency too; I’ll update the price.'),
    widget: L('Beni ana ekranına koy! Uygulamayı açmadan bakiyeni görür, tek dokunuşla kayıt eklersin.', 'Put me on your home screen! See your balance and add entries without opening the app.'),
    tile: L('Bildirim paneline bir kutucuk koyalım; kayıt bir kaydırma uzağında olsun.', 'Let’s add a quick settings tile; entries are one swipe away.'),
    settings: L('Bitti! Rehberi buradan, Ayarlar’dan tekrar açabilirsin.', 'Done! You can replay the guide from Settings, right here.'),
  },
  bilge: {
    add: L('Kayıt buradan başlar. Üç dokunuş yeter.', 'Entries begin here. Three taps are enough.'),
    amount: L('Önce tutar. Hazır tutarlar da burada.', 'First, the amount. Ready amounts are here too.'),
    newCat: L('Aradığın kategori yoksa, buradan yenisini kur.', 'If your category is missing, create it here.'),
    why: L('“Neden böyle?” dersen gerekçemi söylerim.', 'Ask “Why?” and I will give my reason.'),
    eye: L('Göz, toplamları gizler. Kalabalıkta işe yarar.', 'The eye hides totals. Useful in a crowd.'),
    reports: L('Raporlar burada. Aylar yan yana, sakin bir bakış.', 'Reports are here. Months side by side, a calm view.'),
    rings: L('Bu kart ayın gidişatını gösterir. Bir bakış yeter.', 'This card shows how the month goes. One glance is enough.'),
    floor: L('Bütçe yoksa buradan harcama planı çizerim. Plandan hızlı gidersen söylerim.', 'No budget? I will draw a spending plan from this and tell you if you run ahead.'),
    invest: L('Yatırımın kendi sekmesinde. Altın ya da döviz de olur; fiyatı ben güncellerim.', 'Investments have their own tab. Gold or currency too; I keep the price current.'),
    widget: L('Ana ekranına bir pencere aç. Bakiyen hep gözünün önünde olur.', 'Open a window on your home screen. Your balance stays in sight.'),
    tile: L('Bildirim paneline bir kutucuk ekle. Kayıt bir kaydırma uzakta.', 'Add a tile to quick settings. An entry is one swipe away.'),
    settings: L('Hepsi bu. Rehber, Ayarlar’da seni bekler.', 'That is all. The guide waits in Settings.'),
  },
  ceviz: {
    add: L('Kayıt buradan! 3 dokunuş, tek kuruş harcamadan.', 'Entries here! Three taps, not a penny spent.'),
    amount: L('Tutarı yaz ya da hazır tutara dokun. Zaman da paradır!', 'Type the amount or tap a ready one. Time is money!'),
    newCat: L('Kategori eksikse “+ Yeni kategori”. Her kuruşun yeri belli olsun!', 'Missing one? “+ New category”. Every coin gets its place!'),
    why: L('“Neden böyle?”ye dokun, hesabımı açıklarım. Kuruşu kuruşuna!', 'Tap “Why?” and I’ll show my math. To the last penny!'),
    eye: L('Göze dokun, toplamlar saklanır. Paramızı herkes görmesin!', 'Tap the eye, the totals hide. Nobody needs to see our coins!'),
    reports: L('Raporlar burada! Hangi kuruş nereye gitti, hepsi grafikte.', 'Reports are here! Where every penny went, all on a chart.'),
    rings: L('Bu kart ayın özeti: ne harcadık, ne kaldı. Hızlı kontrol!', 'This card sums up the month: spent, left. Quick check!'),
    floor: L('Bütçe yoksa buradan harcama planı çizerim; plandan hızlı gidersen hemen söylerim!', 'No budget? I’ll draw a spending plan from this and shout if you run ahead!'),
    invest: L('Yatırım kendi sekmesinde! Altın, döviz, ne olursa; fiyatı ben güncellerim, bedavaya!', 'Investments have their own tab! Gold, currency, anything; I update prices, free!'),
    widget: L('Ana ekrana koy, uygulamayı açmadan kayıt ekle. Dokunuş tasarrufu!', 'Put it on your home screen and log without opening the app. Tap savings!'),
    tile: L('Bildirim paneline kutucuk ekle; kayıt bir kaydırma uzakta. Verimli!', 'Add a quick settings tile; logging is one swipe away. Efficient!'),
    settings: L('Tamamdır! Rehberi istersen buradan, Ayarlar’dan yine aç.', 'All set! Reopen the guide from Settings, right here.'),
  },
  diken: {
    add: L('Kayıt. Burada. Üç dokunuş.', 'Entries. Here. Three taps.'),
    amount: L('Tutar. Ya da hazır tutar. Seçim senin.', 'Amount. Or a ready amount. Your call.'),
    newCat: L('Kategori yoksa yenisi. Basit.', 'No category? Make one. Simple.'),
    why: L('“Neden böyle?” Sebebim var. Her zaman.', '“Why?” I have reasons. Always.'),
    eye: L('Göz. Toplamlar kaybolur. Sihir değil.', 'The eye. Totals vanish. Not magic.'),
    reports: L('Raporlar. Burada. Grafik var.', 'Reports. Here. Charts included.'),
    rings: L('Bu kart. Ayın durumu. Grafik sevenlere.', 'This card. The month’s status. For chart people.'),
    floor: L('Bütçe yok mu? Buradan plan çizerim. Hızlı harcarsan söylerim.', 'No budget? I draw a plan from this. Spend fast, I tell you.'),
    invest: L('Yatırım. Kendi sekmesi. Fiyatı ben güncellerim.', 'Investments. Own tab. I update the price.'),
    widget: L('Ana ekran aracı. Uygulamayı açmana gerek kalmaz. Ben de gelirim.', 'Home screen widget. No need to open the app. I come along.'),
    tile: L('Bildirim paneline kutucuk. Bir kaydırma. O kadar.', 'A quick settings tile. One swipe. That’s it.'),
    settings: L('Bitti. Rehber Ayarlar’da. Gerekirse.', 'Done. The guide is in Settings. If needed.'),
  },
  karamel: {
    add: L('Hav! Kayıt buradan, 3 dokunuşta biter. Hep yanındayım!', 'Woof! Entries start here, done in 3 taps. I’m right beside you!'),
    amount: L('Tutarı yaz ya da hazır tutarlara dokun, çok kolay!', 'Type the amount or tap a ready one, so easy!'),
    newCat: L('İstediğin kategori yok mu? “+ Yeni kategori” ile ekle, birlikte yapalım!', 'Don’t see yours? Add it with “+ New category”, let’s do it together!'),
    why: L('“Neden böyle?”ye dokun, hepsini anlatırım! Sebepsiz hiç kızmam, söz!', 'Tap “Why?” and I’ll tell you everything! I never scold without a reason, promise!'),
    eye: L('Göze dokun, toplamları saklarım! Sırrın bende güvende.', 'Tap the eye and I hide the totals! Your secret’s safe with me.'),
    reports: L('Raporlar burada! Ayın nasıl geçtiğini birlikte inceleyelim!', 'Reports are here! Let’s sniff through your month together!'),
    rings: L('Bu kart ayın nasıl gittiğini gösterir. Halkalar dolunca ben de sevinirim!', 'This card shows how the month goes. When the rings fill, I wag!'),
    floor: L('Bütçe yoksa buradan harcama planı çizerim; plandan hızlı gidersen söylerim!', 'No budget? I’ll draw a spending plan from this and tell you if you run ahead!'),
    invest: L('Yatırımın kendi sekmesinde! Altın ya da döviz de olur; fiyatı ben getiririm!', 'Investments have their own tab! Gold or currency too; I’ll fetch the price!'),
    widget: L('Beni ana ekranına koy, her gün seni karşılayayım!', 'Put me on your home screen, I’ll greet you every day!'),
    tile: L('Bildirim paneline bir kutucuk ekleyelim, kayıt bir kaydırma uzakta!', 'Let’s add a quick settings tile, logging is one swipe away!'),
    settings: L('Harikaydın! Rehberi Ayarlar’dan, buradan tekrar açabilirsin.', 'You did great! Replay the guide from Settings, right here.'),
  },
  pamuk: {
    add: L('Kayıtlar buradan tatlım! Tutar, kategori, kaydet. Üç dokunuş, sıfır stres.', 'Entries start here, sweetie! Amount, category, save. Three taps, zero stress.'),
    amount: L('Önce tutarı yaz. Hazır tutarlar da var, çünkü vaktin değerli.', 'Type the amount first. Ready amounts are here too, because your time is precious.'),
    newCat: L('Aradığın kategori yok mu? “+ Yeni kategori” ile kendine özel bir tane yap.', 'Missing a category? Make one just for you with “+ New category”.'),
    why: L('Ruh halimi merak edersen “Neden böyle?”ye dokun. Asla sebepsiz drama yapmam. Neredeyse.', 'Curious about my mood? Tap “Why?”. I never do drama without a reason. Almost.'),
    eye: L('Biri omzundan mı bakıyor? Göze dokun, toplamları saklarım. Kızlar arasında kalsın.', 'Someone peeking? Tap the eye and I hide the totals. Our little secret.'),
    reports: L('Raporlar burada tatlım! Ayın hikâyesi, şık grafiklerle.', 'Reports are right here, sweetie! Your month’s story in chic charts.'),
    rings: L('Bu kart ayın özeti: bütçe, hedef, geçen günler. Halkalar dolunca ben de çok gururlanırım.', 'This card is your month at a glance: budget, goals, days gone. When the rings fill, I get so proud.'),
    floor: L('Bütçe yoksa buradan harcama planı çizerim; plandan hızlı gidersen nazikçe söylerim.', 'No budget? I’ll draw a spending plan from this and gently tell you if you run ahead.'),
    invest: L('Yatırımın artık kendi sekmesinde! Altın ya da döviz de tut; fiyatı ben güncellerim. Işıltılı!', 'Investments have their own tab now! Gold or currency too; I’ll update the price. Sparkly!'),
    widget: L('Beni ana ekranına koy! Her baktığında seni gaza getiririm, kayıt da tek dokunuş.', 'Put me on your home screen! I’ll cheer you on every time you look, and entries are one tap.'),
    tile: L('Bildirim paneline bir kutucuk ekleyelim; kayıt bir kaydırma uzakta. Pratik ve şık.', 'Let’s add a quick settings tile; logging is one swipe away. Practical and chic.'),
    settings: L('Bitti, harikaydın! Rehberi buradan, Ayarlar’dan istediğin zaman tekrar açabilirsin.', 'Done, you were amazing! Replay the guide from Settings, right here, anytime.'),
  },
};

export const guideLine = (who: MascotKey, id: StepId, lang: Lang) => GUIDE_LINES[who][id][lang];
