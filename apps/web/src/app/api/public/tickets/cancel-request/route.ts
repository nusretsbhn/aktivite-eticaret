import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { readCancellationRequests, writeCancellationRequests } from '@/lib/cancellation-requests-server';
import { appendAdminNotification } from '@/lib/notifications-server';
import { readOrders } from '@/lib/orders-server';
import type { CancellationRequest } from '@/types/cancellation-request';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const orderNo = String(b.orderNo ?? '').trim().toUpperCase();
  const reason = String(b.reason ?? '').trim();
  const contactEmail = String(b.email ?? '').trim();

  if (!orderNo) return NextResponse.json({ error: 'Bilet no zorunludur.' }, { status: 400 });
  if (reason.length < 5) {
    return NextResponse.json({ error: 'İptal nedeni en az 5 karakter olmalıdır.' }, { status: 400 });
  }

  const orders = await readOrders();
  const order = orders.find((o) => String(o.orderNo ?? '').toUpperCase() === orderNo);
  if (!order) return NextResponse.json({ error: 'Bilet bulunamadı.' }, { status: 404 });
  if (order.status === 'cancelled') {
    return NextResponse.json({ error: 'Bu sipariş zaten iptal edilmiş.' }, { status: 400 });
  }

  const rows = await readCancellationRequests();
  const exists = rows.find((r) => r.orderId === order.id && r.status === 'pending');
  if (exists) {
    return NextResponse.json({ error: 'Bu bilet için zaten bekleyen bir iptal talebi var.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const row: CancellationRequest = {
    id: randomUUID(),
    orderId: order.id,
    orderNo: order.orderNo,
    userId: 'guest',
    userEmail: contactEmail || order.email || '-',
    reason,
    status: 'pending',
    createdAt: now,
    updatedAt: now,
  };
  rows.unshift(row);
  await writeCancellationRequests(rows);

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

