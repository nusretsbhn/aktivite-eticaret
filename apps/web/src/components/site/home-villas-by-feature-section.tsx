'use client';

import { useMemo, useState } from 'react';

import { VillaEquipmentIconPreview } from '@/components/admin/villa-equipment-icon-picker';
import { HomeVillasGridClient } from '@/components/site/home-villas-grid-client';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

type Props = {
  villas: AdminVilla[];
  settings: AdminSettings;
};

type CatalogItem = { key: string; description: string; icon: string };

function buildCatalog(villas: AdminVilla[]): CatalogItem[] {
  const map = new Map<string, CatalogItem>();
  for (const v of villas) {
    if (!v.isActive) continue;
    for (const it of v.featuredItems ?? []) {
      const desc = (it.description ?? '').trim();
      if (!desc) continue;
      const key = desc.toLowerCase();
      if (!map.has(key)) {
        map.set(key, { key, description: desc, icon: it.icon });
      }
    }
  }
  return Array.from(map.values()).sort((a, b) => a.description.localeCompare(b.description, 'tr'));
}

function filterVillas(villas: AdminVilla[], selectedKey: string | null): AdminVilla[] {
  const active = villas.filter((v) => v.isActive);
  if (selectedKey === null) return active;
  return active.filter((v) =>
    (v.featuredItems ?? []).some((it) => (it.description ?? '').trim().toLowerCase() === selectedKey),
  );
}

/** Öne çıkan özelliklere göre sol menü + sağda filtrelenmiş villa grid */
export function HomeVillasByFeatureSection({ villas, settings }: Props) {
  const catalog = useMemo(() => buildCatalog(villas), [villas]);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);

  const filtered = useMemo(() => filterVillas(villas, selectedKey), [villas, selectedKey]);

  return (
    <section className="border-t border-zinc-100 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-950/40">
      <div className="mx-auto max-w-6xl px-4 pb-14 pt-12">
        <div className="mb-8">
          <h2 className="text-2xl font-extrabold tracking-tight text-zinc-900 dark:text-zinc-50">
            Öne çıkan özelliklere göre villalar
          </h2>
          <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
            Soldan bir özellik seçin; sağda yalnızca o özelliği içeren villalar listelenir.
          </p>
        </div>

        {catalog.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
            Henüz hiçbir villada &quot;Öne çıkan özellik&quot; tanımlı değil. Villaları düzenleyerek özellik ekledikten sonra bu
            bölüm dolacaktır.
          </div>
        ) : (
          <div className="flex flex-col gap-8 lg:flex-row lg:items-start lg:gap-10">
            <nav
              className="flex max-h-[min(22rem,50vh)] w-full shrink-0 flex-col gap-1 overflow-y-auto pr-1 lg:max-h-none lg:w-72"
              aria-label="Öne çıkan özellik filtreleri"
            >
              <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
                Özellikler
              </p>
              <button
                type="button"
                onClick={() => setSelectedKey(null)}
                className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                  selectedKey === null
                    ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100'
                    : 'border-transparent bg-white text-zinc-800 hover:border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'
                }`}
              >
                Tümü
              </button>
              {catalog.map((item) => (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => setSelectedKey(item.key)}
                  className={`flex w-full items-center gap-2 rounded-xl border px-3 py-2.5 text-left text-sm font-medium transition ${
                    selectedKey === item.key
                      ? 'border-amber-400 bg-amber-50 text-amber-950 dark:border-amber-600 dark:bg-amber-950/40 dark:text-amber-100'
                      : 'border-transparent bg-white text-zinc-800 hover:border-zinc-200 dark:bg-zinc-900 dark:text-zinc-200 dark:hover:border-zinc-600'
                  }`}
                >
                  <VillaEquipmentIconPreview value={item.icon} className="h-4 w-4 shrink-0 text-amber-800 dark:text-amber-300" />
                  <span className="line-clamp-2">{item.description}</span>
                </button>
              ))}
            </nav>

            <div className="min-w-0 flex-1">
              {filtered.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-300 bg-white p-10 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900">
                  Bu özelliğe sahip aktif villa bulunamadı.
                </div>
              ) : (
                <HomeVillasGridClient
                  key={selectedKey ?? 'all'}
                  villas={filtered}
                  settings={settings}
                />
              )}
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
