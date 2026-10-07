import { pct, type PctForm } from './tr';
/**
 * Clawd'ın duygu hâli: kayıtlardan türetilen, açıklanabilir ve deterministik kurallar.
 * Aynı kayıtlar ve aynı gün → aynı duygu ve aynı gerekçe. Rastgelelik yok.
 *
 * İlkeler:
 *  - Bütçe tanımlı değilse başarı/başarısızlık yargısı yok.
 *  - Planlı ödemeler ve yatırım katkıları "kötü harcama" sayılmaz (bütçe temposundan ayrı tutulur).
 *  - Yatırım değerinin düşmesi kullanıcıya yorum olarak yansıtılmaz.
 *  - Ton yargılamayan ve destekleyicidir.
 *
 * Metinler src/i18n sözlüklerindedir (mood.*); dil `lang` ile verilir (varsayılan Türkçe).
 */
import type { Data, Lang } from './types';
import { formatMoney, hiddenMoney } from './money';
import { daysInMonth, dayOfMonth, diffDays, monthOf, shortDate, type ISODate } from './dates';
import { availability, budgetStatus, goalProgress, isDaily, monthSummary, upcomingOutflows } from './ledger';
import { categoryName } from './defaults';
import { translator } from '../i18n/core';

export type Mood = 'curious' | 'calm' | 'happy' | 'thoughtful' | 'celebrate';
export type MoodFocus = 'accounts' | 'add' | 'available' | 'upcoming' | 'budget' | 'goal' | 'none';

export interface MoodResult {
  mood: Mood;
  /** Kısa durum notu. */
  text: string;
  /** "Neden böyle?" açıklaması: hangi kural, hangi sayılar. */
  why: string;
  focus: MoodFocus;
}

