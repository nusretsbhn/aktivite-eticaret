import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readPackageTourRequests, writePackageTourRequests } from '@/lib/package-tour-requests-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  let body: { status?: 'NEW' | 'PROCESSED' };
  try {
    body = (await request.json()) as { status?: 'NEW' | 'PROCESSED' };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }
  if (body.status !== 'NEW' && body.status !== 'PROCESSED') {
    return NextResponse.json({ error: 'status gerekli' }, { status: 400 });
  }

  const all = await readPackageTourRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });
  all[idx] = { ...all[idx], status: body.status, updatedAt: new Date().toISOString() };
  await writePackageTourRequests(all);
  return NextResponse.json({ request: all[idx] });
}

