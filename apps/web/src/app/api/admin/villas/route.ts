import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { normalizeVillaBody, validateVillaRequired } from '@/lib/admin-villa-normalize';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { AdminVilla, AdminVillaInput } from '@/types/admin-villa';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const isActiveParam = searchParams.get('isActive');

  let list = await readVillas();

  if (q) {
    list = list.filter(
      (v) =>
        v.displayName.toLowerCase().includes(q) ||
        v.legalName.toLowerCase().includes(q) ||
        v.slug.toLowerCase().includes(q) ||
        v.documentNo.toLowerCase().includes(q) ||
        v.description.toLowerCase().includes(q) ||
        v.city.toLowerCase().includes(q) ||
        v.district.toLowerCase().includes(q),
    );
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const want = isActiveParam === 'true';
    list = list.filter((v) => v.isActive === want);
  }

  const total = list.length;
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '20');
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 20));
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const requestedPage = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = total === 0 ? 1 : Math.min(requestedPage, Math.max(1, totalPages));
  const start = (page - 1) * pageSize;
  const villas = list.slice(start, start + pageSize);

  return NextResponse.json({ villas, total, page, pageSize, totalPages });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const input = normalizeVillaBody(body as Partial<AdminVillaInput>);
  const err = validateVillaRequired(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const all = await readVillas();
  if (all.some((v) => v.slug === input.slug)) {
    return NextResponse.json({ error: 'Bu URL (slug) başka bir villada kullanılıyor.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const created: AdminVilla = {
    id: randomUUID(),
    ...input,
    createdAt: now,
    updatedAt: now,
  };

  all.push(created);
  await writeVillas(all);
  return NextResponse.json({ villa: created }, { status: 201 });
}
