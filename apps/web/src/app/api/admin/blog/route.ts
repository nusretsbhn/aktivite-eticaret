import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { makeExcerptFromBody, readBlogPosts, writeBlogPosts } from '@/lib/blog-server';
import { slugifyTr, uniqueSlug } from '@/lib/blog-slug';
import type { BlogPost, BlogPostInput } from '@/types/blog';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function normalize(input: Partial<BlogPostInput>): BlogPostInput {
  return {
    title: String(input.title ?? '').trim(),
    body: String(input.body ?? ''),
    excerpt: input.excerpt !== undefined ? String(input.excerpt).trim() : undefined,
    coverImageUrl: String(input.coverImageUrl ?? '').trim(),
    isActive: input.isActive === undefined ? true : Boolean(input.isActive),
  };
}

function validate(input: BlogPostInput): string | null {
  if (!input.title) return 'Başlık zorunludur.';
  if (!input.body.trim()) return 'Blog yazısı zorunludur.';
  if (!input.coverImageUrl) return 'Kapak resmi zorunludur.';
  return null;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const isActiveParam = (searchParams.get('isActive') ?? '').trim();
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '25');
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 25));
  const requestedPage = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);

  const all = await readBlogPosts();
  let list = all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) {
    list = list.filter((p) => {
      const hay = `${p.title} ${p.excerpt} ${p.body} ${p.slug}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const v = isActiveParam === 'true';
    list = list.filter((p) => p.isActive === v);
  }

  const total = list.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = total === 0 ? 1 : Math.min(requestedPage, Math.max(1, totalPages));
  const start = (page - 1) * pageSize;
  const posts = list.slice(start, start + pageSize);

  return NextResponse.json({ posts, total, page, pageSize, totalPages });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const body = (await request.json()) as Partial<BlogPostInput>;
  const input = normalize(body);
  const err = validate(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const all = await readBlogPosts();
  const existingSlugs = new Set(all.map((p) => p.slug));
  const base = slugifyTr(input.title);
  const slug = uniqueSlug(base, existingSlugs);

  const now = new Date().toISOString();
  const excerpt = makeExcerptFromBody(input.body, input.excerpt);

  const post: BlogPost = {
    id: randomUUID(),
    slug,
    title: input.title,
    excerpt,
    body: input.body,
    coverImageUrl: input.coverImageUrl,
    isActive: input.isActive ?? true,
    createdAt: now,
    updatedAt: now,
  };

  all.push(post);
  await writeBlogPosts(all);

  return NextResponse.json({ post });
}
