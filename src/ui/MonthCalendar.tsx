/**
 * İşlemler ekranı takvim görünümü: ayın günleri, her günün harcaması (gelir filtresinde gelir) tek renkli
 * yoğunlukla. Güne dokununca altında o günün kayıtları açılır. Renk tek başına bilgi taşımaz: tutar hücrede
 * yazılıdır ve her hücrenin ekran okuyucu etiketi vardır.
 */
import { useMemo } from 'react';
import type { Tx } from '../domain/types';
import { dayTotals, heatLevel, monthGrid } from '../domain/calendar';
import { dayOfMonth, type ISODate, type MonthKey } from '../domain/dates';
import { useT } from '../i18n';
import { getLang } from '../i18n/lang';
import { formatMoney, shortDate } from '../i18n/format';

const WD = {
  tr: ['Pzt', 'Sal', 'Çar', 'Per', 'Cum', 'Cmt', 'Paz'],
  en: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
};

/** Hücrede kısa tutar: 1.250 TL → "1,3B" yerine tam lira; 10.000 üstü "12B" (en: "12k"). */
function short(m: number): string {
  const lira = Math.round(m / 100);
  const en = getLang() === 'en';
  if (lira >= 10000) return `${Math.round(lira / 1000)}${en ? 'k' : 'B'}`;
  return new Intl.NumberFormat(en ? 'en-US' : 'tr-TR').format(lira);
}

export function MonthCalendar({ month, txs, today, metric, selected, onSelect }: {
  month: MonthKey;
  txs: Tx[];
  today: ISODate;
  metric: 'spending' | 'income';
  selected: ISODate | null;
  onSelect: (d: ISODate | null) => void;
}) {
  const t = useT();
  const grid = useMemo(() => monthGrid(month), [month]);
  const totals = useMemo(() => dayTotals(txs), [txs]);
  const max = Math.max(0, ...[...totals.values()].map((x) => x[metric]));
  const wd = WD[getLang() === 'en' ? 'en' : 'tr'];
  return (
    <div className="mcal" role="grid" aria-label={t('cal.aria')}>
      <div className="mcal__row mcal__row--head" role="row">
        {wd.map((w) => <span key={w} className="mcal__wd" role="columnheader">{w}</span>)}
      </div>
      {grid.map((week, i) => (
        <div key={i} className="mcal__row" role="row">
          {week.map((d, j) => {
            if (!d) return <span key={j} className="mcal__cell mcal__cell--out" role="gridcell" />;
            const x = totals.get(d);
            const v = x ? x[metric] : 0;
            const lvl = heatLevel(v, max);
            const future = d > today;
            const label = `${shortDate(d)}: ${t(metric === 'income' ? 'cal.dayIncome' : 'cal.daySpend', { amount: formatMoney(Math.max(0, v)) })}, ${t('txs.count', { n: x?.count ?? 0 })}`;
            return (
              <button
                key={j}
                role="gridcell"
                className={`mcal__cell mcal__cell--l${lvl}${d === today ? ' is-today' : ''}${d === selected ? ' is-sel' : ''}${future ? ' is-future' : ''}`}
                aria-label={label}
                aria-selected={d === selected}
                disabled={future}
                onClick={() => onSelect(d === selected ? null : d)}
              >
                <span className="mcal__day">{dayOfMonth(d)}</span>
                {v > 0 ? <span className="mcal__amt">{short(v)}</span> : x ? <span className="mcal__dot" aria-hidden /> : null}
              </button>
            );
          })}
        </div>
      ))}
      <p className="mcal__legend" aria-hidden>
        <span>{t('cal.less')}</span>
        {[1, 2, 3, 4].map((l) => <i key={l} className={`mcal__sw mcal__cell--l${l}`} />)}
        <span>{t('cal.more')}</span>
      </p>
    </div>
  );
}
