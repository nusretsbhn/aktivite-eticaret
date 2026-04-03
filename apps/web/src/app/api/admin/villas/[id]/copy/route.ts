import { randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { normalizeVillaBody, validateVillaRequired } from '@/lib/admin-villa-normalize';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { AdminVilla, AdminVillaInput } from '@/types/admin-villa';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

function uniqueSlug(existing: AdminVilla[], base: string): string {
  let slug = base;
  let n = 1;
  while (existing.some((v) => v.slug === slug)) {
    n += 1;
    slug = `${base}-${n}`;
  }
  return slug;
}

export async function POST(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readVillas();
  const current = all.find((v) => v.id === id);
  if (!current) return notFound();

  const baseSlug = `${current.slug}-kopya`;
  const slug = uniqueSlug(all, baseSlug);

  const { id: _oldId, createdAt: _oldCreatedAt, updatedAt: _oldUpdatedAt, ...rest } = current;
  const input: AdminVillaInput = {
    ...rest,
    displayName: `${current.displayName} (Kopya)`,
    slug,
    // Kopyalanan villa boş (resim + takvim yok) geleceği için varsayılan pasif bırakıyoruz.
    isActive: false,
    gallery: [],
    prices: [],
    availability: [],
  };

  const normalized = normalizeVillaBody(input);
  const err = validateVillaRequired(normalized);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  if (all.some((v) => v.slug === normalized.slug)) {
    // Nadir de olsa slug çakışması olabilir; tekrar deniyoruz.
    normalized.slug = uniqueSlug(all, `${normalized.slug}-kopya`);
  }

  const now = new Date().toISOString();
  const created: AdminVilla = {
    id: randomUUID(),
    ...normalized,
    createdAt: now,
    updatedAt: now,
  };

  all.push(created);
  await writeVillas(all);

  return NextResponse.json({ villa: created }, { status: 201 });
}

