import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminRoleGuard } from '@/components/admin/admin-role-guard';
import { AdminShell } from '@/components/admin/admin-shell';
import { resolveAdminSession } from '@/lib/admin-api-auth';
import { readSettings } from '@/lib/admin-settings-server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';
import { normalizeEnabledSiteProducts } from '@/lib/site-product-types';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  if (!verifyAdminSession(token)) {
    redirect('/admin/login');
  }

  const session = await resolveAdminSession();
  if (!session) {
    redirect('/admin/login');
  }

  const settings = await readSettings();
  const enabledSiteProducts = normalizeEnabledSiteProducts(settings.siteManagement?.enabledSiteProducts);

  return (
    <AdminShell email={session.email} role={session.role} enabledSiteProducts={enabledSiteProducts}>
      <AdminRoleGuard role={session.role}>{children}</AdminRoleGuard>
    </AdminShell>
  );
}
