import { describe, expect, it } from 'vitest';
import { appIconSupported, getAppIcon, setAppIcon } from './appIcon';
import { haptic } from './haptics';

describe('tarayıcıda yerel özellikler sessizce devre dışı', () => {
  it('uygulama simgesi', async () => {
    expect(appIconSupported()).toBe(false);
    expect(await setAppIcon('bilge')).toBe(false);
    expect(await getAppIcon()).toBeNull();
  });
  it('titreşim', () => {
    expect(() => haptic('light')).not.toThrow();
    expect(() => haptic('success')).not.toThrow();
    expect(() => haptic('warning')).not.toThrow();
  });
});
