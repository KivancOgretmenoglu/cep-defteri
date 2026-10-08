import type { Money } from './money';
import type { ISODate } from './dates';
import type { AssetSpec } from './assets';

export type ID = string;

/**
 * cash/bank: günlük harcanabilir hesaplar.
 * investment: yatırım hesabı. Bakiyesi "harcanabilir para"ya hiç karışmaz.
 * person: bir kişiyle borç/alacak defteri. Bakiye > 0 → o sana borçlu; < 0 → sen ona borçlusun.
 *   Kişiyle yapılan para hareketleri transferdir: gelir ya da gider sayılmaz.
 */
export type AccountKind = 'cash' | 'bank' | 'investment' | 'person';

export interface Account {
  id: ID;
  name: string;
  kind: AccountKind;
  /**
   * Takibe başlarken hesapta olan tutar. Gelir sayılmaz.
   * Yatırım hesabında bu, açılış tarihindeki piyasa değeridir (açılış değerlemesi).
   */
  openingBalance: Money;
  /** Takip başlangıcı. Bu tarihten önceye işlem girilmez. */
  openingDate: ISODate;
  /**
   * Yalnız yatırım hesabı: takipten önce bu hesaba toplam ne kadar para koyduğun (net).
   * null = bilinmiyor → kâr/zarar hesaplanmaz.
   */
  priorContribution?: Money | null;
  /**
   * Yalnız yatırım hesabı: TL yerine altın/döviz tutuyorsa birimi (src/domain/assets.ts).
   * Yoksa klasik TL hesabıdır. Geçmişi olan hesapta değiştirilemez.
   */
  asset?: AssetSpec;
  /** Varlık hesabı: takip başlangıcında elde olan miktar (birim cinsinden). */
  openingQty?: number;
  /** Varlık hesabı: açılış miktarının değerlendiği birim fiyat (kuruş). openingBalance = openingQty × openingPrice. */
  openingPrice?: Money;
  archived?: boolean;
  createdAt: number;
}

export type CategoryKind = 'expense' | 'income';

export interface Category {
  id: ID;
  kind: CategoryKind;
  name: string;
  icon: string;
  color: string;
  /** İsteğe bağlı aylık limit (yalnız gider). */
  limit?: Money | null;
  archived?: boolean;
}

/**
 * expense: tüketim gideri.
 * income: gerçekleşmiş gelir (beklenen gelir burada değil, Plan olarak tutulur).
 * transfer: kendi hesapların arasında para hareketi. Gelir/gider değildir.
 *   Günlük → yatırım = yatırıma katkı; yatırım → günlük = yatırımdan çekim.
 * refund: bir giderin iadesi; o kategorideki harcamayı azaltır, gelir sayılmaz.
 */
export type TxType = 'expense' | 'income' | 'transfer' | 'refund';

export interface PlanRef {
  planId: ID;
  due: ISODate;
}

export interface Tx {
  id: ID;
  /** Oluşturulma sırası; aynı gündeki değerleme ile işlem sırasını belirler. */
  seq: number;
  type: TxType;
  amount: Money; // her zaman > 0
  date: ISODate;
  accountId: ID; // transferde kaynak hesap
  toAccountId?: ID; // yalnız transfer
  categoryId?: ID; // expense/income/refund
  note?: string;
  refundOf?: ID; // yalnız refund
  planRef?: PlanRef; // planlı bir kalemin gerçekleşmesi
  /** Serbest etiketler (ör. "erasmus", "tatil"); küçük harf, tekil. */
  tags?: string[];
  /** Varlık (altın/döviz) hesabına giren/çıkan transferde: alınan/satılan miktar (birim, ondalıklı olabilir). */
  qty?: number;
  /** Varlık hesabı transferinde işlem anındaki birim fiyat (kuruş). amount ≈ qty × unitPrice. */
  unitPrice?: Money;
  createdAt: number;
}

/** Yatırım hesabının belirli bir andaki piyasa değeri. Para hareketi değildir. */
export interface Valuation {
  id: ID;
  seq: number;
  accountId: ID;
  date: ISODate;
  value: Money; // ≥ 0
  note?: string;
  createdAt: number;
}

export type PlanKind = 'expense' | 'income' | 'transfer';
export type Freq = 'once' | 'weekly' | 'monthly' | 'yearly';

/** Yaklaşan ödeme, beklenen gelir veya planlı aktarım. Vadesi gelince kendiliğinden gerçekleşmez. */
export interface Plan {
  id: ID;
  kind: PlanKind;
  title: string;
  amount: Money;
  accountId: ID;
  toAccountId?: ID;
  categoryId?: ID;
  freq: Freq;
  startDate: ISODate;
  endDate?: ISODate | null;
  /** Atlanan vadeler. */
  skipped: ISODate[];
  /** Taksitli ödeme ise toplam taksit sayısı (aylık; bitiş tarihi buna göre hesaplanır). */
  installments?: number | null;
  createdAt: number;
}

export interface Goal {
  id: ID;
  title: string;
  target: Money;
  /** Hedef, bu yatırım hesabına yapılan net katkıyla ölçülür (piyasa değeriyle değil). */
  accountId: ID;
  createdAt: number;
}

export type PeriodMode = 'month' | 'days30';
export type ThemePref = 'system' | 'light' | 'dark';

export interface MascotPrefs {
  /** Seçili maskot (src/mascot/characters.ts) */
  key: string;
  /** Kullanıcının verdiği isim; null = karakterin kendi adı */
  name: string | null;
  /** Ana ekran kıyafeti */
  outfit: string;
}

export type Lang = 'tr' | 'en';

export interface Settings {
  /** Genel aylık harcama bütçesi; null = tanımlı değil. */
  monthlyBudget: Money | null;
  /** Günlük hesaplarda dokunulmadan tutulan birikim payı (stok tutar). */
  reserve: Money;
  periodMode: PeriodMode;
  theme: ThemePref;
  mascot: MascotPrefs;
  /** Arayüz dili */
  lang: Lang;
  /** Android simgesi seçili maskotu izlesin mi; null = henüz sorulmadı */
  appIconFollows: boolean | null;
  /** Sınav haftası modu bitiş günü (dahil); null = kapalı */
  examUntil: string | null;
  lastAccountId: ID | null;
  /** Son dışa aktarma zamanı (yedek hatırlatması için). */
  lastBackupAt: number | null;
  /** Toplam bakiyeleri gizle (işlem tutarları görünür kalır). */
  hideTotals: boolean;
  /** Maskot ara sıra espri yapsın. */
  quips: boolean;
  /** Ay sonu karnesinin görüldüğü son ay. */
  reportCardSeen: string | null;
  /** Bağlamsal ipuçlarından görülenlerin anahtarları (her ipucu bir kez gösterilir). */
  hintsSeen: string[];
  /** Misafir maskot sahneleri ara sıra görünsün. */
  cameos: boolean;
  /** Ay sonunda günlük hesaplarda en az kalması istenen tutar (grafikteki plan çizgisi); null = tanımsız. */
  monthEndFloor: Money | null;
}

export interface Data {
  schema: 1;
  accounts: Account[];
  categories: Category[];
  txs: Tx[];
  valuations: Valuation[];
  plans: Plan[];
  goals: Goal[];
  settings: Settings;
  /** Bir sonraki seq değeri. */
  nextSeq: number;
}
