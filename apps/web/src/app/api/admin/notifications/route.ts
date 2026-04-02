import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import {
  countUnreadAdminByType,
  markAdminNotificationsRead,
  readAdminNotifications,
} from '@/lib/notifications-server';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  const { searchParams } = new URL(request.url);
  if (searchParams.get('summary') === '1') {
    const rows = await readAdminNotifications();
    const counts = countUnreadAdminByType(rows);
    const totalUnread = rows.filter((r) => !r.readAt).length;
    return NextResponse.json({ counts, totalUnread });
  }

  const rows = await readAdminNotifications();
  const sorted = rows.slice().sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const totalUnread = sorted.filter((r) => !r.readAt).length;
  return NextResponse.json({ notifications: sorted, totalUnread });
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: { markAllRead?: boolean; ids?: string[] };
  try {
    body = (await request.json()) as { markAllRead?: boolean; ids?: string[] };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const markAll = Boolean(body.markAllRead);
  const ids = Array.isArray(body.ids) ? body.ids.map((x) => String(x)) : [];
  if (!markAll && !ids.length) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }
  const n = await markAdminNotificationsRead({ markAll, ids: markAll ? undefined : ids });
  return NextResponse.json({ marked: n });
}
