import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readActivities } from '@/lib/admin-activities-server';
import { readPackages, writePackages } from '@/lib/admin-packages-server';
import type { AdminPackageInput } from '@/types/admin-package';

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
  const all = await readPackages();
  const item = all.find((p) => p.id === id);
  if (!item) return notFound();
  return NextResponse.json({ package: item });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;

  let body: Partial<AdminPackageInput>;
  try {
    body = (await request.json()) as Partial<AdminPackageInput>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const all = await readPackages();
  const idx = all.findIndex((p) => p.id === id);
  if (idx < 0) return notFound();
  const current = all[idx];
  if (!current) return notFound();

  const acts = await readActivities();
  const validIds = new Set(acts.map((a) => a.id));
  const nextActivityIds =
    body.activityIds !== undefined && Array.isArray(body.activityIds)
      ? body.activityIds.map(String)
      : current.activityIds;
  if (!nextActivityIds.length) {
    return NextResponse.json({ error: 'En az bir aktivite seçmelisiniz.' }, { status: 400 });
  }
  if (nextActivityIds.some((x) => !validIds.has(x))) {
    return NextResponse.json({ error: 'Seçilen aktivitelerden bazıları geçersiz.' }, { status: 400 });
  }

  const merged = {
    ...current,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    description: body.description !== undefined ? String(body.description).trim() : current.description,
    activityIds: [...new Set(nextActivityIds)],
    coverImageUrl: body.coverImageUrl !== undefined ? String(body.coverImageUrl).trim() : current.coverImageUrl,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
    updatedAt: new Date().toISOString(),
  };
  if (!merged.name) {
    return NextResponse.json({ error: 'Paket adı zorunludur.' }, { status: 400 });
  }

  all[idx] = merged;
  await writePackages(all);
  return NextResponse.json({ package: merged });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;
  const all = await readPackages();
  const next = all.filter((p) => p.id !== id);
  if (next.length === all.length) return notFound();
  await writePackages(next);
  return NextResponse.json({ ok: true });
}

