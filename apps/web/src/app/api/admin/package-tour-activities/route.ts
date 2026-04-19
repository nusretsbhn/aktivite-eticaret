import { randomBytes, randomUUID } from 'node:crypto';

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

function generateActivityCode(existing: Set<string>): string {
  for (let i = 0; i < 20; i += 1) {
    const d = new Date();
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const r = randomBytes(3).toString('hex').toUpperCase();
    const id = `PTA-${y}${m}${day}-${r}`;
    if (!existing.has(id)) return id;
  }
  let id = `PTA-${randomUUID().slice(0, 8).toUpperCase()}`;
  while (existing.has(id)) id = `PTA-${randomUUID().slice(0, 8).toUpperCase()}`;
  return id;
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  const q = (searchParams.get('q') ?? '').trim().toLowerCase();
  const isActiveParam = (searchParams.get('isActive') ?? '').trim();

  let list = await readPackageTourActivities();
  list = list.sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  if (q) {
    list = list.filter((a) => `${a.name} ${a.activityId} ${a.location} ${a.category}`.toLowerCase().includes(q));
  }
  if (isActiveParam === 'true' || isActiveParam === 'false') {
    const isActive = isActiveParam === 'true';
    list = list.filter((a) => a.isActive === isActive);
  }
  return NextResponse.json({ activities: list });
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

  const normalized = normalizePackageTourActivityInput(body as Partial<AdminPackageTourActivityInput>);
  if (!normalized.name || !normalized.location || !normalized.category) {
    return NextResponse.json({ error: 'Aktivite adı, konum ve kategori zorunludur.' }, { status: 400 });
  }

  const all = await readPackageTourActivities();
  const now = new Date().toISOString();
  const created = {
    id: randomUUID(),
    activityId: generateActivityCode(new Set(all.map((x) => x.activityId))),
    createdAt: now,
    updatedAt: now,
    ...normalized,
  };
  all.push(created);
  await writePackageTourActivities(all);
  return NextResponse.json({ activity: created }, { status: 201 });
}

