'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { ChevronLeft, ChevronRight, Images, MessageCircle, Minus, Plus } from 'lucide-react';

import { DictionaryIcon } from '@/components/icons/dictionary-icon';
import { SiteFooter } from '@/components/site/site-footer';
import { VillaGalleryLightbox } from '@/components/site/villa-gallery-lightbox';
import { VillaSearchDateRangeModal } from '@/components/site/villa-search-date-range-modal';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { computePackageTourTotalForSearch } from '@/lib/package-tour-public-pricing';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
} from '@/lib/site-product-types';
import { buildWhatsAppChatUrl, normalizeWhatsAppDigits } from '@/lib/whatsapp-digits';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';
import type { AdminSettings } from '@/types/admin-settings';

type Props = {
  packageTour: AdminPackageTour;
  activities: AdminPackageTourActivity[];
  settings: AdminSettings;
  searchInfo: { checkIn: string; checkOut: string; adults: string; children: string; infants: string };
};

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

function formatTrDateRangeShort(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
}

export function PackageTourDetailView({ packageTour, activities, settings, searchInfo }: Props) {
  const enabledProducts = settings.siteManagement?.enabledSiteProducts ?? [];
  const logoUrl = settings.siteManagement?.logoUrl;
  const showToursInNav =
    enabledProducts.includes(SITE_PRODUCT_BOAT_TOUR) || enabledProducts.includes(SITE_PRODUCT_ACTIVITY);
  const showVillaNavLink = enabledProducts.includes(SITE_PRODUCT_VILLA_RENTAL);
  const whatsappDigits =
    normalizeWhatsAppDigits(settings.siteManagement?.whatsappPhoneDigits?.trim() ?? '') ?? '905536882734';
  const whatsappHref = buildWhatsAppChatUrl(
    whatsappDigits,
    `${packageTour.packageName} paketi için bilgi almak istiyorum.`,
  );

  const [checkIn, setCheckIn] = useState(searchInfo.checkIn);
  const [checkOut, setCheckOut] = useState(searchInfo.checkOut);
  const [dateOpen, setDateOpen] = useState(false);
  const [adults, setAdults] = useState(Math.max(1, Number(searchInfo.adults) || 1));
  const [children, setChildren] = useState(Math.max(0, Number(searchInfo.children) || 0));
  const [infants, setInfants] = useState(Math.max(0, Number(searchInfo.infants) || 0));
  const galleryImages = useMemo(
    () =>
      (packageTour.gallery ?? [])
        .filter((g) => g.type === 'image' && g.url)
        .slice()
        .sort((a, b) => (a.isCover === b.isCover ? a.sortOrder - b.sortOrder : a.isCover ? -1 : 1)),
    [packageTour.gallery],
  );
  const [selectedGalleryIndex, setSelectedGalleryIndex] = useState(0);
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);
  const [activityGalleryIndex, setActivityGalleryIndex] = useState<Record<string, number>>({});
  const [extras, setExtras] = useState<Record<string, { adults: number; children: number; infants: number }>>({});
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestName, setRequestName] = useState('');
  const [requestPhone, setRequestPhone] = useState('');
  const [kvkkApproved, setKvkkApproved] = useState(false);
  const [commercialApproved, setCommercialApproved] = useState(false);
  const [requestSaving, setRequestSaving] = useState(false);
  const [requestMessage, setRequestMessage] = useState<string | null>(null);
  const mainGalleryUrl = galleryImages[selectedGalleryIndex]?.url ?? galleryImages[0]?.url;

  const goPrevGallery = useCallback(() => {
    if (galleryImages.length <= 1) return;
    setSelectedGalleryIndex((i) => (i <= 0 ? galleryImages.length - 1 : i - 1));
  }, [galleryImages.length]);

  const goNextGallery = useCallback(() => {
    if (galleryImages.length <= 1) return;
    setSelectedGalleryIndex((i) => (i >= galleryImages.length - 1 ? 0 : i + 1));
  }, [galleryImages.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (galleryLightboxOpen || dateOpen) return;
      if (e.key === 'ArrowLeft') goPrevGallery();
      if (e.key === 'ArrowRight') goNextGallery();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrevGallery, goNextGallery, galleryLightboxOpen, dateOpen]);

  const calc = computePackageTourTotalForSearch(packageTour, checkIn, checkOut, {
    adults,
    children,
    infants,
  }, activities);

  const packageActivityKeys = useMemo(() => new Set(packageTour.activityIds), [packageTour.activityIds]);
  const includedActivities = useMemo(() => {
    const byId = activities.filter((a) => packageActivityKeys.has(a.id) || packageActivityKeys.has(a.activityId));
    if (byId.length > 0) return byId;
    const text = packageTour.description.toLocaleLowerCase('tr');
    return activities.filter((a) => text.includes(a.name.toLocaleLowerCase('tr')));
  }, [activities, packageActivityKeys, packageTour.description]);
  const includedActivityNames = useMemo(() => includedActivities.map((a) => a.name), [includedActivities]);
  const includedServices = useMemo(() => {
    const svc = settings.packageTourManagement?.ancillaryServices ?? [];
    return svc.filter((s) => packageTour.includedServiceIds.includes(s.id));
  }, [settings.packageTourManagement?.ancillaryServices, packageTour.includedServiceIds]);
  const inferredIncludedActivityKeys = useMemo(() => {
    const text = packageTour.description.toLocaleLowerCase('tr');
    return new Set(
      activities
        .filter((a) => text.includes(a.name.toLocaleLowerCase('tr')))
        .flatMap((a) => [a.id, a.activityId]),
    );
  }, [packageTour.description, activities]);
  const extraCandidates = useMemo(
    () =>
      activities.filter(
        (a) =>
          a.isActive &&
          !packageActivityKeys.has(a.id) &&
          !packageActivityKeys.has(a.activityId) &&
          !inferredIncludedActivityKeys.has(a.id) &&
          !inferredIncludedActivityKeys.has(a.activityId),
      ),
    [activities, packageActivityKeys, inferredIncludedActivityKeys],
  );

  const extraBreakdown = useMemo(() => {
    return extraCandidates
      .map((activity) => {
        const guest = extras[activity.id];
        if (!guest) return null;
        const priceRow = (activity.prices ?? []).find((p) => p.date === checkIn);
        const adultPrice = priceRow?.price ?? 0;
        const childPrice = priceRow?.priceChild ?? adultPrice;
        const infantPrice = priceRow?.priceInfant ?? 0;
        const total = adultPrice * guest.adults + childPrice * guest.children + infantPrice * guest.infants;
        return { activity, guest, total };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
  }, [extraCandidates, extras, checkIn]);

  const extraTotal = extraBreakdown.reduce((acc, x) => acc + x.total, 0);
  const grandTotal = (calc.ok ? calc.total : 0) + extraTotal;

  function updateGuest(id: string, field: 'adults' | 'children' | 'infants', delta: number) {
    setExtras((prev) => {
      const current = prev[id] ?? { adults: 1, children: 0, infants: 0 };
      const next = {
        ...current,
        [field]: clamp(current[field] + delta, field === 'adults' ? 1 : 0, 20),
      };
      return { ...prev, [id]: next };
    });
  }

  async function submitRequest() {
    setRequestMessage(null);
    if (!requestName.trim() || requestPhone.replace(/\D/g, '').length < 10 || !kvkkApproved || !commercialApproved) {
      setRequestMessage('Lütfen tüm zorunlu alanları doldurun.');
      return;
    }
    setRequestSaving(true);
    const res = await fetch('/api/public/package-tour-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        customerName: requestName.trim(),
        phone: requestPhone.trim(),
        kvkkApproved,
        commercialApproved,
        packageTourId: packageTour.id,
        packageTourName: packageTour.packageName,
        conceptName: packageTour.conceptName,
        checkIn,
        checkOut,
        nights: calc.ok ? calc.nights : packageTour.nightCount,
        adults,
        children,
        infants,
        packageTotal: calc.ok ? calc.total : 0,
        extraTotal,
        grandTotal,
        extras: extraBreakdown.map((x) => ({
          activityId: x.activity.id,
          activityName: x.activity.name,
          adults: x.guest.adults,
          children: x.guest.children,
          infants: x.guest.infants,
          total: x.total,
        })),
      }),
    });
    setRequestSaving(false);
    if (!res.ok) {
      const data = (await res.json().catch(() => ({}))) as { message?: string };
      setRequestMessage(data.message ?? 'Talep gönderilemedi.');
      return;
    }
    setRequestMessage('Talebiniz alındı. En kısa sürede dönüş yapılacaktır.');
    setRequestOpen(false);
    setRequestName('');
    setRequestPhone('');
    setKvkkApproved(false);
    setCommercialApproved(false);
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

      <main className="mx-auto max-w-6xl px-4 py-8">
        <nav className="mb-6 text-xs text-zinc-500">
          <Link href="/" className="hover:text-amber-800">Ana sayfa</Link>
          <span className="mx-1.5">/</span>
          <Link href="/paket-turlar" className="hover:text-amber-800">Paket turlar</Link>
          <span className="mx-1.5">/</span>
          <span className="text-zinc-700">{packageTour.packageName}</span>
        </nav>

        <section className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(340px,380px)]">
          <div className="space-y-4 rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            {galleryImages.length > 0 ? (
              <div>
                <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
                  {mainGalleryUrl ? (
                    <>
                      <div className="relative h-[clamp(220px,31vw,430px)] w-full sm:h-[clamp(248px,29vw,460px)]">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={mainGalleryUrl} alt={packageTour.packageName} className="h-full w-full object-cover" />
                      </div>
                      {galleryImages.length > 1 && (
                        <>
                          <button
                            type="button"
                            onClick={goPrevGallery}
                            className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md backdrop-blur transition hover:bg-white"
                            aria-label="Önceki görsel"
                          >
                            <ChevronLeft className="h-6 w-6" />
                          </button>
                          <button
                            type="button"
                            onClick={goNextGallery}
                            className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md backdrop-blur transition hover:bg-white"
                            aria-label="Sonraki görsel"
                          >
                            <ChevronRight className="h-6 w-6" />
                          </button>
                        </>
                      )}
                      <div className="absolute bottom-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2">
                        <span className="rounded-full bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                          {selectedGalleryIndex + 1} / {galleryImages.length}
                        </span>
                        <button
                          type="button"
                          onClick={() => setGalleryLightboxOpen(true)}
                          className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/95 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-md backdrop-blur transition hover:bg-white"
                        >
                          <Images className="h-4 w-4 text-teal-600" aria-hidden />
                          Galeri ({galleryImages.length})
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="flex h-[clamp(208px,32vw,320px)] items-center justify-center text-sm text-zinc-400">Görsel yok</div>
                  )}
                </div>
                {galleryImages.length > 1 && (
                  <div className="mt-3 flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1 [-webkit-overflow-scrolling:touch]">
                    {galleryImages.map((item, idx) => (
                      <button
                        key={item.id}
                        type="button"
                        onClick={() => setSelectedGalleryIndex(idx)}
                        className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                          idx === selectedGalleryIndex
                            ? 'border-teal-600 ring-2 ring-teal-200'
                            : 'border-transparent opacity-80 hover:opacity-100'
                        }`}
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={item.url} alt="" className="h-full w-full object-cover" />
                      </button>
                    ))}
                  </div>
                )}
                <VillaGalleryLightbox
                  images={galleryImages.map((x) => ({ id: x.id, url: x.url }))}
                  open={galleryLightboxOpen}
                  onClose={() => setGalleryLightboxOpen(false)}
                  activeIndex={selectedGalleryIndex}
                  onActiveIndexChange={setSelectedGalleryIndex}
                />
              </div>
            ) : packageTour.coverImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={packageTour.coverImageUrl} alt={packageTour.packageName} className="aspect-[16/9] w-full rounded-xl object-cover" />
            ) : (
              <div className="flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500">
                Kapak görseli yok
              </div>
            )}
            {packageTour.description && (
              <p className="whitespace-pre-line text-sm leading-relaxed text-zinc-700">{packageTour.description}</p>
            )}
            <div className="border-t border-zinc-200 pt-4">
              <h2 className="text-base font-semibold text-zinc-900">Paket Aktiviteleri Galerileri</h2>
              {includedActivities.length > 0 ? (
                <div className="mt-3 grid gap-4 md:grid-cols-2">
                  {includedActivities.map((activity) => {
                    const activityImages = (activity.gallery ?? [])
                      .slice()
                      .sort((a, b) => a.sortOrder - b.sortOrder)
                      .filter((g) => Boolean(g.url));
                    const activeIdx = Math.min(
                      Math.max(0, activityGalleryIndex[activity.id] ?? 0),
                      Math.max(0, activityImages.length - 1),
                    );
                    return (
                      <div key={activity.id} className="rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                        <p className="text-sm font-semibold text-zinc-900">{activity.name}</p>
                        {activityImages.length > 0 ? (
                          <div className="relative mt-2 overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                              src={activityImages[activeIdx]?.url || activityImages[0]?.url || ''}
                              alt={activity.name}
                              className="h-52 w-full object-cover"
                            />
                            {activityImages.length > 1 && (
                              <>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivityGalleryIndex((prev) => ({
                                      ...prev,
                                      [activity.id]: activeIdx <= 0 ? activityImages.length - 1 : activeIdx - 1,
                                    }))
                                  }
                                  className="absolute left-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md"
                                  aria-label="Önceki görsel"
                                >
                                  <ChevronLeft className="h-5 w-5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() =>
                                    setActivityGalleryIndex((prev) => ({
                                      ...prev,
                                      [activity.id]: activeIdx >= activityImages.length - 1 ? 0 : activeIdx + 1,
                                    }))
                                  }
                                  className="absolute right-3 top-1/2 z-10 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md"
                                  aria-label="Sonraki görsel"
                                >
                                  <ChevronRight className="h-5 w-5" />
                                </button>
                                <span className="absolute bottom-2 right-2 rounded-full bg-zinc-900/80 px-2.5 py-1 text-[11px] font-semibold text-white">
                                  {activeIdx + 1} / {activityImages.length}
                                </span>
                              </>
                            )}
                          </div>
                        ) : (
                          <p className="mt-2 text-xs text-zinc-500">Bu aktivite için galeri görseli bulunmuyor.</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="mt-2 text-sm text-zinc-500">Pakette tanımlı aktivite bulunmuyor.</p>
              )}
            </div>
          </div>

          <aside className="rounded-2xl border border-zinc-200 bg-white p-4 sm:p-6">
            <div className="mb-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
              <h1 className="text-2xl font-bold tracking-tight text-zinc-900">{packageTour.packageName}</h1>
              <p className="mt-1 text-sm text-zinc-600">{packageTour.conceptName}</p>
              <p className="mt-2 text-xs font-semibold text-zinc-700 uppercase tracking-wide">Kaç Gece</p>
              <p className="text-sm text-zinc-800">
                {calc.ok
                  ? `${calc.nights} Gece ${calc.nights + 1} Gün`
                  : `${packageTour.nightCount} Gece ${packageTour.dayCount} Gün`}
              </p>
              <div className="mt-3 grid gap-3 sm:grid-cols-1">
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Dahil Olan Aktiviteler</h3>
                  {includedActivityNames.length > 0 ? (
                    <ul className="mt-1 space-y-1">
                      {includedActivityNames.map((name) => (
                        <li key={name} className="text-xs text-zinc-700">• {name}</li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">Aktivite bilgisi yok.</p>
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-semibold uppercase tracking-wide text-zinc-700">Yan Hizmetler</h3>
                  {includedServices.length > 0 ? (
                    <ul className="mt-1 space-y-1.5">
                      {includedServices.map((svc) => (
                        <li key={svc.id} className="flex items-start gap-1.5 text-xs text-zinc-700">
                          <DictionaryIcon
                            iconKey={svc.iconKey}
                            fallbackEmoji={svc.icon}
                            className="mt-0.5 h-3.5 w-3.5 shrink-0 text-zinc-500"
                          />
                          <span>{svc.label}</span>
                        </li>
                      ))}
                    </ul>
                  ) : (
                    <p className="mt-1 text-xs text-zinc-500">Yan hizmet bilgisi yok.</p>
                  )}
                </div>
              </div>
            </div>
            <h2 className="text-base font-semibold text-zinc-900">Hesaplama</h2>
            <div className="mt-3 space-y-3">
              <button
                type="button"
                onClick={() => setDateOpen(true)}
                className="w-full rounded-lg border border-zinc-300 px-3 py-2 text-left text-sm"
              >
                {formatTrDateRangeShort(checkIn, checkOut)}
              </button>
              <div className="space-y-2 rounded-lg border border-zinc-200 p-3">
                {([
                  ['Yetişkin', adults, setAdults, 1],
                  ['Çocuk', children, setChildren, 0],
                  ['Bebek', infants, setInfants, 0],
                ] as const).map(([label, value, setter, min]) => (
                  <div key={label} className="flex items-center justify-between">
                    <span className="text-sm text-zinc-700">{label}</span>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        className="rounded border border-zinc-300 p-1"
                        onClick={() => setter((v) => clamp(v - 1, min, 20))}
                      >
                        <Minus className="h-3.5 w-3.5" />
                      </button>
                      <span className="w-6 text-center text-sm font-semibold">{value}</span>
                      <button
                        type="button"
                        className="rounded border border-zinc-300 p-1"
                        onClick={() => setter((v) => clamp(v + 1, min, 20))}
                      >
                        <Plus className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
            {calc.ok ? (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm text-zinc-600">Paket tutarı</p>
                <p className="text-xl font-bold text-zinc-900">{calc.total.toLocaleString('tr-TR')} TL</p>
                <p className="mt-1 text-xs text-zinc-500">{calc.nights} gece için hesaplandı</p>
              </div>
            ) : (
              <div className="mt-4 rounded-xl border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
                Bu tarih aralığında fiyat bulunamadı.
              </div>
            )}
            <div className="mt-4 border-t border-zinc-200 pt-4">
              <h3 className="text-sm font-semibold text-zinc-900">Ekstra aktiviteler</h3>
              <div className="mt-2 space-y-2">
                {extraCandidates.map((activity) => {
                  const selected = extras[activity.id];
                  return (
                    <div key={activity.id} className="rounded-lg border border-zinc-200 p-2">
                      <div className="flex items-center justify-between gap-2">
                        <p className="text-sm font-medium text-zinc-800">{activity.name}</p>
                        {selected ? (
                          <button
                            type="button"
                            onClick={() =>
                              setExtras((prev) => {
                                const next = { ...prev };
                                delete next[activity.id];
                                return next;
                              })
                            }
                            className="rounded border border-zinc-300 px-2 py-1 text-xs"
                          >
                            Çıkar
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setExtras((prev) => ({ ...prev, [activity.id]: { adults: 1, children: 0, infants: 0 } }))}
                            className="rounded border border-zinc-300 px-2 py-1 text-xs"
                          >
                            Ekle
                          </button>
                        )}
                      </div>
                      {selected && (
                        <div className="mt-2 space-y-1">
                          {(['adults', 'children', 'infants'] as const).map((field) => (
                            <div key={field} className="flex items-center justify-between">
                              <span className="text-xs text-zinc-600">
                                {field === 'adults' ? 'Yetişkin' : field === 'children' ? 'Çocuk' : 'Bebek'}
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  className="rounded border border-zinc-300 p-1"
                                  onClick={() => updateGuest(activity.id, field, -1)}
                                >
                                  <Minus className="h-3 w-3" />
                                </button>
                                <span className="w-5 text-center text-xs font-semibold">{selected[field]}</span>
                                <button
                                  type="button"
                                  className="rounded border border-zinc-300 p-1"
                                  onClick={() => updateGuest(activity.id, field, 1)}
                                >
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
                {extraCandidates.length === 0 && <p className="text-xs text-zinc-500">Ekstra aktivite bulunmuyor.</p>}
              </div>
            </div>
            {extraBreakdown.length > 0 && (
              <div className="mt-4 rounded-xl border border-zinc-200 bg-zinc-50 p-3">
                <p className="text-sm text-zinc-600">Ekstra aktiviteler</p>
                {extraBreakdown.map((row) => (
                  <p key={row.activity.id} className="mt-1 text-xs text-zinc-700">
                    {row.activity.name}: {row.total.toLocaleString('tr-TR')} TL
                  </p>
                ))}
              </div>
            )}
            <div className="mt-4 rounded-xl border border-blue-200 bg-blue-50 p-3 text-blue-900">
              <p className="text-sm text-blue-700">Genel Toplam</p>
              <p className="text-2xl font-bold">{grandTotal.toLocaleString('tr-TR')} TL</p>
            </div>
            <div className="mt-3 grid gap-2">
              <button
                type="button"
                onClick={() => setRequestOpen(true)}
                className="min-h-12 rounded-lg bg-[#1D61FF] px-4 py-3 text-sm font-semibold text-white hover:bg-blue-600"
              >
                Rezervasyon talebi oluştur
              </button>
              <a
                href={whatsappHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#25D366] bg-[#25D366] px-4 py-3 text-sm font-semibold text-white hover:bg-[#1ebe5d]"
              >
                <MessageCircle className="h-4 w-4 text-white" />
                Whatsapp&apos;dan Sor
              </a>
            </div>
          </aside>
        </section>
      </main>
      <VillaSearchDateRangeModal
        checkIn={checkIn}
        checkOut={checkOut}
        open={dateOpen}
        onClose={() => setDateOpen(false)}
        onChange={(next) => {
          setCheckIn(next.checkIn);
          setCheckOut(next.checkOut);
        }}
      />
      {requestOpen && (
        <div
          className="fixed inset-0 z-[120] flex items-end justify-center bg-black/50 p-4 sm:items-center"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) setRequestOpen(false);
          }}
        >
          <div className="w-full max-w-lg rounded-2xl bg-white p-5 shadow-2xl" onMouseDown={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold text-zinc-900">Rezervasyon Talebi</h3>
            <div className="mt-3 space-y-3">
              <label className="block text-sm">
                <span className="text-zinc-700">Ad Soyad</span>
                <input
                  value={requestName}
                  onChange={(e) => setRequestName(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="block text-sm">
                <span className="text-zinc-700">Telefon</span>
                <input
                  value={requestPhone}
                  onChange={(e) => setRequestPhone(e.target.value)}
                  className="mt-1 w-full rounded-lg border border-zinc-300 px-3 py-2"
                />
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-700">
                <input type="checkbox" checked={kvkkApproved} onChange={(e) => setKvkkApproved(e.target.checked)} className="mt-0.5" />
                Kişisel Verileri Koruma Politikası onayını kabul ediyorum.
              </label>
              <label className="flex items-start gap-2 text-sm text-zinc-700">
                <input
                  type="checkbox"
                  checked={commercialApproved}
                  onChange={(e) => setCommercialApproved(e.target.checked)}
                  className="mt-0.5"
                />
                Ticari Elektronik İleti onayını kabul ediyorum.
              </label>
            </div>
            <div className="mt-4 flex items-center justify-end gap-2">
              <button type="button" onClick={() => setRequestOpen(false)} className="rounded-lg border border-zinc-300 px-4 py-2 text-sm">
                Vazgeç
              </button>
              <button
                type="button"
                onClick={() => void submitRequest()}
                disabled={requestSaving}
                className="rounded-lg bg-zinc-900 px-4 py-2 text-sm font-semibold text-white"
              >
                {requestSaving ? 'Gönderiliyor…' : 'Gönder'}
              </button>
            </div>
          </div>
        </div>
      )}
      {requestMessage && (
        <div className="fixed bottom-4 left-1/2 z-[121] w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 rounded-lg border border-zinc-300 bg-white px-4 py-3 text-sm text-zinc-800 shadow-lg">
          {requestMessage}
        </div>
      )}

      <SiteFooter
        socialMedia={settings.socialMedia}
        footerManagement={settings.footerManagement}
        enabledSiteProducts={settings.siteManagement?.enabledSiteProducts}
      />
    </div>
  );
}

