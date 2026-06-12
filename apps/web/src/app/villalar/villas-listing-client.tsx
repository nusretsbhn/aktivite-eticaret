'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import {
  Bath,
  BedDouble,
  Filter,
  MapPin,
  Search,
  SlidersHorizontal,
  Users,
} from 'lucide-react';

import { VillaSearchDateRangeModal } from '@/components/site/villa-search-date-range-modal';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import { addDaysIso, nightDates, nightsBetween, sumNightlyPrices } from '@/lib/villa-booking-math';
import { formatVillaPrice, todayIsoLocal } from '@/lib/villa-public-pricing';
import { isValidVillaStayRange } from '@/lib/villa-stay-availability';
import type { AdminSettings } from '@/types/admin-settings';
import type { AdminVilla } from '@/types/admin-villa';

type SortKey = 'recommended' | 'priceAsc' | 'priceDesc' | 'nameAsc';

function locationLine(v: AdminVilla) {
  return [v.city, v.district, v.region].filter(Boolean).join(' / ');
}

function regionOptionsFromVillas(villas: AdminVilla[]): string[] {
  const s = new Set<string>();
  for (const v of villas) {
    for (const x of [v.city, v.district, v.region]) {
      const t = typeof x === 'string' ? x.trim() : '';
      if (t) s.add(t);
    }
  }
  return Array.from(s).sort((a, b) => a.localeCompare(b, 'tr'));
}

function featuredOptionsFromVillas(villas: AdminVilla[]): string[] {
  const byKey = new Map<string, string>();
  for (const v of villas) {
    const items = Array.isArray(v.featuredItems) ? v.featuredItems : [];
    for (const item of items) {
      const text = typeof item?.description === 'string' ? item.description.trim() : '';
      if (!text) continue;
      const key = text.toLocaleLowerCase('tr');
      if (!byKey.has(key)) byKey.set(key, text);
    }
  }
  return Array.from(byKey.values()).sort((a, b) => a.localeCompare(b, 'tr'));
}

function matchesRegion(v: AdminVilla, region: string): boolean {
  if (!region.trim()) return true;
  const r = region.trim().toLocaleLowerCase('tr');
  return locationLine(v).toLocaleLowerCase('tr').includes(r);
}

function matchesFeaturedItem(v: AdminVilla, feature: string): boolean {
  const target = feature.trim().toLocaleLowerCase('tr');
  if (!target) return true;
  return (v.featuredItems ?? []).some(
    (item) => (item.description ?? '').trim().toLocaleLowerCase('tr') === target,
  );
}

function coverImage(v: AdminVilla) {
  return (
    v.gallery.find((g) => g.isCover && g.type === 'image')?.url ??
    v.gallery.find((g) => g.type === 'image')?.url ??
    null
  );
}

function villaPriceMinMax(v: AdminVilla): { min: number; max: number } | null {
  const prices = Array.isArray(v.prices) ? v.prices : [];
  if (prices.length === 0) return null;
  let min = Infinity;
  let max = -Infinity;
  for (const p of prices) {
    if (!Number.isFinite(p.price)) continue;
    min = Math.min(min, p.price);
    max = Math.max(max, p.price);
  }
  if (!Number.isFinite(min) || !Number.isFinite(max) || max < min) return null;
  return { min, max };
}

