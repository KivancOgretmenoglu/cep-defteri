/**
 * Sohbet sahnesi ('chat'): ana ekrandaki maskotun yanına bir misafir gelir, 2–4 satırlık kısa bir
 * karşılıklı konuşma olur (misafir, ana maskot, misafir…). Saf veri + seçim; tarayıcıya dokunmaz.
 *
 * Satırlar paraya yakın ama asla vaaz vermeyen, hafif cümlelerdir; hiçbirinde tutar yoktur
 * (bakiye gizliyken de güvenle gösterilir). {g} misafirin, {m} ana maskotun adıdır.
 */
import { CHARACTERS, MASCOT_KEYS, type L10n, type Lang, type MascotKey } from '../characters';

export type ChatWhen = 'morning' | 'noon' | 'evening' | 'weekend' | 'monthStart' | 'monthEnd';

export interface Dialogue {
  id: string;
  /** Yalnız bu misafirle (kişilik tadı); yoksa herkes söyleyebilir. */
  guest?: MascotKey;
  /** Yalnız bu bağlamda (saat dilimi, hafta sonu, ay başı/sonu). */
  when?: ChatWhen;
  /** Sırayla: misafir, ana maskot, misafir, … (2–4 satır). */
  lines: L10n[];
}

const l = (tr: string, en: string): L10n => ({ tr, en });

export const DIALOGUES: Dialogue[] = [
  { id: 'coffee-turn', guest: 'karamel', lines: [l('Bugün kahve sırası kimde?', "Whose turn is it for coffee today?"), l('Bütçeye bakarsak... senin!', 'Going by the budget... yours!'), l('Hav! Yine mi ben?', 'Woof! Me again?')] },
  { id: 'nuts', guest: 'ceviz', lines: [l('Kışa kaç ceviz kaldı, saydın mı?', 'Counted the nuts for winter yet?'), l('Saydım. Deftere de yazdım.', 'Counted. Logged them too.'), l('İşte bu! Birikim böyle büyür.', "That's it! That's how savings grow.")] },
  { id: 'just-looked', guest: 'diken', lines: [l('Yeni bir şey mi aldın?', 'Bought something new?'), l('Yok, sadece baktım.', 'Nope, just looked.'), l('Bakmak bedava. Güzel.', 'Looking is free. Good.')] },
  { id: 'treat', guest: 'pamuk', lines: [l('Tatlım, bugün kendine küçük bir ödül verdin mi?', 'Sweetie, did you treat yourself today?'), l('Bir simit. Deftere de yazdım!', 'One bagel. Logged it, too!'), l('Ayy, hem ödül hem kayıt. Bayıldım!', 'A treat AND a record. Love it!')] },
  { id: 'numbers', guest: 'bilge', lines: [l('Rakamlar bugün ne diyor?', 'What do the numbers say today?'), l('Sakin bir gün diyorlar.', "They say it's a calm day."), l('Sakin günler iyi ay yapar.', 'Calm days make good months.')] },
  { id: 'coffee-money', guest: 'fistik', lines: [l('Kahve paramı gördün mü?', 'Seen my coffee money?'), l('Defterde, ikinci satırda.', 'In the notebook, second line.'), l('Demek her şeyi yazıyorsun!', 'So you really do write it all down!')] },
  { id: 'morning', when: 'morning', lines: [l('Günaydın {m}! Erken kalkmışsın.', "Morning, {m}! You're up early."), l('Kayıtlar beklemez, {g}.', "Entries don't wait, {g}."), l('O zaman ben de kahvemi yazayım.', "Then I'll log my coffee too.")] },
  { id: 'lunch', when: 'noon', lines: [l('Öğle arası mı, {m}?', 'Lunch break, {m}?'), l('Yemeği evden getirdim, cebe dost.', 'Brought lunch from home. Wallet-friendly.'), l('Ben de yarın getireyim.', "I'll bring mine tomorrow.")] },
  { id: 'evening', when: 'evening', lines: [l('Gün bitti mi, {m}?', 'Is the day done, {m}?'), l('Bitmeden bir kontrol edelim.', "One quick check before it is."), l('Akşam kontrolü, en tatlı alışkanlık.', 'Evening check-ins, the best habit.')] },
  { id: 'weekend', when: 'weekend', lines: [l('Hafta sonu planın ne?', 'Any weekend plans?'), l('Bedava bir park, bir de piknik.', 'A free park and a picnic.'), l('Bütçe dostu hafta sonu, harika!', 'A budget-friendly weekend. Nice!')] },
  { id: 'month-start', when: 'monthStart', lines: [l('Yeni ay, yeni sayfa!', 'New month, new page!'), l('Bütçeyi şimdiden kurdum bile.', 'Already set up the budget.'), l('Hızlısın! Ben daha takvimi çeviriyorum.', "Fast! I'm still flipping the calendar.")] },
  { id: 'month-end', when: 'monthEnd', lines: [l('Ay sonu yaklaşıyor, nasıl gidiyor?', "Month end is near. How's it going?"), l('Yavaş ama emin adımlarla.', 'Slow and steady.'), l('En güzeli de bu.', "That's the best way.")] },
  { id: 'receipts', lines: [l('Bir şey soracağım: fiş saklıyor musun?', 'Quick question: do you keep receipts?'), l('Ben hepsini deftere yazıyorum.', 'I write them all in the notebook.'), l('Fiş uçar, defter kalır!', 'Receipts fly away, notes stay!')] },
  { id: 'hello', lines: [l('Sadece merhaba demeye geldim!', 'Just dropped by to say hi!'), l('Merhaba {g}! Çay koyayım mı?', 'Hi {g}! Shall I make some tea?')] },
  { id: 'sale', lines: [l('İndirim var diyorlar, gidelim mi?', "They say there's a sale. Shall we go?"), l('Listede varsa gideriz.', "Only if it's on the list."), l('Liste... tamam, ikna oldum.', 'The list... fine, you win.')] },
  { id: 'piggy', lines: [l('Kumbaram biraz ağırlaştı galiba.', 'I think my piggy bank got heavier.'), l('Sallama, sayalım!', "Don't shake it, let's count!"), l('Sayarken ben de yardım ederim.', "I'll help you count."), l('Anlaştık, {g}!', 'Deal, {g}!')] },
  { id: 'split', guest: 'karamel', lines: [l('Dünkü pizzayı bölüşmüştük, hatırladın mı?', 'Remember we split that pizza yesterday?'), l('Arkadaşlar sayfasında duruyor.', "It's on the friends page."), l('Sen olmasan unuturdum, {m}!', "I'd forget without you, {m}!")] },
  { id: 'minimal', guest: 'diken', lines: [l('Çok eşyan var mı?', 'Do you own a lot of stuff?'), l('Az ama öz.', 'Little, but good.'), l('Doğru cevap.', 'Correct answer.')] },
];

