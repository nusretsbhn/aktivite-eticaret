import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { readPublicUsers, writePublicUsers } from '@/lib/public-users-server';

export async function PATCH(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  let body: { fullName?: string; phone?: string };
  try {
    body = (await request.json()) as { fullName?: string; phone?: string };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const fullName = String(body.fullName ?? '').trim();
  const phone = String(body.phone ?? '').trim();
  if (!fullName || !phone) {
    return NextResponse.json({ error: 'Ad soyad ve telefon zorunlu.' }, { status: 400 });
  }

  const users = await readPublicUsers();
  const idx = users.findIndex((u) => u.id === session.userId && u.email === session.email);
  if (idx < 0) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  const now = new Date().toISOString();
  users[idx] = {
    ...users[idx],
    fullName,
    phone,
    updatedAt: now,
  };
  await writePublicUsers(users);

  return NextResponse.json({
    user: {
      id: users[idx].id,
      fullName: users[idx].fullName,
      email: users[idx].email,
      phone: users[idx].phone,
    },
  });
}