export function VillasListingClient({
  villas,
  settings,
  initialQuery,
}: {
  villas: AdminVilla[];
  settings: AdminSettings;
  initialQuery?: {
    region?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string;
    q?: string;
  };
}) {
  const logoUrl = settings.siteManagement?.logoUrl;
  const active = useMemo(() => (villas ?? []).filter((v) => v.isActive), [villas]);
  const regions = useMemo(() => regionOptionsFromVillas(active), [active]);
  const featuredOptions = useMemo(() => featuredOptionsFromVillas(active), [active]);
  const tagMap = useMemo(() => new Map((settings.tags ?? []).map((t) => [t.id, t.name])), [settings.tags]);

  const isoOk = (s: string | undefined) => Boolean(s && /^\d{4}-\d{2}-\d{2}$/.test(s));

  const fromHomeSearch = isoOk(initialQuery?.checkIn) && isoOk(initialQuery?.checkOut);

  const [checkIn, setCheckIn] = useState(() =>
    fromHomeSearch && isoOk(initialQuery?.checkIn) ? initialQuery!.checkIn! : todayIsoLocal(),
  );
  const [checkOut, setCheckOut] = useState(() => {
    if (fromHomeSearch && isoOk(initialQuery?.checkOut) && isoOk(initialQuery?.checkIn)) {
      const a = initialQuery!.checkIn!;
      const b = initialQuery!.checkOut!;
      if (b > a) return b;
    }
    const base = isoOk(initialQuery?.checkIn) ? initialQuery!.checkIn! : todayIsoLocal();
    return addDaysIso(base, 2);
  });
  const [rangeModalOpen, setRangeModalOpen] = useState(false);

  // /villalar sekmesinden (tarih parametresi olmadan) gelince: ilk yüklemede tüm villalar görünsün.
  const [datesChosen, setDatesChosen] = useState<boolean>(fromHomeSearch);
  const dateFilterActive = fromHomeSearch || datesChosen;

  const [guests, setGuests] = useState(Math.max(1, Number(initialQuery?.guests || 1)));
  const [searchText, setSearchText] = useState(initialQuery?.q?.trim() ?? '');
  const [selectedRegions, setSelectedRegions] = useState<string[]>(
    initialQuery?.region ? [initialQuery.region] : [],
  );
  const [selectedFeatured, setSelectedFeatured] = useState<string[]>([]);
  const [bedroomsMin, setBedroomsMin] = useState('');
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [sortBy, setSortBy] = useState<SortKey>('priceAsc');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const toggleRegion = (r: string) => {
    setSelectedRegions((prev) => (prev.includes(r) ? prev.filter((x) => x !== r) : [...prev, r]));
  };

  const toggleFeatured = (feature: string) => {
    setSelectedFeatured((prev) =>
      prev.includes(feature) ? prev.filter((x) => x !== feature) : [...prev, feature],
    );
  };

  const resetFilters = () => {
    setSearchText('');
    setSelectedRegions([]);
    setSelectedFeatured([]);
    setBedroomsMin('');
    setPriceMinInput('');
    setPriceMaxInput('');
    setGuests(1);
  };

  const filtered = useMemo(() => {
    const q = searchText.trim().toLocaleLowerCase('tr');
    const minP = Number(priceMinInput || 0);
    const maxP = Number(priceMaxInput || 0);
    const bedMin = Number(bedroomsMin || 0);

    return active.filter((v) => {
      if (guests > v.guestCount) return false;
      if (bedMin > 0 && v.bedroomCount < bedMin) return false;
      if (selectedRegions.length && !selectedRegions.some((r) => matchesRegion(v, r))) return false;
      if (selectedFeatured.length && !selectedFeatured.some((feature) => matchesFeaturedItem(v, feature))) return false;
      if (q) {
        const blob = `${v.displayName} ${v.description} ${locationLine(v)}`.toLocaleLowerCase('tr');
        if (!blob.includes(q)) return false;
      }
      // Tarih seçimi yapılmadan / villalar sekmesinde ilk açılışta "tüm villalar" gösterilsin.
      if (dateFilterActive) {
        if (!isValidVillaStayRange(v, checkIn, checkOut)) return false;
        const n = nightsBetween(checkIn, checkOut);
        const dates = nightDates(checkIn, n);
        const { sum, missingDates } = sumNightlyPrices(v, dates);
        if (missingDates.length > 0 || sum <= 0) return false;
        if (Number.isFinite(minP) && minP > 0 && sum < minP) return false;
        if (Number.isFinite(maxP) && maxP > 0 && sum > maxP) return false;
      }
      return true;
    });
  }, [
    active,
    bedroomsMin,
    checkIn,
    checkOut,
    guests,
    priceMaxInput,
    priceMinInput,
    searchText,
    selectedRegions,
    selectedFeatured,
    dateFilterActive,
  ]);

  const sorted = useMemo(() => {
    const list = filtered.slice();
    list.sort((a, b) => {
      if (sortBy === 'priceAsc' || sortBy === 'priceDesc') {
        if (dateFilterActive) {
          const n = nightsBetween(checkIn, checkOut);
          const dates = nightDates(checkIn, n);
          const sa = sumNightlyPrices(a, dates).sum;
          const sb = sumNightlyPrices(b, dates).sum;
          return sortBy === 'priceAsc' ? sa - sb : sb - sa;
        }

        const pa = villaPriceMinMax(a);
        const pb = villaPriceMinMax(b);
        const aKey = pa?.min ?? Infinity;
        const bKey = pb?.min ?? Infinity;
        if (sortBy === 'priceAsc') return aKey - bKey;

        // priceDesc: yüksek aralığa göre (max)
        const aHigh = villaPriceMinMax(a)?.max ?? -Infinity;
        const bHigh = villaPriceMinMax(b)?.max ?? -Infinity;
        return bHigh - aHigh;
      }

      if (sortBy === 'nameAsc') return a.displayName.localeCompare(b.displayName, 'tr');
      const scoreA = (a.gallery?.length ?? 0) + a.bedroomCount;
      const scoreB = (b.gallery?.length ?? 0) + b.bedroomCount;
      return scoreB - scoreA;
    });
    return list;
  }, [filtered, sortBy, checkIn, checkOut, dateFilterActive]);

  const filterPanel = (
    <div className="rounded-2xl border border-zinc-200 bg-white p-4">
      <div className="mb-4 flex items-center justify-between">
        <p className="text-base font-bold text-zinc-900">Filtreler</p>
        <button type="button" onClick={resetFilters} className="text-xs font-semibold text-blue-700 hover:text-blue-800">
          Temizle
        </button>
      </div>

      <div className="space-y-5">
        <label className="block text-sm">
          <span className="mb-2 block font-semibold text-zinc-800">Ara</span>
          <div className="relative">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-zinc-400" />
            <input
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Villa adı, konum..."
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
          </div>
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Bölge</p>
          <div className="flex flex-wrap gap-2">
            {regions.map((loc) => (
              <button
                type="button"
                key={loc}
                onClick={() => toggleRegion(loc)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedRegions.includes(loc) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-zinc-300 text-zinc-800'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Öne çıkan özellikler</p>
          {featuredOptions.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {featuredOptions.map((feature) => (
                <button
                  type="button"
                  key={feature}
                  onClick={() => toggleFeatured(feature)}
                  className={`rounded-full border px-3 py-1.5 text-xs ${
                    selectedFeatured.includes(feature)
                      ? 'border-blue-700 bg-blue-50 text-blue-800'
                      : 'border-zinc-300 text-zinc-800'
                  }`}
                >
                  {feature}
                </button>
              ))}
            </div>
          ) : (
            <p className="text-xs text-zinc-500">Öne çıkan özellik tanımı olan villa bulunamadı.</p>
          )}
        </div>

        <label className="block text-sm">
          <span className="mb-2 block font-semibold text-zinc-800">Minimum yatak odası</span>
          <input
            type="number"
            min={0}
            value={bedroomsMin}
            onChange={(e) => setBedroomsMin(e.target.value)}
            placeholder="Örn. 3"
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </label>

        <label className="block text-sm">
          <span className="mb-2 block font-semibold text-zinc-800">Kişi sayısı</span>
          <input
            type="number"
            min={1}
            value={guests}
            onChange={(e) => setGuests(Math.max(1, Number(e.target.value || 1)))}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Toplam bütçe (konaklama)</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={priceMinInput}
              onChange={(e) => setPriceMinInput(e.target.value)}
              placeholder="Min"
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
            <input
              type="number"
              min={0}
              value={priceMaxInput}
              onChange={(e) => setPriceMaxInput(e.target.value)}
              placeholder="Max"
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900"
            />
          </div>
        </div>
      </div>
    </div>
  );

  const formatRangeLabel = () => {
    const a = new Date(`${checkIn}T12:00:00`);
    const b = new Date(`${checkOut}T12:00:00`);
    const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'long', year: 'numeric' };
    return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
  };

  return (
    <div className="min-h-screen bg-zinc-50">
      <header className="sticky top-0 z-40 border-b border-zinc-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex h-16 max-w-6xl items-center justify-between px-4">
          <Link href="/" className="flex items-center gap-2">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto" />
            ) : (
              <span className="text-base font-semibold tracking-wide text-zinc-900">Bodrum Aktivite</span>
            )}
          </Link>
          <nav className="hidden items-center gap-6 text-sm text-zinc-700 md:flex">
            <Link href="/aktiviteler" className="font-medium hover:text-zinc-900">
              Turlar
            </Link>
            <Link href="/villalar" className="font-medium text-zinc-900">
              Villalar
            </Link>
            <Link href="/blog" className="font-medium hover:text-zinc-900">
              Blog
            </Link>
            <Link href="/iletisim" className="font-medium hover:text-zinc-900">
              İletişim
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:contents">
              <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50" />
            </div>
            <button
              type="button"
              className="inline-flex min-h-10 shrink-0 items-center gap-2 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-semibold text-zinc-900 lg:hidden dark:border-zinc-600 dark:bg-zinc-900 dark:text-zinc-50"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter className="h-4 w-4 shrink-0 text-zinc-800 dark:text-zinc-200" aria-hidden />
              <span className="whitespace-nowrap">Filtreler</span>
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-sm">
          <button
            type="button"
            onClick={() => setRangeModalOpen(true)}
            className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg bg-zinc-200 px-3 text-center text-xs font-semibold text-zinc-900 sm:text-sm"
          >
            {dateFilterActive ? formatRangeLabel() : 'Tarih seçin'}
          </button>
        </div>

        {!fromHomeSearch && !dateFilterActive && (
          <p className="mb-4 text-sm font-medium text-zinc-600">Lütfen giriş çıkış tarihi seçin</p>
        )}

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">{filterPanel}</aside>

          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Villalar</h1>
                  <p className="text-sm font-medium text-zinc-700">{sorted.length} sonuç gösteriliyor</p>
                </div>
                <label className="inline-flex min-h-10 items-center gap-2 text-sm">
                  <SlidersHorizontal className="h-4 w-4 text-zinc-500" />
                  <span className="font-medium text-zinc-700">Sırala:</span>
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value as SortKey)}
                    className="min-h-10 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm font-medium text-zinc-900"
                  >
                    <option value="recommended">Önerilen</option>
                    <option value="priceAsc">Toplam fiyat (Artan)</option>
                    <option value="priceDesc">Toplam fiyat (Azalan)</option>
                    <option value="nameAsc">İsim (A-Z)</option>
                  </select>
                </label>
              </div>
            </div>

            {sorted.length === 0 ? (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
                Bu kriterlere uygun villa bulunamadı. Tarihleri veya filtreleri güncelleyin.
              </div>
            ) : (
              <ul className="space-y-4">
                {sorted.map((v) => {
                  const img = coverImage(v);
                  const cur = v.paymentCurrency;
                  const detailParams = new URLSearchParams();
                  if (dateFilterActive) {
                    detailParams.set('checkIn', checkIn);
                    detailParams.set('checkOut', checkOut);
                  }
                  const detailHref = detailParams.size
                    ? `/villalar/${encodeURIComponent(v.slug)}?${detailParams.toString()}`
                    : `/villalar/${encodeURIComponent(v.slug)}`;
                  const tags = (v.tagIds ?? [])
                    .map((id) => tagMap.get(id))
                    .filter((x): x is string => Boolean(x))
                    .slice(0, 3);

                  // Tarih filtresi açıksa (ana sayfa aramasından geldiyse veya kullanıcı tarih seçtiyse)
                  // "toplam · gecelik" formatına dön.
                  const calendarMinMax = villaPriceMinMax(v);
                  const calendarPriceLine = calendarMinMax
                    ? `${formatVillaPrice(calendarMinMax.min, cur)} - ${formatVillaPrice(calendarMinMax.max, cur)} / gecelik`
                    : null;

                  let dateBasedTotal: number | null = null;
                  let dateBasedAvgNight: number | null = null;
                  if (dateFilterActive) {
                    const n = nightsBetween(checkIn, checkOut);
                    const dates = nightDates(checkIn, n);
                    const { sum, missingDates } = sumNightlyPrices(v, dates);
                    if (missingDates.length === 0 && sum > 0) {
                      const cleaningFeeBase = n > 0 && v.cleaningFee > 0 ? v.cleaningFee : 0;
                      const isCleaningFreeByThreshold =
                        n > 0 && v.freeCleaningThreshold > 0 && n >= v.freeCleaningThreshold;
                      const cleaningFee = isCleaningFreeByThreshold ? 0 : cleaningFeeBase;
                      dateBasedTotal = sum + cleaningFee;
                      dateBasedAvgNight = Math.round(sum / Math.max(1, n));
                    }
                  }

                  return (
                    <li key={v.id}>
                      <Link
                        href={detailHref}
                        className="grid overflow-hidden rounded-2xl border border-zinc-200 bg-white transition hover:border-amber-200 hover:shadow-sm md:grid-cols-[240px_1fr]"
                      >
                        <div className="relative aspect-[16/10] bg-zinc-100 md:aspect-auto md:min-h-[200px]">
                          {img ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={img} alt="" className="h-full w-full object-cover" />
                          ) : (
                            <div className="flex h-full min-h-[160px] items-center justify-center text-xs text-zinc-400">
                              Görsel yok
                            </div>
                          )}
                          {!!tags.length && (
                            <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-1.5">
                              {tags.map((t) => (
                                <span
                                  key={t}
                                  className="inline-flex items-center rounded-full bg-white/90 px-2.5 py-1 text-[11px] font-semibold text-zinc-900 shadow-sm"
                                >
                                  {t}
                                </span>
                              ))}
                            </div>
                          )}
                        </div>
                        <div className="flex flex-col p-4">
                          <p className="text-[11px] font-semibold uppercase tracking-wide text-amber-800">Villa</p>
                          <h2 className="mt-1 text-xl font-bold text-zinc-900">{v.displayName}</h2>
                          <p className="mt-1 flex items-start gap-1.5 text-sm text-zinc-600">
                            <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-amber-700" aria-hidden />
                            {locationLine(v)}
                          </p>
                          <p className="mt-2 line-clamp-2 text-sm text-zinc-700">{v.description}</p>
                          <ul className="mt-3 flex flex-wrap gap-x-4 gap-y-1 text-sm text-zinc-700">
                            <li className="flex items-center gap-1">
                              <Users className="h-4 w-4 text-amber-700" aria-hidden />
                              {v.guestCount} kişi
                            </li>
                            <li className="flex items-center gap-1">
                              <BedDouble className="h-4 w-4 text-amber-700" aria-hidden />
                              {v.bedroomCount} yatak odası
                            </li>
                            <li className="flex items-center gap-1">
                              <Bath className="h-4 w-4 text-amber-700" aria-hidden />
                              {v.bathroomCount} banyo
                            </li>
                          </ul>
                          <div className="mt-auto border-t border-zinc-100 pt-3">
                            {dateFilterActive ? (
                              dateBasedTotal != null && dateBasedAvgNight != null ? (
                                <p className="text-lg font-bold tabular-nums text-zinc-900">
                                  {formatVillaPrice(dateBasedTotal, cur)}
                                  <span className="ml-1 text-sm font-semibold text-zinc-500">
                                    {' '}
                                    toplam · {formatVillaPrice(dateBasedAvgNight, cur)} / gecelik
                                  </span>
                                </p>
                              ) : (
                                <p className="text-sm text-zinc-500">Fiyat için tarih seçin</p>
                              )
                            ) : calendarPriceLine ? (
                              <p className="text-lg font-bold tabular-nums text-zinc-900">{calendarPriceLine}</p>
                            ) : (
                              <p className="text-sm text-zinc-500">Fiyat takvimi yok</p>
                            )}
                          </div>
                        </div>
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </div>
      </main>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" aria-label="Kapat" onClick={() => setMobileFiltersOpen(false)} />
          <div className="absolute bottom-0 left-0 right-0 max-h-[85vh] overflow-y-auto rounded-t-2xl bg-white p-4 shadow-xl">
            {filterPanel}
            <button
              type="button"
              className="mt-4 w-full rounded-xl bg-[#1D61FF] py-3 text-sm font-semibold text-white"
              onClick={() => setMobileFiltersOpen(false)}
            >
              Listeyi göster
            </button>
          </div>
        </div>
      )}

      <VillaSearchDateRangeModal
        checkIn={checkIn}
        checkOut={checkOut}
        open={rangeModalOpen}
        onClose={() => setRangeModalOpen(false)}
        onChange={(next) => {
          setCheckIn(next.checkIn);
          setCheckOut(next.checkOut);
          if (!fromHomeSearch) setDatesChosen(true);
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
