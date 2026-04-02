import { notFound } from 'next/navigation';

import { readActivities } from '@/lib/admin-activities-server';

import { AvailabilityClient } from './availability-client';

type Props = { params: Promise<{ id: string }> };

export default async function MusaitlikPage({ params }: Props) {
  const { id } = await params;
  const all = await readActivities();
  if (!all.some((a) => a.id === id)) {
    notFound();
  }
  return <AvailabilityClient activityId={id} />;
}
