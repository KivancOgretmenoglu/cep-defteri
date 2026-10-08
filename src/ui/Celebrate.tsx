/**
 * Gerçek başarı anı: bir birikim hedefine kullanıcının bir kaydıyla ilk kez ulaşıldığında
 * küçük bir konfeti patlaması (~20 piksel kare, 900 ms) ve maskota 'goal-reached' olayı.
 * Sıradan kayıtlarda, açılışta, geri almada ya da hedef zaten tamamken hiçbir şey olmaz.
 */
import { useEffect } from 'react';
import { getState, subscribe } from '../store/store';
import { newlyReachedGoals } from '../domain/rings';
import { mascotEvent } from '../mascot/events';
import { prefersReducedMotion } from './motion';

/** Bu oturumda kutlanan hedefler: geri al + yeniden kaydet aynı hedefi ikinci kez patlatmasın. */
const celebrated = new Set<string>();

const COLORS = ['var(--accent)', 'var(--accent-line)', 'var(--pos)', 'var(--invest)', 'var(--warn)'];

/** Ekrandaki hedef halkasının (yoksa ekranın üst-orta bölgesinin) üstünde patlama. */
export function burst(count = 20) {
  if (typeof document === 'undefined' || prefersReducedMotion()) return;
  const anchor = document.querySelector<SVGElement>('.ring--goal')?.getBoundingClientRect();
  const onScreen = anchor && anchor.width > 0 && anchor.top > 0 && anchor.bottom < window.innerHeight;
  const x = onScreen ? anchor.left + anchor.width / 2 : window.innerWidth / 2;
  const y = onScreen ? anchor.top + anchor.height / 2 : window.innerHeight * 0.38;
  const host = document.createElement('div');
  host.className = 'confetti';
  host.setAttribute('aria-hidden', 'true');
  host.style.left = `${x}px`;
  host.style.top = `${y}px`;
  for (let i = 0; i < count; i++) {
    const p = document.createElement('i');
    const a = (i / count) * Math.PI * 2 + Math.random() * 0.5;
    const d = 46 + Math.random() * 58;
    const dx = Math.cos(a) * d;
    const dy = Math.sin(a) * d * 0.8 - 30;
    const rot = (Math.random() < 0.5 ? -1 : 1) * (90 + Math.random() * 270);
    const size = Math.random() < 0.35 ? 4 : 6;
    p.style.width = p.style.height = `${size}px`;
    p.style.background = COLORS[i % COLORS.length];
    host.appendChild(p);
    if (typeof p.animate === 'function') {
      p.animate(
        [
          { transform: 'translate(0, 0) scale(0.4) rotate(0deg)', opacity: 1 },
          { transform: `translate(${dx}px, ${dy}px) scale(1) rotate(${rot * 0.6}deg)`, opacity: 1, offset: 0.45 },
          { transform: `translate(${dx * 1.15}px, ${dy + 70}px) scale(0.9) rotate(${rot}deg)`, opacity: 0 },
        ],
        { duration: 900, delay: Math.random() * 60, easing: 'cubic-bezier(0.2, 0.7, 0.4, 1)', fill: 'both' },
      );
    }
  }
  document.body.appendChild(host);
  setTimeout(() => host.remove(), 1100);
}

/** Uygulama köküne bir kez yerleşir; görsel bir şey çizmez. */
export function CelebrateHost() {
  useEffect(() => {
    let prev = getState();
    const timers: ReturnType<typeof setTimeout>[] = [];
    const unsub = subscribe(() => {
      const next = getState();
      const p = prev;
      prev = next;
      // Yalnız kullanıcı kaydı (pulse) ile gelen veri değişimi; mod değişimi/yükleme değil.
      if (next.data === p.data || next.pulse === p.pulse || next.mode !== p.mode) return;
      const ids = newlyReachedGoals(p.data, next.data).filter((id) => !celebrated.has(id));
      if (ids.length === 0) return;
      ids.forEach((id) => celebrated.add(id));
      const title = next.data.goals.find((g) => g.id === ids[0])?.title ?? '';
      // Sayfa kapanıp ana ekran yerine otursun; maskotun kayıt hareketinden sonra gelsin.
      timers.push(setTimeout(() => burst(), 260));
      timers.push(setTimeout(() => mascotEvent({ type: 'goal-reached', title }), 700));
    });
    return () => {
      unsub();
      timers.forEach(clearTimeout);
    };
  }, []);
  return null;
}
