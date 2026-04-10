import { NextResponse } from 'next/server';

import { findAdminUserByCredentials } from '@/lib/admin-users-server';
import { ADMIN_SESSION_COOKIE, signAdminSession } from '@/lib/admin-session';

export async function POST(request: Request) {
  let body: { email?: string; password?: string };
  try {
    body = (await request.json()) as { email?: string; password?: string };
  } catch {
    return NextResponse.json({ success: false, message: 'Geçersiz istek' }, { status: 400 });
  }

  const email = (body.email ?? '').trim().toLowerCase();
  const password = body.password ?? '';

  const adminUser = await findAdminUserByCredentials(email, password);
  if (adminUser) {
    const token = signAdminSession(adminUser.email);
    const res = NextResponse.json({ success: true });
    res.cookies.set(ADMIN_SESSION_COOKIE, token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      path: '/',
      maxAge: 7 * 24 * 60 * 60,
    });
    return res;
  }

  const expectedEmail = (process.env.ADMIN_PANEL_EMAIL ?? '').trim().toLowerCase();
  const expectedPassword = process.env.ADMIN_PANEL_PASSWORD ?? '';

  if (!expectedEmail || !expectedPassword || !process.env.ADMIN_SESSION_SECRET) {
    return NextResponse.json(
      { success: false, message: 'Sunucu yapılandırması eksik (env).' },
      { status: 500 },
    );
  }

  if (email !== expectedEmail || password !== expectedPassword) {
    return NextResponse.json({ success: false, message: 'E-posta veya şifre hatalı.' }, { status: 401 });
  }

  const token = signAdminSession(email);
  const res = NextResponse.json({ success: true });
  res.cookies.set(ADMIN_SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: 7 * 24 * 60 * 60,
  });
  return res;
}
