import { useMemo, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { catName, formatMoney, monthLabel, monthName, pctForm, shortDate } from '../i18n/format';
import { useT } from '../i18n';
import { monthReport } from '../domain/ledger';
import * as A from '../domain/actions';
import { commit, showToast } from '../store/store';
import { Mascot } from '../mascot/Mascot';
import { useMascot } from '../mascot/MascotNote';
import { closeSheet, go } from '../ui/nav';
import { Sheet } from '../ui/kit';
import { useData, useLookups } from '../ui/hooks';
import { shareImage } from '../platform';

/** Biten ayın kısa karnesi: yalnızca o ayın kayıtlarından; yorum bütçe tanımlıysa bütçeye göre. */
export function ReportCardSheet({ month }: { month: string }) {
  const t = useT();
  const { data, today } = useData();
  const { cats } = useLookups(data);
  const m = useMascot();
  const r = useMemo(() => monthReport(data, month, today), [data, month, today]);
  const mascotRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const s = r.summary;
  const b = r.budget;
  const within = b.budget !== null && b.spent <= b.budget;
  const mood = b.budget === null ? 'calm' : within ? 'celebrate' : 'thoughtful';

  const lines: [string, string][] = [
    [t('tx.income'), formatMoney(s.income)],
    [t('txs.spending'), formatMoney(s.spending)],
    [t('rep.net'), formatMoney(r.net, { sign: true })],
  ];
  if (s.contributions) lines.push([t('home.statInvest'), formatMoney(s.contributions)]);
  if (b.budget !== null) lines.push([t('nav.budget'), `${formatMoney(b.spent)} / ${formatMoney(b.budget)}`]);
  if (r.topCategory) lines.push([t('rc.top'), `${cats.get(r.topCategory.id) ? catName(cats.get(r.topCategory.id)) : '—'} · ${formatMoney(r.topCategory.amount)}`]);
  if (r.spendingChange !== null) lines.push([t('rc.vsPrev'), formatMoney(r.spendingChange, { sign: true })]);
  lines.push([t('rc.activeDays'), t('common.days', { n: r.activeDays })]);

  const comment =
    b.budget === null
      ? t('rc.noBudget', { month: monthName(month), n: s.txCount })
      : within
        ? t('rc.within', { month: monthName(month), amount: formatMoney(b.budget - b.spent) })
        : t('rc.over', { month: monthName(month), amount: formatMoney(b.spent - b.budget) });

  async function share() {
    setBusy(true);
    try {
      const W = 1080, H = 1350;
      const c = document.createElement('canvas');
      c.width = W;
      c.height = H;
      const g = c.getContext('2d')!;
      g.fillStyle = '#F4EFE6';
      g.fillRect(0, 0, W, H);
      g.fillStyle = '#FFFDF8';
      g.beginPath();
      g.roundRect(60, 60, W - 120, H - 120, 40);
      g.fill();
      g.fillStyle = '#7D7567';
      g.font = '700 34px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
      g.fillText(t('rc.imageHeader'), 120, 160);
      g.fillStyle = '#23201B';
      g.font = '800 84px "Bricolage Grotesque Variable", system-ui, sans-serif';
      g.fillText(monthLabel(month), 120, 260);
      // Maskot
      const svg = mascotRef.current?.querySelector('svg');
      if (svg) {
        const xml = new XMLSerializer().serializeToString(svg);
        const img = new Image();
        img.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(xml);
        await img.decode();
        g.imageSmoothingEnabled = false;
        g.drawImage(img, W - 120 - 300, 140, 300, 244);
      }
      let y = 430;
      g.font = '600 40px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
      for (const [k, v] of lines) {
        g.fillStyle = '#5B5448';
        g.textAlign = 'left';
        g.fillText(k, 120, y);
        g.fillStyle = '#23201B';
        g.font = '800 42px "Bricolage Grotesque Variable", system-ui, sans-serif';
        g.textAlign = 'right';
        g.fillText(v, W - 120, y);
        g.font = '600 40px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
        g.strokeStyle = '#E2D9C8';
        g.setLineDash([10, 10]);
        g.beginPath();
        g.moveTo(120, y + 28);
        g.lineTo(W - 120, y + 28);
        g.stroke();
        y += 92;
      }
      g.setLineDash([]);
      g.textAlign = 'left';
      g.fillStyle = '#C4542F';
      g.font = '700 36px "Atkinson Hyperlegible Next Variable", system-ui, sans-serif';
      wrap(g, `${m.name}: ${comment}`, 120, Math.min(y + 30, H - 220), W - 240, 48);
      const blob = await new Promise<Blob>((res, rej) => c.toBlob((x) => (x ? res(x) : rej(new Error('png'))), 'image/png'));
      const r2 = await shareImage(`cep-defteri-karne-${month}.png`, blob);
      if (r2 === 'downloaded') showToast(t('rc.downloaded'));
    } catch {
      showToast(t('rc.imageFailed'), { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={t('rep.cardTitle', { month: monthLabel(month) })}
      onClose={() => {
        commit((d) => A.updateSettings(d, { reportCardSeen: d.settings.reportCardSeen && d.settings.reportCardSeen > month ? d.settings.reportCardSeen : month }));
        closeSheet();
      }}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={() => { closeSheet(); go('reports', { reportMonth: month }); }}>{t('rc.openReport')}</button>
          <button className="btn btn--primary btn--grow" onClick={share} disabled={busy}><Share2 size={18} /> {t('rc.share')}</button>
        </div>
      }
    >
      <div className="rcard">
        <div className="rcard__mascot" ref={mascotRef}>
          <Mascot who={m.who} mood={mood} outfit="scholar" size={140} idle={false} lang={m.lang} name={m.name} />
        </div>
        <p className="rcard__comment">{comment}</p>
        <dl className="kv">
          {lines.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {b.budget !== null && b.usedPct !== null && <p className="note-line">{t('rc.usedPct', { pct: pctForm(b.usedPct, 'acc') })}</p>}
        {r.biggestExpense && <p className="note-line">{t('rc.biggest')} {r.biggestExpense.note || catName(cats.get(r.biggestExpense.categoryId ?? ''))} · {formatMoney(r.biggestExpense.amount)} ({shortDate(r.biggestExpense.date)})</p>}
        <p className="note-line">{t('rc.basis', { month: monthLabel(month) })}</p>
      </div>
    </Sheet>
  );
}

function wrap(g: CanvasRenderingContext2D, text: string, x: number, y: number, max: number, lh: number) {
  const words = text.split(' ');
  let line = '';
  for (const w of words) {
    const t = line ? line + ' ' + w : w;
    if (g.measureText(t).width > max && line) {
      g.fillText(line, x, y);
      line = w;
      y += lh;
    } else line = t;
  }
  if (line) g.fillText(line, x, y);
}
