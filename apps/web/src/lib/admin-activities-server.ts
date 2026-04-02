import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type { AdminActivity } from '@/types/admin-activity';

const DATA_PATH = appDataFile('admin-activities.json');

export async function readActivities(): Promise<AdminActivity[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-activities', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (
      parsed as (AdminActivity & {
        subCategory?: string;
        occupancyPercent?: number;
        location?: string;
        prepaymentPercent?: number;
        boatType?: 'family' | 'standard';
        askSell?: boolean;
      })[]
    ).map((a) => ({
      ...a,
      companyName: typeof a.companyName === 'string' ? a.companyName : '',
      documentNo: typeof a.documentNo === 'string' ? a.documentNo : '',
      authorizedFullName: typeof a.authorizedFullName === 'string' ? a.authorizedFullName : '',
      authorizedPhone: typeof a.authorizedPhone === 'string' ? a.authorizedPhone : '',
      subCategoryIds: Array.isArray(a.subCategoryIds)
        ? a.subCategoryIds.map(String)
        : a.subCategory
          ? [String(a.subCategory)]
          : [],
      location: typeof a.location === 'string' ? a.location : '',
      capacity:
        typeof a.capacity === 'number'
          ? a.capacity
          : typeof a.occupancyPercent === 'number'
            ? a.occupancyPercent
            : 0,
      prepaymentPercent:
        typeof a.prepaymentPercent === 'number'
          ? Math.min(100, Math.max(1, Math.round(a.prepaymentPercent)))
          : 100,
      boatType: a.boatType === 'family' ? 'family' : 'standard',
      askSell: Boolean(a.askSell),
      tagIds: Array.isArray(a.tagIds) ? a.tagIds.map(String) : [],
      availability: normalizeAvailabilityPayload((a as { availability?: unknown }).availability),
    }));
  } catch {
    return [];
  }
}

export async function writeActivities(activities: AdminActivity[]): Promise<void> {
  await writeJsonStore('admin-activities', activities, DATA_PATH);
}
