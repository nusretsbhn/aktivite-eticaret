import { NextResponse } from 'next/server';

import {
  PUBLIC_USER_SESSION_COOKIE,
  signPublicUserSession,
} from '@/lib/public-user-session';
import { readPublicUsers, verifyPassword } from '@/lib/public-users-server';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek.' }, { status: 400 });
  }

  const email = String(body.email ?? '').trim().toLowerCase();
  const password = String(body.password ?? '');
  if (!email || !password) {
    return NextResponse.json({ success: false, message: 'E-posta ve şifre zorunlu.' }, { status: 400 });
  }

  const users = await readPublicUsers();
  const user = users.find((u) => u.email === email);
  if (!user || !verifyPassword(password, user.passwordHash, user.passwordSalt)) {
    return NextResponse.json({ success: false, message: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }

  let token: string;
  try {
    token = signPublicUserSession(user.id, user.email);
  } catch {
    return NextResponse.json(
      { success: false, message: 'Sunucu oturum anahtarı yapılandırılmamış.' },
      { status: 500 },
    );
  }

  const res = NextResponse.json({
    success: true,
    user: { id: user.id, fullName: user.fullName, email: user.email, phone: user.phone },
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
