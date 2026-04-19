import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { normalizePriceRules, readPackageTours, writePackageTours } from '@/lib/admin-package-tours-server';
import type { AdminPackageTour } from '@/types/admin-package-tour';
import type { GalleryItem } from '@/types/admin-activity';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function notFound() {
  return NextResponse.json({ error: 'Bulunamadı' }, { status: 404 });
}

type RouteContext = { params: Promise<{ id: string }> };

function normalizePayload(body: Record<string, unknown>) {
  return {
    packageName: body.packageName === undefined ? undefined : String(body.packageName ?? '').trim(),
    conceptName: body.conceptName === undefined ? undefined : String(body.conceptName ?? '').trim(),
    description: body.description === undefined ? undefined : String(body.description ?? '').trim(),
    nightCount: body.nightCount === undefined ? undefined : Math.max(1, Number(body.nightCount) || 1),
    dayCount: body.dayCount === undefined ? undefined : Math.max(1, Number(body.dayCount) || 1),
    includedServiceIds: body.includedServiceIds === undefined
      ? undefined
      : Array.isArray(body.includedServiceIds)
        ? body.includedServiceIds.map(String)
        : [],
    paidServiceIds: body.paidServiceIds === undefined
      ? undefined
      : Array.isArray(body.paidServiceIds)
        ? body.paidServiceIds.map(String)
        : [],
    activityIds: body.activityIds === undefined
      ? undefined
      : Array.isArray(body.activityIds)
        ? body.activityIds.map(String)
        : [],
    gallery: body.gallery === undefined ? undefined : Array.isArray(body.gallery) ? (body.gallery as GalleryItem[]) : undefined,
    coverImageUrl: body.coverImageUrl === undefined ? undefined : String(body.coverImageUrl ?? '').trim(),
    isActive: body.isActive === undefined ? undefined : Boolean(body.isActive),
    priceRules: Array.isArray(body.priceRules)
      ? body.priceRules
          .map((row) => {
            if (!row || typeof row !== 'object') return null;
            const r = row as Record<string, unknown>;
            const id = String(r.id ?? '').trim();
            const fromDate = String(r.fromDate ?? '').trim();
            const toDate = String(r.toDate ?? '').trim();
            if (!id || !fromDate || !toDate) return null;
            return {
              id,
              fromDate,
              toDate,
              costPrice: Math.max(0, Number(r.costPrice) || 0),
              profitPercent: Math.max(0, Number(r.profitPercent) || 0),
              singleRoomMultiplier: Math.max(1, Number(r.singleRoomMultiplier) || 1),
              roundingMode: r.roundingMode === 'down' ? 'down' : 'up',
              childAgeRules: Array.isArray(r.childAgeRules)
                ? r.childAgeRules
                    .map((child) => {
                      if (!child || typeof child !== 'object') return null;
                      const c = child as Record<string, unknown>;
                      const childId = String(c.id ?? '').trim();
                      const childOrder = Math.max(1, Number(c.childOrder) || 1);
                      const minAge = Math.max(0, Number(c.minAge) || 0);
                      const maxAge = Math.max(minAge, Number(c.maxAge) || minAge);
                      const discountPercent = Math.min(100, Math.max(0, Number(c.discountPercent) || 0));
                      if (!childId) return null;
                      return { id: childId, childOrder, minAge, maxAge, discountPercent };
                    })
                    .filter((x): x is NonNullable<typeof x> => Boolean(x))
                : [
                    { id: `${id}-c1`, childOrder: 1, minAge: 0, maxAge: 10, discountPercent: 100 },
                    { id: `${id}-c2`, childOrder: 2, minAge: 0, maxAge: 2, discountPercent: 100 },
                    {
                      id: `${id}-c3`,
                      childOrder: 2,
                      minAge: 3,
                      maxAge: 12,
                      discountPercent: Math.min(
                        100,
                        Math.max(
                          0,
                          Number(
                            (r as { secondChildDiscount3to12Percent?: unknown }).secondChildDiscount3to12Percent ??
                              ((r as { childPercent3to12?: unknown }).childPercent3to12 !== undefined
                                ? 100 - (Number((r as { childPercent3to12?: unknown }).childPercent3to12) || 0)
                                : 50),
                          ) || 0,
                        ),
                      ),
                    },
                  ],
            };
          })
          .filter((x): x is NonNullable<typeof x> => Boolean(x))
      : undefined,
  };
}

export async function GET(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;
  const all = await readPackageTours();
  const item = all.find((x) => x.id === id);
  if (!item) return notFound();
  return NextResponse.json({ packageTour: item });
}

export async function PATCH(request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz payload' }, { status: 400 });
  }

  const all = await readPackageTours();
  const idx = all.findIndex((x) => x.id === id);
  if (idx < 0) return notFound();
  const current = all[idx];
  if (!current) return notFound();

  const input = normalizePayload(body as Record<string, unknown>);
  const merged: AdminPackageTour = {
    ...current,
    packageName: input.packageName === undefined ? current.packageName : input.packageName || current.packageName,
    conceptName: input.conceptName === undefined ? current.conceptName : input.conceptName || current.conceptName,
    description: input.description ?? current.description,
    nightCount: input.nightCount ?? current.nightCount,
    dayCount: input.dayCount ?? current.dayCount,
    includedServiceIds: input.includedServiceIds ? [...new Set(input.includedServiceIds)] : current.includedServiceIds,
    paidServiceIds: input.paidServiceIds ? [...new Set(input.paidServiceIds)] : current.paidServiceIds,
    activityIds: input.activityIds ? [...new Set(input.activityIds)] : current.activityIds,
    gallery: input.gallery ?? current.gallery,
    coverImageUrl:
      input.coverImageUrl ??
      ((input.gallery ?? current.gallery).find((g) => g.isCover)?.url ||
        (input.gallery ?? current.gallery)[0]?.url ||
        ''),
    isActive: input.isActive ?? current.isActive,
    priceRules: normalizePriceRules(
      input.priceRules !== undefined ? input.priceRules : current.priceRules,
    ),
    updatedAt: new Date().toISOString(),
  };
  if (!merged.packageName || !merged.conceptName) {
    return NextResponse.json({ error: 'Paket adı ve konsept adı zorunludur.' }, { status: 400 });
  }
  all[idx] = merged;
  await writePackageTours(all);
  return NextResponse.json({ packageTour: merged });
}

export async function DELETE(_request: Request, context: RouteContext) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;
  const all = await readPackageTours();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return notFound();
  await writePackageTours(next);
  return NextResponse.json({ ok: true });
}

