import { randomUUID } from 'node:crypto';

import { NextResponse } from 'next/server';

import { hashOtpCode, removePendingByEmail, findPendingByEmail } from '@/lib/register-pending-server';
import {
  PUBLIC_USER_SESSION_COOKIE,
  signPublicUserSession,
} from '@/lib/public-user-session';
import { readPublicUsers, writePublicUsers } from '@/lib/public-users-server';
import type { PublicUser } from '@/lib/public-users-server';

export async function POST(request: Request) {
  let body: { email?: string; code?: string };
  try {
    body = (await request.json()) as { email?: string; code?: string };
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const code = String(body.code ?? '').replace(/\D/g, '').slice(0, 6);
  if (!email || code.length !== 6) {
    return NextResponse.json({ success: false, message: 'E-posta ve 6 haneli kod zorunludur.' }, { status: 400 });
  }

  const pending = await findPendingByEmail(email);
  if (!pending) {
    return NextResponse.json(
      { success: false, message: 'Geçerli bir doğrulama oturumu yok. Kaydı yeniden başlatın.' },
      { status: 400 },
    );
  }

  if (new Date(pending.expiresAt).getTime() < Date.now()) {
    await removePendingByEmail(email);
    return NextResponse.json(
      { success: false, message: 'Kodun süresi doldu. Yeni kod isteyin.' },
      { status: 400 },
    );
  }

  const expected = hashOtpCode(pending.id, email, code);
  if (expected !== pending.codeHash) {
    return NextResponse.json({ success: false, message: 'Kod hatalı.' }, { status: 400 });
  }

  const users = await readPublicUsers();
  if (users.some((u) => u.email === email)) {
    await removePendingByEmail(email);
    return NextResponse.json(
      { success: false, message: 'Bu e-posta zaten kayıtlı. Giriş yapın.' },
      { status: 409 },
    );
  }

  const fullName = `${pending.firstName} ${pending.lastName}`.trim();
  const now = new Date().toISOString();
  const newUser: PublicUser = {
    id: randomUUID(),
    fullName,
    email,
    phone: pending.phone,
    passwordHash: pending.passwordHash,
    passwordSalt: pending.passwordSalt,
    kvkkConsent: pending.kvkkConsent,
    smsConsent: pending.smsConsent,
    createdAt: now,
    updatedAt: now,
  };

  users.push(newUser);
  await writePublicUsers(users);
  await removePendingByEmail(email);

  let redirect = '/hesap';
  if (pending.villaSlug && pending.checkIn && pending.checkOut) {
    const q = new URLSearchParams({
      villa: pending.villaSlug,
      checkIn: pending.checkIn,
      checkOut: pending.checkOut,
      guests: String(pending.guests ?? 1),
    });
    redirect = `/villalar/on-rezervasyon?${q.toString()}`;
  }

  let token: string;
  try {
    token = signPublicUserSession(newUser.id, newUser.email);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Sunucu oturum anahtarı yapılandırılmamış.' },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    success: true,
    redirect,
    user: { id: newUser.id, fullName: newUser.fullName, email: newUser.email, phone: newUser.phone },
  });
  res.cookies.set(PUBLIC_USER_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
