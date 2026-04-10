'use client';

import type { ReactNode } from 'react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { CalendarRange, ChevronLeft, ChevronRight, Images, Minus, Plus, UserRound } from 'lucide-react';

import { averageNightly, nightDates, nightsBetween, sumNightlyPrices } from '@/lib/villa-booking-math';
import { useVillaBookingDates } from '@/components/site/villa-booking-dates-context';
import { VillaBookingDateRangeModal } from '@/components/site/villa-booking-date-range-modal';
import { VillaInstantBookingGateModal } from '@/components/site/villa-instant-booking-gate-modal';
import { VillaGalleryLightbox } from '@/components/site/villa-gallery-lightbox';
import { useSiteAuth } from '@/components/site/site-auth-provider';
import { isValidVillaStayRange } from '@/lib/villa-stay-availability';
import { formatVillaPrice } from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';

function formatTrDateRange(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
  return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
}

type Props = {
  villa: AdminVilla;
  /** Galeri + küçük resimlerden sonraki sol sütun içeriği (detay metinleri vb.); sağ blok sabit kalır. */
  children?: ReactNode;
};

export function VillaDetailTopSection({ villa, children }: Props) {
  const router = useRouter();
  const { checkIn, checkOut, setDates } = useVillaBookingDates();
  const { user, openAuth } = useSiteAuth();
  const [instantGateOpen, setInstantGateOpen] = useState(false);
  const requestOnlyBtnRef = useRef<HTMLButtonElement>(null);

  const gallerySorted = useMemo(
    () => [...villa.gallery].sort((a, b) => a.sortOrder - b.sortOrder),
    [villa.gallery],
  );
  const images = gallerySorted.filter((g) => g.type === 'image');
  const [activeImg, setActiveImg] = useState(0);
  const mainUrl = images[activeImg]?.url ?? images[0]?.url;

  const [adultGuests, setAdultGuests] = useState(1);
  const [childGuests, setChildGuests] = useState(0);
  const [infantGuests, setInfantGuests] = useState(0);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [galleryLightboxOpen, setGalleryLightboxOpen] = useState(false);

  const nights = nightsBetween(checkIn, checkOut);
  const dates = nightDates(checkIn, nights);
  const { sum: nightlySum, missingDates, byNight } = sumNightlyPrices(villa, dates);
  const avgNight = averageNightly(nightlySum, Math.max(1, nights));

  const cleaningFeeBase = nights > 0 && villa.cleaningFee > 0 ? villa.cleaningFee : 0;
  const isCleaningFreeByThreshold =
    nights > 0 && villa.freeCleaningThreshold > 0 && nights >= villa.freeCleaningThreshold;
  const cleaningFee = isCleaningFreeByThreshold ? 0 : cleaningFeeBase;

  const lodgingSubtotal = nightlySum;

  const total = lodgingSubtotal + cleaningFee;
  const prepayment = villa.prepaymentPercent > 0 ? Math.round((total * villa.prepaymentPercent) / 100) : 0;
  const remainder = total - prepayment;

  const fmt = (n: number) => formatVillaPrice(n, villa.paymentCurrency);

  const goPrev = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImg((i) => (i <= 0 ? images.length - 1 : i - 1));
  }, [images.length]);

  const goNext = useCallback(() => {
    if (images.length <= 1) return;
    setActiveImg((i) => (i >= images.length - 1 ? 0 : i + 1));
  }, [images.length]);

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (galleryLightboxOpen || calendarOpen || instantGateOpen) return;
      if (e.key === 'ArrowLeft') goPrev();
      if (e.key === 'ArrowRight') goNext();
    }
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [goPrev, goNext, galleryLightboxOpen, calendarOpen, instantGateOpen]);

  const stayAvailabilityOk = isValidVillaStayRange(villa, checkIn, checkOut);
  const canBook =
    nights > 0 &&
    missingDates.length === 0 &&
    total > 0 &&
    stayAvailabilityOk &&
    adultGuests >= 1 &&
    adultGuests <= villa.guestCount;

  return (
    <div className="grid min-w-0 grid-cols-1 gap-8 overflow-visible lg:grid-cols-[minmax(0,1fr)_minmax(0,400px)] lg:items-start lg:gap-x-8 lg:gap-y-0">
      {/* Sol üst: galeri */}
      <div className="min-w-0 lg:col-start-1 lg:row-start-1">
        <div className="relative overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 shadow-sm">
          {mainUrl ? (
            <>
              <div className="relative h-[clamp(224px,38.4vw,496px)] w-full sm:h-[clamp(272px,35.2vw,544px)]">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={mainUrl} alt="" className="h-full w-full object-cover" />
              </div>
              {images.length > 1 && (
                <>
                  <button
                    type="button"
                    onClick={() => goPrev()}
                    className="absolute left-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md backdrop-blur transition hover:bg-white"
                    aria-label="Önceki görsel"
                  >
                    <ChevronLeft className="h-6 w-6" />
                  </button>
                  <button
                    type="button"
                    onClick={() => goNext()}
                    className="absolute right-3 top-1/2 z-10 flex h-10 w-10 -translate-y-1/2 items-center justify-center rounded-full border border-white/80 bg-white/95 text-zinc-800 shadow-md backdrop-blur transition hover:bg-white"
                    aria-label="Sonraki görsel"
                  >
                    <ChevronRight className="h-6 w-6" />
                  </button>
                </>
              )}
              <div className="absolute bottom-4 right-4 z-20 flex flex-wrap items-center justify-end gap-2">
                <span className="rounded-full bg-zinc-900/80 px-3 py-1.5 text-xs font-semibold text-white backdrop-blur-sm">
                  {activeImg + 1} / {images.length}
                </span>
                {images.length >= 1 && (
                  <button
                    type="button"
                    onClick={() => setGalleryLightboxOpen(true)}
                    className="inline-flex items-center gap-2 rounded-full border border-white/90 bg-white/95 px-4 py-2 text-sm font-semibold text-zinc-900 shadow-md backdrop-blur transition hover:bg-white"
                  >
                    <Images className="h-4 w-4 text-teal-600" aria-hidden />
                    Galeri ({images.length})
                  </button>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-[clamp(208px,32vw,320px)] items-center justify-center text-sm text-zinc-400">Görsel yok</div>
          )}
        </div>

        {images.length > 1 && (
          <div
            id="villa-gallery-thumbs"
            className="mt-3 flex max-w-full gap-2 overflow-x-auto overflow-y-hidden pb-1 [-webkit-overflow-scrolling:touch]"
          >
            {images.map((g, i) => (
              <button
                key={g.id}
                type="button"
                onClick={() => setActiveImg(i)}
                className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-lg border-2 transition ${
                  i === activeImg ? 'border-teal-600 ring-2 ring-teal-200' : 'border-transparent opacity-80 hover:opacity-100'
                }`}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={g.url} alt="" className="h-full w-full object-cover" />
              </button>
            ))}
          </div>
        )}

        <VillaGalleryLightbox
          images={images}
          open={galleryLightboxOpen}
          onClose={() => setGalleryLightboxOpen(false)}
          activeIndex={activeImg}
          onActiveIndexChange={setActiveImg}
        />

        <VillaInstantBookingGateModal
          open={instantGateOpen}
          onClose={() => setInstantGateOpen(false)}
          user={user}
          onLogin={() => openAuth('login')}
          onRegister={() => {
            const q = new URLSearchParams();
            q.set('villa', villa.slug);
            q.set('checkIn', checkIn);
            q.set('checkOut', checkOut);
            q.set('guests', String(adultGuests));
            q.set('children', String(childGuests));
            q.set('infants', String(infantGuests));
            router.push(`/kayit?${q.toString()}`);
          }}
          onRequestWithoutAccount={() => {
            setInstantGateOpen(false);
            const q = new URLSearchParams();
            q.set('villa', villa.slug);
            q.set('checkIn', checkIn);
            q.set('checkOut', checkOut);
            q.set('guests', String(adultGuests));
            q.set('children', String(childGuests));
            q.set('infants', String(infantGuests));
            router.push(`/villalar/on-rezervasyon?${q.toString()}`);
          }}
        />
      </div>

      {/* Sağ: rezervasyon — tüm sayfa yüksekliğinde kaydırma sırasında sabit */}
      <aside className="min-w-0 shrink-0 lg:sticky lg:top-24 lg:z-30 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start">
        <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-sm sm:p-6">
          <div>
            {byNight.length > 0 && nights > 0 ? (
              <p className="text-2xl font-bold tabular-nums text-zinc-900 sm:text-3xl">
                {fmt(avgNight)}
                <span className="text-base font-semibold text-zinc-500 sm:text-lg"> / gece</span>
              </p>
            ) : (
              <p className="text-lg font-semibold text-zinc-600">Tarih seçin</p>
            )}
            <p className="mt-1 text-xs text-zinc-500">Seçili geceler için ortalama (fiyat takvimine göre)</p>
          </div>

          <div className="mt-5 space-y-3">
            <label className="block text-xs font-medium text-zinc-500">
              Giriş – çıkış
              <button
                type="button"
                onClick={() => setCalendarOpen(true)}
                className="mt-1.5 flex min-h-11 w-full items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-left text-sm font-medium text-zinc-900 transition hover:border-zinc-300 hover:bg-white"
              >
                <CalendarRange className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                <span className="min-w-0 flex-1 truncate">{formatTrDateRange(checkIn, checkOut)}</span>
              </button>
            </label>

            <VillaBookingDateRangeModal
              villa={villa}
              checkIn={checkIn}
              checkOut={checkOut}
              open={calendarOpen}
              onClose={() => setCalendarOpen(false)}
              onChange={setDates}
            />

            <label className="block text-xs font-medium text-zinc-500">
              Misafir
              <div className="mt-1.5 flex min-h-11 items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2">
                <UserRound className="h-4 w-4 shrink-0 text-teal-600" aria-hidden />
                <div className="w-full space-y-2">
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-900">Yetişkin (13+)</span>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setAdultGuests((n) => Math.max(1, n - 1))}
                        disabled={adultGuests <= 1}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Yetişkin azalt"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-6 text-center font-semibold text-zinc-900">{adultGuests}</span>
                      <button
                        type="button"
                        onClick={() => setAdultGuests((n) => Math.min(villa.guestCount, n + 1))}
                        disabled={adultGuests >= villa.guestCount}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Yetişkin artır"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-900">Çocuk (3-12)</span>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setChildGuests((n) => Math.max(0, n - 1))}
                        disabled={childGuests <= 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Çocuk azalt"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-6 text-center font-semibold text-zinc-900">{childGuests}</span>
                      <button
                        type="button"
                        onClick={() => setChildGuests((n) => n + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700"
                        aria-label="Çocuk artır"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center justify-between gap-2 text-sm">
                    <span className="font-medium text-zinc-900">Bebek (0-2)</span>
                    <div className="inline-flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => setInfantGuests((n) => Math.max(0, n - 1))}
                        disabled={infantGuests <= 0}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                        aria-label="Bebek azalt"
                      >
                        <Minus className="h-4 w-4" aria-hidden />
                      </button>
                      <span className="min-w-6 text-center font-semibold text-zinc-900">{infantGuests}</span>
                      <button
                        type="button"
                        onClick={() => setInfantGuests((n) => n + 1)}
                        className="inline-flex h-8 w-8 items-center justify-center rounded-md border border-zinc-300 bg-white text-zinc-700"
                        aria-label="Bebek artır"
                      >
                        <Plus className="h-4 w-4" aria-hidden />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </label>
          </div>

          {missingDates.length > 0 && (
            <p className="mt-4 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
              Seçilen tarihlerden bazıları için gecelik fiyat tanımlı değil. Yönetim panelinden fiyat ekleyin veya tarih aralığını
              değiştirin.
            </p>
          )}

          <div className="mt-6 space-y-2.5 text-sm">
            {nights > 0 && byNight.length > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-600">
                  {fmt(avgNight)} × {nights} gece
                </span>
                <span className="font-medium tabular-nums text-zinc-900">{fmt(lodgingSubtotal)}</span>
              </div>
            )}
            {nights > 0 && (
              <div className="flex justify-between gap-4">
                <span className="text-zinc-600">Temizlik ücreti</span>
                <span className="font-medium tabular-nums text-zinc-900">{fmt(cleaningFee)}</span>
              </div>
            )}
          </div>

          <div className="my-4 border-t border-dashed border-zinc-200" />

          <div className="flex items-end justify-between gap-4">
            <span className="text-base font-semibold text-zinc-900">Toplam ücret</span>
            <span className="text-2xl font-bold tabular-nums text-zinc-900">{nights > 0 ? fmt(total) : '—'}</span>
          </div>

          {nights > 0 && total > 0 && (
            <div className="mt-4 space-y-2 border-t border-zinc-100 pt-4 text-sm">
              <div className="flex justify-between gap-4">
                <span className="text-zinc-600">Ön ödeme tutarı</span>
                <span className="font-semibold tabular-nums text-zinc-900">{fmt(prepayment)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-600">Kalan ödeme tutarı (Eve girişte)</span>
                <span className="font-semibold tabular-nums text-zinc-900">{fmt(remainder)}</span>
              </div>
              <div className="flex justify-between gap-4">
                <span className="text-zinc-600">Hasar depozitosu</span>
                <span className="font-semibold tabular-nums text-zinc-900">{fmt(villa.damageDeposit)}</span>
              </div>
              <p className="text-xs text-zinc-500">Giriş sırasında villa sahibine ödenir.</p>
              <p className="text-xs text-zinc-500">
                Ön ödeme oranı %{villa.prepaymentPercent}. Tahmini tutar; kesin fiyat için onay gerekir.
              </p>
            </div>
          )}

          <div className="mt-6 flex flex-col gap-3">
            <button
              type="button"
              disabled={!canBook}
              onClick={() => {
                if (!canBook) return;
                if (user) {
                  const q = new URLSearchParams({
                    villa: villa.slug,
                    checkIn,
                    checkOut,
                    guests: String(adultGuests),
                    children: String(childGuests),
                    infants: String(infantGuests),
                  });
                  router.push(`/villalar/on-rezervasyon?${q.toString()}`);
                  return;
                }
                setInstantGateOpen(true);
              }}
              className="min-h-12 w-full rounded-xl bg-teal-600 px-4 text-sm font-semibold text-white shadow-sm transition hover:bg-teal-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Anında Rezervasyon Yap
            </button>
            <button
              type="button"
              ref={requestOnlyBtnRef}
              disabled={!canBook}
              onClick={() => {
                if (!canBook) return;
                const q = new URLSearchParams({
                  villa: villa.slug,
                  checkIn,
                  checkOut,
                  guests: String(adultGuests),
                  children: String(childGuests),
                  infants: String(infantGuests),
                });
                router.push(`/villalar/on-rezervasyon?${q.toString()}`);
              }}
              className="min-h-12 w-full rounded-xl border-2 border-teal-600 bg-white px-4 text-sm font-semibold text-teal-700 transition hover:bg-teal-50 disabled:cursor-not-allowed disabled:opacity-50"
            >
              Rezervasyon Talebi Oluştur
            </button>
          </div>
        </div>
      </aside>

      {/* Sol alt: villa detay içeriği (yalnızca sol sütunda kayar) */}
      {children ? (
        <div className="mt-10 min-w-0 lg:col-start-1 lg:row-start-2 lg:max-w-none">{children}</div>
      ) : null}
    </div>
  );
}
