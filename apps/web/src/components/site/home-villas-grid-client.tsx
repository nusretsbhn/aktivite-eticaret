'use client';

import { useState } from 'react';

import { HomeVillaCard } from '@/components/site/home-villa-card';
import { formatVillaPrice, getNightlyPriceForDate, todayIsoLocal } from '@/lib/villa-public-pricing';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

const PAGE_SIZE = 6;

type Props = {
  villas: AdminVilla[];
  settings: AdminSettings;
};

export function HomeVillasGridClient({ villas, settings }: Props) {
  const [visibleCount, setVisibleCount] = useState(PAGE_SIZE);
  const today = todayIsoLocal();
  const tagMap = new Map((settings.tags ?? []).map((t) => [t.id, t.name]));
  const shown = villas.slice(0, visibleCount);
  const hasMore = visibleCount < villas.length;

  return (
    <>
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {shown.map((v) => {
          const amount = getNightlyPriceForDate(v, today);
          const priceLine = amount !== null ? formatVillaPrice(amount, v.paymentCurrency) : null;
          const priceHint =
            v.prices.length === 0 ? 'Gecelik fiyat için takvimden bakın' : 'Bugün için fiyat tanımlı değil';
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
      {hasMore && (
        <div className="mt-8 flex justify-center">
          <button
            type="button"
            onClick={() => setVisibleCount((n) => Math.min(n + PAGE_SIZE, villas.length))}
            className="inline-flex min-h-11 items-center rounded-lg border border-zinc-300 bg-white px-6 py-2.5 text-sm font-medium text-zinc-800 shadow-sm transition hover:bg-zinc-50 dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800"
          >
            Daha fazla
          </button>
        </div>
      )}
    </>
  );
}
