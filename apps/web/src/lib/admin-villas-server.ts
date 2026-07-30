import { normalizeGalleryPayload, normalizePricesPayload } from '@/lib/admin-villa-normalize';
import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type { AdminVilla } from '@/types/admin-villa';

const DATA_PATH = appDataFile('admin-villas.json');

export async function readVillas(): Promise<AdminVilla[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-villas', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as AdminVilla[]).map((v) => {
      const raw = v as AdminVilla & { createdByUserId?: unknown; createdByEmail?: unknown };
      const createdByUserId = String(raw.createdByUserId ?? '').trim();
      const createdByEmail = String(raw.createdByEmail ?? '').trim().toLowerCase();
      return {
        ...v,
        tagIds: Array.isArray((v as { tagIds?: unknown }).tagIds)
          ? ((v as { tagIds: string[] }).tagIds as string[])
          : [],
        gallery: normalizeGalleryPayload((v as { gallery?: unknown }).gallery),
        prices: normalizePricesPayload((v as { prices?: unknown }).prices),
        availability: normalizeAvailabilityPayload((v as { availability?: unknown }).availability),
        ...(createdByUserId ? { createdByUserId } : {}),
        ...(createdByEmail ? { createdByEmail } : {}),
      };
    });
  } catch {
    return [];
  }
}

export async function writeVillas(villas: AdminVilla[]): Promise<void> {
  await writeJsonStore('admin-villas', villas, DATA_PATH);
}
