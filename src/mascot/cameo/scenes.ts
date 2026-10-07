/**
 * Misafir maskot sahneleri: hangi ekranda, günün hangi saatinde, kimlerle ve ne diyerek.
 * Saf veri + küçük yardımcılar (tarayıcıya dokunmaz; testler kullanır).
 */
import type { Screen } from '../../ui/nav';
import { CHARACTERS, type Lang, type MascotKey } from '../characters';

export type SceneId = 'hide' | 'cards' | 'coins' | 'sleep' | 'ball' | 'coffee';
export type Place = 'ledge' | 'br' | 'bl';

export interface SceneDef {
  id: SceneId;
  screen: Screen;
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
  sleep: { id: 'sleep', screen: 'reports', hours: [[15, 24]], pref: ['diken', 'bilge', 'ceviz', 'karamel', 'fistik'], guests: 1, place: 'br', w: 78 },
  cards: { id: 'cards', screen: 'budget', hours: [[16, 24]], pref: ['fistik', 'karamel', 'ceviz', 'diken', 'bilge'], guests: 2, place: 'br', w: 92 },
  coins: { id: 'coins', screen: 'invest', hours: [[8, 21]], pref: ['bilge', 'ceviz', 'diken', 'karamel', 'fistik'], guests: 1, place: 'bl', w: 84 },
  hide: { id: 'hide', screen: 'home', hours: [[8, 22]], pref: ['ceviz', 'karamel', 'fistik', 'diken', 'bilge'], guests: 1, place: 'ledge', w: 78 },
  ball: { id: 'ball', screen: 'tx', hours: [[8, 21]], pref: ['fistik', 'karamel', 'ceviz', 'diken', 'bilge'], guests: 1, place: 'br', w: 84 },
  // Kahve: sabah ya da akşam
  coffee: { id: 'coffee', screen: 'home', hours: [[6, 10], [17, 21]], pref: ['diken', 'fistik', 'bilge', 'karamel', 'ceviz'], guests: 1, place: 'bl', w: 84 },
};
export const SCENE_IDS = Object.keys(SCENES) as SceneId[];

/** Hata ayıklama: ?cameo=sleep gibi kısa adlar (ve kendi kimlikleri) */
export const FORCE_ALIASES: Record<string, SceneId> = {
  sleep: 'sleep', sleeper: 'sleep', cards: 'cards', coins: 'coins', hide: 'hide', hider: 'hide', ball: 'ball', coffee: 'coffee',
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
      return tr ? 'Henüz işlem yok. Top oynayalım mı?' : 'No entries yet. Shall we play ball?';
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
