import type { AdminActivity } from '@/types/admin-activity';
import type { AdminPackage } from '@/types/admin-package';
import type { AdminSettings } from '@/types/admin-settings';

import { ACTIVITY_PRICE_CONTACT_LABEL, isActivityPricesHidden } from '@/lib/activity-price-visibility';
import { computePackagePriceForDate } from '@/lib/package-pricing';

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

function shortText(s: string, max = 120) {
  const t = String(s ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}…` : t;
}

/** @siteProduct SITE_PRODUCT_ACTIVITY — paket vitrinleri */
export function HomePackagesSection({
  packages,
  activities,
  settings,
}: {
  packages: AdminPackage[];
  activities: AdminActivity[];
  settings: AdminSettings;
}) {
  const hideActivityPrices = isActivityPricesHidden(settings);
  const today = toIsoDate(new Date());
  const list = (packages ?? [])
    .filter((p) => p && p.isActive)
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt))
    .slice(0, 12);

  if (!list.length) return null;

  const activityNameById = new Map((activities ?? []).map((a) => [a.id, a.name]));
  const activeActivities = (activities ?? []).filter((a) => a.isActive);

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Paketler</h2>
          <p className="mt-1 text-sm text-zinc-600">Birden fazla aktiviteyi tek üründe avantajlı keşfedin.</p>
        </div>

        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {list.map((p) => {
            const pricing = computePackagePriceForDate(p, activeActivities, today);
            const activityNames = p.activityIds.map((id) => activityNameById.get(id) ?? id).slice(0, 3);
            return (
              <article key={p.id} className="overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm">
                {p.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImageUrl} alt={p.name} className="aspect-[16/10] w-full object-cover" />
                ) : (
                  <div className="flex aspect-[16/10] w-full items-center justify-center bg-zinc-100 text-xs text-zinc-500">
                    Kapak görseli yok
                  </div>
                )}

                <div className="p-4">
                  <h3 className="line-clamp-1 text-sm font-bold text-zinc-900">{p.name}</h3>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">
                    {shortText(p.description, 140) || `${p.activityIds.length} aktiviteden oluşan paket.`}
                  </p>

                  <p className="mt-3 text-xs text-zinc-500">Aktiviteler: {p.activityIds.length}</p>
                  <p className="mt-1 line-clamp-2 text-xs text-zinc-600">{activityNames.join(', ')}</p>

                  <div className="my-4 h-px w-full bg-zinc-200" />

                  <div className="flex items-end justify-between gap-3">
                    <p className="text-xs font-medium text-zinc-600">Bugün paket fiyatı</p>
                    <p className="text-sm font-extrabold text-emerald-700">
                      {hideActivityPrices
                        ? ACTIVITY_PRICE_CONTACT_LABEL
                        : typeof pricing.total === 'number'
                          ? `${formatTry(pricing.total)} TRY`
                          : 'Hesaplanamadı'}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </div>
    </section>
  );
}

