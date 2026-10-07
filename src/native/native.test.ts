import { describe, expect, it } from 'vitest';
import { emptyData } from '../domain/defaults';
import * as A from '../domain/actions';
import type { Data } from '../domain/types';
import { DEFAULT_DEVICE, type NotificationPrefs } from '../store/device';
import { computeSchedule, localAt, MAX_NOTIFICATIONS, NOTIF_ID_BASE, updateSent, LATE_DELAY_MS } from './schedule';
import { autoBackupName, backupNudgeDue, filesToDelete, fitSnapshots, nextSnapshots, parseAutoBackupName, sortAutoBackups, type WebSnapshot } from './backupPlan';
import { widgetPayload } from './widgetPayload';

const TODAY = '2026-10-15';
const TL = (n: number) => Math.round(n * 100);
const PREFS: NotificationPrefs = { ...DEFAULT_DEVICE.notifications, enabled: true, dailyReminder: false };

function setup() {
  let d = emptyData();
  const bank = A.addAccount(d, { name: 'Banka', kind: 'bank', openingBalance: TL(10000), openingDate: '2026-09-01' }, 1000);
  d = bank.data;
  const inv = A.addAccount(d, { name: 'Yatırım', kind: 'investment', openingBalance: 0, openingDate: '2026-09-01' }, 1000);
  d = inv.data;
  return { d, bank: bank.account.id, inv: inv.account.id };
}
function withPlans() {
  const s = setup();
  let d = s.d;
  const rent = A.addPlan(d, { kind: 'expense', title: 'Yurt ödemesi', amount: TL(4500), accountId: s.bank, categoryId: 'e-housing', freq: 'monthly', startDate: '2026-10-20' });
  d = rent.data;
  const burs = A.addPlan(d, { kind: 'income', title: 'Burs', amount: TL(3000), accountId: s.bank, categoryId: 'i-scholarship', freq: 'monthly', startDate: '2026-10-25' });
  d = burs.data;
  const bes = A.addPlan(d, { kind: 'transfer', title: 'BES', amount: TL(1000), accountId: s.bank, toAccountId: s.inv, freq: 'once', startDate: '2026-10-18' });
  d = bes.data;
  return { ...s, d, rent: rent.plan.id, burs: burs.plan.id, bes: bes.plan.id };
}

