import type { AdminActivity } from '@/types/admin-activity';
import type { AdminPackage } from '@/types/admin-package';

export function computePackagePriceForDate(
  pkg: AdminPackage,
  activities: AdminActivity[],
  date: string,
): { total: number | null; missingActivityIds: string[]; breakdown: { activityId: string; price: number }[] } {
  const actById = new Map(activities.map((a) => [a.id, a]));
  const breakdown: { activityId: string; price: number }[] = [];
  const missing: string[] = [];
  let total = 0;

  for (const id of pkg.activityIds) {
    const act = actById.get(id);
    if (!act) {
      missing.push(id);
      continue;
    }
    const entry = (act.prices ?? []).find((p) => p.date === date);
    if (!entry || !Number.isFinite(Number(entry.price))) {
      missing.push(id);
      continue;
    }
    const price = Number(entry.price);
    breakdown.push({ activityId: id, price });
    total += price;
  }

  if (missing.length > 0) return { total: null, missingActivityIds: missing, breakdown };
  return { total, missingActivityIds: [], breakdown };
}

