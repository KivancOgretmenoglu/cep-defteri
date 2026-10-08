/** Mevcut kullanıcıya Özet'te bir kez: "Yeni şeyler ekledik… Göstereyim mi?" Her iki düğme de rehber sürümünü kaydeder. */
import * as A from '../domain/actions';
import { commit, useStore } from '../store/store';
import { useNav } from '../ui/nav';
import { useT } from '../i18n';
import { Mascot } from '../mascot/Mascot';
import { useMascot } from '../mascot/MascotNote';
import { GUIDE_VERSION, shouldInvite } from './steps';
import { startGuide, useGuide } from './state';

export function GuideInvite() {
  const t = useT();
  const m = useMascot();
  const g = useGuide();
  const { sheet } = useNav();
  const mode = useStore((s) => s.mode);
  const hasAccounts = useStore((s) => s.data.accounts.length > 0);
  const guideVersion = useStore((s) => s.data.settings.guideVersion);
  if (sheet || !shouldInvite({ mode, hasAccounts, guideVersion, pendingAuto: g.pendingAuto, active: g.active })) return null;
  const seen = () => commit((d) => A.updateSettings(d, { guideVersion: GUIDE_VERSION }));
  return (
    <section className="card guide-invite" aria-labelledby="guide-invite-h">
      <Mascot who={m.who} mood="curious" size={56} idle={false} lang={m.lang} name={m.name} />
      <div className="guide-invite__text">
        <h2 id="guide-invite-h">{t('guide.newTitle')}</h2>
        <p className="small muted">{t('guide.newBody')}</p>
        <div className="btn-row">
          <button type="button" className="btn btn--primary btn--small" onClick={() => { seen(); startGuide(); }}>{t('guide.show')}</button>
          <button type="button" className="btn btn--ghost btn--small" onClick={seen}>{t('guide.close')}</button>
        </div>
      </div>
    </section>
  );
}
