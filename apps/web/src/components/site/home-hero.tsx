'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Briefcase, Home, Ship, Ticket } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';

import { SiteDatePickerOverlay } from '@/components/site/site-date-picker-overlay';
import { VillaSearchDateRangeModal } from '@/components/site/villa-search-date-range-modal';
import { SiteAccountWithNotifications } from '@/components/site/site-account-with-notifications';
import { addDaysIso } from '@/lib/villa-booking-math';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_PACKAGE_TOUR,
  SITE_PRODUCT_OPTIONS,
  SITE_PRODUCT_VILLA_RENTAL,
  type SiteProductType,
} from '@/lib/site-product-types';
import { todayIsoLocal } from '@/lib/villa-public-pricing';

function formatTrDate(iso: string): string {
  const d = new Date(`${iso}T12:00:00`);
  if (Number.isNaN(d.getTime())) return 'Tarih seç';
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'long', year: 'numeric' });
}

function formatTrDateRangeShort(checkIn: string, checkOut: string): string {
  const a = new Date(`${checkIn}T12:00:00`);
  const b = new Date(`${checkOut}T12:00:00`);
  const o: Intl.DateTimeFormatOptions = { day: 'numeric', month: 'short' };
  return `${a.toLocaleDateString('tr-TR', o)} – ${b.toLocaleDateString('tr-TR', o)}`;
}

function clamp(n: number, min: number, max: number) {
  return Math.max(min, Math.min(max, n));
}

type Slide = {
  id: string;
  imageUrl: string;
  title: string;
  subtitle: string;
  badge?: string;
};

type Props = {
  logoUrl?: string;
  darkLogoUrl?: string;
  slides: Slide[];
  /** Site yönetiminde açık ürünler — tab + arama kutusu buna göre */
  enabledSiteProducts: SiteProductType[];
  /** Villa arama: bölge seçenekleri (aktif villalardan türetilmiş) */
  villaRegionOptions?: string[];
};

type ActivitySearchOptionsResponse = {
  locations?: string[];
  categoriesByLocation?: Record<string, { id: string; name: string }[]>;
};

function clampSlides(slides: Slide[]): Slide[] {
  return slides.filter((s) => s.title.trim().length > 0);
}

const TAB_ICONS: Record<SiteProductType, typeof Ship> = {
  boat_tour: Ship,
  activity: Ticket,
  villa_rental: Home,
  package_tour: Briefcase,
};

