import { randomUUID } from 'node:crypto';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import { appDataFile } from '@/lib/next-public-dir';

const DATA_PATH = appDataFile('contact-messages.json');

export type ContactMessageRecord = {
  id: string;
  createdAt: string;
  fullName: string;
  phone: string;
  subject: string;
  message: string;
};

export async function readContactMessages(): Promise<ContactMessageRecord[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('contact-messages', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return parsed as ContactMessageRecord[];
  } catch {
    return [];
  }
}

export async function appendContactMessage(
  input: Omit<ContactMessageRecord, 'id' | 'createdAt'>,
): Promise<ContactMessageRecord> {
  const all = await readContactMessages();
  const rec: ContactMessageRecord = {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    ...input,
  };
  all.unshift(rec);
  await writeJsonStore('contact-messages', all, DATA_PATH);
  return rec;
}
