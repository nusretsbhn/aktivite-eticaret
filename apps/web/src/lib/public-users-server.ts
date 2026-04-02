import { randomBytes, scryptSync, timingSafeEqual } from 'node:crypto';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';

const DATA_PATH = appDataFile('public-users.json');

export type PublicUser = {
  id: string;
  fullName: string;
  email: string;
  phone: string;
  passwordHash: string;
  passwordSalt: string;
  kvkkConsent: boolean;
  smsConsent: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function readPublicUsers(): Promise<PublicUser[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('public-users', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as PublicUser[];
  } catch {
    return [];
  }
}

export async function writePublicUsers(users: PublicUser[]): Promise<void> {
  await writeJsonStore('public-users', users, DATA_PATH);
}

export function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const s = salt ?? randomBytes(16).toString('hex');
  const derived = scryptSync(password, s, 64).toString('hex');
  return { hash: derived, salt: s };
}

export function verifyPassword(password: string, hash: string, salt: string): boolean {
  const derived = scryptSync(password, salt, 64);
  const existing = Buffer.from(hash, 'hex');
  if (derived.length !== existing.length) return false;
  return timingSafeEqual(derived, existing);
}

export function validatePasswordPolicy(password: string): string | null {
  if (password.length < 8) return 'Şifre en az 8 karakter olmalı.';
  if (!/[A-Z]/.test(password)) return 'Şifre en az bir büyük harf içermeli.';
  if (!/[a-z]/.test(password)) return 'Şifre en az bir küçük harf içermeli.';
  if (!/[0-9]/.test(password)) return 'Şifre en az bir rakam içermeli.';
  if (!/[^A-Za-z0-9]/.test(password)) return 'Şifre en az bir özel karakter içermeli.';
  return null;
}

