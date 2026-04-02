import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readActivities, writeActivities } from '@/lib/admin-activities-server';
import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import type { AdminActivity, AdminActivityInput } from '@/types/admin-activity';

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
  const all = await readActivities();
  const activity = all.find((a) => a.id === id);
  if (!activity) return notFound();
  return NextResponse.json({ activity });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  let body: Partial<AdminActivityInput> & { id?: string };
  try {
    body = (await request.json()) as Partial<AdminActivityInput> & { id?: string };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const legacyOccupancy = (body as { occupancyPercent?: number }).occupancyPercent;

  const all = await readActivities();
  const idx = all.findIndex((a) => a.id === id);
  if (idx === -1) return notFound();

  const current = all[idx];
  if (!current) return notFound();

  const merged: AdminActivity = {
    ...current,
    activityId: current.activityId,
    name: body.name !== undefined ? String(body.name).trim() : current.name,
    companyName:
      (body as { companyName?: string }).companyName !== undefined
        ? String((body as { companyName?: string }).companyName).trim()
        : (current.companyName ?? ''),
    documentNo:
      (body as { documentNo?: string }).documentNo !== undefined
        ? String((body as { documentNo?: string }).documentNo).trim()
        : (current.documentNo ?? ''),
    authorizedFullName:
      (body as { authorizedFullName?: string }).authorizedFullName !== undefined
        ? String((body as { authorizedFullName?: string }).authorizedFullName).trim()
        : (current.authorizedFullName ?? ''),
    authorizedPhone:
      (body as { authorizedPhone?: string }).authorizedPhone !== undefined
        ? String((body as { authorizedPhone?: string }).authorizedPhone).trim()
        : (current.authorizedPhone ?? ''),
    mainCategory:
      body.mainCategory !== undefined ? String(body.mainCategory).trim() : current.mainCategory,
    subCategoryIds:
      body.subCategoryIds !== undefined
        ? Array.isArray(body.subCategoryIds)
          ? body.subCategoryIds.map(String)
          : current.subCategoryIds
        : current.subCategoryIds,
    location: body.location !== undefined ? String(body.location).trim() : current.location,
    departurePlace:
      body.departurePlace !== undefined ? String(body.departurePlace).trim() : current.departurePlace,
    description: body.description !== undefined ? String(body.description).trim() : current.description,
    tourProgram: body.tourProgram !== undefined ? String(body.tourProgram).trim() : current.tourProgram,
    includedItemIds:
      body.includedItemIds !== undefined
        ? Array.isArray(body.includedItemIds)
          ? body.includedItemIds.map(String)
          : current.includedItemIds
        : current.includedItemIds,
    excludedItemIds:
      body.excludedItemIds !== undefined
        ? Array.isArray(body.excludedItemIds)
          ? body.excludedItemIds.map(String)
          : current.excludedItemIds
        : current.excludedItemIds,
    tagIds:
      body.tagIds !== undefined
        ? Array.isArray(body.tagIds)
          ? body.tagIds.map(String)
          : current.tagIds
        : current.tagIds,
    capacity:
      body.capacity !== undefined
        ? Math.max(0, Number(body.capacity) || 0)
        : legacyOccupancy !== undefined
          ? Math.max(0, Number(legacyOccupancy) || 0)
          : current.capacity,
    boatType:
      body.boatType !== undefined
        ? body.boatType === 'family'
          ? 'family'
          : 'standard'
        : current.boatType === 'family'
          ? 'family'
          : 'standard',
    askSell: body.askSell !== undefined ? Boolean(body.askSell) : Boolean(current.askSell),
    prepaymentPercent:
      body.prepaymentPercent !== undefined
        ? Math.min(100, Math.max(1, Math.round(Number(body.prepaymentPercent) || 100)))
        : typeof current.prepaymentPercent === 'number'
          ? Math.min(100, Math.max(1, Math.round(current.prepaymentPercent)))
          : 100,
    featureIds:
      body.featureIds !== undefined
        ? Array.isArray(body.featureIds)
          ? body.featureIds.map(String)
          : current.featureIds
        : current.featureIds,
    isActive: body.isActive !== undefined ? Boolean(body.isActive) : current.isActive,
    gallery: body.gallery !== undefined ? (Array.isArray(body.gallery) ? body.gallery : current.gallery) : current.gallery,
    prices: body.prices !== undefined ? (Array.isArray(body.prices) ? body.prices : current.prices) : current.prices,
    availability:
      body.availability !== undefined
        ? normalizeAvailabilityPayload(body.availability)
        : current.availability,
    trips: body.trips !== undefined ? (Array.isArray(body.trips) ? body.trips : current.trips) : current.trips,
    updatedAt: new Date().toISOString(),
  };

  if (!merged.activityId || !merged.name || !merged.mainCategory || !merged.subCategoryIds.length) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik.' }, { status: 400 });
  }

  all[idx] = merged;
  await writeActivities(all);
  return NextResponse.json({ activity: merged });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await context.params;
  const all = await readActivities();
  const next = all.filter((a) => a.id !== id);
  if (next.length === all.length) return notFound();
  await writeActivities(next);
  return NextResponse.json({ ok: true });
}
