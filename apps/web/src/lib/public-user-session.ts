import { createHmac, timingSafeEqual } from 'node:crypto';

export const PUBLIC_USER_SESSION_COOKIE = 'public_user_session';

type SessionPayload = {
  userId: string;
  email: string;
  exp: number;
};

function sessionSecret(): string | null {
  return process.env.PUBLIC_USER_SESSION_SECRET || process.env.ADMIN_SESSION_SECRET || null;
}

export function signPublicUserSession(userId: string, email: string): string {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error('PUBLIC_USER_SESSION_SECRET (veya ADMIN_SESSION_SECRET) tanımlı değil.');
  }
  const exp = Date.now() + 7 * 24 * 60 * 60 * 1000;
  const payload = Buffer.from(
    JSON.stringify({ userId, email: email.toLowerCase(), exp } satisfies SessionPayload),
  ).toString('base64url');
  const sig = createHmac('sha256', secret).update(payload).digest('hex');
  return `${payload}.${sig}`;
}

export function verifyPublicUserSession(token: string | undefined): SessionPayload | null {
  if (!token) return null;
  const secret = sessionSecret();
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
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as SessionPayload;
    if (typeof data.exp !== 'number' || typeof data.email !== 'string' || typeof data.userId !== 'string')
      return null;
    if (data.exp < Date.now()) return null;
    return data;
  } catch {
    return null;
  }
}
