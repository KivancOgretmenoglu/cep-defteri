/**
 * Maskotların kısa espri, selam ve ipuçları (Türkçe + İngilizce).
 * Ton: sıcak, yargılamayan; harcamayı asla ayıplamaz, yatırım değerinin düşüşünü yorumlamaz.
 * `{name}` yer tutucusu maskotun (kullanıcının verdiği ya da varsayılan) adıyla değişir.
 * Her karakterin kendi "ağzı" vardır; ortak havuzla karıştırılır.
 */
import type { MascotEvent } from './events';
import type { Lang, MascotKey } from './characters';

type Line = { tr: string; en: string };
type Pool = Line[];
const L = (tr: string, en: string): Line => ({ tr, en });

// ── Ortak havuz ─────────────────────────────────────
const ANY_EXPENSE: Pool = [
  L('Not aldım! Deftere işlendi.', 'Noted! It’s in the book.'),
  L('Tamamdır, kayıtta. Fişi kaybetsen bile ben unutmam.', 'Done. Even if you lose the receipt, I won’t forget.'),
  L('Bir satır daha, defter gittikçe şenleniyor.', 'One more line. The notebook is getting lively.'),
];
const EXPENSE: Record<string, Pool> = {
  'e-food': [L('Afiyet olsun! Kaydı ben tuttum.', 'Enjoy your meal! I logged it.'), L('Karnın doyduysa defter de doydu.', 'If you’re full, so is the notebook.')],
  'e-market': [L('Market kaydı tamam. Buzdolabı da sevinmiştir.', 'Groceries logged. The fridge is happy too.')],
  'e-transport': [L('Yolun açık olsun! Kaydı aldım.', 'Safe travels! Logged it.'), L('Otobüs, metro, vapur... Hepsi defterde yer bulur.', 'Bus, metro, ferry… they all fit in the notebook.')],
  'e-subs': [L('İpucu: Düzenli ödemeleri plana eklersen önceden hatırlatırım.', 'Tip: add regular payments as plans and I’ll remind you early.')],
  'e-school': [L('Okul masrafı not edildi. Öğrenmeye harcanan her kuruş iyi bir hikâye.', 'School expense noted. Money spent on learning makes a good story.')],
  'e-fun': [L('Eğlence de hayatın parçası. Keyfini çıkar!', 'Fun is part of life. Enjoy it!')],
  'e-housing': [L('Yuva kaydı yerleşti. Ev gibisi yok.', 'Home sweet home. Logged.')],
  'e-bills': [L('Fatura kaydı tamam. Işıklar yanmaya devam!', 'Bill logged. The lights stay on!')],
  'e-phone': [L('İnternet kaydı tamam. Bağlantımız güçlü.', 'Phone bill logged. Strong signal.')],
  'e-clothes': [L('Yeni bir şey mi aldın? Bence yakışmıştır.', 'Something new? I bet it looks great.')],
  'e-health': [L('Kendine iyi bakman her şeyden önemli. Kaydettim.', 'Taking care of yourself comes first. Logged.')],
  'e-gift': [L('Hediye almak da güzel bir his. Kaydettim.', 'Giving gifts feels nice. Logged.')],
};
const ANY_INCOME: Pool = [L('Para geldi, ben de zıpladım!', 'Money in! I jumped.'), L('Gelir kaydı tamam. Cüzdana hoş geldin!', 'Income logged. Welcome, money!')];
const INCOME: Record<string, Pool> = {
  'i-scholarship': [L('Burs yattı! Emeğinin karşılığı.', 'Scholarship’s in! You earned it.')],
  'i-family': [L('Aileden destek gelmiş. Bir teşekkür mesajı da iyi gider.', 'Support from home! A thank-you text would be sweet.')],
  'i-job': [L('Alın teri! Hakkını verdin.', 'Hard-earned! Well done.')],
};
const INVEST: Pool = [
  L('Filize bir damla daha. Sabırla büyür.', 'Another drop for the sprout. It grows with patience.'),
  L('Bunu kenara koyduğun için gelecekteki sen el sallıyor.', 'Future you is waving thanks.'),
];
const REFUND: Pool = [L('İade geldi, cüzdan sevindi.', 'Refund’s back. Happy wallet.')];
const GOAL: Pool = [L('Hedef tamam! Konfeti benden.', 'Goal reached! Confetti’s on me.'), L('Başardın! Bu gerçekten kutlanır.', 'You did it! That deserves a party.')];
const UNDO: Pool = [L('Olur böyle şeyler. Sanki hiç olmamış gibi.', 'It happens. As if it never was.')];
const DEBT: Pool = [L('Borç-alacak defteri güncel. Dostluk bozulmaz.', 'IOUs updated. Friendships intact.')];

