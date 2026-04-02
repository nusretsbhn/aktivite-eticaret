import { cookies } from 'next/headers';

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';

export async function requireAdminSession() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  return verifyAdminSession(token);
}
