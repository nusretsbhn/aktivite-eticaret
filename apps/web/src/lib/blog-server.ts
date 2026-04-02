import { join } from 'node:path';

import { readJsonStore, writeJsonStore } from '@/lib/db-json-store';
import type { BlogPost } from '@/types/blog';

const DATA_PATH = join(process.cwd(), 'data', 'blog-posts.json');

export async function readBlogPosts(): Promise<BlogPost[]> {
  try {
    const parsed = await readJsonStore<unknown[]>('blog-posts', () => [], DATA_PATH);
    if (!Array.isArray(parsed)) return [];
    return (parsed as Partial<BlogPost>[]).map((p) => ({
      id: String(p.id ?? ''),
      slug: String(p.slug ?? ''),
      title: String(p.title ?? ''),
      excerpt: String(p.excerpt ?? ''),
      body: String(p.body ?? ''),
      coverImageUrl: String(p.coverImageUrl ?? ''),
      isActive: Boolean(p.isActive),
      createdAt: String(p.createdAt ?? ''),
      updatedAt: String(p.updatedAt ?? ''),
    }));
  } catch {
    return [];
  }
}

export async function writeBlogPosts(items: BlogPost[]): Promise<void> {
  await writeJsonStore('blog-posts', items, DATA_PATH);
}

export function makeExcerptFromBody(body: string, explicit?: string): string {
  const ex = String(explicit ?? '').trim();
  if (ex) return ex.length > 280 ? `${ex.slice(0, 277)}...` : ex;
  const plain = body.replace(/\s+/g, ' ').trim();
  if (!plain) return '';
  return plain.length > 160 ? `${plain.slice(0, 157)}...` : plain;
}
