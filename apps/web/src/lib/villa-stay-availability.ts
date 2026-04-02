import { getAvailabilityForDate } from '@/lib/availability-helpers';
import { addDaysIso, nightDates, nightsBetween } from '@/lib/villa-booking-math';
import { getNightlyPriceForDate } from '@/lib/villa-public-pricing';
import type { AdminVilla } from '@/types/admin-villa';

/**
 * Villa konaklama aralığı (giriş / çıkış) doğrulaması.
 *
 * Konaklama **geceleri** [checkIn, checkOut) aralığındaki tarihlerdir; çıkış günü gece sayılmaz
 * (sabah tahliye). Bu yüzden çıkış tarihinin müsaitlik kaydı konaklama için zorunlu değildir.
 *
 * Panelde bir güne "dolu" işaretlemek, o günün **çıkış** veya yeni **giriş** (önceki gece
 * sonrası devir) için engel oluşturmaz: ilk konaklama gecesi = giriş gününde `full` yok sayılır.
 * Ara gecelerde `full` ve `maintenance` konaklamayı engeller.
 */
export function isValidVillaStayRange(villa: AdminVilla, checkIn: string, checkOut: string): boolean {
  const n = nightsBetween(checkIn, checkOut);
  if (n < Math.max(1, villa.minStayNights)) return false;
  const nights = nightDates(checkIn, n);
  for (const d of nights) {
    if (getNightlyPriceForDate(villa, d) === null) return false;
    const av = getAvailabilityForDate(villa, d);
    if (av === 'maintenance') return false;
    if (av === 'full' && d !== checkIn) return false;
  }
  return true;
}

/** Girişe göre tüm geçerli çıkış tarihleri (tarih sıralı). UI’da tekrarlı hesap yerine bir kez üretilir. */
export function listAllValidVillaCheckouts(villa: AdminVilla, checkIn: string): string[] {
  const minN = Math.max(1, villa.minStayNights);
  const out: string[] = [];
  for (let add = minN; add <= 400; add++) {
    const d = addDaysIso(checkIn, add);
    if (isValidVillaStayRange(villa, checkIn, d)) out.push(d);
  }
  return out;
}

function firstValidCheckoutOnOrAfter(sortedIso: string[], earliestOut: string): string | null {
  let lo = 0;
  let hi = sortedIso.length - 1;
  let ans = -1;
  while (lo <= hi) {
    const mid = (lo + hi) >> 1;
    if (sortedIso[mid] >= earliestOut) {
      ans = mid;
      hi = mid - 1;
    } else {
      lo = mid + 1;
    }
  }
  return ans === -1 ? null : sortedIso[ans];
}

export function hasValidVillaCheckoutOnOrAfter(sortedValidCheckouts: string[], iso: string): boolean {
  return firstValidCheckoutOnOrAfter(sortedValidCheckouts, iso) !== null;
}

export function findFirstValidVillaCheckOut(villa: AdminVilla, checkIn: string): string | null {
  const all = listAllValidVillaCheckouts(villa, checkIn);
  return all.length > 0 ? all[0] : null;
}

/** Tıklanan çıkış günü veya sonrası için ilk geçerli çıkış tarihi */
export function findValidVillaCheckOutFrom(
  villa: AdminVilla,
  checkIn: string,
  earliestOut: string,
): string | null {
  const all = listAllValidVillaCheckouts(villa, checkIn);
  return firstValidCheckoutOnOrAfter(all, earliestOut);
}
