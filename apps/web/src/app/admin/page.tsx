import { redirect } from 'next/navigation';

import { resolveAdminSession } from '@/lib/admin-api-auth';

export default async function AdminIndexPage() {
  const session = await resolveAdminSession();
  if (session) {
    redirect(session.role === 'alt_bayi' ? '/admin/villalar' : '/admin/dashboard');
  }
  redirect('/admin/login');
}
