import { NextResponse } from 'next/server';

import {
  canManageVilla,
  forbidden,
  requireAdminSession,
  unauthorized,
} from '@/lib/admin-api-auth';
import { normalizeVillaBody, validateVillaRequired } from '@/lib/admin-villa-normalize';
import { readVillas, writeVillas } from '@/lib/admin-villas-server';
import type { AdminVilla, AdminVillaInput } from '@/types/admin-villa';

const VILLA_ROLES = ['admin', 'alt_bayi'] as const;

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireAdminSession({ allowRoles: [...VILLA_ROLES] });
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readVillas();
  const villa = all.find((v) => v.id === id);
  if (!villa) return notFound();
  if (!canManageVilla(session, villa)) return forbidden();
  return NextResponse.json({ villa });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession({ allowRoles: [...VILLA_ROLES] });
  if (!session) return unauthorized();

  const { id } = await context.params;
  let body: Partial<AdminVillaInput>;
  try {
    body = (await request.json()) as Partial<AdminVillaInput>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const all = await readVillas();
  const idx = all.findIndex((v) => v.id === id);
  if (idx === -1) return notFound();

  const current = all[idx];
  if (!current) return notFound();
  if (!canManageVilla(session, current)) return forbidden();

  const normalized = normalizeVillaBody({ ...current, ...body });
  const err = validateVillaRequired(normalized);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  if (normalized.slug !== current.slug && all.some((v) => v.id !== id && v.slug === normalized.slug)) {
    return NextResponse.json({ error: 'Bu URL (slug) başka bir villada kullanılıyor.' }, { status: 400 });
  }

  const merged: AdminVilla = {
    ...current,
    ...normalized,
    id: current.id,
    createdByUserId: current.createdByUserId,
    createdByEmail: current.createdByEmail,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString(),
  };

  all[idx] = merged;
  await writeVillas(all);
  return NextResponse.json({ villa: merged });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession({ allowRoles: [...VILLA_ROLES] });
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readVillas();
  const current = all.find((v) => v.id === id);
  if (!current) return notFound();
  if (!canManageVilla(session, current)) return forbidden();

  const next = all.filter((v) => v.id !== id);
  await writeVillas(next);
  return NextResponse.json({ ok: true });
}
