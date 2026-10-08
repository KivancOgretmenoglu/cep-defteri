/**
 * Spot ışıklı rehberin adımları ve kapı kuralları. Saf modül (DOM yok): testler doğrudan kullanır.
 * Her adım gerçek bir ekranda, `data-tour="..."` işaretli gerçek bir öğeyi gösterir; öğe bulunamazsa adım atlanır.
 */
import type { Mood } from '../domain/mood';
import type { Screen } from '../ui/nav';

/** Rehber içeriği değişince artır: mevcut kullanıcılara bir kez "Yeni şeyler ekledik" kartı çıkar. */
export const GUIDE_VERSION = 2;

export type StepId = 'add' | 'amount' | 'newCat' | 'why' | 'eye' | 'rings' | 'floor' | 'invest' | 'widget' | 'tile' | 'settings';

export interface GuideStep {
  id: StepId;
  screen: Screen;
  /** Adım sürerken açık olması gereken sayfa; yoksa açık sayfa kapatılır. Kaydetmeden, taslak bırakmadan. */
  sheet?: 'add';
  /**
   * Hedef `data-tour` adları. 'first': görünen ilki (telefon/masaüstü ya da yedek hedef);
   * 'union': görünenlerin hepsini saran dikdörtgen. Hedef yoksa ortada kart.
   */
  target?: { names: string[]; mode: 'first' | 'union' };
  /** Yalnız Android uygulamasında (tarayıcıda atlanır). */
  apkOnly?: boolean;
  /** Metnin altında özel gövde (widget maketi, kutucuk düğmesi). */
  body?: 'widget' | 'tile';
  mood: Mood;
}

const first = (...names: string[]) => ({ names, mode: 'first' as const });

export const GUIDE_STEPS: GuideStep[] = [
  { id: 'add', screen: 'home', target: first('add'), mood: 'happy' },
  { id: 'amount', screen: 'home', sheet: 'add', target: { names: ['amount', 'quick'], mode: 'union' }, mood: 'curious' },
  { id: 'newCat', screen: 'home', sheet: 'add', target: first('newCat'), mood: 'calm' },
  { id: 'why', screen: 'home', target: first('why'), mood: 'thoughtful' },
  { id: 'eye', screen: 'home', target: first('eye'), mood: 'calm' },
  { id: 'rings', screen: 'home', target: first('rings', 'chart'), mood: 'happy' },
  { id: 'floor', screen: 'budget', target: first('floor'), mood: 'thoughtful' },
  { id: 'invest', screen: 'home', target: { names: ['invest'], mode: 'union' }, mood: 'curious' },
  { id: 'widget', screen: 'home', body: 'widget', mood: 'happy' },
  { id: 'tile', screen: 'home', body: 'tile', apkOnly: true, mood: 'curious' },
  { id: 'settings', screen: 'home', target: first('settings'), mood: 'celebrate' },
];

/** Ortama göre baştan elenecek adımlar (yalnız-APK adımları tarayıcıda). Hedefi olmayanlar çalışırken atlanır. */
export function filterSteps(steps: GuideStep[], env: { native: boolean }): GuideStep[] {
  return steps.filter((s) => !s.apkOnly || env.native);
}

/**
 * Bir sonraki gösterilecek adım: `from`'dan `dir` yönünde, `present` doğrulayan ilk adım.
 * Hiçbiri yoksa -1 (ileri yönde: rehber biter; geri yönde: yerinde kal).
 */
export function nextPresent(steps: GuideStep[], from: number, dir: 1 | -1, present: (s: GuideStep) => boolean): number {
  for (let i = from; i >= 0 && i < steps.length; i += dir) if (present(steps[i])) return i;
  return -1;
}

export interface GuideGate {
  mode: 'real' | 'demo';
  hasAccounts: boolean;
  guideVersion: number | null | undefined;
}

/** Rehberi henüz görmemiş (ya da eski sürümünü görmüş) gerçek kullanıcı mı? */
export const guideOutdated = (g: GuideGate) => g.mode === 'real' && g.hasAccounts && (g.guideVersion ?? 0) < GUIDE_VERSION;

/** Yeni kurulumdan hemen sonra: rehber kendiliğinden başlar (kart yerine). */
export const shouldAutoStart = (g: GuideGate & { pendingAuto: boolean; busy: boolean }) => g.pendingAuto && !g.busy && guideOutdated(g);

/** Mevcut kullanıcıya Özet'te bir kez "Yeni şeyler ekledik" kartı. */
export const shouldInvite = (g: GuideGate & { pendingAuto: boolean; active: boolean }) => !g.pendingAuto && !g.active && guideOutdated(g);
