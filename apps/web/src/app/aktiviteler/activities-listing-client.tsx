'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useRef, useState, type Dispatch, type SetStateAction } from 'react';
import {
  Baby,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Filter,
  MapPin,
  Minus,
  Plus,
  Search,
  SlidersHorizontal,
  UserRound,
  Users,
  X,
} from 'lucide-react';

import { DictionaryIcon } from '@/components/icons/dictionary-icon';
import { SiteDatePickerOverlay } from '@/components/site/site-date-picker-overlay';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { SiteFooter } from '@/components/site/site-footer';
import { computeActivityBookingTotal, resolveActivityPrices } from '@/lib/activity-pricing';
import { getAvailabilityForDate } from '@/lib/availability-helpers';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

type SortKey = 'recommended' | 'priceAsc' | 'priceDesc' | 'nameAsc';
type DetailsTab = 'general' | 'gallery';

function toIsoDate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function parseIsoDate(iso: string) {
  const [y, m, d] = iso.split('-').map(Number);
  return new Date(y, (m || 1) - 1, d || 1);
}

function shiftDate(iso: string, dayDiff: number) {
  const date = parseIsoDate(iso);
  date.setDate(date.getDate() + dayDiff);
  return toIsoDate(date);
}

function formatDateLong(iso: string) {
  return new Intl.DateTimeFormat('tr-TR', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    weekday: 'long',
  }).format(parseIsoDate(iso));
}

function formatTry(amount: number) {
  return new Intl.NumberFormat('tr-TR', { maximumFractionDigits: 0 }).format(amount || 0);
}

function getImages(a: AdminActivity) {
  return (a.gallery ?? [])
    .filter((g) => g.type === 'image' && g.url)
    .slice()
    .sort((x, y) => (x.isCover === y.isCover ? x.sortOrder - y.sortOrder : x.isCover ? -1 : 1));
}

function shortText(s: string, max = 190) {
  const t = String(s ?? '').trim().replace(/\s+/g, ' ');
  if (!t) return '';
  return t.length > max ? `${t.slice(0, max - 1)}...` : t;
}

