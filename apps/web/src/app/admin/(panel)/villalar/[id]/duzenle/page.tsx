import Link from 'next/link';
import { notFound } from 'next/navigation';

import { VillaEditSubnav } from '@/components/admin/villa-edit-subnav';
import { VillaForm } from '@/components/admin/villa-form';
import { readVillas } from '@/lib/admin-villas-server';

type Props = { params: Promise<{ id: string }> };

export default async function DuzenleVillaPage({ params }: Props) {
  const { id } = await params;
  const all = await readVillas();
  const villa = all.find((v) => v.id === id);
  if (!villa) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/villalar"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Villalara dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Villayı düzenle</h1>
      </div>
      <VillaEditSubnav villaId={id} />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <VillaForm mode="edit" villa={villa} />
      </div>
    </div>
  );
}
