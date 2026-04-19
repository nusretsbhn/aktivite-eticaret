import { notFound } from 'next/navigation';

import { readPackageTours } from '@/lib/admin-package-tours-server';

import { PackageTourPricesClient } from './prices-client';

type Props = { params: Promise<{ id: string }> };

export default async function AdminPackageTourPricesPage({ params }: Props) {
  const { id } = await params;
  const all = await readPackageTours();
  const item = all.find((x) => x.id === id);
  if (!item) notFound();
  return <PackageTourPricesClient packageTour={item} />;
}

