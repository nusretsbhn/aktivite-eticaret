import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { GalleryItem } from '@/types/admin-activity';

const DATA_PATH = appDataFile('admin-package-tours.json');

function normalizePriceRules(raw: unknown): AdminPackageTour['priceRules'] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((row) => {
      if (!row || typeof row !== 'object') return null;
      const r = row as Record<string, unknown>;
      const id = String(r.id ?? '').trim();
      const fromDate = String(r.fromDate ?? '').trim();
      const toDate = String(r.toDate ?? '').trim();
      if (!id || !fromDate || !toDate) return null;
      return {
        id,
        fromDate,
        toDate,
        costPrice: Math.max(0, Number(r.costPrice) || 0),
        profitPercent: Math.max(0, Number(r.profitPercent) || 0),
        singleRoomMultiplier: Math.max(1, Number(r.singleRoomMultiplier) || 1),
        roundingMode: r.roundingMode === 'down' ? 'down' : 'up',
        childAgeRules: Array.isArray(r.childAgeRules)
          ? r.childAgeRules
              .map((x) => {
                if (!x || typeof x !== 'object') return null;
                const c = x as Record<string, unknown>;
                const childId = String(c.id ?? '').trim();
                const childOrder = Math.max(1, Number(c.childOrder) || 1);
                const minAge = Math.max(0, Number(c.minAge) || 0);
                const maxAge = Math.max(minAge, Number(c.maxAge) || minAge);
                const discountPercent = Math.min(100, Math.max(0, Number(c.discountPercent) || 0));
                if (!childId) return null;
                return { id: childId, childOrder, minAge, maxAge, discountPercent };
              })
              .filter((x): x is NonNullable<typeof x> => Boolean(x))
          : [
              { id: `${id}-c1`, childOrder: 1, minAge: 0, maxAge: 10, discountPercent: 100 },
              { id: `${id}-c2`, childOrder: 2, minAge: 0, maxAge: 2, discountPercent: 100 },
              {
                id: `${id}-c3`,
                childOrder: 2,
                minAge: 3,
                maxAge: 12,
                discountPercent: Math.min(
                  100,
                  Math.max(
                    0,
                    Number(
                      (r as { secondChildDiscount3to12Percent?: unknown }).secondChildDiscount3to12Percent ??
                        ((r as { childPercent3to12?: unknown }).childPercent3to12 !== undefined
                          ? 100 - (Number((r as { childPercent3to12?: unknown }).childPercent3to12) || 0)
                          : 50),
                    ) || 0,
                  ),
                ),
              },
            ],
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));
}

function normalizeGallery(raw: unknown): GalleryItem[] {
  if (!Array.isArray(raw)) return [];
  return raw
    .map((item, i) => {
      if (!item || typeof item !== 'object') return null;
      const row = item as Partial<GalleryItem>;
      return {
        id: String(row.id ?? ''),
        url: String(row.url ?? ''),
        type: row.type === 'video' ? 'video' : 'image',
        sortOrder: Number.isFinite(row.sortOrder) ? Number(row.sortOrder) : i,
        isCover: Boolean(row.isCover),
      } satisfies GalleryItem;
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x) && Boolean(x.url) && Boolean(x.id))
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g, i) => ({ ...g, sortOrder: i }));
}

export async function readPackageTours(): Promise<AdminPackageTour[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-package-tours', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<AdminPackageTour>[]).map((item) => {
      const description = String(item.description ?? '');
      const legacyDuration = description.match(/(\d+)\s*gece[\s/&-]*(\d+)\s*g[üu]n/i);
      const fallbackNight = legacyDuration ? Math.max(1, Number(legacyDuration[1]) || 1) : 1;
      const fallbackDay = legacyDuration ? Math.max(1, Number(legacyDuration[2]) || fallbackNight + 1) : 1;
      const nightCount = Math.max(1, Number(item.nightCount) || fallbackNight);
      const dayCount = Math.max(1, Number(item.dayCount) || fallbackDay);
      return {
      id: String(item.id ?? ''),
      packageTourId: String(item.packageTourId ?? ''),
      packageName: String(item.packageName ?? (item as { name?: string }).name ?? ''),
      conceptName: String(item.conceptName ?? ''),
      description,
      nightCount,
      dayCount,
      includedServiceIds: Array.isArray(item.includedServiceIds) ? item.includedServiceIds.map(String) : [],
      paidServiceIds: Array.isArray(item.paidServiceIds) ? item.paidServiceIds.map(String) : [],
      activityIds: Array.isArray(item.activityIds) ? item.activityIds.map(String) : [],
      gallery: normalizeGallery(item.gallery),
      priceRules: normalizePriceRules(item.priceRules),
      coverImageUrl: String(item.coverImageUrl ?? normalizeGallery(item.gallery).find((g) => g.isCover)?.url ?? ''),
      isActive: Boolean(item.isActive),
      createdAt: String(item.createdAt ?? ''),
      updatedAt: String(item.updatedAt ?? ''),
    };
    });
  } catch {
    return [];
  }
}

export async function writePackageTours(items: AdminPackageTour[]): Promise<void> {
  await writeJsonStore('admin-package-tours', items, DATA_PATH);
}

