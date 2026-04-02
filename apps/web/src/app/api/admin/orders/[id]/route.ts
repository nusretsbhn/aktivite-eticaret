import { NextResponse } from 'next/server';

import { requireAdminSession } from '@/lib/admin-api-auth';
import { issueOrderTicketIfNeeded } from '@/lib/order-ticket-issue';
import { getRequestOrigin } from '@/lib/request-origin';
import { readOrders, writeOrders } from '@/lib/orders-server';
import type { Order } from '@/types/order';

function unauthorized() {
  return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
}

export async function PATCH(
  request: Request,
  ctx: { params: Promise<{ id: string }> },
) {
  const session = await requireAdminSession();
  if (!session) return unauthorized();
  const { id } = await ctx.params;

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz veri' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const orders = await readOrders();
  const idx = orders.findIndex((o) => o.id === id);
  if (idx < 0) return NextResponse.json({ error: 'Sipariş bulunamadı' }, { status: 404 });
  const current = orders[idx];

  const patch: Partial<Order> = {};
  if (typeof b.fullName === 'string') patch.fullName = b.fullName.trim();
  if (typeof b.phone === 'string') patch.phone = b.phone.trim();
  if (typeof b.countryCode === 'string') patch.countryCode = b.countryCode.trim();
  if (typeof b.email === 'string') patch.email = b.email.trim();
  if (typeof b.tourName === 'string') patch.tourName = b.tourName.trim();
  if (typeof b.location === 'string') patch.location = b.location.trim();
  if (typeof b.departurePlace === 'string') patch.departurePlace = b.departurePlace.trim();
  if (typeof b.date === 'string') patch.date = b.date.trim();
  if (typeof b.tripInfo === 'string') patch.tripInfo = b.tripInfo.trim();
  if (typeof b.peopleCount === 'number') patch.peopleCount = Math.max(1, b.peopleCount);
  if (b.status === 'new' || b.status === 'completed' || b.status === 'cancelled') patch.status = b.status;
  if (typeof b.cancelReason === 'string') patch.cancelReason = b.cancelReason.trim();
  if (b.refundType === 'full' || b.refundType === 'partial' || b.refundType === null) patch.refundType = b.refundType;
  if (typeof b.refundAmount === 'number') patch.refundAmount = Math.max(0, b.refundAmount);
  if (current.paymentType === 'transfer' && typeof b.transferPaid === 'boolean') {
    patch.transferPaid = b.transferPaid;
  }
  if (Array.isArray(b.passengers)) {
    const list = b.passengers
      .map((p) => {
        if (!p || typeof p !== 'object') return null;
        const x = p as Record<string, unknown>;
        const firstName = String(x.firstName ?? '').trim();
        const lastName = String(x.lastName ?? '').trim();
        const fullName = String(x.fullName ?? '').trim() || `${firstName} ${lastName}`.trim();
        const birthDate = String(x.birthDate ?? '').trim();
        const tcNo = String(x.tcNo ?? '').trim();
        const isForeignCitizen = Boolean(x.isForeignCitizen);
        const gRaw = String(x.gender ?? '').trim();
        const gender: 'female' | 'male' = gRaw === 'female' || gRaw === 'male' ? gRaw : 'male';
        if (!firstName || !lastName) return null;
        return {
          firstName,
          lastName,
          fullName,
          birthDate,
          ...(tcNo ? { tcNo } : {}),
          isForeignCitizen,
          gender,
        };
      })
      .filter((x): x is NonNullable<typeof x> => Boolean(x));
    patch.passengers = list;
    if (list[0]?.fullName) patch.fullName = list[0].fullName;
  }

  const wasTransferPaid = current.paymentType === 'transfer' && current.transferPaid === true;
  orders[idx] = { ...current, ...patch, updatedAt: new Date().toISOString() };
  const merged = orders[idx];
  const nowTransferPaid = merged.paymentType === 'transfer' && merged.transferPaid === true;
  await writeOrders(orders);

  if (nowTransferPaid && !wasTransferPaid) {
    try {
      await issueOrderTicketIfNeeded(id, getRequestOrigin(request));
    } catch {
      /* bilet üretilemese güncelleme yine de kayıtlı */
    }
  }

  const fresh = (await readOrders()).find((o) => o.id === id) ?? merged;
  return NextResponse.json({ order: fresh });
}

