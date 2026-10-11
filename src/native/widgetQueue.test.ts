import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/defaults';
import * as A from '../domain/actions';
import type { Data } from '../domain/types';
import { ingestQueue, parseQueue, type QueuedEntry } from './widgetQueue';
import { widgetChips, widgetPayload } from './widgetPayload';
import { parseDeepLink } from './useNativeSync';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);

function withBank(): { data: Data; bank: string } {
  const r = A.addAccount(emptyData(), { name: 'Banka', kind: 'bank', openingBalance: TL(2500), openingDate: '2026-09-01' }, 1000);
  return { data: r.data, bank: r.account.id };
}
const at = (iso: string, h = 12) => new Date(`${iso}T${String(h).padStart(2, '0')}:00:00`).getTime();
const entry = (qid: string, bank: string, iso = TODAY): QueuedEntry => ({ qid, at: at(iso), type: 'expense', amount: TL(60), categoryId: 'e-food', accountId: bank, note: 'Kahve' });

describe('araç derin bağlantısı', () => {
  it('://add ve ?type', () => {
    expect(parseDeepLink('io.github.kivancogretmenoglu.cepdefteri://add')).toEqual({});
    expect(parseDeepLink('io.github.kivancogretmenoglu.cepdefteri://add?type=expense')).toEqual({ type: 'expense' });
    expect(parseDeepLink('io.github.kivancogretmenoglu.cepdefteri://add/?type=income')).toEqual({ type: 'income' });
    expect(parseDeepLink('io.github.kivancogretmenoglu.cepdefteri://add?type=transfer')).toEqual({});
    expect(parseDeepLink('io.github.kivancogretmenoglu.cepdefteri://other')).toBeNull();
    expect(parseDeepLink('https://example.com/add')).toBeNull();
    expect(parseDeepLink(undefined)).toBeNull();
  });
});

describe('araç kuyruğu', () => {
  it('bozuk öğeleri atlar', () => {
    const raw = JSON.stringify([{ qid: 'a', at: 1, type: 'expense', amount: 6000, categoryId: 'c', accountId: 'x' }, { qid: 'b', type: 'transfer' }, 3, null, { qid: 'c', at: 1, type: 'income', amount: 1.5, categoryId: 'c', accountId: 'x' }]);
    expect(parseQueue(raw).map((e) => e.qid)).toEqual(['a']);
    expect(parseQueue('nope')).toEqual([]);
    expect(parseQueue(null)).toEqual([]);
  });

  it('kayıtları dokunulan güne ekler, görülmüşleri atlar, eklenemeyeni sayar', () => {
    const { data, bank } = withBank();
    const items = [entry('q1', bank, '2026-10-14'), entry('q2', bank), entry('q0', bank), { ...entry('q3', bank), accountId: 'yok' }];
    const r = ingestQueue(data, items, new Set(['q0']), TODAY);
    expect(r.added).toBe(2);
    expect(r.failed).toBe(1);
    expect(r.handled.sort()).toEqual(['q0', 'q1', 'q2', 'q3']);
    const added = r.data.txs.slice(-2);
    expect(added.map((t) => t.date)).toEqual(['2026-10-14', TODAY]);
    expect(added[0]).toMatchObject({ type: 'expense', amount: TL(60), categoryId: 'e-food', accountId: bank, note: 'Kahve' });
    // Aynı kuyruk ikinci kez: hepsi görülmüş → değişiklik yok
    const again = ingestQueue(r.data, items, new Set(r.handled), TODAY);
    expect(again.added).toBe(0);
    expect(again.data).toBe(r.data);
  });
});

describe('araç çipleri', () => {
  it('sık giderlerden çip üretir; örnek veride çip yok', () => {
    let { data, bank } = withBank();
    for (const d of ['2026-10-10', '2026-10-11', '2026-10-12']) data = A.addTx(data, { type: 'expense', amount: TL(60), date: d, accountId: bank, categoryId: 'e-food', note: 'Kahve' }, TODAY).data;
    const chips = widgetChips(data, TODAY);
    expect(chips).toHaveLength(1);
    expect(chips[0]).toMatchObject({ label: '☕ Kahve 60 TL', type: 'expense', amount: TL(60), accountId: bank, categoryId: 'e-food', note: 'Kahve' });
    const p = widgetPayload(data, TODAY, 'real', 1, { animate: false });
    expect(p).toMatchObject({ animate: false, expense: 'Gider', income: 'Gelir', today: 'Bugün: 0 TL' });
    expect(p.chips).toHaveLength(1);
    expect(p.notedAt).toBeGreaterThan(0);
    const demo = widgetPayload(data, TODAY, 'demo', 1);
    expect(demo.chips).toEqual([]);
    expect(demo.notedAt).toBe(0);
  });
});
