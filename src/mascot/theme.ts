/**
 * Seçili maskotun renk temasını uygular: vurgu, yumuşak ton, çizgi ve kâğıt zemin (açık/koyu).
 * Anlam taşıyan renkler (gelir yeşili, yatırım, uyarı) değişmez; raporların okunuşu karakterle değişmesin.
 */
import { useEffect } from 'react';
import { useStore } from '../store/store';
import { characterOf } from './characters';

const DARK_PAPER = '#1C1A17';

export function useMascotTheme() {
  const key = useStore((s) => s.data.settings.mascot?.key);
  const pref = useStore((s) => s.data.settings.theme);
  useEffect(() => {
    const p = characterOf(key).palette;
    const mq = window.matchMedia?.('(prefers-color-scheme: dark)');
    const apply = () => {
      const dark = pref === 'dark' || (pref === 'system' && !!mq?.matches);
      const root = document.documentElement.style;
      root.setProperty('--accent', dark ? p.darkAccent : p.accent);
      root.setProperty('--accent-ink', dark ? DARK_PAPER : '#FFFFFF');
      root.setProperty('--accent-soft', dark ? p.darkSoft : p.soft);
      root.setProperty('--accent-line', dark ? p.darkLine : p.line);
      if (dark) root.removeProperty('--paper');
      else root.setProperty('--paper', p.paper);
      document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? DARK_PAPER : p.paper);
    };
    apply();
    mq?.addEventListener?.('change', apply);
    return () => mq?.removeEventListener?.('change', apply);
  }, [key, pref]);
}