export function HomeHero({
  logoUrl,
  darkLogoUrl,
  slides,
  enabledSiteProducts,
  villaRegionOptions = [],
}: Props) {
  const router = useRouter();
  const list = useMemo(() => clampSlides(slides), [slides]);
  const [idx, setIdx] = useState(0);

  const enabledTabs = useMemo(
    () => SITE_PRODUCT_OPTIONS.filter((o) => enabledSiteProducts.includes(o.id)),
    [enabledSiteProducts],
  );

  const [activeTab, setActiveTab] = useState<SiteProductType | null>(enabledTabs[0]?.id ?? null);

  useEffect(() => {
    if (enabledTabs.length && (!activeTab || !enabledTabs.some((t) => t.id === activeTab))) {
      setActiveTab(enabledTabs[0].id);
    }
  }, [enabledTabs, activeTab]);

  const showSearchWidget = enabledTabs.length > 0;
  const showToursInNav =
    enabledSiteProducts.includes(SITE_PRODUCT_BOAT_TOUR) ||
    enabledSiteProducts.includes(SITE_PRODUCT_ACTIVITY) ||
    enabledSiteProducts.includes(SITE_PRODUCT_PACKAGE_TOUR);
  const showVillaNavLink = enabledSiteProducts.includes(SITE_PRODUCT_VILLA_RENTAL);

  const isActivityTab =
    activeTab === SITE_PRODUCT_BOAT_TOUR ||
    activeTab === SITE_PRODUCT_ACTIVITY ||
    activeTab === SITE_PRODUCT_PACKAGE_TOUR;
  const isVillaTab = activeTab === SITE_PRODUCT_VILLA_RENTAL;

  const [dateIso, setDateIso] = useState<string | null>(null);
  const [dateOpen, setDateOpen] = useState(false);

  const [peopleOpen, setPeopleOpen] = useState(false);
  const [peopleTarget, setPeopleTarget] = useState<'activity' | 'villa' | 'package'>('activity');
  const [adults, setAdults] = useState(1);
  const [children, setChildren] = useState(0);
  const [infants, setInfants] = useState(0);
  const [tempAdults, setTempAdults] = useState(1);
  const [tempChildren, setTempChildren] = useState(0);
  const [tempInfants, setTempInfants] = useState(0);

  type VillaSearchMode = 'date' | 'name';
  const [villaSearchMode, setVillaSearchMode] = useState<VillaSearchMode>('date');
  const [vNameQuery, setVNameQuery] = useState('');
  const [vRegion, setVRegion] = useState('');
  const [vCheckIn, setVCheckIn] = useState(() => todayIsoLocal());
  // Villa arama widgetı varsayılan olarak 4 gece seçili gelsin.
  // Örn: 2-6 Nisan = 4 gece (check-in 2, check-out 6).
  const [vCheckOut, setVCheckOut] = useState(() => addDaysIso(todayIsoLocal(), 4));
  const [vAdults, setVAdults] = useState(1);
  const [vChildren, setVChildren] = useState(0);
  const [villaRangeOpen, setVillaRangeOpen] = useState(false);
  const [ptCheckIn, setPtCheckIn] = useState(() => todayIsoLocal());
  const [ptCheckOut, setPtCheckOut] = useState(() => addDaysIso(todayIsoLocal(), 3));
  const [ptAdults, setPtAdults] = useState(1);
  const [ptChildren, setPtChildren] = useState(0);
  const [ptInfants, setPtInfants] = useState(0);
  const [packageRangeOpen, setPackageRangeOpen] = useState(false);
  const [mobileSearchExpanded, setMobileSearchExpanded] = useState(true);

  const [locations, setLocations] = useState<string[]>([]);
  const [location, setLocation] = useState<string>('');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string>('');
  const [categoriesByLocation, setCategoriesByLocation] = useState<Record<string, { id: string; name: string }[]>>({});
  const [headerScrolled, setHeaderScrolled] = useState(false);

  const dateBtnRef = useRef<HTMLButtonElement | null>(null);
  const widgetRef = useRef<HTMLDivElement | null>(null);

  const peopleBtnRef = useRef<HTMLButtonElement | null>(null);
  const villaPeopleBtnRef = useRef<HTMLButtonElement | null>(null);
  const packagePeopleBtnRef = useRef<HTMLButtonElement | null>(null);
  const [peoplePopoverPos, setPeoplePopoverPos] = useState<{ top: number; left: number; width: number } | null>(null);

  useEffect(() => {
    if (list.length <= 1) return;
    const t = setInterval(() => {
      setIdx((i) => (i + 1) % list.length);
    }, 6500);
    return () => clearInterval(t);
  }, [list.length]);

  const active = list[idx] ?? list[0];

  const peopleLabel =
    children > 0 ? `${adults} Yetişkin, ${children} Çocuk` : `${adults} Yetişkin`;
  const villaPeopleLabel =
    vChildren > 0 ? `${vAdults} Yetişkin, ${vChildren} Çocuk` : `${vAdults} Yetişkin`;
  const packagePeopleLabel =
    ptChildren > 0 || ptInfants > 0
      ? `${ptAdults} Yetişkin, ${ptChildren} Çocuk, ${ptInfants} Bebek`
      : `${ptAdults} Yetişkin`;

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setDateOpen(false);
        setPeopleOpen(false);
        setVillaRangeOpen(false);
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
  }, []);

  useEffect(() => {
    const onScroll = () => setHeaderScrolled(window.scrollY > 24);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Mobilde aşağı kayınca arama panelini kompakt hale getir.
  useEffect(() => {
    const onScroll = () => {
      if (window.innerWidth >= 768) return;
      if (window.scrollY > 140) setMobileSearchExpanded(false);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  useEffect(() => {
    if (!isActivityTab) setDateOpen(false);
  }, [isActivityTab]);

  useEffect(() => {
    if (!peopleOpen) return;
    const btn =
      (peopleTarget === 'villa'
        ? villaPeopleBtnRef
        : peopleTarget === 'package'
          ? packagePeopleBtnRef
          : peopleBtnRef).current;
    if (!btn) return;

    const calc = () => {
      const rect = btn.getBoundingClientRect();
      const w = 380;
      const margin = 12;
      const left = clamp(rect.left, margin, window.innerWidth - w - margin);
      const top = rect.bottom + 10;
      setPeoplePopoverPos({ top, left, width: w });
    };

    calc();
    window.addEventListener('resize', calc);
    window.addEventListener('scroll', calc, true);
    return () => {
      window.removeEventListener('resize', calc);
      window.removeEventListener('scroll', calc, true);
    };
  }, [peopleOpen, peopleTarget]);

  const needsActivityLocations =
    enabledSiteProducts.includes(SITE_PRODUCT_BOAT_TOUR) ||
    enabledSiteProducts.includes(SITE_PRODUCT_ACTIVITY);

  useEffect(() => {
    if (!needsActivityLocations) {
      setLocations([]);
      setCategoriesByLocation({});
      return;
    }
    let cancelled = false;
    void fetch('/api/public/activity-search-options', { cache: 'no-store' })
      .then((r) => r.json() as Promise<ActivitySearchOptionsResponse>)
      .then((data) => {
        if (cancelled) return;
        setLocations(Array.isArray(data.locations) ? data.locations : []);
        setCategoriesByLocation(data.categoriesByLocation && typeof data.categoriesByLocation === 'object' ? data.categoriesByLocation : {});
      })
      .catch(() => {
        if (!cancelled) {
          setLocations([]);
          setCategoriesByLocation({});
        }
      });
    return () => {
      cancelled = true;
    };
  }, [needsActivityLocations]);

  const locationCategoryOptions = useMemo(() => {
    if (!location.trim()) return [];
    return categoriesByLocation[location] ?? [];
  }, [categoriesByLocation, location]);

  useEffect(() => {
    if (!locationCategoryOptions.some((c) => c.id === selectedCategoryId)) {
      setSelectedCategoryId('');
    }
  }, [locationCategoryOptions, selectedCategoryId]);

  function goListingPage() {
    const params = new URLSearchParams();
    if (location.trim()) params.set('location', location.trim());
    if (selectedCategoryId) params.set('mainCategory', selectedCategoryId);
    if (dateIso) params.set('date', dateIso);
    params.set('people', String(adults + children));
    router.push(`/aktiviteler?${params.toString()}`);
  }

  function goVillaListing() {
    const params = new URLSearchParams();
    if (vRegion.trim()) params.set('region', vRegion.trim());
    params.set('checkIn', vCheckIn);
    params.set('checkOut', vCheckOut);
    params.set('guests', String(vAdults + vChildren));
    router.push(`/villalar?${params.toString()}`);
  }

  function goVillaListingByName() {
    const params = new URLSearchParams();
    const q = vNameQuery.trim();
    if (q) params.set('q', q);
    router.push(`/villalar?${params.toString()}`);
  }

  function goPackageTourListing() {
    const params = new URLSearchParams();
    params.set('checkIn', ptCheckIn);
    params.set('checkOut', ptCheckOut);
    params.set('adults', String(ptAdults));
    params.set('children', String(ptChildren));
    params.set('infants', String(ptInfants));
    router.push(`/paket-turlar?${params.toString()}`);
  }

  const inputShellClass =
    'flex h-12 w-full flex-col items-start justify-center rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-left outline-none transition hover:border-zinc-300';

  const renderSearchBarRow = () => {
    if (!activeTab) return null;

    if (isVillaTab) {
      const villaModeTabClass = (on: boolean) =>
        [
          'rounded-t-lg px-4 py-2 text-sm font-semibold transition',
          on
            ? 'text-[#1D61FF] shadow-[inset_0_-2px_0_0_#1D61FF]'
            : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
        ].join(' ');

      return (
        <div className="space-y-3">
          <div className="flex flex-wrap gap-1 border-b border-zinc-100">
            <button
              type="button"
              onClick={() => setVillaSearchMode('date')}
              className={villaModeTabClass(villaSearchMode === 'date')}
            >
              Tarihe göre arama
            </button>
            <button
              type="button"
              onClick={() => setVillaSearchMode('name')}
              className={villaModeTabClass(villaSearchMode === 'name')}
            >
              İsme göre arama
            </button>
          </div>

          {villaSearchMode === 'date' ? (
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Bölge</span>
                <select
                  value={vRegion}
                  onChange={(e) => setVRegion(e.target.value)}
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none focus:border-zinc-300"
                >
                  <option value="">Bölge seçin</option>
                  {villaRegionOptions.map((r) => (
                    <option key={r} value={r} className="text-zinc-900">
                      {r}
                    </option>
                  ))}
                </select>
              </label>
              <button type="button" onClick={() => setVillaRangeOpen(true)} className="min-w-0 flex-1">
                <span className="sr-only">Tarih aralığı</span>
                <div className={inputShellClass}>
                  <span className="text-[11px] text-zinc-500">Giriş – çıkış</span>
                  <span className="text-sm font-semibold text-zinc-900">
                    {formatTrDateRangeShort(vCheckIn, vCheckOut)}
                  </span>
                </div>
              </button>
              <button
                type="button"
                onClick={() => {
                  setPeopleTarget('villa');
                  setTempAdults(vAdults);
                  setTempChildren(vChildren);
                  setTempInfants(0);
                  setPeopleOpen(true);
                }}
                className="min-w-0 flex-1"
                ref={villaPeopleBtnRef}
              >
                <span className="sr-only">Kişi sayısı</span>
                <div className={inputShellClass}>
                  <span className="text-[11px] text-zinc-500">Kişi sayısı</span>
                  <span className="text-sm font-semibold text-zinc-900">{villaPeopleLabel}</span>
                </div>
              </button>
              <button
                type="button"
                onClick={goVillaListing}
                className="h-12 shrink-0 rounded-xl bg-[#1D61FF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 md:px-7"
              >
                Villa Ara →
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
              <label className="min-w-0 flex-1">
                <span className="sr-only">Villa adı</span>
                <input
                  type="search"
                  value={vNameQuery}
                  onChange={(e) => setVNameQuery(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') goVillaListingByName();
                  }}
                  placeholder="Villa adı yazın"
                  className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm text-zinc-900 outline-none transition placeholder:text-zinc-400 focus:border-zinc-300"
                />
              </label>
              <button
                type="button"
                onClick={goVillaListingByName}
                className="h-12 shrink-0 rounded-xl bg-[#1D61FF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 md:px-7"
              >
                Villa Ara →
              </button>
            </div>
          )}
        </div>
      );
    }

    if (activeTab === SITE_PRODUCT_PACKAGE_TOUR) {
      return (
        <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
          <button type="button" onClick={() => setPackageRangeOpen(true)} className="min-w-0 flex-1">
            <span className="sr-only">Tarih aralığı</span>
            <div className={inputShellClass}>
              <span className="text-[11px] text-zinc-500">Giriş – çıkış</span>
              <span className="text-sm font-semibold text-zinc-900">
                {formatTrDateRangeShort(ptCheckIn, ptCheckOut)}
              </span>
            </div>
          </button>
          <button
            type="button"
            onClick={() => {
              setPeopleTarget('package');
              setTempAdults(ptAdults);
              setTempChildren(ptChildren);
              setTempInfants(ptInfants);
              setPeopleOpen(true);
            }}
            className="min-w-0 flex-1"
            ref={packagePeopleBtnRef}
          >
            <span className="sr-only">Kişi sayısı</span>
            <div className={inputShellClass}>
              <span className="text-[11px] text-zinc-500">Kişi sayısı</span>
              <span className="text-sm font-semibold text-zinc-900">{packagePeopleLabel}</span>
            </div>
          </button>
          <button
            type="button"
            onClick={goPackageTourListing}
            className="h-12 shrink-0 rounded-xl bg-[#1D61FF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 md:px-7"
          >
            Paket Tur Ara →
          </button>
        </div>
      );
    }

    return (
      <div className="flex flex-col gap-2 md:flex-row md:items-stretch">
        <label className="min-w-0 flex-1">
          <span className="sr-only">Lokasyon</span>
          <select
            value={location}
            onChange={(e) => {
              setLocation(e.target.value);
              setSelectedCategoryId('');
            }}
            className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none focus:border-zinc-300"
          >
            <option value="" className="text-zinc-900">
              Lokasyon seç
            </option>
            {locations.map((loc) => (
              <option key={loc} value={loc} className="text-zinc-900">
                {loc}
              </option>
            ))}
          </select>
        </label>
        {location.trim() && (
          <label className="min-w-0 flex-1">
            <span className="sr-only">Kategori</span>
            <select
              value={selectedCategoryId}
              onChange={(e) => setSelectedCategoryId(e.target.value)}
              className="h-12 w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-zinc-900 outline-none focus:border-zinc-300"
            >
              <option value="" className="text-zinc-900">
                Tümü
              </option>
              {locationCategoryOptions.map((cat) => (
                <option key={cat.id} value={cat.id} className="text-zinc-900">
                  {cat.name}
                </option>
              ))}
            </select>
          </label>
        )}
        <button type="button" onClick={() => setDateOpen(true)} className="min-w-0 flex-1" ref={dateBtnRef}>
          <span className="sr-only">Tarih</span>
          <div className={inputShellClass}>
            <span className="text-[11px] text-zinc-500">Tarih seç</span>
            <span className="text-sm font-semibold text-zinc-900">{dateIso ? formatTrDate(dateIso) : 'Tarih seç'}</span>
          </div>
        </button>

        <button
          type="button"
          onClick={() => {
            setPeopleTarget('activity');
            setTempAdults(adults);
            setTempChildren(children);
            setTempInfants(infants);
            setPeopleOpen(true);
          }}
          className="min-w-0 flex-1"
          ref={peopleBtnRef}
        >
          <span className="sr-only">Kişiler</span>
          <div className={inputShellClass}>
            <span className="text-[11px] text-zinc-500">Kişiler</span>
            <span className="text-sm font-semibold text-zinc-900">{peopleLabel}</span>
          </div>
        </button>
        <button
          type="button"
          onClick={goListingPage}
          className="h-12 shrink-0 rounded-xl bg-[#1D61FF] px-5 text-sm font-semibold text-white shadow-sm hover:bg-blue-600 md:px-7"
        >
          Bileti Ara →
        </button>
      </div>
    );
  };

  const renderTabbedSearch = () => {
    if (!showSearchWidget || !activeTab) return null;

    const showTabs = enabledTabs.length > 1;

    return (
      <div ref={widgetRef} className="w-full overflow-hidden rounded-xl bg-white shadow-xl">
        {showTabs && (
          <div className="flex flex-wrap gap-1 border-b border-zinc-200 bg-white px-2 pt-2">
            {enabledTabs.map((tab) => {
              const Icon = TAB_ICONS[tab.id];
              const on = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  onClick={() => setActiveTab(tab.id)}
                  className={[
                    'inline-flex items-center gap-2 rounded-t-lg px-4 py-2.5 text-sm font-semibold transition',
                    on
                      ? 'text-[#1D61FF] shadow-[inset_0_-2px_0_0_#1D61FF]'
                      : 'text-zinc-600 hover:bg-zinc-50 hover:text-zinc-900',
                  ].join(' ')}
                >
                  <Icon className="h-4 w-4 shrink-0" aria-hidden />
                  {tab.id === SITE_PRODUCT_VILLA_RENTAL ? 'Villa' : tab.label}
                </button>
              );
            })}
          </div>
        )}
        <div className="p-3 md:p-4">{renderSearchBarRow()}</div>
      </div>
    );
  };

  return (
    <div className="relative min-h-[85dvh] bg-white text-white">
      {active?.imageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={active.imageUrl} alt="" className="absolute inset-0 h-full w-full object-cover" />
      ) : (
        <div className="absolute inset-0 bg-gradient-to-br from-sky-100 via-white to-slate-100" />
      )}

      <div className="absolute inset-0 bg-black/35" />

      <header
        className={[
          'fixed left-0 top-0 z-40 w-full transition',
          headerScrolled
            ? 'border-b border-zinc-200 bg-white/95 text-zinc-900 shadow-sm backdrop-blur-md'
            : 'border-b border-white/10 bg-black/20 text-white backdrop-blur-md',
        ].join(' ')}
      >
        <div className="mx-auto flex max-w-6xl items-center justify-between px-4 py-3">
          <Link href="/" className="flex items-center gap-3">
            {headerScrolled ? (
              logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo" className="h-9 w-auto md:h-10" />
              ) : (
                <span className="text-base font-semibold tracking-wide">Bodrum Aktivite</span>
              )
            ) : darkLogoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={darkLogoUrl} alt="Logo" className="h-9 w-auto md:h-10" />
            ) : logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="h-9 w-auto md:h-10" />
            ) : (
              <span className="text-base font-semibold tracking-wide">Bodrum Aktivite</span>
            )}
          </Link>

          <nav
            className={[
              'hidden items-center gap-6 text-sm md:flex',
              headerScrolled ? 'text-zinc-700' : 'text-white/85',
            ].join(' ')}
          >
            {showToursInNav && (
              <Link href="/aktiviteler" className={headerScrolled ? 'hover:text-zinc-900' : 'hover:text-white'}>
                Turlar
              </Link>
            )}
            {showVillaNavLink && (
              <Link href="/villalar" className={headerScrolled ? 'hover:text-zinc-900' : 'hover:text-white'}>
                Villalar
              </Link>
            )}
            <Link href="#" className={headerScrolled ? 'hover:text-zinc-900' : 'hover:text-white'}>
              Kampanyalar
            </Link>
            <Link href="/blog" className={headerScrolled ? 'hover:text-zinc-900' : 'hover:text-white'}>
              Blog
            </Link>
            <Link href="/iletisim" className={headerScrolled ? 'hover:text-zinc-900' : 'hover:text-white'}>
              İletişim
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <button
              type="button"
              className={[
                'hidden items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition md:inline-flex',
                headerScrolled ? 'text-zinc-700 hover:bg-zinc-100 hover:text-zinc-900' : 'text-white/90 hover:bg-white/10 hover:text-white',
              ].join(' ')}
            >
              Uygulamayı indir
            </button>
            <SiteAccountWithNotifications
              variant="hero-inverse"
              menuClassName={[
                'rounded-lg border px-4 py-2 text-sm font-semibold transition',
                headerScrolled
                  ? 'border-zinc-200 bg-white text-zinc-900 hover:bg-zinc-50'
                  : 'border-white/35 bg-white/10 text-white hover:bg-white/20',
              ].join(' ')}
              bellButtonClassName={[
                'inline-flex min-h-10 min-w-10 items-center justify-center rounded-lg border p-2 transition',
                headerScrolled
                  ? 'border-zinc-200 bg-white text-zinc-900 shadow-sm hover:bg-zinc-50'
                  : 'border-white/35 bg-white/10 text-white hover:bg-white/20',
              ].join(' ')}
            />
          </div>
        </div>
      </header>

      {headerScrolled && showSearchWidget && (
        <div className="fixed left-0 right-0 top-[56px] z-30 w-full border-b border-zinc-200 bg-white/95 backdrop-blur-md">
          <div className="mx-auto max-w-6xl px-4 py-3">
            <div className="md:hidden">
              <button
                type="button"
                onClick={() => setMobileSearchExpanded((v) => !v)}
                className="inline-flex min-h-11 w-full items-center justify-between rounded-xl border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-800"
              >
                <span>Arama filtreleri</span>
                <span>{mobileSearchExpanded ? 'Kapat' : 'Aç'}</span>
              </button>
            </div>
            <div className={`${mobileSearchExpanded ? 'mt-3 block' : 'hidden'} md:mt-0 md:block`}>
              {renderTabbedSearch()}
            </div>
          </div>
        </div>
      )}

      <main className="relative z-10 mx-auto flex min-h-[85dvh] max-w-6xl flex-col justify-center gap-6 px-4 pb-14 pt-24 md:pt-28">
        <div className="max-w-3xl">
          {active?.badge && (
            <div className="mb-4 flex items-center gap-2 text-sm text-white/85">
              <span className="inline-flex h-5 w-5 items-center justify-center rounded-full bg-emerald-500/90 text-[12px] font-bold">
                ✓
              </span>
              <span>{active.badge}</span>
            </div>
          )}

          <h1 className="text-3xl font-semibold leading-tight md:text-5xl">
            {active?.title ?? 'Bodrum Aktivite'}
          </h1>
          {active?.subtitle && <p className="mt-4 text-base text-white/80 md:text-lg">{active.subtitle}</p>}
        </div>

        {!headerScrolled && showSearchWidget && renderTabbedSearch()}

        {!headerScrolled && showSearchWidget && list.length > 1 && (
          <div className="mt-4 flex items-center gap-2">
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition ${
                  i === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
        {!headerScrolled && !showSearchWidget && list.length > 1 && (
          <div className="mt-4 flex w-full items-center gap-2">
            {list.map((s, i) => (
              <button
                key={s.id}
                type="button"
                aria-label={`Slide ${i + 1}`}
                onClick={() => setIdx(i)}
                className={`h-2.5 rounded-full transition ${
                  i === idx ? 'w-8 bg-white' : 'w-2.5 bg-white/45 hover:bg-white/70'
                }`}
              />
            ))}
          </div>
        )}
      </main>

      {isActivityTab && (
        <SiteDatePickerOverlay
          open={dateOpen}
          onOpenChange={setDateOpen}
          anchorRef={dateBtnRef}
          value={dateIso}
          onConfirm={(next) => setDateIso(next)}
          allowClear
        />
      )}

      <VillaSearchDateRangeModal
        checkIn={vCheckIn}
        checkOut={vCheckOut}
        open={villaRangeOpen}
        onClose={() => setVillaRangeOpen(false)}
        onChange={(next) => {
          setVCheckIn(next.checkIn);
          setVCheckOut(next.checkOut);
        }}
      />
      <VillaSearchDateRangeModal
        checkIn={ptCheckIn}
        checkOut={ptCheckOut}
        open={packageRangeOpen}
        onClose={() => setPackageRangeOpen(false)}
        onChange={(next) => {
          setPtCheckIn(next.checkIn);
          setPtCheckOut(next.checkOut);
        }}
      />

      {peopleOpen && peoplePopoverPos && (
        <div className="fixed inset-0 z-50 hidden md:block">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0"
            onClick={() => setPeopleOpen(false)}
          />
          <div
            className="absolute rounded-2xl border border-zinc-200 bg-white text-zinc-900 shadow-2xl"
            style={{
              top: peoplePopoverPos.top,
              left: peoplePopoverPos.left,
              width: peoplePopoverPos.width,
            }}
          >
            <div className="px-4 py-4">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">Yetişkin</p>
                    <p className="text-sm text-zinc-500">13 yaş ve üstü</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-600 disabled:opacity-40"
                      onClick={() => setTempAdults((v) => clamp(v - 1, 1, 20))}
                      disabled={tempAdults <= 1}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempAdults}</span>
                    <button
                      type="button"
                      className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-900"
                      onClick={() => setTempAdults((v) => clamp(v + 1, 1, 20))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="h-px bg-zinc-200" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-base font-semibold">Çocuk</p>
                    <p className="text-sm text-zinc-500">3–12 yaş arası</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-600 disabled:opacity-40"
                      onClick={() => setTempChildren((v) => clamp(v - 1, 0, 20))}
                      disabled={tempChildren <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempChildren}</span>
                    <button
                      type="button"
                      className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-900"
                      onClick={() => setTempChildren((v) => clamp(v + 1, 0, 20))}
                    >
                      +
                    </button>
                  </div>
                </div>
                {peopleTarget === 'package' && (
                  <>
                    <div className="h-px bg-zinc-200" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-base font-semibold">Bebek</p>
                        <p className="text-sm text-zinc-500">0–2 yaş arası</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-600 disabled:opacity-40"
                          onClick={() => setTempInfants((v) => clamp(v - 1, 0, 20))}
                          disabled={tempInfants <= 0}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempInfants}</span>
                        <button
                          type="button"
                          className="h-11 w-11 rounded-full border border-zinc-200 text-xl text-zinc-900"
                          onClick={() => setTempInfants((v) => clamp(v + 1, 0, 20))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-5 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700 hover:bg-teal-50"
                  onClick={() => {
                    setTempAdults(1);
                    setTempChildren(0);
                    setTempInfants(0);
                  }}
                >
                  Temizle
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#1D61FF] px-5 py-2.5 text-sm font-semibold text-white"
                  onClick={() => {
                    if (peopleTarget === 'villa') {
                      setVAdults(tempAdults);
                      setVChildren(tempChildren);
                    } else if (peopleTarget === 'package') {
                      setPtAdults(tempAdults);
                      setPtChildren(tempChildren);
                      setPtInfants(tempInfants);
                    } else {
                      setAdults(tempAdults);
                      setChildren(tempChildren);
                      setInfants(tempInfants);
                    }
                    setPeopleOpen(false);
                  }}
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {peopleOpen && (
        <div className="fixed inset-0 z-50 md:hidden">
          <button
            type="button"
            aria-label="Kapat"
            className="absolute inset-0 bg-black/45"
            onClick={() => setPeopleOpen(false)}
          />
          <div className="absolute bottom-0 left-0 right-0 mx-auto w-full max-w-xl rounded-t-2xl bg-white text-zinc-900 shadow-2xl">
            <div className="px-4 py-4">
              <div className="space-y-5">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Yetişkin</p>
                    <p className="text-sm text-zinc-500">13 yaş ve üstü</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-600 disabled:opacity-40"
                      onClick={() => setTempAdults((v) => clamp(v - 1, 1, 20))}
                      disabled={tempAdults <= 1}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempAdults}</span>
                    <button
                      type="button"
                      className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-900"
                      onClick={() => setTempAdults((v) => clamp(v + 1, 1, 20))}
                    >
                      +
                    </button>
                  </div>
                </div>

                <div className="h-px bg-zinc-200" />

                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-lg font-semibold">Çocuk</p>
                    <p className="text-sm text-zinc-500">3–12 yaş arası</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <button
                      type="button"
                      className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-600 disabled:opacity-40"
                      onClick={() => setTempChildren((v) => clamp(v - 1, 0, 20))}
                      disabled={tempChildren <= 0}
                    >
                      −
                    </button>
                    <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempChildren}</span>
                    <button
                      type="button"
                      className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-900"
                      onClick={() => setTempChildren((v) => clamp(v + 1, 0, 20))}
                    >
                      +
                    </button>
                  </div>
                </div>
                {peopleTarget === 'package' && (
                  <>
                    <div className="h-px bg-zinc-200" />
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold">Bebek</p>
                        <p className="text-sm text-zinc-500">0–2 yaş arası</p>
                      </div>
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-600 disabled:opacity-40"
                          onClick={() => setTempInfants((v) => clamp(v - 1, 0, 20))}
                          disabled={tempInfants <= 0}
                        >
                          −
                        </button>
                        <span className="w-8 text-center text-xl font-semibold tabular-nums">{tempInfants}</span>
                        <button
                          type="button"
                          className="h-12 w-12 rounded-full border border-zinc-200 text-2xl text-zinc-900"
                          onClick={() => setTempInfants((v) => clamp(v + 1, 0, 20))}
                        >
                          +
                        </button>
                      </div>
                    </div>
                  </>
                )}
              </div>

              <div className="mt-6 flex items-center justify-between">
                <button
                  type="button"
                  className="rounded-lg border border-teal-600 px-4 py-2 text-sm font-semibold text-teal-700"
                  onClick={() => {
                    setTempAdults(1);
                    setTempChildren(0);
                    setTempInfants(0);
                  }}
                >
                  Temizle
                </button>
                <button
                  type="button"
                  className="rounded-xl bg-[#1D61FF] px-6 py-3 text-sm font-semibold text-white"
                  onClick={() => {
                    if (peopleTarget === 'villa') {
                      setVAdults(tempAdults);
                      setVChildren(tempChildren);
                    } else if (peopleTarget === 'package') {
                      setPtAdults(tempAdults);
                      setPtChildren(tempChildren);
                      setPtInfants(tempInfants);
                    } else {
                      setAdults(tempAdults);
                      setChildren(tempChildren);
                      setInfants(tempInfants);
                    }
                    setPeopleOpen(false);
                  }}
                >
                  Tamam
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
