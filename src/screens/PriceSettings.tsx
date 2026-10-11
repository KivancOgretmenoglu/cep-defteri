/** Ayarlar: altın/döviz fiyatları — gizlilik notu, otomatik alma anahtarı, son fiyat zamanı. */
import { Globe } from 'lucide-react';
import { useT } from '../i18n';
import { setAutoPrices, usePrices } from '../store/prices';
import { SectionHead, Segmented } from '../ui/kit';
import { agoText } from '../sheets/AssetFields';

type OnOff = 'on' | 'off';

export function PriceSettings() {
  const t = useT();
  const p = usePrices();
  return (
    <section className="card" aria-labelledby="s-prices">
      <SectionHead id="s-prices" title={t('asset.settingsTitle')} />
      <p className="muted"><Globe size={15} aria-hidden /> {t('asset.privacy')}</p>
      <p className="field__label">{t('asset.autoLabel')}</p>
      <Segmented<OnOff>
        size="sm"
        label={t('asset.autoLabel')}
        value={p.auto ? 'on' : 'off'}
        onChange={(v) => setAutoPrices(v === 'on')}
        options={[{ value: 'on', label: t('ns.on') }, { value: 'off', label: t('ns.off') }]}
      />
      <p className="note-line">{t('asset.autoHint')} {p.fetchedAt ? t('asset.lastFetch', { ago: agoText(t, p.fetchedAt) }) : t('asset.neverFetched')}</p>
    </section>
  );
}
