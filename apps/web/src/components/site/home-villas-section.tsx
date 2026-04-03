import Link from 'next/link';

import { HomeVillasGridClient } from '@/components/site/home-villas-grid-client';
import type { AdminVilla } from '@/types/admin-villa';
import type { AdminSettings } from '@/types/admin-settings';

type Props = {
  villas: AdminVilla[];
  settings: AdminSettings;
};

/** @siteProduct SITE_PRODUCT_VILLA_RENTAL — Villa kiralama ana sayfa alanı */
export function HomeVillasSection({ villas, settings }: Props) {
  const active = villas.filter((v) => v.isActive);

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
          <HomeVillasGridClient villas={active} settings={settings} />
        )}
      </div>
    </section>
  );
}
