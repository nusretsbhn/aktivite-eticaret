import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type {
  AdminPackageTourActivity,
  AdminPackageTourActivityInput,
  PackageTourActivityPriceEntry,
  PackageTourGalleryItem,
} from '@/types/admin-package-tour-activity';

const DATA_PATH = appDataFile('admin-package-tour-activities.json');

function normalizeGallery(raw: unknown): PackageTourGalleryItem[] {
  if (!Array.isArray(raw)) return [];
  const out = raw
    .map((item, i) => {
      const row = (item ?? {}) as Partial<PackageTourGalleryItem>;
      return {
        id: String(row.id ?? ''),
        url: String(row.url ?? ''),
        sortOrder: Number.isFinite(row.sortOrder) ? Number(row.sortOrder) : i,
        isCover: Boolean(row.isCover),
      };
    })
    .filter((g) => g.id && g.url)
    .sort((a, b) => a.sortOrder - b.sortOrder)
    .map((g, i) => ({ ...g, sortOrder: i }));
  if (out.length > 0 && !out.some((x) => x.isCover)) out[0]!.isCover = true;
  return out;
}

function normalizePrices(raw: unknown): PackageTourActivityPriceEntry[] {
  if (!Array.isArray(raw)) return [];
  const map = new Map<string, PackageTourActivityPriceEntry>();
  for (const item of raw) {
    const row = (item ?? {}) as Partial<PackageTourActivityPriceEntry>;
    const date = String(row.date ?? '').trim();
    const p = Number(row.price);
    if (!date || !Number.isFinite(p) || p < 0) continue;
    const child = Number(row.priceChild);
    const infant = Number(row.priceInfant);
    map.set(date, {
      date,
      price: p,
      priceChild: Number.isFinite(child) && child >= 0 ? child : p,
      priceInfant: Number.isFinite(infant) && infant >= 0 ? infant : p,
    });
  }
  return [...map.values()].sort((a, b) => a.date.localeCompare(b.date));
}

export function normalizePackageTourActivityInput(
  body: Partial<AdminPackageTourActivityInput>,
): Omit<AdminPackageTourActivity, 'id' | 'activityId' | 'createdAt' | 'updatedAt'> {
  return {
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    location: String(body.location ?? '').trim(),
    category: String(body.category ?? '').trim(),
    gallery: normalizeGallery(body.gallery),
    videoUrl: String(body.videoUrl ?? '').trim(),
    prices: normalizePrices(body.prices),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

export async function readPackageTourActivities(): Promise<AdminPackageTourActivity[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-package-tour-activities', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<AdminPackageTourActivity>[]).map((row) => {
      const normalized = normalizePackageTourActivityInput(row);
      return {
        id: String(row.id ?? ''),
        activityId: String(row.activityId ?? ''),
        createdAt: String(row.createdAt ?? ''),
        updatedAt: String(row.updatedAt ?? ''),
        ...normalized,
      };
    });
  } catch {
    return [];
  }
}

export async function writePackageTourActivities(items: AdminPackageTourActivity[]): Promise<void> {
  await writeJsonStore('admin-package-tour-activities', items, DATA_PATH);
}

