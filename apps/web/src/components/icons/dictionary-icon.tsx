'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Accessibility,
  Anchor,
  Banknote,
  Bike,
  Building2,
  Bus,
  Camera,
  Car,
  CircleDot,
  Clock,
  CloudSun,
  Coffee,
  Cookie,
  CupSoda,
  Droplets,
  Fish,
  Footprints,
  Gift,
  GlassWater,
  Heart,
  Image as ImageIcon,
  Landmark,
  MapPin,
  Martini,
  Mountain,
  Music,
  Palmtree,
  Phone,
  Plane,
  Sailboat,
  Shield,
  Ship,
  ShoppingBag,
  Soup,
  Star,
  Sun,
  Ticket,
  Umbrella,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Waves,
  Wifi,
  Wine,
} from 'lucide-react';

/** Lucide bileşen adı → bileşen (sözlük ve formlarda kullanılır) */
export const DICTIONARY_ICON_MAP: Record<string, LucideIcon> = {
  Accessibility,
  Anchor,
  Banknote,
  Bike,
  Building2,
  Bus,
  Camera,
  Car,
  CircleDot,
  Clock,
  CloudSun,
  Coffee,
  Cookie,
  CupSoda,
  Droplets,
  Fish,
  Footprints,
  Gift,
  GlassWater,
  Heart,
  Image: ImageIcon,
  Landmark,
  MapPin,
  Martini,
  Mountain,
  Music,
  Palmtree,
  Phone,
  Plane,
  Sailboat,
  Shield,
  Ship,
  ShoppingBag,
  Soup,
  Star,
  Sun,
  Ticket,
  Umbrella,
  User,
  Users,
  Utensils,
  UtensilsCrossed,
  Wallet,
  Waves,
  Wifi,
  Wine,
};

export type DictionaryIconKey = keyof typeof DICTIONARY_ICON_MAP;

/** Seçenek listesi: Lucide ikon adı + kısa Türkçe ipucu */
export const LUCIDE_ICON_PICKER_OPTIONS: { key: DictionaryIconKey; hint: string }[] = [
  { key: 'Utensils', hint: 'Yemek' },
  { key: 'UtensilsCrossed', hint: 'Restoran' },
  { key: 'Soup', hint: 'Çorba' },
  { key: 'Cookie', hint: 'Atıştırmalık' },
  { key: 'Coffee', hint: 'Çay / kahve' },
  { key: 'CupSoda', hint: 'İçecek' },
  { key: 'GlassWater', hint: 'Su / meşrubat' },
  { key: 'Wine', hint: 'Şarap' },
  { key: 'Martini', hint: 'Kokteyl' },
  { key: 'Ship', hint: 'Tekne / tur' },
  { key: 'Sailboat', hint: 'Yelken' },
  { key: 'Anchor', hint: 'Liman' },
  { key: 'Waves', hint: 'Deniz' },
  { key: 'Fish', hint: 'Balık / dalış' },
  { key: 'Palmtree', hint: 'Plaj' },
  { key: 'Sun', hint: 'Güneş' },
  { key: 'CloudSun', hint: 'Hava' },
  { key: 'Umbrella', hint: 'Şemsiye' },
  { key: 'Mountain', hint: 'Dağ / doğa' },
  { key: 'MapPin', hint: 'Konum' },
  { key: 'Bus', hint: 'Transfer' },
  { key: 'Car', hint: 'Araç' },
  { key: 'Plane', hint: 'Uçak' },
  { key: 'Bike', hint: 'Bisiklet' },
  { key: 'Footprints', hint: 'Yürüyüş' },
  { key: 'User', hint: 'Rehber / kişi' },
  { key: 'Users', hint: 'Grup' },
  { key: 'Camera', hint: 'Fotoğraf' },
  { key: 'Image', hint: 'Görsel' },
  { key: 'Ticket', hint: 'Bilet' },
  { key: 'Shield', hint: 'Sigorta' },
  { key: 'Wifi', hint: 'Wi‑Fi' },
  { key: 'Music', hint: 'Müzik' },
  { key: 'Gift', hint: 'Hediye' },
  { key: 'Star', hint: 'Yıldız' },
  { key: 'Heart', hint: 'Favori' },
  { key: 'Phone', hint: 'İletişim' },
  { key: 'Clock', hint: 'Saat' },
  { key: 'Building2', hint: 'Bina' },
  { key: 'ShoppingBag', hint: 'Alışveriş' },
  { key: 'Banknote', hint: 'Bahşiş / nakit' },
  { key: 'Wallet', hint: 'Cüzdan / harcama' },
  { key: 'Landmark', hint: 'Kültür' },
  { key: 'Accessibility', hint: 'Erişim' },
  { key: 'Droplets', hint: 'İçecek' },
  { key: 'CircleDot', hint: 'Genel' },
];

const DefaultIcon = CircleDot;

type Props = {
  iconKey?: string | null;
  /** iconKey tanınmazsa gösterilir (eski emoji verileri) */
  fallbackEmoji?: string | null;
  className?: string;
  strokeWidth?: number;
};

export function DictionaryIcon({
  iconKey,
  fallbackEmoji,
  className = 'h-5 w-5 shrink-0 text-zinc-700 dark:text-zinc-300',
  strokeWidth = 1.75,
}: Props) {
  if (iconKey && DICTIONARY_ICON_MAP[iconKey]) {
    const Icon = DICTIONARY_ICON_MAP[iconKey];
    return <Icon className={className} strokeWidth={strokeWidth} aria-hidden />;
  }
  if (fallbackEmoji) {
    return (
      <span className="flex h-5 w-5 shrink-0 items-center justify-center text-base" aria-hidden>
        {fallbackEmoji}
      </span>
    );
  }
  return <DefaultIcon className={className} strokeWidth={strokeWidth} aria-hidden />;
}
