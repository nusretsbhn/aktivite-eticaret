import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';

export default async function AdminIndexPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifyAdminSession(token)) {
    redirect('/admin/dashboard');
  }
  redirect('/admin/login');
}
