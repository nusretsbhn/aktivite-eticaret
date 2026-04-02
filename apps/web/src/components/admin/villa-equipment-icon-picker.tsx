'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import type { LucideIcon } from 'lucide-react';
import {
  AirVent,
  Anchor,
  Armchair,
  Baby,
  Bath,
  Bed,
  BedDouble,
  Building2,
  Car,
  Coffee,
  CigaretteOff,
  Dog,
  Dumbbell,
  Fan,
  Flame,
  Flower2,
  GlassWater,
  Heart,
  Home,
  Key,
  LandPlot,
  MapPin,
  Microwave,
  Mountain,
  ParkingCircle,
  Refrigerator,
  Shield,
  Shirt,
  Snowflake,
  Sofa,
  Sparkles,
  Sun,
  TreePine,
  Tv,
  Umbrella,
  Users,
  UtensilsCrossed,
  VolumeX,
  Waves,
  Wifi,
  Wind,
  Wine,
} from 'lucide-react';

export const VILLA_EQUIPMENT_ICON_PREFIX = 'lucide:';

export type VillaEquipmentIconOption = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

/** Otel / villa kiralama için seçilebilir ikonlar */
export const VILLA_EQUIPMENT_ICON_OPTIONS: VillaEquipmentIconOption[] = [
  { id: 'Wifi', label: 'Wi‑Fi', Icon: Wifi },
  { id: 'Tv', label: 'TV', Icon: Tv },
  { id: 'AirVent', label: 'Klima', Icon: AirVent },
  { id: 'Wind', label: 'Havalandırma', Icon: Wind },
  { id: 'Fan', label: 'Vantilatör', Icon: Fan },
  { id: 'Snowflake', label: 'Soğutma', Icon: Snowflake },
  { id: 'Flame', label: 'Isıtma', Icon: Flame },
  { id: 'Bath', label: 'Banyo', Icon: Bath },
  { id: 'Waves', label: 'Havuz / spa', Icon: Waves },
  { id: 'Bed', label: 'Tek kişilik yatak', Icon: Bed },
  { id: 'BedDouble', label: 'Çift kişilik yatak', Icon: BedDouble },
  { id: 'Sofa', label: 'Koltuk', Icon: Sofa },
  { id: 'Armchair', label: 'Berjer', Icon: Armchair },
  { id: 'UtensilsCrossed', label: 'Mutfak', Icon: UtensilsCrossed },
  { id: 'Microwave', label: 'Mikrodalga', Icon: Microwave },
  { id: 'Refrigerator', label: 'Buzdolabı', Icon: Refrigerator },
  { id: 'Coffee', label: 'Kahve', Icon: Coffee },
  { id: 'Wine', label: 'İçecek', Icon: Wine },
  { id: 'GlassWater', label: 'Su içme', Icon: GlassWater },
  { id: 'Shirt', label: 'Çamaşır', Icon: Shirt },
  { id: 'Sparkles', label: 'Temizlik', Icon: Sparkles },
  { id: 'Car', label: 'Araç', Icon: Car },
  { id: 'ParkingCircle', label: 'Otopark', Icon: ParkingCircle },
  { id: 'Home', label: 'Villa / konut', Icon: Home },
  { id: 'Building2', label: 'Bina', Icon: Building2 },
  { id: 'TreePine', label: 'Bahçe / doğa', Icon: TreePine },
  { id: 'LandPlot', label: 'Arsa / peyzaj', Icon: LandPlot },
  { id: 'Flower2', label: 'Çiçek', Icon: Flower2 },
  { id: 'Sun', label: 'Güneş / teras', Icon: Sun },
  { id: 'Umbrella', label: 'Şemsiye', Icon: Umbrella },
  { id: 'Mountain', label: 'Manzara', Icon: Mountain },
  { id: 'Anchor', label: 'Deniz / marina', Icon: Anchor },
  { id: 'Dumbbell', label: 'Spor', Icon: Dumbbell },
  { id: 'Baby', label: 'Çocuk', Icon: Baby },
  { id: 'Dog', label: 'Evcil hayvan', Icon: Dog },
  { id: 'Users', label: 'Misafir / kapasite', Icon: Users },
  { id: 'Shield', label: 'Güvenlik', Icon: Shield },
  { id: 'Key', label: 'Anahtar / giriş', Icon: Key },
  { id: 'MapPin', label: 'Konum', Icon: MapPin },
  { id: 'Heart', label: 'Favori', Icon: Heart },
  { id: 'VolumeX', label: 'Sessizlik', Icon: VolumeX },
  { id: 'CigaretteOff', label: 'Sigara içilmez', Icon: CigaretteOff },
];

const ICON_BY_ID = Object.fromEntries(VILLA_EQUIPMENT_ICON_OPTIONS.map((o) => [o.id, o.Icon])) as Record<
  string,
  LucideIcon
