import type { AdminActivity, AvailabilityDayStatus, AvailabilityEntry } from '@/types/admin-activity';

/** Aktivite veya villa gibi `availability` listesi olan kayıtlar için. */
export type EntityWithAvailability = { availability?: AvailabilityEntry[] };

import { expandDateRange } from './price-helpers';

function datesInRange(from: string, to: string): string[] {
  return expandDateRange(from, to, 0).map((e) => e.date);
}

/** Tarih için müsaitlik: kayıt yoksa müsait. */
export function getAvailabilityForDate(
  entity: EntityWithAvailability,
  date: string,
): AvailabilityDayStatus {
  const row = (entity.availability ?? []).find((x) => x.date === date);
  return row ? row.status : 'available';
}

/** Aynı tarih için son yazılan kazanır. */
export function mergeAvailabilityByDate(
  existing: AvailabilityEntry[],
  incoming: AvailabilityEntry[],
): AvailabilityEntry[] {
  const map = new Map<string, 'full' | 'maintenance'>();
  for (const e of existing) {
    if (e.date && (e.status === 'full' || e.status === 'maintenance')) {
      map.set(e.date, e.status);
    }
  }
  for (const i of incoming) {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(i.date)) continue;
    if (i.status === 'full' || i.status === 'maintenance') {
      map.set(i.date, i.status);
    }
  }
  return [...map.entries()]
    .map(([date, status]) => ({ date, status }))
    .sort((a, b) => a.date.localeCompare(b.date));
}

export function removeAvailabilityDates(
  existing: AvailabilityEntry[],
  dates: string[],
): AvailabilityEntry[] {
  if (dates.length === 0) return existing;
  const drop = new Set(dates);
  return existing.filter((e) => !drop.has(e.date));
}

/** Aralıkta müsait: o günlerdeki dolu/bakım kayıtlarını kaldırır. */
export function clearAvailabilityInRange(
  existing: AvailabilityEntry[],
  from: string,
  to: string,
): AvailabilityEntry[] {
  return removeAvailabilityDates(existing, datesInRange(from, to));
}

/** Aralığa dolu veya bakım uygular (her gün aynı durum). */
export function applyAvailabilityRange(
  existing: AvailabilityEntry[],
  from: string,
  to: string,
  status: 'full' | 'maintenance',
): AvailabilityEntry[] {
  const dates = datesInRange(from, to);
  const incoming: AvailabilityEntry[] = dates.map((date) => ({ date, status }));
  return mergeAvailabilityByDate(existing, incoming);
}

/** Tek günü müsait yapar (kayıt siler). */
export function setDayAvailable(existing: AvailabilityEntry[], date: string): AvailabilityEntry[] {
  return removeAvailabilityDates(existing, [date]);
}

/** Tek gün dolu/bakım. */
export function setDayStatus(
  existing: AvailabilityEntry[],
  date: string,
  status: 'full' | 'maintenance',
): AvailabilityEntry[] {
  return mergeAvailabilityByDate(existing, [{ date, status }]);
}

export function normalizeAvailabilityPayload(raw: unknown): AvailabilityEntry[] {
  if (!Array.isArray(raw)) return [];
  const out: AvailabilityEntry[] = [];
  for (const item of raw) {
    if (!item || typeof item !== 'object') continue;
    const o = item as Record<string, unknown>;
    const date = String(o.date ?? '').slice(0, 10);
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) continue;
    const s = o.status;
    if (s === 'full' || s === 'maintenance') {
      out.push({ date, status: s });
    }
  }
  return mergeAvailabilityByDate([], out);
}

/** Rezervasyon API: tur bu tarih ve kişi sayısı ile satılabilir mi? */
export function validateBookingRequest(
  activity: AdminActivity | undefined,
  date: string,
  peopleCount: number,
): { ok: true } | { ok: false; httpStatus: number; message: string } {
  if (!activity) {
    return { ok: false, httpStatus: 400, message: 'Aktivite bulunamadı.' };
  }
  if (!activity.isActive) {
    return { ok: false, httpStatus: 400, message: 'Bu tur şu an satışa kapalı.' };
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) {
    return { ok: false, httpStatus: 400, message: 'Geçersiz tarih.' };
  }
  const dayPrice = (activity.prices ?? []).find((p) => p.date === date)?.price;
  if (typeof dayPrice !== 'number' || !Number.isFinite(dayPrice)) {
    return { ok: false, httpStatus: 400, message: 'Bu tarih için fiyat tanımlı değil veya tur müsait değil.' };
  }
  const av = getAvailabilityForDate(activity, date);
  if (av === 'full') {
    return { ok: false, httpStatus: 409, message: 'Seçilen tarih için kontenjan dolu.' };
  }
  if (av === 'maintenance') {
    return { ok: false, httpStatus: 409, message: 'Seçilen tarih için tur bakımda.' };
  }
  const cap = activity.capacity ?? 0;
  if (cap > 0 && peopleCount > cap) {
    return { ok: false, httpStatus: 400, message: 'Kişi sayısı tur kapasitesini aşıyor.' };
  }
  return { ok: true };
}
