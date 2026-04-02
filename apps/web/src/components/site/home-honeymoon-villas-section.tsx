import Link from 'next/link';

import { HomeVillaCard } from '@/components/site/home-villa-card';
import { formatVillaPrice, getNightlyPriceForDate, todayIsoLocal } from '@/lib/villa-public-pricing';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

type Props = {
  villas: AdminVilla[];
  settings: AdminSettings;
};

function findHoneymoonTagId(settings: AdminSettings): string | null {
  const tags = settings.tags ?? [];
  const target = 'balayı villası';
  const hit = tags.find((t) => String(t.name ?? '').trim().toLocaleLowerCase('tr') === target);
  return hit?.id ?? null;
}

/** @siteProduct SITE_PRODUCT_VILLA_RENTAL — Balayı villaları vitrin */
export function HomeHoneymoonVillasSection({ villas, settings }: Props) {
  const tagId = findHoneymoonTagId(settings);
  const tagMap = new Map((settings.tags ?? []).map((t) => [t.id, t.name]));

  const list = (villas ?? [])
    .filter((v) => v.isActive)
    .filter((v) => (tagId ? (v.tagIds ?? []).includes(tagId) : false))
    .slice(0, 6);

  if (!tagId || list.length === 0) return null;

  const today = todayIsoLocal();

  return (
    <section className="relative overflow-hidden bg-white">
      <div className="absolute inset-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_15%,rgba(244,63,94,0.18),transparent_55%),radial-gradient(circle_at_80%_20%,rgba(236,72,153,0.14),transparent_55%),radial-gradient(circle_at_50%_85%,rgba(250,204,21,0.10),transparent_55%)]" />
        <div className="absolute inset-0 bg-gradient-to-b from-white via-rose-50/40 to-white" />
      </div>

      <div className="relative mx-auto max-w-6xl px-4 py-14">
        <div className="mb-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-end">
          <div>
            <p className="inline-flex items-center rounded-full bg-white/80 px-3 py-1 text-xs font-semibold text-rose-700 shadow-sm ring-1 ring-rose-100">
              Balayı Özel
            </p>
            <h2 className="mt-3 text-2xl font-extrabold tracking-tight text-zinc-900 sm:text-3xl">
              Balayı villaları
            </h2>
            <p className="mt-2 max-w-2xl text-sm leading-relaxed text-zinc-600">
              Romantik kaçamaklar için seçilmiş, konforlu ve özel villalar.
            </p>
          </div>
          <Link
            href="/villalar"
            className="inline-flex min-h-11 shrink-0 items-center rounded-lg border border-rose-200 bg-white/80 px-4 py-2 text-sm font-medium text-rose-700 shadow-sm hover:bg-white"
          >
            Tüm villalar
          </Link>
        </div>

        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {list.map((v) => {
            const amount = getNightlyPriceForDate(v, today);
            const priceLine = amount !== null ? formatVillaPrice(amount, v.paymentCurrency) : null;
            const priceHint = v.prices.length === 0 ? 'Gecelik fiyat için takvimden bakın' : 'Bugün için fiyat tanımlı değil';
            const tags = (v.tagIds ?? [])
              .map((id) => tagMap.get(id))
              .filter((x): x is string => Boolean(x))
              .slice(0, 3);
            return <HomeVillaCard key={v.id} villa={v} priceLine={priceLine} priceHint={priceHint} tags={tags} />;
          })}
        </div>
      </div>
    </section>
  );
}

