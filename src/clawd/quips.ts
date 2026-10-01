/**
 * Clawd'ın kısa espri ve ipuçları. Ton: sıcak, yargılamayan, harcamayı asla ayıplamayan.
 * Yatırım değerinin düşüşü hakkında hiçbir şey söylenmez.
 * Ayarlarda "Clawd ara sıra espri yapsın" kapalıysa olay esprileri ve selamlar gösterilmez;
 * uzun basınca gelen ipuçları (kullanıcı istediği için) yine görünür.
 */
import type { ClawdEvent } from './events';

const ANY_EXPENSE = [
  'Not aldım! Kalemim zaten hazırdı.',
  'Deftere işlendi. Sen keyfine bak.',
  'Tamamdır, kayıtta. Fişi kaybetsen bile ben unutmam.',
  'Bir satır daha, defter gittikçe şenleniyor.',
];

const EXPENSE: Record<string, string[]> = {
  'e-food': [
    'Afiyet olsun! Kaydı ben tuttum.',
    'Kahve mi, yemek mi? Hangisiyse, afiyet olsun.',
    'Karnın doyduysa defter de doydu.',
  ],
  'e-market': [
    'Market kaydı tamam. Buzdolabı da sevinmiştir.',
    'Liste bitti, kayıt bitti. Poşetleri taşımak sana kaldı.',
  ],
  'e-transport': [
    'Yolun açık olsun! Kaydı aldım.',
    'Otobüs, metro, vapur... Hepsi defterde yer bulur.',
  ],
  'e-subs': [
    'Abonelik kaydı tamam. Bir sonraki bölümün keyfi senin.',
    'İpucu: Düzenli ödemeleri Bütçe’de plana eklersen önceden hatırlatırım.',
  ],
  'e-school': [
    'Okul masrafı not edildi. Kitap kokusu buraya kadar geldi.',
    'Öğrenmeye harcanan her kuruş iyi bir hikâye.',
  ],
  'e-fun': [
    'Eğlence de hayatın parçası. Keyfini çıkar!',
    'Güzel vakit geçirmen önemli. Kaydı ben hallettim.',
  ],
  'e-housing': ['Yuva kaydı yerleşti. Ev gibisi yok.'],
  'e-bills': ['Fatura kaydı tamam. Işıklar yanmaya devam!'],
  'e-phone': ['İnternet kaydı tamam. Bağlantımız güçlü.'],
  'e-clothes': ['Yeni bir şey mi aldın? Bence yakışmıştır.'],
  'e-health': ['Kendine iyi bakman her şeyden önemli. Kaydettim.'],
  'e-gift': ['Hediye almak da güzel bir his. Kaydettim.'],
};

const ANY_INCOME = ['Para geldi, ben de zıpladım!', 'Gelir kaydı tamam. Cüzdana hoş geldin!'];
const INCOME: Record<string, string[]> = {
  'i-scholarship': ['Burs yattı! Emeğinin karşılığı.', 'Burs günü, güzel gün.'],
  'i-family': ['Aileden destek gelmiş. Bir teşekkür mesajı da iyi gider.', 'Evden gelen destek, kaydı benden.'],
  'i-job': ['Alın teri! Hakkını verdin.', 'Maaş günü dansımı izlediysen sorun yok.'],
};

const INVEST = [
  'Filize bir damla daha. Sabırla büyür.',
  'Bunu kenara koyduğun için gelecekteki sen el sallıyor.',
  'Yatırıma aktarım kayıtlı. Harcama sayılmaz, merak etme.',
];
const REFUND = ['İade geldi, cüzdan sevindi.', 'Geri gelen para her zaman güzeldir.'];
const GOAL = ['Hedef tamam! Konfeti benden.', 'Başardın! Bu gerçekten kutlanır.'];
const UNDO = ['Olur böyle şeyler. Sanki hiç olmamış gibi.', 'Silindi gitti. Defter tertemiz.'];

