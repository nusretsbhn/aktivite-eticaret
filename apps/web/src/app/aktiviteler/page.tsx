import Link from 'next/link';

import { ActivitiesListingClient } from './activities-listing-client';

import { readActivities } from '@/lib/admin-activities-server';
import { readSettings } from '@/lib/admin-settings-server';
import { SITE_PRODUCT_ACTIVITY, isSiteProductEnabled } from '@/lib/site-product-types';

export default async function ActivitiesPage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const [activities, settings] = await Promise.all([readActivities(), readSettings()]);
  if (!isSiteProductEnabled(settings.siteManagement?.enabledSiteProducts, SITE_PRODUCT_ACTIVITY)) {
    return (
      <div className="mx-auto max-w-lg px-4 py-24 text-center">
        <h1 className="text-lg font-semibold text-zinc-900">Aktivite listesi kapalı</h1>
        <p className="mt-2 text-sm text-zinc-600">
          Bu bölüm site ayarlarında devre dışı bırakıldı.
        </p>
        <Link href="/" className="mt-6 inline-block text-sm font-semibold text-blue-600 hover:text-blue-500">
          Ana sayfaya dön
        </Link>
      </div>
    );
  }
  const sp = (await searchParams) ?? {};
  return (
    <ActivitiesListingClient
      activities={activities}
      settings={settings}
      initialQuery={{
        q: typeof sp.q === 'string' ? sp.q : '',
        date: typeof sp.date === 'string' ? sp.date : '',
        location: typeof sp.location === 'string' ? sp.location : '',
        mainCategory: typeof sp.mainCategory === 'string' ? sp.mainCategory : '',
        subCategoryId: typeof sp.subCategoryId === 'string' ? sp.subCategoryId : '',
        tagId: typeof sp.tagId === 'string' ? sp.tagId : '',
        people: typeof sp.people === 'string' ? sp.people : '',
      }}
    />
  );
}

