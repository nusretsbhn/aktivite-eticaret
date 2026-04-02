'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useCallback, useEffect, useMemo, useState } from 'react';

import { useDebounced } from '@/hooks/use-debounced';
import { settingsToAdminDictionaries } from '@/lib/settings-to-dictionaries';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminDictionaries } from '@/types/admin-dictionary';
import type { AdminSettings } from '@/types/admin-settings';

const VIEW_KEY = 'admin_activities_view_mode';
const PAGE_SIZE = 20;

type ViewMode = 'card' | 'list';

type ActivitiesListResponse = {
  activities: AdminActivity[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
};

function getCoverImageUrl(activity: AdminActivity): string | null {
  const cover = activity.gallery.find((g) => g.isCover && g.type === 'image');
  if (cover?.url) return cover.url;
  const firstImage = activity.gallery.find((g) => g.type === 'image');
  return firstImage?.url ?? null;
}

function formatPriceRange(activity: AdminActivity): string {
  const values = activity.prices
    .map((p) => Number(p.price))
    .filter((v) => Number.isFinite(v) && v >= 0);
  if (!values.length) return 'Fiyat girilmedi';
  const min = Math.min(...values);
  const max = Math.max(...values);
  return `${min} / ${max} ₺`;
}

async function fetchActivitiesPage(params: URLSearchParams): Promise<ActivitiesListResponse> {
  const res = await fetch(`/api/admin/activities?${params.toString()}`, {
    credentials: 'include',
    cache: 'no-store',
  });
  if (!res.ok) throw new Error('Liste alınamadı');
  return (await res.json()) as ActivitiesListResponse;
}

export function ActivitiesIndexClient() {
  const router = useRouter();
  const [view, setView] = useState<ViewMode>('card');
  const [dict, setDict] = useState<AdminDictionaries | null>(null);

  const [q, setQ] = useState('');
  const [mainCategory, setMainCategory] = useState('');
  const [subCategory, setSubCategory] = useState('');
  const [isActive, setIsActive] = useState('');

  const debouncedQ = useDebounced(q, 350);

  const [page, setPage] = useState(1);
  const [activities, setActivities] = useState<AdminActivity[]>([]);
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    setPage(1);
  }, [debouncedQ, mainCategory, subCategory, isActive]);

  useEffect(() => {
    try {
      const v = localStorage.getItem(VIEW_KEY) as ViewMode | null;
      if (v === 'card' || v === 'list') setView(v);
    } catch {
      /* ignore */
    }
  }, []);

  useEffect(() => {
    void fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' })
      .then((r) => {
        if (!r.ok) throw new Error('settings');
        return r.json() as Promise<{ settings: AdminSettings }>;
      })
      .then((data) => setDict(settingsToAdminDictionaries(data.settings)))
      .catch(() => setDict(null));
  }, []);

  const subOptions = dict?.subCategoriesByMain[mainCategory] ?? [];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const params = new URLSearchParams();
    if (debouncedQ) params.set('q', debouncedQ);
    if (mainCategory) params.set('mainCategory', mainCategory);
    if (subCategory) params.set('subCategory', subCategory);
    if (isActive === 'true' || isActive === 'false') params.set('isActive', isActive);
    params.set('page', String(page));
    params.set('pageSize', String(PAGE_SIZE));
    try {
      const data = await fetchActivitiesPage(params);
      setActivities(data.activities);
      setTotal(data.total);
      setTotalPages(data.totalPages);
      if (data.page !== page) setPage(data.page);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Hata');
    } finally {
      setLoading(false);
    }
  }, [debouncedQ, mainCategory, subCategory, isActive, page]);

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

  const labelMain = useMemo(() => {
    const m = new Map(dict?.mainCategories.map((x) => [x.id, x.label]));
    return (id: string) => m.get(id) ?? id;
  }, [dict]);

  const labelSub = useMemo(() => {
    const m = new Map<string, string>();
    if (dict) {
      for (const [main, items] of Object.entries(dict.subCategoriesByMain)) {
        for (const it of items) {
          m.set(`${main}:${it.id}`, it.label);
        }
      }
    }
    return (main: string, id: string) => m.get(`${main}:${id}`) ?? id;
  }, [dict]);

  const labelSubList = useCallback(
    (main: string, ids: string[]) => {
      if (!ids.length) return '-';
      return ids.map((id) => labelSub(main, id)).join(', ');
    },
    [labelSub],
  );

  async function remove(id: string) {
    if (!confirm('Bu aktiviteyi silmek istediğinize emin misiniz?')) return;
    const res = await fetch(`/api/admin/activities/${id}`, { method: 'DELETE', credentials: 'include' });
    if (!res.ok) {
      alert('Silinemedi');
      return;
    }
    void load();
    router.refresh();
  }

  async function toggleActive(a: AdminActivity) {
    const res = await fetch(`/api/admin/activities/${a.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ isActive: !a.isActive }),
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
        <h1 className="text-xl font-semibold text-zinc-900 sm:text-2xl dark:text-zinc-50">
          Aktiviteler
        </h1>
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
          <Link href="/admin/aktiviteler/yeni" className={btnPrimary}>
            Yeni aktivite
          </Link>
        </div>
      </div>

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900">
        <p className="mb-3 text-sm font-medium text-zinc-700 dark:text-zinc-300">Filtreler</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Arama</span>
            <input
              className={filterInput}
              placeholder="Ad, ID, açıklama…"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              autoComplete="off"
            />
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Ana kategori</span>
            <select
              className={filterInput}
              value={mainCategory}
              onChange={(e) => {
                setMainCategory(e.target.value);
                setSubCategory('');
              }}
            >
              <option value="">Tümü</option>
              {dict?.mainCategories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Alt kategori</span>
            <select
              className={filterInput}
              value={subCategory}
              onChange={(e) => setSubCategory(e.target.value)}
              disabled={!mainCategory}
            >
              <option value="">Tümü</option>
              {subOptions.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm">
            <span className="text-zinc-500 dark:text-zinc-400">Durum</span>
            <select
              className={filterInput}
              value={isActive}
              onChange={(e) => setIsActive(e.target.value)}
            >
              <option value="">Tümü</option>
              <option value="true">Aktif</option>
              <option value="false">Pasif</option>
            </select>
          </label>
        </div>
        {loading && (
          <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>
        )}
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}

      {!loading && activities.length === 0 && (
        <p className="text-center text-zinc-500 dark:text-zinc-400">Kayıt bulunamadı.</p>
      )}

      {view === 'card' && (
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {activities.map((a) => (
            <article
              key={a.id}
              className="flex flex-col rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm sm:p-5 dark:border-zinc-800 dark:bg-zinc-900"
            >
              {getCoverImageUrl(a) ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={getCoverImageUrl(a) ?? ''}
                  alt={`${a.name} kapak görseli`}
                  className="mb-3 aspect-[16/9] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                />
              ) : (
                <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                  Kapak görseli yok
                </div>
              )}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="truncate text-xs text-zinc-500 dark:text-zinc-400">{a.activityId}</p>
                  <h2 className="text-base font-semibold text-zinc-900 sm:text-lg dark:text-zinc-50">
                    {a.name}
                  </h2>
                  <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                    {labelMain(a.mainCategory)} · {labelSubList(a.mainCategory, a.subCategoryIds)}
                  </p>
                </div>
                <span
                  className={`shrink-0 rounded-full px-2 py-1 text-xs font-medium ${
                    a.isActive
                      ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200'
                      : 'bg-zinc-200 text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300'
                  }`}
                >
                  {a.isActive ? 'Aktif' : 'Pasif'}
                </span>
              </div>
              <p className="mt-3 line-clamp-3 flex-1 text-sm text-zinc-600 dark:text-zinc-400">
                {a.description}
              </p>
              <p className="mt-2 text-xs text-zinc-500">
                Kapasite: {a.capacity} kişi · Kalkış: {a.departurePlace}
              </p>
              <p className="mt-1 text-xs font-medium text-zinc-700 dark:text-zinc-300">
                {formatPriceRange(a)}
              </p>
              <div className="mt-4 flex flex-wrap gap-2">
                <Link
                  href={`/admin/aktiviteler/${a.id}/duzenle`}
                  className={`${btn} border-zinc-300 dark:border-zinc-600`}
                >
                  Düzenle
                </Link>
                <button
                  type="button"
                  onClick={() => void remove(a.id)}
                  className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                >
                  Sil
                </button>
                <Link
                  href={`/admin/aktiviteler/${a.id}/galeri`}
                  className={`${btn} border-zinc-300 dark:border-zinc-600`}
                >
                  Galeri
                </Link>
                <Link
                  href={`/admin/aktiviteler/${a.id}/fiyat`}
                  className={`${btn} border-zinc-300 dark:border-zinc-600`}
                >
                  Fiyat
                </Link>
                <Link
                  href={`/admin/aktiviteler/${a.id}/musaitlik`}
                  className={`${btn} border-zinc-300 dark:border-zinc-600`}
                >
                  Müsaitlik
                </Link>
                <Link
                  href={`/admin/aktiviteler/${a.id}/seferler`}
                  className={`${btn} border-zinc-300 dark:border-zinc-600`}
                >
                  Seferler
                </Link>
                <button
                  type="button"
                  onClick={() => void toggleActive(a)}
                  className={`${btn} border-zinc-900 dark:border-zinc-100`}
                >
                  {a.isActive ? 'Pasif yap' : 'Aktif yap'}
                </button>
              </div>
            </article>
          ))}
        </div>
      )}

      {view === 'list' && (
        <>
          <div className="space-y-3 md:hidden">
            {activities.map((a) => (
              <div
                key={a.id}
                className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900"
              >
                {getCoverImageUrl(a) ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={getCoverImageUrl(a) ?? ''}
                    alt={`${a.name} kapak görseli`}
                    className="mb-3 aspect-[16/9] w-full rounded-xl border border-zinc-200 object-cover dark:border-zinc-700"
                  />
                ) : (
                  <div className="mb-3 flex aspect-[16/9] w-full items-center justify-center rounded-xl border border-dashed border-zinc-300 text-xs text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
                    Kapak görseli yok
                  </div>
                )}
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="font-mono text-xs text-zinc-500">{a.activityId}</p>
                    <p className="font-medium text-zinc-900 dark:text-zinc-50">{a.name}</p>
                    <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
                      {labelMain(a.mainCategory)} / {labelSubList(a.mainCategory, a.subCategoryIds)}
                    </p>
                    <p className="mt-1 text-sm text-zinc-600">
                      Kapasite {a.capacity} kişi
                      <span
                        className={
                          a.isActive
                            ? 'ml-2 text-emerald-700 dark:text-emerald-400'
                            : 'ml-2 text-zinc-500 dark:text-zinc-400'
                        }
                      >
                        · {a.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </p>
                    <p className="mt-1 text-sm font-medium text-zinc-700 dark:text-zinc-300">
                      {formatPriceRange(a)}
                    </p>
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Link
                    href={`/admin/aktiviteler/${a.id}/duzenle`}
                    className={`${btn} border-zinc-300 dark:border-zinc-600`}
                  >
                    Düzenle
                  </Link>
                  <button
                    type="button"
                    onClick={() => void remove(a.id)}
                    className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                  >
                    Sil
                  </button>
                  <Link
                    href={`/admin/aktiviteler/${a.id}/galeri`}
                    className={`${btn} border-zinc-300 dark:border-zinc-600`}
                  >
                    Galeri
                  </Link>
                  <Link
                    href={`/admin/aktiviteler/${a.id}/fiyat`}
                    className={`${btn} border-zinc-300 dark:border-zinc-600`}
                  >
                    Fiyat
                  </Link>
                  <Link
                    href={`/admin/aktiviteler/${a.id}/musaitlik`}
                    className={`${btn} border-zinc-300 dark:border-zinc-600`}
                  >
                    Müsaitlik
                  </Link>
                  <Link
                    href={`/admin/aktiviteler/${a.id}/seferler`}
                    className={`${btn} border-zinc-300 dark:border-zinc-600`}
                  >
                    Seferler
                  </Link>
                  <button
                    type="button"
                    onClick={() => void toggleActive(a)}
                    className={`${btn} border-zinc-900 dark:border-zinc-100`}
                  >
                    {a.isActive ? 'Pasif' : 'Aktif'}
                  </button>
                </div>
              </div>
            ))}
          </div>

          <div className="hidden overflow-x-auto rounded-2xl border border-zinc-200 bg-white md:block dark:border-zinc-800 dark:bg-zinc-900">
            <table className="min-w-[720px] text-left text-sm">
              <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/50">
                <tr>
                  <th className="px-4 py-3 font-medium">ID</th>
                  <th className="px-4 py-3 font-medium">Ad</th>
                  <th className="px-4 py-3 font-medium">Kapak</th>
                  <th className="px-4 py-3 font-medium">Kategori</th>
                  <th className="px-4 py-3 font-medium">Fiyat Aralığı</th>
                  <th className="px-4 py-3 font-medium">Kapasite</th>
                  <th className="px-4 py-3 font-medium">Durum</th>
                  <th className="px-4 py-3 font-medium text-right">İşlemler</th>
                </tr>
              </thead>
              <tbody>
                {activities.map((a) => (
                  <tr key={a.id} className="border-b border-zinc-100 dark:border-zinc-800">
                    <td className="px-4 py-3 font-mono text-xs text-zinc-500">{a.activityId}</td>
                    <td className="px-4 py-3 font-medium text-zinc-900 dark:text-zinc-50">{a.name}</td>
                    <td className="px-4 py-3">
                      {getCoverImageUrl(a) ? (
                        // eslint-disable-next-line @next/next/no-img-element
                        <img
                          src={getCoverImageUrl(a) ?? ''}
                          alt={`${a.name} kapak`}
                          className="h-12 w-20 rounded-md border border-zinc-200 object-cover dark:border-zinc-700"
                        />
                      ) : (
                        <span className="text-xs text-zinc-500 dark:text-zinc-400">Yok</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-zinc-600 dark:text-zinc-400">
                      {labelMain(a.mainCategory)} / {labelSubList(a.mainCategory, a.subCategoryIds)}
                    </td>
                    <td className="px-4 py-3 font-medium text-zinc-700 dark:text-zinc-300">
                      {formatPriceRange(a)}
                    </td>
                    <td className="px-4 py-3">{a.capacity} kişi</td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          a.isActive
                            ? 'text-emerald-700 dark:text-emerald-400'
                            : 'text-zinc-500 dark:text-zinc-400'
                        }
                      >
                        {a.isActive ? 'Aktif' : 'Pasif'}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap justify-end gap-1">
                        <Link
                          href={`/admin/aktiviteler/${a.id}/duzenle`}
                          className={`${btn} border-zinc-300 dark:border-zinc-600`}
                        >
                          Düzenle
                        </Link>
                        <button
                          type="button"
                          onClick={() => void remove(a.id)}
                          className={`${btn} border-red-300 text-red-700 dark:border-red-800 dark:text-red-300`}
                        >
                          Sil
                        </button>
                        <Link
                          href={`/admin/aktiviteler/${a.id}/galeri`}
                          className={`${btn} border-zinc-300 dark:border-zinc-600`}
                        >
                          Galeri
                        </Link>
                        <Link
                          href={`/admin/aktiviteler/${a.id}/fiyat`}
                          className={`${btn} border-zinc-300 dark:border-zinc-600`}
                        >
                          Fiyat
                        </Link>
                        <Link
                          href={`/admin/aktiviteler/${a.id}/musaitlik`}
                          className={`${btn} border-zinc-300 dark:border-zinc-600`}
                        >
                          Müsaitlik
                        </Link>
                        <Link
                          href={`/admin/aktiviteler/${a.id}/seferler`}
                          className={`${btn} border-zinc-300 dark:border-zinc-600`}
                        >
                          Seferler
                        </Link>
                        <button
                          type="button"
                          onClick={() => void toggleActive(a)}
                          className={`${btn} border-zinc-900 dark:border-zinc-100`}
                        >
                          {a.isActive ? 'Pasif' : 'Aktif'}
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
