import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type { AgencyVillaReservation } from '@/types/admin-agency-villa-reservation';

const DATA_PATH = appDataFile('agency-villa-reservations.json');

export async function readAgencyVillaReservations(): Promise<AgencyVillaReservation[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('agency-villa-reservations', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as AgencyVillaReservation[];
  } catch {
    return [];
  }
}

export async function writeAgencyVillaReservations(rows: AgencyVillaReservation[]): Promise<void> {
  await writeJsonStore('agency-villa-reservations', rows, DATA_PATH);
}