export function ActivitiesListingClient({
  activities,
  settings,
  initialQuery,
}: {
  activities: AdminActivity[];
  settings: AdminSettings;
  initialQuery?: {
    q?: string;
    date?: string;
    location?: string;
    mainCategory?: string;
    subCategoryId?: string;
    tagId?: string;
    people?: string;
  };
}) {
  const router = useRouter();
  const listingDateBtnRef = useRef<HTMLButtonElement>(null);
  const [listingDateOpen, setListingDateOpen] = useState(false);
  const initialDate =
    initialQuery?.date && /^\d{4}-\d{2}-\d{2}$/.test(initialQuery.date)
      ? initialQuery.date
      : toIsoDate(new Date());
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const [sortBy, setSortBy] = useState<SortKey>('recommended');
  const [searchText, setSearchText] = useState(initialQuery?.q ?? '');
  const [selectedLocations, setSelectedLocations] = useState<string[]>(
    initialQuery?.location ? [initialQuery.location] : [],
  );
  const [selectedMainCategories, setSelectedMainCategories] = useState<string[]>(
    initialQuery?.mainCategory ? [initialQuery.mainCategory] : [],
  );
  const [selectedSubCategoryIds, setSelectedSubCategoryIds] = useState<string[]>(
    initialQuery?.subCategoryId ? [initialQuery.subCategoryId] : [],
  );
  const [selectedTagIds, setSelectedTagIds] = useState<string[]>(
    initialQuery?.tagId ? [initialQuery.tagId] : [],
  );
  const [personCount, setPersonCount] = useState(Math.max(1, Number(initialQuery?.people || 1)));
  const [priceMinInput, setPriceMinInput] = useState('');
  const [priceMaxInput, setPriceMaxInput] = useState('');
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const [expandedIds, setExpandedIds] = useState<Record<string, boolean>>({});
  const [detailsTabById, setDetailsTabById] = useState<Record<string, DetailsTab>>({});
  const [imageIndexById, setImageIndexById] = useState<Record<string, number>>({});
  const [lightbox, setLightbox] = useState<{ activityId: string; index: number } | null>(null);
  const [selectedActivityId, setSelectedActivityId] = useState<string | null>(null);
  /** Seçilen kart için yetişkin / çocuk / bebek (kart bazında). */
  const [bookingGuestsById, setBookingGuestsById] = useState<
    Record<string, { adults: number; children: number; infants: number }>
  >({});

  const logoUrl = settings.siteManagement?.logoUrl;
  const activeActivities = useMemo(
    () => (activities ?? []).filter((a) => a && a.isActive),
    [activities],
  );

  const locationOptions = useMemo(
    () =>
      Array.from(new Set(activeActivities.map((a) => a.location?.trim()).filter(Boolean) as string[])).sort(
        (a, b) => a.localeCompare(b, 'tr'),
      ),
    [activeActivities],
  );

  const dictionaryMap = useMemo(() => {
    const m = new Map(settings.dictionaries.map((d) => [d.id, d]));
    return m;
  }, [settings.dictionaries]);

  const subCategoryNameMap = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of settings.categories) {
      for (const s of c.subcategories) m.set(s.id, s.name);
    }
    return m;
  }, [settings.categories]);

  const selectedDatePriceValues = useMemo(() => {
    return activeActivities
      .map((a) => (a.prices ?? []).find((p) => p.date === selectedDate)?.price)
      .filter((x): x is number => typeof x === 'number' && Number.isFinite(x));
  }, [activeActivities, selectedDate]);

  const minFoundPrice = selectedDatePriceValues.length ? Math.min(...selectedDatePriceValues) : 0;
  const maxFoundPrice = selectedDatePriceValues.length ? Math.max(...selectedDatePriceValues) : 0;

  const filteredAndSorted = useMemo(() => {
    const search = searchText.trim().toLocaleLowerCase('tr');
    const minPrice = Number(priceMinInput || 0);
    const maxPrice = Number(priceMaxInput || 0);

    let list = activeActivities.filter((a) => {
      const name = a.name?.toLocaleLowerCase('tr') ?? '';
      const description = a.description?.toLocaleLowerCase('tr') ?? '';
      const location = a.location?.toLocaleLowerCase('tr') ?? '';
      const subNames = (a.subCategoryIds ?? []).map((id) => subCategoryNameMap.get(id) ?? '');
      const joinedSub = subNames.join(' ').toLocaleLowerCase('tr');
      const todayPrice = (a.prices ?? []).find((p) => p.date === selectedDate)?.price;
      if (typeof todayPrice !== 'number' || !Number.isFinite(todayPrice)) return false;

      if (search && !name.includes(search) && !description.includes(search) && !location.includes(search) && !joinedSub.includes(search)) {
        return false;
      }
      if (selectedLocations.length && !selectedLocations.includes(a.location || '')) return false;
      if (selectedMainCategories.length && !selectedMainCategories.includes(a.mainCategory)) return false;
      if (selectedSubCategoryIds.length && !(a.subCategoryIds ?? []).some((id) => selectedSubCategoryIds.includes(id))) return false;
      if (selectedTagIds.length && !(a.tagIds ?? []).some((id) => selectedTagIds.includes(id))) return false;
      if ((a.capacity ?? 0) < personCount) return false;
      if (Number.isFinite(minPrice) && minPrice > 0 && (typeof todayPrice !== 'number' || todayPrice < minPrice)) return false;
      if (Number.isFinite(maxPrice) && maxPrice > 0 && (typeof todayPrice !== 'number' || todayPrice > maxPrice)) return false;
      return true;
    });

    list = list.slice().sort((a, b) => {
      const pa = (a.prices ?? []).find((p) => p.date === selectedDate)?.price ?? Number.POSITIVE_INFINITY;
      const pb = (b.prices ?? []).find((p) => p.date === selectedDate)?.price ?? Number.POSITIVE_INFINITY;
      if (sortBy === 'priceAsc') return pa - pb;
      if (sortBy === 'priceDesc') return pb - pa;
      if (sortBy === 'nameAsc') return a.name.localeCompare(b.name, 'tr');
      const scoreA = (a.tagIds?.length ?? 0) * 2 + (a.gallery?.length ?? 0) + (a.trips?.length ?? 0);
      const scoreB = (b.tagIds?.length ?? 0) * 2 + (b.gallery?.length ?? 0) + (b.trips?.length ?? 0);
      return scoreB - scoreA;
    });

    return list;
  }, [
    activeActivities,
    personCount,
    priceMaxInput,
    priceMinInput,
    searchText,
    selectedDate,
    selectedLocations,
    selectedMainCategories,
    selectedSubCategoryIds,
    selectedTagIds,
    sortBy,
    subCategoryNameMap,
  ]);

  const availabilityPartition = useMemo(() => {
    const available: AdminActivity[] = [];
    const blocked: AdminActivity[] = [];
    for (const a of filteredAndSorted) {
      if (getAvailabilityForDate(a, selectedDate) === 'available') {
        available.push(a);
      } else {
        blocked.push(a);
      }
    }
    return {
      displayList: [...available, ...blocked],
      blockedIds: new Set(blocked.map((x) => x.id)),
      availableCount: available.length,
      blockedCount: blocked.length,
    };
  }, [filteredAndSorted, selectedDate]);

  useEffect(() => {
    if (!selectedActivityId) return;
    const stillHere = availabilityPartition.displayList.some((a) => a.id === selectedActivityId);
    if (!stillHere || availabilityPartition.blockedIds.has(selectedActivityId)) {
      setSelectedActivityId(null);
    }
  }, [selectedActivityId, availabilityPartition.displayList, availabilityPartition.blockedIds]);

  function toggleInArray(setter: Dispatch<SetStateAction<string[]>>, value: string) {
    setter((prev) => (prev.includes(value) ? prev.filter((x) => x !== value) : [...prev, value]));
  }

  function resetFilters() {
    setSearchText('');
    setSelectedLocations([]);
    setSelectedMainCategories([]);
    setSelectedSubCategoryIds([]);
    setSelectedTagIds([]);
    setPersonCount(1);
    setPriceMinInput('');
    setPriceMaxInput('');
  }

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
              placeholder="Tur adı, lokasyon..."
              className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white py-2 pl-9 pr-3 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
          </div>
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Lokasyon</p>
          <div className="flex flex-wrap gap-2">
            {locationOptions.map((loc) => (
              <button
                type="button"
                key={loc}
                onClick={() => toggleInArray(setSelectedLocations, loc)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedLocations.includes(loc) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-zinc-300 text-zinc-800'
                }`}
              >
                {loc}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Kategori</p>
          <div className="flex flex-wrap gap-2">
            {settings.categories.map((c) => (
              <button
                key={c.id}
                type="button"
                onClick={() => toggleInArray(setSelectedMainCategories, c.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedMainCategories.includes(c.id) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-zinc-300 text-zinc-800'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Alt Kategoriler</p>
          <div className="flex flex-wrap gap-2">
            {settings.categories.flatMap((c) => c.subcategories).map((s) => (
              <button
                key={s.id}
                type="button"
                onClick={() => toggleInArray(setSelectedSubCategoryIds, s.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedSubCategoryIds.includes(s.id) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-zinc-300 text-zinc-800'
                }`}
              >
                {s.name}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Etiketler</p>
          <div className="flex flex-wrap gap-2">
            {settings.tags.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => toggleInArray(setSelectedTagIds, t.id)}
                className={`rounded-full border px-3 py-1.5 text-xs ${
                  selectedTagIds.includes(t.id) ? 'border-blue-700 bg-blue-50 text-blue-800' : 'border-zinc-300 text-zinc-800'
                }`}
              >
                {t.name}
              </button>
            ))}
          </div>
        </div>

        <label className="block text-sm">
          <span className="mb-2 block font-semibold text-zinc-800">Kişi Sayısı</span>
          <input
            type="number"
            min={1}
            value={personCount}
            onChange={(e) => setPersonCount(Math.max(1, Number(e.target.value || 1)))}
            className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-zinc-900 placeholder:text-zinc-500"
          />
        </label>

        <div>
          <p className="mb-2 text-sm font-semibold text-zinc-800">Bütçe (kişi başı)</p>
          <div className="grid grid-cols-2 gap-2">
            <input
              type="number"
              min={0}
              value={priceMinInput}
              onChange={(e) => setPriceMinInput(e.target.value)}
              placeholder={minFoundPrice ? `Min ${formatTry(minFoundPrice)}` : 'Min'}
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
            <input
              type="number"
              min={0}
              value={priceMaxInput}
              onChange={(e) => setPriceMaxInput(e.target.value)}
              placeholder={maxFoundPrice ? `Max ${formatTry(maxFoundPrice)}` : 'Max'}
              className="min-h-11 rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm text-zinc-900 placeholder:text-zinc-500"
            />
          </div>
        </div>
      </div>
    </div>
  );

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
            <Link href="#" className="font-medium hover:text-zinc-900">
              Kampanyalar
            </Link>
            <Link href="/blog" className="font-medium hover:text-zinc-900">
              Blog
            </Link>
          </nav>
          <div className="flex items-center gap-2">
            <div className="hidden md:contents">
              <SiteAccountWithNotifications menuClassName="inline-flex min-h-10 items-center rounded-lg border border-zinc-300 bg-white px-4 py-2 text-sm font-semibold text-zinc-900 hover:bg-zinc-50" />
            </div>
            <button
              type="button"
              className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 text-sm lg:hidden"
              onClick={() => setMobileFiltersOpen(true)}
            >
              <Filter className="h-4 w-4" />
              Filtreler
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-5">
        <div className="mb-4 flex flex-wrap items-center gap-2 rounded-xl border border-zinc-200 bg-white p-2 text-sm">
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDate(d, -1))}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 font-semibold text-zinc-700"
          >
            <ChevronLeft className="h-4 w-4" /> Önceki gün
          </button>
          <button
            type="button"
            ref={listingDateBtnRef}
            aria-label="Tarih seçin"
            onClick={() => setListingDateOpen(true)}
            className="flex min-h-10 min-w-0 flex-1 cursor-pointer items-center justify-center rounded-lg bg-zinc-200 px-3 text-center font-semibold text-zinc-900 transition hover:bg-zinc-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
          >
            {formatDateLong(selectedDate)}
          </button>
          <button
            type="button"
            onClick={() => setSelectedDate((d) => shiftDate(d, 1))}
            className="inline-flex min-h-10 items-center gap-2 rounded-lg border border-zinc-300 px-3 py-2 font-semibold text-zinc-700"
          >
            Sonraki gün <ChevronRight className="h-4 w-4" />
          </button>
        </div>

        <div className="grid gap-4 lg:grid-cols-[280px_1fr]">
          <aside className="hidden lg:block">{filterPanel}</aside>

          <section className="space-y-4">
            <div className="rounded-xl border border-zinc-200 bg-white p-3 sm:p-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h1 className="text-2xl font-extrabold tracking-tight text-zinc-900">Aktiviteler</h1>
                  <p className="text-sm font-medium text-zinc-700">
                    {availabilityPartition.displayList.length} sonuç gösteriliyor
                    {availabilityPartition.blockedCount > 0
                      ? ` · ${availabilityPartition.availableCount} müsait · ${availabilityPartition.blockedCount} dolu/bakım`
                      : ''}
                  </p>
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
                    <option value="priceAsc">Fiyat (Artan)</option>
                    <option value="priceDesc">Fiyat (Azalan)</option>
                    <option value="nameAsc">İsim (A-Z)</option>
                  </select>
                </label>
              </div>
            </div>

            {availabilityPartition.displayList.map((a, index) => {
              const images = getImages(a);
              const currentIdx = Math.min(imageIndexById[a.id] ?? 0, Math.max(images.length - 1, 0));
              const currentImg = images[currentIdx];
              const isExpanded = Boolean(expandedIds[a.id]);
              const isSelected = selectedActivityId === a.id;
              const activeTab = detailsTabById[a.id] ?? 'general';
              const trips = (a.trips ?? []).slice().sort((x, y) => x.departureTime.localeCompare(y.departureTime));
              const priceRow = (a.prices ?? []).find((p) => p.date === selectedDate);
              const hasPrice = typeof priceRow?.price === 'number' && Number.isFinite(priceRow.price);
              const { adult: adultUnit, child: childUnit, infant: infantUnit } = resolveActivityPrices(priceRow);
              const maxPeople = Math.max(1, a.capacity ?? 1);
              const guests = isSelected
                ? bookingGuestsById[a.id] ?? {
                    adults: Math.min(Math.max(1, personCount), maxPeople),
                    children: 0,
                    infants: 0,
                  }
                : { adults: Math.max(1, personCount), children: 0, infants: 0 };
              const peopleForTotals = guests.adults + guests.children + guests.infants;
              const bookingTotal = computeActivityBookingTotal(priceRow, guests.adults, guests.children, guests.infants);
              const previewTotal = computeActivityBookingTotal(priceRow, Math.max(1, personCount), 0, 0);
              const cardTotal = isSelected ? bookingTotal : previewTotal;
              const included = (a.includedItemIds ?? []).map((id) => dictionaryMap.get(id)).filter(Boolean);
              const excluded = (a.excludedItemIds ?? []).map((id) => dictionaryMap.get(id)).filter(Boolean);
              const tags = (a.tagIds ?? [])
                .map((id) => settings.tags.find((t) => t.id === id)?.name)
                .filter((x): x is string => Boolean(x));
              const bookingBlocked = availabilityPartition.blockedIds.has(a.id);
              const blockReason = bookingBlocked
                ? getAvailabilityForDate(a, selectedDate) === 'full'
                  ? 'Dolu'
                  : 'Bakım'
                : null;

              return (
                <div key={a.id} className="space-y-4">
                  {availabilityPartition.blockedCount > 0 && index === availabilityPartition.availableCount && (
                    <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-900/50 dark:bg-amber-950/40">
                      <p className="font-semibold text-amber-900 dark:text-amber-100">Bu tarih için dolu veya bakımda</p>
                      <p className="text-sm text-amber-800/90 dark:text-amber-200/90">Satın alma yapılamaz.</p>
                    </div>
                  )}
                  <article
                    className={`rounded-2xl border bg-white ${
                      isSelected ? 'border-blue-300 shadow-sm' : 'border-zinc-200'
                    } ${bookingBlocked ? 'opacity-95' : ''}`}
                  >
                  <div className="grid gap-4 p-3 sm:p-4 xl:grid-cols-[240px_1fr_180px]">
                    <div className="space-y-2">
                      <button
                        type="button"
                        onClick={() => {
                          if (!images.length) return;
                          setLightbox({ activityId: a.id, index: currentIdx });
                        }}
                        className="block w-full overflow-hidden rounded-xl border border-zinc-200"
                      >
                        {currentImg ? (
                          // eslint-disable-next-line @next/next/no-img-element
                          <img src={currentImg.url} alt={a.name} className="aspect-[4/3] w-full object-cover" />
                        ) : (
                          <div className="flex aspect-[4/3] items-center justify-center bg-zinc-100 text-xs text-zinc-500">
                            Görsel yok
                          </div>
                        )}
                      </button>
                      {images.length > 1 && (
                        <div className="flex items-center justify-between rounded-lg border border-zinc-200 bg-zinc-50 px-2 py-1">
                          <button
                            type="button"
                            onClick={() => setImageIndexById((s) => ({ ...s, [a.id]: (currentIdx - 1 + images.length) % images.length }))}
                            className="rounded p-1 hover:bg-white"
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </button>
                          <div className="flex gap-1">
                            {images.slice(0, 8).map((img, idx) => (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => setImageIndexById((s) => ({ ...s, [a.id]: idx }))}
                                className={`h-1.5 w-4 rounded-full ${idx === currentIdx ? 'bg-zinc-900' : 'bg-zinc-300'}`}
                                aria-label={`Görsel ${idx + 1}`}
                              />
                            ))}
                          </div>
                          <button
                            type="button"
                            onClick={() => setImageIndexById((s) => ({ ...s, [a.id]: (currentIdx + 1) % images.length }))}
                            className="rounded p-1 hover:bg-white"
                          >
                            <ChevronRight className="h-4 w-4" />
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="min-w-0">
                      {!!tags.length && (
                        <div className="mb-2 flex flex-wrap gap-1.5">
                          {tags.map((t) => (
                            <span key={t} className="rounded-full bg-zinc-100 px-2.5 py-1 text-[11px] font-semibold text-zinc-700">
                              {t}
                            </span>
                          ))}
                        </div>
                      )}
                      <h2 className="text-2xl font-extrabold leading-tight text-zinc-900">{a.name}</h2>
                      <div className="mt-1 inline-flex items-center gap-1 text-blue-700">
                        <MapPin className="h-4 w-4" />
                        <span className="text-sm font-semibold">{a.location || a.departurePlace || 'Lokasyon yok'}</span>
                      </div>
                      <p className="mt-2 text-sm text-zinc-600">{shortText(a.description)}</p>

                      <div className="mt-3 space-y-1.5">
                        {trips.length ? (
                          trips.map((t) => (
                            <div key={t.id} className="flex flex-wrap items-center gap-2 text-sm text-zinc-700">
                              <span className="font-bold text-zinc-900">{t.departureTime}</span>
                              <span className="text-zinc-400">→</span>
                              <span className="font-bold text-zinc-900">{t.arrivalTime}</span>
                              <span className="mx-1 text-zinc-300">|</span>
                              <Clock3 className="h-4 w-4 text-zinc-500" />
                              <span>{t.durationHours} Saat</span>
                            </div>
                          ))
                        ) : (
                          <p className="text-sm text-zinc-500">Sefer bilgisi yok</p>
                        )}
                      </div>

                      <div className="mt-4 flex flex-wrap items-center justify-between gap-2 border-t border-zinc-200 pt-3">
                        <span className="inline-flex items-center gap-1 text-sm font-semibold text-emerald-700">✓ Ücretsiz iptal</span>
                        <button
                          type="button"
                          onClick={() => setExpandedIds((s) => ({ ...s, [a.id]: !s[a.id] }))}
                          className="inline-flex min-h-10 items-center gap-1 rounded-lg border border-zinc-300 px-3 py-1.5 text-sm font-medium text-zinc-700"
                        >
                          {isExpanded ? 'Gizle' : 'Detaylar'}
                          <ChevronDown className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`} />
                        </button>
                      </div>
                    </div>

                    <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-3 xl:min-w-[200px]">
                      {blockReason && (
                        <p className="mb-2 rounded-lg bg-red-100 px-2 py-1.5 text-center text-xs font-bold text-red-800 dark:bg-red-950/60 dark:text-red-200">
                          {blockReason}
                        </p>
                      )}
                      <p className="mb-1 inline-flex items-center gap-1 text-sm text-zinc-600">
                        <Users className="h-4 w-4" /> Doluluk
                      </p>
                      <p className="text-sm font-semibold text-zinc-800">{a.capacity} Kişi</p>
                      <div className="my-3 h-px bg-zinc-200" />
                      <p className="text-sm text-zinc-600">Yetişkin (kişi başı)</p>
                      <p className="text-3xl font-extrabold tracking-tight text-zinc-900">
                        {hasPrice ? formatTry(adultUnit) : '-'}
                        <span className="ml-1 text-base font-bold">TRY</span>
                      </p>
                      {(childUnit !== adultUnit || infantUnit !== adultUnit) && hasPrice && (
                        <p className="mt-1 text-[11px] leading-snug text-zinc-500">
                          Çocuk {formatTry(childUnit)} · Bebek {formatTry(infantUnit)} TRY
                        </p>
                      )}
                      <p className="mt-2 text-sm text-zinc-500">
                        Toplam <span className="font-semibold text-zinc-800">{hasPrice ? formatTry(cardTotal) : '-'}</span> TRY
                      </p>

                      {isSelected && !bookingBlocked && (
                        <div className="mt-3 space-y-2 border-t border-zinc-200 pt-3 text-zinc-900">
                          <p className="text-xs font-semibold text-zinc-800">Misafir</p>
                          <div className="flex items-center justify-between gap-1 text-xs text-zinc-900">
                            <span className="inline-flex items-center gap-1 text-zinc-800">
                              <Users className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
                              Yetişkin (+13)
                            </span>
                            <span className="inline-flex items-center gap-1 text-zinc-900">
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.adults <= 1}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    const next = { ...cur, adults: Math.max(1, cur.adults - 1) };
                                    if (next.adults + next.children + next.infants > maxPeople) return prev;
                                    return { ...prev, [a.id]: next };
                                  })
                                }
                                aria-label="Yetişkin azalt"
                              >
                                <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-zinc-900">
                                {guests.adults}
                              </span>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.adults + guests.children + guests.infants >= maxPeople}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    if (cur.adults + cur.children + cur.infants >= maxPeople) return prev;
                                    return { ...prev, [a.id]: { ...cur, adults: cur.adults + 1 } };
                                  })
                                }
                                aria-label="Yetişkin artır"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-xs text-zinc-900">
                            <span className="inline-flex items-center gap-1 text-zinc-800">
                              <UserRound className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
                              Çocuk (3-12)
                            </span>
                            <span className="inline-flex items-center gap-1 text-zinc-900">
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.children <= 0}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    const next = { ...cur, children: Math.max(0, cur.children - 1) };
                                    return { ...prev, [a.id]: next };
                                  })
                                }
                                aria-label="Çocuk azalt"
                              >
                                <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-zinc-900">
                                {guests.children}
                              </span>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.adults + guests.children + guests.infants >= maxPeople}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    if (cur.adults + cur.children + cur.infants >= maxPeople) return prev;
                                    return { ...prev, [a.id]: { ...cur, children: cur.children + 1 } };
                                  })
                                }
                                aria-label="Çocuk artır"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                            </span>
                          </div>
                          <div className="flex items-center justify-between gap-1 text-xs text-zinc-900">
                            <span className="inline-flex items-center gap-1 text-zinc-800">
                              <Baby className="h-3.5 w-3.5 shrink-0 text-blue-600" aria-hidden />
                              Bebek (0-2)
                            </span>
                            <span className="inline-flex items-center gap-1 text-zinc-900">
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.infants <= 0}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    return { ...prev, [a.id]: { ...cur, infants: Math.max(0, cur.infants - 1) } };
                                  })
                                }
                                aria-label="Bebek azalt"
                              >
                                <Minus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                              <span className="min-w-[1.5rem] text-center text-sm font-semibold tabular-nums text-zinc-900">
                                {guests.infants}
                              </span>
                              <button
                                type="button"
                                className="flex h-7 w-7 items-center justify-center rounded border border-zinc-300 bg-white text-zinc-900 disabled:opacity-40 dark:bg-white dark:text-zinc-900"
                                disabled={guests.adults + guests.children + guests.infants >= maxPeople}
                                onClick={() =>
                                  setBookingGuestsById((prev) => {
                                    const cur = prev[a.id] ?? guests;
                                    if (cur.adults + cur.children + cur.infants >= maxPeople) return prev;
                                    return { ...prev, [a.id]: { ...cur, infants: cur.infants + 1 } };
                                  })
                                }
                                aria-label="Bebek artır"
                              >
                                <Plus className="h-3.5 w-3.5 shrink-0 text-zinc-900" strokeWidth={2.25} />
                              </button>
                            </span>
                          </div>
                        </div>
                      )}

                      <button
                        type="button"
                        disabled={bookingBlocked}
                        onClick={() => {
                          if (bookingBlocked) return;
                          if (selectedActivityId === a.id) {
                            setSelectedActivityId(null);
                          } else {
                            setBookingGuestsById((prev) => ({
                              ...prev,
                              [a.id]: prev[a.id] ?? {
                                adults: Math.min(Math.max(1, personCount), maxPeople),
                                children: 0,
                                infants: 0,
                              },
                            }));
                            setSelectedActivityId(a.id);
                          }
                        }}
                        className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-lg px-3 py-2 text-sm font-semibold ${
                          bookingBlocked
                            ? 'cursor-not-allowed bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-500'
                            : isSelected
                              ? 'bg-zinc-200 text-zinc-800 hover:bg-zinc-300'
                              : 'bg-blue-600 text-white hover:bg-blue-500'
                        }`}
                      >
                        {bookingBlocked ? 'Satın alınamaz' : isSelected ? 'Kapat' : 'Seç'}
                      </button>
                    </div>
                  </div>

                  {isSelected && (
                    <div className="border-t border-zinc-200 p-4">
                      <div className="grid gap-4 xl:grid-cols-2">
                        <div className="rounded-2xl border border-blue-300 bg-zinc-50 p-4">
                          <p className="text-2xl font-extrabold leading-tight text-zinc-900">{a.name}</p>
                          <ul className="mt-3 space-y-1.5 text-base text-zinc-700">
                            {included.slice(0, 8).map((d) => (
                              <li key={d!.id} className="flex items-start gap-2">
                                <span className="mt-0.5 text-emerald-600">✓</span>
                                <span>{d!.label}</span>
                              </li>
                            ))}
                            {included.length === 0 && <li className="text-base text-zinc-500">Hizmet bilgisi bulunamadı.</li>}
                          </ul>
                          <p className="mt-4 text-2xl font-extrabold text-zinc-900">
                            {hasPrice ? `${formatTry(adultUnit)} TRY (yetişkin)` : '-'}
                          </p>
                          <div className="mt-4 border-t border-zinc-200 pt-3">
                            <p className="text-sm font-semibold text-zinc-700">Toplam Ödeme</p>
                            <p className="mt-1 text-2xl font-extrabold text-zinc-900">
                              {hasPrice ? formatTry(bookingTotal) : '-'} TRY
                            </p>
                            <p className="mt-1 text-xs text-zinc-500">
                              {guests.adults} yetişkin · {guests.children} çocuk · {guests.infants} bebek
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={bookingBlocked}
                            onClick={() => {
                              if (bookingBlocked) return;
                              const params = new URLSearchParams();
                              params.set('activityId', a.id);
                              params.set('date', selectedDate);
                              params.set('adults', String(guests.adults));
                              params.set('children', String(guests.children));
                              params.set('infants', String(guests.infants));
                              params.set('people', String(peopleForTotals));
                              params.set('paymentPlan', 'full');
                              router.push(`/rezervasyon/yolcu-bilgileri?${params.toString()}`);
                            }}
                            className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-2.5 text-base font-semibold ${
                              bookingBlocked
                                ? 'cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                          >
                            Seç
                          </button>
                        </div>

                        <div className="rounded-2xl border border-blue-300 bg-blue-50/50 p-4">
                          <p className="text-2xl font-extrabold leading-tight text-zinc-900">{a.name}</p>
                          <ul className="mt-3 space-y-1.5 text-base text-zinc-700">
                            {included.slice(0, 8).map((d) => (
                              <li key={d!.id} className="flex items-start gap-2">
                                <span className="mt-0.5 text-emerald-600">✓</span>
                                <span>{d!.label}</span>
                              </li>
                            ))}
                            {included.length === 0 && <li className="text-base text-zinc-500">Hizmet bilgisi bulunamadı.</li>}
                          </ul>
                          <p className="mt-4 text-2xl font-extrabold text-zinc-900">
                            {hasPrice ? `${formatTry(adultUnit)} TRY (yetişkin)` : '-'}
                          </p>
                          <div className="mt-4 border-t border-blue-200 pt-3">
                            <p className="text-sm font-semibold text-blue-700">
                              Ön Ödeme (%{Math.min(100, Math.max(1, Math.round(a.prepaymentPercent ?? 100)))})
                            </p>
                            <p className="mt-1 text-2xl font-extrabold text-blue-900">
                              {hasPrice
                                ? formatTry(
                                    Math.round(
                                      (bookingTotal * Math.min(100, Math.max(1, Math.round(a.prepaymentPercent ?? 100)))) / 100,
                                    ),
                                  )
                                : '-'}{' '}
                              TRY
                            </p>
                            <p className="mt-1 text-xs text-blue-800">
                              Toplam Tutar: {hasPrice ? formatTry(bookingTotal) : '-'} TRY
                            </p>
                          </div>
                          <button
                            type="button"
                            disabled={bookingBlocked}
                            onClick={() => {
                              if (bookingBlocked) return;
                              const params = new URLSearchParams();
                              params.set('activityId', a.id);
                              params.set('date', selectedDate);
                              params.set('adults', String(guests.adults));
                              params.set('children', String(guests.children));
                              params.set('infants', String(guests.infants));
                              params.set('people', String(peopleForTotals));
                              params.set('paymentPlan', 'prepayment');
                              router.push(`/rezervasyon/yolcu-bilgileri?${params.toString()}`);
                            }}
                            className={`mt-4 inline-flex min-h-11 w-full items-center justify-center rounded-xl px-5 py-2.5 text-base font-semibold ${
                              bookingBlocked
                                ? 'cursor-not-allowed bg-zinc-300 text-zinc-500 dark:bg-zinc-700 dark:text-zinc-500'
                                : 'bg-blue-600 text-white hover:bg-blue-500'
                            }`}
                          >
                            Seç
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {isExpanded && (
                    <div className="border-t border-zinc-200 p-4">
                      <div className="mb-4 flex gap-2">
                        <button
                          type="button"
                          onClick={() => setDetailsTabById((s) => ({ ...s, [a.id]: 'general' }))}
                          className={`rounded-lg px-3 py-2 text-sm font-medium ${
                            activeTab === 'general' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          Genel Bilgiler
                        </button>
                        <button
                          type="button"
                          onClick={() => setDetailsTabById((s) => ({ ...s, [a.id]: 'gallery' }))}
                          className={`rounded-lg px-3 py-2 text-sm font-medium ${
                            activeTab === 'gallery' ? 'bg-blue-100 text-blue-700' : 'bg-zinc-100 text-zinc-700'
                          }`}
                        >
                          Galeri
                        </button>
                      </div>

                      {activeTab === 'general' ? (
                        <div className="grid gap-6 lg:grid-cols-2">
                          <section>
                            <h3 className="text-3xl font-extrabold text-zinc-900">Açıklama</h3>
                            <p className="mt-3 whitespace-pre-wrap text-zinc-700">{a.description || '-'}</p>
                            <h4 className="mt-6 text-2xl font-bold text-emerald-700">Dahil Olan Hizmetler</h4>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                              {included.length ? (
                                included.map((d) => (
                                  <li key={d!.id} className="inline-flex items-center gap-2 text-zinc-700">
                                    <DictionaryIcon iconKey={d!.iconKey} fallbackEmoji={d!.icon} className="h-4 w-4 text-zinc-600" />
                                    <span>{d!.label}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-zinc-500">Tanımlı hizmet yok</li>
                              )}
                            </ul>

                            <h4 className="mt-6 text-2xl font-bold text-zinc-900">Dahil Olmayanlar</h4>
                            <ul className="mt-3 grid gap-2 sm:grid-cols-2">
                              {excluded.length ? (
                                excluded.map((d) => (
                                  <li key={d!.id} className="inline-flex items-center gap-2 text-zinc-700">
                                    <DictionaryIcon iconKey={d!.iconKey} fallbackEmoji={d!.icon} className="h-4 w-4 text-zinc-600" />
                                    <span>{d!.label}</span>
                                  </li>
                                ))
                              ) : (
                                <li className="text-sm text-zinc-500">Tanımlı alan yok</li>
                              )}
                            </ul>
                          </section>

                          <section>
                            <h3 className="text-3xl font-extrabold text-zinc-900">Tur Programı</h3>
                            <p className="mt-3 whitespace-pre-wrap text-zinc-700">{a.tourProgram || '-'}</p>
                          </section>
                        </div>
                      ) : (
                        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
                          {images.length ? (
                            images.map((img, idx) => (
                              <button
                                key={img.id}
                                type="button"
                                onClick={() => setLightbox({ activityId: a.id, index: idx })}
                                className="overflow-hidden rounded-xl border border-zinc-200"
                              >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={img.url} alt={`${a.name} ${idx + 1}`} className="aspect-[4/3] w-full object-cover" />
                              </button>
                            ))
                          ) : (
                            <p className="text-sm text-zinc-500">Galeri görseli bulunamadı.</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </article>
                </div>
              );
            })}

            {!availabilityPartition.displayList.length && (
              <div className="rounded-xl border border-zinc-200 bg-white p-8 text-center text-zinc-600">
                Filtrelere uygun aktivite bulunamadı.
              </div>
            )}
          </section>
        </div>
      </main>

      {mobileFiltersOpen && (
        <div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/40" onClick={() => setMobileFiltersOpen(false)} aria-label="Filtreyi kapat" />
          <div className="absolute bottom-0 left-0 right-0 max-h-[88vh] overflow-y-auto rounded-t-2xl bg-white p-4">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-lg font-semibold text-zinc-900">Filtreler</p>
              <button type="button" onClick={() => setMobileFiltersOpen(false)} className="rounded-lg p-2 text-zinc-600">
                <X className="h-5 w-5" />
              </button>
            </div>
            {filterPanel}
          </div>
        </div>
      )}

      {lightbox && (() => {
        const activity = activeActivities.find((a) => a.id === lightbox.activityId);
        if (!activity) return null;
        const images = getImages(activity);
        if (!images.length) return null;
        const idx = Math.max(0, Math.min(lightbox.index, images.length - 1));
        const current = images[idx];
        return (
          <div className="fixed inset-0 z-[60] bg-black/85 p-4">
            <button
              type="button"
              onClick={() => setLightbox(null)}
              className="absolute right-4 top-4 rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
              aria-label="Kapat"
            >
              <X className="h-6 w-6" />
            </button>
            <div className="mx-auto flex h-full w-full max-w-6xl flex-col justify-center">
              <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-black">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={current.url} alt={activity.name} className="max-h-[74vh] w-full object-contain" />
                {images.length > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLightbox({ activityId: activity.id, index: (idx - 1 + images.length) % images.length })}
                      className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                    >
                      <ChevronLeft className="h-6 w-6" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightbox({ activityId: activity.id, index: (idx + 1) % images.length })}
                      className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-white/20 p-2 text-white hover:bg-white/30"
                    >
                      <ChevronRight className="h-6 w-6" />
                    </button>
                  </>
                )}
              </div>
              <div className="mt-3 flex justify-center gap-2 overflow-x-auto pb-1">
                {images.map((img, tIdx) => (
                  <button
                    key={img.id}
                    type="button"
                    onClick={() => setLightbox({ activityId: activity.id, index: tIdx })}
                    className={`overflow-hidden rounded-lg border ${tIdx === idx ? 'border-blue-400' : 'border-white/30'}`}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={img.url} alt="" className="h-14 w-20 object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        );
      })()}

      <SiteDatePickerOverlay
        open={listingDateOpen}
        onOpenChange={setListingDateOpen}
        anchorRef={listingDateBtnRef}
        value={selectedDate}
        onConfirm={(next) => {
          if (next && /^\d{4}-\d{2}-\d{2}$/.test(next)) setSelectedDate(next);
        }}
        allowClear={false}
      />

      <SiteFooter socialMedia={settings.socialMedia} footerManagement={settings.footerManagement} />
    </div>
  );
}

