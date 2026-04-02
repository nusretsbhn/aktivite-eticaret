import { NextResponse } from 'next/server';

import { readCancellationRequests } from '@/lib/cancellation-requests-server';
import { readOrders } from '@/lib/orders-server';

export async function POST(request: Request) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  const b = (body ?? {}) as Record<string, unknown>;
  const orderNo = String(b.orderNo ?? '').trim().toUpperCase();
  if (!orderNo) {
    return NextResponse.json({ error: 'Bilet no zorunludur.' }, { status: 400 });
  }

  const [orders, cancellations] = await Promise.all([readOrders(), readCancellationRequests()]);
  const order = orders.find((o) => String(o.orderNo ?? '').toUpperCase() === orderNo);
  if (!order) {
    return NextResponse.json({ error: 'Bilet bulunamadı.' }, { status: 404 });
  }

  const pendingCancel = cancellations.some((r) => r.orderId === order.id && r.status === 'pending');
  return NextResponse.json({
    ticket: {
      orderNo: order.orderNo,
      tourName: order.tourName,
      date: order.date,
      peopleCount: order.peopleCount,
      status: order.status,
      paymentType: order.paymentType,
      paymentPlan: order.paymentPlan ?? 'prepayment',
      totalAmount: order.totalAmount,
      pendingCancel,
    },
  });
}

