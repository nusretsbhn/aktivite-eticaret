import Link from 'next/link';

import { PackageForm } from '@/components/admin/package-form';

export default function YeniPaketPage() {
  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/paketler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Paketlere dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Yeni paket</h1>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <PackageForm mode="create" />
      </div>
    </div>
  );
}

