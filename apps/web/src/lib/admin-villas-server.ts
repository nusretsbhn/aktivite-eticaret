import { join } from 'node:path';

import { normalizeGalleryPayload, normalizePricesPayload } from '@/lib/admin-villa-normalize';
import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { AdminVilla } from '@/types/admin-villa';

const DATA_PATH = join(process.cwd(), 'data', 'admin-villas.json');

export async function readVillas(): Promise<AdminVilla[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-villas', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as AdminVilla[]).map((v) => ({
      ...v,
      tagIds: Array.isArray((v as any).tagIds) ? ((v as any).tagIds as string[]) : [],
      gallery: normalizeGalleryPayload((v as { gallery?: unknown }).gallery),
      prices: normalizePricesPayload((v as { prices?: unknown }).prices),
      availability: normalizeAvailabilityPayload((v as { availability?: unknown }).availability),
    }));
  } catch {
    return [];
  }
}

export async function writeVillas(villas: AdminVilla[]): Promise<void> {
  await writeJsonStore('admin-villas', villas, DATA_PATH);
}
