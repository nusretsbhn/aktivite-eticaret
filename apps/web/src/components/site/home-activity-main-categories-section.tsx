import Link from 'next/link';

import { collectActivityMainCategoryTiles } from '@/lib/activity-home-widgets';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — birincil kategori kartları */
export function HomeActivityMainCategoriesSection({
  activities,
  settings,
}: {
  activities: AdminActivity[];
  settings: AdminSettings;
}) {
  const tiles = collectActivityMainCategoryTiles(activities, settings).slice(0, 8);
  if (!tiles.length) return null;

  return (
    <section className="bg-zinc-50">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Kategorilere Göre Keşfet</h2>
          <p className="mt-1 text-sm text-zinc-600">Birincil kategorilere göre öne çıkan aktiviteler</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {tiles.map((t) => (
            <Link
              key={t.categoryId}
              href={`/aktiviteler?mainCategory=${encodeURIComponent(t.categoryId)}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={t.imageUrl}
                alt={t.name}
                className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.04]"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/35 to-black/10" />

              <div className="relative flex min-h-[190px] flex-col justify-end p-4">
                <span className="mb-auto inline-flex w-fit rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900">
                  {t.totalTours} tur
                </span>
                <p className="text-lg font-extrabold leading-tight text-white drop-shadow">{t.name}</p>
                <p className="mt-2 text-sm font-semibold text-emerald-300">
                  {t.minPrice !== null ? `${formatTry(t.minPrice)} TRY` : 'Fiyat yok'}{' '}
                  <span className="text-xs font-medium text-white/85">’den başlayan fiyatlarla</span>
                </p>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
