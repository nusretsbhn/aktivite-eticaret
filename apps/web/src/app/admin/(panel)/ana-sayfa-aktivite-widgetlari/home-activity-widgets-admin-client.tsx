'use client';

import Link from 'next/link';
import { useState } from 'react';

import {
  ACTIVITY_HOME_TILE_IMAGE_HINT,
  uniqueActivityLocations,
  uniqueActivityMainCategoryIds,
} from '@/lib/activity-home-widgets';
import type { AdminActivity } from '@/types/admin-activity';
import type { AdminSettings } from '@/types/admin-settings';

type TabId = 'locations' | 'mainCategories';

type Props = {
  initialSettings: AdminSettings;
  initialActivities: AdminActivity[];
};

export function HomeActivityWidgetsAdminClient({ initialSettings, initialActivities }: Props) {
  const [tab, setTab] = useState<TabId>('locations');
  const [settings, setSettings] = useState<AdminSettings>(initialSettings);
  const [saving, setSaving] = useState(false);
  const [uploadingKey, setUploadingKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const locations = uniqueActivityLocations(initialActivities);
  const categoryIds = uniqueActivityMainCategoryIds(initialActivities);
  const categoryNameById = new Map((settings.categories ?? []).map((c) => [c.id, c.name]));

  async function save(next: AdminSettings) {
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const res = await fetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify(next),
      });
      const data = (await res.json()) as { error?: string; settings?: AdminSettings };
      if (!res.ok) {
        setError(data.error ?? 'Kaydedilemedi');
        return;
      }
      if (data.settings) setSettings(data.settings);
      setOk('Kaydedildi');
      setTimeout(() => setOk(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  async function uploadImage(file: File, uploadKey: string): Promise<string | null> {
    setUploadingKey(uploadKey);
    setError(null);
    try {
      const fd = new FormData();
      fd.set('file', file);
      fd.set('folder', 'activity-widgets');
      const res = await fetch('/api/admin/settings/upload', {
        method: 'POST',
        credentials: 'include',
        body: fd,
      });
      const data = (await res.json()) as { error?: string; url?: string };
      if (!res.ok || !data.url) {
        setError(data.error ?? 'Görsel yüklenemedi');
        return null;
      }
      return data.url;
    } finally {
      setUploadingKey(null);
    }
  }

  function updateLocationImage(location: string, url: string) {
    const prev = settings.blockManagement?.activityLocationImages ?? {};
    const next: AdminSettings = {
      ...settings,
      blockManagement: {
        ...(settings.blockManagement ?? { villaRegionBanners: {} }),
        activityLocationImages: { ...prev, [location]: url },
      },
    };
    setSettings(next);
    void save(next);
  }

  function updateCategoryImage(categoryId: string, url: string) {
    const prev = settings.blockManagement?.activityMainCategoryImages ?? {};
    const next: AdminSettings = {
      ...settings,
      blockManagement: {
        ...(settings.blockManagement ?? { villaRegionBanners: {} }),
        activityMainCategoryImages: { ...prev, [categoryId]: url },
      },
    };
    setSettings(next);
    void save(next);
  }

  function removeLocationImage(location: string) {
    const prev = { ...(settings.blockManagement?.activityLocationImages ?? {}) };
    delete prev[location];
    const next: AdminSettings = {
      ...settings,
      blockManagement: {
        ...(settings.blockManagement ?? { villaRegionBanners: {} }),
        activityLocationImages: prev,
      },
    };
    setSettings(next);
    void save(next);
  }

  function removeCategoryImage(categoryId: string) {
    const prev = { ...(settings.blockManagement?.activityMainCategoryImages ?? {}) };
    delete prev[categoryId];
    const next: AdminSettings = {
      ...settings,
      blockManagement: {
        ...(settings.blockManagement ?? { villaRegionBanners: {} }),
        activityMainCategoryImages: prev,
      },
    };
    setSettings(next);
    void save(next);
  }

  const locationImages = settings.blockManagement?.activityLocationImages ?? {};
  const categoryImages = settings.blockManagement?.activityMainCategoryImages ?? {};

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Ana sayfa aktivite widget görselleri
        </h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Aktif aktivitelerde tanımlı lokasyon ve birincil kategoriler için ana sayfa kart görsellerini yükleyin.
          Önerilen boyut: <strong>{ACTIVITY_HOME_TILE_IMAGE_HINT}</strong>
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-red-300 bg-red-50 px-4 py-3 text-sm text-red-800 dark:border-red-800 dark:bg-red-950/40 dark:text-red-200">
          {error}
        </div>
      )}
      {ok && (
        <div className="rounded-lg border border-emerald-300 bg-emerald-50 px-4 py-3 text-sm text-emerald-900 dark:border-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-200">
          {ok}
        </div>
      )}

      <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-700">
        <button
          type="button"
          onClick={() => setTab('locations')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'locations'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'border border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300'
          }`}
        >
          Lokasyonlar ({locations.length})
        </button>
        <button
          type="button"
          onClick={() => setTab('mainCategories')}
          className={`rounded-lg px-4 py-2 text-sm font-medium ${
            tab === 'mainCategories'
              ? 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900'
              : 'border border-zinc-300 text-zinc-700 dark:border-zinc-600 dark:text-zinc-300'
          }`}
        >
          Birincil kategoriler ({categoryIds.length})
        </button>
      </div>

      {tab === 'locations' && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Liste, aktif aktivitelerdeki <span className="font-medium">Lokasyon</span> alanından üretilir. Görsel
            yüklendiğinde ilgili lokasyon ana sayfada kart olarak görünür.
          </p>
          {locations.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Aktif aktivitede lokasyon tanımlı değil.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {locations.map((location) => {
                const currentUrl = locationImages[location] ?? '';
                const uploadKey = `widget:loc:${location}`;
                return (
                  <li
                    key={location}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{location}</p>
                        <p className="mt-1 text-xs text-zinc-500">Önerilen: {ACTIVITY_HOME_TILE_IMAGE_HINT}</p>
                        {currentUrl ? (
                          <p className="mt-2 truncate font-mono text-[11px] text-zinc-500">{currentUrl}</p>
                        ) : (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Henüz widget görseli yok</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:min-w-[280px]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={saving}
                          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void uploadImage(file, uploadKey).then((url) => {
                              if (url) updateLocationImage(location, url);
                            });
                            e.currentTarget.value = '';
                          }}
                        />
                        {uploadingKey === uploadKey && (
                          <p className="text-xs text-zinc-500">Yükleniyor…</p>
                        )}
                        {currentUrl && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => removeLocationImage(location)}
                            className="text-left text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Görseli kaldır
                          </button>
                        )}
                      </div>
                    </div>
                    {currentUrl && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentUrl} alt={location} className="aspect-[4/3] w-full max-w-xs object-cover" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {tab === 'mainCategories' && (
        <section className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Liste, aktif aktivitelerdeki <span className="font-medium">Ana kategori</span> alanından üretilir (Ayarlar →
            Kategoriler ile eşleşir).
          </p>
          {categoryIds.length === 0 ? (
            <p className="mt-4 text-sm text-zinc-500">Aktif aktivitede birincil kategori tanımlı değil.</p>
          ) : (
            <ul className="mt-4 space-y-4">
              {categoryIds.map((categoryId) => {
                const name = categoryNameById.get(categoryId) ?? categoryId;
                const currentUrl = categoryImages[categoryId] ?? '';
                const uploadKey = `widget:cat:${categoryId}`;
                return (
                  <li
                    key={categoryId}
                    className="rounded-xl border border-zinc-200 p-4 dark:border-zinc-700"
                  >
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start">
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-semibold text-zinc-900 dark:text-zinc-50">{name}</p>
                        <p className="font-mono text-xs text-zinc-500">{categoryId}</p>
                        <p className="mt-1 text-xs text-zinc-500">Önerilen: {ACTIVITY_HOME_TILE_IMAGE_HINT}</p>
                        {currentUrl ? (
                          <p className="mt-2 truncate font-mono text-[11px] text-zinc-500">{currentUrl}</p>
                        ) : (
                          <p className="mt-2 text-xs text-amber-700 dark:text-amber-300">Henüz widget görseli yok</p>
                        )}
                      </div>
                      <div className="flex shrink-0 flex-col gap-2 sm:min-w-[280px]">
                        <input
                          type="file"
                          accept="image/jpeg,image/png,image/webp,image/gif"
                          disabled={saving}
                          className="min-h-11 w-full rounded-lg border border-zinc-300 bg-white px-3 py-2 text-sm dark:border-zinc-600 dark:bg-zinc-950"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;
                            void uploadImage(file, uploadKey).then((url) => {
                              if (url) updateCategoryImage(categoryId, url);
                            });
                            e.currentTarget.value = '';
                          }}
                        />
                        {uploadingKey === uploadKey && (
                          <p className="text-xs text-zinc-500">Yükleniyor…</p>
                        )}
                        {currentUrl && (
                          <button
                            type="button"
                            disabled={saving}
                            onClick={() => removeCategoryImage(categoryId)}
                            className="text-left text-xs font-medium text-red-600 hover:text-red-500"
                          >
                            Görseli kaldır
                          </button>
                        )}
                      </div>
                    </div>
                    {currentUrl && (
                      <div className="mt-3 overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-700">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={currentUrl} alt={name} className="aspect-[4/3] w-full max-w-xs object-cover" />
                      </div>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
