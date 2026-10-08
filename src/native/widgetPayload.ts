/**
 * Ana ekran aracının (widget) göstereceği metinler ve maskot. Biçimlendirme (dil dahil) burada yapılır;
 * Java tarafı (CepWidgetProvider) yalnız yazar, boyuta göre düzeni ve `mascot` anahtarına göre görselleri seçer.
 */
import type { Data, ID, Lang } from '../domain/types';
import { availability, rangeSummary } from '../domain/ledger';
import { dayOfMonth, monthName, monthOf, type ISODate, type MonthKey } from '../domain/dates';
import { formatMoney } from '../domain/money';
import { categoryName } from '../domain/defaults';
import { frequentTemplates } from '../ui/hooks';
import { DEFAULT_MASCOT, MASCOT_KEYS, type MascotKey } from '../mascot/characters';

/**
 * Büyük araçtaki tek dokunuşla kayıt çipi. Dokununca uygulama açılmadan kuyruğa eklenir
 * (CepWidgetProvider.quickAdd); uygulama açılınca widgetQueue.ts kayda çevirir.
 */
export interface WidgetChip {
  /** Şablon anahtarı (kategori|tutar|not); kuyruk öğesi bunu taşır */
  id: string;
  /** "☕ Kahve 60 TL" */
  label: string;
  type: 'expense' | 'income';
  /** Kuruş */
  amount: number;
  categoryId: ID;
  accountId: ID;
  note?: string;
}

export interface WidgetPayload {
  /** "1.234 TL", "•••• TL" ya da "—" */
  amount: string;
  /** "Ekim sonuna kadar" / "until end of October" */
  label: string;
  /** Küçük not: "örnek veri" / "hesap ekleyince görünür" / "" */
  note: string;
  negative: boolean;
  /** Başlık: "Kullanılabilir" / "Available" */
  title: string;
  /** Düğme: "+ Ekle" / "+ Add" */
  add: string;
  /** Seçili maskot anahtarı (drawable-nodpi/widget_mascot_<anahtar>.png) */
  mascot: MascotKey;
  lang: Lang;
  updatedAt: number;
  /** Orta/büyük araç düğmeleri: "Gider" / "Gelir" */
  expense: string;
  income: string;
  /** Büyük araç: "Bugün: 120 TL" ("" = gösterme) */
  today: string;
  /** Büyük araçta canlandırma (cihaz tercihi, widgetPrefs.ts) */
  animate: boolean;
  /** Uygulamada son kaydın eklendiği an (ms; yalnız gerçek veri, yoksa 0). Araç 3 dk "Not aldım ✓" gösterir. */
  notedAt: number;
  notedText: string;
  writingText: string;
  /** Çipe dokununca kısa bildirimin başı: "Not aldım ✓" + çip etiketi */
  queuedText: string;
  /** En fazla 3; örnek veri modunda ve hesap yokken boş */
  chips: WidgetChip[];
}

const MONTHS_EN = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

/** Araca özel küçük sözlük (uygulama genelindeki çeviri altyapısından bağımsız). */
const STR = {
  tr: {
    title: 'Kullanılabilir',
    add: '+ Ekle',
    expense: 'Gider',
    income: 'Gelir',
    today: (m: string) => `Bugün: ${m}`,
    noted: 'Not aldım! ✓',
    writing: 'Yazmaya gidiyorum…',
    queued: 'Not aldım ✓',
    demo: 'örnek veri',
    noAccount: 'Hesap ekleyince görünür',
    emptyLabel: 'Kullanılabilir para',
    monthEnd: (m: MonthKey) => `${monthName(m)} sonuna kadar`,
    until: (d: ISODate) => `${dayOfMonth(d)} ${monthName(monthOf(d))} tarihine kadar`,
  },
  en: {
    title: 'Available',
    add: '+ Add',
    expense: 'Expense',
    income: 'Income',
    today: (m: string) => `Today: ${m}`,
    noted: 'Got it! ✓',
    writing: 'Off to jot it down…',
    queued: 'Got it ✓',
    demo: 'demo data',
    noAccount: 'Add an account to see it',
    emptyLabel: 'Available money',
    monthEnd: (m: MonthKey) => `until end of ${MONTHS_EN[Number(m.slice(5, 7)) - 1]}`,
    until: (d: ISODate) => `until ${dayOfMonth(d)} ${MONTHS_EN[Number(d.slice(5, 7)) - 1]}`,
  },
} as const;

