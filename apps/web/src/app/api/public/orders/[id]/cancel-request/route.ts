import { randomUUID } from 'node:crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { appendAdminNotification } from '@/lib/notifications-server';
import { readCancellationRequests, writeCancellationRequests } from '@/lib/cancellation-requests-server';
import { readOrders } from '@/lib/orders-server';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { readPublicUsers } from '@/lib/public-users-server';
import type { CancellationRequest } from '@/types/cancellation-request';

function canAccessOrder(
  o: { userId?: string; email: string },
  session: { userId: string; email: string },
  userEmail: string,
): boolean {
  if (o.userId && o.userId === session.userId) return true;
  if (!o.userId && String(o.email).toLowerCase() === userEmail.toLowerCase()) return true;
  return false;
}

export async function POST(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id: orderId } = await ctx.params;
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  const users = await readPublicUsers();
  const user = users.find((u) => u.id === session.userId && u.email === session.email);
  if (!user) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 401 });
  }

  let body: { reason?: string };
  try {
    body = (await request.json()) as { reason?: string };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const reason = String(body.reason ?? '').trim();
  if (reason.length < 5) {
    return NextResponse.json({ error: 'İptal nedeni en az 5 karakter olmalıdır.' }, { status: 400 });
  }

  const orders = await readOrders();
  const order = orders.find((o) => o.id === orderId);
  if (!order || !canAccessOrder(order, session, user.email)) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'Bu sipariş zaten iptal edilmiş.' }, { status: 400 });
  }

  const existing = await readCancellationRequests();
  const pending = existing.find((r) => r.orderId === orderId && r.status === 'pending');
  if (pending) {
    return NextResponse.json({ error: 'Bu sipariş için zaten bekleyen bir iptal talebi var.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row: CancellationRequest = {
    id: randomUUID(),
    orderId: order.id,
    orderNo: order.orderNo,
    userId: session.userId,
    userEmail: user.email,
    reason,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  existing.unshift(row);
  await writeCancellationRequests(existing);

  try {
    await appendAdminNotification({
      type: 'cancel_request',
      refId: row.id,
      title: 'İptal / iade talebi',
      message: `${order.orderNo} · ${order.tourName}`,
    });
  } catch {
    /* ignore */
  }

  return NextResponse.json({ success: true, id: row.id });
}
