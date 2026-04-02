import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { getOrderTicketPdfBuffer } from '@/lib/order-ticket-pdf';
import { getRequestOrigin } from '@/lib/request-origin';
import { readOrders } from '@/lib/orders-server';

export const runtime = 'nodejs';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET(request: Request, ctx: { params: Promise<{ id: string }> }) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  const orders = await readOrders();
  const order = orders.find((o) => o.id === id);
  if (!order) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  let buf: Buffer | null;
  try {
    buf = await getOrderTicketPdfBuffer(order, getRequestOrigin(request));
  } catch (e) {
    console.error('[admin/ticket]', e);
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
    return NextResponse.json({ error: 'Bu sipariş için bilet henüz oluşturulmadı.' }, { status: 404 });
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
