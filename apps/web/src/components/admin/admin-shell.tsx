'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { AdminNotificationBell } from '@/components/admin/admin-notification-bell';
import { AdminLogoutButton } from '@/components/admin/logout-button';
import {
  SITE_PRODUCT_ACTIVITY,
  SITE_PRODUCT_PACKAGE_TOUR,
  SITE_PRODUCT_VILLA_RENTAL,
  type SiteProductType,
} from '@/lib/site-product-types';

const SUMMARY_POLL_MS = 15_000;

type NavItem = {
  href: string;
  label: string;
  /** Tanımlıysa bu ürün tipi seçili değilse menüde gösterilmez */
  requiresProduct?: SiteProductType;
};

const nav: NavItem[] = [
  { href: '/admin/dashboard', label: 'Dashboard' },
  { href: '/admin/siparisler', label: 'Siparişler' },
  { href: '/admin/sor-sat-talepleri', label: 'Sor-Sat Talepleri' },
  { href: '/admin/villa-talepleri', label: 'Villa Talepleri', requiresProduct: SITE_PRODUCT_VILLA_RENTAL },
  {
    href: '/admin/acenta-rezervasyonlari',
    label: 'Acenta Rezervasyonları',
    requiresProduct: SITE_PRODUCT_VILLA_RENTAL,
  },
  { href: '/admin/siparisler/iptal-iade', label: 'İptal / İade Yönetimi' },
  { href: '/admin/aktiviteler', label: 'Aktiviteler', requiresProduct: SITE_PRODUCT_ACTIVITY },
  {
    href: '/admin/ana-sayfa-aktiviteler',
    label: 'Ana Sayfa Aktiviteleri',
    requiresProduct: SITE_PRODUCT_ACTIVITY,
  },
  {
    href: '/admin/ana-sayfa-aktivite-widgetlari',
    label: 'Ana Sayfa Widget Görselleri',
    requiresProduct: SITE_PRODUCT_ACTIVITY,
  },
  { href: '/admin/villalar', label: 'Villalar', requiresProduct: SITE_PRODUCT_VILLA_RENTAL },
  { href: '/admin/paket-turlar', label: 'Paket Turlar', requiresProduct: SITE_PRODUCT_PACKAGE_TOUR },
  { href: '/admin/paket-tur-talepleri', label: 'Paket Tur Talepleri', requiresProduct: SITE_PRODUCT_PACKAGE_TOUR },
  {
    href: '/admin/paket-tur-aktiviteleri',
    label: 'Paket Tur Aktiviteleri',
    requiresProduct: SITE_PRODUCT_PACKAGE_TOUR,
  },
  { href: '/admin/paketler', label: 'Paketler', requiresProduct: SITE_PRODUCT_ACTIVITY },
  { href: '/admin/blog', label: 'Blog Yönetimi' },
  { href: '/admin/uyeler', label: 'Üye Yönetimi' },
  { href: '/admin/kullanicilar', label: 'Kullanıcı Yönetimi' },
  { href: '/admin/sss', label: 'S.S.S. Yönetimi' },
  { href: '/admin/sozlesmeler', label: 'Sözleşme Yönetimi' },
  { href: '/admin/sayfa-duzeni', label: 'Sayfa Düzeni' },
  { href: '/admin/ayarlar', label: 'Ayarlar' },
];

function MenuIcon({ open }: { open: boolean }) {
  return (
    <svg
      className="h-5 w-5"
      fill="none"
      stroke="currentColor"
      viewBox="0 0 24 24"
      aria-hidden
    >
      {open ? (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      ) : (
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
      )}
    </svg>
  );
}

