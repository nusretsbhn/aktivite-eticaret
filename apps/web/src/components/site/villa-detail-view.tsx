'use client';

import Link from 'next/link';
import {
  Bath,
  BedDouble,
  Home,
  MapPin,
  Maximize2,
  Users,
  Waves,
} from 'lucide-react';

import { VillaEquipmentIconPreview } from '@/components/admin/villa-equipment-icon-picker';
import { VillaAvailabilitySection } from '@/components/site/villa-availability-section';
import { VillaBookingDatesProvider } from '@/components/site/villa-booking-dates-context';
import { SiteFooter } from '@/components/site/site-footer';
import { VillaDetailTopSection } from '@/components/site/villa-detail-top-section';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
} from '@/lib/site-product-types';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

type Props = {
  villa: AdminVilla;
  settings: AdminSettings;
  initialDates?: {
    checkIn?: string;
    checkOut?: string;
  };
};

export function VillaDetailView({ villa, settings, initialDates }: Props) {
  const logoUrl = settings.siteManagement?.logoUrl;
  const locationLine = [villa.city, villa.district, villa.region].filter(Boolean).join(' / ');
  const enabledProducts = settings.siteManagement?.enabledSiteProducts ?? [];
  const showToursInNav =
    enabledProducts.includes(SITE_PRODUCT_BOAT_TOUR) || enabledProducts.includes(SITE_PRODUCT_ACTIVITY);
  const showVillaNavLink = enabledProducts.includes(SITE_PRODUCT_VILLA_RENTAL);

  return (
    <div className="min-h-screen w-full min-w-0 overflow-x-clip bg-zinc-50 text-zinc-900">
      <header className="sticky top-0 z-40 border-b border-zinc-200/80 bg-white/95 shadow-sm backdrop-blur-md">
        <div className="mx-auto flex h-14 min-w-0 max-w-6xl items-center justify-between gap-2 px-4 sm:h-16 sm:gap-4">
          <Link
            href="/"
            className="flex min-w-0 items-center gap-3 text-sm font-semibold text-zinc-900 hover:text-zinc-900"
            aria-label="Bodrum Aktivite ana sayfa"
          >
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="" className="h-9 w-auto max-w-[160px] object-contain" />
            ) : (
              <span className="text-sm font-semibold tracking-wide">Bodrum Aktivite</span>
            )}
          </Link>

          <nav className="hidden items-center gap-6 text-sm md:flex">
            {showToursInNav && (
              <Link href="/aktiviteler" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Turlar
              </Link>
            )}
            {showVillaNavLink && (
              <Link href="/villalar" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
                Villalar
              </Link>
            )}
            <Link href="#" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Kampanyalar
            </Link>
            <Link href="/blog" className="text-sm font-medium text-zinc-600 hover:text-zinc-900">
              Blog
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <SiteAccountWithNotifications
              menuClassName={[
                'rounded-lg border px-4 py-2 text-sm font-semibold transition',
                'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50',
              ].join(' ')}
              bellButtonClassName={[
                'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border p-2 transition',
                'border-zinc-300 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50',
              ].join(' ')}
            />
          </div>
        </div>
      </header>

      <main className="min-w-0">
        <VillaBookingDatesProvider villa={villa} initialDates={initialDates}>
        <section className="border-b border-zinc-200 bg-white">
          <div className="mx-auto min-w-0 max-w-6xl px-4 py-8 sm:py-10">
            <nav className="mb-6 text-xs text-zinc-500">
              <Link href="/" className="hover:text-amber-800">
                Ana sayfa
              </Link>
              <span className="mx-1.5">/</span>
              <Link href="/villalar" className="hover:text-amber-800">
                Villalar
              </Link>
              <span className="mx-1.5">/</span>
              <span className="text-zinc-700">{villa.displayName}</span>
            </nav>

            {/* Başlık ve konum görselin üstünde: ilk ekranda görünsün */}
            <div className="mb-8">
              <div className="min-w-0">
                <h1 className="text-3xl font-bold tracking-tight text-zinc-900 sm:text-4xl">{villa.displayName}</h1>
                <p className="mt-2 flex items-start gap-2 text-base text-zinc-600">
                  <MapPin className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" aria-hidden />
                  <span>{locationLine}</span>
                </p>
                {villa.addressLine ? (
                  <p className="mt-1 pl-7 text-sm text-zinc-500">{villa.addressLine}</p>
                ) : null}
              </div>
            </div>

            <VillaDetailTopSection villa={villa}>
            <div className="min-w-0">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <Users className="h-5 w-5 text-amber-700" aria-hidden />
                    <p className="mt-2 text-2xl font-bold tabular-nums">{villa.guestCount}</p>
                    <p className="text-xs font-medium text-zinc-500">Kişi kapasitesi</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <BedDouble className="h-5 w-5 text-amber-700" aria-hidden />
                    <p className="mt-2 text-2xl font-bold tabular-nums">{villa.bedroomCount}</p>
                    <p className="text-xs font-medium text-zinc-500">Yatak odası</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <Bath className="h-5 w-5 text-amber-700" aria-hidden />
                    <p className="mt-2 text-2xl font-bold tabular-nums">{villa.bathroomCount}</p>
                    <p className="text-xs font-medium text-zinc-500">Banyo</p>
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <Maximize2 className="h-5 w-5 text-amber-700" aria-hidden />
                    <p className="mt-2 text-2xl font-bold tabular-nums">{villa.squareMeters}</p>
                    <p className="text-xs font-medium text-zinc-500">m²</p>
                  </div>
                </div>

                {villa.description ? (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-zinc-900">Tanıtım</h2>
                    <p className="mt-3 whitespace-pre-line text-zinc-600 leading-relaxed">{villa.description}</p>
                  </div>
                ) : null}

                {villa.featuredItems.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-zinc-900">Öne çıkan özellikler</h2>
                    <ul className="mt-4 grid gap-3 sm:grid-cols-2">
                      {villa.featuredItems.map((it) => (
                        <li
                          key={it.id}
                          className="flex items-start gap-3 rounded-xl border border-zinc-200 bg-white p-4 shadow-sm"
                        >
                          <span className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amber-50 text-amber-900">
                            <VillaEquipmentIconPreview value={it.icon} className="h-5 w-5" />
                          </span>
                          <span className="text-sm font-medium leading-snug text-zinc-800">{it.description}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {villa.pools.length > 0 && (
                  <div className="mt-10">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                      <Waves className="h-5 w-5 text-amber-700" aria-hidden />
                      Havuz bilgisi
                    </h2>
                    <ul className="mt-4 space-y-3">
                      {villa.pools.map((p) => (
                        <li key={p.id} className="rounded-xl border border-zinc-200 bg-white p-4 text-sm text-zinc-700 shadow-sm">
                          <span className="font-medium capitalize text-zinc-900">{p.poolType}</span>
                          {p.heated ? ' · Isıtmalı' : ''}
                          {(p.lengthCm || p.widthCm) && (
                            <span className="text-zinc-500">
                              {' '}
                              · {p.lengthCm}×{p.widthCm} cm
                              {p.depthCm ? ` · ${p.depthCm} cm derinlik` : ''}
                            </span>
                          )}
                          {p.note ? <p className="mt-2 text-zinc-600">{p.note}</p> : null}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {villa.amenities.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-zinc-900">Donanım</h2>
                    <ul className="mt-4 flex flex-wrap gap-2">
                      {villa.amenities.map((it) => (
                        <li
                          key={it.id}
                          className="inline-flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-sm text-zinc-800 shadow-sm"
                        >
                          <VillaEquipmentIconPreview value={it.icon} className="h-4 w-4 text-amber-800" />
                          {it.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {villa.rooms.length > 0 && (
                  <div className="mt-10">
                    <h2 className="flex items-center gap-2 text-lg font-semibold text-zinc-900">
                      <Home className="h-5 w-5 text-amber-700" aria-hidden />
                      Odalar
                    </h2>
                    <ul className="mt-4 space-y-4">
                      {villa.rooms.map((r) => (
                        <li key={r.id} className="rounded-xl border border-zinc-200 bg-white p-4 shadow-sm">
                          <p className="font-semibold text-zinc-900">{r.name}</p>
                          {r.items.length > 0 && (
                            <ul className="mt-2 list-inside list-disc text-sm text-zinc-600">
                              {r.items.map((it) => (
                                <li key={it.id}>{it.name}</li>
                              ))}
                            </ul>
                          )}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                <VillaAvailabilitySection />

                {(villa.utilitiesNote || villa.nearbyNote) && (
                  <div className="mt-10 grid gap-6 sm:grid-cols-2">
                    {villa.utilitiesNote ? (
                      <div className="rounded-xl border border-zinc-200 bg-amber-50/50 p-5">
                        <h3 className="font-semibold text-zinc-900">Hizmetler / faturalar</h3>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{villa.utilitiesNote}</p>
                      </div>
                    ) : null}
                    {villa.nearbyNote ? (
                      <div className="rounded-xl border border-zinc-200 bg-white p-5 shadow-sm">
                        <h3 className="font-semibold text-zinc-900">Çevre</h3>
                        <p className="mt-2 text-sm leading-relaxed text-zinc-700 whitespace-pre-line">{villa.nearbyNote}</p>
                      </div>
                    ) : null}
                  </div>
                )}

                {villa.houseRules.length > 0 && (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-zinc-900">Ev kuralları</h2>
                    <ul className="mt-4 space-y-2">
                      {villa.houseRules.map((it) => (
                        <li key={it.id} className="flex items-start gap-2 text-sm text-zinc-700">
                          <VillaEquipmentIconPreview value={it.icon} className="h-4 w-4 shrink-0 text-amber-800" />
                          {it.description}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {villa.mapUrl ? (
                  <div className="mt-10">
                    <h2 className="text-lg font-semibold text-zinc-900">Harita</h2>
                    <a
                      href={villa.mapUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-3 inline-flex items-center gap-2 text-sm font-semibold text-amber-800 hover:text-amber-900"
                    >
                      <MapPin className="h-4 w-4" aria-hidden />
                      Haritada aç
                    </a>
                  </div>
                ) : null}
            </div>
            </VillaDetailTopSection>
          </div>
        </section>
        </VillaBookingDatesProvider>
      </main>

      <SiteFooter socialMedia={settings.socialMedia} footerManagement={settings.footerManagement} />
    </div>
  );
}
