/**
 * Kod bölme: ilk Özet çizimi için gerekmeyen ekran ve sayfalar ayrı parçalarda (chunk) gelir.
 * `lazyNamed` adlı dışa aktarımı React.lazy ile sarar ve bir ön yükleyici kaydeder; `preloadLazy`
 * ilk çizimden sonra, tarayıcı boştayken hepsini sırayla indirir (geçişler anında, çevrimdışı da hazır).
 */
import { Component, lazy, type ComponentType, type LazyExoticComponent, type ReactNode } from 'react';
import { RotateCcw } from 'lucide-react';
import { t } from '../i18n';

const loaders: (() => Promise<unknown>)[] = [];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function lazyNamed<M extends Record<K, ComponentType<any>>, K extends keyof M & string>(load: () => Promise<M>, name: K): LazyExoticComponent<M[K]> {
  let p: Promise<M> | undefined;
  // Başarısız indirme (ör. çevrimdışı) önbelleğe alınmaz; sonraki deneme yeniden ister.
  const get = () => (p ??= load().catch((e: unknown) => {
    p = undefined;
    throw e;
  }));
  loaders.push(get);
  return lazy(() => get().then((m) => ({ default: m[name] })));
}

type Idle = (cb: () => void, opts?: { timeout: number }) => number;

/** Boşta kalınca kayıtlı parçaları birer birer indirir (ana iş parçacığını meşgul etmeden). */
export function preloadLazy(delay = 600) {
  if (typeof window === 'undefined') return;
  const ric: Idle = (window as unknown as { requestIdleCallback?: Idle }).requestIdleCallback ?? ((cb) => window.setTimeout(cb, 200));
  const queue = [...loaders];
  const next = () => {
    const f = queue.shift();
    if (!f) return;
    ric(() => { f().catch(() => {}).finally(next); }, { timeout: 3000 });
  };
  window.setTimeout(next, delay);
}

/** Parça yüklenirken: kart biçimli, sabit yükseklikte hafif bir iskelet (sayfa zıplamaz). */
export function ScreenSkeleton() {
  return (
    <div className="screen skel" aria-busy="true">
      <div className="skel__head" />
      <div className="card skel__card" />
      <div className="card skel__card skel__card--short" />
    </div>
  );
}

/** Parça indirilemezse (çevrimdışı ve önbellekte yok) beyaz ekran yerine yeniden dene düğmesi. */
export class ChunkBoundary extends Component<{ children: ReactNode; resetKey?: unknown; quiet?: boolean }, { failed: boolean }> {
  state = { failed: false };
  static getDerivedStateFromError() {
    return { failed: true };
  }
  componentDidUpdate(prev: { resetKey?: unknown }) {
    if (prev.resetKey !== this.props.resetKey && this.state.failed) this.setState({ failed: false });
  }
  // Çevrimiçiyken başarısızlık çoğunlukla eski sürümün silinmiş parçasıdır: sayfayı yenile. Çevrimdışıysa yeniden dene.
  retry = () => {
    if (navigator.onLine) location.reload();
    else this.setState({ failed: false });
  };
  render() {
    if (!this.state.failed) return this.props.children;
    if (this.props.quiet) return null;
    return (
      <div className="screen">
        <section className="card chunk-error" role="alert">
          <p>{t('app.chunkFailed')}</p>
          <button className="btn btn--secondary" onClick={this.retry}>
            <RotateCcw size={16} /> {t('app.chunkRetry')}
          </button>
        </section>
      </div>
    );
  }
}
