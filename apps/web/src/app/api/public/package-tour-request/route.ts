import { NextResponse } from 'next/server';

import { appendPackageTourRequest } from '@/lib/package-tour-requests-server';

export async function POST(request: Request) {
  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const customerName = String(body.customerName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  const kvkkApproved = Boolean(body.kvkkApproved);
  const commercialApproved = Boolean(body.commercialApproved);
  const packageTourId = String(body.packageTourId ?? '').trim();
  const packageTourName = String(body.packageTourName ?? '').trim();
  const conceptName = String(body.conceptName ?? '').trim();
  const checkIn = String(body.checkIn ?? '').trim();
  const checkOut = String(body.checkOut ?? '').trim();
  const nights = Math.max(1, Number(body.nights) || 1);
  const adults = Math.max(1, Number(body.adults) || 1);
  const children = Math.max(0, Number(body.children) || 0);
  const infants = Math.max(0, Number(body.infants) || 0);
  const packageTotal = Math.max(0, Number(body.packageTotal) || 0);
  const extraTotal = Math.max(0, Number(body.extraTotal) || 0);
  const grandTotal = Math.max(0, Number(body.grandTotal) || 0);
  const extrasRaw = Array.isArray(body.extras) ? body.extras : [];
  const extras = extrasRaw
    .map((x) => {
      if (!x || typeof x !== 'object') return null;
      const row = x as Record<string, unknown>;
      return {
        activityId: String(row.activityId ?? '').trim(),
        activityName: String(row.activityName ?? '').trim(),
        adults: Math.max(0, Number(row.adults) || 0),
        children: Math.max(0, Number(row.children) || 0),
        infants: Math.max(0, Number(row.infants) || 0),
        total: Math.max(0, Number(row.total) || 0),
      };
    })
    .filter((x): x is NonNullable<typeof x> => Boolean(x && x.activityId && x.activityName));

  if (!customerName) {
    return NextResponse.json({ success: false, message: 'Ad Soyad zorunlu.' }, { status: 400 });
  }
  if (phone.replace(/\D/g, '').length < 10) {
    return NextResponse.json({ success: false, message: 'Geçerli telefon giriniz.' }, { status: 400 });
  }
  if (!kvkkApproved || !commercialApproved) {
    return NextResponse.json({ success: false, message: 'Zorunlu onayları işaretleyin.' }, { status: 400 });
  }
  if (!packageTourId || !packageTourName || !checkIn || !checkOut) {
    return NextResponse.json({ success: false, message: 'Eksik rezervasyon bilgisi.' }, { status: 400 });
  }

  await appendPackageTourRequest({
    customerName,
    phone,
    kvkkApproved,
    commercialApproved,
    packageTourId,
    packageTourName,
    conceptName,
    checkIn,
    checkOut,
    nights,
    adults,
    children,
    infants,
    packageTotal,
    extraTotal,
    grandTotal,
    extras,
  });

  return NextResponse.json({ success: true });
}

