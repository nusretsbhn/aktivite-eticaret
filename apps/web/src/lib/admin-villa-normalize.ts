import { randomUUID } from 'node:crypto';

import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import { mergePricesByDate } from '@/lib/price-helpers';
import { slugifyVillaTitle } from '@/lib/villa-slug';
import type { GalleryItem, PriceEntry } from '@/types/admin-activity';
import type { AdminVillaInput, VillaPaymentCurrency, VillaPoolType } from '@/types/admin-villa';

export function normalizeGalleryPayload(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  const items: GalleryItem[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const url = String(o.url ?? '').trim();
    if (!url) continue;
    const type = o.type === 'video' ? 'video' : 'image';
    items.push({
      id: String(o.id ?? randomUUID()),
      url,
      type,
      sortOrder: Number.isFinite(Number(o.sortOrder)) ? Number(o.sortOrder) : 0,
      isCover: Boolean(o.isCover),
    });
  }
  return items.sort((a, b) => a.sortOrder - b.sortOrder);
}

export function normalizePricesPayload(raw: unknown): PriceEntry[] {
  if (!Array.isArray(raw)) return [];
  const items: PriceEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const date = String(o.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const price = Number(o.price);
    if (!Number.isFinite(price)) continue;
    items.push({ date, price });
  }
  return mergePricesByDate([], items);
}

const CURRENCIES: VillaPaymentCurrency[] = ['TRY', 'USD', 'EUR', 'GBP'];
const POOL_TYPES: VillaPoolType[] = ['open', 'indoor', 'kids', 'shared'];

function normalizeCurrency(v: unknown): VillaPaymentCurrency {
  const s = String(v ?? '').toUpperCase();
  return CURRENCIES.includes(s as VillaPaymentCurrency) ? (s as VillaPaymentCurrency) : 'TRY';
}

function normalizePoolType(v: unknown): VillaPoolType {
  const s = String(v ?? '');
  return POOL_TYPES.includes(s as VillaPoolType) ? (s as VillaPoolType) : 'open';
}

export function normalizeVillaBody(body: Partial<AdminVillaInput>): AdminVillaInput {
  const tagIds = Array.isArray(body.tagIds) ? body.tagIds.map(String).filter(Boolean) : [];
  const poolsRaw = Array.isArray(body.pools) ? body.pools : [];
  const pools = poolsRaw
    .filter((p) => p && typeof p === 'object')
    .map((p) => {
      const o = p as Record<string, unknown>;
      return {
        id: String(o.id ?? randomUUID()),
        poolType: normalizePoolType(o.poolType),
        heated: Boolean(o.heated),
        widthCm: Math.max(0, Number(o.widthCm) || 0),
        lengthCm: Math.max(0, Number(o.lengthCm) || 0),
        depthCm: Math.max(0, Number(o.depthCm) || 0),
        note: String(o.note ?? '').trim(),
      };
    });

  const mapEquip = (arr: unknown) =>
    (Array.isArray(arr) ? arr : [])
      .filter((x) => x && typeof x === 'object')
      .map((x) => {
        const o = x as Record<string, unknown>;
        return {
          id: String(o.id ?? randomUUID()),
          icon: String(o.icon ?? '').trim(),
          description: String(o.description ?? '').trim(),
        };
      });

  const roomsRaw = Array.isArray(body.rooms) ? body.rooms : [];
  const rooms = roomsRaw
    .filter((r) => r && typeof r === 'object')
    .map((r) => {
      const o = r as Record<string, unknown>;
      const itemsRaw = Array.isArray(o.items) ? o.items : [];
      const items = itemsRaw
        .filter((it) => it && typeof it === 'object')
        .map((it) => {
          const x = it as Record<string, unknown>;
          return {
            id: String(x.id ?? randomUUID()),
            name: String(x.name ?? '').trim(),
          };
        });
      return {
        id: String(o.id ?? randomUUID()),
        name: String(o.name ?? '').trim(),
        items,
      };
    });

  let slug = String(body.slug ?? '').trim().toLowerCase();
  if (!slug) {
    slug = slugifyVillaTitle(String(body.displayName ?? ''));
  } else {
    slug = slugifyVillaTitle(slug);
  }

  return {
    displayName: String(body.displayName ?? '').trim(),
    legalName: String(body.legalName ?? '').trim(),
    documentNo: String(body.documentNo ?? '').trim(),
    isActive: Boolean(body.isActive),
    tagIds,
    guestCount: Math.max(0, Number(body.guestCount) || 0),
    bedroomCount: Math.max(0, Number(body.bedroomCount) || 0),
    bathroomCount: Math.max(0, Number(body.bathroomCount) || 0),
    squareMeters: Math.max(0, Number(body.squareMeters) || 0),
    slug,
    description: String(body.description ?? '').trim(),
    ownerFullName: String(body.ownerFullName ?? '').trim(),
    ownerPhone: String(body.ownerPhone ?? '').trim(),
    ownerIban: String(body.ownerIban ?? '')
      .replace(/\s/g, '')
      .trim(),
    city: String(body.city ?? '').trim(),
    district: String(body.district ?? '').trim(),
    region: String(body.region ?? '').trim(),
    mapUrl: String(body.mapUrl ?? '').trim(),
    addressLine: String(body.addressLine ?? '').trim(),
    minStayNights: Math.max(1, Number(body.minStayNights) || 1),
    cleaningFee: Math.max(0, Number(body.cleaningFee) || 0),
    freeCleaningThreshold: Math.max(0, Number(body.freeCleaningThreshold) || 0),
    damageDeposit: Math.max(0, Number(body.damageDeposit) || 0),
    paymentCurrency: normalizeCurrency(body.paymentCurrency),
    commissionPercent: Math.min(100, Math.max(0, Number(body.commissionPercent) || 0)),
    prepaymentPercent: Math.min(100, Math.max(0, Number(body.prepaymentPercent) || 0)),
    pools,
    featuredItems: mapEquip(body.featuredItems),
    amenities: mapEquip(body.amenities),
    houseRules: mapEquip(body.houseRules),
    rooms,
    utilitiesNote: String(body.utilitiesNote ?? '').trim(),
    nearbyNote: String(body.nearbyNote ?? '').trim(),
    sellerNote: String(body.sellerNote ?? '').trim(),
    gallery: normalizeGalleryPayload(body.gallery),
    prices: normalizePricesPayload(body.prices),
    availability: normalizeAvailabilityPayload(body.availability),
  };
}

export function validateVillaRequired(v: AdminVillaInput): string | null {
  if (!v.displayName) return 'Villa adı (takma) zorunludur.';
  if (!v.legalName) return 'Villa gerçek adı zorunludur.';
  if (!v.slug) return 'Villa URL (slug) zorunludur.';
  if (!v.description) return 'Tanıtım yazısı zorunludur.';
  if (!v.ownerFullName) return 'Yetkili ad-soyad zorunludur.';
  if (!v.ownerPhone) return 'Telefon zorunludur.';
  if (!v.city || !v.district || !v.region) return 'İl, ilçe ve bölge zorunludur.';
  return null;
}
