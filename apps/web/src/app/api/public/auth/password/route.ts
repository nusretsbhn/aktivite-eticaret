import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import { PUBLIC_USER_SESSION_COOKIE, verifyPublicUserSession } from '@/lib/public-user-session';
import { hashPassword, readPublicUsers, validatePasswordPolicy, verifyPassword, writePublicUsers } from '@/lib/public-users-server';

export async function POST(request: Request) {
  const cookieStore = await cookies();
  const token = cookieStore.get(PUBLIC_USER_SESSION_COOKIE)?.value;
  const session = verifyPublicUserSession(token);
  if (!session) {
    return NextResponse.json({ error: 'Oturum gerekli.' }, { status: 401 });
  }

  let body: { currentPassword?: string; newPassword?: string };
  try {
    body = (await request.json()) as { currentPassword?: string; newPassword?: string };
  } catch {
    return NextResponse.json({ error: 'Geçersiz JSON' }, { status: 400 });
  }

  const currentPassword = String(body.currentPassword ?? '');
  const newPassword = String(body.newPassword ?? '');
  if (!currentPassword || !newPassword) {
    return NextResponse.json({ error: 'Mevcut ve yeni şifre zorunlu.' }, { status: 400 });
  }

  const policy = validatePasswordPolicy(newPassword);
  if (policy) {
    return NextResponse.json({ error: policy }, { status: 400 });
  }

  const users = await readPublicUsers();
  const idx = users.findIndex((u) => u.id === session.userId && u.email === session.email);
  if (idx < 0) {
    return NextResponse.json({ error: 'Kullanıcı bulunamadı.' }, { status: 404 });
  }

  const u = users[idx];
  if (!verifyPassword(currentPassword, u.passwordHash, u.passwordSalt)) {
    return NextResponse.json({ error: 'Mevcut şifre hatalı.' }, { status: 400 });
  }

  const { hash, salt } = hashPassword(newPassword);
  const now = new Date().toISOString();
  users[idx] = {
    ...u,
    passwordHash: hash,
    passwordSalt: salt,
    updatedAt: now,
  };
  await writePublicUsers(users);

  return NextResponse.json({ success: true });
}
