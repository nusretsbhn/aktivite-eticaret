'use client';

import Link from 'next/link';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { useMemo, useState } from 'react';

import { formatVillaPrice } from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';

type Item = {
  id: string;
  slug: string;
  displayName: string;
  city: string;
  district: string;
  region: string;
  guestCount: number;
  bedroomCount: number;
  bathroomCount: number;
  paymentCurrency: AdminVilla['paymentCurrency'];
  coverUrl: string | null;
  minNightly: number | null;
  maxNightly: number | null;
};

function coverUrl(v: AdminVilla): string | null {
  return (
    v.gallery.find((g) => g.isCover && g.type === 'image')?.url ??
    v.gallery.find((g) => g.type === 'image')?.url ??
    null
  );
}

function minMaxNightly(v: AdminVilla): { min: number; max: number } | null {
  const list = v.prices ?? [];
  if (!Array.isArray(list) || list.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const p of list) {
    if (!p || !Number.isFinite(p.price)) continue;
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return { min, max };
}

function clampIndex(i: number, len: number) {
  if (len <= 0) return 0;
  const m = i % len;
  return m < 0 ? m + len : m;
}

export function HomeVillaSpotlightWidget({ villas }: { villas: AdminVilla[] }) {
  const items = useMemo<Item[]>(() => {
    const base = (villas ?? []).filter((v) => v && v.isActive).slice(0, 3);
    return base.map((v) => {
      const mm = minMaxNightly(v);
      return {
        id: v.id,
        slug: v.slug,
        displayName: v.displayName,
        city: v.city,
        district: v.district,
        region: v.region,
        guestCount: v.guestCount,
        bedroomCount: v.bedroomCount,
        bathroomCount: v.bathroomCount,
        paymentCurrency: v.paymentCurrency,
        coverUrl: coverUrl(v),
        minNightly: mm?.min ?? null,
        maxNightly: mm?.max ?? null,
      };
    });
  }, [villas]);

  const [idx, setIdx] = useState(0);
  const safeIdx = clampIndex(idx, items.length);
  const active = items[safeIdx];

  if (!active) return null;

  const loc = [active.city, active.district, active.region].filter(Boolean).join(' / ');
  const price =
    active.minNightly != null && active.maxNightly != null
      ? `${formatVillaPrice(active.minNightly, active.paymentCurrency)} – ${formatVillaPrice(active.maxNightly, active.paymentCurrency)}`
      : null;

  return (
    <section className="bg-white">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-6">
        <div className="overflow-hidden rounded-3xl border border-zinc-200 bg-white shadow-sm">
          <div className="grid gap-0 lg:grid-cols-[1fr_1.35fr]">
            <div className="relative bg-[linear-gradient(135deg,#FEF3C7_0%,#FFFBEB_45%,#FFF7ED_100%)] p-6 sm:p-8">
              <p className="text-sm font-semibold text-zinc-700">Benzersiz evlerimizi keşfedin</p>
              <p className="mt-2 text-sm text-zinc-600">{loc || '—'}</p>
              <h3 className="mt-3 text-3xl font-extrabold tracking-tight text-teal-800 sm:text-4xl">
                {active.displayName}
              </h3>
              <p className="mt-1 text-sm font-semibold text-zinc-700">Özel Havuzlu Villa</p>

              <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-zinc-700">
                <span>👥 {active.guestCount} Kişilik</span>
                <span>🛏️ {active.bedroomCount} Oda</span>
                <span>🛁 {active.bathroomCount} Banyo</span>
              </div>

              <div className="mt-6">
                {price ? (
                  <p className="text-lg font-extrabold tabular-nums text-zinc-900">
                    {price}
                    <span className="ml-2 text-sm font-semibold text-zinc-600">/ gecelik fiyat</span>
                  </p>
                ) : (
                  <p className="text-sm font-semibold text-zinc-600">Gecelik fiyat için takvime bakın</p>
                )}
              </div>

              <div className="mt-8">
                <Link
                  href={`/villalar/${encodeURIComponent(active.slug)}`}
                  className="inline-flex min-h-11 items-center justify-center rounded-full bg-teal-700 px-8 py-3 text-sm font-semibold text-white shadow-sm hover:bg-teal-800"
                >
                  Detaylı Bilgi
                </Link>
              </div>

              {items.length > 1 && (
                <div className="mt-7 flex items-center gap-2">
                  {items.map((it, i) => (
                    <button
                      key={it.id}
                      type="button"
                      onClick={() => setIdx(i)}
                      aria-label={`Villa ${i + 1}`}
                      className={`h-2.5 rounded-full transition ${i === safeIdx ? 'w-8 bg-teal-700' : 'w-2.5 bg-teal-700/25 hover:bg-teal-700/40'}`}
                    />
                  ))}
                </div>
              )}
            </div>

            <div className="relative min-h-[260px] bg-zinc-100 sm:min-h-[360px]">
              {active.coverUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={active.coverUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                <div className="flex h-full items-center justify-center text-sm text-zinc-500">Görsel yok</div>
              )}

              {items.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => setIdx((p) => p - 1)}
                    className="absolute left-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-800 shadow-md backdrop-blur hover:bg-white"
                    aria-label="Önceki"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setIdx((p) => p + 1)}
                    className="absolute right-3 top-1/2 inline-flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full bg-white/85 text-zinc-800 shadow-md backdrop-blur hover:bg-white"
                    aria-label="Sonraki"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

