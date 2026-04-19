import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PackageTourDetailView } from '@/components/site/package-tour-detail-view';
import { readPackageTourActivities } from '@/lib/admin-package-tour-activities-server';
import { readPackageTours } from '@/lib/admin-package-tours-server';
import { readSettings } from '@/lib/admin-settings-server';
import { SITE_PRODUCT_PACKAGE_TOUR, isSiteProductEnabled } from '@/lib/site-product-types';

type Props = {
  params: Promise<{ id: string }>;
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
};

export default async function PackageTourDetailPage({ params, searchParams }: Props) {
  const [{ id }, sp, settings, items, activities] = await Promise.all([
    params,
    searchParams ?? Promise.resolve({} as Record<string, string | string[] | undefined>),
    readSettings(),
    readPackageTours(),
    readPackageTourActivities(),
  ]);
  if (!isSiteProductEnabled(settings.siteManagement?.enabledSiteProducts, SITE_PRODUCT_PACKAGE_TOUR)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Paket tur kapalı</h1>
        <p className="mt-2 text-sm text-zinc-600">Bu bölüm site ayarlarında devre dışı bırakıldı.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-500">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const item = items.find((x) => x.id === id && x.isActive);
  if (!item) notFound();
  return (
    <PackageTourDetailView
      packageTour={item}
      activities={activities}
      settings={settings}
      searchInfo={{
        checkIn: typeof sp.checkIn === 'string' ? sp.checkIn : '',
        checkOut: typeof sp.checkOut === 'string' ? sp.checkOut : '',
        adults: typeof sp.adults === 'string' ? sp.adults : '1',
        children: typeof sp.children === 'string' ? sp.children : '0',
        infants: typeof sp.infants === 'string' ? sp.infants : '0',
      }}
    />
  );
}

