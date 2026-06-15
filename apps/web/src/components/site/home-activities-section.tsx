import { MapPin } from 'lucide-react';
import Link from 'next/link';

import { ActivityScheduleTimes } from '@/components/site/activity-schedule-times';
import { ACTIVITY_PRICE_CONTACT_LABEL, isActivityPricesHidden } from '@/lib/activity-price-visibility';
import { sortActiveActivitiesForHome } from '@/lib/home-activity-order';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function formatTry(amount: number) {
  const n = Number(amount) || 0;
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(n);
}

function getCoverImageUrl(a: AdminActivity) {
  const images = (a.gallery ?? []).filter((g) => g.type === 'image');
  const cover = images.find((g) => g.isCover) ?? images.sort((x, y) => x.sortOrder - y.sortOrder)[0];
  return cover?.url ? String(cover.url) : '';
}

function shortText(s: string, max = 120) {
  const t = String(s ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — ana sayfa aktivite vitrinleri */
export function HomeActivitiesSection({
  activities,
  settings,
}: {
  activities: AdminActivity[];
  settings: AdminSettings;
}) {
  const tagMap = new Map((settings.tags ?? []).map((t) => [t.id, t.name]));
  const today = toIsoDate(new Date());
  const list = sortActiveActivitiesForHome(
    activities ?? [],
    settings.siteManagement?.homeActivityOrder,
    12,
  );
  const hideActivityPrices = isActivityPricesHidden(settings);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">
              Aktiviteler
            </h2>
            <p className="mt-1 text-sm text-zinc-600">
              Popüler aktiviteleri kolayca keşfedin.
            </p>
          </div>
          <Link
            href="/aktiviteler"
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tümünü Gör
          </Link>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((a) => {
            const coverUrl = getCoverImageUrl(a);
            const tags = (a.tagIds ?? [])
              .map((id) => tagMap.get(id))
              .filter((x): x is string => Boolean(x))
              .slice(0, 3);

            const todayPrice = (a.prices ?? []).find((p) => String(p.date) === today)?.price;

            return (
              <Link
                key={a.id}
                href={`/aktiviteler?q=${encodeURIComponent(a.name)}`}
                className="block overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm"
              >
                <div className="relative">
                  {coverUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={coverUrl}
                      alt={a.name}
                      className="aspect-[16/10] w-full object-cover"
                    />
                  ) : (
                    <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500">
                      Kapak görseli yok
                    </div>
                  )}

                  {!!tags.length && (
                    <div className="absolute left-3 top-3 flex flex-wrap gap-1.5">
                      {tags.map((t) => (
                        <span
                          key={t}
                          className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm"
                        >
                          {t}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="p-4">
                  <div className="flex items-center gap-2 text-xs text-zinc-600">
                    <MapPin className="h-4 w-4 text-zinc-500" />
                    <span className="truncate">{a.location || '—'}</span>
                  </div>

                  <h3 className="mt-2 line-clamp-1 text-sm font-bold text-zinc-900">
                    {a.name}
                  </h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {shortText(a.description, 140) || ' '}
                  </p>

                  <div className="mt-3 text-[11px]">
                    <ActivityScheduleTimes activity={a} emptyClassName="text-zinc-500" />
                  </div>

                  <div className="my-4 h-px w-full bg-zinc-200" />

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs font-medium text-zinc-600">Bugün</p>
                    <p className="text-sm font-extrabold text-emerald-700">
                      {hideActivityPrices
                        ? ACTIVITY_PRICE_CONTACT_LABEL
                        : typeof todayPrice === 'number'
                          ? `${formatTry(todayPrice)} TRY`
                          : 'Fiyat yok'}
                    </p>
                  </div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}

