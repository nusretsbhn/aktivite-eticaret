import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import {
  hashPassword,
  readPublicUsers,
  validatePasswordPolicy,
  writePublicUsers,
} from '@/lib/public-users-server';

type RegisterBody = {
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  passwordConfirm?: string;
  kvkkConsent?: boolean;
  smsConsent?: boolean;
  recaptchaToken?: string;
};

async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    // Dev fallback if recaptcha secret is not configured.
    return token === 'dev-pass';
  }
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
  let body: RegisterBody;
  try {
    body = (await request.json()) as RegisterBody;
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const fullName = String(body.fullName ?? '').trim();
  const email = String(body.email ?? '').trim().toLowerCase();
  const phone = String(body.phone ?? '').trim();
  const password = String(body.password ?? '');
  const passwordConfirm = String(body.passwordConfirm ?? '');
  const kvkkConsent = Boolean(body.kvkkConsent);
  const smsConsent = Boolean(body.smsConsent);
  const recaptchaToken = String(body.recaptchaToken ?? '').trim();

  if (!fullName || !email || !phone || !password || !passwordConfirm) {
    return NextResponse.json(
      { success: false, message: 'Tüm zorunlu alanları doldurun.' },
      { status: 400 },
    );
  }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ success: false, message: 'Geçerli e-posta girin.' }, { status: 400 });
  }
  if (!/^[+\d\s()-]{10,20}$/.test(phone)) {
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
      { success: false, message: 'KVKK ve SMS izin onayları zorunludur.' },
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

  const now = new Date().toISOString();
  const { hash, salt } = hashPassword(password);
  users.push({
    id: randomUUID(),
    fullName,
    email,
    phone,
    passwordHash: hash,
    passwordSalt: salt,
    kvkkConsent,
    smsConsent,
    createdAt: now,
    updatedAt: now,
  });
  await writePublicUsers(users);

  return NextResponse.json({ success: true, message: 'Kayıt başarılı.' });
}

