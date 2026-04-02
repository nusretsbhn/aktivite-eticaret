import { notFound } from 'next/navigation';

import { readActivities } from '@/lib/admin-activities-server';

import { PricesClient } from './prices-client';

type Props = { params: Promise<{ id: string }> };

export default async function FiyatPage({ params }: Props) {
  const { id } = await params;
  const all = await readActivities();
  if (!all.some((a) => a.id === id)) {
    notFound();
  }
  return <PricesClient activityId={id} />;
}
