import { randomUUID } from 'node:crypto';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';

const DATA_PATH = appDataFile('package-tour-requests.json');

export type PackageTourRequestStatus = 'NEW' | 'PROCESSED';

export type PackageTourRequestRecord = {
  id: string;
  status: PackageTourRequestStatus;
  createdAt: string;
  updatedAt: string;
  customerName: string;
  phone: string;
  kvkkApproved: boolean;
  commercialApproved: boolean;
  packageTourId: string;
  packageTourName: string;
  conceptName: string;
  checkIn: string;
  checkOut: string;
  nights: number;
  adults: number;
  children: number;
  infants: number;
  packageTotal: number;
  extraTotal: number;
  grandTotal: number;
  extras: Array<{
    activityId: string;
    activityName: string;
    adults: number;
    children: number;
    infants: number;
    total: number;
  }>;
};

export async function readPackageTourRequests(): Promise<PackageTourRequestRecord[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('package-tour-requests', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as PackageTourRequestRecord[];
  } catch {
    return [];
  }
}

export async function writePackageTourRequests(items: PackageTourRequestRecord[]): Promise<void> {
  await writeJsonStore('package-tour-requests', items, DATA_PATH);
}

export async function appendPackageTourRequest(
  input: Omit<PackageTourRequestRecord, 'id' | 'status' | 'createdAt' | 'updatedAt'>,
): Promise<PackageTourRequestRecord> {
  const all = await readPackageTourRequests();
  const now = new Date().toISOString();
  const rec: PackageTourRequestRecord = {
    id: randomUUID(),
    status: 'NEW',
    createdAt: now,
    updatedAt: now,
    ...input,
  };
  all.unshift(rec);
  await writePackageTourRequests(all);
  return rec;
}

