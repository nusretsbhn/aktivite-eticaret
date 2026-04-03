'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';

import {
  HOME_PAGE_SECTION_IDS,
  homePageSectionLabel,
  type HomePageSectionId,
} from '@/lib/home-page-sections';
import type { AdminSettings } from '@/types/admin-settings';

function move<T>(arr: T[], from: number, to: number): T[] {
  if (from === to || from < 0 || to < 0 || from >= arr.length || to >= arr.length) return arr;
  const next = arr.slice();
  const [item] = next.splice(from, 1);
  if (item === undefined) return arr;
  next.splice(to, 0, item);
  return next;
}

export function PageLayoutClient() {
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [ok, setOk] = useState<string | null>(null);

  const order = (settings?.siteManagement?.homePageSectionOrder ?? [...HOME_PAGE_SECTION_IDS]) as HomePageSectionId[];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await fetch('/api/admin/settings', { credentials: 'include', cache: 'no-store' });
    if (!res.ok) {
      setError('Ayarlar yüklenemedi');
      setLoading(false);
      return;
    }
    const data = (await res.json()) as { settings: AdminSettings };
    setSettings(data.settings);
    setLoading(false);
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  async function save(nextOrder: HomePageSectionId[]) {
    if (!settings) return;
    const sm = settings.siteManagement;
    if (!sm) {
      setError('Site ayarları bulunamadı.');
      return;
    }
    setSaving(true);
    setError(null);
    setOk(null);
    try {
      const next: AdminSettings = {
        ...settings,
        siteManagement: {
          ...sm,
          homePageSectionOrder: nextOrder,
        },
      };
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
      setOk('Sıra kaydedildi');
      setTimeout(() => setOk(null), 2500);
    } finally {
      setSaving(false);
    }
  }

  function shift(index: number, dir: -1 | 1) {
    const to = index + dir;
    if (to < 0 || to >= order.length) return;
    void save(move(order, index, to));
  }

  function resetDefault() {
    void save([...HOME_PAGE_SECTION_IDS]);
  }

  if (loading || !settings) {
    return <p className="text-sm text-zinc-500 dark:text-zinc-400">Yükleniyor…</p>;
  }

  return (
    <div className="space-y-6">
      <div>
        <Link
          href="/admin/dashboard"
          className="text-sm text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-200"
        >
          ← Panele dön
        </Link>
        <h1 className="mt-2 text-2xl font-semibold text-zinc-900 dark:text-zinc-50">Sayfa düzeni</h1>
        <p className="mt-1 text-sm text-zinc-600 dark:text-zinc-400">
          Ana sayfada <strong>hero</strong> ve <strong>footer</strong> sabittir. Aşağıdaki blokların sırasını değiştirdiğinizde
          yalnızca orta bölüm yeniden sıralanır. Kapalı ürün hatları (aktivite / villa / tekne) için ilgili bloklar sitede
          zaten görünmez.
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

      <div className="rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200">Blok sırası</p>
          <button
            type="button"
            disabled={saving}
            onClick={() => void resetDefault()}
            className="rounded-lg border border-zinc-300 px-3 py-2 text-sm dark:border-zinc-600"
          >
            Varsayılana sıfırla
          </button>
        </div>
        <ul className="mt-4 divide-y divide-zinc-100 dark:divide-zinc-800">
          {order.map((id, index) => (
            <li
              key={id}
              className="flex flex-wrap items-center justify-between gap-2 py-3 first:pt-0 last:pb-0"
            >
              <div>
                <p className="text-sm font-medium text-zinc-900 dark:text-zinc-50">{homePageSectionLabel(id)}</p>
                <p className="font-mono text-xs text-zinc-500">{id}</p>
              </div>
              <div className="flex gap-1">
                <button
                  type="button"
                  disabled={saving || index === 0}
                  onClick={() => shift(index, -1)}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
                  aria-label="Yukarı"
                >
                  ↑
                </button>
                <button
                  type="button"
                  disabled={saving || index === order.length - 1}
                  onClick={() => shift(index, 1)}
                  className="rounded-lg border border-zinc-300 px-2 py-1.5 text-sm disabled:opacity-40 dark:border-zinc-600"
                  aria-label="Aşağı"
                >
                  ↓
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
