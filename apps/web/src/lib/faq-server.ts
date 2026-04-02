import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { FaqItem } from '@/types/faq';

const DATA_PATH = join(process.cwd(), 'data', 'faqs.json');

export async function readFaqs(): Promise<FaqItem[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('faqs', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<FaqItem>[])
      .map((f, idx) => ({
        id: String(f.id ?? ''),
        question: String(f.question ?? ''),
        answer: String(f.answer ?? ''),
        isActive: f.isActive === undefined ? true : Boolean(f.isActive),
        sortOrder: typeof f.sortOrder === 'number' ? f.sortOrder : idx,
        createdAt: String(f.createdAt ?? ''),
        updatedAt: String(f.updatedAt ?? ''),
      }))
      .filter((f) => !!f.id && !!f.question);
  } catch {
    return [];
  }
}

export async function writeFaqs(items: FaqItem[]): Promise<void> {
  await writeJsonStore('faqs', items, DATA_PATH);
}

