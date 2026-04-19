import { notFound } from 'next/navigation';

import { readPackageTourActivities } from '@/lib/admin-package-tour-activities-server';

import { PackageTourActivityPricesClient } from './prices-client';

type Props = { params: Promise<{ id: string }> };

export default async function AdminPackageTourActivityPricesPage({ params }: Props) {
  const { id } = await params;
  const all = await readPackageTourActivities();
  const activity = all.find((x) => x.id === id);
  if (!activity) notFound();
  return <PackageTourActivityPricesClient activity={activity} />;
}

