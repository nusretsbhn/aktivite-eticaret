import { MapPin } from 'lucide-react';
import Link from 'next/link';

import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function formatTry(amount: number) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function getCoverImageUrl(a: AdminActivity): string {
  const images = (a.gallery ?? []).filter((g) => g.type === 'image');
  const cover = images.find((g) => g.isCover) ?? images.sort((x, y) => x.sortOrder - y.sortOrder)[0];
  return cover?.url ? String(cover.url) : '';
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — lokasyon bazlı aktivite önerileri */
export function HomeLocationWidget({
  activities,
  settings,
}: {
  activities: AdminActivity[];
  settings: AdminSettings;
}) {
  const active = (activities ?? []).filter((a) => a.isActive && String(a.location ?? '').trim());
  if (!active.length) return null;

  const subLabelMap = new Map<string, string>();
  for (const c of settings.categories ?? []) {
    for (const s of c.subcategories ?? []) {
      subLabelMap.set(s.id, s.name);
    }
  }

  const byLocation = new Map<string, AdminActivity[]>();
  for (const a of active) {
    const key = a.location.trim();
    const arr = byLocation.get(key) ?? [];
    arr.push(a);
    byLocation.set(key, arr);
  }

  const cards = [...byLocation.entries()]
    .map(([location, list]) => {
      const minPrice = list
        .flatMap((a) => a.prices ?? [])
        .map((p) => Number(p.price))
        .filter((n) => Number.isFinite(n) && n > 0)
        .sort((a, b) => a - b)[0];

      const subCounts = new Map<string, number>();
      for (const a of list) {
        for (const sid of a.subCategoryIds ?? []) {
          subCounts.set(sid, (subCounts.get(sid) ?? 0) + 1);
        }
      }
      const topSubs = [...subCounts.entries()]
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([sid]) => subLabelMap.get(sid) ?? sid);

      const cover =
        list.map(getCoverImageUrl).find(Boolean) ??
        '';

      return {
        location,
        totalTours: list.length,
        minPrice,
        topSubs,
        cover,
      };
    })
    .sort((a, b) => b.totalTours - a.totalTours)
    .slice(0, 8);

  if (!cards.length) return null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Lokasyona Göre Keşfet</h2>
          <p className="mt-1 text-sm text-zinc-600">Bulunduğunuz bölgeye göre öne çıkan kategoriler</p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {cards.map((c) => (
            <Link
              key={c.location}
              href={`/aktiviteler?location=${encodeURIComponent(c.location)}`}
              className="group relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-900 shadow-sm"
            >
              {c.cover ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={c.cover}
                  alt={c.location}
                  className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-[1.03]"
                />
              ) : (
                <div className="absolute inset-0 bg-gradient-to-br from-sky-700 to-indigo-900" />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/10" />

              <div className="relative p-4">
                <div className="mb-14 inline-flex items-center gap-1.5 rounded-full bg-white/90 px-2.5 py-1 text-xs font-semibold text-zinc-900">
                  <MapPin className="h-3.5 w-3.5" />
                  {c.location}
                </div>

                <div className="space-y-2">
                  <p className="text-lg font-extrabold text-white">{c.totalTours} tur</p>
                  <div className="flex flex-wrap gap-1.5">
                    {c.topSubs.map((s) => (
                      <span
                        key={s}
                        className="rounded-full border border-white/30 bg-white/10 px-2 py-0.5 text-[11px] font-medium text-white/95 backdrop-blur"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                  <p className="text-sm font-semibold text-emerald-300">
                    {typeof c.minPrice === 'number' ? `${formatTry(c.minPrice)} TRY` : 'Fiyat yok'}{' '}
                    <span className="text-xs font-medium text-white/85">başlayan fiyatlarla</span>
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