export function AdminShell({
  email,
  children,
  enabledSiteProducts,
}: {
  email: string;
  children: React.ReactNode;
  enabledSiteProducts: SiteProductType[];
}) {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [counts, setCounts] = useState({ newOrder: 0, cancelRequest: 0, totalUnread: 0 });

  const refreshSummary = useCallback(async () => {
    try {
      const res = await fetch('/api/admin/notifications?summary=1', { credentials: 'include', cache: 'no-store' });
      if (!res.ok) return;
      const data = (await res.json()) as {
        counts?: { newOrder?: number; cancelRequest?: number };
        totalUnread?: number;
      };
      setCounts({
        newOrder: data.counts?.newOrder ?? 0,
        cancelRequest: data.counts?.cancelRequest ?? 0,
        totalUnread: typeof data.totalUnread === 'number' ? data.totalUnread : 0,
      });
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void refreshSummary();
    const t = setInterval(() => void refreshSummary(), SUMMARY_POLL_MS);
    return () => clearInterval(t);
  }, [refreshSummary]);

  return (
    <div className="min-h-[100dvh] bg-zinc-100 dark:bg-zinc-950">
      {open && (
        <button
          type="button"
          className="fixed inset-0 z-40 bg-black/60 lg:hidden"
          aria-label="Menüyü kapat"
          onClick={() => setOpen(false)}
        />
      )}

      <aside
        className={`fixed left-0 top-0 z-50 flex h-full w-64 flex-col border-r border-zinc-200 bg-white transition-transform dark:border-zinc-800 dark:bg-zinc-900 lg:translate-x-0 ${
          open ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="border-b border-zinc-200 px-4 py-4 dark:border-zinc-800">
          <p className="text-xs font-medium uppercase tracking-wide text-zinc-500 dark:text-zinc-400">
            Bodrum Aktivite
          </p>
          <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">Yönetim paneli</p>
        </div>
        <nav className="flex flex-1 flex-col gap-1 p-3">
          {nav
            .filter((item) => !item.requiresProduct || enabledSiteProducts.includes(item.requiresProduct))
            .map((item) => {
            const isActive = (() => {
              if (item.href === '/admin/dashboard') return pathname === '/admin/dashboard';
              if (item.href === '/admin/siparisler') return pathname === '/admin/siparisler';
              if (item.href === '/admin/sor-sat-talepleri') return pathname.startsWith('/admin/sor-sat-talepleri');
              if (item.href === '/admin/villa-talepleri') return pathname.startsWith('/admin/villa-talepleri');
              if (item.href === '/admin/acenta-rezervasyonlari')
                return pathname.startsWith('/admin/acenta-rezervasyonlari');
              if (item.href === '/admin/siparisler/iptal-iade')
                return pathname.startsWith('/admin/siparisler/iptal-iade');
              if (item.href === '/admin/villalar') return pathname.startsWith('/admin/villalar');
              if (item.href === '/admin/sayfa-duzeni') return pathname.startsWith('/admin/sayfa-duzeni');
              if (item.href === '/admin/ana-sayfa-aktiviteler')
                return pathname.startsWith('/admin/ana-sayfa-aktiviteler');
              if (item.href === '/admin/ana-sayfa-aktivite-widgetlari')
                return pathname.startsWith('/admin/ana-sayfa-aktivite-widgetlari');
              return pathname === item.href || pathname.startsWith(`${item.href}/`);
            })();

            const badge =
              item.href === '/admin/siparisler'
                ? counts.newOrder
                : item.href === '/admin/siparisler/iptal-iade'
                  ? counts.cancelRequest
                  : 0;

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setOpen(false)}
                className={`flex items-center justify-between gap-2 rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                    : 'text-zinc-700 hover:bg-zinc-100 dark:text-zinc-300 dark:hover:bg-zinc-800'
                }`}
              >
                <span>{item.label}</span>
                {badge > 0 && (
                  <span className="min-w-[1.25rem] shrink-0 rounded-full bg-red-600 px-1.5 text-center text-[10px] font-bold leading-5 text-white">
                    {badge > 99 ? '99+' : badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>
      </aside>

      <div className="lg:pl-64">
        <header className="sticky top-0 z-30 flex items-center justify-between gap-2 border-b border-zinc-200 bg-white/90 px-3 py-3 backdrop-blur sm:gap-3 sm:px-4 dark:border-zinc-800 dark:bg-zinc-900/90">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="rounded-lg border border-zinc-300 p-2 text-zinc-700 lg:hidden dark:border-zinc-600 dark:text-zinc-200"
              onClick={() => setOpen((v) => !v)}
              aria-expanded={open}
              aria-label={open ? 'Menüyü kapat' : 'Menüyü aç'}
            >
              <MenuIcon open={open} />
            </button>
            <div className="min-w-0 lg:hidden">
              <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">Bodrum Aktivite</p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3">
            <span className="hidden max-w-[200px] truncate text-sm text-zinc-600 sm:inline dark:text-zinc-400">
              {email}
            </span>
            <AdminNotificationBell totalUnread={counts.totalUnread} onMarkedRead={refreshSummary} />
            <AdminLogoutButton />
          </div>
        </header>

        <main className="mx-auto max-w-6xl px-3 py-6 sm:px-4 sm:py-8">{children}</main>
      </div>
    </div>
  );
}
