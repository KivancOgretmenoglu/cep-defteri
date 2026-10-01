import { pct } from './tr';
/**
 * Clawd'ın duygu hâli: kayıtlardan türetilen, açıklanabilir ve deterministik kurallar.
 * Aynı kayıtlar ve aynı gün → aynı duygu ve aynı gerekçe. Rastgelelik yok.
 *
 * İlkeler:
 *  - Bütçe tanımlı değilse başarı/başarısızlık yargısı yok.
 *  - Planlı ödemeler ve yatırım katkıları "kötü harcama" sayılmaz (bütçe temposundan ayrı tutulur).
 *  - Yatırım değerinin düşmesi kullanıcıya yorum olarak yansıtılmaz.
 *  - Ton yargılamayan ve destekleyicidir.
 */
import type { Data } from './types';
import { formatMoney } from './money';
import { daysInMonth, dayOfMonth, diffDays, monthOf, shortDate, type ISODate } from './dates';
import { availability, budgetStatus, goalProgress, isDaily, monthSummary, upcomingOutflows } from './ledger';

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

const tl = (k: number) => formatMoney(k);

export function clawdMood(data: Data, today: ISODate): MoodResult {
  if (!data.accounts.some(isDaily)) {
    return {
      mood: 'curious',
      text: 'Merhaba, ben Clawd! Önce paranın durduğu bir hesap ekleyelim; banka ya da nakit olabilir.',
      why: 'Henüz günlük hesap yok, yorum yapacak veri yok.',
      focus: 'accounts',
    };
  }
  if (data.txs.length === 0) {
    return {
      mood: 'curious',
      text: 'Hesabın hazır. İlk gelirini ya da harcamanı girince durumu birlikte izlemeye başlarız.',
      why: 'Henüz hiç işlem kaydı yok; bu yüzden olumlu ya da olumsuz bir yorum yapmıyorum.',
      focus: 'add',
    };
  }

  const month = monthOf(today);
  const av = availability(data, today);
  const budget = budgetStatus(data, month, today);
  const goals = data.goals.map((g) => goalProgress(data, g)).filter((g) => g !== null);

  // 1) Bekleyen ödemeler bakiyeyi aşıyor.
  // Yalnız ödemeler (ve birikim payı) bakiyeyi aşıyorsa; planlı yatırım aktarımı tek başına bu uyarıyı doğurmaz.
  if (av.dailyBalance - av.paymentsTotal - av.reserve < 0) {
    const commitments = av.paymentsTotal + av.reserve;
    return {
      mood: 'thoughtful',
      text: `${shortDate(av.periodEnd)} tarihine kadar ayrılması gereken ${tl(commitments)} var, hesaplarında ${tl(av.dailyBalance)} bulunuyor. Aradaki ${tl(commitments - av.dailyBalance)} için yaklaşan ödemelere birlikte bakalım.`,
      why: `Kural: günlük hesap bakiyesi, dönem sonuna kadarki bekleyen ödemeler${av.reserve ? ' ve birikim payı' : ''} toplamından az. Bu bir uyarı, suçlama değil.`,
      focus: 'upcoming',
    };
  }

  // 2) Yakın zamanda ulaşılan hedef.
  const fresh = goals.find((g) => g.reached && g.reachedAt && diffDays(today, g.reachedAt) <= 7);
  if (fresh) {
    return {
      mood: 'celebrate',
      text: `"${fresh.goal.title}" hedefine ulaştın: ${tl(fresh.current)} net katkı! Tebrikler.`,
      why: `Kural: bir birikim hedefi son 7 gün içinde tamamlandı (${shortDate(fresh.reachedAt!)}).`,
      focus: 'goal',
    };
  }

  // 3) Bütçe aşımı / sıkışma.
  if (budget.state === 'over' && budget.budget !== null) {
    const left = daysInMonth(month) - dayOfMonth(today);
    return {
      mood: 'thoughtful',
      text: `Bu ay harcama bütçeyi ${tl(budget.spent - budget.budget)} geçti. ${left > 0 ? `Ayın bitmesine ${left} gün var; ` : ''}gelecek ay bütçeyi gözden geçirmek iyi olabilir.`,
      why: `Kural: bu ayki tüketim harcaması (${tl(budget.spent)}) aylık bütçeden (${tl(budget.budget)}) fazla. Yatırım katkıları ve transferler sayılmaz.`,
      focus: 'budget',
    };
  }
  if (budget.state === 'tight' && budget.flexUsedPct !== null) {
    return {
      mood: 'thoughtful',
      text: `Planlı ödemeler dışındaki bütçenin ${pct(budget.flexUsedPct, 'acc')} kullandın; ayın ${pct(budget.elapsedPct, 'poss')} geçti. Kalan günlerde biraz yavaşlamak rahatlatır.`,
      why: `Kural: esnek harcama, ayın geçen kısmından 25 puandan fazla önde ya da esnek pay aşıldı. Planlı ödemeler (yurt, abonelik vb.) bu hesaba katılmaz.`,
      focus: 'budget',
    };
  }
  const over = budget.categories.filter((c) => c.level === 'over').sort((a, b) => b.used - b.limit - (a.used - a.limit))[0];
  if (over) {
    return {
      mood: 'thoughtful',
      text: `${over.category.name} için koyduğun ${tl(over.limit)} limit ${tl(over.used - over.limit)} aşıldı.`,
      why: `Kural: bir kategori, senin belirlediğin aylık limitin %100'ünü geçti.`,
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
        text: `Yaklaşan ${tl(av.paymentsTotal)} ödeme ayrılınca günde yaklaşık ${tl(av.perDay)} kalıyor; bütçen günde ${tl(typicalDaily)} öngörüyor.${up.total > 0 ? ` Önümüzdeki 7 günde ${tl(up.total)} ödeme var.` : ''}`,
        why: 'Kural: bekleyen ödemeler ayrıldıktan sonra günlük kullanılabilir pay, aylık bütçenin günlük payının yarısının altında.',
        focus: 'available',
      };
    }
  }

  // 5) İyi giden durumlar.
  const near = goals.filter((g) => !g.reached && g.pct >= 80).sort((a, b) => b.pct - a.pct)[0];
  if (near) {
    return {
      mood: 'happy',
      text: `"${near.goal.title}" hedefinin ${pct(near.pct, 'locYou')}; ${tl(near.goal.target - near.current)} kaldı.`,
      why: 'Kural: bir birikim hedefinde %80 ve üzerine ulaşıldı (net katkıya göre).',
      focus: 'goal',
    };
  }
  if (budget.state === 'on-track' && budget.flexUsedPct !== null) {
    return {
      mood: 'happy',
      text: `Bütçe yolunda: planlı ödemeler dışındaki payın ${pct(budget.flexUsedPct, 'acc')} kullandın, ayın ${pct(budget.elapsedPct, 'poss')} geçti.`,
      why: 'Kural: esnek harcama, ayın geçen kısmının en fazla 10 puan önünde.',
      focus: 'budget',
    };
  }
  if (budget.state === 'watch' && budget.flexUsedPct !== null) {
    return {
      mood: 'calm',
      text: `Esnek bütçenin ${pct(budget.flexUsedPct, 'acc')} kullandın, ayın ${pct(budget.elapsedPct, 'poss')} geçti; biraz önden gidiyorsun, sorun değil.`,
      why: 'Kural: esnek harcama, ayın geçen kısmının 10–25 puan önünde.',
      focus: 'budget',
    };
  }
  if (budget.state === 'planned-full') {
    return {
      mood: 'calm',
      text: 'Bu ayın planlı ödemeleri bütçenin tamamını kaplıyor. Bütçeyi güncellemek isteyebilirsin.',
      why: 'Kural: planlı ödemeler toplamı aylık bütçeye eşit veya fazla. Bu bir hata değil, bilgi.',
      focus: 'budget',
    };
  }

  // 6) Bütçe yoksa: yargısız, olgusal özet.
  const s = monthSummary(data, month);
  const parts = [`Bu ay ${tl(s.income)} gelir`, `${tl(s.spending)} harcama`];
  if (s.contributions) parts.push(`${tl(s.contributions)} yatırım katkısı`);
  return {
    mood: 'calm',
    text: `${parts.join(', ')} kaydettin.${budget.budget === null ? ' İstersen bir aylık bütçe belirle, gidişatı birlikte izleyelim.' : ''}`,
    why: budget.budget === null
      ? 'Bütçe tanımlı olmadığı için iyi/kötü yorumu yapmıyorum; yalnızca kayıtları özetliyorum.'
      : 'Belirgin bir durum yok; kayıtları özetliyorum.',
    focus: 'none',
  };
}
