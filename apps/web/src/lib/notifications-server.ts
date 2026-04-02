import { randomUUID } from 'node:crypto';
import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';
import type { AdminNotification, AdminNotificationType, UserNotification, UserNotificationType } from '@/types/notification';

const ADMIN_PATH = appDataFile('admin-notifications.json');
const USER_PATH = appDataFile('user-notifications.json');

export async function readAdminNotifications(): Promise<AdminNotification[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('admin-notifications', () => [], ADMIN_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as AdminNotification[];
  } catch {
    return [];
  }
}

export async function writeAdminNotifications(rows: AdminNotification[]): Promise<void> {
  await writeJsonStore('admin-notifications', rows, ADMIN_PATH);
}

export async function readUserNotifications(): Promise<UserNotification[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('user-notifications', () => [], USER_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as UserNotification[];
  } catch {
    return [];
  }
}

export async function writeUserNotifications(rows: UserNotification[]): Promise<void> {
  await writeJsonStore('user-notifications', rows, USER_PATH);
}

export async function appendAdminNotification(input: {
  type: AdminNotificationType;
  refId: string;
  title: string;
  message: string;
}): Promise<AdminNotification> {
  const rows = await readAdminNotifications();
  const now = new Date().toISOString();
  const n: AdminNotification = {
    id: randomUUID(),
    type: input.type,
    refId: input.refId,
    title: input.title,
    message: input.message,
    createdAt: now,
    readAt: null,
  };
  rows.unshift(n);
  await writeAdminNotifications(rows);
  return n;
}

export async function appendUserNotification(input: {
  userId: string;
  type: UserNotificationType;
  refId: string;
  title: string;
  message: string;
  link?: string;
}): Promise<UserNotification> {
  const rows = await readUserNotifications();
  const now = new Date().toISOString();
  const n: UserNotification = {
    id: randomUUID(),
    userId: input.userId,
    type: input.type,
    refId: input.refId,
    title: input.title,
    message: input.message,
    ...(input.link ? { link: input.link } : {}),
    createdAt: now,
    readAt: null,
  };
  rows.unshift(n);
  await writeUserNotifications(rows);
  return n;
}

export async function markAdminNotificationsRead(input: { ids?: string[]; markAll?: boolean }): Promise<number> {
  const rows = await readAdminNotifications();
  const ids = input.ids?.filter(Boolean) ?? [];
  let n = 0;
  const now = new Date().toISOString();
  const next = rows.map((r) => {
    if (r.readAt) return r;
    if (input.markAll) {
      n += 1;
      return { ...r, readAt: now };
    }
    if (ids.length && ids.includes(r.id)) {
      n += 1;
      return { ...r, readAt: now };
    }
    return r;
  });
  if (n > 0) await writeAdminNotifications(next);
  return n;
}

export async function markUserNotificationsRead(userId: string, input: { ids?: string[]; markAll?: boolean }): Promise<number> {
  const rows = await readUserNotifications();
  const ids = input.ids?.filter(Boolean) ?? [];
  let n = 0;
  const now = new Date().toISOString();
  const next = rows.map((r) => {
    if (r.userId !== userId) return r;
    if (r.readAt) return r;
    if (input.markAll) {
      n += 1;
      return { ...r, readAt: now };
    }
    if (ids.length && ids.includes(r.id)) {
      n += 1;
      return { ...r, readAt: now };
    }
    return r;
  });
  if (n > 0) await writeUserNotifications(next);
  return n;
}

export function countUnreadAdminByType(rows: AdminNotification[]) {
  let newOrder = 0;
  let cancelRequest = 0;
  for (const r of rows) {
    if (r.readAt) continue;
    if (r.type === 'new_order') newOrder += 1;
    else if (r.type === 'cancel_request') cancelRequest += 1;
  }
  return { newOrder, cancelRequest };
}
