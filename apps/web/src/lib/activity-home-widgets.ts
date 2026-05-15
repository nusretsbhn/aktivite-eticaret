import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings, SettingsCategory } from '@/types/admin-settings';

/** Ana sayfa lokasyon / kategori kartları için önerilen boyut */
export const ACTIVITY_HOME_TILE_IMAGE_HINT = '800×600 px (4:3), JPG veya WebP önerilir';

export function parseActivityImageMap(raw: unknown): Record<string, string> {
  const out: Record<string, string> = {};
  if (!raw || typeof raw !== 'object') return out;
  for (const [k, v] of Object.entries(raw as Record<string, unknown>)) {
    const key = String(k ?? '').trim().slice(0, 120);
    const val = String(v ?? '').trim().slice(0, 500);
    if (key && val) out[key] = val;
  }
  return out;
}

function normalizeLocationKey(s: string) {
  return s.trim().replace(/\s+/g, ' ');
}

function getActivityCoverUrl(a: AdminActivity): string {
  const images = (a.gallery ?? []).filter((g) => g.type === 'image' && g.url);
  const cover = images.find((g) => g.isCover) ?? images.sort((x, y) => x.sortOrder - y.sortOrder)[0];
  return cover?.url ? String(cover.url).trim() : '';
}

function minPriceForActivities(list: AdminActivity[]) {
  let min: number | null = null;
  for (const a of list) {
    for (const p of a.prices ?? []) {
      const v = Number(p.price);
      if (!Number.isFinite(v) || v <= 0) continue;
      min = min === null ? v : Math.min(min, v);
    }
  }
  return min;
}

export type ActivityLocationTile = {
  location: string;
  imageUrl: string;
  totalTours: number;
  minPrice: number | null;
};

export type ActivityMainCategoryTile = {
  categoryId: string;
  name: string;
  imageUrl: string;
  totalTours: number;
  minPrice: number | null;
};

export function collectActivityLocationTiles(
  activities: AdminActivity[],
  settings: AdminSettings,
): ActivityLocationTile[] {
  const active = (activities ?? []).filter((a) => a?.isActive && normalizeLocationKey(a.location ?? ''));
  if (!active.length) return [];

  const imageMap = parseActivityImageMap(settings.blockManagement?.activityLocationImages);

  const byLocation = new Map<string, AdminActivity[]>();
  for (const a of active) {
    const key = normalizeLocationKey(a.location);
    const arr = byLocation.get(key) ?? [];
    arr.push(a);
    byLocation.set(key, arr);
  }

  const tiles: ActivityLocationTile[] = [];
  for (const [location, list] of byLocation.entries()) {
    const adminImage = (imageMap[location] ?? '').trim();
    if (!adminImage) continue;
    const prices = list
      .flatMap((a) => a.prices ?? [])
      .map((p) => Number(p.price))
      .filter((n) => Number.isFinite(n) && n > 0)
      .sort((a, b) => a - b);
    tiles.push({
      location,
      imageUrl: adminImage,
      totalTours: list.length,
      minPrice: prices[0] ?? null,
    });
  }
  return tiles.sort((a, b) => b.totalTours - a.totalTours || a.location.localeCompare(b.location, 'tr'));
}

export function collectActivityMainCategoryTiles(
  activities: AdminActivity[],
  settings: AdminSettings,
): ActivityMainCategoryTile[] {
  const active = (activities ?? []).filter((a) => a?.isActive && String(a.mainCategory ?? '').trim());
  if (!active.length) return [];

  const categories = settings.categories ?? [];
  const categoryById = new Map<string, SettingsCategory>(categories.map((c) => [c.id, c]));
  const imageMap = parseActivityImageMap(settings.blockManagement?.activityMainCategoryImages);

  const byCategory = new Map<string, AdminActivity[]>();
  for (const a of active) {
    const id = String(a.mainCategory).trim();
    const arr = byCategory.get(id) ?? [];
    arr.push(a);
    byCategory.set(id, arr);
  }

  const tiles: ActivityMainCategoryTile[] = [];
  for (const [categoryId, list] of byCategory.entries()) {
    const cat = categoryById.get(categoryId);
    const name = cat?.name ?? categoryId;
    const adminImage = (imageMap[categoryId] ?? '').trim();
    if (!adminImage) continue;
    tiles.push({
      categoryId,
      name,
      imageUrl: adminImage,
      totalTours: list.length,
      minPrice: minPriceForActivities(list),
    });
  }
  return tiles.sort((a, b) => b.totalTours - a.totalTours || a.name.localeCompare(b.name, 'tr'));
}

/** Admin: aktivitelerde geçen benzersiz lokasyonlar */
export function uniqueActivityLocations(activities: AdminActivity[]): string[] {
  const set = new Set<string>();
  for (const a of activities ?? []) {
    if (!a?.isActive) continue;
    const loc = normalizeLocationKey(a.location ?? '');
    if (loc) set.add(loc);
  }
  return [...set].sort((a, b) => a.localeCompare(b, 'tr'));
}

/** Admin: aktivitelerde geçen birincil kategori id’leri */
export function uniqueActivityMainCategoryIds(activities: AdminActivity[]): string[] {
  const set = new Set<string>();
  for (const a of activities ?? []) {
    if (!a?.isActive) continue;
    const id = String(a.mainCategory ?? '').trim();
    if (id) set.add(id);
  }
  return [...set].sort();
}
