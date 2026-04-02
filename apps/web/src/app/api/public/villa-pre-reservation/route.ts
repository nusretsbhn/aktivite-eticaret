import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { readVillas } from '@/lib/admin-villas-server';
import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { readPublicUsers } from '@/lib/public-users-server';
import { appendVillaRequest, type VillaPreReservationFormDetails } from '@/lib/villa-requests-server';
import { isValidVillaStayRange } from '@/lib/villa-stay-availability';

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return token === 'dev-pass';
  try {
    const res = await fetch('https://www.google.com/recaptcha/api/siteverify', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({ secret, response: token }),
    });
    const data = (await res.json()) as { success?: boolean };
    return Boolean(data.success);
  } catch {
    return false;
  }
}

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);

  let body: Record<string, unknown>;
  try {
    body = (await request.json()) as Record<string, unknown>;
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const bodyEmail = String(body.email ?? '')
    .trim()
    .toLowerCase();

  const villaSlug = String(body.villaSlug ?? '').trim();
  const checkIn = String(body.checkIn ?? '').trim();
  const checkOut = String(body.checkOut ?? '').trim();
  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const phoneCountryCode = String(body.phoneCountryCode ?? '+90').trim() || '+90';
  const phoneDigits = String(body.phone ?? '').replace(/\D/g, '');
  const phone = `${phoneCountryCode} ${phoneDigits}`.trim();
  const adults = Math.max(0, Number(body.adults ?? 0));
  const children = Math.max(0, Number(body.children ?? 0));
  const babies = Math.max(0, Number(body.babies ?? 0));
  const accommodationType = body.accommodationType === 'friends' ? 'friends' : 'family';
  const billingAddress = String(body.billingAddress ?? '').trim();
  const paymentPreference = body.paymentPreference === 'full' ? 'full' : 'prepayment';
  const referralSource = String(body.referralSource ?? '').trim();
  const foreignPhone = Boolean(body.foreignPhone);
  const notTurkishCitizen = Boolean(body.notTurkishCitizen);
  const legalIdentityCommitment = Boolean(body.legalIdentityCommitment);
  const distanceSalesAccepted = Boolean(body.distanceSalesAccepted);
  const preInfoAccepted = Boolean(body.preInfoAccepted);
  const recaptchaToken = String(body.recaptchaToken ?? '').trim();

  const rawAdditional = body.additionalGuests;
  const additionalGuests: { firstName: string; lastName: string }[] = [];
  if (Array.isArray(rawAdditional)) {
    for (const row of rawAdditional) {
      if (row && typeof row === 'object') {
        const o = row as Record<string, unknown>;
        additionalGuests.push({
          firstName: String(o.firstName ?? '').trim(),
          lastName: String(o.lastName ?? '').trim(),
        });
      }
    }
  }

  const recaptchaSiteKey = process.env.NEXT_PUBLIC_RECAPTCHA_SITE_KEY ?? '';
  if (recaptchaSiteKey && !(await verifyRecaptcha(recaptchaToken))) {
    return NextResponse.json(
      { success: false, message: 'reCAPTCHA doğrulaması başarısız.' },
      { status: 400 },
    );
  }

  if (!villaSlug || !checkIn || !checkOut) {
    return NextResponse.json({ success: false, message: 'Villa ve konaklama tarihleri zorunludur.' }, { status: 400 });
  }
  if (!firstName || !lastName) {
    return NextResponse.json({ success: false, message: 'Ad ve soyad zorunludur.' }, { status: 400 });
  }
  if (phoneDigits.length < 10) {
    return NextResponse.json({ success: false, message: 'Geçerli telefon girin.' }, { status: 400 });
  }
  if (adults < 1) {
    return NextResponse.json({ success: false, message: 'En az 1 yetişkin seçmelisiniz.' }, { status: 400 });
  }

  const totalGuests = adults + children + babies;
  if (totalGuests < 1) {
    return NextResponse.json({ success: false, message: 'Misafir sayısı geçersiz.' }, { status: 400 });
  }

  if (!billingAddress) {
    return NextResponse.json({ success: false, message: 'Fatura adresi zorunludur.' }, { status: 400 });
  }
  if (!legalIdentityCommitment || !distanceSalesAccepted || !preInfoAccepted) {
    return NextResponse.json({ success: false, message: 'Tüm zorunlu onayları işaretleyin.' }, { status: 400 });
  }

  const users = await readPublicUsers();
  let userId: string;
  let resolvedEmail: string;

  if (session) {
    const user = users.find((u) => u.id === session.userId && u.email === session.email);
    if (!user) {
      return NextResponse.json({ success: false, message: 'Oturum geçersiz.' }, { status: 401 });
    }
    userId = user.id;
    resolvedEmail = user.email;
  } else {
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(bodyEmail)) {
      return NextResponse.json({ success: false, message: 'Geçerli e-posta adresi girin.' }, { status: 400 });
    }
    userId = 'guest';
    resolvedEmail = bodyEmail;
  }

  const villas = await readVillas();
  const villa = villas.find((v) => v.slug === villaSlug);
  if (!villa) {
    return NextResponse.json({ success: false, message: 'Villa bulunamadı.' }, { status: 404 });
  }

  if (totalGuests > villa.guestCount) {
    return NextResponse.json(
      { success: false, message: `Misafir sayısı en fazla ${villa.guestCount} olabilir.` },
      { status: 400 },
    );
  }

  if (!isValidVillaStayRange(villa, checkIn, checkOut)) {
    return NextResponse.json(
      { success: false, message: 'Seçilen tarihler için konaklama uygun değil.' },
      { status: 400 },
    );
  }

  const extraCount = Math.max(0, totalGuests - 1);
  if (additionalGuests.length !== extraCount) {
    return NextResponse.json(
      { success: false, message: 'Tüm misafir adlarını eksiksiz doldurun.' },
      { status: 400 },
    );
  }
  for (let i = 0; i < additionalGuests.length; i++) {
    const g = additionalGuests[i];
    if (!g || !g.firstName || !g.lastName) {
      return NextResponse.json(
        { success: false, message: `Misafir ${i + 1} için ad ve soyad zorunludur.` },
        { status: 400 },
      );
    }
  }

  const formDetails: VillaPreReservationFormDetails = {
    adults,
    children,
    babies,
    accommodationType,
    billingAddress,
    paymentPreference,
    referralSource,
    phoneCountryCode,
    foreignPhone,
    notTurkishCitizen,
    additionalGuests,
    legalIdentityCommitment,
    distanceSalesAccepted,
    preInfoAccepted,
  };

  const userName = `${firstName} ${lastName}`.trim();

  await appendVillaRequest({
    userId,
    userEmail: resolvedEmail,
    userName,
    phone,
    villaSlug,
    villaDisplayName: villa.displayName,
    checkIn,
    checkOut,
    guests: totalGuests,
    formDetails,
  });

  return NextResponse.json({ success: true });
}
