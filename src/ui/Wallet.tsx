/**
 * Bütçe ekranında maskotun cüzdanı: kalan bütçe oranına göre dolgun (paralar taşıyor), idare eder, incelmiş
 * ya da boş (içinden güve uçar). Ay başında yine dolar. Yalnız görsel süs; durum metni ekran okuyucuya söylenir
 * ve rakamlar hemen yanında yazılıdır.
 */
import { useT } from '../i18n';

export type WalletState = 'full' | 'mid' | 'thin' | 'empty';

/** Kalan ÷ bütçe → durum. Bütçe yoksa null. */
export function walletState(remaining: number | null, budget: number | null): WalletState | null {
  if (remaining === null || budget === null || budget <= 0) return null;
  const r = remaining / budget;
  return r > 0.6 ? 'full' : r > 0.3 ? 'mid' : r > 0 ? 'thin' : 'empty';
}

// 18 × 14 piksel ızgara. b: gövde, d: koyu kenar, f: kapak, c: çıt çıt, g: banknot, y: bozuk para, m: güve
const ART: Record<WalletState, string[]> = {
  full: [
    '....gggggg........',
    '...gggggggg.yy....',
    '..gggggggggyyyy...',
    '.dddddddddddddddd.',
    'dbbbbbbbbbbbbbbbbd',
    'dbbbbbbbbbbbbbbbbd',
    'dffffffffffffffffd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbbbbd',
    'dbbbbbbbbbbbbbbbbd',
    'dbbbbbbbbbbbbbbbbd',
    '.dddddddddddddddd.',
    '..................',
  ],
  mid: [
    '..................',
    '..................',
    '.....gggggg.......',
    '.dddddddddddddddd.',
    'dbbbbbbbbbbbbbbbbd',
    'dffffffffffffffffd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbbbbd',
    'dbbbbbbbbbbbbbbbbd',
    '.dddddddddddddddd.',
    '..................',
    '..................',
    '..................',
  ],
  thin: [
    '..................',
    '..................',
    '..................',
    '..................',
    '.dddddddddddddddd.',
    'dbbbbbbbbbbbbbbbbd',
    'dffffffffffffffffd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbbbbd',
    '.dddddddddddddddd.',
    '..................',
    '..................',
    '..................',
  ],
  empty: [
    '...........m.m....',
    '............m.....',
    '..m.m......m.m....',
    '...m..............',
    '.dddddddddddddddd.',
    'dffffffffffffffffd',
    'dbbbbbbbbbbbbbccbd',
    'dbbbbbbbbbbbbbccbd',
    '.dddddddddddddddd.',
    '..................',
    '..................',
    '..................',
    '..................',
    '..................',
  ],
};

const FILL: Record<string, string> = { b: 'var(--wallet-b)', d: 'var(--wallet-d)', f: 'var(--wallet-f)', c: '#E2B65A', g: '#6FAE6B', y: '#F2C94C', m: 'var(--ink-3)' };

export function PixelWallet({ state }: { state: WalletState }) {
  const t = useT();
  const rows = ART[state];
  return (
    <span className={`wallet wallet--${state}`} role="img" aria-label={t(`wallet.${state}`)} title={t(`wallet.${state}`)}>
      <svg viewBox="0 0 18 14" width="54" height="42" shapeRendering="crispEdges" aria-hidden focusable="false">
        {rows.flatMap((row, y) => [...row].map((c, x) => (c === '.' ? null : <rect key={`${x}-${y}`} x={x} y={y} width="1" height="1" fill={FILL[c]} />)))}
      </svg>
    </span>
  );
}
