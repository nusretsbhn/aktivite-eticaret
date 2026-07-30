import { createHmac, timingSafeEqual } from 'node:crypto';

import type { AdminRole } from '@/lib/admin-users-server';

export const ADMIN_SESSION_COOKIE = 'admin_session';

export type AdminSessionPayload = {
  email: string;
  exp: number;
  role?: AdminRole;
  userId?: string;
};

export function signAdminSession(input: {
  email: string;
  role: AdminRole;
  userId: string;
}): string {
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) {
    throw new Error('ADMIN_SESSION_SECRET is not set');
  }
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({
      email: input.email,
      role: input.role,
      userId: input.userId,
      exp,
    } satisfies AdminSessionPayload),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyAdminSession(token: string | undefined): AdminSessionPayload | null {
  if (!token) return null;
  const secret = process.env.ADMIN_SESSION_SECRET;
  if (!secret) return null;
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payload, sig] = parts;
  if (!payload || !sig) return null;
  const expectedSig = createHmac('sha256', secret).update(payload).digest('hex');
  const a = Buffer.from(sig, 'hex');
  const b = Buffer.from(expectedSig, 'hex');
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as AdminSessionPayload;
    if (typeof data.exp !== 'number' || typeof data.email !== 'string') return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
