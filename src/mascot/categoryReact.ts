/**
 * Kayıt sonrası maskot tepkisi: kategoriye göre anlamlı, kısa bir hareket seçer.
 * Saf modül (tarayıcıya dokunmaz): eşleme simge anahtarından yapılır; kullanıcının kendi
 * kategorileri de bir simge seçtiği için aynı tepkiyi alır. Simge genel ise ("dots") ad
 * içindeki anahtar sözcüklere (TR/EN) bakılır. Hiçbiri tutmazsa eski "not alma" hareketi.
 */
import type { ActionName } from './actions';

/** Kategori tepkisi: kaydı anlatan küçük bir sahne. */
export type CategoryReaction =
  | 'sip' | 'munch' | 'bag' | 'drive' | 'zoom' | 'fly' | 'house' | 'bulb' | 'groove'
  | 'buzz' | 'tryhat' | 'read' | 'heart' | 'gift' | 'pocket' | 'happynod';

/** Simge anahtarı → tepki (ui/icons.tsx CATEGORY_ICONS anahtarları). */
export const ICON_REACTIONS: Record<string, CategoryReaction | 'tailwag'> = {
  coffee: 'sip',
  utensils: 'munch',
  basket: 'bag',
  bus: 'drive',
  car: 'zoom',
  fuel: 'zoom',
  plane: 'fly',
  home: 'house',
  bolt: 'bulb',
  ticket: 'groove',
  game: 'groove',
  music: 'groove',
  repeat: 'buzz',
  phone: 'buzz',
  laptop: 'buzz',
  shirt: 'tryhat',
  scissors: 'tryhat',
  book: 'read',
  grad: 'read',
  heart: 'heart',
  pill: 'heart',
  gym: 'heart',
  sparkles: 'heart',
  baby: 'heart',
  gift: 'gift',
  pet: 'tailwag',
};

/** Genel simgeli (ör. "dots") kategoriler için ad ipuçları. Sıra önemli: ilk eşleşen kazanır. */
const NAME_HINTS: [RegExp, CategoryReaction][] = [
  [/kahve|kafe|cafe|coffee|çay|\btea\b|latte/i, 'sip'],
  [/yemek|food|lunch|dinner|yemekhane|döner|pizza|burger|simit|restoran|restaurant|snack|atıştır/i, 'munch'],
  [/market|grocer|bakkal|manav|süpermarket/i, 'bag'],
  [/otobüs|metro|ulaşım|transport|\bbus|tram|tramvay|dolmuş|taksi|taxi|uber|bisiklet|bike|scooter/i, 'drive'],
  [/benzin|yakıt|fuel|araba|\bcars?\b|otopark|parking/i, 'zoom'],
  [/uçak|uçuş|flight|plane|tatil|travel|seyahat/i, 'fly'],
  [/kira|\brent|yurt|dorm|\bev\b|house/i, 'house'],
  [/fatura|bill|elektrik|electric|su\b|water|doğalgaz|gas/i, 'bulb'],
  [/eğlence|\bfun\b|sinema|cinema|movie|konser|concert|oyun|game|parti|party/i, 'groove'],
  [/abonelik|subscri|netflix|spotify|telefon|phone|internet|mobil/i, 'buzz'],
  [/giyim|kıyafet|cloth|ayakkabı|shoe|kuaför|berber|hair/i, 'tryhat'],
  [/okul|school|kitap|book|kurs|course|kırtasiye|stationery/i, 'read'],
  [/sağlık|health|ilaç|eczane|pharma|doktor|doctor|spor|gym/i, 'heart'],
  [/hediye|gift|doğum günü|birthday/i, 'gift'],
];

export interface ReactionInput {
  type: 'expense' | 'income' | 'refund';
  /** Kategorinin simge anahtarı (yoksa undefined) */
  icon?: string;
  /** Kategorinin adı (özel kategorilerde ipucu) */
  name?: string;
}

/**
 * Kayıt türü + kategori → oynanacak hareket.
 * `fallback`: eşleşme yoksa (ör. "Diğer") kullanılacak hareket.
 */
export function reactionFor(input: ReactionInput, fallback: ActionName = 'note'): ActionName {
  if (input.type === 'income') return 'pocket';
  if (input.type === 'refund') return 'happynod';
  const byIcon = input.icon && input.icon !== 'dots' ? ICON_REACTIONS[input.icon] : undefined;
  if (byIcon) return byIcon;
  const name = input.name?.trim();
  if (name) for (const [re, r] of NAME_HINTS) if (re.test(name)) return r;
  return fallback;
}
