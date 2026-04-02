import Link from 'next/link';
import { Anchor } from 'lucide-react';

/** @siteProduct SITE_PRODUCT_BOAT_TOUR — Tekne turu odaklı vitrin alanı */
export function HomeBoatTourSection() {
  return (
    <section className="border-y border-sky-100 bg-gradient-to-r from-sky-50 to-cyan-50 py-10 dark:border-sky-900/40 dark:from-sky-950/40 dark:to-cyan-950/30">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex items-start gap-3">
            <span className="rounded-xl bg-white p-3 text-sky-600 shadow-sm dark:bg-zinc-900 dark:text-sky-400">
              <Anchor className="h-7 w-7" aria-hidden />
            </span>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-zinc-900 dark:text-zinc-50">Tekne turları</h2>
              <p className="mt-1 max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
                Günlük tekne ve deniz programları için özel içerikler bu alanda yer alır. Tüm turları keşfetmek için
                aktiviteler sayfasını ziyaret edin.
              </p>
            </div>
          </div>
          <Link
            href="/aktiviteler"
            className="inline-flex min-h-11 shrink-0 items-center justify-center rounded-xl bg-sky-600 px-5 py-2.5 text-sm font-semibold text-white hover:bg-sky-500"
          >
            Turları görüntüle
          </Link>
        </div>
      </div>
    </section>
  );
}
