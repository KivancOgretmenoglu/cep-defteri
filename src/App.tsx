import { useEffect } from 'react';
import { Plus, House, ListOrdered, CalendarRange, ChartColumn, Sprout, Settings as Gear, AlertTriangle, FlaskConical, Undo2, X, HandCoins } from 'lucide-react';
import { dismissWarning, hideToast, setMode, undo, useStore } from './store/store';
import { go, openSheet, useNav, closeSheet, type Screen } from './ui/nav';
import { Home } from './screens/Home';
import { Transactions } from './screens/Transactions';
import { Budget } from './screens/Budget';
import { Invest } from './screens/Invest';
import { Reports } from './screens/Reports';
import { Settings } from './screens/Settings';
import { Onboarding } from './screens/Onboarding';
import { Balance } from './screens/Balance';
import { People } from './screens/People';
import { OccurrenceSheet, CancelPlanSheet } from './sheets/PlanSheets';
import { ReportCardSheet } from './sheets/ReportCardSheet';
import { LockGate } from './lock/LockGate';
import { useNativeSync } from './native/useNativeSync';
import { TxSheet, RefundSheet, ConfirmSheet } from './sheets/TxSheet';
import { AccountSheet, BudgetSheet, CategorySheet, GoalSheet, LimitSheet, PlanSheet, ValuationSheet } from './sheets/OtherSheets';

const NAV: { screen: Screen; label: string; icon: typeof House; phone: boolean }[] = [
  { screen: 'home', label: 'Özet', icon: House, phone: true },
  { screen: 'tx', label: 'İşlemler', icon: ListOrdered, phone: true },
  { screen: 'budget', label: 'Bütçe', icon: CalendarRange, phone: true },
  { screen: 'invest', label: 'Yatırım', icon: Sprout, phone: false },
  { screen: 'people', label: 'Borçlar', icon: HandCoins, phone: false },
  { screen: 'reports', label: 'Raporlar', icon: ChartColumn, phone: true },
  { screen: 'settings', label: 'Ayarlar', icon: Gear, phone: false },
];

function useTheme() {
  const theme = useStore((s) => s.data.settings.theme);
  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'system') root.removeAttribute('data-theme');
    else root.setAttribute('data-theme', theme);
    const dark = theme === 'dark' || (theme === 'system' && matchMedia('(prefers-color-scheme: dark)').matches);
    document.querySelector('meta[name="theme-color"]')?.setAttribute('content', dark ? '#1C1A17' : '#F4EFE6');
  }, [theme]);
}

function SheetHost() {
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
    case 'limit':
      return <LimitSheet categoryId={sheet.categoryId} />;
  }
}

function Toast() {
  const toast = useStore((s) => s.toast);
  if (!toast) return <div className="toast-region" aria-live="polite" />;
  return (
    <div className="toast-region" aria-live="polite">
      <div className={`toast ${toast.tone === 'error' ? 'toast--error' : ''}`} key={toast.id}>
        <span>{toast.text}</span>
        {toast.undo && (
          <button className="toast__undo" onClick={undo}>
            <Undo2 size={16} /> Geri al
          </button>
        )}
        <button className="icon-btn icon-btn--small" onClick={hideToast} aria-label="Kapat"><X size={16} /></button>
      </div>
    </div>
  );
}

export function App() {
  useTheme();
  useNativeSync();
  const { screen, sheet } = useNav();
  const mode = useStore((s) => s.mode);
  const warning = useStore((s) => s.warning);
  const saveFailed = useStore((s) => s.saveFailed);
  const noAccounts = useStore((s) => s.data.accounts.length === 0);
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

  const Main = { home: Home, tx: Transactions, budget: Budget, invest: Invest, reports: Reports, settings: Settings, balance: Balance, people: People }[screen];

  return (
    <LockGate>
    <div className={`app ${showOnboarding ? 'app--onboarding' : ''}`}>
      <a className="skip" href="#main">İçeriğe geç</a>
      {!showOnboarding && (
        <nav className="rail" aria-label="Ana gezinme">
          <div className="rail__brand">
            <span className="rail__logo" aria-hidden>
              <svg viewBox="0 0 16 10" width="28" shapeRendering="crispEdges"><rect x="2" y="0" width="12" height="7" fill="#D97757" /><rect x="0" y="3" width="2" height="2" fill="#D97757" /><rect x="14" y="3" width="2" height="2" fill="#D97757" /><rect x="5" y="2" width="1" height="2" fill="#2A1E1A" /><rect x="10" y="2" width="1" height="2" fill="#2A1E1A" /><rect x="3" y="7" width="1" height="2" fill="#B8603F" /><rect x="5" y="7" width="1" height="2" fill="#B8603F" /><rect x="10" y="7" width="1" height="2" fill="#B8603F" /><rect x="12" y="7" width="1" height="2" fill="#B8603F" /></svg>
            </span>
            Cep Defteri
          </div>
          <button className="btn btn--primary rail__add" onClick={() => openSheet({ kind: 'add' })}>
            <Plus size={20} /> İşlem ekle
          </button>
          <ul>
            {NAV.map((n) => (
              <li key={n.screen}>
                <button className={`rail__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
                  <n.icon size={20} aria-hidden /> {n.label}
                </button>
              </li>
            ))}
          </ul>
          <p className="rail__hint">Kısayol: <kbd>N</kbd> yeni işlem</p>
        </nav>
      )}

      <main id="main" className="main" tabIndex={-1}>
        {mode === 'demo' && (
          <div className="banner banner--demo" role="status">
            <FlaskConical size={18} aria-hidden />
            <span><b>Örnek veri</b> — gerçek kayıtların değil. Değişiklikler gerçek verine dokunmaz.</span>
            <button className="btn btn--small btn--secondary" onClick={() => { setMode('real'); go('home'); }}>Örnekten çık</button>
          </div>
        )}
        {warning && (
          <div className="banner banner--warn" role="alert">
            <AlertTriangle size={18} aria-hidden />
            <span>{warning}</span>
            <button className="icon-btn icon-btn--small" onClick={dismissWarning} aria-label="Kapat"><X size={16} /></button>
          </div>
        )}
        {saveFailed && (
          <div className="banner banner--warn" role="alert">
            <AlertTriangle size={18} aria-hidden />
            <span>Son değişiklik cihaza kaydedilemedi (depolama dolu ya da engelli olabilir). Sayfayı kapatmadan önce Ayarlar’dan yedek indir.</span>
          </div>
        )}
        {showOnboarding ? <Onboarding /> : <Main />}
      </main>

      {!showOnboarding && (
        <nav className="tabbar" aria-label="Alt gezinme">
          {NAV.filter((n) => n.phone).slice(0, 2).map((n) => (
            <button key={n.screen} className={`tabbar__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
              <n.icon size={22} aria-hidden />
              <span>{n.label}</span>
            </button>
          ))}
          <button className="tabbar__add" onClick={() => openSheet({ kind: 'add' })} aria-label="İşlem ekle">
            <Plus size={28} strokeWidth={2.5} />
          </button>
          {NAV.filter((n) => n.phone).slice(2).map((n) => (
            <button key={n.screen} className={`tabbar__item ${screen === n.screen ? 'is-on' : ''}`} aria-current={screen === n.screen ? 'page' : undefined} onClick={() => go(n.screen)}>
              <n.icon size={22} aria-hidden />
              <span>{n.label}</span>
            </button>
          ))}
        </nav>
      )}
      <SheetHost />
      <Toast />
    </div>
    </LockGate>
  );
}

export { closeSheet };