export function clawdMood(data: Data, today: ISODate, lang: Lang = 'tr'): MoodResult {
  const t = translator(lang);
  const tl = (k: number) => formatMoney(k, { lang });
  const sd = (d: ISODate) => shortDate(d, undefined, lang);
  /** Yüzde: Türkçede ekli ("%55'i"), İngilizcede "55%". */
  const p = (n: number, form: PctForm) => (lang === 'tr' ? pct(n, form) : `${n}%`);

  if (!data.accounts.some(isDaily)) {
    return { mood: 'curious', text: t('mood.noAccount.text'), why: t('mood.noAccount.why'), focus: 'accounts' };
  }
  if (data.txs.length === 0) {
    return { mood: 'curious', text: t('mood.noTx.text'), why: t('mood.noTx.why'), focus: 'add' };
  }

  const month = monthOf(today);
  const av = availability(data, today);
  // Bakiye gizliyken toplam bakiyeden türeyen tutarlar notta da gizlenir.
  const tlb = (k: number) => (data.settings.hideTotals ? hiddenMoney(lang) : tl(k));
  const budget = budgetStatus(data, month, today);
  const goals = data.goals.map((g) => goalProgress(data, g)).filter((g) => g !== null);

  // 1) Bekleyen ödemeler bakiyeyi aşıyor.
  // Yalnız ödemeler (ve birikim payı) bakiyeyi aşıyorsa; planlı yatırım aktarımı tek başına bu uyarıyı doğurmaz.
  if (av.dailyBalance - av.paymentsTotal - av.reserve - av.debtsOwed < 0) {
    const commitments = av.paymentsTotal + av.reserve + av.debtsOwed;
    return {
      mood: 'thoughtful',
      text: t('mood.short.text', { date: sd(av.periodEnd), need: tl(commitments), have: tlb(av.dailyBalance), gap: tlb(commitments - av.dailyBalance) }),
      why: t('mood.short.why', { extra: (av.reserve ? t('mood.short.whyReserve') : '') + (av.debtsOwed ? t('mood.short.whyDebts') : '') }),
      focus: 'upcoming',
    };
  }

  // 2) Yakın zamanda ulaşılan hedef.
  const fresh = goals.find((g) => g.reached && g.reachedAt && diffDays(today, g.reachedAt) <= 7);
  if (fresh) {
    return {
      mood: 'celebrate',
      text: t('mood.goalReached.text', { goal: fresh.goal.title, amount: tl(fresh.current) }),
      why: t('mood.goalReached.why', { date: sd(fresh.reachedAt!) }),
      focus: 'goal',
    };
  }

  // 3) Bütçe aşımı / sıkışma.
  if (budget.state === 'over' && budget.budget !== null) {
    const left = daysInMonth(month) - dayOfMonth(today);
    return {
      mood: 'thoughtful',
      text: t('mood.over.text', { amount: tl(budget.spent - budget.budget), left: left > 0 ? t('mood.over.daysLeft', { n: left }) : '' }),
      why: t('mood.over.why', { spent: tl(budget.spent), budget: tl(budget.budget) }),
      focus: 'budget',
    };
  }
  if (budget.state === 'tight' && budget.flexUsedPct !== null) {
    return {
      mood: 'thoughtful',
      text: t('mood.tight.text', { used: p(budget.flexUsedPct, 'acc'), elapsed: p(budget.elapsedPct, 'poss') }),
      why: t('mood.tight.why'),
      focus: 'budget',
    };
  }
  const over = budget.categories.filter((c) => c.level === 'over').sort((a, b) => b.used - b.limit - (a.used - a.limit))[0];
  if (over) {
    return {
      mood: 'thoughtful',
      text: t('mood.catOver.text', { cat: categoryName(over.category, lang), limit: tl(over.limit), amount: tl(over.used - over.limit) }),
      why: t('mood.catOver.why'),
      focus: 'budget',
    };
  }

  // 4) Yaklaşan ödemeler ayrılınca kullanılabilir para daralıyor (bütçe tanımlıysa ölçülebilir).
  //    Yalnız bekleyen ödeme varsa tetiklenir; yapılmış yatırım katkısı tek başına bu uyarıyı doğurmaz.
  if (budget.budget !== null && av.paymentsTotal > 0) {
    const typicalDaily = Math.floor(budget.budget / daysInMonth(month));
    if (av.perDay < typicalDaily / 2) {
      const up = upcomingOutflows(data, today, 7);
      return {
        mood: 'thoughtful',
        text: t('mood.squeeze.text', { payments: tl(av.paymentsTotal), perDay: tlb(av.perDay), typical: tl(typicalDaily) }) + (up.total > 0 ? t('mood.squeeze.next7', { amount: tl(up.total) }) : ''),
        why: t('mood.squeeze.why'),
        focus: 'available',
      };
    }
  }

  // 5) İyi giden durumlar.
  const near = goals.filter((g) => !g.reached && g.pct >= 80).sort((a, b) => b.pct - a.pct)[0];
  if (near) {
    return {
      mood: 'happy',
      text: t('mood.near.text', { goal: near.goal.title, pct: p(near.pct, 'locYou'), left: tl(near.goal.target - near.current) }),
      why: t('mood.near.why'),
      focus: 'goal',
    };
  }
  if (budget.state === 'on-track' && budget.flexUsedPct !== null) {
    return {
      mood: 'happy',
      text: t('mood.onTrack.text', { used: p(budget.flexUsedPct, 'acc'), elapsed: p(budget.elapsedPct, 'poss') }),
      why: t('mood.onTrack.why'),
      focus: 'budget',
    };
  }
  if (budget.state === 'watch' && budget.flexUsedPct !== null) {
    return {
      mood: 'calm',
      text: t('mood.watch.text', { used: p(budget.flexUsedPct, 'acc'), elapsed: p(budget.elapsedPct, 'poss') }),
      why: t('mood.watch.why'),
      focus: 'budget',
    };
  }
  if (budget.state === 'planned-full') {
    return { mood: 'calm', text: t('mood.plannedFull.text'), why: t('mood.plannedFull.why'), focus: 'budget' };
  }

  // 6) Bütçe yoksa: yargısız, olgusal özet.
  const s = monthSummary(data, month);
  const parts = [t('mood.summary.income', { amount: tl(s.income) }), t('mood.summary.spending', { amount: tl(s.spending) })];
  if (s.contributions) parts.push(t('mood.summary.contrib', { amount: tl(s.contributions) }));
  return {
    mood: 'calm',
    text: t('mood.summary.text', { parts: parts.join(', ') }) + (budget.budget === null ? t('mood.summary.noBudget') : ''),
    why: budget.budget === null ? t('mood.summary.whyNoBudget') : t('mood.summary.why'),
    focus: 'none',
  };
}
