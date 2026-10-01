import {
  Utensils, ShoppingBasket, Bus, House, Zap, Repeat, Smartphone, BookOpen, Ticket, Shirt, HeartPulse, Gift,
  CircleEllipsis, GraduationCap, HandHeart, Briefcase, Coffee, Dumbbell, PawPrint, Plane, Gamepad2, Wallet, Landmark,
  Sprout, Banknote, Music, Laptop, Pill, Baby, Scissors, Car, Fuel, Sparkles, UserRound, type LucideIcon,
} from 'lucide-react';

/** Kategori simgeleri (kayıtta yalnızca anahtar tutulur). */
export const CATEGORY_ICONS: Record<string, LucideIcon> = {
  utensils: Utensils, basket: ShoppingBasket, bus: Bus, home: House, bolt: Zap, repeat: Repeat, phone: Smartphone,
  book: BookOpen, ticket: Ticket, shirt: Shirt, heart: HeartPulse, gift: Gift, dots: CircleEllipsis, grad: GraduationCap,
  hand: HandHeart, briefcase: Briefcase, coffee: Coffee, gym: Dumbbell, pet: PawPrint, plane: Plane, game: Gamepad2,
  music: Music, laptop: Laptop, pill: Pill, baby: Baby, scissors: Scissors, car: Car, fuel: Fuel, sparkles: Sparkles,
  wallet: Wallet, bank: Landmark, sprout: Sprout, cash: Banknote,
};

export const CATEGORY_COLORS = ['#E0784F', '#6E9E5B', '#4F86C6', '#8C6BB1', '#D9A33B', '#C2577A', '#3C9C9A', '#5B6BBF', '#E2594B', '#A0785A', '#D2667A', '#8A857C'];

export function CatIcon({ icon, size = 18 }: { icon: string; size?: number }) {
  const I = CATEGORY_ICONS[icon] ?? CircleEllipsis;
  return <I size={size} strokeWidth={2} aria-hidden />;
}

export const ACCOUNT_ICONS = { cash: Banknote, bank: Landmark, investment: Sprout, person: UserRound } as const;
