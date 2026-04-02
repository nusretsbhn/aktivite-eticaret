import { NextResponse } from 'next/server';

import { PUBLIC_USER_SESSION_COOKIE } from '@/lib/public-user-session';

export async function POST() {
  const res = NextResponse.json({ success: true });
  res.cookies.set(PUBLIC_USER_SESSION_COOKIE, '', {
    httpOnly: true,
    sameSite: 'lax',
    path: '/',
    maxAge: 0,
    secure: process.env.NODE_ENV === 'production',
  });
  return res;
}
