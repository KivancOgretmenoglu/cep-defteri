import { Suspense, useEffect, useRef } from 'react';
import { HintHost } from './mascot/hints';
import { CelebrateHost } from './ui/Celebrate';
import { resumeTxDraft } from './sheets/txDraft';
import { Plus, House, ListOrdered, CalendarRange, ChartColumn, Sprout, Settings as Gear, AlertTriangle, FlaskConical, Undo2, X, HandCoins } from 'lucide-react';
import { dismissWarning, hideToast, setMode, undo, useStore } from './store/store';
import { go, openSheet, useNav, closeSheet, type Screen } from './ui/nav';
import { Home } from './screens/Home';
import { LockGate } from './lock/LockGate';
import { useNativeSync } from './native/useNativeSync';
import { useMascotTheme } from './mascot/theme';
import { characterOf } from './mascot/characters';
import { setAppIcon } from './native/appIcon';
import { usePriceRefreshOnOpen } from './store/prices';
import { TxSheet, RefundSheet, ConfirmSheet } from './sheets/TxSheet';
import { useT } from './i18n';
import './ui/motion.css';
import type { Key } from './i18n/core';
import { ChunkBoundary, ScreenSkeleton, lazyNamed, preloadLazy } from './ui/lazy';

// İlk Özet çizimi için gerekmeyenler ayrı parçalarda; ilk çizimden sonra boşta önceden indirilir.
// Sıra önemli: önce sekmeler ve en sık açılan sayfalar.
// İlk açılış yalnız yeni kullanıcıda gerekir; kayıtlı kullanıcının ilk çizimini yavaşlatmasın.
const Onboarding = lazyNamed(() => import('./screens/Onboarding'), 'Onboarding');
const Transactions = lazyNamed(() => import('./screens/Transactions'), 'Transactions');
const Budget = lazyNamed(() => import('./screens/Budget'), 'Budget');
const Invest = lazyNamed(() => import('./screens/Invest'), 'Invest');
const AccountSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'AccountSheet');
const BudgetSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'BudgetSheet');
const CategorySheet = lazyNamed(() => import('./sheets/OtherSheets'), 'CategorySheet');
const GoalSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'GoalSheet');
const LimitSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'LimitSheet');
const PlanSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'PlanSheet');
const ValuationSheet = lazyNamed(() => import('./sheets/OtherSheets'), 'ValuationSheet');
const GuideHost = lazyNamed(() => import('./guide/Coach'), 'GuideHost');
const CameoHost = lazyNamed(() => import('./mascot/cameo/Cameo'), 'CameoHost');
const ScrollPeek = lazyNamed(() => import('./mascot/peek/ScrollPeek'), 'ScrollPeek');
const Reports = lazyNamed(() => import('./screens/Reports'), 'Reports');
const People = lazyNamed(() => import('./screens/People'), 'People');
const Balance = lazyNamed(() => import('./screens/Balance'), 'Balance');
const Settings = lazyNamed(() => import('./screens/Settings'), 'Settings');
const OccurrenceSheet = lazyNamed(() => import('./sheets/PlanSheets'), 'OccurrenceSheet');
const CancelPlanSheet = lazyNamed(() => import('./sheets/PlanSheets'), 'CancelPlanSheet');
const ReportCardSheet = lazyNamed(() => import('./sheets/ReportCardSheet'), 'ReportCardSheet');
const FloorSheet = lazyNamed(() => import('./sheets/FloorSheet'), 'FloorSheet');

const NAV: { screen: Screen; label: Key; icon: typeof House; phone: boolean }[] = [
  { screen: 'home', label: 'nav.home', icon: House, phone: true },
  { screen: 'tx', label: 'nav.tx', icon: ListOrdered, phone: true },
  { screen: 'budget', label: 'nav.budget', icon: CalendarRange, phone: true },
  { screen: 'invest', label: 'nav.invest', icon: Sprout, phone: true },
  { screen: 'people', label: 'nav.people', icon: HandCoins, phone: false },
  { screen: 'reports', label: 'nav.reports', icon: ChartColumn, phone: false },
  { screen: 'settings', label: 'nav.settings', icon: Gear, phone: false },
];

/** Ekran değişince giriş yönü: sağdaki sekmeye geçince sağdan, soldakine soldan; sekme dışı ekranlar aşağıdan belirir. */
function useEnterDir(screen: Screen): 'none' | 'right' | 'left' | 'up' {
  const r = useRef<{ screen: Screen; dir: 'none' | 'right' | 'left' | 'up' }>({ screen, dir: 'none' });
  if (r.current.screen !== screen) {
    const a = NAV.findIndex((n) => n.screen === r.current.screen);
    const b = NAV.findIndex((n) => n.screen === screen);
    r.current = { screen, dir: a < 0 || b < 0 ? 'up' : b > a ? 'right' : 'left' };
  }
  return r.current.dir;
}

function useTheme() {
  const theme = useStore((s) => s.data.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
  }, [theme]);
}

