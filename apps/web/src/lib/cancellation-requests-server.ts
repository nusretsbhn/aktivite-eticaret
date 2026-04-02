import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { CancellationRequest } from '@/types/cancellation-request';

const DATA_PATH = join(process.cwd(), 'data', 'cancellation-requests.json');

export async function readCancellationRequests(): Promise<CancellationRequest[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('cancellation-requests', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as CancellationRequest[];
  } catch {
    return [];
  }
}

export async function writeCancellationRequests(rows: CancellationRequest[]): Promise<void> {
  await writeJsonStore('cancellation-requests', rows, DATA_PATH);
}
