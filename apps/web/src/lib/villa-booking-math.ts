import type { AdminVilla } from '@/types/admin-villa';

/** Çıkış günü konaklamaya dahil değil: gece sayısı */
export function nightsBetween(checkInIso: string, checkOutIso: string): number {
  const a = new Date(`${checkInIso}T12:00:00`);
  const b = new Date(`${checkOutIso}T12:00:00`);
  if (Number.isNaN(a.getTime()) || Number.isNaN(b.getTime()) || b <= a) return 0;
  return Math.round((b.getTime() - a.getTime()) / 86400000);
}

export function addDaysIso(iso: string, days: number): string {
  const d = new Date(`${iso}T12:00:00`);
  d.setDate(d.getDate() + days);
  return d.toISOString().slice(0, 10);
}

/** Konaklanan her gece için tarih listesi (check-in dahil, check-out hariç) */
export function nightDates(checkInIso: string, nights: number): string[] {
  const out: string[] = [];
  let d = new Date(`${checkInIso}T12:00:00`);
  for (let i = 0; i < nights; i++) {
    out.push(d.toISOString().slice(0, 10));
    d = new Date(d);
    d.setDate(d.getDate() + 1);
  }
  return out;
}

export function sumNightlyPrices(
  villa: AdminVilla,
  dates: string[],
): { sum: number; missingDates: string[]; byNight: { date: string; price: number }[] } {
  const missingDates: string[] = [];
  const byNight: { date: string; price: number }[] = [];
  let sum = 0;
  for (const date of dates) {
    const row = villa.prices.find((p) => p.date === date);
    if (!row) {
      missingDates.push(date);
      continue;
    }
    byNight.push({ date, price: row.price });
    sum += row.price;
  }
  return { sum, missingDates, byNight };
}

/** Ortalama gecelik (gösterim için) */
export function averageNightly(total: number, nights: number): number {
  if (nights <= 0) return 0;
  return total / nights;
}
