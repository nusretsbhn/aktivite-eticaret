import { notFound } from 'next/navigation';

import { readPackageTours } from '@/lib/admin-package-tours-server';

import { PackageTourGalleryClient } from './gallery-client';

type Props = { params: Promise<{ id: string }> };

export default async function AdminPackageTourGalleryPage({ params }: Props) {
  const { id } = await params;
  const all = await readPackageTours();
  const item = all.find((x) => x.id === id);
  if (!item) notFound();
  return <PackageTourGalleryClient packageTourId={item.id} />;
}