export const GREET: Record<'morning' | 'monday' | 'night' | 'monthStart' | 'spy' | 'spyOff' | 'exam' | 'newyear' | 'bayram' | 'summer', Pool> = {
  morning: [L('Günaydın! Defter açık, gün başlıyor.', 'Good morning! Notebook’s open, let’s go.'), L('Günaydın! Önce kahve, sonra kuruşlar.', 'Morning! Coffee first, coins second.')],
  monday: [L('Pazartesi... Gözlerim yarı açık ama defter tamamen açık.', 'Monday… eyes half open, notebook wide open.')],
  night: [L('Geç oldu, ben esnemeye başladım.', 'It’s late, I’m starting to yawn.'), L('Gece kuşu musun? Ben biraz uykuluyum.', 'Night owl? I’m a bit sleepy.')],
  monthStart: [L('Ay başı! Yepyeni bir sayfa.', 'New month, fresh page!'), L('Yeni ay, temiz sayfa. Hadi bakalım!', 'New month, clean slate. Here we go!')],
  spy: [L('Bakiye gizli moda alındı. Bu bilgi sadece bizim aramızda.', 'Balances hidden. This stays between us.'), L('Psst... Rakamlar gizli. Kimseye söylemem.', 'Psst… numbers are hidden. I won’t tell.'), L('Ajan {name} görevde. Bakiye dikizcilerden korunuyor.', 'Agent {name} on duty. Balances safe from peekers.')],
  spyOff: [L('Gözlükleri çıkardım. Rakamlar yeniden ortada.', 'Shades off. Numbers are back.')],
  exam: [L('Sınav haftası! Ben de çalışıyorum, bildirimleri azalttım.', 'Exam week! I’m studying too, fewer notifications.'), L('Kolay gelsin! Bütçe bende, ders sende.', 'Good luck! I’ve got the budget, you’ve got the books.')],
  newyear: [L('Mutlu yıllar! Yeni yılda defterimiz bol olsun.', 'Happy New Year! May our notebook stay full.')],
  bayram: [L('İyi bayramlar! Harçlık geldiyse kaydetmeyi unutma.', 'Happy holidays! If you got holiday money, log it.')],
  summer: [L('Yaz geldi! Dondurma bütçesi ayırdık mı?', 'Summer’s here! Did we budget for ice cream?')],
};

