import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readVillaRequests, writeVillaRequests } from '@/lib/villa-requests-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { id } = await ctx.params;
  let body: { isRead?: boolean };
  try {
    body = (await request.json()) as { isRead?: boolean };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
  }

  if (typeof body.isRead !== 'boolean') {
    return NextResponse.json({ error: 'isRead gerekli' }, { status: 400 });
  }

  const all = await readVillaRequests();
  const idx = all.findIndex((r) => r.id === id);
  if (idx < 0) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  all[idx] = { ...all[idx], isRead: body.isRead };
  await writeVillaRequests(all);
  return NextResponse.json({ request: all[idx] });
}
