'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { AdminPackageTourActivity } from '@/types/admin-package-tour-activity';

type ViewMode = 'card' | 'list';
const VIEW_KEY = 'admin_package_tour_activities_view';

function coverOf(item: AdminPackageTourActivity): string | null {
  return item.gallery.find((g) => g.isCover)?.url ?? item.gallery[0]?.url ?? null;
}

export function PackageTourActivitiesIndexClient() {
  const [rows, setRows] = useState<AdminPackageTourActivity[]>([]);
  const [view, setView] = useState<ViewMode>('card');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/package-tour-activities', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { activities?: AdminPackageTourActivity[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(Array.isArray(data.activities) ? data.activities : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === 'card' || v === 'list') setView(v);
    } catch {}
    void load();
  }, [load]);

  async function toggleActive(item: AdminPackageTourActivity) {
    const res = await fetch(`/api/admin/package-tour-activities/${item.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !item.isActive }),
    });
    if (!res.ok) {
      alert('Durum güncellenemedi');
      return;
    }
    void load();
  }

  const btn =
    'inline-flex min-h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium sm:min-h-9 sm:text-sm';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Paket Tur Aktiviteleri</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
          <div className="inline-flex w-full rounded-lg border border-zinc-300 p-0.5 sm:w-auto dark:border-zinc-600">
            <button type="button" onClick={() => { setView('card'); localStorage.setItem(VIEW_KEY, 'card'); }} className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium ${view === 'card' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}`}>Kart</button>
            <button type="button" onClick={() => { setView('list'); localStorage.setItem(VIEW_KEY, 'list'); }} className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium ${view === 'list' ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900' : 'text-zinc-600 dark:text-zinc-400'}`}>Liste</button>
          </div>
          <Link href="/admin/paket-tur-aktiviteleri/yeni" className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:min-h-10 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900">
            Yeni Ekle
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>}
      {error && <p className="rounded-lg border border-red-300 bg-red-50 px-3 py-2 text-sm text-red-700 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">{error}</p>}
      {!loading && rows.length === 0 && <p className="text-sm text-zinc-500 dark:text-zinc-400">Henüz kayıt yok.</p>}

      {view === 'card' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => (
            <article key={item.id} className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {coverOf(item) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={coverOf(item) ?? ''} alt="" className="mb-3 aspect-[16/9] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700" />
              ) : (
                <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">Kapak yok</div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.activityId}</p>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{item.name}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.location} · {item.category}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/paket-tur-aktiviteleri/${item.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>Düzenle</Link>
                <Link href={`/admin/paket-tur-aktiviteleri/${item.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>Fiyat</Link>
                <button type="button" onClick={() => void toggleActive(item)} className={`${btn} border-zinc-900 dark:border-zinc-100`}>{item.isActive ? 'Pasif yap' : 'Aktif yap'}</button>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-[820px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Kod</th><th className="px-4 py-3 font-medium">Ad</th><th className="px-4 py-3 font-medium">Konum</th><th className="px-4 py-3 font-medium">Kategori</th><th className="px-4 py-3 font-medium">Durum</th><th className="px-4 py-3 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.activityId}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{item.name}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.location}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.category}</td>
                  <td className="px-4 py-3">{item.isActive ? 'Aktif' : 'Pasif'}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link href={`/admin/paket-tur-aktiviteleri/${item.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>Düzenle</Link>
                      <Link href={`/admin/paket-tur-aktiviteleri/${item.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>Fiyat</Link>
                      <button type="button" onClick={() => void toggleActive(item)} className={`${btn} border-zinc-900 dark:border-zinc-100`}>{item.isActive ? 'Pasif' : 'Aktif'}</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

