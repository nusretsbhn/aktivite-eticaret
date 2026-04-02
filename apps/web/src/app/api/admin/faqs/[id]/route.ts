import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readFaqs, writeFaqs } from '@/lib/faq-server';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}
function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  let body: {
    question?: string;
    answer?: string;
    isActive?: boolean;
    sortOrder?: number;
  };
  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const all = await readFaqs();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return notFound();
  const current = all[idx];
  if (!current) return notFound();

  const merged = {
    ...current,
    question: body.question !== undefined ? String(body.question).trim() : current.question,
    answer: body.answer !== undefined ? String(body.answer).trim() : current.answer,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
    sortOrder: body.sortOrder !== undefined ? Number(body.sortOrder) || 0 : current.sortOrder,
    updatedAt: new Date().toISOString(),
  };
  if (!merged.question || !merged.answer) {
    return NextResponse.json({ error: 'Soru ve cevap zorunludur.' }, { status: 400 });
  }

  all[idx] = merged;
  await writeFaqs(all);
  return NextResponse.json({ faq: merged });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readFaqs();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return notFound();
  await writeFaqs(next);
  return NextResponse.json({ ok: true });
}

