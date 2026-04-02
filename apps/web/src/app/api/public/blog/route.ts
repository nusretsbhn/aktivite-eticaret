import { NextResponse } from 'next/server';

import { readBlogPosts } from '@/lib/blog-server';

export type PublicBlogSort = 'newest' | 'oldest' | 'title';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const sort = (searchParams.get('sort') ?? 'newest') as PublicBlogSort;
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '12');
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const pageSize = Math.min(48, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 12));
  const requestedPage = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);

  const all = await readBlogPosts();
  let list = all.filter((p) => p.isActive);

  if (q) {
    list = list.filter((p) => {
      const hay = `${p.title} ${p.excerpt} ${p.body}`.toLowerCase();
      return hay.includes(q);
    });
  }

  if (sort === 'oldest') {
    list = list.slice().sort((a, b) => a.createdAt.localeCompare(b.createdAt));
  } else if (sort === 'title') {
    list = list.slice().sort((a, b) => a.title.localeCompare(b.title, 'tr'));
  } else {
    list = list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  const total = list.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = total === 0 ? 1 : Math.min(requestedPage, Math.max(1, totalPages));
  const start = (page - 1) * pageSize;
  const posts = list.slice(start, start + pageSize).map((p) => ({
    id: p.id,
    slug: p.slug,
    title: p.title,
    excerpt: p.excerpt,
    coverImageUrl: p.coverImageUrl,
    createdAt: p.createdAt,
  }));

  return NextResponse.json({ posts, total, page, pageSize, totalPages });
}