>;

export function parseVillaEquipmentIcon(value: string): { kind: 'lucide'; id: string } | { kind: 'legacy'; text: string } {
  const v = String(value ?? '').trim();
  if (v.startsWith(VILLA_EQUIPMENT_ICON_PREFIX)) {
    return { kind: 'lucide', id: v.slice(VILLA_EQUIPMENT_ICON_PREFIX.length) };
  }
  return { kind: 'legacy', text: v };
}

export function VillaEquipmentIconPreview({ value, className }: { value: string; className?: string }) {
  const parsed = parseVillaEquipmentIcon(value);
  if (parsed.kind === 'lucide') {
    const Icon = ICON_BY_ID[parsed.id];
    if (Icon) {
      return <Icon className={className ?? 'h-5 w-5 text-zinc-700 dark:text-zinc-200'} aria-hidden />;
    }
  }
  if (parsed.kind === 'legacy' && parsed.text) {
    return (
      <span className={`inline-flex min-h-[2.25rem] min-w-[2.25rem] items-center justify-center rounded-lg border border-zinc-200 bg-zinc-50 text-lg dark:border-zinc-600 dark:bg-zinc-800 ${className ?? ''}`}>
        {parsed.text.slice(0, 2)}
      </span>
    );
  }
  return (
    <span className={`text-xs text-zinc-400 dark:text-zinc-500 ${className ?? ''}`}>—</span>
  );
}

export function VillaEquipmentIconField({
  value,
  onChange,
}: {
  value: string;
  onChange: (next: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    function onDocMouseDown(e: MouseEvent) {
      const el = rootRef.current;
      if (el && !el.contains(e.target as Node)) close();
    }
    function onEsc(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
    }
    document.addEventListener('mousedown', onDocMouseDown);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('mousedown', onDocMouseDown);
      document.removeEventListener('keydown', onEsc);
    };
  }, [open, close]);

  const parsed = parseVillaEquipmentIcon(value);
  const hasIcon = parsed.kind === 'lucide' && ICON_BY_ID[parsed.id];

  return (
    <div ref={rootRef} className="relative shrink-0">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex h-11 min-w-[5.5rem] items-center justify-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 text-sm font-medium text-zinc-800 transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:bg-zinc-800"
        aria-expanded={open}
        aria-haspopup="dialog"
      >
        {hasIcon ? (
          <VillaEquipmentIconPreview value={value} />
        ) : (
          <span className="text-xs text-zinc-500 dark:text-zinc-400">İkon seç</span>
        )}
      </button>

      {open && (
        <>
          <div
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-[1px]"
            aria-hidden
            onClick={() => close()}
          />
          <div
            className="fixed left-1/2 top-1/2 z-[101] max-h-[min(70vh,520px)] w-[min(96vw,420px)] -translate-x-1/2 -translate-y-1/2 overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-xl dark:border-zinc-700 dark:bg-zinc-900"
            role="dialog"
            aria-label="İkon seçin"
          >
            <div className="border-b border-zinc-200 px-4 py-3 dark:border-zinc-700">
              <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">İkon seçin</p>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">Otel ve villa donanımına uygun ikonlar</p>
            </div>
            <div className="max-h-[min(60vh,440px)] overflow-y-auto p-3">
              <div className="grid grid-cols-4 gap-2 sm:grid-cols-5">
                {VILLA_EQUIPMENT_ICON_OPTIONS.map((opt) => {
                  const selected =
                    parsed.kind === 'lucide' && parsed.id === opt.id;
                  return (
                    <button
                      key={opt.id}
                      type="button"
                      title={opt.label}
                      onClick={() => {
                        onChange(`${VILLA_EQUIPMENT_ICON_PREFIX}${opt.id}`);
                        close();
                      }}
                      className={`flex flex-col items-center gap-1 rounded-xl border p-2 text-center transition ${
                        selected
                          ? 'border-blue-500 bg-blue-50 dark:border-blue-400 dark:bg-blue-950/50'
                          : 'border-zinc-200 bg-zinc-50 hover:border-zinc-300 hover:bg-white dark:border-zinc-700 dark:bg-zinc-950 dark:hover:border-zinc-600'
                      }`}
                    >
                      <opt.Icon className="h-5 w-5 text-zinc-800 dark:text-zinc-100" aria-hidden />
                      <span className="line-clamp-2 text-[10px] font-medium leading-tight text-zinc-600 dark:text-zinc-300">
                        {opt.label}
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>
            <div className="border-t border-zinc-200 px-3 py-2 dark:border-zinc-700">
              <button
                type="button"
                onClick={() => {
                  onChange('');
                  close();
                }}
                className="w-full rounded-lg py-2 text-xs font-medium text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                İkonu kaldır
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
