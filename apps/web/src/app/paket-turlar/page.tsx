import Link from 'next/link';

import { PackageToursListingClient } from '@/app/paket-turlar/package-tours-listing-client';
import { readPackageTours } from '@/lib/admin-package-tours-server';
import { readPackageTourActivities } from '@/lib/admin-package-tour-activities-server';
import { readSettings } from '@/lib/admin-settings-server';
import { SITE_PRODUCT_PACKAGE_TOUR, isSiteProductEnabled } from '@/lib/site-product-types';
import { addDaysIso } from '@/lib/villa-booking-math';
import { todayIsoLocal } from '@/lib/villa-public-pricing';

export default async function PackageToursPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [settings, packageTours, activities] = await Promise.all([
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

  const sp = (await searchParams) ?? {};
  const defaultCheckIn = todayIsoLocal();
  const defaultCheckOut = addDaysIso(defaultCheckIn, 3);
  return (
    <PackageToursListingClient
      packageTours={packageTours}
      activities={activities}
      settings={settings}
      initialQuery={{
        checkIn: typeof sp.checkIn === 'string' ? sp.checkIn : defaultCheckIn,
        checkOut: typeof sp.checkOut === 'string' ? sp.checkOut : defaultCheckOut,
        adults: typeof sp.adults === 'string' ? sp.adults : '1',
        children: typeof sp.children === 'string' ? sp.children : '0',
        infants: typeof sp.infants === 'string' ? sp.infants : '0',
        concept: typeof sp.concept === 'string' ? sp.concept : '',
      }}
    />
  );
}

