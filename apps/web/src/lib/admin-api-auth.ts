import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

import {
  ADMIN_SESSION_COOKIE,
  type AdminSessionPayload,
  verifyAdminSession,
} from '@/lib/admin-session';
import { type AdminRole, normalizeAdminRole, readAdminUsers } from '@/lib/admin-users-server';

export type ResolvedAdminSession = {
  email: string;
  exp: number;
  role: AdminRole;
  userId: string;
};

export async function requireAdminSession(opts?: {
  allowRoles?: AdminRole[];
}): Promise<ResolvedAdminSession | null> {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const raw = verifyAdminSession(token);
  if (!raw) return null;

  const email = raw.email.trim().toLowerCase();
  const users = await readAdminUsers();
  const user = users.find((u) => u.email === email && u.isActive);

  let session: ResolvedAdminSession;
  if (user) {
    session = {
      email: user.email,
      exp: raw.exp,
      role: normalizeAdminRole(user.role),
      userId: user.id,
    };
  } else {
    const expectedEmail = (process.env.ADMIN_PANEL_EMAIL ?? '').trim().toLowerCase();
    if (!expectedEmail || email !== expectedEmail) return null;
    session = {
      email,
      exp: raw.exp,
      role: 'admin',
      userId: 'env-admin',
    };
  }

  const allowed = opts?.allowRoles ?? (['admin'] as AdminRole[]);
  if (!allowed.includes(session.role)) return null;
  return session;
}

export function unauthorized() {
  return NextResponse.json({ error: 'Yetkisiz' }, { status: 401 });
}

export function forbidden(message = 'Bu işlem için yetkiniz yok.') {
  return NextResponse.json({ error: message }, { status: 403 });
}

export function isAltBayi(session: Pick<ResolvedAdminSession, 'role'>): boolean {
  return session.role === 'alt_bayi';
}

export function canManageVilla(
  session: Pick<ResolvedAdminSession, 'role' | 'userId'>,
  villa: { createdByUserId?: string },
): boolean {
  if (session.role === 'admin') return true;
  return Boolean(session.userId && villa.createdByUserId === session.userId);
}

/** Layout / sayfa yönlendirmeleri için oturumu çözümler (rol kısıtı yok). */
export async function resolveAdminSession(): Promise<ResolvedAdminSession | null> {
  return requireAdminSession({ allowRoles: ['admin', 'alt_bayi'] });
}

export type { AdminSessionPayload };