export function widgetLang(data: Data): Lang {
  return data.settings.lang === 'en' ? 'en' : 'tr';
}

export function widgetMascot(data: Data): MascotKey {
  const k = data.settings.mascot?.key;
  return (MASCOT_KEYS as string[]).includes(k ?? '') ? (k as MascotKey) : DEFAULT_MASCOT;
}

export function periodLabel(data: Data, today: ISODate, periodEnd: ISODate, lang: Lang = widgetLang(data)): string {
  const s = STR[lang];
  if (data.settings.periodMode === 'month') return s.monthEnd(monthOf(today));
  return s.until(periodEnd);
}

/** Kategori simgesi → çip emojisi (ui/icons.tsx'teki adlar). */
const CHIP_EMOJI: Record<string, string> = {
  utensils: '🍽️', basket: '🛒', bus: '🚌', home: '🏠', bolt: '⚡', repeat: '🔁', phone: '📱', book: '📚', ticket: '🎟️',
  shirt: '👕', heart: '❤️', gift: '🎁', dots: '🧾', grad: '🎓', hand: '🤝', briefcase: '💼', coffee: '☕', gym: '🏋️',
  pet: '🐾', plane: '✈️', game: '🎮', music: '🎵', laptop: '💻', pill: '💊', baby: '🍼', scissors: '✂️', car: '🚗',
  fuel: '⛽', sparkles: '✨', wallet: '👛', bank: '🏦', sprout: '🌱', cash: '💵',
};

/** Sık tekrarlanan giderlerden (ui/hooks.ts frequentTemplates) en fazla 3 çip. */
export function widgetChips(data: Data, today: ISODate, lang: Lang = widgetLang(data)): WidgetChip[] {
  const hidden = data.settings.hideTotals;
  return frequentTemplates(data, 'expense', today)
    .slice(0, 3)
    .flatMap((t) => {
      const cat = data.categories.find((c) => c.id === t.categoryId);
      if (!cat) return [];
      const name = t.note || categoryName(cat, lang);
      const emoji = /kahve|coffee/i.test(name) ? '☕' : (CHIP_EMOJI[cat.icon] ?? '•');
      const label = hidden ? `${emoji} ${name}` : `${emoji} ${name} ${formatMoney(t.amount)}`;
      const chip: WidgetChip = { id: t.key, label, type: 'expense', amount: t.amount, categoryId: t.categoryId, accountId: t.accountId };
      if (t.note) chip.note = t.note;
      return [chip];
    });
}

export function widgetPayload(data: Data, today: ISODate, mode: 'real' | 'demo', now = Date.now(), opts: { animate?: boolean } = {}): WidgetPayload {
  const lang = widgetLang(data);
  const s = STR[lang];
  const demo = mode === 'demo';
  const base = {
    title: s.title,
    add: s.add,
    mascot: widgetMascot(data),
    lang,
    updatedAt: now,
    expense: s.expense,
    income: s.income,
    animate: opts.animate ?? true,
    notedAt: demo ? 0 : data.txs.reduce((m, t) => Math.max(m, t.createdAt || 0), 0),
    notedText: s.noted,
    writingText: s.writing,
    queuedText: s.queued,
  };
  const av = availability(data, today);
  if (av.confidence === 'none') {
    return { amount: '—', label: s.emptyLabel, note: demo ? s.demo : s.noAccount, negative: false, today: '', chips: [], ...base };
  }
  const hidden = data.settings.hideTotals;
  return {
    amount: hidden ? '•••• TL' : formatMoney(av.available),
    label: periodLabel(data, today, av.periodEnd, lang),
    note: demo ? s.demo : '',
    negative: !hidden && av.available < 0,
    today: s.today(hidden ? '•••• TL' : formatMoney(rangeSummary(data, today, today).spending)),
    chips: demo ? [] : widgetChips(data, today, lang),
    ...base,
  };
}
