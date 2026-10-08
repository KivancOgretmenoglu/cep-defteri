/**
 * Büyük araçtaki "tek dokunuşla kayıt" çiplerinin kuyruğu. Çipe dokununca CepWidgetProvider (Java) çipin
 * şablonunu { qid, at, ... } olarak SharedPreferences'taki kuyruğa ekler; uygulama açılınca/öne gelince
 * burada okunur, kayda çevrilir (tarih = dokunulan günün yerel tarihi) ve kuyruktan silinir.
 *
 * Çift kayıt koruması: işlenen her qid bu cihazda hatırlanır (son 300); ack başarısız olsa da aynı öğe
 * ikinci kez eklenmez. Örnek veri modunda kuyruk işlenmez, gerçek moda dönülünce işlenir.
 */
import * as A from '../domain/actions';
import type { Data, ID } from '../domain/types';
import { todayISO, type ISODate } from '../domain/dates';
import { commit, getState, showToast } from '../store/store';
import { ackWidgetQueue, readWidgetQueue, updateWidget } from './widget';
import { loadSeen, saveSeen } from './widgetSeen';

export interface QueuedEntry {
  qid: string;
  /** Dokunma anı (ms) */
  at: number;
  type: 'expense' | 'income';
  amount: number;
  categoryId: ID;
  accountId: ID;
  note?: string;
  label?: string;
}

/** Ham kuyruk metni → geçerli öğeler (bozuk olanlar atlanır). */
export function parseQueue(raw: string | null | undefined): QueuedEntry[] {
  if (!raw) return [];
  let arr: unknown;
  try {
    arr = JSON.parse(raw);
  } catch {
    return [];
  }
  if (!Array.isArray(arr)) return [];
  const out: QueuedEntry[] = [];
  for (const e of arr) {
    if (!e || typeof e !== 'object') continue;
    const o = e as Record<string, unknown>;
    if (typeof o.qid !== 'string' || !o.qid) continue;
    if (o.type !== 'expense' && o.type !== 'income') continue;
    if (typeof o.amount !== 'number' || !Number.isInteger(o.amount) || o.amount <= 0) continue;
    if (typeof o.at !== 'number' || !Number.isFinite(o.at)) continue;
    if (typeof o.categoryId !== 'string' || typeof o.accountId !== 'string') continue;
    out.push({
      qid: o.qid,
      at: o.at,
      type: o.type,
      amount: o.amount,
      categoryId: o.categoryId,
      accountId: o.accountId,
      note: typeof o.note === 'string' && o.note ? o.note : undefined,
      label: typeof o.label === 'string' ? o.label : undefined,
    });
  }
  return out;
}

export interface IngestResult {
  data: Data;
  added: number;
  /** Eklenemeyenler (hesap silinmiş, tarih hesabın açılışından önce…) */
  failed: number;
  /** İşlenen (eklenen, atlanan ya da eklenemeyen) tüm qid'ler: kuyruktan silinir */
  handled: string[];
}

/** Saf: kuyruk öğelerini sırayla kayda çevirir. `seen` içindeki qid'ler atlanır (yine de handled'a girer). */
export function ingestQueue(data: Data, items: QueuedEntry[], seen: ReadonlySet<string>, today: ISODate): IngestResult {
  let d = data;
  let added = 0;
  let failed = 0;
  const handled: string[] = [];
  for (const it of [...items].sort((a, b) => a.at - b.at)) {
    handled.push(it.qid);
    if (seen.has(it.qid)) continue;
    try {
      const date = todayISO(new Date(it.at));
      const r = A.addTx(d, { type: it.type, amount: it.amount, date: date > today ? today : date, accountId: it.accountId, categoryId: it.categoryId, note: it.note }, today, it.at);
      d = r.data;
      added++;
    } catch {
      failed++;
    }
  }
  return { data: d, added, failed, handled };
}

const MSG = {
  tr: (n: number, f: number) => `Widget'tan ${n} kayıt eklendi` + (f ? ` (${f} kayıt eklenemedi)` : ''),
  en: (n: number, f: number) => `${n} ${n === 1 ? 'entry' : 'entries'} added from the widget` + (f ? ` (${f} couldn't be added)` : ''),
  failOnly: { tr: (f: number) => `Widget'taki ${f} kayıt eklenemedi`, en: (f: number) => `${f} widget ${f === 1 ? 'entry' : 'entries'} couldn't be added` },
};

let running: Promise<void> | null = null;

/** Kuyruğu işler (aynı anda tek çağrı). Uygulama açılışında ve öne gelişte çağrılır. */
export function ingestWidgetQueue(): Promise<void> {
  if (!running) running = run().finally(() => (running = null));
  return running;
}

async function run() {
  if (getState().mode !== 'real') return;
  const items = parseQueue(await readWidgetQueue());
  if (items.length === 0) return;
  const { data, today, mode } = getState();
  if (mode !== 'real') return;
  const seenList = loadSeen();
  const r = ingestQueue(data, items, new Set(seenList), today);
  saveSeen([...seenList, ...r.handled.filter((q) => !seenList.includes(q))]);
  const lang = data.settings.lang === 'en' ? 'en' : 'tr';
  if (r.added > 0) commit(() => r.data, MSG[lang](r.added, r.failed), { pulse: true });
  else if (r.failed > 0) showToast(MSG.failOnly[lang](r.failed), { tone: 'error' });
  await ackWidgetQueue(r.handled);
  // Taze payload: yeni tutar + güncel `seen` listesi (araç işlenen öğeleri artık iyimser olarak düşmez).
  const s = getState();
  await updateWidget(s.data, s.today, s.mode, true);
}
