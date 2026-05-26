import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { normalizeAgencyVillaReservationBody } from '@/lib/agency-villa-reservation-normalize';
import {
  readAgencyVillaReservations,
  writeAgencyVillaReservations,
} from '@/lib/agency-villa-reservations-server';
import { syncAgencyReservationsOnVillaCalendars } from '@/lib/agency-villa-reservation-calendar';
import { readVillas } from '@/lib/admin-villas-server';
import type { AgencyVillaReservation } from '@/types/admin-agency-villa-reservation';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const villaId = (searchParams.get('villaId') ?? '').trim();
  const status = (searchParams.get('status') ?? '').trim();

  let list = await readAgencyVillaReservations();
  list = list.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));

  if (villaId) list = list.filter((r) => r.villaId === villaId);
  if (status === 'active' || status === 'passive' || status === 'cancelled') {
    list = list.filter((r) => r.status === status);
  }
  if (q) {
    list = list.filter((r) =>
      `${r.agencyName} ${r.fullName} ${r.phone} ${r.email} ${r.note}`.toLowerCase().includes(q),
    );
  }

  return NextResponse.json({ reservations: list });
}

export async function POST(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const { data, error } = normalizeAgencyVillaReservationBody(body);
  if (error) return NextResponse.json({ error }, { status: 400 });

  const villas = await readVillas();
  if (!villas.some((v) => v.id === data.villaId)) {
    return NextResponse.json({ error: 'Seçilen villa bulunamadı.' }, { status: 400 });
  }

  const all = await readAgencyVillaReservations();
  const now = new Date().toISOString();
  const created: AgencyVillaReservation = {
    id: randomUUID(),
    ...data,
    createdAt: now,
    updatedAt: now,
  };
  all.unshift(created);
  await writeAgencyVillaReservations(all);
  await syncAgencyReservationsOnVillaCalendars(all, [created.villaId]);
  return NextResponse.json({ reservation: created }, { status: 201 });
}
