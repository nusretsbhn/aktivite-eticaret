import { randomBytes, randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readActivities } from '@/lib/admin-activities-server';
import { readPackages, writePackages } from '@/lib/admin-packages-server';
import type { AdminPackage, AdminPackageInput } from '@/types/admin-package';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

function generatePackageId(existing: Set<string>): string {
  for (let i = 0; i < 20; i += 1) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const r = randomBytes(3).toString('hex').toUpperCase();
    const id = `BDP-${y}${m}${day}-${r}`;
    if (!existing.has(id)) return id;
  }
  let id = `BDP-${randomUUID().slice(0, 8).toUpperCase()}`;
  while (existing.has(id)) id = `BDP-${randomUUID().slice(0, 8).toUpperCase()}`;
  return id;
}

function normalize(body: Partial<AdminPackageInput>): AdminPackageInput {
  return {
    packageId: String(body.packageId ?? '').trim(),
    name: String(body.name ?? '').trim(),
    description: String(body.description ?? '').trim(),
    activityIds: Array.isArray(body.activityIds) ? body.activityIds.map(String) : [],
    coverImageUrl: String(body.coverImageUrl ?? '').trim(),
    isActive: body.isActive === undefined ? true : Boolean(body.isActive),
  };
}

function validateInput(input: AdminPackageInput): string | null {
  if (!input.name) return 'Paket adı zorunludur.';
  if (!Array.isArray(input.activityIds) || input.activityIds.length === 0) {
    return 'En az bir aktivite seçmelisiniz.';
  }
  return null;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const isActiveParam = (searchParams.get('isActive') ?? '').trim();
  const pageSizeRaw = Number(searchParams.get('pageSize') ?? '25');
  const pageRaw = Number(searchParams.get('page') ?? '1');
  const pageSize = Math.min(100, Math.max(1, Number.isFinite(pageSizeRaw) ? pageSizeRaw : 25));
  const requestedPage = Math.max(1, Number.isFinite(pageRaw) ? pageRaw : 1);

  const all = await readPackages();
  const acts = await readActivities();
  const actNameById = new Map(acts.map((a) => [a.id, a.name]));

  let list = all.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) {
    list = list.filter((p) => {
      const names = p.activityIds.map((id) => actNameById.get(id) ?? '').join(' ').toLowerCase();
      const hay = `${p.name} ${p.packageId} ${p.description} ${names}`.toLowerCase();
      return hay.includes(q);
    });
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const v = isActiveParam === 'true';
    list = list.filter((p) => p.isActive === v);
  }

  const total = list.length;
  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const page = total === 0 ? 1 : Math.min(requestedPage, Math.max(1, totalPages));
  const start = (page - 1) * pageSize;
  const packages = list.slice(start, start + pageSize);

  return NextResponse.json({ packages, total, page, pageSize, totalPages });
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

  const input = normalize(body as Partial<AdminPackageInput>);
  const err = validateInput(input);
  if (err) return NextResponse.json({ error: err }, { status: 400 });

  const acts = await readActivities();
  const validIds = new Set(acts.map((a) => a.id));
  if (input.activityIds.some((id) => !validIds.has(id))) {
    return NextResponse.json({ error: 'Seçilen aktivitelerden bazıları geçersiz.' }, { status: 400 });
  }

  const all = await readPackages();
  const packageId = generatePackageId(new Set(all.map((p) => p.packageId)));
  const now = new Date().toISOString();
  const created: AdminPackage = {
    id: randomUUID(),
    packageId,
    name: input.name,
    description: input.description,
    activityIds: [...new Set(input.activityIds)],
    coverImageUrl: input.coverImageUrl,
    isActive: input.isActive,
    createdAt: now,
    updatedAt: now,
  };
  all.push(created);
  await writePackages(all);

  return NextResponse.json({ package: created }, { status: 201 });
}