export const TIPS: Pool = [
  L('İpucu: Kaydettikten sonra birkaç saniye “Geri al” görünür.', 'Tip: right after saving, “Undo” shows for a few seconds.'),
  L('İpucu: Bir işleme dokununca düzenleyebilir ya da iade ekleyebilirsin.', 'Tip: tap a transaction to edit it or add a refund.'),
  L('İpucu: Yedeğini Ayarlar’dan indirebilirsin. Veriler yalnız bu cihazda.', 'Tip: download a backup in Settings. Your data stays on this device.'),
  L('İpucu: “Neden böyle?” ruh hâlimin gerekçesini gösterir.', 'Tip: “Why?” explains my mood.'),
  L('İpucu: Yatırıma aktarım harcama sayılmaz, bütçeni etkilemez.', 'Tip: moving money to investments isn’t spending.'),
  L('İpucu: Yaklaşan ödemeleri plana eklersen kullanılabilir paranı ona göre hesaplarım.', 'Tip: add upcoming payments as plans and I’ll factor them in.'),
  L('İpucu: Gider girerken “Hesabı bölüş” ile arkadaşının payını ayırabilirsin.', 'Tip: use “Split the bill” to log a friend’s share.'),
  L('İpucu: Göz simgesi toplam bakiyeleri gizler.', 'Tip: the eye icon hides your totals.'),
];
export const JOKES: Pool = [
  L('Kuruşları sayarken uyuyakaldım. Koyun saymaktan iyidir.', 'I fell asleep counting coins. Beats counting sheep.'),
  L('Ben piksel piksel, sen kuruş kuruş. İyi bir ekibiz.', 'Me pixel by pixel, you coin by coin. Great team.'),
  L('Cebim yok ama Cep Defteri’m var.', 'No pockets, but I’ve got a Pocket Book.'),
];
export const TAP_POPS: Pool = [L('Hey!', 'Hey!'), L('Selam!', 'Hi!'), L('Buradayım!', 'Right here!')];
export const TICKLE = L('Gıdıklanıyorum!', 'That tickles!');
export const DIZZY = L('Başım döndü...', 'So dizzy…');
export const SNEEZE = L('Hapşu!', 'Achoo!');
export const YAWN = L('Hıaaa...', 'Yaaawn…');

// ── Karakter ağızları ───────────────────────────────
interface Voice {
  expense: Pool;
  income: Pool;
  jokes: Pool;
  pops: Pool;
  invest?: Pool;
  debt?: Pool;
}
const VOICES: Record<MascotKey, Voice> = {
  fistik: {
    expense: [L('Kaydettim. Kahveyse, bir yudum da bana.', 'Logged. If it’s coffee, save me a sip.'), L('Miyav, deftere yazıldı.', 'Meow, it’s in the book.'), L('Patimle onayladım.', 'Approved with my paw.')],
    income: [L('Para geldi! Mama kabı... yani cüzdan doldu.', 'Money! The food bowl… I mean wallet, is full.')],
    jokes: [L('Dokuz canım var ama tek bir bütçem.', 'I have nine lives but only one budget.'), L('Masadan bir şey düşürmeden duramıyorum. Kuruşları düşürmüyorum ama.', 'I can’t help knocking things off tables. Never coins, though.')],
    pops: [L('Miyav!', 'Meow!'), L('Mırr...', 'Purr…')],
  },
  bilge: {
    expense: [L('Kaydedildi. Rakam rakamdır.', 'Recorded. A number is a number.'), L('Not defterime işledim, hu-hu.', 'Into my notes it goes. Hoo-hoo.')],
    income: [L('Gelir doğru sütunda. Düzen güzeldir.', 'Income in the right column. Order is lovely.')],
    jokes: [L('Gece çalışırım, gündüz rapor yazarım.', 'I work nights and write reports by day.'), L('Bilge’yim ama hâlâ kuruşların nereye gittiğini merak ederim.', 'I’m wise, yet I still wonder where coins go.')],
    pops: [L('Hu-hu!', 'Hoo-hoo!'), L('Hmm.', 'Hmm.')],
  },
  ceviz: {
    expense: [L('Kaydettim! Ceviz saklar gibi saklıyorum.', 'Logged! Stashed like a nut.'), L('Bir kuruş gitti, ama ben nerede olduğunu biliyorum.', 'A coin went out, but I know where.')],
    income: [L('Kışlık stok arttı!', 'Winter stash just grew!')],
    invest: [L('Bir ceviz daha toprağa! Ağaç olacak.', 'Another nut in the ground. It’ll be a tree.')],
    jokes: [L('Cevizlerimin yerini unutuyorum, o yüzden her şeyi yazıyorum.', 'I forget where I bury nuts, so I write everything down.')],
    pops: [L('Cık cık!', 'Chitter!'), L('Hop!', 'Hop!')],
  },
  diken: {
    expense: [L('Yazdım. Gerekli miydi? Sen bilirsin.', 'Logged. Needed it? Your call.'), L('Tamam. Sakin.', 'Done. Calm.')],
    income: [L('Gelir. Güzel. Telaş yok.', 'Income. Nice. No rush.')],
    jokes: [L('Batmam merak etme. Sadece fiyatlar batıyor.', 'I don’t prick. Only prices do.'), L('Az olsun, öz olsun. Benim gibi.', 'Less, but better. Like me.')],
    pops: [L('Hm.', 'Hm.'), L('Fıs.', 'Sniff.')],
  },
  karamel: {
    expense: [L('Hav! Kaydettim, kuyruğum sallanıyor.', 'Woof! Logged it, tail wagging.'), L('Getirdim, bıraktım: kayıt tamam!', 'Fetched and dropped: logged!')],
    income: [L('Para geldi, ben de koştum!', 'Money’s in, I ran in circles!')],
    debt: [L('Arkadaş hesabı tamam. Kimse unutulmaz!', 'Friend tab updated. Nobody gets forgotten!')],
    jokes: [L('Top getirmek kolay, bütçe getirmek zor.', 'Fetching a ball is easy. Fetching a budget, less so.'), L('Kuyruğumu kovalamayı bıraktım, artık fişleri kovalıyorum.', 'I quit chasing my tail. Now I chase receipts.')],
    pops: [L('Hav!', 'Woof!'), L('Hav hav!', 'Woof woof!')],
  },
};

