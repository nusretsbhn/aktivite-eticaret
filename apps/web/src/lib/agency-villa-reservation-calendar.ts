import {
  mergeAvailabilityByDate,
  removeAvailabilityDates,
} from '@/lib/availability-helpers';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import { nightDates, nightsBetween } from '@/lib/villa-booking-math';
import type { AgencyVillaReservation } from '@/types/admin-agency-villa-reservation';
import type { AdminVilla } from '@/types/admin-villa';

/** Konaklama geceleri: giriş dahil, çıkış hariç */
export function agencyStayNightDates(checkIn: string, checkOut: string): string[] {
  const n = nightsBetween(checkIn, checkOut);
  if (n <= 0) return [];
  return nightDates(checkIn, n);
}

function activeNightDatesForVilla(
  reservations: AgencyVillaReservation[],
  villaId: string,
): Set<string> {
  const out = new Set<string>();
  for (const r of reservations) {
    if (r.villaId !== villaId || r.status !== 'active') continue;
    for (const d of agencyStayNightDates(r.checkIn, r.checkOut)) out.add(d);
  }
  return out;
}

function managedNightDatesForVilla(
  reservations: AgencyVillaReservation[],
  villaId: string,
): Set<string> {
  const out = new Set<string>();
  for (const r of reservations) {
    if (r.villaId !== villaId) continue;
    for (const d of agencyStayNightDates(r.checkIn, r.checkOut)) out.add(d);
  }
  return out;
}

/** Bu villadaki acenta kayıtlarına göre müsaitlik listesini günceller. */
export function resyncVillaAgencyCalendarBlocks(
  villa: AdminVilla,
  reservations: AgencyVillaReservation[],
): AdminVilla {
  const activeDates = activeNightDatesForVilla(reservations, villa.id);
  const managedDates = managedNightDatesForVilla(reservations, villa.id);

  let availability = villa.availability ?? [];

  const toRelease = [...managedDates].filter((d) => !activeDates.has(d));
  if (toRelease.length) {
    availability = removeAvailabilityDates(availability, toRelease);
  }

  if (activeDates.size > 0) {
    const incoming = [...activeDates].map((date) => ({ date, status: 'full' as const }));
    availability = mergeAvailabilityByDate(availability, incoming);
  }

  return { ...villa, availability };
}

/** Rezervasyon CRUD sonrası ilgili villaların takvimini günceller. */
export async function syncAgencyReservationsOnVillaCalendars(
  reservations: AgencyVillaReservation[],
  villaIds: string[],
): Promise<void> {
  const uniqueIds = [...new Set(villaIds.filter(Boolean))];
  if (!uniqueIds.length) return;

  const idSet = new Set(uniqueIds);
  const villas = await readVillas();
  let changed = false;
  const next = villas.map((v) => {
    if (!idSet.has(v.id)) return v;
    changed = true;
    return resyncVillaAgencyCalendarBlocks(v, reservations);
  });
  if (changed) await writeVillas(next);
}
