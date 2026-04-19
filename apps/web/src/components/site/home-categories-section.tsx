'use client';

import Link from 'next/link';

import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function formatTry(amount: number) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function minPriceForActivities(list: AdminActivity[]) {
  let min: number | null = null;
  for (const a of list) {
    for (const p of a.prices ?? []) {
      const v = Number(p.price);
      if (!Number.isFinite(v) || v <= 0) continue;
      min = min === null ? v : Math.min(min, v);
    }
  }
  return min;
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — kategori şeridi */
export function HomeCategoriesSection({
  settings,
  activities,
}: {
  settings: AdminSettings;
  activities: AdminActivity[];
}) {
  const cats = settings.categories ?? [];
  const activeActs = (activities ?? []).filter((a) => a && a.isActive);

  const items = cats
    .flatMap((c) =>
      (c.subcategories ?? []).map((s) => {
        const actsInSub = activeActs.filter((a) => (a.subCategoryIds ?? []).includes(String(s.id)));
        const subCover = (s.coverImageUrl ?? '').trim();
        const catCover = (c.coverImageUrl ?? '').trim();
        return {
          id: s.id,
          name: c.name,
          coverImageUrl: subCover || catCover,
          description: (s.description ?? '').trim(),
          toursCount: actsInSub.length,
          minPrice: minPriceForActivities(actsInSub),
        };
      }),
    )
    .filter((x) => x.toursCount > 0)
    .sort((a, b) => b.toursCount - a.toursCount)
    .slice(0, 8);

  if (!items.length) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-8">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
            Popüler Destinasyonlar
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Türkiye’nin en güzel kıyılarında unutulmaz anılar biriktirin
          </p>
        </div>

        <div className="grid auto-rows-[190px] gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {items.map((it) => {
            return (
              <Link
                key={it.id}
                href={`/aktiviteler?subCategoryId=${encodeURIComponent(it.id)}`}
                className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm"
              >
                {it.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={it.coverImageUrl}
                    alt={it.name}
                    className="absolute inset-0 h-full w-full object-cover transition duration-500 ease-out will-change-transform group-hover:scale-[1.04] group-hover:blur-[1px]"
                  />
                ) : (
                  <div className="absolute inset-0 bg-zinc-200" />
                )}

                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />

                <div className="absolute left-3 top-3 inline-flex items-center gap-2 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900 shadow-sm">
                  <span className="text-[11px]">{it.toursCount} Tur</span>
                </div>

                <div className="absolute bottom-0 left-0 right-0 p-4">
                  <p className="text-lg font-extrabold leading-tight text-white drop-shadow">
                    {it.name}
                  </p>
                  {!!it.description && (
                    <p className="mt-1 line-clamp-1 text-xs text-white/85">{it.description}</p>
                  )}
                  <p className="mt-2 text-sm font-extrabold text-white drop-shadow">
                    {it.minPrice !== null ? `${formatTry(it.minPrice)} TRY` : '—'}{' '}
                    <span className="text-xs font-semibold text-white/85">’den başlayan fiyatlarla</span>
                  </p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

