import { notFound } from 'next/navigation';

import { readActivities } from '@/lib/admin-activities-server';

import { GalleryClient } from './gallery-client';

type Props = { params: Promise<{ id: string }> };

export default async function GaleriPage({ params }: Props) {
  const { id } = await params;
  const all = await readActivities();
  if (!all.some((a) => a.id === id)) {
    notFound();
  }
  return <GalleryClient activityId={id} />;
}
