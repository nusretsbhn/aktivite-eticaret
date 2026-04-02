'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import type { AdminVilla } from '@/types/admin-villa';

const VIEW_KEY = 'admin_villas_view_mode';
const PAGE_SIZE = 20;

type ViewMode = 'card' | 'list';

type VillasListResponse = {
  villas: AdminVilla[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

async function fetchVillasPage(params: URLSearchParams): Promise<VillasListResponse> {
  const res = await fetch(`/api/admin/villas?${params.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Liste alınamadı');
  return (await res.json()) as VillasListResponse;
}

function getCoverImageUrl(villa: AdminVilla): string | null {
  const cover = villa.gallery.find((g) => g.isCover && g.type === 'image');
  if (cover?.url) return cover.url;
  const firstImage = villa.gallery.find((g) => g.type === 'image');
  return firstImage?.url ?? null;
}

function formatNightlyPriceHint(v: AdminVilla): string {
  const values = v.prices.map((p) => Number(p.price)).filter((x) => Number.isFinite(x) && x >= 0);
  if (!values.length) return 'Gecelik fiyat girilmedi';
  const sym =
    v.paymentCurrency === 'TRY'
      ? '₺'
      : v.paymentCurrency === 'USD'
        ? '$'
        : v.paymentCurrency === 'EUR'
          ? '€'
          : '£';
  const min = Math.min(...values);
  const max = Math.max(...values);
  if (min === max) return `${min} ${sym} / gece`;
  return `${min}–${max} ${sym} / gece`;
}

function formatCurrency(v: AdminVilla) {
  const sym =
    v.paymentCurrency === 'TRY'
      ? '₺'
      : v.paymentCurrency === 'USD'
        ? '$'
        : v.paymentCurrency === 'EUR'
          ? '€'
          : '£';
  return `${v.cleaningFee} ${sym} temizlik · min. ${v.minStayNights} gece`;
}

export function VillasIndexClient() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('card');
  const [q, setQ] = useState('');
  const [isActive, setIsActive] = useState('');
  const debouncedQ = useDebounced(q, 350);
  const [page, setPage] = useState(1);
  const [villas, setVillas] = useState<AdminVilla[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, isActive]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === 'card' || v === 'list') setView(v);
    } catch {
      /* ignore */
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (isActive === 'true' || isActive === 'false') params.set('isActive', isActive);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const data = await fetchVillasPage(params);
      setVillas(data.villas);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, isActive, page]);

  useEffect(() => {
    void load();
  }, [load]);

  function setViewMode(mode: ViewMode) {
    setView(mode);
    try {
      localStorage.setItem(VIEW_KEY, mode);
    } catch {
      /* ignore */
    }
  }

  async function remove(id: string) {
    if (!confirm('Bu villayı silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/villas/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      alert('Silinemedi');
      return;
    }
    void load();
    router.refresh();
  }

  async function toggleActive(v: AdminVilla) {
    const res = await fetch(`/api/admin/villas/${v.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !v.isActive }),
    });
    if (!res.ok) {
      alert('Güncellenemedi');
      return;
    }
    void load();
    router.refresh();
  }

  const rangeFrom = total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const rangeTo = total === 0 ? 0 : Math.min(page * PAGE_SIZE, total);
  const canPrev = !loading && page > 1;
  const canNext = !loading && totalPages > 0 && page < totalPages;

  const btn =
    'inline-flex min-h-10 min-w-[2.75rem] shrink-0 items-center justify-center rounded-lg border px-3 py-2 text-xs font-medium sm:min-h-9 sm:text-sm';
  const btnPrimary =
    'inline-flex min-h-11 w-full items-center justify-center rounded-lg bg-zinc-900 px-4 py-2.5 text-sm font-medium text-white sm:min-h-10 sm:w-auto dark:bg-zinc-100 dark:text-zinc-900';
  const filterInput =
    'mt-1 min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2.5 text-base sm:min-h-10 sm:text-sm dark:border-zinc-600 dark:bg-zinc-950 dark:text-zinc-50';

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">Villalar</h1>
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
          <Link href="/admin/villalar/yeni" className={btnPrimary}>
            Yeni villa
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              className={filterInput}
              placeholder="Ad, slug, belge no, il…"
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

      {!loading && villas.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">Kayıt bulunamadı.</p>
      )}

      {view === 'card' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {villas.map((v) => {
            const coverUrl = getCoverImageUrl(v);
            return (
            <article
              key={v.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              <div className="mb-3 aspect-[16/9] w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-950">
                {coverUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={coverUrl} alt="" className="h-full w-full object-cover" />
                ) : (
                  <div className="flex h-full min-h-[120px] items-center justify-center text-xs text-zinc-500 dark:text-zinc-400">
                    Görsel yok — Galeri
                  </div>
                )}
              </div>
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate font-mono text-xs text-zinc-500 dark:text-zinc-400">/{v.slug}</p>
                  <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">{v.displayName}</h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">{v.legalName}</p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    v.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {v.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">{v.description}</p>
              <p className="mt-2 text-xs text-zinc-500">
                {v.city} · {v.district} · {v.guestCount} kişi · {v.bedroomCount}+{v.bathroomCount}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">{formatCurrency(v)}</p>
              <p className="mt-0.5 text-xs text-zinc-500 dark:text-zinc-400">{formatNightlyPriceHint(v)}</p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link href={`/admin/villalar/${v.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Düzenle
                </Link>
                <Link href={`/admin/villalar/${v.id}/galeri`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Galeri
                </Link>
                <Link href={`/admin/villalar/${v.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Fiyat
                </Link>
                <Link href={`/admin/villalar/${v.id}/musaitlik`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                  Müsaitlik
                </Link>
                <button
                  type="button"
                  onClick={() => void remove(v.id)}
                  className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                >
                  Sil
                </button>
                <button
                  type="button"
                  onClick={() => void toggleActive(v)}
                  className={`${btn} border-zinc-900 dark:border-zinc-100`}
                >
                  {v.isActive ? 'Pasif yap' : 'Aktif yap'}
                </button>
              </div>
            </article>
            );
          })}
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="space-y-3 md:hidden">
            {villas.map((v) => (
              <div
                key={v.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                <p className="font-mono text-xs text-zinc-500">{v.slug}</p>
                <p className="font-medium text-zinc-900 dark:text-zinc-50">{v.displayName}</p>
                <p className="mt-1 text-sm text-zinc-600">{v.city}</p>
                <p className="mt-1 text-xs text-zinc-500">{formatNightlyPriceHint(v)}</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link href={`/admin/villalar/${v.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Düzenle
                  </Link>
                  <Link href={`/admin/villalar/${v.id}/galeri`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Galeri
                  </Link>
                  <Link href={`/admin/villalar/${v.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Fiyat
                  </Link>
                  <Link href={`/admin/villalar/${v.id}/musaitlik`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                    Müsaitlik
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(v.id)}
                    className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                  >
                    Sil
                  </button>
                  <button
                    type="button"
                    onClick={() => void toggleActive(v)}
                    className={`${btn} border-zinc-900 dark:border-zinc-100`}
                  >
                    {v.isActive ? 'Pasif' : 'Aktif'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 font-medium">Slug</th>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Konum</th>
                  <th className="px-4 py-3 font-medium">Kapasite</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {villas.map((v) => (
                  <tr key={v.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{v.slug}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{v.displayName}</td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {v.city} / {v.district}
                    </td>
                    <td className="px-4 py-3">{v.guestCount} kişi</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          v.isActive ? 'text-emerald-700 dark:text-emerald-400' : 'text-zinc-500 dark:text-zinc-400'
                        }
                      >
                        {v.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Link href={`/admin/villalar/${v.id}/galeri`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                          Galeri
                        </Link>
                        <Link href={`/admin/villalar/${v.id}/fiyat`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                          Fiyat
                        </Link>
                        <Link href={`/admin/villalar/${v.id}/musaitlik`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                          Müsait
                        </Link>
                        <Link href={`/admin/villalar/${v.id}/duzenle`} className={`${btn} border-zinc-300 dark:border-zinc-600`}>
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => void remove(v.id)}
                          className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                        >
                          Sil
                        </button>
                        <button
                          type="button"
                          onClick={() => void toggleActive(v)}
                          className={`${btn} border-zinc-900 dark:border-zinc-100`}
                        >
                          {v.isActive ? 'Pasif' : 'Aktif'}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {total > 0 && (
        <nav
          className="flex flex-col gap-4 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:flex-row sm:items-center sm:justify-between sm:p-5"
          aria-label="Sayfalama"
        >
          <p className="text-center text-sm text-zinc-600 sm:text-left dark:text-zinc-400">
            <span className="font-medium text-zinc-800 dark:text-zinc-200">
              {rangeFrom}–{rangeTo}
            </span>{' '}
            / {total} kayıt
            {totalPages > 0 && (
              <span className="mt-1 block text-xs text-zinc-500 sm:mt-0 sm:ml-1 sm:inline dark:text-zinc-500">
                Sayfa {page} / {totalPages}
              </span>
            )}
          </p>
          <div className="flex flex-wrap items-center justify-center gap-2 sm:justify-end">
            <button
              type="button"
              disabled={!canPrev}
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              className="min-h-11 min-w-[5.5rem] rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 transition enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 enabled:dark:hover:bg-zinc-800"
            >
              Önceki
            </button>
            <span className="flex min-h-11 items-center px-2 text-sm text-zinc-600 tabular-nums dark:text-zinc-400">
              {totalPages > 0 ? `${page} / ${totalPages}` : '—'}
            </span>
            <button
              type="button"
              disabled={!canNext}
              onClick={() => setPage((p) => p + 1)}
              className="min-h-11 min-w-[5.5rem] rounded-lg border border-zinc-300 px-4 py-2.5 text-sm font-medium text-zinc-800 transition enabled:hover:bg-zinc-50 disabled:cursor-not-allowed disabled:opacity-40 dark:border-zinc-600 dark:text-zinc-200 enabled:dark:hover:bg-zinc-800"
            >
              Sonraki
            </button>
          </div>
        </nav>
      )}
    </div>
  );
}
