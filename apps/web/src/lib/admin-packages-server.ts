import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { AdminPackage } from '@/types/admin-package';

const DATA_PATH = join(process.cwd(), 'data', 'admin-packages.json');

export async function readPackages(): Promise<AdminPackage[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-packages', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<AdminPackage>[]).map((p) => ({
      id: String(p.id ?? ''),
      packageId: String(p.packageId ?? ''),
      name: String(p.name ?? ''),
      description: String(p.description ?? ''),
      activityIds: Array.isArray(p.activityIds) ? p.activityIds.map(String) : [],
      coverImageUrl: String(p.coverImageUrl ?? ''),
      isActive: Boolean(p.isActive),
      createdAt: String(p.createdAt ?? ''),
      updatedAt: String(p.updatedAt ?? ''),
    }));
  } catch {
    return [];
  }
}

export async function writePackages(items: AdminPackage[]): Promise<void> {
  await writeJsonStore('admin-packages', items, DATA_PATH);
}

