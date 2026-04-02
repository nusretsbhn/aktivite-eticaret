'use client';

import Link from 'next/link';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminPackage } from '@/types/admin-package';

type ViewMode = 'card' | 'list';
type PackagesResponse = {
  packages: AdminPackage[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const VIEW_KEY = 'admin_packages_view_mode';
const PAGE_SIZE = 25;

export function PackagesIndexClient() {
  const [view, setView] = useState<ViewMode>('card');
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState('');
  const dq = useDebounced(q, 350);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<AdminPackage[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activities, setActivities] = useState<AdminActivity[]>([]);

  useEffect(() => {
    setPage(1);
  }, [dq, isActive]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === 'card' || v === 'list') setView(v);
    } catch {
      // ignore
    }
  }, []);

  useEffect(() => {
    const params = new URLSearchParams({ page: '1', pageSize: '500' });
    void fetch(`/api/admin/activities?${params.toString()}`, { credentials: 'include', cache: 'no-store' })
      .then((r) => r.json() as Promise<{ activities: AdminActivity[] }>)
      .then((d) => setActivities(Array.isArray(d.activities) ? d.activities : []))
      .catch(() => setActivities([]));
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (isActive) params.set('isActive', isActive);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/packages?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as PackagesResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(data.packages);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [dq, isActive, page]);

  useEffect(() => {
    void load();
  }, [load]);

  const actNameById = useMemo(() => new Map(activities.map((a) => [a.id, a.name])), [activities]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      // ignore
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu paketi silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/packages/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silinemedi');
      return;
    }
    void load();
  }

  async function toggleActive(p: AdminPackage) {
    const res = await fetch(`/api/admin/packages/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !p.isActive }),
    });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Güncellenemedi');
      return;
    }
    void load();
  }

  const btn =
    'inline-flex min-h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium sm:min-h-9 sm:text-sm';
  const btnPrimary =
    'inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:min-h-10 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900';
  const filterInput =
    'mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base sm:min-h-10 sm:text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50';

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Paketler</h1>
        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center">
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
              onClick={() => setViewMode('list')}
              className={`min-h-10 flex-1 rounded-md px-3 py-2 text-sm font-medium sm:min-h-9 sm:flex-none sm:px-4 ${
                view === 'list'
                  ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400'
              }`}
            >
              Liste
            </button>
          </div>
          <Link href="/admin/paketler/yeni" className={btnPrimary}>
            Yeni paket oluştur
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              className={filterInput}
              placeholder="Paket adı, ID, açıklama, aktivite…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Durum</span>
            <select className={filterInput} value={isActive} onChange={(e) => setIsActive(e.target.value)}>
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
        </div>
        {loading && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>}
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && rows.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">Kayıt bulunamadı.</p>
      )}

      {view === 'card' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {rows.map((p) => (
            <article key={p.id} className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
              {p.coverImageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={p.coverImageUrl}
                  alt={`${p.name} kapak`}
                  className="mb-3 aspect-[16/9] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Kapak görseli yok
                </div>
              )}

              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{p.packageId}</p>
                  <h2 className="text-base font-semibold text-zinc-900 dark:text-zinc-50">{p.name}</h2>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    p.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {p.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>

              <p className="mt-3 line-clamp-3 text-sm text-zinc-600 dark:text-zinc-400">{p.description || ' '}</p>
              <p className="mt-2 text-xs text-zinc-500">
                Aktivite sayısı: {p.activityIds.length}
              </p>
              <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-400">
                {p.activityIds.slice(0, 3).map((id) => actNameById.get(id) ?? id).join(', ')}
                {p.activityIds.length > 3 ? '…' : ''}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/paketler/${p.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Düzenle
                </Link>
                <button type="button" onClick={() => void remove(p.id)} className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}>
                  Sil
                </button>
                <button type="button" onClick={() => void toggleActive(p)} className={`${btn} border-zinc-900 dark:border-zinc-100`}>
                  {p.isActive ? 'Pasif yap' : 'Aktif yap'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === 'list' && (
        <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
          <table className="min-w-[760px] text-left text-sm">
            <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
              <tr>
                <th className="px-4 py-3 font-medium">ID</th>
                <th className="px-4 py-3 font-medium">Ad</th>
                <th className="px-4 py-3 font-medium">Kapak</th>
                <th className="px-4 py-3 font-medium">Aktiviteler</th>
                <th className="px-4 py-3 font-medium">Durum</th>
                <th className="px-4 py-3 font-medium text-right">İşlemler</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((p) => (
                <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                  <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.packageId}</td>
                  <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{p.name}</td>
                  <td className="px-4 py-3">
                    {p.coverImageUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={p.coverImageUrl} alt={`${p.name} kapak`} className="h-12 w-20 rounded-md border border-zinc-200 object-cover dark:border-zinc-700" />
                    ) : (
                      <span className="text-xs text-zinc-500 dark:text-zinc-400">Yok</span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                    {p.activityIds.length} aktivite
                  </td>
                  <td className="px-4 py-3">
                    <span className={p.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
                      {p.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap justify-end gap-1">
                      <Link href={`/admin/paketler/${p.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                        Düzenle
                      </Link>
                      <button type="button" onClick={() => void remove(p.id)} className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}>
                        Sil
                      </button>
                      <button type="button" onClick={() => void toggleActive(p)} className={`${btn} border-zinc-900 dark:border-zinc-100`}>
                        {p.isActive ? 'Pasif' : 'Aktif'}
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {view === 'list' && (
        <div className="space-y-3 md:hidden">
          {rows.map((p) => (
            <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="font-mono text-xs text-zinc-500">{p.packageId}</p>
              <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.name}</p>
              <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{p.activityIds.length} aktivite</p>
              <div className="mt-3 flex flex-wrap gap-2">
                <Link href={`/admin/paketler/${p.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Düzenle
                </Link>
                <button type="button" onClick={() => void remove(p.id)} className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}>
                  Sil
                </button>
                <button type="button" onClick={() => void toggleActive(p)} className={`${btn} border-zinc-900 dark:border-zinc-100`}>
                  {p.isActive ? 'Pasif' : 'Aktif'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? 'Yükleniyor…' : `${rangeFrom}-${rangeTo} / ${total} kayıt`}
        </p>
        <div className="inline-flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((p) => p - 1)}
            className={`${btn} border-zinc-300 disabled:opacity-50 dark:border-zinc-600`}
          >
            Önceki
          </button>
          <span className="px-1 text-sm text-zinc-600 dark:text-zinc-300">
            {page}/{Math.max(totalPages, 1)}
          </span>
          <button
            type="button"
            disabled={loading || page >= Math.max(totalPages, 1)}
            onClick={() => setPage((p) => p + 1)}
            className={`${btn} border-zinc-300 disabled:opacity-50 dark:border-zinc-600`}
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}

