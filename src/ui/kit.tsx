import { useEffect, useId, useRef, useState, type ReactNode, type InputHTMLAttributes } from 'react';
import { X, ChevronLeft, ChevronRight } from 'lucide-react';
import type { Money } from '../domain/money';
import { addMonths, type MonthKey } from '../domain/dates';
import { decimalSep, formatMoney, hiddenMoney, moneyParts, moneyToInput, moneyUnit, parseMoney, monthLabel } from '../i18n/format';
import { useT } from '../i18n';
import { useCountUp } from './motion';

// ── Tutar gösterimi ────────────────────────────────────
/** Gizli tutar gösterimi (bakiye gizleme açıkken). */
export const HIDDEN = '•••••';

export function Amount({ value: target, size = 'md', sign = false, tone, className = '', hide = false, animate = false }: { value: Money; size?: 'sm' | 'md' | 'lg' | 'xl'; sign?: boolean; tone?: 'pos' | 'neg' | 'invest' | 'muted'; className?: string; hide?: boolean; /** Değer değişince kısa sayma (ilk çizimde ve gizliyken yok) */ animate?: boolean }) {
  const t = useT();
  const value = useCountUp(target, animate && !hide);
  const en = t.lang === 'en';
  if (hide)
    return (
      <span className={`amount amount--${size} amount--hidden ${tone ? 'tone-' + tone : ''} ${className}`} aria-label={t('kit.hiddenAmount')}>
        {en && '₺'}
        {HIDDEN}
        {!en && (size === 'xl' || size === 'lg') && <span className="amount__unit"> TL</span>}
        {!en && size !== 'xl' && size !== 'lg' && ' TL'}
      </span>
    );
  if (size === 'xl' || size === 'lg') {
    const p = moneyParts(value);
    const plus = sign && value > 0 ? '+' : '';
    return (
      <span className={`amount amount--${size} ${tone ? 'tone-' + tone : ''} ${className}`}>
        {plus}
        {p.sign}
        {en && '₺'}
        {p.lira}
        <span className="amount__kurus">{decimalSep()}{p.kurus}</span>
        {!en && <span className="amount__unit"> TL</span>}
      </span>
    );
  }
  return <span className={`amount amount--${size} ${tone ? 'tone-' + tone : ''} ${className}`}>{formatMoney(value, { sign })}</span>;
}

/** Düz metin tutar (formatMoney) için sayan sürüm; gizliyken maske, sayma yok. */
export function AnimatedMoney({ value, hide = false }: { value: Money; hide?: boolean }) {
  const v = useCountUp(value, !hide);
  return <>{hide ? hiddenMoney() : formatMoney(v)}</>;
}

// ── Tutar girişi ───────────────────────────────────────
export function MoneyInput({
  value, onChange, label, big = false, autoFocus = false, id, allowZero = false, placeholder = '0', onEnter, ...rest
}: {
  value: string;
  onChange: (raw: string) => void;
  label: string;
  big?: boolean;
  autoFocus?: boolean;
  id?: string;
  allowZero?: boolean;
  placeholder?: string;
  onEnter?: () => void;
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  const auto = useId();
  const t = useT();
  const ref = useRef<HTMLInputElement>(null);
  useEffect(() => {
    if (autoFocus) {
      // Sayfa açılış animasyonu bitmeden odaklanınca iOS klavyeyi açmayabilir.
      const t = setTimeout(() => ref.current?.focus({ preventScroll: true }), 60);
      return () => clearTimeout(t);
    }
  }, [autoFocus]);
  const parsed = value.trim() ? parseMoney(value) : null;
  const invalid = value.trim() !== '' && parsed === null && !(allowZero && /^0+([.,]0*)?$/.test(value.trim()));
  return (
    <label className={`money-input ${big ? 'money-input--big' : ''} ${invalid ? 'is-invalid' : ''}`} htmlFor={id ?? auto}>
      <span className="money-input__label">{label}</span>
      <span className="money-input__row">
        <input
          ref={ref}
          id={id ?? auto}
          inputMode="decimal"
          autoComplete="off"
          enterKeyHint="done"
          placeholder={placeholder}
          value={value}
          onChange={(e) => onChange(e.target.value.replace(/[^\d.,]/g, ''))}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && onEnter) {
              e.preventDefault();
              onEnter();
            }
          }}
          aria-invalid={invalid}
          {...rest}
        />
        <span className="money-input__unit">{moneyUnit()}</span>
      </span>
      {invalid && <span className="field-error">{t('kit.amountFormat')}</span>}
    </label>
  );
}
export const inputFromMoney = (m: Money | null | undefined) => (m ? moneyToInput(m) : '');