export const GREET = {
  morning: ['Günaydın! Kahvem hazır, defterim açık.', 'Günaydın! Bugün de yanındayım.', 'Günaydın! Önce kahve, sonra kuruşlar.'],
  monday: ['Pazartesi... Gözlerim yarı açık ama defter tamamen açık.', 'Haftanın ilk günü. Yavaş yavaş ısınıyorum.'],
  night: ['Geç oldu, ben esnemeye başladım.', 'Gece kuşu musun? Ben de biraz uykuluyum.'],
  monthStart: ['Ay başı! Yepyeni, bembeyaz bir sayfa.', 'Yeni ay, temiz sayfa. Hadi bakalım!', 'Ay başı geldi, defter de taze.'],
  spy: [
    'Bakiye gizli moda alındı. Bu bilgi sadece bizim aramızda.',
    'Psst... Rakamlar gizli. Kimseye söylemem.',
    'Ajan Clawd görevde. Bakiye dikizcilerden korunuyor.',
  ],
  spyOff: ['Gözlükleri çıkardım. Rakamlar yeniden ortada.', 'Görev tamamlandı. Bakiyeler yeniden görünür.'],
};

/** Uzun basınca: uygulama ipuçları (her zaman gösterilebilir). */
export const TIPS = [
  'İpucu: Kaydettikten sonra birkaç saniye “Geri al” görünür.',
  'İpucu: Masaüstünde N tuşu yeni kayıt açar.',
  'İpucu: Bir işleme dokununca düzenleyebilir ya da iade ekleyebilirsin.',
  'İpucu: Yedeğini Ayarlar’dan indirebilirsin. Veriler yalnız bu cihazda.',
  'İpucu: “Neden böyle?” bağlantısı ruh hâlimin gerekçesini gösterir.',
  'İpucu: Yatırıma aktarım harcama sayılmaz, bütçeni etkilemez.',
  'İpucu: Yaklaşan ödemeleri plana eklersen kullanılabilir paranı ona göre hesaplarım.',
  'İpucu: Raporlar’da bir satıra dokununca o işlemlere gidersin.',
];

/** Uzun basınca: espriler (espriler açıksa). */
export const JOKES = [
  'Kuruşları sayarken uyuyakaldım. Koyun saymaktan iyidir.',
  'Ben piksel piksel, sen kuruş kuruş. İyi bir ekibiz.',
  'Cebim yok ama Cep Defteri’m var.',
  'Fiş biriktirmek benim sporum. Hâlâ ısınma turundayım.',
  'Bana “hesap adamı” diyorlar. Adam değilim ama hesabı severim.',
  'Kumbaram dün “doydum” dedi. Ben de “afiyet olsun” dedim.',
  'Dört bacağım var ama hiç koşturmam. Bütçeye adım adım bakarım.',
  'Gözlerim küçük ama her kuruşu görürüm. Sonra da unuturum, o yüzden yazarım.',
];

export const TAP_POPS = ['Hey!', 'Hi hi!', 'Pıt!', 'Buradayım!', 'Selam!'];
export const TICKLE = 'Gıdıklanıyorum!';
export const DIZZY = 'Başım döndü...';

const last = new Map<string[], string>();
/** Havuzdan rastgele seçer; aynı havuzdan art arda aynısını vermez. */
export function pick(pool: string[]): string {
  if (pool.length === 1) return pool[0];
  let q = pool[Math.floor(Math.random() * pool.length)];
  if (q === last.get(pool)) q = pool[(pool.indexOf(q) + 1) % pool.length];
  last.set(pool, q);
  return q;
}

/** Olaya uygun espri havuzu; espri yapılmayacak olaylar için null. */
export function eventPool(e: ClawdEvent): string[] | null {
  switch (e.type) {
    case 'expense':
      return e.categoryId && EXPENSE[e.categoryId] && Math.random() < 0.75 ? EXPENSE[e.categoryId] : ANY_EXPENSE;
    case 'income':
      return e.categoryId && INCOME[e.categoryId] ? INCOME[e.categoryId] : ANY_INCOME;
    case 'plan-confirmed':
      return e.kind === 'income' ? ANY_INCOME : e.kind === 'expense' ? ANY_EXPENSE : null;
    case 'invest':
      return INVEST;
    case 'refund':
      return REFUND;
    case 'goal-reached':
      return GOAL;
    case 'deleted':
    case 'undo':
      return UNDO;
    default:
      // Değer girişi, transfer, çekim: yorum yok (özellikle değer düşüşü yorumlanmaz).
      return null;
  }
}

/** Testler ve belgeler için tüm metinler. */
export function allLines(): string[] {
  return [
    ...ANY_EXPENSE, ...Object.values(EXPENSE).flat(), ...ANY_INCOME, ...Object.values(INCOME).flat(),
    ...INVEST, ...REFUND, ...GOAL, ...UNDO, ...Object.values(GREET).flat(), ...TIPS, ...JOKES,
  ];
}
