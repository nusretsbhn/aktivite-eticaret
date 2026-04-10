import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { readAdminUsers, writeAdminUsers } from '@/lib/admin-users-server';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function DELETE(_: Request, context: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await context.params;

  const all = await readAdminUsers();
  const target = all.find((x) => x.id === id);
  if (!target) return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });

  if (target.email === session.email) {
    return NextResponse.json({ error: 'Aktif oturumdaki kullanıcı silinemez.' }, { status: 400 });
  }

  const next = all.filter((x) => x.id !== id);
  await writeAdminUsers(next);
  return NextResponse.json({ success: true });
}
