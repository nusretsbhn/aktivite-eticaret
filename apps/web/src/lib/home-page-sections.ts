/** Hero ve footer sabit; aradaki blokların sırası `siteManagement.homePageSectionOrder` ile yönetilir. */

export const HOME_PAGE_SECTION_IDS = [
  'banners',
  'villaSpotlight',
  'boatTour',
  'activities',
  'actions',
  'categories',
  'packages',
  'location',
  'villaRegionBanners',
  'villas',
  'villasByFeature',
  'benefits',
  'honeymoonVillas',
  'faq',
] as const;

export type HomePageSectionId = (typeof HOME_PAGE_SECTION_IDS)[number];

const DEFAULT_ORDER: HomePageSectionId[] = [...HOME_PAGE_SECTION_IDS];

const LABELS: Record<HomePageSectionId, string> = {
  banners: 'Bannerlar (slider + sağ)',
  villaSpotlight: 'Villa vitrin (öne çıkanlar)',
  boatTour: 'Tekne turu bölümü',
  activities: 'Aktiviteler',
  actions: 'Hızlı aksiyonlar',
  categories: 'Kategoriler',
  packages: 'Paketler',
  location: 'Konum / harita widget',
  villaRegionBanners: 'Bölge bannerları',
  villas: 'Villalar listesi',
  villasByFeature: 'Öne çıkan özellik filtreli villalar',
  benefits: 'Avantajlar',
  honeymoonVillas: 'Balayı villaları',
  faq: 'Sık sorulan sorular',
};

export function homePageSectionLabel(id: HomePageSectionId): string {
  return LABELS[id] ?? id;
}

export function isHomePageSectionId(s: string): s is HomePageSectionId {
  return (HOME_PAGE_SECTION_IDS as readonly string[]).includes(s);
}

/** Geçersiz / tekrar eden id’leri atar; eksikleri varsayılan sırayla sona ekler. */
export function normalizeHomePageSectionOrder(raw: unknown): HomePageSectionId[] {
  const valid = new Set<string>(HOME_PAGE_SECTION_IDS);
  const seen = new Set<string>();
  const out: HomePageSectionId[] = [];
  if (Array.isArray(raw)) {
    for (const x of raw) {
      const id = String(x ?? '').trim();
      if (!valid.has(id) || seen.has(id)) continue;
      seen.add(id);
      out.push(id as HomePageSectionId);
    }
  }
  for (const id of DEFAULT_ORDER) {
    if (!seen.has(id)) out.push(id);
  }
  return out;
}

export const DEFAULT_HOME_PAGE_SECTION_ORDER = DEFAULT_ORDER;
