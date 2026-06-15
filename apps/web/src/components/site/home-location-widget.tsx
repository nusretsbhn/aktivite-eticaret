import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { collectActivityLocationTiles } from '@/lib/activity-home-widgets';
import { ACTIVITY_PRICE_CONTACT_LABEL, isActivityPricesHidden } from '@/lib/activity-price-visibility';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — lokasyon bazlı aktivite kartları */
export function HomeLocationWidget({
  activities,
  settings,
}: {
  activities: AdminActivity[];
  settings: AdminSettings;
}) {
  const tiles = collectActivityLocationTiles(activities, settings).slice(0, 8);
  const hideActivityPrices = isActivityPricesHidden(settings);
  if (!tiles.length) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Lokasyona Göre Keşfet</h2>
          <p className="mt-1 text-sm text-zinc-600">Aktivitelerin tanımlı lokasyonlarına göre keşfedin</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((c) => (
            <Link
              key={c.location}
              href={`/aktiviteler?location=${encodeURIComponent(c.location)}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={c.imageUrl}
                alt={c.location}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

              <div className="relative flex min-h-[190px] flex-col justify-end p-4">
                <span className="mb-auto inline-flex w-fit items-center gap-1 rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900">
                  <MapPin className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  {c.location}
                </span>
                <p className="text-lg font-extrabold text-white drop-shadow">{c.totalTours} tur</p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                  {hideActivityPrices ? (
                    ACTIVITY_PRICE_CONTACT_LABEL
                  ) : (
                    <>
                      {c.minPrice !== null ? `${formatTry(c.minPrice)} TRY` : 'Fiyat yok'}{' '}
                      <span className="text-xs font-medium text-white/85">’den başlayan fiyatlarla</span>
                    </>
                  )}
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
