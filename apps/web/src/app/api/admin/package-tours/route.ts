import { randomBytes, randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readPackageTours, writePackageTours } from '@/lib/admin-package-tours-server';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { GalleryItem } from '@/types/admin-activity';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const packageTours = await readPackageTours();
  packageTours.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
  return NextResponse.json({ packageTours });
}

function generatePackageTourId(existing: Set<string>): string {
  for (let i = 0; i < 20; i += 1) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const r = randomBytes(3).toString('hex').toUpperCase();
    const id = `PT-${y}${m}${day}-${r}`;
    if (!existing.has(id)) return id;
  }
  let id = `PT-${randomUUID().slice(0, 8).toUpperCase()}`;
  while (existing.has(id)) id = `PT-${randomUUID().slice(0, 8).toUpperCase()}`;
  return id;
}

function normalizePayload(body: Record<string, unknown>) {
  return {
    packageName: String(body.packageName ?? '').trim(),
    conceptName: String(body.conceptName ?? '').trim(),
    description: String(body.description ?? '').trim(),
    nightCount: Math.max(1, Number(body.nightCount) || 1),
    dayCount: Math.max(1, Number(body.dayCount) || 1),
    includedServiceIds: Array.isArray(body.includedServiceIds) ? body.includedServiceIds.map(String) : [],
    paidServiceIds: Array.isArray(body.paidServiceIds) ? body.paidServiceIds.map(String) : [],
    activityIds: Array.isArray(body.activityIds) ? body.activityIds.map(String) : [],
    gallery: Array.isArray(body.gallery) ? (body.gallery as GalleryItem[]) : [],
    coverImageUrl: String(body.coverImageUrl ?? '').trim(),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
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
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz payload' }, { status: 400 });
  }
  const input = normalizePayload(body as Record<string, unknown>);
  if (!input.packageName || !input.conceptName) {
    return NextResponse.json({ error: 'Paket adı ve konsept adı zorunludur.' }, { status: 400 });
  }

  const all = await readPackageTours();
  const now = new Date().toISOString();
  const created: AdminPackageTour = {
    id: randomUUID(),
    packageTourId: generatePackageTourId(new Set(all.map((x) => x.packageTourId))),
    packageName: input.packageName,
    conceptName: input.conceptName,
    description: input.description,
    nightCount: input.nightCount,
    dayCount: input.dayCount,
    includedServiceIds: [...new Set(input.includedServiceIds)],
    paidServiceIds: [...new Set(input.paidServiceIds)],
    activityIds: [...new Set(input.activityIds)],
    gallery: input.gallery,
    priceRules: [],
    coverImageUrl: input.coverImageUrl || input.gallery.find((g) => g.isCover)?.url || input.gallery[0]?.url || '',
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await writePackageTours(all);
  return NextResponse.json({ packageTour: created }, { status: 201 });
}

