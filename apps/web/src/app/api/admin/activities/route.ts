import { randomBytes, randomUUID } from 'node:crypto';
import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readActivities, writeActivities } from '@/lib/admin-activities-server';
import { normalizeFlexibleSchedule, normalizeScheduleMode } from '@/lib/activity-schedule';
import { normalizeAvailabilityPayload } from '@/lib/availability-helpers';
import type { AdminActivity, AdminActivityInput } from '@/types/admin-activity';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function normalizeActivity(body: Partial<AdminActivityInput>): AdminActivityInput {
  const legacySub = String((body as { subCategory?: string }).subCategory ?? '').trim();
  const legacyCapacity = Number((body as { occupancyPercent?: number }).occupancyPercent);
  return {
    activityId: String(body.activityId ?? '').trim(),
    name: String(body.name ?? '').trim(),
    companyName: String((body as { companyName?: string }).companyName ?? '').trim(),
    documentNo: String((body as { documentNo?: string }).documentNo ?? '').trim(),
    authorizedFullName: String((body as { authorizedFullName?: string }).authorizedFullName ?? '').trim(),
    authorizedPhone: String((body as { authorizedPhone?: string }).authorizedPhone ?? '').trim(),
    mainCategory: String(body.mainCategory ?? '').trim(),
    subCategoryIds: Array.isArray(body.subCategoryIds)
      ? body.subCategoryIds.map(String)
      : legacySub
        ? [legacySub]
        : [],
    location: String((body as { location?: string }).location ?? '').trim(),
    departurePlace: String(body.departurePlace ?? '').trim(),
    description: String(body.description ?? '').trim(),
    tourProgram: String(body.tourProgram ?? '').trim(),
    includedItemIds: Array.isArray(body.includedItemIds) ? body.includedItemIds.map(String) : [],
    excludedItemIds: Array.isArray(body.excludedItemIds) ? body.excludedItemIds.map(String) : [],
    tagIds: Array.isArray(body.tagIds) ? body.tagIds.map(String) : [],
    capacity: Math.max(
      0,
      Number.isFinite(Number(body.capacity)) ? Number(body.capacity) : Number.isFinite(legacyCapacity) ? legacyCapacity : 0,
    ),
    boatType: body.boatType === 'family' ? 'family' : 'standard',
    askSell: Boolean(body.askSell),
    prepaymentPercent: Math.min(100, Math.max(1, Math.round(Number(body.prepaymentPercent ?? 100) || 100))),
    featureIds: Array.isArray(body.featureIds) ? body.featureIds.map(String) : [],
    isActive: Boolean(body.isActive),
    gallery: Array.isArray(body.gallery) ? body.gallery : [],
    prices: Array.isArray(body.prices) ? body.prices : [],
    availability: normalizeAvailabilityPayload((body as { availability?: unknown }).availability),
    trips: Array.isArray(body.trips) ? body.trips : [],
    scheduleMode: normalizeScheduleMode(body.scheduleMode),
    flexibleSchedule: normalizeFlexibleSchedule(body.flexibleSchedule),
  };
}

function generateActivityId(existing: Set<string>): string {
  for (let i = 0; i < 20; i += 1) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const r = randomBytes(3).toString('hex').toUpperCase();
    const id = `BDA-${y}${m}${day}-${r}`;
    if (!existing.has(id)) return id;
  }
  let id = `BDA-${randomUUID().slice(0, 8).toUpperCase()}`;
  while (existing.has(id)) {
    id = `BDA-${randomUUID().slice(0, 8).toUpperCase()}`;
  }
  return id;
}

function validateRequiredCreate(a: AdminActivityInput): string | null {
  if (!a.name) return 'Aktivite adı zorunludur.';
  if (!a.mainCategory) return 'Ana kategori zorunludur.';
  if (!a.subCategoryIds.length) return 'En az bir alt kategori seçmelisiniz.';
  if (!a.location) return 'Lokasyon zorunludur.';
  if (!a.departurePlace) return 'Kalkış yeri zorunludur.';
  if (!a.description) return 'Açıklama zorunludur.';
  if (!a.tourProgram) return 'Tur programı zorunludur.';
  return null;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const mainCategory = (searchParams.get('mainCategory') ?? '').trim();
  const subCategory = (searchParams.get('subCategory') ?? '').trim();
  const isActiveParam = searchParams.get('isActive');

  let list = await readActivities();

  if (q) {
    list = list.filter(
      (a) =>
        a.name.toLowerCase().includes(q) ||
        a.activityId.toLowerCase().includes(q) ||
        a.description.toLowerCase().includes(q),
    );
  }
  if (mainCategory) {
    list = list.filter((a) => a.mainCategory === mainCategory);
  }
  if (subCategory) {
    list = list.filter((a) => a.subCategoryIds.includes(subCategory));
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const want = isActiveParam === 'true';
    list = list.filter((a) => a.isActive === want);
  }

  const total = list.length;

  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '20');
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 20));
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const requestedPage = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page =
    total === 0 ? 1 : Math.min(requestedPage, Math.max(1, totalPages));

  const start = (page - 1) * pageSize;
  const activities = list.slice(start, start + pageSize);

  return NextResponse.json({
    activities,
    total,
    page,
    pageSize,
    totalPages,
  });
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

  const input = normalizeActivity(body as Partial<AdminActivityInput>);
  const err = validateRequiredCreate(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const all = await readActivities();
  const existingIds = new Set(all.map((a) => a.activityId));
  const activityId = generateActivityId(existingIds);

  const now = new Date().toISOString();
  const created: AdminActivity = {
    id: randomUUID(),
    ...input,
    activityId,
    gallery: input.gallery ?? [],
    prices: input.prices ?? [],
    availability: input.availability ?? [],
    trips: input.trips ?? [],
    scheduleMode: input.scheduleMode ?? 'trips',
    flexibleSchedule: input.flexibleSchedule,
    createdAt: now,
    updatedAt: now,
  };

  all.push(created);
  await writeActivities(all);
  return NextResponse.json({ activity: created }, { status: 201 });
}
