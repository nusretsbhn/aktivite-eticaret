import { randomUUID } from 'node:crypto';
import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';

const DATA_PATH = join(process.cwd(), 'data', 'villa-requests.json');

/** Ön rezervasyon formundan gelen ek alanlar */
export type VillaPreReservationFormDetails = {
  adults: number;
  children: number;
  babies: number;
  accommodationType: 'family' | 'friends';
  billingAddress: string;
  paymentPreference: 'full' | 'prepayment';
  referralSource: string;
  phoneCountryCode: string;
  foreignPhone: boolean;
  notTurkishCitizen: boolean;
  additionalGuests: { firstName: string; lastName: string }[];
  legalIdentityCommitment: boolean;
  distanceSalesAccepted: boolean;
  preInfoAccepted: boolean;
};

export type VillaRequestRecord = {
  id: string;
  userId: string;
  userEmail: string;
  userName: string;
  phone: string;
  villaSlug: string;
  villaDisplayName?: string;
  checkIn: string;
  checkOut: string;
  guests: number;
  /** Ön rezervasyon formu (v2) */
  formDetails?: VillaPreReservationFormDetails;
  isRead: boolean;
  createdAt: string;
};

export async function readVillaRequests(): Promise<VillaRequestRecord[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('villa-requests', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as VillaRequestRecord[];
  } catch {
    return [];
  }
}

export async function writeVillaRequests(rows: VillaRequestRecord[]): Promise<void> {
  await writeJsonStore('villa-requests', rows, DATA_PATH);
}

export async function appendVillaRequest(row: Omit<VillaRequestRecord, 'id' | 'createdAt' | 'isRead'> & { id?: string }): Promise<VillaRequestRecord> {
  const all = await readVillaRequests();
  const rec: VillaRequestRecord = {
    id: row.id ?? randomUUID(),
    userId: row.userId,
    userEmail: row.userEmail,
    userName: row.userName,
    phone: row.phone,
    villaSlug: row.villaSlug,
    villaDisplayName: row.villaDisplayName,
    checkIn: row.checkIn,
    checkOut: row.checkOut,
    guests: row.guests,
    formDetails: row.formDetails,
    isRead: false,
    createdAt: new Date().toISOString(),
  };
  all.unshift(rec);
  await writeVillaRequests(all);
  return rec;
}

export async function updateVillaRequestRead(id: string, isRead: boolean): Promise<VillaRequestRecord | null> {
  const all = await readVillaRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return null;
  all[idx] = { ...all[idx], isRead };
  await writeVillaRequests(all);
  return all[idx];
}
