import Link from 'next/link';

export default function AdminDashboardPage() {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
      <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50">Dashboard</h2>
      <p className="mt-2 text-zinc-600 dark:text-zinc-400">
        Hoş geldiniz. Buradan aktiviteler, rezervasyonlar ve ödemeler için menüleri ekleyeceğiz.
      </p>
      <div className="mt-8 grid gap-4 sm:grid-cols-2">
        <Link
          href="/"
          className="rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-center text-sm font-medium text-zinc-800 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-800/50 dark:text-zinc-200 dark:hover:bg-zinc-800"
        >
          Siteye dön
        </Link>
        <Link
          href="/admin/aktiviteler"
          className="rounded-xl border border-zinc-900 bg-zinc-900 px-4 py-3 text-center text-sm font-medium text-white transition hover:bg-zinc-800 dark:border-zinc-100 dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-zinc-200"
        >
          Aktiviteler
        </Link>
      </div>
    </div>
  );
}
