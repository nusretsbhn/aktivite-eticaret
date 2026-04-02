import Link from 'next/link';
import { notFound } from 'next/navigation';

import { ActivityForm } from '@/components/admin/activity-form';
import { readActivities } from '@/lib/admin-activities-server';

type Props = { params: Promise<{ id: string }> };

export default async function DuzenleAktivitePage({ params }: Props) {
  const { id } = await params;
  const all = await readActivities();
  const activity = all.find((a) => a.id === id);
  if (!activity) {
    notFound();
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/aktiviteler"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Aktivitelere dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Aktiviteyi düzenle
        </h1>
      </div>
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900">
        <ActivityForm mode="edit" activity={activity} />
      </div>
    </div>
  );
}
