/** Ayarlar > Geri bildirim: e-postayla öneri/hata bildirimi ve uygulamayı arkadaşa önerme. */
import { MessageSquareText, Share2 } from 'lucide-react';
import { Capacitor } from '@capacitor/core';
import { useT } from '../i18n';
import { t as tNow } from '../i18n';
import { isNative } from '../platform';
import { getState, showToast } from '../store/store';
import { characterOf } from '../mascot/characters';
import { FEEDBACK_EMAIL, PLAY_STORE_URL, feedbackMailto } from '../domain/feedback';
import { SectionHead } from './kit';
import './polish.css';

async function appVersion(): Promise<{ version: string; build?: string }> {
  if (isNative()) {
    try {
      const { App } = await import('@capacitor/app');
      const info = await App.getInfo();
      return { version: info.version, build: info.build };
    } catch {
      /* web sürümüne düş */
    }
  }
  return { version: __APP_VERSION__ };
}

export async function openFeedbackMail() {
  const { data, mode } = getState();
  const v = await appVersion();
  const url = feedbackMailto(
    {
      ...v,
      platform: Capacitor.getPlatform(),
      userAgent: typeof navigator !== 'undefined' ? navigator.userAgent : '',
      lang: data.settings.lang ?? 'tr',
      mascot: characterOf(data.settings.mascot?.key).key,
      demo: mode === 'demo',
    },
    tNow('fb.bodyIntro'),
    tNow('fb.bodyInfo'),
  );
  // Android'de Capacitor, http dışı adresleri sistem uygulamasına (e-posta) yönlendirir.
  try {
    window.location.href = url;
  } catch {
    showToast(tNow('fb.noMail', { email: FEEDBACK_EMAIL }), { tone: 'error', ms: 6000 });
  }
}

export async function shareApp() {
  const text = tNow('fb.shareText');
  if (isNative()) {
    try {
      const { Share } = await import('@capacitor/share');
      await Share.share({ title: 'Cep Defteri', text, url: PLAY_STORE_URL, dialogTitle: tNow('fb.share') });
    } catch {
      /* paylaşım kapatıldı */
    }
    return;
  }
  if (typeof navigator.share === 'function') {
    try {
      await navigator.share({ title: 'Cep Defteri', text, url: PLAY_STORE_URL });
    } catch {
      /* kapatıldı */
    }
    return;
  }
  try {
    await navigator.clipboard.writeText(`${text} ${PLAY_STORE_URL}`);
    showToast(tNow('fb.shareCopied'));
  } catch {
    window.open(PLAY_STORE_URL, '_blank', 'noopener');
  }
}

export function FeedbackSettings() {
  const t = useT();
  return (
    <section className="card" aria-labelledby="s-feedback">
      <SectionHead id="s-feedback" title={t('fb.title')} />
      <div className="feedback-actions">
        <button type="button" className="btn btn--secondary" onClick={() => void openFeedbackMail()}>
          <MessageSquareText size={17} /> {t('fb.send')}
        </button>
        <p className="note-line">{t('fb.sendHint')} <span className="muted">{FEEDBACK_EMAIL}</span></p>
        <button type="button" className="link" onClick={() => void shareApp()}>
          <Share2 size={16} /> {t('fb.share')}
        </button>
      </div>
    </section>
  );
}
