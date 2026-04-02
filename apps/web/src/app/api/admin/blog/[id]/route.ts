import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { makeExcerptFromBody, readBlogPosts, writeBlogPosts } from '@/lib/blog-server';
import type { BlogPostInput } from '@/types/blog';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

type Ctx = { params: Promise<{ id: string }> };

export async function GET(_request: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const all = await readBlogPosts();
  const post = all.find((p) => p.id === id);
  if (!post) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
  return NextResponse.json({ post });
}

export async function PATCH(request: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const body = (await request.json()) as Partial<BlogPostInput> & { isActive?: boolean };

  const all = await readBlogPosts();
  const idx = all.findIndex((p) => p.id === id);
  if (idx === -1) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

  const cur = all[idx];
  const title = body.title !== undefined ? String(body.title).trim() : cur.title;
  const blogBody = body.body !== undefined ? String(body.body) : cur.body;
  const coverImageUrl =
    body.coverImageUrl !== undefined ? String(body.coverImageUrl).trim() : cur.coverImageUrl;
  const excerptExplicit =
    body.excerpt !== undefined ? String(body.excerpt).trim() : undefined;

  if (!title) return NextResponse.json({ error: 'Başlık zorunludur.' }, { status: 400 });
  if (!blogBody.trim()) return NextResponse.json({ error: 'Blog yazısı zorunludur.' }, { status: 400 });
  if (!coverImageUrl) return NextResponse.json({ error: 'Kapak resmi zorunludur.' }, { status: 400 });

  const excerpt =
    body.excerpt !== undefined || body.body !== undefined
      ? makeExcerptFromBody(blogBody, excerptExplicit)
      : cur.excerpt;

  const updated: typeof cur = {
    ...cur,
    title,
    body: blogBody,
    excerpt,
    coverImageUrl,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : cur.isActive,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = updated;
  await writeBlogPosts(all);

  return NextResponse.json({ post: updated });
}

export async function DELETE(_request: Request, ctx: Ctx) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  const all = await readBlogPosts();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });

  await writeBlogPosts(next);
  return NextResponse.json({ ok: true });
}
