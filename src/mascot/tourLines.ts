/**
 * İlk açılış rehberinin maskot ağzından satırları: 4 kart x 5 karakter x tr+en.
 * Ton: Fıstık havalı/oyuncu, Bilge sakin ve az sözlü, Ceviz tutumlu/telaşlı, Diken minimalist kuru espri, Karamel neşeli/sadık.
 * Her satır 1-2 kısa cümle; `{name}` kullanılmaz (ad, üstteki başlıkta görünür).
 */
import type { Lang, MascotKey } from './characters';

type Line = { tr: string; en: string };
const L = (tr: string, en: string): Line => ({ tr, en });

/** Kart sırası: 0 selam, 1 + düğmesi, 2 kendi kategorin/hesabın, 3 "Neden böyle?" + bitiş. */
export const TOUR_LINES: Record<MascotKey, [Line, Line, Line, Line]> = {
  fistik: [
    L('Selam, ben senin yeni muhasebecinle... yani benimle! 20 saniyede 3 şey göstereyim.', 'Hey, meet your new bookkeeper. Me! Three things in 20 seconds, watch.'),
    L('Şu parlak + var ya? Tutar, kategori, kaydet. Üç dokunuş, bitti. Kolaydı, di mi?', 'See that shiny +? Amount, category, save. Three taps, done. Easy, right?'),
    L('Listede istediğini bulamadın mı? Orada “+ Yeni” de, kendi kategorini yap. Ayarlar’da daha fazlası var.', 'Can’t find yours? Hit “+ New” right there and make your own. Settings has even more.'),
    L('Bana dokun, “Neden böyle?” de, neden havalı ya da düşünceli olduğumu söyleyeyim. Sebepsiz yargılamam!', 'Tap me, hit “Why?”, and I’ll tell you why I feel this way. I never judge without a reason!'),
  ],
  bilge: [
    L('Hoş geldin. Üç şey göstereceğim. Kısa olacak.', 'Welcome. Three things to show you. It will be brief.'),
    L('Artı düğmesi. Tutar, kategori, kaydet. Hepsi bu.', 'The plus button. Amount, category, save. That is all.'),
    L('Eksik bir kategori ya da hesap varsa, seçtiğin yerde “+ Yeni”. Ayarlar’da daha fazlası.', 'Missing a category or account? “+ New”, right where you pick. More in Settings.'),
    L('Bana dokun, “Neden böyle?” de. Sebepsiz hüküm vermem.', 'Touch me and ask “Why?”. I judge nothing without reason.'),
  ],
  ceviz: [
    L('Merhaba! Vaktimiz az, kuruşlarımız çok. 20 saniyede 3 şey, hemen!', 'Hello! Little time, many coins. Three things in 20 seconds, quick!'),
    L('+ düğmesine bas: tutar, kategori, kaydet. Üç dokunuşa mal oluyor, ucuz iş!', 'Press +: amount, category, save. Three taps. A bargain!'),
    L('Kategori yoksa seçerken “+ Yeni” ile ekle, fazladan yer harcamaz. Ayarlar’da hepsi var.', 'No category? Add “+ New” while picking, no extra trips. Settings has the rest.'),
    L('Bana dokun, “Neden böyle?” de, hesabını açıklarım. Sebepsiz kimseyi suçlamam, söz!', 'Tap me, say “Why?”, and I’ll show my math. I never blame without a reason, promise!'),
  ],
  diken: [
    L('Selam. 3 şey, 20 saniye. Fazlası yok.', 'Hi. Three things, 20 seconds. No more.'),
    L('+ düğmesi. Tutar, kategori, kaydet. Üç dokunuş. Dördüncüsü gereksiz.', 'The + button. Amount, category, save. Three taps. A fourth would be excessive.'),
    L('Kategori yoksa “+ Yeni”. Gerisi Ayarlar’da. Ben okumadım ama orada.', 'No category? “+ New”. The rest is in Settings. I haven’t read it, but it’s there.'),
    L('Bana dokun, “Neden böyle?” de. Sebepsiz yargılamam. Sebepli de pek sevmem.', 'Tap me, say “Why?”. I don’t judge without reason. With reason, I’m not thrilled either.'),
  ],
  karamel: [
    L('Hav, selam! Seninle tanışmak harika! Sana 20 saniyede 3 şey göstereceğim!', 'Woof, hi! So happy to meet you! Let me show you 3 things in 20 seconds!'),
    L('Bu + düğmesi var ya? Tutar, kategori, kaydet. Üç dokunuş, ben hep yanındayım!', 'See this + button? Amount, category, save. Three taps, and I’m right beside you!'),
    L('İstediğin kategori yok mu? “+ Yeni” ile kendin ekle! Ayarlar’da daha çoğu var, hadi bakalım!', 'Don’t see your category? Add it with “+ New”! Settings has even more, let’s go!'),
    L('Bana dokun, “Neden böyle?” de, hepsini anlatırım! Sebepsiz hiç üzülmem, hiç kızmam, söz!', 'Tap me, say “Why?”, and I’ll tell you everything! I never worry or scold without a reason, promise!'),
  ],
};

export const TOUR_MOODS = ['happy', 'curious', 'calm', 'thoughtful'] as const;

export const TOUR_UI: Record<string, Line> = {
  skip: L('Geç', 'Skip'),
  next: L('Sonraki', 'Next'),
  back: L('Geri', 'Back'),
  start: L('Bakiyemi kuralım', 'Set up my balance'),
  close: L('Bitti', 'Done'),
  label: L('Kısa rehber', 'Quick guide'),
  step: L('Adım {n} / {total}', 'Step {n} of {total}'),
  amount: L('Tutar', 'Amount'),
  category: L('Kategori', 'Category'),
  save: L('Kaydet', 'Save'),
  newCat: L('+ Yeni', '+ New'),
  why: L('Neden böyle?', 'Why?'),
  replay: L('Rehberi tekrar göster', 'Show guide again'),
  replayHint: L('Maskotun 4 kartlık kısa turu.', 'A quick 4-card tour with your mascot.'),
};

export const tourText = (k: keyof typeof TOUR_UI | string, lang: Lang) => TOUR_UI[k][lang];
