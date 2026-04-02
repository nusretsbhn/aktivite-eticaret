import Link from 'next/link';

import { VillasListingClient } from '@/app/villalar/villas-listing-client';
import { readVillas } from '@/lib/admin-villas-server';
import { readSettings } from '@/lib/admin-settings-server';
import { SITE_PRODUCT_VILLA_RENTAL, isSiteProductEnabled } from '@/lib/site-product-types';

export default async function VillalarPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [settings, villas] = await Promise.all([readSettings(), readVillas()]);
  if (!isSiteProductEnabled(settings.siteManagement?.enabledSiteProducts, SITE_PRODUCT_VILLA_RENTAL)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Villa kiralama kapalı</h1>
        <p className="mt-2 text-sm text-zinc-600">Bu bölüm site ayarlarında devre dışı bırakıldı.</p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-500">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }

  const sp = (await searchParams) ?? {};
  return (
    <VillasListingClient
      villas={villas}
      settings={settings}
      initialQuery={{
        region: typeof sp.region === 'string' ? sp.region : '',
        checkIn: typeof sp.checkIn === 'string' ? sp.checkIn : '',
        checkOut: typeof sp.checkOut === 'string' ? sp.checkOut : '',
        guests: typeof sp.guests === 'string' ? sp.guests : '',
      }}
    />
  );
}
