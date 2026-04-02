import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { readPublicUsers } from '@/lib/public-users-server';

export async function GET() {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
  if (!session) {
    return NextResponse.json({ user: null });
  }
  const users = await readPublicUsers();
  const user = users.find((u) => u.id === session.userId && u.email === session.email);
  if (!user) {
    return NextResponse.json({ user: null });
  }
  return NextResponse.json({
    user: {
      id: user.id,
      fullName: user.fullName,
      email: user.email,
      phone: user.phone,
      kvkkConsent: user.kvkkConsent,
      smsConsent: user.smsConsent,
    },
  });
}
