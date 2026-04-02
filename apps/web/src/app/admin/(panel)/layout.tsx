import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

import { AdminShell } from '@/components/admin/admin-shell';
import { readSettings } from '@/lib/admin-settings-server';
import { ADMIN_SESSION_COOKIE, verifyAdminSession } from '@/lib/admin-session';
import { normalizeEnabledSiteProducts } from '@/lib/site-product-types';

export default async function AdminPanelLayout({ children }: { children: React.ReactNode }) {
  const cookieStore = await cookies();
  const token = cookieStore.get(ADMIN_SESSION_COOKIE)?.value;
  const session = verifyAdminSession(token);
  if (!session) {
    redirect('/admin/login');
  }

  const settings = await readSettings();
  const enabledSiteProducts = normalizeEnabledSiteProducts(settings.siteManagement?.enabledSiteProducts);

  return (
    <AdminShell email={session.email} enabledSiteProducts={enabledSiteProducts}>
      {children}
    </AdminShell>
  );
}
