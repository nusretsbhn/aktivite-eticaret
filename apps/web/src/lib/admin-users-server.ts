import { randomUUID } from 'node:crypto';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import { hashPassword, validatePasswordPolicy, verifyPassword } from '@/lib/public-users-server';

const DATA_PATH = appDataFile('admin-users.json');

export type AdminUser = {
  id: string;
  fullName: string;
  email: string;
  passwordHash: string;
  passwordSalt: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
};

export async function readAdminUsers(): Promise<AdminUser[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-users', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as AdminUser[];
  } catch {
    return [];
  }
}

export async function writeAdminUsers(users: AdminUser[]): Promise<void> {
  await writeJsonStore('admin-users', users, DATA_PATH);
}

export async function findAdminUserByCredentials(emailRaw: string, password: string): Promise<AdminUser | null> {
  const email = emailRaw.trim().toLowerCase();
  if (!email || !password) return null;
  const users = await readAdminUsers();
  const user = users.find((u) => u.email === email && u.isActive);
  if (!user) return null;
  if (!verifyPassword(password, user.passwordHash, user.passwordSalt)) return null;
  return user;
}

export async function createAdminUser(input: {
  fullName: string;
  email: string;
  password: string;
}): Promise<{ user?: AdminUser; error?: string; status?: number }> {
  const fullName = input.fullName.trim();
  const email = input.email.trim().toLowerCase();
  const password = input.password;

  if (!fullName || !email || !password) {
    return { error: 'Ad soyad, e-posta ve şifre zorunludur.', status: 400 };
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return { error: 'Geçerli e-posta girin.', status: 400 };
  }
  const pwdErr = validatePasswordPolicy(password);
  if (pwdErr) return { error: pwdErr, status: 400 };

  const all = await readAdminUsers();
  if (all.some((u) => u.email === email)) {
    return { error: 'Bu e-posta zaten admin kullanıcıda kayıtlı.', status: 409 };
  }

  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(password);
  const user: AdminUser = {
    id: randomUUID(),
    fullName,
    email,
    passwordHash: hash,
    passwordSalt: salt,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  };
  await writeAdminUsers([user, ...all]);
  return { user };
}
