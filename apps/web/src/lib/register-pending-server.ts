import { createHash, randomInt, randomUUID } from 'node:crypto';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';

const DATA_PATH = appDataFile('register-pending.json');

export type RegisterPending = {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  kvkkConsent: boolean;
  smsConsent: boolean;
  codeHash: string;
  expiresAt: string;
  villaSlug?: string;
  checkIn?: string;
  checkOut?: string;
  guests?: number;
  createdAt: string;
};

export async function readRegisterPending(): Promise<RegisterPending[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('register-pending', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as RegisterPending[];
  } catch {
    return [];
  }
}

export async function writeRegisterPending(rows: RegisterPending[]): Promise<void> {
  await writeJsonStore('register-pending', rows, DATA_PATH);
}

export function hashOtpCode(pendingId: string, email: string, code: string): string {
  return createHash('sha256')
    .update(`${pendingId}:${email.toLowerCase()}:${code}:v1`)
    .digest('hex');
}

export function generateSixDigitCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, '0');
}

export async function upsertPending(row: RegisterPending): Promise<void> {
  const all = await readRegisterPending();
  const next = all.filter((p) => p.email.toLowerCase() !== row.email.toLowerCase());
  next.push(row);
  await writeRegisterPending(next);
}

export async function removePendingByEmail(email: string): Promise<void> {
  const e = email.toLowerCase();
  const all = await readRegisterPending();
  await writeRegisterPending(all.filter((p) => p.email.toLowerCase() !== e));
}

export async function findPendingByEmail(email: string): Promise<RegisterPending | null> {
  const e = email.toLowerCase();
  const all = await readRegisterPending();
  return all.find((p) => p.email.toLowerCase() === e) ?? null;
}

export async function pruneExpiredPending(): Promise<void> {
  const now = Date.now();
  const all = await readRegisterPending();
  const kept = all.filter((p) => new Date(p.expiresAt).getTime() > now);
  if (kept.length !== all.length) await writeRegisterPending(kept);
}
