import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { readCancellationRequests } from '@/lib/cancellation-requests-server';
import { readOrders } from '@/lib/orders-server';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { readPublicUsers } from '@/lib/public-users-server';

export async function GET() {
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

  const emailLower = user.email.toLowerCase();
  const allOrders = await readOrders();
  const mine = allOrders.filter((o) => {
    if (o.userId && o.userId === session.userId) return true;
    if (!o.userId && String(o.email ?? '').toLowerCase() === emailLower) return true;
    return false;
  });

  const requests = await readCancellationRequests();
  const pendingByOrderId = new Map<string, boolean>();
  for (const r of requests) {
    if (r.status === 'pending' && r.userId === session.userId) {
      pendingByOrderId.set(r.orderId, true);
    }
  }

  const orders = mine
    .slice()
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .map((o) => ({
      ...o,
      pendingCancelRequest: pendingByOrderId.has(o.id),
    }));

  return NextResponse.json({ orders });
}