const last = new Map<Pool, Line>();
/** Havuzdan rastgele seçer; aynı havuzdan art arda aynısını vermez. */
function pickLine(pool: Pool): Line {
  if (pool.length === 1) return pool[0];
  let q = pool[Math.floor(Math.random() * pool.length)];
  if (q === last.get(pool)) q = pool[(pool.indexOf(q) + 1) % pool.length];
  last.set(pool, q);
  return q;
}
export const fill = (s: string, name: string) => s.replace(/\{name\}/g, name);
export function say(pool: Pool, lang: Lang, name: string): string {
  return fill(pickLine(pool)[lang], name);
}

/** Karakterin sesi (%45) ya da ortak havuz. */
function mix(own: Pool | undefined, shared: Pool): Pool {
  return own && own.length && Math.random() < 0.45 ? own : shared;
}

/** Olaya uygun havuz; yorum yapılmayacak olaylarda null (değer girişi, transfer, çekim). */
export function eventPool(e: MascotEvent, who: MascotKey): Pool | null {
  const v = VOICES[who];
  switch (e.type) {
    case 'expense':
      return mix(v.expense, e.categoryId && EXPENSE[e.categoryId] && Math.random() < 0.7 ? EXPENSE[e.categoryId] : ANY_EXPENSE);
    case 'income':
      return mix(v.income, e.categoryId && INCOME[e.categoryId] ? INCOME[e.categoryId] : ANY_INCOME);
    case 'plan-confirmed':
      return e.kind === 'income' ? mix(v.income, ANY_INCOME) : e.kind === 'expense' ? mix(v.expense, ANY_EXPENSE) : null;
    case 'invest':
      return mix(v.invest, INVEST);
    case 'refund':
      return REFUND;
    case 'goal-reached':
      return GOAL;
    case 'debt':
      return mix(v.debt, DEBT);
    case 'deleted':
    case 'undo':
      return UNDO;
    default:
      return null;
  }
}
export const jokesFor = (who: MascotKey): Pool => [...VOICES[who].jokes, ...JOKES];
export const popsFor = (who: MascotKey): Pool => [...VOICES[who].pops, ...TAP_POPS];

/** Testler için: tüm satırlar. */
export function allLines(): Line[] {
  const voices = Object.values(VOICES).flatMap((v) => [...v.expense, ...v.income, ...v.jokes, ...v.pops, ...(v.invest ?? []), ...(v.debt ?? [])]);
  return [
    ...ANY_EXPENSE, ...Object.values(EXPENSE).flat(), ...ANY_INCOME, ...Object.values(INCOME).flat(), ...INVEST, ...REFUND, ...GOAL, ...UNDO, ...DEBT,
    ...Object.values(GREET).flat(), ...TIPS, ...JOKES, ...TAP_POPS, TICKLE, DIZZY, SNEEZE, YAWN, ...voices,
  ];
}
