/**
 * Misafir maskot sahneleri: hangi ekranda, günün hangi saatinde, kimlerle ve ne diyerek.
 * Saf veri + küçük yardımcılar (tarayıcıya dokunmaz; testler kullanır).
 */
import type { Screen } from '../../ui/nav';
import { CHARACTERS, type Lang, type MascotKey } from '../characters';

export type SceneId = 'hide' | 'cards' | 'coins' | 'sleep' | 'ball' | 'coffee' | 'chat';
/** note: ana ekrandaki maskot notunun yanında (sohbet) */
export type Place = 'ledge' | 'br' | 'bl' | 'note';

export interface SceneDef {
  id: SceneId;
  /** Görünebileceği ekranlar (yalnız okunur ekranlar) */
  screens: Screen[];
  /** Yerel saat aralıkları [başlangıç, bitiş) — saat 0–23 */
  hours: [number, number][];
  /** Misafir tercih sırası; seçili maskot elenir */
  pref: MascotKey[];
  guests: 1 | 2;
  place: Place;
  /** SVG'nin ekrandaki genişliği (px) */
  w: number;
}

export const SCENES: Record<SceneId, SceneDef> = {
  // Uyku: sabah (12'den önce) asla; öğleden sonra geç saatlere kadar
  sleep: { id: 'sleep', screens: ['reports', 'invest'], hours: [[15, 24]], pref: ['diken', 'bilge', 'pamuk', 'ceviz', 'karamel', 'fistik'], guests: 1, place: 'br', w: 78 },
  cards: { id: 'cards', screens: ['budget'], hours: [[12, 24]], pref: ['fistik', 'pamuk', 'karamel', 'ceviz', 'diken', 'bilge'], guests: 2, place: 'br', w: 92 },
  coins: { id: 'coins', screens: ['invest', 'budget', 'reports'], hours: [[8, 21]], pref: ['bilge', 'ceviz', 'diken', 'pamuk', 'karamel', 'fistik'], guests: 1, place: 'bl', w: 84 },
  // Uygun kart yoksa köşede saklanır
  hide: { id: 'hide', screens: ['home'], hours: [[8, 24]], pref: ['ceviz', 'pamuk', 'karamel', 'fistik', 'diken', 'bilge'], guests: 1, place: 'ledge', w: 78 },
  ball: { id: 'ball', screens: ['tx'], hours: [[6, 24]], pref: ['fistik', 'karamel', 'pamuk', 'ceviz', 'diken', 'bilge'], guests: 1, place: 'br', w: 84 },
  // Kahve: sabah ya da akşam
  coffee: { id: 'coffee', screens: ['home', 'budget', 'reports', 'invest'], hours: [[6, 10], [17, 21]], pref: ['diken', 'pamuk', 'fistik', 'bilge', 'karamel', 'ceviz'], guests: 1, place: 'bl', w: 84 },
  // Sohbet: misafir ana maskotun yanına gelir, kısa bir karşılıklı konuşma (chat.ts). Misafir rastgele seçilir.
  chat: { id: 'chat', screens: ['home'], hours: [[7, 23]], pref: ['karamel', 'pamuk', 'ceviz', 'bilge', 'diken', 'fistik'], guests: 1, place: 'note', w: 48 },
};
/** Sahnelerin çıkabildiği ekranlar */
export const CAMEO_SCREENS: Screen[] = ['home', 'tx', 'budget', 'reports', 'invest'];
export const SCENE_IDS = Object.keys(SCENES) as SceneId[];

/** Hata ayıklama: ?cameo=sleep gibi kısa adlar (ve kendi kimlikleri) */
export const FORCE_ALIASES: Record<string, SceneId> = {
  sleep: 'sleep', sleeper: 'sleep', cards: 'cards', coins: 'coins', hide: 'hide', hider: 'hide', ball: 'ball', coffee: 'coffee', chat: 'chat', talk: 'chat',
};

export const hourFits = (def: SceneDef, hour: number) => def.hours.some(([a, b]) => hour >= a && hour < b);

/** Seçili maskot dışındaki tercih sırasından misafirler. */
export function guestsFor(id: SceneId, main: MascotKey): MascotKey[] {
  const def = SCENES[id];
  return def.pref.filter((k) => k !== main).slice(0, def.guests);
}

const TREAT: Record<MascotKey, L2> = {
  ceviz: { tr: 'cevizi', en: 'the walnut' },
  karamel: { tr: 'kemiği', en: 'the bone' },
  fistik: { tr: 'balığı', en: 'the fish' },
  diken: { tr: 'elmayı', en: 'the apple' },
  bilge: { tr: 'tohumu', en: 'the seed' },
  pamuk: { tr: 'havucu', en: 'the carrot' },
};
type L2 = Record<Lang, string>;

/** Kısa baloncuk cümlesi (sabah/akşam gibi dilimler için `hour`). */
export function captionFor(id: SceneId, guests: MascotKey[], lang: Lang, hour: number): string {
  const tr = lang === 'tr';
  switch (id) {
    case 'sleep':
      return tr ? 'Raporlar sakin… zzz' : 'Quiet reports… zzz';
    case 'cards':
      return tr ? 'Kağıt oynuyoruz. Bütçe sende, merak etme!' : "Playing cards. The budget's yours, don't worry!";
    case 'coins':
      return tr ? 'Bir, iki, üç… kuruşlar eksiksiz.' : 'One, two, three… every coin accounted for.';
    case 'hide': {
      const t = TREAT[guests[0]][lang];
      return tr ? `${t[0].toLocaleUpperCase('tr')}${t.slice(1)} buraya saklıyorum. Sakın söyleme!` : `Hiding ${t} here. Don't tell!`;
    }
    case 'ball':
      return tr ? 'Kısa bir mola. Top oynayalım mı?' : 'Quick break. Shall we play ball?';
    case 'chat':
      return tr ? 'Selam! Bir uğrayayım dedim.' : 'Hi! Thought I would drop by.';
    case 'coffee':
      if (hour < 12) return tr ? 'Günaydın! İlk kahve benden.' : 'Good morning! First coffee is on me.';
      return tr ? 'Kahve molası. Sen de bir nefes al!' : 'Coffee break. Take a breath too!';
  }
}

/** Ekran okuyucu için tek satır. */
export function srLine(id: SceneId, guests: MascotKey[], lang: Lang, hour: number): string {
  const names = guests.map((k) => CHARACTERS[k].name[lang]).join(lang === 'tr' ? ' ve ' : ' and ');
  return `${names}: ${captionFor(id, guests, lang, hour)}`;
}
