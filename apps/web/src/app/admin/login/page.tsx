import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';

import { AdminLoginForm } from './login-form';

export default async function AdminLoginPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (verifyAdminSession(token)) {
    redirect('/admin/dashboard');
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
      <AdminLoginForm />
    </div>
  );
}
