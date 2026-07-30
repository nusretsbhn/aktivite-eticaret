'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect } from 'react';

import type { AdminRole } from '@/lib/admin-users-server';

export function AdminRoleGuard({
  role,
  children,
}: {
  role: AdminRole;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const router = useRouter();

  useEffect(() => {
    if (role !== 'alt_bayi') return;
    if (pathname.startsWith('/admin/villalar')) return;
    router.replace('/admin/villalar');
  }, [pathname, role, router]);

  if (role === 'alt_bayi' && !pathname.startsWith('/admin/villalar')) {
    return (
      <p className="text-sm text-zinc-500 dark:text-zinc-400">Villalar sayfasına yönlendiriliyor…</p>
    );
  }

  return children;
}
