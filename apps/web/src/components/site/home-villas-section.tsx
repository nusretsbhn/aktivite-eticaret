import Link from 'next/link';

import { HomeVillaCard } from '@/components/site/home-villa-card';
import {
  formatVillaPrice,
  getNightlyPriceForDate,
  todayIsoLocal,
} from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';
import type { AdminSettings } from '@/types/admin-settings';

type Props = {
  villas: AdminVilla[];
  settings: AdminSettings;
};

/** @siteProduct SITE_PRODUCT_VILLA_RENTAL — Villa kiralama ana sayfa alanı */
export function HomeVillasSection({ villas, settings }: Props) {
  const active = villas.filter((v) => v.isActive).slice(0, 6);
  const today = todayIsoLocal();
  const tagMap = new Map((settings.tags ?? []).map((t) => [t.id, t.name]));

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14">
        <div className="mb-5 flex items-start justify-between gap-4">
          <div>
            <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900">Villa kiralama</h2>
            <p className="mt-1 text-sm text-zinc-600">Seçili villalar ve konaklama seçenekleri</p>
          </div>
          <Link
            href="/villalar"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-zinc-300 px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50"
          >
            Tümünü Gör
          </Link>
        </div>

        {active.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-10 text-center text-sm text-zinc-500">
            Yakında listelenecek villalar burada görünecek. Yönetim panelinden aktif villa ekleyebilirsiniz.
          </div>
        ) : (
          <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {active.map((v) => {
              const amount = getNightlyPriceForDate(v, today);
              const priceLine = amount !== null ? formatVillaPrice(amount, v.paymentCurrency) : null;
              const priceHint =
                v.prices.length === 0
                  ? 'Gecelik fiyat için takvimden bakın'
                  : 'Bugün için fiyat tanımlı değil';
              return (
                <HomeVillaCard
                  key={v.id}
                  villa={v}
                  priceLine={priceLine}
                  priceHint={priceHint}
                  tags={(v.tagIds ?? [])
                    .map((id) => tagMap.get(id))
                    .filter((x): x is string => Boolean(x))
                    .slice(0, 3)}
                />
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}
