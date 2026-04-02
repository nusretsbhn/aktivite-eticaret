import Link from 'next/link';

import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

function normalizeKey(s: string) {
  return s.trim().replace(/\s+/g, ' ');
}

export function HomeVillaRegionBannersSection({
  settings,
  villas,
}: {
  settings: AdminSettings;
  villas: AdminVilla[];
}) {
  const map = settings.blockManagement?.villaRegionBanners ?? {};
  const entries = Object.entries(map)
    .map(([region, imageUrl]) => ({
      region: normalizeKey(String(region ?? '')),
      imageUrl: String(imageUrl ?? '').trim(),
    }))
    .filter((x) => x.region && x.imageUrl);

  if (entries.length === 0) return null;

  const active = (villas ?? []).filter((v) => v.isActive);
  const items = entries
    .map((e) => ({
      ...e,
      villaCount: active.filter((v) => normalizeKey(String(v.region ?? '')) === e.region).length,
    }))
    .filter((x) => x.villaCount > 0)
    .sort((a, b) => b.villaCount - a.villaCount || a.region.localeCompare(b.region, 'tr'));

  if (items.length === 0) return null;

  return (
    <section className="mx-auto max-w-6xl px-4 py-12 sm:py-14">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="min-w-0">
          <h2 className="mt-3 text-xl font-semibold tracking-tight text-zinc-900 sm:text-2xl">
            Nasıl bir villa tatili hayal ediyorsunuz?
          </h2>
          <p className="mt-1 text-sm text-zinc-600">
            Bölge seçin, villaları filtreleyerek hızlıca keşfedin.
          </p>
        </div>
        <Link
          href="/villalar"
          className="text-sm font-semibold text-zinc-900 underline underline-offset-4 decoration-zinc-300 hover:decoration-zinc-500"
        >
          Tüm villaları gör
        </Link>
      </div>

      <div className="mt-6 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((it) => (
          <Link
            key={it.region}
            href={`/villalar?region=${encodeURIComponent(it.region)}`}
            className="group overflow-hidden rounded-2xl border border-zinc-200 bg-white shadow-sm transition hover:-translate-y-0.5 hover:shadow-md"
          >
            <div className="relative aspect-[4/3] w-full overflow-hidden bg-zinc-100">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={it.imageUrl}
                alt={`${it.region} banner`}
                className="h-full w-full object-cover transition duration-300 group-hover:scale-[1.02]"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/55 via-black/10 to-transparent" />
              <div className="absolute left-4 top-4 inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm backdrop-blur">
                Villa
              </div>
              <div className="absolute bottom-4 left-4 right-4">
                <p className="truncate text-base font-semibold text-white drop-shadow-sm">{it.region}</p>
                <p className="mt-0.5 text-xs text-white/90">
                  {it.villaCount} villa • Filtrele ve incele
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