describe('bildirim planı', () => {
  const now = localAt(TODAY, 9);

  it('kapalıyken hiçbir şey planlamaz', () => {
    const { d } = withPlans();
    expect(computeSchedule(d, TODAY, { ...PREFS, enabled: false }, now)).toEqual([]);
  });

  it('ödemeyi bir gün önce 10:00’da, geliri o gün 12:00’de planlar', () => {
    const { d, rent, burs, bes } = withPlans();
    const s = computeSchedule(d, TODAY, PREFS, now);
    const pay = s.find((n) => n.key === `pay|${rent}|2026-10-20`)!;
    expect(pay.at).toEqual(localAt('2026-10-19', 10));
    expect(pay.title).toBe('Yarın: Yurt ödemesi 4.500 TL');
    expect(pay.extra).toEqual({ open: 'confirm', planId: rent, due: '2026-10-20' });
    const inc = s.find((n) => n.key === `inc|${burs}|2026-10-25`)!;
    expect(inc.at).toEqual(localAt('2026-10-25', 12));
    expect(inc.title).toBe('Burs geldi mi?');
    expect(inc.body).toContain('Gelince kaydet');
    // Planlı yatırım aktarımı da çıkıştır.
    expect(s.find((n) => n.key === `pay|${bes}|2026-10-18`)?.title).toBe('Yarın: BES 1.000 TL');
    // 30 günlük ufuk (15 Ekim → 14 Kasım): Kasım 20 ödemesi yok; 25 Ekim'den bakınca var.
    expect(s.some((n) => n.key === `pay|${rent}|2026-11-20`)).toBe(false);
    const later = computeSchedule(d, '2026-10-25', PREFS, localAt('2026-10-25', 9));
    expect(later.some((n) => n.key === `pay|${rent}|2026-11-20`)).toBe(true);
    expect(later.some((n) => n.key.includes('2026-12-20'))).toBe(false);
    // Kimlikler sıralı ve zamana göre artan.
    expect(s.map((n) => n.id)).toEqual(s.map((_, i) => NOTIF_ID_BASE + i));
    for (let i = 1; i < s.length; i++) expect(s[i].at.getTime()).toBeGreaterThanOrEqual(s[i - 1].at.getTime());
  });

  it('gerçekleşen, atlanan ve gecikmiş vadeleri bildirmez', () => {
    let { d, rent, bes } = withPlans();
    d = A.confirmOccurrence(d, rent, '2026-10-20', {}, TODAY).data;
    d = A.skipOccurrence(d, bes, '2026-10-18');
    const s = computeSchedule(d, '2026-10-15', PREFS, now);
    expect(s.some((n) => n.key === `pay|${rent}|2026-10-20`)).toBe(false);
    expect(s.some((n) => n.key.startsWith(`pay|${bes}`))).toBe(false);
    // Gecikmiş (vadesi geçmiş) kalem: 26 Ekim'den bakınca 25 Ekim bursu bildirilmez.
    const later = computeSchedule(d, '2026-10-26', PREFS, localAt('2026-10-26', 9));
    expect(later.some((n) => n.key.includes('2026-10-25'))).toBe(false);
  });

  it('saati geçmiş ama vadesi gelmemiş kalemi bir kez, hemen bildirir', () => {
    const { d, rent } = withPlans();
    const t = localAt('2026-10-19', 15); // hatırlatma saati (10:00) geçti, ödeme yarın
    const s = computeSchedule(d, '2026-10-19', PREFS, t);
    const late = s.find((n) => n.key === `pay|${rent}|2026-10-20`)!;
    expect(late.late).toBe(true);
    expect(late.at.getTime()).toBe(t.getTime() + LATE_DELAY_MS);
    expect(late.title.startsWith('Yarın:')).toBe(true);
    // Gönderildi olarak kaydedilince, saat geçtikten sonra tekrar planlanmaz.
    const sent = updateSent({}, s, t.getTime());
    const again = computeSchedule(d, '2026-10-19', PREFS, new Date(t.getTime() + 5 * 60_000), sent);
    expect(again.some((n) => n.key === `pay|${rent}|2026-10-20`)).toBe(false);
    // Vadesi bugün olan, hiç bildirilmemiş ödeme: "Bugün:"
    const today = computeSchedule(d, '2026-10-20', PREFS, localAt('2026-10-20', 8));
    expect(today.find((n) => n.key === `pay|${rent}|2026-10-20`)?.title).toBe('Bugün: Yurt ödemesi 4.500 TL');
  });

  it('günlük hatırlatma: 14 gün, kayıt olan günü ve geçmiş saati atlar', () => {
    const { d, bank } = setup();
    const prefs = { ...PREFS, payments: false, income: false, dailyReminder: true, reminderHour: 21 };
    const s = computeSchedule(d, TODAY, prefs, localAt(TODAY, 9));
    expect(s).toHaveLength(14);
    expect(s[0].at).toEqual(localAt(TODAY, 21));
    expect(s[0].extra).toEqual({ open: 'add' });
    expect(s[0].title).toBe('Bugünkü harcamalarını girdin mi?');
    const withTx = A.addTx(d, { type: 'expense', amount: TL(50), date: TODAY, accountId: bank, categoryId: 'e-food' }, TODAY).data;
    const s2 = computeSchedule(withTx, TODAY, prefs, localAt(TODAY, 9));
    expect(s2).toHaveLength(13);
    expect(s2[0].key).toBe('rem|2026-10-16');
    // Saat geçtiyse bugün yok.
    expect(computeSchedule(d, TODAY, prefs, localAt(TODAY, 22))[0].key).toBe('rem|2026-10-16');
  });

  it('sınav haftasında günlük hatırlatma susar, ödeme hatırlatması sürer', () => {
    const { d } = withPlans();
    const exam = A.updateSettings(d, { examUntil: '2026-10-21' });
    const s = computeSchedule(exam, TODAY, { ...PREFS, dailyReminder: true, reminderHour: 21 }, localAt(TODAY, 9));
    const rem = s.filter((n) => n.key.startsWith('rem|'));
    expect(rem[0].key).toBe('rem|2026-10-22');
    expect(s.some((n) => n.key.startsWith('pay|'))).toBe(true);
  });

  it('en fazla 60 bildirim', () => {
    let { d, bank } = setup();
    for (let i = 0; i < 10; i++) d = A.addPlan(d, { kind: 'expense', title: `Haftalık ${i}`, amount: TL(10), accountId: bank, categoryId: 'e-food', freq: 'weekly', startDate: '2026-10-16' }).data;
    const s = computeSchedule(d, TODAY, { ...PREFS, dailyReminder: true }, localAt(TODAY, 9));
    expect(s).toHaveLength(MAX_NOTIFICATIONS);
    expect(s[s.length - 1].id).toBe(NOTIF_ID_BASE + MAX_NOTIFICATIONS - 1);
  });

  it('gönderim kaydı 40 günden eskileri atar', () => {
    const nowMs = localAt(TODAY, 9).getTime();
    const out = updateSent({ old: nowMs - 41 * 86_400_000, recent: nowMs - 86_400_000 }, [], nowMs);
    expect(out).toEqual({ recent: nowMs - 86_400_000 });
  });
});

