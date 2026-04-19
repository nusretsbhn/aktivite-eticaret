'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { CircleDot, Ticket } from 'lucide-react';

import { DictionaryIcon } from '@/components/icons/dictionary-icon';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import { VillaSearchDateRangeModal } from '@/components/site/villa-search-date-range-modal';
import { computePackageTourTotalForSearch } from '@/lib/package-tour-public-pricing';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_PACKAGE_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
} from '@/lib/site-product-types';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';
import type { AdminSettings } from '@/types/admin-settings';

type Props = {
  packageTours: AdminPackageTour[];
  activities: AdminPackageTourActivity[];
  settings: AdminSettings;
  initialQuery: {
    checkIn: string;
    checkOut: string;
    adults: string;
    children: string;
    infants: string;
    concept: string;
  };
};

function formatTrDateRangeShort(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
}

function formatTrDateLong(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
}

export function PackageToursListingClient({ packageTours, activities, settings, initialQuery }: Props) {
  const [checkIn, setCheckIn] = useState(initialQuery.checkIn);
  const [checkOut, setCheckOut] = useState(initialQuery.checkOut);
  const [dateRangeOpen, setDateRangeOpen] = useState(false);
  const [selectedConcepts, setSelectedConcepts] = useState<string[]>(
    initialQuery.concept ? [initialQuery.concept] : [],
  );
  const [onlyActive, setOnlyActive] = useState(true);
  const conceptOptions = useMemo(
    () =>
      Array.from(new Set(packageTours.map((x) => x.conceptName.trim()).filter(Boolean))).sort((a, b) =>
        a.localeCompare(b, 'tr'),
      ),
    [packageTours],
  );

  const adults = Math.max(1, Number(initialQuery.adults) || 1);
  const children = Math.max(0, Number(initialQuery.children) || 0);
  const infants = Math.max(0, Number(initialQuery.infants) || 0);

  const activityNameById = useMemo(
    () =>
      Object.fromEntries(
        activities.flatMap((x) => [
          [x.id, x.name],
          [x.activityId, x.name],
        ]),
      ) as Record<string, string>,
    [activities],
  );
  const serviceNameById = useMemo(
    () =>
      Object.fromEntries(
        (settings.packageTourManagement?.ancillaryServices ?? []).map((x) => [x.id, x.label]),
      ) as Record<string, string>,
    [settings.packageTourManagement?.ancillaryServices],
  );

  const inferNamesFromDescription = (description: string, candidates: string[]): string[] => {
    const text = description.toLocaleLowerCase('tr');
    return candidates.filter((name) => text.includes(name.toLocaleLowerCase('tr')));
  };
  const inferDurationFromDescription = (description: string): { nights: number; days: number } | null => {
    const m = String(description ?? '').match(/(\d+)\s*gece[\s/&-]*(\d+)\s*g[üu]n/i);
    if (!m) return null;
    return { nights: Math.max(1, Number(m[1]) || 1), days: Math.max(1, Number(m[2]) || 1) };
  };

  const rows = useMemo(() => {
    return packageTours
      .filter((x) => (onlyActive ? x.isActive : true))
      .filter((x) => (selectedConcepts.length ? selectedConcepts.includes(x.conceptName) : true))
      .map((x) => {
        const pricing = computePackageTourTotalForSearch(x, checkIn, checkOut, {
          adults,
          children,
          infants,
        }, activities);
        const activityNamesFromIds = x.activityIds.map((id) => activityNameById[id]).filter(Boolean);
        const includedServiceNamesFromIds = x.includedServiceIds.map((id) => serviceNameById[id]).filter(Boolean);
        const activityNames =
          activityNamesFromIds.length > 0
            ? activityNamesFromIds
            : inferNamesFromDescription(x.description, activities.map((a) => a.name));
        const includedServiceNames =
          includedServiceNamesFromIds.length > 0
            ? includedServiceNamesFromIds
            : inferNamesFromDescription(
                x.description,
                (settings.packageTourManagement?.ancillaryServices ?? []).map((s) => s.label),
              );
        const duration =
          x.nightCount > 1 || x.dayCount > 1
            ? { nights: x.nightCount, days: x.dayCount }
            : inferDurationFromDescription(x.description) ?? { nights: x.nightCount, days: x.dayCount };
        const includedServices = includedServiceNames.map((label) => {
          const svc = (settings.packageTourManagement?.ancillaryServices ?? []).find((s) => s.label === label);
          return { label, iconKey: svc?.iconKey, icon: svc?.icon };
        });
        return { item: x, pricing, activityNames, includedServices, duration };
      })
      .filter((x) => x.pricing.ok);
  }, [
    packageTours,
    onlyActive,
    selectedConcepts,
    checkIn,
    checkOut,
    adults,
    children,
    infants,
    activityNameById,
    serviceNameById,
    activities,
    settings.packageTourManagement?.ancillaryServices,
  ]);

  const enabledProducts = settings.siteManagement?.enabledSiteProducts ?? [];
  const logoUrl = settings.siteManagement?.logoUrl;
  const showToursInNav =
    enabledProducts.includes(SITE_PRODUCT_BOAT_TOUR) ||
    enabledProducts.includes(SITE_PRODUCT_ACTIVITY) ||
    enabledProducts.includes(SITE_PRODUCT_PACKAGE_TOUR);
  const showVillaNavLink = enabledProducts.includes(SITE_PRODUCT_VILLA_RENTAL);

  function toggleConcept(value: string) {
    setSelectedConcepts((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16">
          <Link href="/" className="flex min-w-0 items-center gap-3 text-sm font-semibold text-zinc-900 hover:text-zinc-900">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-sm font-semibold tracking-wide">Bodrum Aktivite</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm md:flex">
            {showToursInNav && <Link href="/aktiviteler" className="text-zinc-600 hover:text-zinc-900">Turlar</Link>}
            {showVillaNavLink && <Link href="/villalar" className="text-zinc-600 hover:text-zinc-900">Villalar</Link>}
            <Link href="#" className="text-zinc-600 hover:text-zinc-900">Kampanyalar</Link>
            <Link href="/blog" className="text-zinc-600 hover:text-zinc-900">Blog</Link>
            <Link href="/iletisim" className="text-zinc-600 hover:text-zinc-900">İletişim</Link>
          </nav>
          <SiteAccountWithNotifications
            menuClassName="rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50"
            bellButtonClassName="inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border border-zinc-300 bg-white p-2 text-zinc-900 shadow-sm hover:bg-zinc-50"
          />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 py-8">
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-zinc-900">Paket Turlar</h1>
          <p className="mt-1 text-sm text-zinc-600">
            {formatTrDateLong(checkIn)} - {formatTrDateLong(checkOut)} | {adults} Y, {children} C, {infants} B
          </p>
        </div>

        <div className="grid gap-6 lg:grid-cols-[280px_1fr]">
          <aside className="h-fit rounded-2xl border border-zinc-200 bg-white p-4">
            <h2 className="text-sm font-semibold text-zinc-900">Filtreler</h2>
            <div className="mt-3 space-y-3">
              <div className="space-y-2">
                <p className="text-sm font-semibold text-zinc-800">Tarih</p>
                <button
                  type="button"
                  onClick={() => setDateRangeOpen(true)}
                  className="w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-left text-sm text-zinc-800"
                >
                  {formatTrDateRangeShort(checkIn, checkOut)}
                </button>
              </div>
              <div className="space-y-2 border-t border-zinc-200 pt-3">
                <p className="text-sm font-semibold text-zinc-800">Konaklama tipleri</p>
                <div className="space-y-2">
                  {conceptOptions.map((option) => (
                    <label key={option} className="flex items-center gap-2 text-sm text-zinc-700">
                      <input
                        type="checkbox"
                        checked={selectedConcepts.includes(option)}
                        onChange={() => toggleConcept(option)}
                      />
                      {option}
                    </label>
                  ))}
                  {conceptOptions.length === 0 && <p className="text-sm text-zinc-500">Konaklama tipi bulunamadı.</p>}
                </div>
              </div>
              <label className="inline-flex items-center gap-2 text-sm">
                <input type="checkbox" checked={onlyActive} onChange={(e) => setOnlyActive(e.target.checked)} />
                Sadece aktif paketler
              </label>
            </div>
          </aside>

          <section>
            {rows.length === 0 ? (
              <div className="rounded-2xl border border-dashed border-zinc-300 bg-zinc-50 p-8 text-center text-sm text-zinc-500">
                Seçilen tarih aralığında fiyatı olan paket bulunamadı.
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-2">
                {rows.map(({ item, pricing, activityNames, includedServices, duration }) => {
                  if (!pricing.ok) return null;
                  return (
                    <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                      {item.coverImageUrl ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img src={item.coverImageUrl} alt={item.packageName} className="mb-3 aspect-[16/9] w-full rounded-xl object-cover" />
                      ) : (
                        <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
                          Kapak görseli yok
                        </div>
                      )}
                      <h2 className="text-base font-semibold text-zinc-900">{item.packageName}</h2>
                      <p className="mt-1 text-xl font-bold text-zinc-800">
                        {duration.nights} Gece {duration.days} Gün
                      </p>
                      <div className="mt-3 border-t border-zinc-200 pt-3">
                        <p className="text-base font-bold text-zinc-900">Aktiviteler</p>
                        {activityNames.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {activityNames.map((name) => (
                              <li key={name} className="flex items-start gap-2 text-sm text-zinc-700">
                                <Ticket className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                <span>{name}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-zinc-500">-</p>
                        )}
                      </div>
                      <div className="mt-3 border-t border-zinc-200 pt-3">
                        <p className="text-base font-bold text-zinc-900">Ücretsiz hizmetler</p>
                        {includedServices.length > 0 ? (
                          <ul className="mt-1 space-y-1">
                            {includedServices.map((svc) => (
                              <li key={svc.label} className="flex items-start gap-2 text-sm text-zinc-700">
                                {svc.iconKey || svc.icon ? (
                                  <DictionaryIcon
                                    iconKey={svc.iconKey}
                                    fallbackEmoji={svc.icon}
                                    className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500"
                                  />
                                ) : (
                                  <CircleDot className="mt-0.5 h-4 w-4 shrink-0 text-zinc-500" />
                                )}
                                <span>{svc.label}</span>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <p className="mt-1 text-sm text-zinc-500">-</p>
                        )}
                      </div>
                      <div className="mt-4 flex items-center justify-between gap-3 border-t border-zinc-200 pt-3">
                        <p className="text-2xl font-bold text-zinc-900">
                          <span className="mr-2 text-base font-semibold text-zinc-700">Toplam</span>
                          {pricing.total.toLocaleString('tr-TR')} TL
                        </p>
                        <Link
                          href={`/paket-turlar/${item.id}?checkIn=${encodeURIComponent(checkIn)}&checkOut=${encodeURIComponent(checkOut)}&adults=${adults}&children=${children}&infants=${infants}`}
                          className="inline-flex rounded-lg border border-zinc-300 px-5 py-2.5 text-base font-semibold text-zinc-800"
                        >
                          Seç
                        </Link>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </section>
        </div>
      </div>
      <VillaSearchDateRangeModal
        checkIn={checkIn}
        checkOut={checkOut}
        open={dateRangeOpen}
        onClose={() => setDateRangeOpen(false)}
        onChange={(next) => {
          setCheckIn(next.checkIn);
          setCheckOut(next.checkOut);
        }}
      />
      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
        enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
      />
    </div>
  );
}