/** Bir satırın en fazla uzunluğu (karakter). */
export const MAX_LINE = 60;

export interface ChatCtx {
  hour: number;
  /** 0 = pazar … 6 = cumartesi */
  weekday: number;
  /** Ayın günü (1–31) */
  dom: number;
  /** Ayın gün sayısı */
  dim: number;
}

export function fitsWhen(w: ChatWhen | undefined, c: ChatCtx): boolean {
  switch (w) {
    case undefined:
      return true;
    case 'morning':
      return c.hour >= 6 && c.hour < 11;
    case 'noon':
      return c.hour >= 11 && c.hour < 15;
    case 'evening':
      return c.hour >= 18 && c.hour < 24;
    case 'weekend':
      return c.weekday === 0 || c.weekday === 6;
    case 'monthStart':
      return c.dom <= 3;
    case 'monthEnd':
      return c.dim - c.dom <= 4;
  }
}

/** Sohbet misafiri: ana maskot dışındaki beş karakterden biri. */
export function chatGuest(main: MascotKey, rand: () => number): MascotKey {
  const pool = MASCOT_KEYS.filter((k) => k !== main);
  return pool[Math.min(pool.length - 1, Math.floor(rand() * pool.length))];
}

/** Uygun diyaloglar; bu misafire özgü ya da bu bağlama uyanlar 3 kat ağırlıklı. */
export function pickDialogue(guest: MascotKey, ctx: ChatCtx, rand: () => number): Dialogue {
  const ok = DIALOGUES.filter((d) => (!d.guest || d.guest === guest) && fitsWhen(d.when, ctx));
  const weight = (d: Dialogue) => (d.guest || d.when ? 3 : 1);
  const total = ok.reduce((s, d) => s + weight(d), 0);
  let r = rand() * total;
  for (const d of ok) {
    r -= weight(d);
    if (r < 0) return d;
  }
  return ok[ok.length - 1];
}

export interface ChatLine {
  who: 'guest' | 'main';
  text: string;
}

/** Diyaloğu adlarla doldurur; satırlar misafirden başlayarak sırayla. */
export function chatLines(d: Dialogue, lang: Lang, guest: MascotKey, mainName: string): ChatLine[] {
  const g = CHARACTERS[guest].name[lang];
  return d.lines.map((x, i) => ({ who: i % 2 === 0 ? 'guest' : 'main', text: x[lang].replace(/\{g\}/g, g).replace(/\{m\}/g, mainName) }));
}

/** Satır başına süre (ms). */
export const CHAT_LINE_MS = 2500;
