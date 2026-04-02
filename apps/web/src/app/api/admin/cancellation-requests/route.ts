import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { appendUserNotification } from '@/lib/notifications-server';
import { readCancellationRequests, writeCancellationRequests } from '@/lib/cancellation-requests-server';
import { readOrders, writeOrders } from '@/lib/orders-server';

function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export async function GET() {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const rows = await readCancellationRequests();
  const sorted = rows.slice().sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)));
  return NextResponse.json({ requests: sorted });
}

export async function PATCH(request: Request) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();

  let body: { id?: string; action?: 'approve' | 'reject' };
  try {
    body = (await request.json()) as { id?: string; action?: 'approve' | 'reject' };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const id = String(body.id ?? '').trim();
  const action = body.action;
  if (!id || (action !== 'approve' && action !== 'reject')) {
    return NextResponse.json({ error: 'Geçersiz istek.' }, { status: 400 });
  }

  const rows = await readCancellationRequests();
  const idx = rows.findIndex((r) => r.id === id);
  if (idx < 0) {
    return NextResponse.json({ error: 'Talep bulunamadı.' }, { status: 404 });
  }
  const req = rows[idx];
  if (req.status !== 'pending') {
    return NextResponse.json({ error: 'Bu talep zaten işlenmiş.' }, { status: 400 });
  }

  const now = new Date().toISOString();

  if (action === 'reject') {
    rows[idx] = { ...req, status: 'rejected', updatedAt: now };
    await writeCancellationRequests(rows);
    try {
      await appendUserNotification({
        userId: req.userId,
        type: 'cancel_rejected',
        refId: req.orderId,
        title: 'İptal talebiniz reddedildi',
        message: `${req.orderNo} numaralı sipariş için iptal talebiniz reddedildi.`,
        link: '/hesap/siparisler',
      });
    } catch {
      /* ignore */
    }
    return NextResponse.json({ success: true });
  }

  const orders = await readOrders();
  const oi = orders.findIndex((o) => o.id === req.orderId);
  if (oi < 0) {
    return NextResponse.json({ error: 'Sipariş bulunamadı.' }, { status: 404 });
  }

  orders[oi] = {
    ...orders[oi],
    status: 'cancelled',
    cancelReason: req.reason,
    updatedAt: now,
  };
  await writeOrders(orders);

  rows[idx] = { ...req, status: 'approved', updatedAt: now };
  await writeCancellationRequests(rows);

  try {
    await appendUserNotification({
      userId: req.userId,
      type: 'cancel_approved',
      refId: req.orderId,
      title: 'İptal talebiniz onaylandı',
      message: `${req.orderNo} numaralı siparişiniz iptal edildi.`,
      link: '/hesap/siparisler',
    });
  } catch {
    /* ignore */
  }

  return NextResponse.json({ success: true });
}
