import { describe, expect, it } from 'vitest';
import { feedbackBody, feedbackMailto, feedbackSubject, parseUserAgent, FEEDBACK_EMAIL } from './feedback';

const UA = 'Mozilla/5.0 (Linux; Android 14; Pixel 7 Build/UQ1A.240205.004; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/129.0 Mobile Safari/537.36';

describe('feedback mail', () => {
  it('reads Android version and model from the user agent', () => {
    expect(parseUserAgent(UA)).toEqual({ android: '14', model: 'Pixel 7' });
    expect(parseUserAgent('Mozilla/5.0 (Linux; Android 10; K) AppleWebKit')).toEqual({ android: '10', model: null });
    expect(parseUserAgent('Mozilla/5.0 (X11; Linux x86_64)')).toEqual({ android: null, model: null });
  });
  it('builds the subject and a body without money data', () => {
    expect(feedbackSubject('1.0.7')).toBe('Cep Defteri geri bildirim (1.0.7)');
    const body = feedbackBody({ version: '1.0.7', build: '7', platform: 'android', userAgent: UA, lang: 'tr', mascot: 'fistik' }, 'Merhaba', 'Teknik bilgi');
    expect(body).toContain('App: 1.0.7 (build 7)');
    expect(body).toContain('Android: 14');
    expect(body).toContain('Device: Pixel 7');
    expect(body).toContain('Mascot: fistik');
    expect(body).not.toMatch(/TL|₺/);
  });
  it('encodes a mailto URL', () => {
    const url = feedbackMailto({ version: '1.0.0', platform: 'web', userAgent: 'x', lang: 'en', mascot: 'fistik' }, 'Hi & bye', 'Info');
    expect(url.startsWith(`mailto:${FEEDBACK_EMAIL}?subject=Cep%20Defteri%20geri%20bildirim%20(1.0.0)&body=`)).toBe(true);
    expect(url).toContain('Hi%20%26%20bye%0D%0A');
    expect(url).not.toContain(' ');
  });
});
