import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { getOrderTicketPdfBuffer } from '@/lib/order-ticket-pdf';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { getRequestOrigin } from '@/lib/request-origin';
import { readOrders } from '@/lib/orders-server';
import { readPublicUsers } from '@/lib/public-users-server';

export const runtime = 'nodejs';

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
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

  const orders = await readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  const emailLower = user.email.toLowerCase();
  const allowed =
    (order.userId && order.userId === session.userId) ||
    (!order.userId && String(order.email ?? '').toLowerCase() === emailLower);
  if (!allowed) {
    return NextResponse.json({ error: 'Yetkisiz.' }, { status: 403 });
  }

  let buf: Buffer | null;
  try {
    buf = await getOrderTicketPdfBuffer(order, getRequestOrigin(request));
  } catch (e) {
    console.error('[public/ticket]', e);
    const dev = process.env.NODE_ENV === 'development';
    return NextResponse.json(
      {
        error: 'PDF oluşturulamadı.',
        ...(dev ? { detail: e instanceof Error ? e.message : String(e) } : {}),
      },
      { status: 500 },
    );
  }
  if (!buf) {
    return NextResponse.json({ error: 'Bilet henüz oluşturulmadı.' }, { status: 404 });
  }

  const safeName = order.orderNo.replace(/[^\w.-]+/g, '_');
  return new NextResponse(new Uint8Array(buf), {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="bilet-${safeName}.pdf"`,
      'Cache-Control': 'private, no-store',
    },
  });
}