/** Android: "simge maskotu izlesin" açıksa maskot değişince uygulama simgesi de değişir. */
function useAppIconSync() {
  const key = useStore((s) => characterOf(s.data.settings.mascot?.key).key);
  const follows = useStore((s) => s.data.settings.appIconFollows === true);
  const mode = useStore((s) => s.mode);
  useEffect(() => {
    if (follows && mode === 'real') void setAppIcon(key);
  }, [key, follows, mode]);
}

/** <html lang> dil değişince güncellenir. */
function useHtmlLang(lang: string) {
  useEffect(() => {
    document.documentElement.lang = lang;
  }, [lang]);
}

function SheetHost() {
  const { sheet } = useNav();
  // Kategori/hesap sayfası kapanınca, ondan önce açık olan işlem sayfası taslağıyla geri gelir.
  useEffect(() => {
    if (!sheet) resumeTxDraft();
  }, [sheet]);
  // Tembel yüklenen sayfa birkaç ms gecikebilir; bu sırada hiçbir şey çizilmez (sayfa kendi animasyonuyla açılır).
  return (
    <ChunkBoundary quiet resetKey={sheet}>
      <Suspense fallback={null}>
        <SheetBody />
      </Suspense>
    </ChunkBoundary>
  );
}

function SheetBody() {
  const { sheet } = useNav();
  if (!sheet) return null;
  switch (sheet.kind) {
    case 'add':
      return <TxSheet key={'add' + JSON.stringify(sheet.preset ?? {})} preset={sheet.preset} />;
    case 'edit':
      return <TxSheet key={'e' + sheet.txId} txId={sheet.txId} />;
    case 'refund':
      return <RefundSheet key={'r' + sheet.txId} txId={sheet.txId} />;
    case 'confirm':
      return <ConfirmSheet planId={sheet.planId} due={sheet.due} />;
    case 'occurrence':
      return <OccurrenceSheet key={sheet.planId + sheet.due} planId={sheet.planId} due={sheet.due} />;
    case 'cancelPlan':
      return <CancelPlanSheet planId={sheet.planId} />;
    case 'reportCard':
      return <ReportCardSheet month={sheet.month} />;
    case 'account':
      return <AccountSheet key={sheet.accountId ?? 'new-' + sheet.kindPreset} accountId={sheet.accountId} kindPreset={sheet.kindPreset} />;
    case 'plan':
      return <PlanSheet key={sheet.planId ?? 'new'} planId={sheet.planId} preset={sheet.preset} />;
    case 'valuation':
      return <ValuationSheet accountId={sheet.accountId} />;
    case 'goal':
      return <GoalSheet goalId={sheet.goalId} accountId={sheet.accountId} />;
    case 'category':
      return <CategorySheet categoryId={sheet.categoryId} catKind={sheet.catKind} />;
    case 'budget':
      return <BudgetSheet />;
    case 'floor':
      return <FloorSheet />;
    case 'limit':
      return <LimitSheet categoryId={sheet.categoryId} />;
  }
}

function Toast() {
  const t = useT();
  const toast = useStore((s) => s.toast);
  if (!toast) return <div className="toast-region" aria-live="polite" />;
  return (
    <div className="toast-region" aria-live="polite">
      <div className={`toast ${toast.tone === 'error' ? 'toast--error' : ''}`} key={toast.id}>
        <span>{toast.text}</span>
        {toast.undo && (
          <button className="toast__undo" onClick={undo}>
            <Undo2 size={16} /> {t('common.undo')}
          </button>
        )}
        <button className="icon-btn icon-btn--small" onClick={hideToast} aria-label={t('common.close')}><X size={16} /></button>
      </div>
    </div>
  );
}

