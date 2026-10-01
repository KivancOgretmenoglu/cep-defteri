import { useMemo, useRef, useState } from 'react';
import { Share2 } from 'lucide-react';
import { formatMoney } from '../domain/money';
import { monthLabel, monthName, shortDate } from '../domain/dates';
import { monthReport } from '../domain/ledger';
import * as A from '../domain/actions';
import { pct } from '../domain/tr';
import { commit, showToast, useStore } from '../store/store';
import { Clawd } from '../clawd/Clawd';
import { closeSheet, go } from '../ui/nav';
import { Sheet } from '../ui/kit';
import { useData, useLookups } from '../ui/hooks';
import { shareImage } from '../platform';

/** Biten ayın kısa karnesi: yalnızca o ayın kayıtlarından; yorum bütçe tanımlıysa bütçeye göre. */
export function ReportCardSheet({ month }: { month: string }) {
  const { data, today } = useData();
  const { cats } = useLookups(data);
  const body = useStore((s) => s.data.settings.clawd.body);
  const r = useMemo(() => monthReport(data, month, today), [data, month, today]);
  const clawdRef = useRef<HTMLDivElement>(null);
  const [busy, setBusy] = useState(false);
  const s = r.summary;
  const b = r.budget;
  const within = b.budget !== null && b.spent <= b.budget;
  const mood = b.budget === null ? 'calm' : within ? 'celebrate' : 'thoughtful';

  const lines: [string, string][] = [
    ['Gelir', formatMoney(s.income)],
    ['Harcama', formatMoney(s.spending)],
    ['Gelir − harcama', formatMoney(r.net, { sign: true })],
  ];
  if (s.contributions) lines.push(['Yatırıma aktarılan', formatMoney(s.contributions)]);
  if (b.budget !== null) lines.push(['Bütçe', `${formatMoney(b.spent)} / ${formatMoney(b.budget)}`]);
  if (r.topCategory) lines.push(['En çok', `${cats.get(r.topCategory.id)?.name ?? '—'} · ${formatMoney(r.topCategory.amount)}`]);
  if (r.spendingChange !== null) lines.push(['Önceki aya göre harcama', formatMoney(r.spendingChange, { sign: true })]);
  lines.push(['Kayıt girilen gün', `${r.activeDays} gün`]);

  const comment =
    b.budget === null
      ? `${monthName(month)} ayında ${s.txCount} kayıt girdin. Bütçe koymadığın için not vermiyorum; özet burada.`
      : within
        ? `${monthName(month)} bütçenin ${formatMoney(b.budget - b.spent)} altında kapandı. Tebrikler!`
        : `${monthName(month)} bütçeyi ${formatMoney(b.spent - b.budget)} aştı. Yeni ayda birlikte bakarız.`;

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
      g.fillText('CEP DEFTERİ · AY KARNESİ', 120, 160);
      g.fillStyle = '#23201B';
      g.font = '800 84px "Bricolage Grotesque Variable", system-ui, sans-serif';
      g.fillText(monthLabel(month), 120, 260);
      // Clawd
      const svg = clawdRef.current?.querySelector('svg');
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
      wrap(g, `Clawd: ${comment}`, 120, Math.min(y + 30, H - 220), W - 240, 48);
      const blob = await new Promise<Blob>((res, rej) => c.toBlob((x) => (x ? res(x) : rej(new Error('png'))), 'image/png'));
      const r2 = await shareImage(`cep-defteri-karne-${month}.png`, blob);
      if (r2 === 'downloaded') showToast('Karne resmi indirildi');
    } catch {
      showToast('Resim oluşturulamadı.', { tone: 'error' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <Sheet
      title={`${monthLabel(month)} karnesi`}
      onClose={() => {
        commit((d) => A.updateSettings(d, { reportCardSeen: d.settings.reportCardSeen && d.settings.reportCardSeen > month ? d.settings.reportCardSeen : month }));
        closeSheet();
      }}
      footer={
        <div className="sheet-actions">
          <button className="btn btn--ghost" onClick={() => { closeSheet(); go('reports', { reportMonth: month }); }}>Raporu aç</button>
          <button className="btn btn--primary btn--grow" onClick={share} disabled={busy}><Share2 size={18} /> Resim olarak paylaş</button>
        </div>
      }
    >
      <div className="rcard">
        <div className="rcard__clawd" ref={clawdRef}>
          <Clawd mood={mood} outfit="scholar" body={body} size={140} idle={false} />
        </div>
        <p className="rcard__comment">{comment}</p>
        <dl className="kv">
          {lines.map(([k, v]) => (
            <div key={k}><dt>{k}</dt><dd>{v}</dd></div>
          ))}
        </dl>
        {b.budget !== null && b.usedPct !== null && <p className="note-line">Bütçenin {pct(b.usedPct, 'acc')} kullandın.</p>}
        {r.biggestExpense && <p className="note-line">Ayın en büyük harcaması: {r.biggestExpense.note || cats.get(r.biggestExpense.categoryId ?? '')?.name} · {formatMoney(r.biggestExpense.amount)} ({shortDate(r.biggestExpense.date)})</p>}
        <p className="note-line">Bu karne yalnızca {monthLabel(month)} kayıtlarından hazırlandı.</p>
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
