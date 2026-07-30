import { redirect } from 'next/navigation';

import { resolveAdminSession } from '@/lib/admin-api-auth';

import { AdminLoginForm } from './login-form';

export default async function AdminLoginPage() {
  const session = await resolveAdminSession();
  if (session) {
    redirect(session.role === 'alt_bayi' ? '/admin/villalar' : '/admin/dashboard');
  }

  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center bg-zinc-100 px-4 py-12 dark:bg-zinc-950">
      <AdminLoginForm />
    </div>
  );
}
