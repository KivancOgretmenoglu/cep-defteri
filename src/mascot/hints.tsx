/**
 * Maskotun tek seferlik bağlamsal ipuçları. Her anahtar en fazla bir kez gösterilir (settings.hintsSeen),
 * oturumda dakikada birden fazla ipucu çıkmaz; sayfa açıkken ya da ilk kurulumda hiç görünmez.
 */
import { useEffect, useState } from 'react';
import { X } from 'lucide-react';
import * as A from '../domain/actions';
import { commit, useStore } from '../store/store';
import { useNav } from '../ui/nav';
import { useT } from '../i18n';
import type { Key } from '../i18n/core';
import { Mascot } from './Mascot';
import { useMascot } from './MascotNote';
import './hints.css';

const GAP = 60_000;
/** Şu an gösterilen ipucu ve en son ne zaman gösterildiği (oturum boyunca bellekte). */
let active: string | null = null;
let lastAt = 0;

/** Anahtar için ipucu gösterilmeli mi? Koşul sağlanıp sıra gelince `show` olur; `dismiss` kalıcı olarak kapatır. */
export function useHint(key: string, condition: boolean) {
  const seen = useStore((s) => s.data.settings.hintsSeen?.includes(key) ?? false);
  const noAccounts = useStore((s) => s.data.accounts.length === 0);
  const { sheet } = useNav();
  const [, tick] = useState(0);
  const blocked = seen || !condition || !!sheet || noAccounts;

  // Sıra bekleyen ipucu için ara sıra yeniden dene (dakika dolunca çıksın).
  useEffect(() => {
    if (blocked || active) return;
    const id = setInterval(() => tick((n) => n + 1), 15_000);
    return () => clearInterval(id);
  }, [blocked]);

  if (!blocked && active !== key && !active && Date.now() - lastAt >= GAP) active = key;
  const show = !blocked && active === key;

  const markSeen = () => {
    if (active === key) {
      active = null;
      lastAt = Date.now();
    }
    commit((d) => (d.settings.hintsSeen?.includes(key) ? d : A.updateSettings(d, { hintsSeen: [...(d.settings.hintsSeen ?? []), key] })));
  };
  // Açılan sayfa ya da kapanan koşul ipucunu gösterilmiş sayar; tekrar çıkmaz.
  useEffect(() => {
    if (active === key && (!condition || sheet || noAccounts)) markSeen();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [condition, sheet, noAccounts]);

  return { show, dismiss: markSeen };
}

function MascotHint({ id, when, text }: { id: string; when: boolean; text: Key }) {
  const t = useT();
  const m = useMascot();
  const { show, dismiss } = useHint(id, when);
  if (!show) return null;
  return (
    <div className="hint-region">
      <div className="hint" role="status">
        <Mascot who={m.who} mood="curious" size={44} lang={m.lang} name={m.name} />
        <p>{t(text)}</p>
        <button className="icon-btn icon-btn--small" onClick={dismiss} aria-label={t('common.close')}>
          <X size={16} />
        </button>
      </div>
    </div>
  );
}

/** App.tsx'te Toast'ın yanına konur; ipucu koşullarını burada topluyoruz. */
export function HintHost() {
  const { screen } = useNav();
  const txCount = useStore((s) => s.data.txs.length);
  const noBudget = useStore((s) => !s.data.settings.monthlyBudget);
  const noGoal = useStore((s) => s.data.goals.length === 0);
  return (
    <>
      <MascotHint id="cats" when={txCount >= 3} text="hint.cats" />
      <MascotHint id="edit" when={txCount >= 5} text="hint.edit" />
      <MascotHint id="budget" when={screen === 'budget' && noBudget} text="hint.budget" />
      <MascotHint id="invest" when={screen === 'invest' && noGoal} text="hint.invest" />
    </>
  );
}
