import { NextResponse } from 'next/server';

import {
  normalizePackageTourActivityInput,
  readPackageTourActivities,
  writePackageTourActivities,
} from '@/lib/admin-package-tour-activities-server';
import { requireAdminSession } from '@/lib/admin-api-auth';
import type { AdminPackageTourActivityInput } from '@/types/admin-package-tour-activity';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;
  const all = await readPackageTourActivities();
  const activity = all.find((a) => a.id === id);
  if (!activity) return notFound();
  return NextResponse.json({ activity });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;

  let body: Partial<AdminPackageTourActivityInput>;
  try {
    body = (await request.json()) as Partial<AdminPackageTourActivityInput>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const all = await readPackageTourActivities();
  const idx = all.findIndex((a) => a.id === id);
  if (idx < 0) return notFound();
  const current = all[idx];
  if (!current) return notFound();

  const mergedInput = {
    ...current,
    ...body,
    gallery: body.gallery ?? current.gallery,
    prices: body.prices ?? current.prices,
  };
  const normalized = normalizePackageTourActivityInput(mergedInput);
  if (!normalized.name || !normalized.location || !normalized.category) {
    return NextResponse.json({ error: 'Aktivite adı, konum ve kategori zorunludur.' }, { status: 400 });
  }

  const updated = {
    ...current,
    ...normalized,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writePackageTourActivities(all);
  return NextResponse.json({ activity: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;

  const all = await readPackageTourActivities();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return notFound();
  await writePackageTourActivities(next);
  return NextResponse.json({ ok: true });
}

