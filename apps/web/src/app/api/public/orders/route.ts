import { randomUUID } from 'node:crypto';

import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { computeActivityBookingTotal } from '@/lib/activity-pricing';
import { validateBookingRequest } from '@/lib/availability-helpers';
import { readActivities } from '@/lib/admin-activities-server';
import { appendAdminNotification, appendUserNotification } from '@/lib/notifications-server';
import { issueOrderTicketIfNeeded } from '@/lib/order-ticket-issue';
import { newOrderNo, readOrders, writeOrders } from '@/lib/orders-server';
import { getRequestOrigin } from '@/lib/request-origin';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import type { Order, OrderKind, OrderPaymentPlan, OrderPaymentType } from '@/types/order';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const sessionToken = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const userSession = verifyPublicUserSession(sessionToken);
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Geçersiz istek' }, { status: 400 });
  }
  const b = body as Record<string, unknown>;
  const fullName = String(b.fullName ?? '').trim();
  const phone = String(b.phone ?? '').trim();
  const email = String(b.email ?? '').trim();
  const activityId = String(b.activityId ?? '').trim();
  const tourName = String(b.tourName ?? '').trim();
  const departurePlace = String(b.departurePlace ?? '').trim();
  const date = String(b.date ?? '').trim();
  const peopleCountRaw = Math.max(1, Number(b.peopleCount ?? 1) || 1);
  const hasGuestSplit =
    b.adults !== undefined || b.children !== undefined || b.infants !== undefined;
  let adults: number;
  let children: number;
  let infants: number;
  if (hasGuestSplit) {
    adults = Math.max(1, Math.floor(Number(b.adults ?? 1) || 1));
    children = Math.max(0, Math.floor(Number(b.children ?? 0) || 0));
    infants = Math.max(0, Math.floor(Number(b.infants ?? 0) || 0));
  } else {
    adults = peopleCountRaw;
    children = 0;
    infants = 0;
  }
  const peopleCount = adults + children + infants;
  const unitPriceRaw = Math.max(0, Number(b.unitPrice ?? 0) || 0);
  const totalAmount = Math.max(0, Number(b.totalAmount ?? 0) || 0);
  const grossTotalAmount = Math.max(0, Number(b.grossTotalAmount ?? totalAmount) || totalAmount);
  const prepaymentPercent = Math.min(100, Math.max(1, Math.round(Number(b.prepaymentPercent ?? 100) || 100)));
  const paymentPlan = String(b.paymentPlan ?? 'prepayment') as OrderPaymentPlan;
  const unitPrice = unitPriceRaw > 0 ? unitPriceRaw : totalAmount > 0 ? totalAmount / peopleCount : 0;
  const paymentType = String(b.paymentType ?? 'transfer') as OrderPaymentType;
  const orderKind: OrderKind = paymentType === 'ask_sell' ? 'ask_sell' : 'order';
  const transferPaid = Boolean(b.transferPaid);
  const firstName = String(b.firstName ?? '').trim();
  const lastName = String(b.lastName ?? '').trim();
  const countryCode = String(b.countryCode ?? '').trim();
  const birthDate = String(b.birthDate ?? '').trim();
  const tcNo = String(b.tcNo ?? '').trim();
  const isForeignCitizen = Boolean(b.isForeignCitizen);
  const genderRaw = String(b.gender ?? '').trim();
  const gender = genderRaw === 'female' || genderRaw === 'male' ? genderRaw : undefined;
  const location = String(b.location ?? '').trim();
  const tripInfo = String(b.tripInfo ?? '').trim();
  const passengersRaw = Array.isArray(b.passengers) ? b.passengers : [];
  const passengers = passengersRaw
    .map((p) => {
      if (!p || typeof p !== 'object') return null;
      const x = p as Record<string, unknown>;
      const f = String(x.firstName ?? '').trim();
      const l = String(x.lastName ?? '').trim();
      const full = String(x.fullName ?? '').trim() || `${f} ${l}`.trim();
      const bd = String(x.birthDate ?? '').trim();
      const t = String(x.tcNo ?? '').trim();
      const foreign = Boolean(x.isForeignCitizen);
      const gRaw = String(x.gender ?? '').trim();
      const g: 'female' | 'male' = gRaw === 'female' || gRaw === 'male' ? gRaw : 'male';
      if (!f || !l) return null;
      return {
        firstName: f,
        lastName: l,
        fullName: full,
        birthDate: bd,
        ...(t ? { tcNo: t } : {}),
        isForeignCitizen: foreign,
        gender: g,
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x));

  if (!fullName || !phone || !email || !activityId || !tourName) {
    return NextResponse.json({ error: 'Zorunlu alanlar eksik' }, { status: 400 });
  }
  if (paymentType !== 'credit_card' && paymentType !== 'transfer' && paymentType !== 'ask_sell') {
    return NextResponse.json({ error: 'Geçersiz ödeme tipi' }, { status: 400 });
  }
  if (paymentPlan !== 'full' && paymentPlan !== 'prepayment') {
    return NextResponse.json({ error: 'Geçersiz ödeme planı' }, { status: 400 });
  }

  const activities = await readActivities();
  const activity = activities.find((a) => a.id === activityId);
  const bookingCheck = validateBookingRequest(activity, date, peopleCount);
  if (!bookingCheck.ok) {
    return NextResponse.json({ error: bookingCheck.message }, { status: bookingCheck.httpStatus });
  }

  const priceRow = activity ? (activity.prices ?? []).find((p) => p.date === date) : undefined;
  const expectedGross = computeActivityBookingTotal(priceRow, adults, children, infants);
  if (expectedGross > 0 && grossTotalAmount > 0 && Math.abs(expectedGross - grossTotalAmount) > 2) {
    return NextResponse.json({ error: 'Tutar doğrulanamadı. Lütfen sayfayı yenileyip tekrar deneyin.' }, { status: 400 });
  }

  const now = new Date().toISOString();
  const order: Order = {
    id: randomUUID(),
    ...(userSession ? { userId: userSession.userId } : {}),
    orderNo: newOrderNo(),
    fullName,
    phone,
    email,
    activityId,
    tourName,
    departurePlace,
    date,
    peopleCount,
    adultCount: adults,
    childCount: children,
    infantCount: infants,
    orderKind,
    paymentType,
    paymentPlan,
    ...(paymentType === 'transfer' ? { transferPaid } : {}),
    ...(unitPrice > 0 ? { unitPrice } : {}),
    ...(grossTotalAmount > 0 ? { grossTotalAmount } : {}),
    ...(prepaymentPercent > 0 ? { prepaymentPercent } : {}),
    totalAmount,
    ...(firstName ? { firstName } : {}),
    ...(lastName ? { lastName } : {}),
    ...(countryCode ? { countryCode } : {}),
    ...(birthDate ? { birthDate } : {}), // legacy compatibility
    ...(tcNo ? { tcNo } : {}), // legacy compatibility
    ...(isForeignCitizen ? { isForeignCitizen } : {}), // legacy compatibility
    ...(gender ? { gender } : {}), // legacy compatibility
    ...(passengers.length ? { passengers } : {}),
    ...(location ? { location } : {}),
    ...(tripInfo ? { tripInfo } : {}),
    status: 'new',
    createdAt: now,
    updatedAt: now,
  };

  const orders = await readOrders();
  orders.unshift(order);
  await writeOrders(orders);

  try {
    await appendAdminNotification({
      type: 'new_order',
      refId: order.id,
      title: orderKind === 'ask_sell' ? 'Yeni Sor-Sat talebi' : 'Yeni sipariş',
      message: `${order.orderNo} · ${order.tourName}`,
    });
    if (userSession) {
      await appendUserNotification({
        userId: userSession.userId,
        type: 'order_created',
        refId: order.id,
        title: orderKind === 'ask_sell' ? 'Ön rezervasyon talebiniz alındı' : 'Siparişiniz alındı',
        message:
          orderKind === 'ask_sell'
            ? `${order.orderNo} numaralı Sor-Sat talebiniz oluşturuldu.`
            : `${order.orderNo} numaralı siparişiniz oluşturuldu.`,
        link: '/hesap/siparisler',
      });
    }
  } catch {
    /* bildirim yazılamazsa sipariş yine de tamamlanır */
  }

  if (order.paymentType === 'credit_card') {
    try {
      await issueOrderTicketIfNeeded(order.id, getRequestOrigin(request));
    } catch {
      /* PDF üretilemese sipariş kaydı geçerlidir */
    }
  }

  return NextResponse.json({ orderNo: order.orderNo, id: order.id });
}

