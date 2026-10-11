import { describe, expect, it } from 'vitest';
import { appIconSupported, getAppIcon, setAppIcon } from './appIcon';
import { haptic } from './haptics';
import { addTileSupported, initShortcuts, pinWidgetSupported, requestAddTile, requestPinWidget } from './shortcuts';

describe('tarayıcıda yerel özellikler sessizce devre dışı', () => {
  it('uygulama simgesi', async () => {
    expect(appIconSupported()).toBe(false);
    expect(await setAppIcon('bilge')).toBe(false);
    expect(await getAppIcon()).toBeNull();
  });
  it('araç / kutucuk ekleme istekleri', async () => {
    await initShortcuts();
    expect(pinWidgetSupported()).toBe(false);
    expect(addTileSupported()).toBe(false);
    expect(await requestPinWidget()).toBe('unsupported');
    expect(await requestAddTile()).toBe('unsupported');
  });
  it('titreşim', () => {
    expect(() => haptic('light')).not.toThrow();
    expect(() => haptic('success')).not.toThrow();
    expect(() => haptic('warning')).not.toThrow();
  });
});
