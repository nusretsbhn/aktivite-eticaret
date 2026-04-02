import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { sendRegisterOtpEmail } from '@/lib/otp-register-email';
import {
  generateSixDigitCode,
  hashOtpCode,
  pruneExpiredPending,
  upsertPending,
  type RegisterPending,
} from '@/lib/register-pending-server';
import { hashPassword, readPublicUsers, validatePasswordPolicy } from '@/lib/public-users-server';

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

const OTP_TTL_MS = 15 * 60 * 1000;

export async function POST(request: Request) {
  await pruneExpiredPending();

  let body: {
    firstName?: string;
    lastName?: string;
    email?: string;
    phone?: string;
    phoneCountryCode?: string;
    password?: string;
    passwordConfirm?: string;
    kvkkConsent?: boolean;
    smsConsent?: boolean;
    recaptchaToken?: string;
    villa?: string;
    checkIn?: string;
    checkOut?: string;
    guests?: string | number;
  };

  try {
    body = (await request.json()) as typeof body;
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const firstName = String(body.firstName ?? '').trim();
  const lastName = String(body.lastName ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const cc = String(body.phoneCountryCode ?? '+90').trim() || '+90';
  const phoneDigits = String(body.phone ?? '').replace(/\D/g, '');
  const phone = `${cc} ${phoneDigits}`.trim();
  const password = String(body.password ?? '');
  const passwordConfirm = String(body.passwordConfirm ?? '');
  const kvkkConsent = Boolean(body.kvkkConsent);
  const smsConsent = Boolean(body.smsConsent);
  const recaptchaToken = String(body.recaptchaToken ?? '').trim();
  const villaSlug = String(body.villa ?? '').trim() || undefined;
  const checkIn = String(body.checkIn ?? '').trim() || undefined;
  const checkOut = String(body.checkOut ?? '').trim() || undefined;
  const guests = Math.max(1, Number(body.guests ?? 1));

  if (!firstName || !lastName) {
    return NextResponse.json({ success: false, message: 'Ad ve soyad zorunludur.' }, { status: 400 });
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: 'Geçerli e-posta girin.' }, { status: 400 });
  }
  if (phoneDigits.length < 10) {
    return NextResponse.json({ success: false, message: 'Geçerli telefon girin.' }, { status: 400 });
  }
  if (password !== passwordConfirm) {
    return NextResponse.json({ success: false, message: 'Şifreler eşleşmiyor.' }, { status: 400 });
  }
  const policyError = validatePasswordPolicy(password);
  if (policyError) {
    return NextResponse.json({ success: false, message: policyError }, { status: 400 });
  }
  if (!kvkkConsent || !smsConsent) {
    return NextResponse.json(
      { success: false, message: 'KVKK ve iletişim onayları zorunludur.' },
      { status: 400 },
    );
  }
  if (!recaptchaToken || !(await verifyRecaptcha(recaptchaToken))) {
    return NextResponse.json(
      { success: false, message: 'reCAPTCHA doğrulaması başarısız.' },
      { status: 400 },
    );
  }

  const users = await readPublicUsers();
  if (users.some((u) => u.email === email)) {
    return NextResponse.json(
      { success: false, message: 'Bu e-posta ile kayıtlı kullanıcı var.' },
      { status: 409 },
    );
  }

  const id = randomUUID();
  const { hash, salt } = hashPassword(password);
  const code = generateSixDigitCode();
  const codeHash = hashOtpCode(id, email, code);
  const now = Date.now();
  const expiresAt = new Date(now + OTP_TTL_MS).toISOString();

  const row: RegisterPending = {
    id,
    email,
    firstName,
    lastName,
    phone,
    passwordHash: hash,
    passwordSalt: salt,
    kvkkConsent,
    smsConsent,
    codeHash,
    expiresAt,
    villaSlug,
    checkIn,
    checkOut,
    guests: villaSlug ? guests : undefined,
    createdAt: new Date(now).toISOString(),
  };

  await upsertPending(row);

  const sent = await sendRegisterOtpEmail(email, code);
  if (!sent) {
    return NextResponse.json(
      {
        success: false,
        message:
          'Doğrulama e-postası gönderilemedi. SMTP ayarlarını kontrol edin (SMTP_USER, SMTP_PASS).',
      },
      { status: 503 },
    );
  }

  return NextResponse.json({
    success: true,
    email,
    expiresAt,
    ttlSeconds: Math.floor(OTP_TTL_MS / 1000),
  });
}
