import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  markUserNotificationsRead,
  readUserNotifications,
} from '@/lib/notifications-server';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';

function unauthorized() {
  return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
}

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
  if (!session) return unauthorized();

  const rows = await readUserNotifications();
  const mine = rows.filter((r) => r.userId === session.userId).sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const unread = mine.filter((r) => !r.readAt).length;
  return NextResponse.json({ notifications: mine, unread });
}

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
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
  const n = await markUserNotificationsRead(session.userId, { markAll, ids: markAll ? undefined : ids });
  return NextResponse.json({ marked: n });
}