// ── Sayfa (alttan açılan / ortada pencere) ─────────────
export function Sheet({ title, onClose, children, footer, wide = false, labelledBy }: { title: ReactNode; onClose: () => void; children: ReactNode; footer?: ReactNode; wide?: boolean; labelledBy?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const tid = useId();
  const t = useT();
  useEffect(() => {
    const prev = document.activeElement as HTMLElement | null;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.stopPropagation();
        onClose();
      }
      if (e.key === 'Tab' && ref.current) {
        const f = ref.current.querySelectorAll<HTMLElement>('button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])');
        if (!f.length) return;
        const first = f[0], last = f[f.length - 1];
        if (e.shiftKey && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    document.body.classList.add('has-sheet');
    if (!ref.current?.contains(document.activeElement)) ref.current?.focus({ preventScroll: true });
    return () => {
      document.removeEventListener('keydown', onKey);
      document.body.classList.remove('has-sheet');
      prev?.focus?.({ preventScroll: true });
    };
  }, [onClose]);
  return (
    <div className="sheet-backdrop" onMouseDown={(e) => e.target === e.currentTarget && onClose()}>
      <div className={`sheet ${wide ? 'sheet--wide' : ''}`} role="dialog" aria-modal="true" aria-labelledby={labelledBy ?? tid} ref={ref} tabIndex={-1}>
        <div className="sheet__grip" aria-hidden />
        <header className="sheet__head">
          <h2 id={tid}>{title}</h2>
          <button className="icon-btn" onClick={onClose} aria-label={t('common.close')}>
            <X size={20} />
          </button>
        </header>
        <div className="sheet__body">{children}</div>
        {footer && <footer className="sheet__foot">{footer}</footer>}
      </div>
    </div>
  );
}

// ── Seçim düğmeleri ────────────────────────────────────
export function Segmented<T extends string>({ value, onChange, options, label, size = 'md' }: { value: T; onChange: (v: T) => void; options: { value: T; label: ReactNode }[]; label: string; size?: 'sm' | 'md' }) {
  return (
    <div className={`segmented segmented--${size}`} role="radiogroup" aria-label={label}>
      {options.map((o) => (
        <button key={o.value} type="button" role="radio" aria-checked={value === o.value} className={value === o.value ? 'is-on' : ''} onClick={() => onChange(o.value)}>
          {o.label}
        </button>
      ))}
    </div>
  );
}

export function Chip({ on, onClick, children, color, title, className = '' }: { on?: boolean; onClick?: () => void; children: ReactNode; color?: string; title?: string; className?: string }) {
  return (
    <button type="button" className={`chip ${on ? 'is-on' : ''} ${className}`} onClick={onClick} aria-pressed={on} title={title} style={color ? ({ '--chip': color } as React.CSSProperties) : undefined}>
      {children}
    </button>
  );
}

export function Field({ label, children, hint, error }: { label: string; children: ReactNode; hint?: ReactNode; error?: string | null }) {
  return (
    <label className="field">
      <span className="field__label">{label}</span>
      {children}
      {hint && <span className="field__hint">{hint}</span>}
      {error && <span className="field-error">{error}</span>}
    </label>
  );
}

export function FormError({ msg }: { msg: string | null }) {
  if (!msg) return null;
  return (
    <p className="form-error" role="alert">
      {msg}
    </p>
  );
}

export function Progress({ value, max, tone = 'accent', label, marker }: { value: number; max: number; tone?: 'accent' | 'pos' | 'warn' | 'invest' | 'muted'; label: string; marker?: number }) {
  const pct = max > 0 ? Math.max(0, Math.min(100, (value / max) * 100)) : 0;
  return (
    <div className={`progress tone-${tone}`} role="progressbar" aria-label={label} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(pct)}>
      <div className="progress__fill" style={{ width: pct + '%' }} />
      {marker !== undefined && <div className="progress__marker" style={{ left: Math.max(0, Math.min(100, marker)) + '%' }} aria-hidden />}
    </div>
  );
}

export function MonthSwitcher({ month, onChange, max }: { month: MonthKey; onChange: (m: MonthKey) => void; max?: MonthKey }) {
  const t = useT();
  return (
    <div className="month-switch">
      <button className="icon-btn" onClick={() => onChange(addMonths(month, -1))} aria-label={t('kit.prevMonth')}>
        <ChevronLeft size={20} />
      </button>
      <span className="month-switch__label" aria-live="polite">
        {monthLabel(month)}
      </span>
      <button className="icon-btn" onClick={() => onChange(addMonths(month, 1))} aria-label={t('kit.nextMonth')} disabled={!!max && month >= max}>
        <ChevronRight size={20} />
      </button>
    </div>
  );
}

export function Collapsible({ summary, children, defaultOpen = false }: { summary: ReactNode; children: ReactNode; defaultOpen?: boolean }) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`collapsible ${open ? 'is-open' : ''}`}>
      <button type="button" className="collapsible__btn" aria-expanded={open} onClick={() => setOpen(!open)}>
        {summary}
        <ChevronRight size={16} className="collapsible__chev" aria-hidden />
      </button>
      {open && <div className="collapsible__body">{children}</div>}
    </div>
  );
}

export function SectionHead({ title, action, id }: { title: ReactNode; action?: ReactNode; id?: string }) {
  return (
    <div className="section-head">
      <h2 id={id}>{title}</h2>
      {action}
    </div>
  );
}

export function useMoneyField(initial: Money | null | undefined) {
  const [raw, setRaw] = useState(inputFromMoney(initial));
  return { raw, setRaw, value: raw.trim() ? parseMoney(raw) : null };
}

export const tl = (m: Money) => formatMoney(m);
