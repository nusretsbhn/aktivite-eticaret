import type { AdminActivity } from '@/types/admin-activity';

/** Kayıtlı sırayı temizler (geçersiz / tekrarlı id’ler atılır). */
export function normalizeHomeActivityOrderIds(raw: unknown): string[] {
  if (!Array.isArray(raw)) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const item of raw) {
    const id = String(item ?? '').trim();
    if (!id || seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  return out;
}

/** Aktif aktiviteleri admin sırasına göre döndürür; listede olmayan aktifler sona eklenir. */
export function sortActiveActivitiesForHome(
  activities: AdminActivity[],
  orderIds: string[] | undefined,
  limit = 12,
): AdminActivity[] {
  const active = (activities ?? []).filter((a) => a?.isActive);
  const byId = new Map(active.map((a) => [a.id, a]));
  const normalized = normalizeHomeActivityOrderIds(orderIds);
  const result: AdminActivity[] = [];
  const seen = new Set<string>();

  for (const id of normalized) {
    const a = byId.get(id);
    if (a) {
      result.push(a);
      seen.add(id);
    }
  }

  const rest = active
    .filter((a) => !seen.has(a.id))
    .slice()
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  return [...result, ...rest].slice(0, Math.max(0, limit));
}

/** Admin arayüzü: yalnızca aktif aktiviteleri sıralı liste olarak üretir. */
export function buildHomeActivityOrderFromActivities(
  activities: AdminActivity[],
  savedOrder: string[] | undefined,
): AdminActivity[] {
  return sortActiveActivitiesForHome(activities, savedOrder, Number.MAX_SAFE_INTEGER);
}
