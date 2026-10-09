/**
 * Kapalı test geri bildirimi: e-posta (mailto:) adresi, konu ve gövde.
 * Gövdeye yalnız teknik bilgi girer (sürüm, platform, Android sürümü, cihaz modeli, dil, maskot);
 * hiçbir para, hesap, kategori ya da not bilgisi eklenmez.
 */
export const FEEDBACK_EMAIL = 'cep.defteri2026@gmail.com';
export const PLAY_STORE_URL = 'https://play.google.com/store/apps/details?id=io.github.kivancogretmenoglu.cepdefteri';

export interface FeedbackInfo {
  version: string;
  build?: string;
  platform: string;
  userAgent: string;
  lang: string;
  mascot: string;
  demo?: boolean;
}

/** Kullanıcı aracısından Android sürümü ve cihaz modeli (Chrome modeli "K" diye gizleyebilir). */
export function parseUserAgent(ua: string): { android: string | null; model: string | null } {
  const m = ua.match(/Android\s+([\d.]+)(?:;\s*([^;)]+))?/);
  if (!m) return { android: null, model: null };
  const model = m[2]?.replace(/\s*Build\/.*$/, '').trim() || null;
  return { android: m[1], model: model && model !== 'wv' && model !== 'K' ? model : null };
}

export function feedbackSubject(version: string): string {
  return `Cep Defteri geri bildirim (${version})`;
}

export function feedbackBody(info: FeedbackInfo, intro: string, infoHeader: string): string {
  const ua = parseUserAgent(info.userAgent);
  const lines = [
    intro,
    '',
    '',
    '',
    '— ' + infoHeader,
    `App: ${info.version}${info.build ? ` (build ${info.build})` : ''}`,
    `Platform: ${info.platform}`,
    ...(ua.android ? [`Android: ${ua.android}`] : []),
    ...(ua.model ? [`Device: ${ua.model}`] : []),
    `Language: ${info.lang}`,
    `Mascot: ${info.mascot}`,
    ...(info.demo ? ['Demo data: yes'] : []),
    `UA: ${info.userAgent}`,
  ];
  return lines.join('\n');
}

export function feedbackMailto(info: FeedbackInfo, intro: string, infoHeader: string): string {
  const enc = (s: string) => encodeURIComponent(s.replace(/\r?\n/g, '\r\n'));
  return `mailto:${FEEDBACK_EMAIL}?subject=${enc(feedbackSubject(info.version))}&body=${enc(feedbackBody(info, intro, infoHeader))}`;
}
