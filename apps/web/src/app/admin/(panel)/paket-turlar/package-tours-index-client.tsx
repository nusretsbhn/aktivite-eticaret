'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import type { AdminPackageTour } from '@/types/admin-package-tour';

type ViewMode = 'card' | 'lite';
const VIEW_KEY = 'admin_package_tours_view_mode';

export function PackageToursIndexClient() {
  const [view, setView] = useState<ViewMode>('card');
  const [rows, setRows] = useState<AdminPackageTour[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/admin/package-tours', { credentials: 'include', cache: 'no-store' });
      const data = (await res.json()) as { packageTours?: AdminPackageTour[]; error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(Array.isArray(data.packageTours) ? data.packageTours : []);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === 'card' || v === 'lite') setView(v);
    } catch {
      // ignore
    }
    void load();
  }, [load]);

  function setViewMode(next: ViewMode) {
    setView(next);
    try {
      localStorage.setItem(VIEW_KEY, next);
    } catch {
      // ignore
    }
  }

  const btn =
    'inline-flex min-h-10 items-center justify-center rounded-lg border px-3 py-2 text-sm font-medium sm:min-h-9';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Paket Turlar</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center">
          <div className="inline-flex w-full rounded-lg border border-zinc-300 p-0.5 sm:w-auto dark:border-zinc-600">
            <button
              type="button"
              onClick={() => setViewMode('card')}
              className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium sm:min-h-9 sm:flex-none sm:px-4 ${
                view === 'card'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Kart
            </button>
            <button
              type="button"
              onClick={() => setViewMode('lite')}
              className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium sm:min-h-9 sm:flex-none sm:px-4 ${
                view === 'lite'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Lite
            </button>
          </div>
          <Link
            href="/admin/paket-turlar/yeni"
            className="inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:min-h-10 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900"
          >
            Yeni Ekle
          </Link>
        </div>
      </div>

      {loading && <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>}
      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && !error && rows.length === 0 && (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-8 text-center text-sm text-zinc-500 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400">
          Henüz paket tur eklenmemiş.
        </div>
      )}

      {!loading && !error && rows.length > 0 && view === 'card' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((item) => (
            <article
              key={item.id}
              className="rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900"
            >
              {item.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={item.coverImageUrl}
                  alt={`${item.packageName} kapak`}
                  className="mb-3 aspect-[16/9] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Kapak görseli yok
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">{item.packageTourId}</p>
              <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{item.packageName}</h2>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{item.conceptName}</p>
              <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">{item.nightCount} Gece / {item.dayCount} Gün</p>
              <div className="mt-4 flex items-center justify-between">
                <span
                  className={`rounded-full px-2 py-1 text-xs font-medium ${
                    item.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {item.isActive ? 'Aktif' : 'Pasif'}
                </span>
                <div className="flex items-center gap-2">
                  <Link href={`/admin/paket-turlar/${item.id}/galeri`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Galeri
                  </Link>
                  <Link href={`/admin/paket-turlar/${item.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Fiyat
                  </Link>
                  <Link href={`/admin/paket-turlar/${item.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Düzenle
                  </Link>
                </div>
              </div>
            </article>
          ))}
        </div>
      )}

      {!loading && !error && rows.length > 0 && view === 'lite' && (
        <div className="overflow-x-auto rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-[700px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">Kod</th>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Konsept</th>
                <th className="px-4 py-3 font-medium">Süre</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium text-right">İşlem</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((item) => (
                <tr key={item.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{item.packageTourId}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{item.packageName}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.conceptName || '-'}</td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">{item.nightCount}/{item.dayCount}</td>
                  <td className="px-4 py-3">
                    <span className={item.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
                      {item.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="inline-flex gap-2">
                      <Link href={`/admin/paket-turlar/${item.id}/galeri`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                        Galeri
                      </Link>
                      <Link href={`/admin/paket-turlar/${item.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                        Fiyat
                      </Link>
                      <Link href={`/admin/paket-turlar/${item.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                        Düzenle
                      </Link>
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