describe('otomatik yedek', () => {
  it('dosya adlarını üretir ve tanır', () => {
    expect(autoBackupName('2026-10-01')).toBe('cep-defteri-otomatik-2026-10-01.json');
    expect(autoBackupName('2026-10-01', 2)).toBe('cep-defteri-otomatik-2026-10-01-2.json');
    expect(parseAutoBackupName('cep-defteri-otomatik-2026-10-01-2.json')).toEqual({ day: '2026-10-01', suffix: 2 });
    expect(parseAutoBackupName('cep-defteri-yedek-2026-10-01.json')).toBeNull();
    expect(parseAutoBackupName('notlar.txt')).toBeNull();
  });

  it('en yeni 7 günü tutar, diğer dosyalara dokunmaz', () => {
    const days = Array.from({ length: 10 }, (_, i) => `2026-09-${String(20 + i).padStart(2, '0')}`);
    const names = [...days.map((d) => autoBackupName(d)), autoBackupName('2026-09-29', 2), 'baska-dosya.json'];
    const del = filesToDelete(names, 7);
    expect(del.sort()).toEqual([autoBackupName('2026-09-20'), autoBackupName('2026-09-21'), autoBackupName('2026-09-22')].sort());
    expect(sortAutoBackups(names)[0]).toBe(autoBackupName('2026-09-29', 2));
    expect(filesToDelete(names.slice(0, 3), 7)).toEqual([]);
  });

  it('tarayıcı kopyaları: aynı gün yenilenir, en yeni 5 gün kalır, depo sınırına uyar', () => {
    let xs: WebSnapshot[] = [];
    for (let i = 1; i <= 7; i++) xs = nextSnapshots(xs, { day: `2026-10-0${i}`, at: i, json: 'x' });
    expect(xs.map((s) => s.day)).toEqual(['2026-10-07', '2026-10-06', '2026-10-05', '2026-10-04', '2026-10-03']);
    xs = nextSnapshots(xs, { day: '2026-10-07', at: 99, json: 'y' });
    expect(xs).toHaveLength(5);
    expect(xs[0]).toEqual({ day: '2026-10-07', at: 99, json: 'y' });
    const big = xs.map((s) => ({ ...s, json: 'z'.repeat(1000) }));
    const fitted = fitSnapshots(big, 0, 2500)!;
    expect(fitted.length).toBe(2);
    expect(fitted[0].day).toBe('2026-10-07');
    expect(fitSnapshots(big, 5000, 2500)).toBeNull();
  });

  it('14 gündür elle yedek yoksa hatırlatır', () => {
    const day = 86_400_000;
    const { d } = setup(); // hesaplar createdAt = 1000
    expect(backupNudgeDue(emptyData(), 20 * day)).toBe(false);
    expect(backupNudgeDue(d, 1000 + 13 * day)).toBe(false);
    expect(backupNudgeDue(d, 1000 + 14 * day)).toBe(true);
    const backed: Data = A.updateSettings(d, { lastBackupAt: 10 * day });
    expect(backupNudgeDue(backed, 20 * day)).toBe(false);
    expect(backupNudgeDue(backed, 24 * day)).toBe(true);
  });
});

describe('ana ekran aracı', () => {
  it('kullanılabilir tutarı ve dönem etiketini verir', () => {
    const { d } = withPlans();
    const p = widgetPayload(d, TODAY, 'real', 1);
    // 10.000 − 4.500 yurt − 1.000 BES = 4.500
    expect(p.amount).toBe('4.500 TL');
    expect(p.label).toBe('Ekim sonuna kadar');
    expect(p.note).toBe('');
    expect(p.negative).toBe(false);
  });
  it('gizli tutar, örnek veri ve 30 günlük dönem', () => {
    const { d } = withPlans();
    const hidden = widgetPayload(A.updateSettings(d, { hideTotals: true }), TODAY, 'demo');
    expect(hidden.amount).toBe('•••• TL');
    expect(hidden.note).toBe('örnek veri');
    expect(widgetPayload(A.updateSettings(d, { periodMode: 'days30' }), TODAY, 'real').label).toBe('13 Kasım tarihine kadar');
    expect(widgetPayload(emptyData(), TODAY, 'real').amount).toBe('—');
  });
});