export function App() {
  const t = useT();
  useTheme();
  useMascotTheme();
  useAppIconSync();
  usePriceRefreshOnOpen();
  useHtmlLang(t.lang);
  useNativeSync();
  const { screen, sheet } = useNav();
  const mode = useStore((s) => s.mode);
  const warning = useStore((s) => s.warning);
  const saveFailed = useStore((s) => s.saveFailed);
  const noAccounts = useStore((s) => s.data.accounts.length === 0);
  // Bugün hiç kayıt yoksa + düğmesinin parıltısı biraz daha belirgin
  const loggedToday = useStore((s) => s.data.txs.some((x) => x.date === s.today));
  const showOnboarding = noAccounts && mode === 'real' && screen !== 'settings';

  // Kısayol: N veya + ile hızlı ekleme (yazı alanında değilken).
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (sheet || e.metaKey || e.ctrlKey || e.altKey || /INPUT|TEXTAREA|SELECT/.test(el.tagName)) return;
      if (e.key === 'n' || e.key === 'N' || e.key === '+') {
        e.preventDefault();
        openSheet({ kind: 'add' });
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [sheet]);

  const enterDir = useEnterDir(screen);
  // İlk çizimden sonra, tarayıcı boştayken diğer ekranların parçalarını indir.
  useEffect(() => preloadLazy(), []);
  const Main = { home: Home, tx: Transactions, budget: Budget, invest: Invest, reports: Reports, settings: Settings, balance: Balance, people: People }[screen];

  return (
    <LockGate>
    <div className={`app ${showOnboarding ? 'app--onboarding' : ''}`}>
      <a className="skip" href="#main">{t('app.skip')}</a>
      {!showOnboarding && (
        <nav className="rail" aria-label={t('app.mainNav')}>
          <div className="rail__brand">
            <span className="rail__logo" aria-hidden>
              <svg viewBox="0 0 16 10" width="28" shapeRendering="crispEdges"><rect x="2" y="0" width="12" height="7" fill="#D97757" /><rect x="0" y="3" width="2" height="2" fill="#D97757" /><rect x="14" y="3" width="2" height="2" fill="#D97757" /><rect x="5" y="2" width="1" height="2" fill="#2A1E1A" /><rect x="10" y="2" width="1" height="2" fill="#2A1E1A" /><rect x="3" y="7" width="1" height="2" fill="#B8603F" /><rect x="5" y="7" width="1" height="2" fill="#B8603F" /><rect x="10" y="7" width="1" height="2" fill="#B8603F" /><rect x="12" y="7" width="1" height="2" fill="#B8603F" /></svg>
            </span>
            Cep Defteri
          </div>
          <button className="btn btn--primary rail__add" data-tour="add" onClick={() => openSheet({ kind: 'add' })}>
            <Plus size={20} /> {t('app.addTx')}
          </button>
          <ul>
            {NAV.map((n) => (
              <li key={n.screen}>
                <button data-tab={n.screen} data-tour={n.screen === 'settings' ? 'settings' : n.screen === 'invest' ? 'invest-tab' : n.screen === 'reports' ? 'reports' : undefined} className={`rail__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
                  <n.icon size={20} aria-hidden /> {t(n.label)}
                </button>
              </li>
            ))}
          </ul>
          <p className="rail__hint">{t('app.shortcut')} <kbd>N</kbd> {t('app.shortcutNew')}</p>
        </nav>
      )}

      <main id="main" className="main" tabIndex={-1}>
        {mode === 'demo' && (
          <div className="banner banner--demo" role="status">
            <FlaskConical size={18} aria-hidden />
            <span><b>{t('app.demoTitle')}</b> — {t('app.demoBody')}</span>
            <button className="btn btn--small btn--secondary" onClick={() => { setMode('real'); go('home'); }}>{t('app.demoExit')}</button>
          </div>
        )}
        {warning && (
          <div className="banner banner--warn" role="alert">
            <AlertTriangle size={18} aria-hidden />
            <span>{t(warning)}</span>
            <button className="icon-btn icon-btn--small" onClick={dismissWarning} aria-label={t('common.close')}><X size={16} /></button>
          </div>
        )}
        {saveFailed && (
          <div className="banner banner--warn" role="alert">
            <AlertTriangle size={18} aria-hidden />
            <span>{t('app.saveFailed')}</span>
          </div>
        )}
        {showOnboarding ? (
          <ChunkBoundary>
            <Suspense fallback={<ScreenSkeleton />}><Onboarding /></Suspense>
          </ChunkBoundary>
        ) : (
          // Suspense dışarıda: yeni ekran parçası hazır olunca anahtarlı kap yeni takılır, giriş animasyonu içerikle oynar.
          <ChunkBoundary resetKey={screen}>
            <Suspense fallback={<ScreenSkeleton />}>
              <div key={screen} className={`screen-enter screen-enter--${enterDir}`}><Main /></div>
            </Suspense>
          </ChunkBoundary>
        )}
      </main>

      {!showOnboarding && (
        <nav className="tabbar" aria-label={t('app.bottomNav')}>
          {NAV.filter((n) => n.phone).slice(0, 2).map((n) => (
            <button key={n.screen} data-tab={n.screen} className={`tabbar__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
              <n.icon size={22} aria-hidden />
              <span>{t(n.label)}</span>
            </button>
          ))}
          <button data-tour="add" className={`tabbar__add ${sheet ? '' : loggedToday ? 'tabbar__add--glow' : 'tabbar__add--glow tabbar__add--nudge'}`} onClick={() => openSheet({ kind: 'add' })} aria-label={t('app.addTx')}>
            <span className="tabbar__aura" aria-hidden />
            <Plus size={28} strokeWidth={2.5} />
          </button>
          {NAV.filter((n) => n.phone).slice(2).map((n) => (
            <button key={n.screen} data-tab={n.screen} data-tour={n.screen === 'invest' ? 'invest-tab' : undefined} className={`tabbar__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
              <n.icon size={22} aria-hidden />
              <span>{t(n.label)}</span>
            </button>
          ))}
        </nav>
      )}
      <SheetHost />
      <Toast />
      <HintHost />
      <CelebrateHost />
      <ChunkBoundary quiet>
        <Suspense fallback={null}>
          <CameoHost />
          <ScrollPeek />
          <GuideHost />
        </Suspense>
      </ChunkBoundary>
    </div>
    </LockGate>
  );
}

export { closeSheet };
