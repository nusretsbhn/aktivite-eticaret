'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import type { BlogPost } from '@/types/blog';

type BlogListResponse = {
  posts: BlogPost[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

const PAGE_SIZE = 25;

export function BlogAdminClient() {
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState('');
  const dq = useDebounced(q, 350);
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState<BlogPost[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [dq, isActive]);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (dq) params.set('q', dq);
    if (isActive) params.set('isActive', isActive);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const res = await fetch(`/api/admin/blog?${params.toString()}`, {
        credentials: 'include',
        cache: 'no-store',
      });
      const data = (await res.json()) as BlogListResponse & { error?: string };
      if (!res.ok) throw new Error(data.error ?? 'Liste alınamadı');
      setRows(data.posts);
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

  async function remove(id: string) {
    if (!confirm('Bu yazıyı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/blog/${id}`, { method: 'DELETE', credentials: 'include' });
    const data = (await res.json()) as { error?: string };
    if (!res.ok) {
      alert(data.error ?? 'Silinemedi');
      return;
    }
    void load();
  }

  async function toggleActive(p: BlogPost) {
    const res = await fetch(`/api/admin/blog/${p.id}`, {
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
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Blog Yönetimi</h1>
        <Link href="/admin/blog/yeni" className={btnPrimary}>
          Yeni ekle
        </Link>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm sm:col-span-2">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              className={filterInput}
              placeholder="Başlık, özet, içerik…"
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

      <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
        <table className="min-w-[720px] text-left text-sm">
          <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
            <tr>
              <th className="px-4 py-3 font-medium">Kapak</th>
              <th className="px-4 py-3 font-medium">Başlık</th>
              <th className="px-4 py-3 font-medium">Slug</th>
              <th className="px-4 py-3 font-medium">Durum</th>
              <th className="px-4 py-3 font-medium text-right">İşlemler</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((p) => (
              <tr key={p.id} className="border-b border-zinc-100 dark:border-zinc-800">
                <td className="px-4 py-3">
                  {p.coverImageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={p.coverImageUrl}
                      alt=""
                      className="h-12 w-20 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
                    />
                  ) : (
                    <span className="text-xs text-zinc-500">—</span>
                  )}
                </td>
                <td className="max-w-[240px] px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">
                  <span className="line-clamp-2">{p.title}</span>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-zinc-500">{p.slug}</td>
                <td className="px-4 py-3">
                  <span className={p.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'}>
                    {p.isActive ? 'Aktif' : 'Pasif'}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <div className="flex flex-wrap justify-end gap-1">
                    <Link href={`/admin/blog/${p.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                      Düzenle
                    </Link>
                    <button
                      type="button"
                      onClick={() => void remove(p.id)}
                      className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                    >
                      Sil
                    </button>
                    <button
                      type="button"
                      onClick={() => void toggleActive(p)}
                      className={`${btn} border-zinc-900 dark:border-zinc-100`}
                    >
                      {p.isActive ? 'Pasif' : 'Aktif'}
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="space-y-3 md:hidden">
        {rows.map((p) => (
          <div key={p.id} className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="font-medium text-zinc-900 dark:text-zinc-50">{p.title}</p>
            <p className="mt-1 font-mono text-xs text-zinc-500">{p.slug}</p>
            <p className="mt-1 text-sm text-zinc-600">{p.isActive ? 'Aktif' : 'Pasif'}</p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link href={`/admin/blog/${p.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                Düzenle
              </Link>
              <button
                type="button"
                onClick={() => void remove(p.id)}
                className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
              >
                Sil
              </button>
              <button
                type="button"
                onClick={() => void toggleActive(p)}
                className={`${btn} border-zinc-900 dark:border-zinc-100`}
              >
                {p.isActive ? 'Pasif' : 'Aktif'}
              </button>
            </div>
          </div>
        ))}
      </div>

      <div className="flex flex-col gap-2 border-t border-zinc-200 pt-4 sm:flex-row sm:items-center sm:justify-between dark:border-zinc-800">
        <p className="text-sm text-zinc-500 dark:text-zinc-400">
          {loading ? 'Yükleniyor…' : `${rangeFrom}-${rangeTo} / ${total} kayıt`}
        </p>
        <div className="inline-flex items-center gap-2 self-end sm:self-auto">
          <button
            type="button"
            disabled={loading || page <= 1}
            onClick={() => setPage((x) => x - 1)}
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
            onClick={() => setPage((x) => x + 1)}
            className={`${btn} border-zinc-300 disabled:opacity-50 dark:border-zinc-600`}
          >
            Sonraki
          </button>
        </div>
      </div>
    </div>
  );
}
