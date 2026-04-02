import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readFaqs, writeFaqs } from '@/lib/faq-server';
import type { FaqItem } from '@/types/faq';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const isActiveParam = (searchParams.get('isActive') ?? '').trim();

  let faqs = await readFaqs();
  faqs = faqs.slice().sort((a, b) => a.sortOrder - b.sortOrder || b.createdAt.localeCompare(a.createdAt));

  if (q) {
    faqs = faqs.filter((f) => `${f.question} ${f.answer}`.toLowerCase().includes(q));
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const want = isActiveParam === 'true';
    faqs = faqs.filter((f) => f.isActive === want);
  }

  return NextResponse.json({ faqs });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: Partial<FaqItem>;
  try {
    body = (await request.json()) as Partial<FaqItem>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const question = String(body.question ?? '').trim();
  const answer = String(body.answer ?? '').trim();
  if (!question || !answer) {
    return NextResponse.json({ error: 'Soru ve cevap zorunludur.' }, { status: 400 });
  }

  const all = await readFaqs();
  const maxSort = all.reduce((m, x) => Math.max(m, x.sortOrder), -1);
  const now = new Date().toISOString();
  const created: FaqItem = {
    id: randomUUID(),
    question,
    answer,
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
    sortOrder: typeof body.sortOrder === 'number' ? body.sortOrder : maxSort + 1,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await writeFaqs(all);
  return NextResponse.json({ faq: created }, { status: 201 });
}

