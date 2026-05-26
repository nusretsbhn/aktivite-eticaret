import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { normalizeAgencyVillaReservationBody } from '@/lib/agency-villa-reservation-normalize';
import {
  readAgencyVillaReservations,
  writeAgencyVillaReservations,
} from '@/lib/agency-villa-reservations-server';
import { syncAgencyReservationsOnVillaCalendars } from '@/lib/agency-villa-reservation-calendar';
import { readVillas } from '@/lib/admin-villas-server';

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
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const all = await readAgencyVillaReservations();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return notFound();
  const current = all[idx];
  if (!current) return notFound();

  const { data, error } = normalizeAgencyVillaReservationBody(body, current);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const villas = await readVillas();
  if (!villas.some((v) => v.id === data.villaId)) {
    return NextResponse.json({ error: 'Seçilen villa bulunamadı.' }, { status: 400 });
  }

  const updated = {
    ...current,
    ...data,
    updatedAt: new Date().toISOString(),
  };
  all[idx] = updated;
  await writeAgencyVillaReservations(all);
  const villaIds =
    current.villaId === updated.villaId ? [updated.villaId] : [current.villaId, updated.villaId];
  await syncAgencyReservationsOnVillaCalendars(all, villaIds);
  return NextResponse.json({ reservation: updated });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readAgencyVillaReservations();
  const removed = all.find((x) => x.id === id);
  if (!removed) return notFound();
  const next = all.filter((x) => x.id !== id);
  await writeAgencyVillaReservations(next);
  await syncAgencyReservationsOnVillaCalendars(next, [removed.villaId]);
  return NextResponse.json({ ok: true });
}
