import { computeDiscountedFromAdult, computeRuleAdultPrice } from '@/lib/package-tour-pricing';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';

type GuestInput = { adults: number; children: number; infants: number };

function normalizeGuests(input: GuestInput): GuestInput {
  return {
    adults: Math.max(1, Math.floor(Number(input.adults) || 1)),
    children: Math.max(0, Math.floor(Number(input.children) || 0)),
    infants: Math.max(0, Math.floor(Number(input.infants) || 0)),
  };
}

function overlapsAgeRange(minAge: number, maxAge: number, targetMin: number, targetMax: number): boolean {
  return maxAge >= targetMin && minAge <= targetMax;
}

function diffCalendarDays(checkInIso: string, checkOutIso: string): number {
  const a = new Date(`${checkInIso}T00:00:00`);
  const b = new Date(`${checkOutIso}T00:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime())) return 1;
  const msPerDay = 24 * 60 * 60 * 1000;
  return Math.max(1, Math.round((b.getTime() - a.getTime()) / msPerDay));
}

function inferIncludedActivityIds(
  item: AdminPackageTour,
  activities: AdminPackageTourActivity[],
): Set<string> {
  const out = new Set<string>(item.activityIds ?? []);
  const text = String(item.description ?? '').toLocaleLowerCase('tr');
  for (const a of activities) {
    if (text.includes(a.name.toLocaleLowerCase('tr'))) {
      out.add(a.id);
      out.add(a.activityId);
    }
  }
  return out;
}

function resolveIncludedActivityAdultCost(
  item: AdminPackageTour,
  activities: AdminPackageTourActivity[],
  checkInIso: string,
): number {
  if (!Array.isArray(activities) || activities.length === 0) return 0;
  const included = inferIncludedActivityIds(item, activities);
  return activities
    .filter((a) => included.has(a.id) || included.has(a.activityId))
    .reduce((sum, activity) => {
      const row = (activity.prices ?? []).find((p) => p.date === checkInIso);
      return sum + Math.max(0, Number(row?.price) || 0);
    }, 0);
}

function getBandDiscountPercent(
  rules: AdminPackageTour['priceRules'][number]['childAgeRules'],
  targetMin: number,
  targetMax: number,
): number | null {
  const candidates = rules.filter((r) => overlapsAgeRange(r.minAge, r.maxAge, targetMin, targetMax));
  if (candidates.length === 0) return null;
  return Math.max(...candidates.map((x) => x.discountPercent));
}

function getOrderedBandDiscountPercent(
  rules: AdminPackageTour['priceRules'][number]['childAgeRules'],
  targetMin: number,
  targetMax: number,
  childOrder: number,
): number {
  const exact = rules.find(
    (r) => r.childOrder === childOrder && overlapsAgeRange(r.minAge, r.maxAge, targetMin, targetMax),
  );
  if (exact) return exact.discountPercent;
  return 0;
}

export function findPackageTourRuleForDate(
  item: AdminPackageTour,
  checkInIso: string,
  checkOutIso: string,
): AdminPackageTour['priceRules'][number] | null {
  const from = new Date(`${checkInIso}T12:00:00`);
  const to = new Date(`${checkOutIso}T12:00:00`);
  if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime()) || from > to) return null;
  return (
    item.priceRules.find((r) => {
      const rf = new Date(`${r.fromDate}T12:00:00`);
      const rt = new Date(`${r.toDate}T12:00:00`);
      return rf <= from && rt >= to;
    }) ?? null
  );
}

export function computePackageTourTotalForSearch(
  item: AdminPackageTour,
  checkInIso: string,
  checkOutIso: string,
  guestsInput: GuestInput,
  activities: AdminPackageTourActivity[] = [],
): { ok: true; total: number; nights: number; adultPrice: number; childPrice: number; infantPrice: number } | { ok: false } {
  const rule = findPackageTourRuleForDate(item, checkInIso, checkOutIso);
  if (!rule) return { ok: false };
  const guests = normalizeGuests(guestsInput);
  const nights = diffCalendarDays(checkInIso, checkOutIso);
  const isSingleOccupancy = guests.adults === 1 && guests.children === 0 && guests.infants === 0;
  const effectiveHotelDailyCost = isSingleOccupancy
    ? Math.max(0, Number(rule.costPrice) || 0) * Math.max(1, Number(rule.singleRoomMultiplier) || 1)
    : Math.max(0, Number(rule.costPrice) || 0);
  const includedActivityAdultCost = resolveIncludedActivityAdultCost(item, activities, checkInIso);
  const adultPrice = computeRuleAdultPrice({
    ...rule,
    costPrice: effectiveHotelDailyCost,
    nights,
    activityTotal: includedActivityAdultCost,
  });
  let childrenTotal = 0;
  for (let i = 1; i <= guests.children; i += 1) {
    const discount = getOrderedBandDiscountPercent(rule.childAgeRules, 3, 12, i);
    childrenTotal += computeDiscountedFromAdult(adultPrice, discount);
  }
  let infantsTotal = 0;
  for (let i = 1; i <= guests.infants; i += 1) {
    const fallbackInfantDiscount = getBandDiscountPercent(rule.childAgeRules, 0, 2) ?? 100;
    const discount = getOrderedBandDiscountPercent(rule.childAgeRules, 0, 2, i) || fallbackInfantDiscount;
    infantsTotal += computeDiscountedFromAdult(adultPrice, discount);
  }
  const childPrice = guests.children > 0 ? Math.round(childrenTotal / guests.children) : 0;
  const infantPrice = guests.infants > 0 ? Math.round(infantsTotal / guests.infants) : 0;
  const total = adultPrice * guests.adults + childrenTotal + infantsTotal;
  return { ok: true, total, nights, adultPrice, childPrice, infantPrice };
}

