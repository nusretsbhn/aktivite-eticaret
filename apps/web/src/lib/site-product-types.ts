/**
 * Site genelinde hangi iş hatlarının açık olduğunu işaretler.
 * Ayarlar → Site yönetimi → çoklu seçim ile yönetilir.
 */

/** Tekne turu satışı / içerikleri (ana sayfada ayrı blok; ileride filtrelere bağlanabilir) */
export const SITE_PRODUCT_BOAT_TOUR = 'boat_tour' as const;

/** Mevcut aktivite + paket + listeleme + ana sayfa aktivite bileşenleri (@activity) */
export const SITE_PRODUCT_ACTIVITY = 'activity' as const;

/** Villa kiralama admin + ana sayfa villa widget’ları */
export const SITE_PRODUCT_VILLA_RENTAL = 'villa_rental' as const;

export type SiteProductType =
  | typeof SITE_PRODUCT_BOAT_TOUR
  | typeof SITE_PRODUCT_ACTIVITY
  | typeof SITE_PRODUCT_VILLA_RENTAL;

export const SITE_PRODUCT_OPTIONS: { id: SiteProductType; label: string }[] = [
  { id: SITE_PRODUCT_BOAT_TOUR, label: 'Tekne Turu' },
  { id: SITE_PRODUCT_ACTIVITY, label: 'Aktivite' },
  { id: SITE_PRODUCT_VILLA_RENTAL, label: 'Villa Kiralama' },
];

const ALLOWED = new Set<SiteProductType>([
  SITE_PRODUCT_BOAT_TOUR,
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_VILLA_RENTAL,
]);

/** İlk kurulum: Aktivite + Villa açık */
export const DEFAULT_ENABLED_SITE_PRODUCTS: SiteProductType[] = [
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_VILLA_RENTAL,
];

export function normalizeEnabledSiteProducts(raw: unknown): SiteProductType[] {
  if (!Array.isArray(raw)) return [...DEFAULT_ENABLED_SITE_PRODUCTS];
  const out = raw.filter((x): x is SiteProductType => typeof x === 'string' && ALLOWED.has(x as SiteProductType));
  return out.length > 0 ? out : [...DEFAULT_ENABLED_SITE_PRODUCTS];
}

export function isSiteProductEnabled(
  enabled: SiteProductType[] | undefined,
  product: SiteProductType,
): boolean {
  return normalizeEnabledSiteProducts(enabled).includes(product);
}
