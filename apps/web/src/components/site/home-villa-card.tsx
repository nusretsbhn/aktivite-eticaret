'use client';

import Link from 'next/link';
import { Bath, BedDouble, Users } from 'lucide-react';

import { VillaEquipmentIconPreview } from '@/components/admin/villa-equipment-icon-picker';
import type { AdminVilla } from '@/types/admin-villa';

type Props = {
  villa: AdminVilla;
  /** Bugün için tanımlı gecelik fiyat metni (sunucuda hesaplanır) */
  priceLine: string | null;
  /** Fiyat yoksa kısa açıklama */
  priceHint: string;
  /** Ayarlar → Etiket’ten eşlenen etiket adları */
  tags?: string[];
};

export function HomeVillaCard({ villa, priceLine, priceHint, tags }: Props) {
  const cover =
    villa.gallery.find((g) => g.isCover && g.type === 'image')?.url ??
    villa.gallery.find((g) => g.type === 'image')?.url ??
    null;

  const locationLine = [villa.city, villa.district, villa.region].filter(Boolean).join(' / ');
  const featured = villa.featuredItems ?? [];
  const show = featured.slice(0, 3);
  const rest = Math.max(0, featured.length - 3);

  return (
    <Link
      href={`/villalar/${encodeURIComponent(villa.slug)}`}
      className="group flex flex-col overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:border-amber-200 hover:shadow-md"
    >
      <div className="relative aspect-[16/10] w-full bg-zinc-100">
        {!!(priceLine || priceHint) && (tags?.length ?? 0) > 0 ? (
          <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
            {(tags ?? []).slice(0, 3).map((t) => (
              <span
                key={t}
                className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm"
              >
                {t}
              </span>
            ))}
          </div>
        ) : null}
        {cover ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cover}
            alt=""
            className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div className="flex h-full min-h-[140px] items-center justify-center text-xs text-zinc-400">Görsel yok</div>
        )}
      </div>

      <div className="flex flex-1 flex-col p-4">
        <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Villa</p>
        <h3 className="mt-1 text-lg font-bold tracking-tight text-zinc-900 group-hover:text-amber-900">{villa.displayName}</h3>
        <p className="mt-1 text-sm text-zinc-600">{locationLine}</p>

        <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-zinc-700">
          <li className="flex items-center gap-1.5">
            <Users className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>Kapasite {villa.guestCount} kişi</span>
          </li>
          <li className="flex items-center gap-1.5">
            <BedDouble className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>{villa.bedroomCount} yatak odası</span>
          </li>
          <li className="flex items-center gap-1.5">
            <Bath className="h-4 w-4 shrink-0 text-amber-700" aria-hidden />
            <span>{villa.bathroomCount} banyo</span>
          </li>
        </ul>

        {featured.length > 0 && (
          <div className="mt-4 border-t border-zinc-100 pt-3">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-zinc-500">Öne çıkan özellikler</p>
            <div className="mt-2 flex flex-wrap items-center gap-2">
              {show.map((it) => (
                <span
                  key={it.id}
                  className="inline-flex items-center gap-1.5 rounded-full border border-zinc-200 bg-zinc-50 px-2.5 py-1 text-xs font-medium text-zinc-800"
                  title={it.description}
                >
                  <VillaEquipmentIconPreview value={it.icon} className="h-3.5 w-3.5 text-amber-800" />
                  <span className="line-clamp-1 max-w-[7rem]">{it.description}</span>
                </span>
              ))}
              {rest > 0 && (
                <span className="rounded-full bg-amber-100 px-2.5 py-1 text-xs font-semibold text-amber-900">+{rest}</span>
              )}
            </div>
          </div>
        )}

        <div className="mt-auto border-t border-zinc-100 pt-4">
          {priceLine ? (
            <p className="text-lg font-bold tabular-nums text-zinc-900">
              {priceLine}
              <span className="ml-1 text-sm font-semibold text-zinc-500">/ gece</span>
            </p>
          ) : (
            <p className="text-sm font-medium text-zinc-500">{priceHint}</p>
          )}
          <p className="mt-1 text-xs text-zinc-500">Min. {villa.minStayNights} gece konaklama</p>
        </div>
      </div>
    </Link>
  );
}
