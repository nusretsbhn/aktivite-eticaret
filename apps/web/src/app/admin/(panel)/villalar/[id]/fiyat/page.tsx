import { notFound } from 'next/navigation';

import { VillaEditSubnav } from '@/components/admin/villa-edit-subnav';
import { readVillas } from '@/lib/admin-villas-server';

import { VillaPricesClient } from './villa-prices-client';

type Props = { params: Promise<{ id: string }> };

export default async function VillaFiyatPage({ params }: Props) {
  const { id } = await params;
  const all = await readVillas();
  if (!all.some((v) => v.id === id)) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <VillaEditSubnav villaId={id} />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <VillaPricesClient villaId={id} />
      </div>
    </div>
  );
}
