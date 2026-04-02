import Link from 'next/link';
import { notFound } from 'next/navigation';

import { PackageForm } from '@/components/admin/package-form';
import { readPackages } from '@/lib/admin-packages-server';

type Props = { params: Promise<{ id: string }> };

export default async function DuzenlePaketPage({ params }: Props) {
  const { id } = await params;
  const all = await readPackages();
  const pkg = all.find((p) => p.id === id);
  if (!pkg) notFound();

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/paketler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Paketlere dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Paketi düzenle</h1>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <PackageForm mode="edit" pkg={pkg} />
      </div>
    </div>
  );
}

